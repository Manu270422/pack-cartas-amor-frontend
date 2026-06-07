/*
  Mi archivo de pagos del frontend.
  Maneja Mercado Pago y Wompi.
  Ninguna clave secreta vive aquí — todo lo sensible está en el backend.
*/

// ══════════════════════════════════════════════════════════════
// MI URL DEL BACKEND — la única línea que cambio según el entorno
// ══════════════════════════════════════════════════════════════
const MI_BACKEND_URL = (() => {
  const esLocal = ['localhost', '127.0.0.1', ''].includes(window.location.hostname);
  if (esLocal) return 'http://localhost:3000';
  // ⚠️ Reemplaza con tu URL real de Render
  return 'https://pack-cartas-amor.onrender.com';
})();


// ══════════════════════════════════════════════════════════════
// FUNCIÓN CENTRAL — la llaman los botones del modal
// ══════════════════════════════════════════════════════════════
async function iniciarPago(pasarela) {
  bloquearBotones(true, pasarela);

  try {
    switch (pasarela) {
      case 'mercadopago': await pagarConMercadoPago(); break;
      case 'wompi':       await pagarConWompi();       break;
      case 'bold':
        mostrarToast('🔜 Bold estará disponible muy pronto.', 'info');
        bloquearBotones(false);
        break;
      default:
        throw new Error('Pasarela desconocida: ' + pasarela);
    }
  } catch (error) {
    console.error('Mi error al iniciar pago:', error);
    mostrarToast('⚠️ Algo salió mal. Intenta de nuevo.', 'error');
    bloquearBotones(false);
  }
}
window.iniciarPago = iniciarPago;


// ══════════════════════════════════════════════════════════════
// MERCADO PAGO — Checkout Pro
// Llamo al backend → obtengo init_point → redirijo al usuario
// ══════════════════════════════════════════════════════════════
async function pagarConMercadoPago() {
  mostrarToast('⏳ Conectando con Mercado Pago...', 'info');

  const respuesta = await fetch(`${MI_BACKEND_URL}/api/crear-preferencia`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({}),
  });

  if (!respuesta.ok) {
    const err = await respuesta.json().catch(() => ({}));
    throw new Error(err.mensaje || `Error del servidor: ${respuesta.status}`);
  }

  const datos = await respuesta.json();
  if (!datos.ok) throw new Error(datos.mensaje || 'El backend no pudo crear la preferencia.');

  // Redirijo al Checkout Pro — MP se encarga del resto
  window.location.href = datos.init_point;
}


// ══════════════════════════════════════════════════════════════
// WOMPI — Widget de pago embebido
//
// Flujo:
//   1. Pido la firma al backend (tiene mi llave de integridad secreta)
//   2. Cargo el script del Widget de Wompi dinámicamente
//   3. Creo un <form> con los datos firmados y lo envío
//   4. Wompi abre su pantalla de pago
//   5. Wompi redirige al usuario a mi success.html cuando termina
// ══════════════════════════════════════════════════════════════
async function pagarConWompi() {
  mostrarToast('⏳ Conectando con Wompi...', 'info');

  // ── Paso 1: Pido la firma al backend ──
  const respuesta = await fetch(`${MI_BACKEND_URL}/api/wompi-firma`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({}),
  });

  if (!respuesta.ok) {
    const err = await respuesta.json().catch(() => ({}));
    throw new Error(err.mensaje || `Error del servidor: ${respuesta.status}`);
  }

  const datos = await respuesta.json();
  if (!datos.ok) throw new Error(datos.mensaje || 'No se pudo iniciar el pago con Wompi.');

  // ── Paso 2: Construyo y envío el formulario de Wompi ──
  // Wompi usa un formulario GET que redirige a su checkout con los parámetros en la URL
  // Es la integración oficial: https://docs.wompi.co/docs/colombia/widget-checkout-web
  const formulario = document.createElement('form');
  formulario.method = 'GET';
  formulario.action = 'https://checkout.wompi.co/p/';

  // Mis campos requeridos por Wompi — los valores vienen del backend
  const campos = {
    'public-key':          datos.llave_publica,
    'currency':            datos.moneda,
    'amount-in-cents':     String(datos.monto_centavos),
    'reference':           datos.referencia,
    'signature:integrity': datos.firma,
    'redirect-url':        datos.redirect_url,
  };

  // Agrego cada campo como input oculto al formulario
  Object.entries(campos).forEach(([nombre, valor]) => {
    const input   = document.createElement('input');
    input.type    = 'hidden';
    input.name    = nombre;
    input.value   = valor;
    formulario.appendChild(input);
  });

  // Agrego el formulario al DOM, lo envío y lo limpio
  // (el navegador redirige a Wompi automáticamente)
  document.body.appendChild(formulario);
  console.log('🔗 Enviando a Wompi | Ref:', datos.referencia);
  formulario.submit();

  // No elimino el formulario porque el navegador ya está redirigiendo
}


// ══════════════════════════════════════════════════════════════
// FEEDBACK VISUAL
// ══════════════════════════════════════════════════════════════

// Bloqueo / desbloqueo los botones del modal durante el proceso
function bloquearBotones(bloquear, pasarela) {
  const botones = document.querySelectorAll('.pasarela-btn');
  const mapaIds = { mercadopago: 'btn-mp', wompi: 'btn-wompi', bold: 'btn-bold' };
  const mapaLabels = { mercadopago: 'Mercado Pago', wompi: 'Wompi', bold: 'Bold' };

  botones.forEach(btn => {
    btn.disabled      = bloquear;
    btn.style.opacity = bloquear ? '0.45' : '';
    btn.style.cursor  = bloquear ? 'not-allowed' : '';
  });

  if (bloquear && pasarela) {
    const btnActivo = document.getElementById(mapaIds[pasarela]);
    if (btnActivo) {
      btnActivo._htmlOriginal = btnActivo.innerHTML;
      btnActivo.style.opacity = '1'; // El activo se ve completo, los demás atenuados
      btnActivo.innerHTML = `
        <div class="pasarela-logo" style="background:var(--c-gold);color:var(--t-on-gold);">
          <div class="spinner"></div>
        </div>
        <div class="pasarela-info">
          <strong>Conectando con ${mapaLabels[pasarela]}...</strong>
          <span>Por favor espera un momento</span>
        </div>`;
    }
  }

  if (!bloquear) {
    botones.forEach(btn => {
      if (btn._htmlOriginal) {
        btn.innerHTML = btn._htmlOriginal;
        delete btn._htmlOriginal;
      }
    });
  }
}

// Mi sistema de toasts — lo usa también main.js
function mostrarToast(mensaje, tipo) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = mensaje;
  toast.className   = `toast show ${tipo || ''}`;
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => { toast.className = 'toast'; }, 4500);
}
window.mostrarNotificacion = mostrarToast;