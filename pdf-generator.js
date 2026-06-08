/*
  Mi generador de PDF premium — Pack de Cartas de Amor Premium.
  Uso jsPDF para crear el PDF y html2canvas para renderizar
  las páginas con diseño HTML/CSS completo.

  Flujo:
    1. Construyo cada página como un div HTML invisible
    2. html2canvas captura cada div como imagen de alta resolución
    3. jsPDF ensambla todas las imágenes en un PDF de múltiples páginas
    4. Disparo la descarga automáticamente

  Formato: A4 vertical (210mm × 297mm) a 150dpi = 1240×1754px
*/

// ══════════════════════════════════════════════════════════════
// MIS DATOS DE LAS 6 CARTAS — el contenido real del producto
// ══════════════════════════════════════════════════════════════
const CARTAS_PDF = [
  {
    id:         'romantica',
    icono:      '💌',
    categoria:  'Carta Romántica',
    titulo:     '"Lo ordinario contigo es extraordinario"',
    acento:     '#C9A84C',
    cuerpo: `[Nombre],

Hay personas que pasan por tu vida dejando apenas una huella en la arena — y luego estás tú, que llevas tiempo construyendo algo diferente en mí. No sé exactamente cuándo pasó. Fue gradual, como la luz del amanecer que no ves llegar pero que de repente lo ilumina todo.

Me gusta observarte cuando no te das cuenta. La forma en que frunces el ceño cuando piensas profundo, cómo te ríes antes de terminar el chiste porque ya no aguantas, el ruido que haces al tomar el primer café de la mañana. Son detalles absurdamente pequeños que, viniendo de ti, me parecen los más interesantes del mundo.

No te escribo esto porque sea una fecha especial. Te escribo porque hoy me desperté pensando en ti antes de tener los ojos abiertos del todo, y me pareció que eso merecía ser dicho en voz alta.

Contigo, lo ordinario se vuelve extraordinario. Y eso, [Nombre], es exactamente el tipo de amor que siempre quise tener.`,
    firma: 'Tuyo/a, siempre.',
  },
  {
    id:         'intensa',
    icono:      '🔥',
    categoria:  'Carta Intensa',
    titulo:     '"Lo que no cabe en palabras"',
    acento:     '#C0572A',
    cuerpo: `[Nombre],

Hay cosas que no sé cómo decirte mirándote a los ojos — no porque me dé miedo, sino porque siento que las palabras se quedan cortas. Pero hoy lo intento.

Lo que siento por ti no es lo que me enseñaron que era el amor. No es tranquilo ni predecible. Es urgente. Es esa sensación de que el tiempo que no estoy contigo es tiempo que me falta, no tiempo que pasa. Es querer estar en la misma habitación que tú aunque los dos estemos en silencio absoluto, porque tu presencia es suficiente — es más que suficiente.

Me has movido cosas adentro que creía que ya no se movían. Me has hecho querer ser mejor — no para impresionarte, sino porque tú te mereces a alguien que da todo, y yo quiero ser esa persona.

Te deseo, [Nombre]. En todos los sentidos de esa palabra. Y lo que más me asusta y me emociona al mismo tiempo es que creo que apenas estamos empezando.`,
    firma: 'Con todo lo que soy,',
  },
  {
    id:         'nostalgica',
    icono:      '🌧️',
    categoria:  'Carta Nostálgica',
    titulo:     '"La distancia que no borra nada"',
    acento:     '#4A7FA5',
    cuerpo: `[Nombre],

Te escribo desde aquí, que últimamente se siente demasiado lejos de donde estás tú.

La distancia tiene una crueldad muy particular: no borra nada. No hace que los recuerdos se difuminen ni que el corazón se acostumbre. Al contrario — los detalles se vuelven más nítidos. Me acuerdo de tu voz con una precisión casi dolorosa. Del olor de tu ropa. De cómo se sentía estar en el mismo espacio que tú sin necesitar decir nada.

Hay momentos del día que siguen siendo tuyos aunque no estés: la hora de dormir, cuando el silencio se vuelve muy ruidoso. Las tardes cuando pasa algo gracioso y mi primer instinto sigue siendo contártelo a ti. Los domingos, que siempre supimos hacer bien juntos.

No te cuento esto para entristecerte. Te lo cuento porque quiero que sepas que la distancia no ha cambiado nada de lo importante. Sigues siendo la persona que viene primero a mi mente, y la última en la que pienso antes de cerrar los ojos.

Vuelve pronto. O déjame ir. Pero no me pidas que sienta menos — eso ya no puedo hacerlo.`,
    firma: 'Con todo el espacio entre nosotros, y nada de espacio en mi corazón.',
  },
  {
    id:         'reconciliacion',
    icono:      '🕊️',
    categoria:  'Carta de Reconciliación',
    titulo:     '"Quiero hacer las cosas bien"',
    acento:     '#2A7A6F',
    cuerpo: `[Nombre],

He pasado este tiempo pensando. No buscando excusas — eso ya lo hice y me di cuenta de que no me llevaba a ningún lado. Pensando de verdad, con honestidad, sobre lo que pasó y sobre lo que tú mereces de mi parte.

Me equivoqué. No de la manera vaga en que la gente pide perdón para cerrar el tema — me equivoqué en algo concreto: no te traté con el cuidado que merecías en ese momento. Y eso me pesa.

Lo que más me cuesta no es el orgullo. Lo que más me cuesta es saber que te hice sentir algo que nunca debí hacerte sentir. Y que probablemente mientras yo estaba en mi cabeza justificando mis acciones, tú estabas cargando algo que yo puse ahí.

No te pido que lo olvides de inmediato. No te pido que finjas que no pasó. Solo te pido una cosa: la oportunidad de demostrarte con hechos, no con palabras, que aprendo. Que lo que tenemos me importa lo suficiente como para hacer el trabajo de crecer.

Si me la das, no la voy a desperdiciar.`,
    firma: 'Lo siento de verdad.',
  },
  {
    id:         'aniversario',
    icono:      '🥂',
    categoria:  'Carta de Aniversario',
    titulo:     '"Todo lo que hemos construido"',
    acento:     '#8A5C2A',
    cuerpo: `[Nombre],

Si pudiera mostrarte lo que veo cuando pienso en nosotros, no te mostraría una sola imagen. Te mostraría una película entera — con sus escenas de risa hasta llorar, sus momentos de silencio incómodo que supimos atravesar, sus capítulos difíciles, y todo ese tiempo ordinario y perfecto en el que simplemente existimos juntos sin necesitar que fuera nada más que eso.

Hoy celebramos el tiempo que llevamos juntos. Y lo que más me sorprende no es cuánto tiempo ha pasado — es todo lo que hemos construido en él. Una forma de hablarnos que es solo nuestra. Bromas internas que no necesitan explicación. La confianza de saber que si algo se rompe, lo reparamos juntos.

Eso no se improvisa, [Nombre]. Eso se construye. Y tú has sido un constructor/a extraordinario/a.

Gracias por quedarte cuando era fácil irse. Gracias por elegirme no una vez, sino cada día. Y gracias por hacerme sentir que este camino, contigo al lado, vale absolutamente cada paso.`,
    firma: 'Por todo lo que viene,',
  },
  {
    id:         'cumpleanos',
    icono:      '🎂',
    categoria:  'Carta de Cumpleaños',
    titulo:     '"El día que llegaste al mundo"',
    acento:     '#7A3A8A',
    cuerpo: `[Nombre],

Hoy es tu día, y quiero empezarlo diciéndote algo que no siempre digo con suficiente claridad: qué afortunado/a soy de que existas.

No solo porque estés en mi vida — eso ya sería suficiente — sino porque eres el tipo de persona que hace que el mundo sea un lugar más interesante para todos los que te conocen. Tienes esa capacidad rara de entrar a una habitación y hacer que algo cambie, aunque no siempre te des cuenta.

En este cumpleaños no te voy a prometer el mundo. Te voy a prometer algo más real: seguir estando. Seguir siendo la persona que más te celebra, no solo hoy sino en todos los martes aburridos y en todos los momentos que no tienen fecha especial.

Espero que este año te traiga todo lo que mereces. Y tú mereces mucho, [Nombre] — más de lo que a veces te permites recibir.

Feliz cumpleaños. Hoy y todos los días, me alegra que hayas llegado a este mundo.`,
    firma: 'Con amor, siempre.',
  },
];

// ══════════════════════════════════════════════════════════════
// MI FUNCIÓN PRINCIPAL — Genero el PDF completo
// ══════════════════════════════════════════════════════════════

/**
 * Genero y descargo el PDF premium con las 6 cartas.
 * @param {string} nombreDestinatario - El nombre que el cliente personalizó (opcional)
 */
async function generarPDFPremium(nombreDestinatario = '') {
  // Verifico que las librerías estén cargadas
  if (typeof jspdf === 'undefined' && typeof window.jspdf === 'undefined') {
    throw new Error('jsPDF no está cargado. Verifica la inclusión del script.');
  }

  const { jsPDF } = window.jspdf;

  // Mi configuración del PDF: A4, orientación vertical
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit:        'mm',
    format:      'a4',
    compress:    true,
  });

  const ANCHO_A4  = 210; // mm
  const ALTO_A4   = 297; // mm
  const ESCALA    = 2;   // Factor de resolución (2x = alta calidad)

  // Creo mi contenedor temporal invisible para renderizar las páginas
  const contenedor = document.createElement('div');
  contenedor.style.cssText = `
    position: fixed;
    top: -9999px;
    left: -9999px;
    width: 794px;
    z-index: -1;
    pointer-events: none;
  `;
  document.body.appendChild(contenedor);

  try {
    // ── Página 1: Portada ──────────────────────────────────────
    contenedor.innerHTML = crearHTMLPortada(nombreDestinatario);
    await esperar(100); // Doy tiempo para que las fuentes carguen

    const canvasPortada = await html2canvas(contenedor.firstElementChild, {
      scale:           ESCALA,
      backgroundColor: '#0A0E14',
      useCORS:         true,
      logging:         false,
      width:           794,
      height:          1123,
    });

    pdf.addImage(
      canvasPortada.toDataURL('image/jpeg', 0.92),
      'JPEG', 0, 0, ANCHO_A4, ALTO_A4
    );

    // ── Páginas 2-7: Una carta por página ─────────────────────
    for (let i = 0; i < CARTAS_PDF.length; i++) {
      const carta = CARTAS_PDF[i];

      // Reemplazo [Nombre] con el nombre real si fue proporcionado
      const cuerpoPersonalizado = nombreDestinatario
        ? carta.cuerpo.replace(/\[Nombre\]/g, nombreDestinatario)
        : carta.cuerpo;

      contenedor.innerHTML = crearHTMLCarta(carta, cuerpoPersonalizado);
      await esperar(80);

      const canvasCarta = await html2canvas(contenedor.firstElementChild, {
        scale:           ESCALA,
        backgroundColor: '#FFFDF8',
        useCORS:         true,
        logging:         false,
        width:           794,
        height:          1123,
      });

      pdf.addPage();
      pdf.addImage(
        canvasCarta.toDataURL('image/jpeg', 0.92),
        'JPEG', 0, 0, ANCHO_A4, ALTO_A4
      );
    }

    // ── Última página: Contraportada ──────────────────────────
    contenedor.innerHTML = crearHTMLContraportada();
    await esperar(80);

    const canvasContra = await html2canvas(contenedor.firstElementChild, {
      scale:           ESCALA,
      backgroundColor: '#0A0E14',
      useCORS:         true,
      logging:         false,
      width:           794,
      height:          1123,
    });

    pdf.addPage();
    pdf.addImage(
      canvasContra.toDataURL('image/jpeg', 0.92),
      'JPEG', 0, 0, ANCHO_A4, ALTO_A4
    );

    // ── Metadatos del PDF ──────────────────────────────────────
    pdf.setProperties({
      title:    'Pack de Cartas de Amor Premium — El Mundo de Manu',
      author:   'El Mundo de Manu',
      subject:  '6 cartas de amor premium',
      keywords: 'cartas, amor, premium, El Mundo de Manu',
      creator:  'elmundomanu.com',
    });

    // ── Descargo el PDF ────────────────────────────────────────
    const nombreArchivo = nombreDestinatario
      ? `cartas-amor-para-${nombreDestinatario.toLowerCase().replace(/\s+/g,'-')}-elmundomanu.pdf`
      : 'pack-cartas-amor-premium-elmundomanu.pdf';

    pdf.save(nombreArchivo);

  } finally {
    // Siempre limpio el contenedor temporal, aunque haya error
    document.body.removeChild(contenedor);
  }
}


// ══════════════════════════════════════════════════════════════
// MIS PLANTILLAS HTML DE CADA PÁGINA
// ══════════════════════════════════════════════════════════════

/** Genero el HTML de la portada */
function crearHTMLPortada(nombre) {
  return `
<div style="
  width:794px; height:1123px;
  background: linear-gradient(160deg, #0A0E14 0%, #1A1500 50%, #0A0E14 100%);
  display:flex; flex-direction:column;
  align-items:center; justify-content:center;
  position:relative; overflow:hidden;
  font-family: Georgia, 'Times New Roman', serif;
">
  <!-- Círculo decorativo fondo -->
  <div style="
    position:absolute; top:-100px; right:-100px;
    width:500px; height:500px; border-radius:50%;
    background: radial-gradient(circle, rgba(201,168,76,0.12) 0%, transparent 70%);
  "></div>
  <div style="
    position:absolute; bottom:-80px; left:-80px;
    width:400px; height:400px; border-radius:50%;
    background: radial-gradient(circle, rgba(46,196,182,0.07) 0%, transparent 70%);
  "></div>

  <!-- Línea decorativa superior -->
  <div style="
    position:absolute; top:60px; left:60px; right:60px;
    height:1px;
    background: linear-gradient(90deg, transparent, #C9A84C, #C9A84C, transparent);
  "></div>

  <!-- Contenido central -->
  <div style="text-align:center; position:relative; z-index:1; padding:0 60px;">

    <!-- Marca -->
    <p style="
      color:rgba(201,168,76,0.7); font-size:11px;
      letter-spacing:0.3em; text-transform:uppercase;
      margin-bottom:40px; font-family: Arial, sans-serif; font-weight:600;
    ">El Mundo de Manu</p>

    <!-- Ornamento -->
    <p style="color:#C9A84C; font-size:28px; margin-bottom:24px; letter-spacing:0.2em;">✦ · ✦</p>

    <!-- Título principal -->
    <h1 style="
      color:#F5EDD8; font-size:52px; font-weight:400;
      line-height:1.1; margin-bottom:16px;
      font-style:italic; letter-spacing:-0.01em;
    ">Pack de Cartas<br/>de Amor</h1>

    <!-- Subtítulo dorado -->
    <h2 style="
      color:#C9A84C; font-size:22px; font-weight:400;
      letter-spacing:0.12em; text-transform:uppercase;
      margin-bottom:48px; font-family: Arial, sans-serif;
    ">Premium</h2>

    ${nombre ? `
    <!-- Dedicatoria personalizada -->
    <div style="
      border: 1px solid rgba(201,168,76,0.3);
      border-radius: 8px;
      padding: 16px 32px;
      margin-bottom: 40px;
      display: inline-block;
    ">
      <p style="color:rgba(245,237,216,0.5); font-size:11px; letter-spacing:0.15em; text-transform:uppercase; margin-bottom:6px; font-family:Arial,sans-serif;">Para</p>
      <p style="color:#F5EDD8; font-size:28px; font-style:italic; margin:0;">${nombre}</p>
    </div>
    ` : ''}

    <!-- Línea divisora -->
    <div style="
      width:60px; height:2px; margin:0 auto 32px;
      background: linear-gradient(90deg, transparent, #C9A84C, transparent);
    "></div>

    <!-- Descripción -->
    <p style="
      color:rgba(245,237,216,0.45); font-size:14px;
      line-height:1.8; max-width:400px; margin:0 auto;
      font-family: Arial, sans-serif;
    ">
      Seis cartas escritas profesionalmente<br/>
      para los momentos que más importan
    </p>

    <!-- Lista de cartas -->
    <div style="
      margin-top:40px;
      display:flex; flex-wrap:wrap; gap:10px; justify-content:center;
    ">
      ${['💌 Romántica','🔥 Intensa','🌧️ Nostálgica','🕊️ Reconciliación','🥂 Aniversario','🎂 Cumpleaños'].map(c => `
      <span style="
        background:rgba(201,168,76,0.08);
        border:1px solid rgba(201,168,76,0.2);
        border-radius:99px; padding:6px 14px;
        color:rgba(245,237,216,0.6); font-size:11px;
        font-family:Arial,sans-serif;
      ">${c}</span>
      `).join('')}
    </div>
  </div>

  <!-- Número de página -->
  <p style="
    position:absolute; bottom:40px;
    color:rgba(201,168,76,0.3); font-size:10px;
    letter-spacing:0.2em; font-family:Arial,sans-serif;
  ">elmundomanu.com</p>

  <!-- Línea decorativa inferior -->
  <div style="
    position:absolute; bottom:60px; left:60px; right:60px;
    height:1px;
    background: linear-gradient(90deg, transparent, #C9A84C, #C9A84C, transparent);
  "></div>
</div>`;
}

/** Genero el HTML de una página de carta */
function crearHTMLCarta(carta, cuerpoPersonalizado) {
  // Divido el cuerpo en párrafos para darle espaciado correcto
  const parrafos = cuerpoPersonalizado
    .split('\n\n')
    .filter(p => p.trim())
    .map(p => p.trim());

  return `
<div style="
  width:794px; height:1123px;
  background:#FFFDF8;
  position:relative; overflow:hidden;
  font-family: Georgia, 'Times New Roman', serif;
">
  <!-- Mi borde superior de acento -->
  <div style="
    height:5px;
    background: linear-gradient(90deg, ${carta.acento}, #E8C97D, #2EC4B6);
  "></div>

  <!-- Ornamento de fondo -->
  <div style="
    position:absolute; bottom:-40px; right:-40px;
    width:300px; height:300px; border-radius:50%;
    background: radial-gradient(circle, rgba(${hexToRgb(carta.acento)},0.04) 0%, transparent 70%);
  "></div>

  <div style="padding:50px 65px 50px;">

    <!-- Cabecera de la carta -->
    <div style="
      display:flex; align-items:center; gap:12px;
      margin-bottom:36px;
    ">
      <div style="flex:1; height:1px; background:linear-gradient(90deg, ${carta.acento}80, transparent);"></div>
      <p style="
        font-family:Arial,sans-serif; font-size:9px; font-weight:700;
        letter-spacing:0.2em; text-transform:uppercase;
        color:${carta.acento}; white-space:nowrap;
      ">✦ ${carta.categoria} · El Mundo de Manu</p>
      <div style="flex:1; height:1px; background:linear-gradient(270deg, ${carta.acento}80, transparent);"></div>
    </div>

    <!-- Icono y título -->
    <div style="margin-bottom:28px;">
      <p style="font-size:28px; margin-bottom:12px;">${carta.icono}</p>
      <h2 style="
        font-size:26px; font-weight:400; font-style:italic;
        color:#1C1A17; line-height:1.2; margin:0;
      ">${carta.titulo}</h2>
    </div>

    <!-- Línea divisora -->
    <div style="
      width:40px; height:2px; margin-bottom:28px;
      background: linear-gradient(90deg, ${carta.acento}, transparent);
    "></div>

    <!-- Cuerpo de la carta -->
    <div style="font-size:15px; line-height:1.85; color:#2A2825;">
      ${parrafos.map((p, i) => `
      <p style="margin:0 0 ${i < parrafos.length - 1 ? '18px' : '0'};">${p}</p>
      `).join('')}
    </div>

    <!-- Ornamento central -->
    <p style="
      text-align:center; color:${carta.acento}80;
      font-size:14px; letter-spacing:0.3em;
      margin:28px 0;
    ">· · ·</p>

    <!-- Firma -->
    <div style="
      border-top:1px solid #E8E0D5;
      padding-top:20px;
    ">
      <p style="
        font-size:15px; font-style:italic; color:#6B6560;
        margin:0;
      ">${carta.firma}</p>
    </div>

  </div>

  <!-- Número de página / marca de agua -->
  <p style="
    position:absolute; bottom:20px; right:30px;
    font-family:Arial,sans-serif; font-size:9px;
    color:#D0C8BC; letter-spacing:0.1em;
  ">elmundomanu.com · ${carta.categoria}</p>
</div>`;
}

/** Genero el HTML de la contraportada */
function crearHTMLContraportada() {
  return `
<div style="
  width:794px; height:1123px;
  background: linear-gradient(160deg, #0A0E14 0%, #1A1500 60%, #0A0E14 100%);
  display:flex; flex-direction:column;
  align-items:center; justify-content:center;
  position:relative; overflow:hidden;
  font-family: Georgia, 'Times New Roman', serif;
">
  <!-- Línea superior -->
  <div style="position:absolute;top:60px;left:60px;right:60px;height:1px;background:linear-gradient(90deg,transparent,#C9A84C,transparent);"></div>

  <!-- Glow central -->
  <div style="position:absolute;width:400px;height:400px;border-radius:50%;background:radial-gradient(circle,rgba(201,168,76,0.08) 0%,transparent 70%);"></div>

  <div style="text-align:center;position:relative;z-index:1;padding:0 80px;">

    <p style="color:#C9A84C;font-size:32px;margin-bottom:24px;letter-spacing:0.15em;">✦</p>

    <h2 style="
      color:#F5EDD8;font-size:36px;font-weight:400;
      font-style:italic;line-height:1.2;margin-bottom:16px;
    ">Las palabras correctas<br/>en el momento exacto.</h2>

    <div style="width:50px;height:1px;margin:24px auto;background:#C9A84C80;"></div>

    <p style="
      color:rgba(245,237,216,0.45);font-size:14px;
      line-height:1.9;font-family:Arial,sans-serif;
      max-width:380px;margin:0 auto 40px;
    ">
      Gracias por confiar en El Mundo de Manu.<br/>
      Espero que estas cartas abran conversaciones<br/>
      que de otra forma nunca habrían llegado.
    </p>

    <p style="color:rgba(201,168,76,0.6);font-size:11px;letter-spacing:0.25em;text-transform:uppercase;font-family:Arial,sans-serif;margin-bottom:8px;">
      elmundomanu.com
    </p>
    <p style="color:rgba(245,237,216,0.25);font-size:10px;font-family:Arial,sans-serif;letter-spacing:0.1em;">
      Pack de Cartas de Amor Premium · Uso personal · © 2025
    </p>

  </div>

  <!-- Línea inferior -->
  <div style="position:absolute;bottom:60px;left:60px;right:60px;height:1px;background:linear-gradient(90deg,transparent,#C9A84C,transparent);"></div>
</div>`;
}


// ══════════════════════════════════════════════════════════════
// MIS UTILIDADES
// ══════════════════════════════════════════════════════════════

/** Convierto un color hex a RGB para usarlo en rgba() */
function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? `${parseInt(result[1],16)},${parseInt(result[2],16)},${parseInt(result[3],16)}`
    : '201,168,76';
}

/** Espero N milisegundos — lo uso entre renders para dar tiempo al DOM */
function esperar(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Expongo la función principal globalmente
window.generarPDFPremium = generarPDFPremium;