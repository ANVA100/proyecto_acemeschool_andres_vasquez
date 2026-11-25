/**
 * <vista-componentes> · Galería interactiva de los Web Components (ruta #/componentes)
 * ---------------------------------------------------------------------------
 * Página pública para mostrar los Web Components del proyecto en vivo:
 *  - cada widget se puede manipular (cambiar atributos, disparar acciones),
 *  - un registro muestra los eventos personalizados (CustomEvent) que emiten,
 *  - una tabla lista los 27 Custom Elements de la app y si usan Shadow DOM.
 *
 * Conceptos que se ven aquí: customElements.define, Shadow DOM, <template>,
 * <slot>, observedAttributes + attributeChangedCallback, connectedCallback /
 * disconnectedCallback, eventos con bubbles + composed y métodos públicos.
 */
import { escaparHTML } from '../../utilidades/dom.js';
import { icono } from '../../utilidades/iconos.js';
import { notificar } from '../compartidos/contenedor-notificaciones.js';
import { confirmar } from '../compartidos/dialogo-confirmacion.js';
import { pedirDatosEstudiante } from '../publico/dialogo-estudiante.js';
import '../compartidos/tarjeta-estadistica.js';
import '../publico/anillo-progreso.js';
import '../publico/tarjeta-examen.js';
import '../publico/temporizador-examen.js';

/** Todos los Custom Elements de la aplicación. */
const COMPONENTES = [
  { etiqueta: 'encabezado-app', shadow: false, archivo: 'compartidos/encabezado-app.js', rol: 'Navegación, sesión y modo oscuro' },
  { etiqueta: 'contenedor-notificaciones', shadow: true, archivo: 'compartidos/contenedor-notificaciones.js', rol: 'Notificaciones emergentes' },
  { etiqueta: 'dialogo-confirmacion', shadow: true, archivo: 'compartidos/dialogo-confirmacion.js', rol: 'Confirmación con <dialog>' },
  { etiqueta: 'campo-busqueda', shadow: true, archivo: 'compartidos/campo-busqueda.js', rol: 'Buscador con debounce' },
  { etiqueta: 'estado-vacio', shadow: true, archivo: 'compartidos/estado-vacio.js', rol: 'Mensaje de lista vacía (con slot)' },
  { etiqueta: 'tarjeta-estadistica', shadow: true, archivo: 'compartidos/tarjeta-estadistica.js', rol: 'Indicador numérico' },
  { etiqueta: 'tarjeta-examen', shadow: true, archivo: 'publico/tarjeta-examen.js', rol: 'Tarjeta del catálogo' },
  { etiqueta: 'dialogo-estudiante', shadow: true, archivo: 'publico/dialogo-estudiante.js', rol: 'Identificación del estudiante' },
  { etiqueta: 'temporizador-examen', shadow: true, archivo: 'publico/temporizador-examen.js', rol: 'Reloj en tiempo real' },
  { etiqueta: 'anillo-progreso', shadow: true, archivo: 'publico/anillo-progreso.js', rol: 'Porcentaje en anillo SVG' },
  { etiqueta: 'vista-login', shadow: false, archivo: 'autenticacion/vista-login.js', rol: 'Vista: inicio de sesión' },
  { etiqueta: 'vista-usuarios', shadow: false, archivo: 'usuarios/vista-usuarios.js', rol: 'Vista: gestión de usuarios' },
  { etiqueta: 'formulario-usuario', shadow: false, archivo: 'usuarios/formulario-usuario.js', rol: 'Formulario crear/editar usuario' },
  { etiqueta: 'tabla-usuarios', shadow: false, archivo: 'usuarios/tabla-usuarios.js', rol: 'Tabla de usuarios' },
  { etiqueta: 'vista-examenes', shadow: false, archivo: 'examenes/vista-examenes.js', rol: 'Vista: gestión de exámenes' },
  { etiqueta: 'formulario-examen', shadow: false, archivo: 'examenes/formulario-examen.js', rol: 'Formulario crear/editar examen' },
  { etiqueta: 'tabla-examenes', shadow: false, archivo: 'examenes/tabla-examenes.js', rol: 'Tabla de exámenes' },
  { etiqueta: 'vista-preguntas', shadow: false, archivo: 'examenes/vista-preguntas.js', rol: 'Vista: preguntas de un examen' },
  { etiqueta: 'formulario-pregunta', shadow: false, archivo: 'examenes/formulario-pregunta.js', rol: 'Pregunta + respuestas dinámicas' },
  { etiqueta: 'lista-preguntas', shadow: false, archivo: 'examenes/lista-preguntas.js', rol: 'Lista de preguntas' },
  { etiqueta: 'vista-catalogo', shadow: false, archivo: 'publico/vista-catalogo.js', rol: 'Vista: catálogo público' },
  { etiqueta: 'vista-examen', shadow: false, archivo: 'publico/vista-examen.js', rol: 'Vista: presentar examen y resultado' },
  { etiqueta: 'vista-resultados', shadow: false, archivo: 'resultados/vista-resultados.js', rol: 'Vista: panel de resultados' },
  { etiqueta: 'tabla-resultados', shadow: false, archivo: 'resultados/tabla-resultados.js', rol: 'Tabla del historial' },
  { etiqueta: 'vista-respaldo', shadow: false, archivo: 'respaldo/vista-respaldo.js', rol: 'Vista: exportar / importar' },
  { etiqueta: 'vista-no-encontrada', shadow: false, archivo: 'generales/vista-no-encontrada.js', rol: 'Página 404' },
  { etiqueta: 'vista-componentes', shadow: false, archivo: 'generales/vista-componentes.js', rol: 'Esta galería' },
];

const MAXIMO_EVENTOS = 8;

/** Plantilla de una tarjeta de demostración. */
function tarjetaDemo({ etiqueta, descripcion, conceptos, contenido, ancha = false }) {
  return `
    <article class="demo tarjeta ${ancha ? 'demo--ancha' : ''}" aria-labelledby="demo-${etiqueta}">
      <header class="demo__encabezado">
        <h2 class="demo__titulo" id="demo-${etiqueta}"><code>&lt;${etiqueta}&gt;</code></h2>
        <p class="demo__descripcion">${descripcion}</p>
        <ul class="demo__conceptos" role="list">
          ${conceptos.map((concepto) => `<li class="insignia insignia--primario">${concepto}</li>`).join('')}
        </ul>
      </header>
      <div class="demo__contenido">${contenido}</div>
    </article>`;
}

class VistaComponentes extends HTMLElement {
  connectedCallback() {
    const registrados = COMPONENTES.filter(({ etiqueta }) => customElements.get(etiqueta)).length;
    const conShadow = COMPONENTES.filter(({ shadow }) => shadow).length;

    this.innerHTML = `
      <section class="hero hero--galeria" aria-labelledby="titulo-galeria">
        <span class="insignia insignia--acento">${icono('herramienta')} Plus del proyecto</span>
        <h1 class="hero__titulo" id="titulo-galeria">Web <span class="texto-marca">Components</span></h1>
        <p class="hero__descripcion">
          Toda la interfaz está hecha con <strong>${COMPONENTES.length} Custom Elements</strong>
          (${conShadow} con Shadow DOM). Aquí puedes probar los reutilizables en vivo.
        </p>
        <ul class="galeria__resumen" role="list">
          <li><strong>${registrados}/${COMPONENTES.length}</strong> registrados con <code>customElements.define</code></li>
          <li><strong>${conShadow}</strong> con Shadow DOM (estilos encapsulados)</li>
          <li>Tip: DevTools → Elements → busca <code>#shadow-root</code></li>
        </ul>
      </section>

      <aside class="registro tarjeta" aria-labelledby="titulo-registro">
        <div class="registro__encabezado">
          <h2 class="registro__titulo" id="titulo-registro">${icono('lista')} Registro de eventos personalizados</h2>
          <button type="button" class="btn btn--fantasma btn--pequeno" data-accion="limpiar-registro">Limpiar</button>
        </div>
        <ol class="registro__lista" role="list" aria-live="polite" data-ref="registro">
          <li class="registro__vacio">Interactúa con los componentes: aquí aparecerán los eventos que emiten.</li>
        </ol>
      </aside>

      <div class="galeria">
        ${tarjetaDemo({
          etiqueta: 'tarjeta-examen',
          descripcion: 'Recibe todos sus datos por atributos. Cambia los controles: el componente se actualiza solo.',
          conceptos: ['Shadow DOM', 'observedAttributes', 'CustomEvent composed'],
          contenido: `
            <div class="demo__dividido">
              <tarjeta-examen examen-id="demo" codigo="DEMO-01" titulo="Examen de demostración"
                descripcion="Este examen no existe: es solo para mostrar el componente." tiempo="10"
                porcentaje="60" preguntas="5" aleatorio></tarjeta-examen>
              <form class="formulario demo__controles" data-demo="tarjeta">
                <div class="campo">
                  <label class="campo__etiqueta" for="demo-titulo">Atributo <code>titulo</code></label>
                  <input class="campo__entrada" id="demo-titulo" name="titulo" value="Examen de demostración" maxlength="60">
                </div>
                <div class="campo">
                  <label class="campo__etiqueta" for="demo-tiempo">Atributo <code>tiempo</code>: <output data-ref="salida-tiempo">10</output> min</label>
                  <input id="demo-tiempo" name="tiempo" type="range" min="1" max="60" value="10">
                </div>
                <div class="campo">
                  <label class="campo__etiqueta" for="demo-porcentaje">Atributo <code>porcentaje</code>: <output data-ref="salida-porcentaje">60</output> %</label>
                  <input id="demo-porcentaje" name="porcentaje" type="range" min="1" max="100" value="60">
                </div>
                <label class="interruptor">
                  <input class="interruptor__entrada" type="checkbox" role="switch" name="aleatorio" checked>
                  <span class="interruptor__pista" aria-hidden="true"></span>
                  <span class="interruptor__texto"><strong>Atributo <code>aleatorio</code></strong></span>
                </label>
              </form>
            </div>`,
          ancha: true,
        })}

        ${tarjetaDemo({
          etiqueta: 'temporizador-examen',
          descripcion: 'Recalcula el tiempo con Date.now() (no se desfasa). Cambia de color al final y emite "tiempo-agotado".',
          conceptos: ['Shadow DOM', 'Atributos', 'Variables CSS', 'Evento propio'],
          contenido: `
            <temporizador-examen data-ref="temporizador"></temporizador-examen>
            <div class="grupo-botones">
              <button type="button" class="btn btn--primario" data-accion="iniciar-reloj" data-segundos="15">${icono('reloj')} Iniciar 15 s</button>
              <button type="button" class="btn btn--secundario" data-accion="iniciar-reloj" data-segundos="75">Iniciar 1:15</button>
            </div>`,
        })}

        ${tarjetaDemo({
          etiqueta: 'anillo-progreso',
          descripcion: 'Anillo SVG animado con requestAnimationFrame. Mueve el control para cambiar el atributo "valor".',
          conceptos: ['Shadow DOM', 'SVG', ':host([estado])'],
          contenido: `
            <div class="demo__centrado">
              <anillo-progreso valor="80" estado="aprobado" etiqueta="de aciertos" data-ref="anillo"></anillo-progreso>
            </div>
            <div class="campo">
              <label class="campo__etiqueta" for="demo-anillo">Atributo <code>valor</code>: <output data-ref="salida-anillo">80</output> % (aprueba con 60 %)</label>
              <input id="demo-anillo" type="range" min="0" max="100" value="80" data-demo="anillo">
            </div>`,
        })}

        ${tarjetaDemo({
          etiqueta: 'tarjeta-estadistica',
          descripcion: 'Indicador reutilizado en el panel de resultados. El atributo "tono" cambia los colores.',
          conceptos: ['Shadow DOM', ':host([tono])', 'Atributos'],
          contenido: `
            <div class="demo__pila">
              <tarjeta-estadistica icono="medalla" tono="exito" titulo="Aprobados" valor="12" detalle="75 % de aprobación" data-ref="estadistica"></tarjeta-estadistica>
              <tarjeta-estadistica icono="porcentaje" tono="acento" titulo="Promedio" valor="68,5 %" detalle="de aciertos"></tarjeta-estadistica>
            </div>
            <button type="button" class="btn btn--secundario" data-accion="cambiar-estadistica">${icono('reiniciar')} Cambiar valor</button>`,
        })}

        ${tarjetaDemo({
          etiqueta: 'campo-busqueda',
          descripcion: 'Espera a que dejes de escribir (debounce) y emite "buscar". Escape limpia la búsqueda.',
          conceptos: ['Shadow DOM', 'Debounce', 'Evento composed'],
          contenido: `<campo-busqueda etiqueta="Búsqueda de prueba" placeholder="Escribe algo…"></campo-busqueda>`,
        })}

        ${tarjetaDemo({
          etiqueta: 'estado-vacio',
          descripcion: 'El botón de abajo no está dentro del componente: se inserta desde fuera con un <slot>.',
          conceptos: ['Shadow DOM', '<slot>', 'Atributos'],
          contenido: `
            <estado-vacio icono="bandeja" titulo="Aún no hay elementos" mensaje="Este mensaje viene de los atributos del componente.">
              <button type="button" class="btn btn--secundario btn--pequeno" data-accion="slot">Soy contenido del slot</button>
            </estado-vacio>`,
        })}

        ${tarjetaDemo({
          etiqueta: 'contenedor-notificaciones',
          descripcion: 'Se usa desde cualquier módulo con notificar(). Se pausan al pasar el mouse y las anuncia el lector de pantalla.',
          conceptos: ['Shadow DOM', 'aria-live', 'Método público'],
          contenido: `
            <div class="grupo-botones">
              <button type="button" class="btn btn--secundario btn--pequeno" data-notificar="exito">Éxito</button>
              <button type="button" class="btn btn--secundario btn--pequeno" data-notificar="info">Info</button>
              <button type="button" class="btn btn--secundario btn--pequeno" data-notificar="advertencia">Advertencia</button>
              <button type="button" class="btn btn--secundario btn--pequeno" data-notificar="error">Error</button>
            </div>`,
        })}

        ${tarjetaDemo({
          etiqueta: 'dialogo-confirmacion',
          descripcion: 'Reemplaza a confirm(): usa <dialog> nativo y devuelve una promesa con true o false.',
          conceptos: ['Shadow DOM', '<dialog>', 'Promesas'],
          contenido: `<button type="button" class="btn btn--peligro" data-accion="confirmar">${icono('eliminar')} Probar confirmación</button>`,
        })}

        ${tarjetaDemo({
          etiqueta: 'dialogo-estudiante',
          descripcion: 'El mismo diálogo del catálogo. Aquí solo muestra los datos que escribes; no inicia ningún examen.',
          conceptos: ['Shadow DOM', 'Validación', 'Promesas'],
          contenido: `<button type="button" class="btn btn--primario" data-accion="estudiante">${icono('usuario')} Abrir identificación</button>`,
        })}
      </div>

      <section class="seccion inventario" aria-labelledby="titulo-inventario">
        <h2 class="seccion__titulo" id="titulo-inventario">Todos los Custom Elements del proyecto</h2>
        <div class="tabla-contenedor">
          <table class="tabla tabla--responsiva">
            <caption class="sr-only">Lista de Web Components</caption>
            <thead>
              <tr>
                <th scope="col">Etiqueta</th>
                <th scope="col">Función</th>
                <th scope="col">Shadow DOM</th>
                <th scope="col">Archivo (js/componentes/)</th>
              </tr>
            </thead>
            <tbody>
              ${COMPONENTES.map(
                ({ etiqueta, shadow, archivo, rol }) => `
                  <tr>
                    <td data-etiqueta="Etiqueta"><code class="codigo">&lt;${etiqueta}&gt;</code></td>
                    <td data-etiqueta="Función">${escaparHTML(rol)}</td>
                    <td data-etiqueta="Shadow DOM">
                      ${shadow ? `<span class="insignia insignia--exito">${icono('check')} Sí</span>` : '<span class="insignia">Light DOM</span>'}
                    </td>
                    <td data-etiqueta="Archivo"><code>${escaparHTML(archivo)}</code></td>
                  </tr>`
              ).join('')}
            </tbody>
          </table>
        </div>
      </section>`;

    this.addEventListener('click', this.#alHacerClic);
    this.addEventListener('submit', (evento) => evento.preventDefault()); // Enter no recarga la página
    this.addEventListener('input', this.#alCambiarControl);
    this.addEventListener('change', this.#alCambiarControl);

    // Eventos personalizados que emiten los componentes de la galería
    this.addEventListener('seleccionar-examen', (evento) =>
      this.#registrar('tarjeta-examen', 'seleccionar-examen', evento.detail)
    );
    this.addEventListener('tiempo-agotado', () => {
      this.#registrar('temporizador-examen', 'tiempo-agotado');
      notificar('El temporizador llegó a 00:00 y emitió "tiempo-agotado".', { tipo: 'advertencia' });
    });
    this.addEventListener('buscar', (evento) => this.#registrar('campo-busqueda', 'buscar', evento.detail));
  }

  /** Agrega una línea al registro de eventos (máximo 8). */
  #registrar(componente, evento, detalle) {
    const lista = this.querySelector('[data-ref="registro"]');
    lista.querySelector('.registro__vacio')?.remove();
    const hora = new Date().toLocaleTimeString('es-CO', { hour12: false });
    const item = document.createElement('li');
    item.className = 'registro__item animar-aparecer';
    item.innerHTML = `
      <time>${hora}</time>
      <code>&lt;${escaparHTML(componente)}&gt;</code> → <strong>${escaparHTML(evento)}</strong>
      ${detalle !== undefined ? `<code class="registro__detalle">${escaparHTML(JSON.stringify(detalle))}</code>` : ''}`;
    lista.prepend(item);
    while (lista.children.length > MAXIMO_EVENTOS) lista.lastElementChild.remove();
  }

  /** Los controles cambian ATRIBUTOS: el componente reacciona con attributeChangedCallback. */
  #alCambiarControl = (evento) => {
    const control = evento.target;
    const formularioTarjeta = control.closest('[data-demo="tarjeta"]');

    if (formularioTarjeta) {
      const tarjeta = this.querySelector('tarjeta-examen');
      const { titulo, tiempo, porcentaje, aleatorio } = formularioTarjeta.elements;
      tarjeta.setAttribute('titulo', titulo.value || 'Sin título');
      tarjeta.setAttribute('tiempo', tiempo.value);
      tarjeta.setAttribute('porcentaje', porcentaje.value);
      tarjeta.toggleAttribute('aleatorio', aleatorio.checked);
      this.querySelector('[data-ref="salida-tiempo"]').textContent = tiempo.value;
      this.querySelector('[data-ref="salida-porcentaje"]').textContent = porcentaje.value;
    }

    if (control.dataset.demo === 'anillo' && evento.type === 'input') {
      const anillo = this.querySelector('[data-ref="anillo"]');
      anillo.setAttribute('valor', control.value);
      anillo.setAttribute('estado', Number(control.value) >= 60 ? 'aprobado' : 'reprobado');
      this.querySelector('[data-ref="salida-anillo"]').textContent = control.value;
    }
  };

  #alHacerClic = async (evento) => {
    const boton = evento.target.closest('button');
    if (!boton) return;

    if (boton.dataset.notificar) {
      const tipo = boton.dataset.notificar;
      notificar(`Notificación de tipo "${tipo}" creada con notificar().`, { tipo });
      return;
    }

    switch (boton.dataset.accion) {
      case 'iniciar-reloj': {
        const segundos = Number(boton.dataset.segundos);
        const reloj = this.querySelector('[data-ref="temporizador"]');
        reloj.setAttribute('duracion', String(segundos));
        reloj.setAttribute('finaliza-en', String(Date.now() + segundos * 1000));
        this.#registrar('temporizador-examen', 'atributos', { 'finaliza-en': 'ahora + ' + segundos + ' s', duracion: segundos });
        break;
      }
      case 'cambiar-estadistica': {
        const valor = Math.floor(Math.random() * 40) + 5;
        this.querySelector('[data-ref="estadistica"]').setAttribute('valor', String(valor));
        break;
      }
      case 'slot':
        notificar('Este botón vive en el light DOM y se muestra dentro del componente gracias a <slot>.', { tipo: 'info' });
        break;
      case 'confirmar': {
        const respuesta = await confirmar({
          titulo: '¿Te gustan los Web Components?',
          mensaje: 'Elige una opción: el resultado de la promesa aparecerá en el registro.',
          textoConfirmar: '¡Sí!',
          textoCancelar: 'Todavía no',
          tipo: 'info',
        });
        this.#registrar('dialogo-confirmacion', 'confirmar() resolvió', respuesta);
        break;
      }
      case 'estudiante': {
        const datos = await pedirDatosEstudiante({
          titulo: 'Examen de demostración',
          tiempoMinutos: 1,
          porcentajeAprobacion: 60,
          preguntas: [{}, {}, {}],
        });
        this.#registrar('dialogo-estudiante', 'pedirDatosEstudiante() resolvió', datos);
        break;
      }
      case 'limpiar-registro':
        this.querySelector('[data-ref="registro"]').innerHTML =
          '<li class="registro__vacio">Interactúa con los componentes: aquí aparecerán los eventos que emiten.</li>';
        break;
      default:
        break;
    }
  };
}

customElements.define('vista-componentes', VistaComponentes);
