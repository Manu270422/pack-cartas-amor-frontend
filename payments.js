/*
  Mi archivo de pagos del frontend v2.0
  Novedad: pido el email del cliente antes de pagar
  para poder enviarle el acceso por correo automáticamente.
*/

const MI_BACKEND_URL = (() => {
  const esLocal = ['localhost', '127.0.0.1', ''].includes(window.location.hostname);
  if (esLocal) return 'http://localhost:3000';
  return 'https://pack-cartas-amor.onrender.com';
})();

// ── Función central ──
async function iniciarPago(pasarela) {
  // Antes de hacer nada, pido el email del cliente
  const datosCliente = await pedirEmailCliente();
  if (!datosCliente) return; // El cliente cerró el modal de email

  bloquearBotones(true, pasarela);

  try {
    switch (pasarela) {
      case 'mercadopago': await pagarConMercadoPago(datosCliente); break;
      case 'wompi':       await pagarConWompi(datosCliente);       break;
      case 'bold':        await pagarConBold(datosCliente);        break;
      default: throw new Error('Pasarela desconocida: ' + pasarela);
    }
  } catch (error) {
    console.error('Mi error al iniciar pago:', error);
    mostrarToast('⚠️ Algo salió mal. Intenta de nuevo.', 'error');
    bloquearBotones(false);
  }
}
window.iniciarPago = iniciarPago;


// ── Pido el email antes del pago ──
// Muestro un mini-formulario dentro del modal actual
function pedirEmailCliente() {
  return new Promise((resolve) => {

    // Guardo el contenido original del modal para poder restaurarlo
    const contenedor   = document.getElementById('pasarelas-container');
    const modalTitulo  = document.getElementById('modal-title');
    const htmlOriginal = contenedor.innerHTML;
    const tituloOrig   = modalTitulo.textContent;

    // Cambio el contenido del modal por el formulario de email
    modalTitulo.textContent = '¿A dónde enviamos tu acceso?';
    contenedor.innerHTML = `
      <div style="margin-bottom:1rem;">
        <p style="font-size:0.85rem;color:var(--t-secondary);line-height:1.6;margin-bottom:1.25rem;">
          Después del pago te enviamos un email con tu link de acceso permanente.
          Así puedes volver cuando quieras desde cualquier dispositivo. 🔐
        </p>

        <div style="margin-bottom:0.75rem;">
          <label style="display:block;font-size:0.72rem;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:var(--t-secondary);margin-bottom:0.4rem;">
            Tu nombre (opcional)
          </label>
          <input
            type="text"
            id="input-nombre-pago"
            placeholder="¿Cómo te llamamos?"
            maxlength="50"
            style="width:100%;background:var(--c-surface);border:1.5px solid var(--c-border);border-radius:var(--r-md);padding:0.7rem 0.9rem;color:var(--t-primary);font-family:var(--f-body);font-size:0.9rem;outline:none;transition:border-color 0.2s ease;"
            onfocus="this.style.borderColor='var(--c-gold)'"
            onblur="this.style.borderColor='var(--c-border)'"
          />
        </div>

        <div style="margin-bottom:1.25rem;">
          <label style="display:block;font-size:0.72rem;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:var(--t-secondary);margin-bottom:0.4rem;">
            Tu email <span style="color:var(--c-gold);">*</span>
          </label>
          <input
            type="email"
            id="input-email-pago"
            placeholder="tu@correo.com"
            maxlength="100"
            style="width:100%;background:var(--c-surface);border:1.5px solid var(--c-border);border-radius:var(--r-md);padding:0.7rem 0.9rem;color:var(--t-primary);font-family:var(--f-body);font-size:0.9rem;outline:none;transition:border-color 0.2s ease;"
            onfocus="this.style.borderColor='var(--c-gold)'"
            onblur="this.style.borderColor='var(--c-border)'"
          />
        </div>

        <button
          id="btn-continuar-pago"
          style="width:100%;background:var(--c-gold);color:var(--t-on-gold);border:none;border-radius:var(--r-full);padding:0.9rem;font-family:var(--f-body);font-size:0.95rem;font-weight:700;cursor:pointer;transition:all 0.2s ease;"
          onmouseover="this.style.background='var(--c-gold-light)'"
          onmouseout="this.style.background='var(--c-gold)'"
        >
          Continuar al pago →
        </button>

        <button
          id="btn-volver-pasarelas"
          style="width:100%;background:transparent;border:none;color:var(--t-muted);font-family:var(--f-body);font-size:0.82rem;cursor:pointer;margin-top:0.75rem;padding:0.4rem;"
        >
          ← Volver
        </button>
      </div>
    `;

    // Foco automático en el campo de nombre
    setTimeout(() => {
      document.getElementById('input-nombre-pago')?.focus();
    }, 100);

    // Botón continuar
    document.getElementById('btn-continuar-pago').addEventListener('click', () => {
      const email  = document.getElementById('input-email-pago').value.trim();
      const nombre = document.getElementById('input-nombre-pago').value.trim();

      if (!email || !email.includes('@') || !email.includes('.')) {
        document.getElementById('input-email-pago').style.borderColor = '#e55';
        document.getElementById('input-email-pago').focus();
        mostrarToast('📧 Necesito un email válido para enviarte el acceso', 'error');
        return;
      }

      // Restauro el modal y resuelvo con los datos
      modalTitulo.textContent  = tituloOrig;
      contenedor.innerHTML     = htmlOriginal;
      resolve({ email, nombre });
    });

    // Botón volver — cancela y restaura el modal
    document.getElementById('btn-volver-pasarelas').addEventListener('click', () => {
      modalTitulo.textContent = tituloOrig;
      contenedor.innerHTML    = htmlOriginal;
      resolve(null); // null = el cliente canceló
    });

    // Enter en el campo de email activa el continuar
    document.getElementById('input-email-pago')?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') document.getElementById('btn-continuar-pago').click();
    });
  });
}


// ── Mercado Pago ──
async function pagarConMercadoPago({ email, nombre }) {
  mostrarToast('⏳ Conectando con Mercado Pago...', 'info');

  const respuesta = await fetch(`${MI_BACKEND_URL}/api/crear-preferencia`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ email, nombre }),
  });

  if (!respuesta.ok) {
    const err = await respuesta.json().catch(() => ({}));
    throw new Error(err.mensaje || `Error ${respuesta.status}`);
  }

  const datos = await respuesta.json();
  if (!datos.ok) throw new Error(datos.mensaje);

  // Guardo el email en sessionStorage para recuperar el token en success.html
  // MP redirige fuera del sitio, así que sessionStorage sobrevive al regreso
  sessionStorage.setItem('pago_email', email);
  sessionStorage.setItem('pago_nombre', nombre || '');

  window.location.href = datos.init_point;
}


// ── Wompi ──
async function pagarConWompi({ email, nombre }) {
  mostrarToast('⏳ Conectando con Wompi...', 'info');

  const respuesta = await fetch(`${MI_BACKEND_URL}/api/wompi-firma`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ email, nombre }),
  });

  if (!respuesta.ok) {
    const err = await respuesta.json().catch(() => ({}));
    throw new Error(err.mensaje || `Error ${respuesta.status}`);
  }

  const datos = await respuesta.json();
  if (!datos.ok) throw new Error(datos.mensaje);

  const formulario  = document.createElement('form');
  formulario.method = 'GET';
  formulario.action = 'https://checkout.wompi.co/p/';

  // Wompi permite pasar el email del cliente para pre-llenarlo en el checkout
  const campos = {
    'public-key':          datos.llave_publica,
    'currency':            datos.moneda,
    'amount-in-cents':     String(datos.monto_centavos),
    'reference':           datos.referencia,
    'signature:integrity': datos.firma,
    'redirect-url':        datos.redirect_url,
    'customer-data:email': email,   // Pre-lleno el email en Wompi
    'customer-data:full-name': nombre,
  };

  Object.entries(campos).forEach(([n, v]) => {
    const input = document.createElement('input');
    input.type = 'hidden'; input.name = n; input.value = v;
    formulario.appendChild(input);
  });

  // Guardo el email antes de salir del sitio
  sessionStorage.setItem('pago_email', email);
  sessionStorage.setItem('pago_nombre', nombre || '');

  document.body.appendChild(formulario);
  formulario.submit();
}


// ── Bold — Integración personalizada con BoldCheckout API ──
// Según doc oficial: developers.bold.co/pagos-en-linea/boton-de-pagos/integracion-manual/integracion-personalizada
async function pagarConBold({ email, nombre }) {
  mostrarToast('⏳ Conectando con Bold...', 'info');

  // Paso 1 — Pido la firma al backend
  const respuesta = await fetch(`${MI_BACKEND_URL}/api/bold-firma`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ email, nombre }),
  });

  if (!respuesta.ok) {
    const err = await respuesta.json().catch(() => ({}));
    throw new Error(err.mensaje || `Error ${respuesta.status}`);
  }

  const datos = await respuesta.json();
  if (!datos.ok) throw new Error(datos.mensaje);

  // Paso 2 — Cargo el script de Bold con su método oficial y espero el evento
  await new Promise((resolve, reject) => {
    if (window.BoldCheckout) return resolve();

    const ya = document.querySelector('script[src="https://checkout.bold.co/library/boldPaymentButton.js"]');
    if (ya) {
      window.addEventListener('boldCheckoutLoaded',     resolve, { once: true });
      window.addEventListener('boldCheckoutLoadFailed', () => reject(new Error('Error cargando Bold')), { once: true });
      return;
    }

    const js  = document.createElement('script');
    js.onload = () => window.dispatchEvent(new Event('boldCheckoutLoaded'));
    js.onerror = () => window.dispatchEvent(new Event('boldCheckoutLoadFailed'));
    js.src    = 'https://checkout.bold.co/library/boldPaymentButton.js';
    document.head.appendChild(js);

    window.addEventListener('boldCheckoutLoaded',     resolve, { once: true });
    window.addEventListener('boldCheckoutLoadFailed', () => reject(new Error('Error cargando Bold')), { once: true });
  });

  // Guardo el email antes de que Bold redirija
  sessionStorage.setItem('pago_email', email);
  sessionStorage.setItem('pago_nombre', nombre || '');

  // Paso 3 — Creo instancia BoldCheckout y abro el modal
  // Método oficial según documentación de integración personalizada de Bold
  const checkout = new window.BoldCheckout({
    orderId:            datos.orderId,
    currency:           datos.moneda,
    amount:             String(datos.monto),
    apiKey:             datos.identity_key,
    integritySignature: datos.firma,
    redirectionUrl:     datos.redirect_url,
    description:        'Pack de Cartas de Amor Premium — El Mundo de Manu',
  });

  checkout.open();
}


// ── Utilidades ──
function esperar(ms) { return new Promise(r => setTimeout(r, ms)); }

function cargarScript(src) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) return resolve();
    const s = document.createElement('script');
    s.src = src; s.onload = resolve;
    s.onerror = () => reject(new Error(`No pude cargar: ${src}`));
    document.head.appendChild(s);
  });
}

function bloquearBotones(bloquear, pasarela) {
  const botones    = document.querySelectorAll('.pasarela-btn');
  const mapaIds    = { mercadopago:'btn-mp', wompi:'btn-wompi', bold:'btn-bold' };
  const mapaLabels = { mercadopago:'Mercado Pago', wompi:'Wompi', bold:'Bold' };

  botones.forEach(b => {
    b.disabled = bloquear;
    b.style.opacity = bloquear ? '0.45' : '';
    b.style.cursor  = bloquear ? 'not-allowed' : '';
  });

  if (bloquear && pasarela) {
    const btn = document.getElementById(mapaIds[pasarela]);
    if (btn) {
      btn._orig = btn.innerHTML;
      btn.style.opacity = '1';
      btn.innerHTML = `
        <div class="pasarela-logo" style="background:var(--c-gold);color:var(--t-on-gold);">
          <div class="spinner"></div>
        </div>
        <div class="pasarela-info">
          <strong>Conectando con ${mapaLabels[pasarela]}...</strong>
          <span>Por favor espera</span>
        </div>`;
    }
  }

  if (!bloquear) {
    botones.forEach(b => { if (b._orig) { b.innerHTML = b._orig; delete b._orig; } });
  }
}

function mostrarToast(msg, tipo) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.className   = `toast show ${tipo||''}`;
  clearTimeout(t._t);
  t._t = setTimeout(() => { t.className = 'toast'; }, 4500);
}
window.mostrarNotificacion = mostrarToast;