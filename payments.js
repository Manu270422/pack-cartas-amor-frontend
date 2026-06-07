/*
  Mi archivo de pagos del frontend.
  Integra: Mercado Pago + Wompi + Bold
  Ninguna clave secreta vive aquí — todo lo sensible está en el backend.
*/

// ══════════════════════════════════════════════════════════════
// MI URL DEL BACKEND
// ══════════════════════════════════════════════════════════════
const MI_BACKEND_URL = (() => {
  const esLocal = ['localhost', '127.0.0.1', ''].includes(window.location.hostname);
  if (esLocal) return 'http://localhost:3000';
  return 'https://pack-cartas-amor.onrender.com'; // ← Mi URL de Render
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
      case 'bold':        await pagarConBold();        break;
      default: throw new Error('Pasarela desconocida: ' + pasarela);
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
    throw new Error(err.mensaje || `Error ${respuesta.status}`);
  }

  const datos = await respuesta.json();
  if (!datos.ok) throw new Error(datos.mensaje);

  window.location.href = datos.init_point;
}


// ══════════════════════════════════════════════════════════════
// WOMPI — Checkout con firma de integridad
// ══════════════════════════════════════════════════════════════
async function pagarConWompi() {
  mostrarToast('⏳ Conectando con Wompi...', 'info');

  const respuesta = await fetch(`${MI_BACKEND_URL}/api/wompi-firma`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({}),
  });

  if (!respuesta.ok) {
    const err = await respuesta.json().catch(() => ({}));
    throw new Error(err.mensaje || `Error ${respuesta.status}`);
  }

  const datos = await respuesta.json();
  if (!datos.ok) throw new Error(datos.mensaje);

  // Construyo y envío el formulario de Wompi
  const formulario  = document.createElement('form');
  formulario.method = 'GET';
  formulario.action = 'https://checkout.wompi.co/p/';

  const campos = {
    'public-key':          datos.llave_publica,
    'currency':            datos.moneda,
    'amount-in-cents':     String(datos.monto_centavos),
    'reference':           datos.referencia,
    'signature:integrity': datos.firma,
    'redirect-url':        datos.redirect_url,
  };

  Object.entries(campos).forEach(([nombre, valor]) => {
    const input = document.createElement('input');
    input.type  = 'hidden';
    input.name  = nombre;
    input.value = valor;
    formulario.appendChild(input);
  });

  console.log('🔗 Enviando a Wompi | Ref:', datos.referencia);
  document.body.appendChild(formulario);
  formulario.submit();
}


// ══════════════════════════════════════════════════════════════
// BOLD — Botón de pago con firma de integridad
//
// Flujo:
//   1. Pido la firma al backend (tiene mi llave secreta)
//   2. Cargo el script oficial de Bold dinámicamente
//   3. Creo el botón de Bold con los datos firmados
//   4. Simulo clic en el botón — Bold abre su modal de pago
//   5. Tras el pago, Bold redirige a mi success.html
//
// Documentación: https://docs.bold.co/docs/cobro-en-linea-boton-de-pago
// ══════════════════════════════════════════════════════════════
async function pagarConBold() {
  mostrarToast('⏳ Conectando con Bold...', 'info');

  // Paso 1 — Pido la firma al backend
  const respuesta = await fetch(`${MI_BACKEND_URL}/api/bold-firma`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({}),
  });

  if (!respuesta.ok) {
    const err = await respuesta.json().catch(() => ({}));
    throw new Error(err.mensaje || `Error ${respuesta.status}`);
  }

  const datos = await respuesta.json();
  if (!datos.ok) throw new Error(datos.mensaje);

  // Paso 2 — Cargo el script oficial de Bold si no está ya en la página
  await cargarScript('https://checkout.bold.co/library/boldPaymentButton.js');

  // Paso 3 — Elimino cualquier botón Bold anterior para evitar duplicados
  const btnAnterior = document.getElementById('bold-button-container');
  if (btnAnterior) btnAnterior.remove();

  // Paso 4 — Creo el contenedor del botón Bold con todos los atributos requeridos
  // Bold lee estos atributos del DOM para inicializar el botón de pago
  const contenedor = document.createElement('div');
  contenedor.id    = 'bold-button-container';

  // Oculto el contenedor — Bold lo necesita en el DOM pero yo controlo el flujo
  contenedor.style.cssText = 'position:absolute;left:-9999px;top:-9999px;';

  // Mi script de Bold inyecta el botón dentro de este div con estos atributos
  const boton = document.createElement('script');
  boton.setAttribute('data-bold-button',       '');
  boton.setAttribute('data-order-id',          datos.orderId);
  boton.setAttribute('data-currency',          datos.moneda);
  boton.setAttribute('data-amount',            String(datos.monto));
  boton.setAttribute('data-api-key',           datos.identity_key);
  boton.setAttribute('data-integrity-hash',    datos.firma);
  boton.setAttribute('data-redirect-url',      datos.redirect_url);
  boton.setAttribute('data-button-label',      'Pagar con Bold');

  contenedor.appendChild(boton);
  document.body.appendChild(contenedor);

  console.log('🔗 Bold botón creado | Order:', datos.orderId);

  // Paso 5 — Espero a que Bold renderice el botón y lo activo
  // Bold necesita un momento para procesar los atributos e inyectar el botón
  await esperar(800);

  // Busco el botón que Bold inyectó y simulo el clic para abrir su modal
  const botonBold = contenedor.querySelector('button') ||
                    contenedor.querySelector('[data-bold]') ||
                    contenedor.querySelector('a');

  if (botonBold) {
    botonBold.click();
  } else {
    // Si Bold no inyectó el botón (error de inicialización),
    // redirijo directamente a su checkout como respaldo
    console.warn('⚠️ Bold no inyectó el botón, redirigiendo al checkout directo');
    const params = new URLSearchParams({
      apiKey:        datos.identity_key,
      orderId:       datos.orderId,
      amount:        datos.monto,
      currency:      datos.moneda,
      integrityHash: datos.firma,
      redirectUrl:   datos.redirect_url,
    });
    window.location.href = `https://checkout.bold.co/payment/bold-button?${params}`;
  }
}

// Mi función de espera — la uso para darle tiempo al script de Bold de cargar
function esperar(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Cargo un script externo dinámicamente solo si no existe ya en la página
function cargarScript(src) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      return resolve(); // Ya está cargado
    }
    const script  = document.createElement('script');
    script.src    = src;
    script.onload = resolve;
    script.onerror = () => reject(new Error(`No pude cargar: ${src}`));
    document.head.appendChild(script);
  });
}


// ══════════════════════════════════════════════════════════════
// FEEDBACK VISUAL — Spinner y estados de los botones
// ══════════════════════════════════════════════════════════════
function bloquearBotones(bloquear, pasarela) {
  const botones    = document.querySelectorAll('.pasarela-btn');
  const mapaIds    = { mercadopago: 'btn-mp', wompi: 'btn-wompi', bold: 'btn-bold' };
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
      btnActivo.style.opacity = '1';
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

function mostrarToast(mensaje, tipo) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = mensaje;
  toast.className   = `toast show ${tipo || ''}`;
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => { toast.className = 'toast'; }, 4500);
}
window.mostrarNotificacion = mostrarToast;