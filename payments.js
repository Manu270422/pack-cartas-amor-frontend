/*
  Mi archivo de pagos del frontend.
  Su único trabajo: cuando el usuario elige una pasarela,
  llamar al backend y redirigirlo al checkout.

  IMPORTANTE: Aquí NO hay ninguna clave secreta.
  Todo lo que sea sensible vive en el backend (server.js).
*/

// ══════════════════════════════════════════════════════════════
// MI URL DEL BACKEND
// Cambio este valor según el entorno donde esté corriendo
// ══════════════════════════════════════════════════════════════
const MI_BACKEND_URL = (() => {
  // Si estoy en producción (Netlify), uso la URL de Render
  // Si estoy en desarrollo local, uso localhost
  const esLocal = window.location.hostname === 'localhost'
               || window.location.hostname === '127.0.0.1'
               || window.location.hostname === '';

  if (esLocal) {
    return 'http://localhost:3000'; // Mi servidor local de desarrollo
  }

  return 'https://pack-cartas-amor.onrender.com';
})();


// ══════════════════════════════════════════════════════════════
// MI FUNCIÓN CENTRAL — la llaman los botones del modal
// ══════════════════════════════════════════════════════════════

/**
 * Despacho el flujo de pago según la pasarela que eligió el usuario.
 * @param {string} pasarela - 'mercadopago' | 'wompi' | 'bold'
 */
async function iniciarPago(pasarela) {
  // Bloqueo los botones del modal para evitar doble clic
  bloquearBotonesModal(true, pasarela);

  try {
    switch (pasarela) {
      case 'mercadopago':
        await pagarConMercadoPago();
        break;

      // Wompi y Bold los agrego en la siguiente fase
      case 'wompi':
      case 'bold':
        mostrarNotificacion('🔜 Esta pasarela estará disponible muy pronto.', 'info');
        bloquearBotonesModal(false);
        break;

      default:
        throw new Error('Pasarela no reconocida: ' + pasarela);
    }
  } catch (error) {
    console.error('Mi error al iniciar pago:', error);
    mostrarNotificacion('⚠️ Algo salió mal. Intenta de nuevo.', 'error');
    bloquearBotonesModal(false);
  }
}

// Expongo la función para que los onclick del HTML la encuentren
window.iniciarPago = iniciarPago;


// ══════════════════════════════════════════════════════════════
// MI INTEGRACIÓN CON MERCADO PAGO
// ══════════════════════════════════════════════════════════════

/**
 * Llamo a mi backend para crear la preferencia de pago,
 * luego redirijo al usuario al Checkout Pro de Mercado Pago.
 *
 * Flujo:
 *   Frontend → POST /api/crear-preferencia → Backend
 *   Backend → Mercado Pago API → crea preferencia
 *   Backend → devuelve { init_point, sandbox_init_point }
 *   Frontend → redirige al usuario al init_point
 */
async function pagarConMercadoPago() {
  // Le aviso al usuario que estamos conectando
  mostrarNotificacion('⏳ Conectando con Mercado Pago...', 'info');

  // Llamo a mi backend — él tiene el Access Token secreto
  const respuesta = await fetch(`${MI_BACKEND_URL}/api/crear-preferencia`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({
      // Puedo enviar datos adicionales si los necesito en el backend
      // origen: 'landing-page'
    }),
  });

  // Si el servidor respondió con error HTTP (500, 503, etc.)
  if (!respuesta.ok) {
    const errorData = await respuesta.json().catch(() => ({}));
    throw new Error(errorData.mensaje || `Error del servidor: ${respuesta.status}`);
  }

  const datos = await respuesta.json();

  if (!datos.ok) {
    throw new Error(datos.mensaje || 'El backend no pudo crear la preferencia.');
  }

  // Determino si usar el link de pruebas o el de producción
  // Si el Access Token empieza con "TEST-" estamos en pruebas → uso sandbox_init_point
  // En producción → uso init_point
  // El backend me dice cuál usar a través de la URL que retorna
  const urlPago = datos.init_point; // El backend decide cuál retornar según el ambiente

  console.log('🔗 Redirigiendo a:', urlPago);

  // Redirijo al usuario al Checkout de Mercado Pago
  // En el checkout el usuario pone su tarjeta y paga
  // Después MP lo redirige a mi success.html o index.html?pago=error
  window.location.href = urlPago;
}


// ══════════════════════════════════════════════════════════════
// MIS FUNCIONES DE FEEDBACK VISUAL
// ══════════════════════════════════════════════════════════════

/**
 * Bloqueo / desbloqueo los botones del modal durante el proceso de pago.
 * @param {boolean} bloquear  - true para bloquear, false para restaurar
 * @param {string}  pasarela  - cuál botón mostrar en estado "cargando"
 */
function bloquearBotonesModal(bloquear, pasarela) {
  const botones = document.querySelectorAll('.pasarela-btn');

  botones.forEach(btn => {
    btn.disabled = bloquear;
    btn.style.opacity = bloquear ? '0.5' : '';
    btn.style.cursor  = bloquear ? 'not-allowed' : '';
  });

  // Si estoy bloqueando, muestro el spinner en el botón de la pasarela elegida
  if (bloquear && pasarela) {
    const mapIds = {
      mercadopago: 'btn-mp',
      wompi:       'btn-wompi',
      bold:        'btn-bold',
    };
    const btnActivo = document.getElementById(mapIds[pasarela]);
    if (btnActivo) {
      // Guardo el HTML original para poder restaurarlo
      btnActivo._htmlOriginal = btnActivo.innerHTML;
      const nombresPasarelas  = { mercadopago: 'Mercado Pago', wompi: 'Wompi', bold: 'Bold' };
      btnActivo.innerHTML = `
        <div class="pasarela-logo" style="background:#555;color:#fff;font-size:0.6rem;">...</div>
        <div class="pasarela-info">
          <strong>Conectando con ${nombresPasarelas[pasarela]}...</strong>
          <span>Por favor espera</span>
        </div>
      `;
    }
  }

  // Si estoy desbloqueando, restauro los botones a su estado original
  if (!bloquear) {
    botones.forEach(btn => {
      if (btn._htmlOriginal) {
        btn.innerHTML = btn._htmlOriginal;
        delete btn._htmlOriginal;
      }
    });
  }
}

/**
 * Muestro una notificación tipo toast en la parte inferior de la pantalla.
 * @param {string} mensaje - El texto que quiero mostrar
 * @param {string} tipo    - 'info' | 'success' | 'error'
 */
function mostrarNotificacion(mensaje, tipo) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = mensaje;
  toast.className   = `toast show ${tipo || ''}`;
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => { toast.className = 'toast'; }, 4500);
}

// Expongo para que main.js también pueda usarla
window.mostrarNotificacion = mostrarNotificacion;