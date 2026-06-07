/*
  Mi lógica de interfaz del frontend.
  Solo manejo UI: navbar, modal, scroll reveal, toasts.
  Todo lo de pagos está en payments.js.
*/

// ── Navbar: agrego clase .scrolled al bajar de 60px ──
(function () {
  const navbar = document.getElementById('navbar');
  if (!navbar) return;
  let ticking = false;
  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        navbar.classList.toggle('scrolled', window.scrollY > 60);
        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });
})();

// ── Modal de pago ──
function abrirModal() {
  const modal = document.getElementById('modal-pago');
  if (!modal) return;
  modal.classList.add('activo');
  document.body.style.overflow = 'hidden';
  setTimeout(() => {
    const primero = modal.querySelector('.pasarela-btn');
    if (primero) primero.focus();
  }, 350);
}
function cerrarModal() {
  const modal = document.getElementById('modal-pago');
  if (!modal) return;
  modal.classList.remove('activo');
  document.body.style.overflow = '';
}
window.abrirModal  = abrirModal;
window.cerrarModal = cerrarModal;

document.addEventListener('DOMContentLoaded', () => {
  // Cierre del modal al hacer clic en el fondo oscuro
  const modal = document.getElementById('modal-pago');
  if (modal) modal.addEventListener('click', e => { if (e.target === modal) cerrarModal(); });

  // Scroll reveal con Intersection Observer
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -20px 0px' });
  document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

  // Mensajes según parámetro de URL (cuando MP redirige de vuelta)
  const p = new URLSearchParams(window.location.search);
  if (p.get('pago') === 'error')     window.mostrarNotificacion?.('⚠️ El pago no se completó. Puedes intentarlo de nuevo.', 'error');
  if (p.get('pago') === 'pendiente') window.mostrarNotificacion?.('⏳ Tu pago está pendiente. Te avisaremos cuando se confirme.', 'info');
});

// Cierre con tecla Escape
document.addEventListener('keydown', e => { if (e.key === 'Escape') cerrarModal(); });