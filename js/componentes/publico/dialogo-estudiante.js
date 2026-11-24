/**
 * <dialogo-estudiante> · Identificación antes de presentar un examen
 * ---------------------------------------------------------------------------
 * El módulo de exámenes es público (el estudiante no inicia sesión), así que
 * antes de empezar se le pide su número de identificación y su nombre
 * completo: son los datos a los que quedan asociadas sus respuestas.
 *
 * También muestra el resumen del examen y las instrucciones.
 *
 * Uso (devuelve una promesa):
 *   const estudiante = await pedirDatosEstudiante(examen);
 *   // → { identificacion, nombreCompleto }  o  null si canceló
 */
import { crearEsquemaEstudiante } from '../../servicios/servicio-intentos.js';
import { pluralizar } from '../../utilidades/formato.js';
import {
  activarLimpiezaAutomatica,
  limpiarErrores,
  mostrarErrores,
  obtenerDatosFormulario,
} from '../../utilidades/formularios.js';
import { icono } from '../../utilidades/iconos.js';
import { LIMITES } from '../../config/constantes.js';
import { validar } from '../../utilidades/validaciones.js';

const INSTRUCCIONES = [
  'El reloj empieza a correr cuando pulsas «Comenzar examen».',
  'Cada pregunta tiene una sola respuesta correcta.',
  'Si el tiempo llega a cero, el examen se envía automáticamente.',
  'Puedes terminar antes con el botón «Terminar».',
];

const plantilla = document.createElement('template');
plantilla.innerHTML = `
  <link rel="stylesheet" href="css/componentes.css">
  <link rel="stylesheet" href="css/animaciones.css">
  <style>
    *, *::before, *::after { box-sizing: border-box; }
    [hidden] { display: none !important; }
    h2, h3, p, ul { margin: 0; }

    .dialogo {
      width: min(100% - 2rem, 34rem);
      font-family: var(--fuente-cuerpo);
      line-height: var(--interlineado-normal);
    }

    .encabezado {
      padding: var(--espacio-6) var(--espacio-6) var(--espacio-5);
      background: var(--degradado-marca);
      color: #ffffff;
    }

    .antetitulo {
      color: rgba(255, 255, 255, 0.85);
      font-size: var(--texto-xs);
      font-weight: var(--peso-seminegrita);
      letter-spacing: 0.06em;
      text-transform: uppercase;
    }

    .dialogo__titulo {
      margin-top: var(--espacio-1);
      color: #ffffff;
      font-family: var(--fuente-titulos);
      line-height: 1.25;
    }

    .datos {
      display: flex;
      flex-wrap: wrap;
      gap: var(--espacio-2);
      margin-top: var(--espacio-4);
      padding: 0;
      list-style: none;
    }

    .datos li {
      display: inline-flex;
      align-items: center;
      gap: var(--espacio-1);
      padding: 0.25rem 0.7rem;
      border-radius: var(--radio-completo);
      background-color: rgba(255, 255, 255, 0.16);
      font-size: var(--texto-sm);
      font-weight: var(--peso-medio);
    }

    .datos svg { width: 1rem; height: 1rem; }

    .instrucciones {
      display: grid;
      gap: var(--espacio-2);
      padding: var(--espacio-4);
      border: 1px solid var(--color-info-borde);
      border-radius: var(--radio-md);
      background-color: var(--color-info-suave);
      color: var(--color-info-texto);
      font-size: var(--texto-sm);
      list-style: none;
    }

    .instrucciones li {
      display: flex;
      align-items: flex-start;
      gap: var(--espacio-2);
    }

    .instrucciones svg { flex-shrink: 0; width: 1rem; height: 1rem; margin-top: 0.2rem; }

    .formulario { margin-top: var(--espacio-5); }
    .subtitulo { color: var(--color-texto); font-size: var(--texto-base); }
    .campo__obligatorio { margin-left: 2px; }
  </style>

  <dialog class="dialogo" aria-labelledby="titulo-estudiante">
    <div class="encabezado">
      <p class="antetitulo">Vas a presentar</p>
      <h2 class="dialogo__titulo" id="titulo-estudiante"></h2>
      <ul class="datos" data-ref="datos"></ul>
    </div>

    <div class="dialogo__contenido">
      <ul class="instrucciones" aria-label="Instrucciones">
        ${INSTRUCCIONES.map((texto) => `<li>${icono('info')}<span>${texto}</span></li>`).join('')}
      </ul>

      <form class="formulario" novalidate>
        <h3 class="subtitulo">Identifícate para comenzar</h3>

        <div class="campo">
          <label class="campo__etiqueta" for="estudiante-identificacion">
            Número de identificación <span class="campo__obligatorio" aria-hidden="true">*</span>
          </label>
          <input class="campo__entrada" id="estudiante-identificacion" name="identificacion" type="text"
            inputmode="numeric" autocomplete="off" maxlength="${LIMITES.IDENTIFICACION.MAX}"
            placeholder="Ej: 1098765432" required aria-describedby="estudiante-identificacion-error">
          <p class="campo__error" id="estudiante-identificacion-error"></p>
        </div>

        <div class="campo">
          <label class="campo__etiqueta" for="estudiante-nombre">
            Nombre completo <span class="campo__obligatorio" aria-hidden="true">*</span>
          </label>
          <input class="campo__entrada" id="estudiante-nombre" name="nombreCompleto" type="text"
            autocomplete="name" maxlength="${LIMITES.NOMBRE_COMPLETO.MAX}" placeholder="Ej: María Fernanda López"
            required aria-describedby="estudiante-nombre-error">
          <p class="campo__error" id="estudiante-nombre-error"></p>
        </div>

        <div class="dialogo__acciones">
          <button type="button" class="btn btn--fantasma" data-accion="cancelar">Cancelar</button>
          <button type="submit" class="btn btn--primario">${icono('reloj')} Comenzar examen</button>
        </div>
      </form>
    </div>
  </dialog>
`;

class DialogoEstudiante extends HTMLElement {
  #dialogo;
  #formulario;
  #resolver = null;

  constructor() {
    super();
    this.attachShadow({ mode: 'open' }).append(plantilla.content.cloneNode(true));
    this.#dialogo = this.shadowRoot.querySelector('dialog');
    this.#formulario = this.shadowRoot.querySelector('form');

    this.#formulario.addEventListener('submit', this.#alEnviar);
    this.shadowRoot.querySelector('[data-accion="cancelar"]').addEventListener('click', () => this.#cerrar(null));
    // Escape o clic en el fondo cancelan
    this.#dialogo.addEventListener('cancel', (evento) => {
      evento.preventDefault();
      this.#cerrar(null);
    });
    this.#dialogo.addEventListener('click', (evento) => {
      if (evento.target === this.#dialogo) this.#cerrar(null);
    });
    activarLimpiezaAutomatica(this.#formulario);
  }

  /**
   * Abre el diálogo para un examen y espera los datos del estudiante.
   * @param {object} examen
   * @returns {Promise<{identificacion: string, nombreCompleto: string}|null>}
   */
  abrir(examen) {
    if (this.#dialogo.open) return Promise.resolve(null);

    this.shadowRoot.querySelector('#titulo-estudiante').textContent = examen.titulo;
    this.shadowRoot.querySelector('[data-ref="datos"]').innerHTML = `
      <li>${icono('reloj')} ${examen.tiempoMinutos} min</li>
      <li>${icono('lista')} ${pluralizar(examen.preguntas.length, 'pregunta')}</li>
      <li>${icono('porcentaje')} Aprueba con ${examen.porcentajeAprobacion} %</li>`;

    this.#formulario.reset();
    limpiarErrores(this.#formulario);
    this.#dialogo.showModal();
    this.#formulario.elements.identificacion.focus();

    return new Promise((resolver) => {
      this.#resolver = resolver;
    });
  }

  #cerrar(resultado) {
    this.#dialogo.close();
    this.#resolver?.(resultado);
    this.#resolver = null;
  }

  #alEnviar = (evento) => {
    evento.preventDefault();
    const datos = obtenerDatosFormulario(this.#formulario);
    const { esValido, errores } = validar(datos, crearEsquemaEstudiante());
    if (!esValido) {
      mostrarErrores(this.#formulario, errores);
      return;
    }
    this.#cerrar({ identificacion: datos.identificacion, nombreCompleto: datos.nombreCompleto.replace(/\s+/g, ' ') });
  };
}

customElements.define('dialogo-estudiante', DialogoEstudiante);

/**
 * Pide al estudiante sus datos para presentar un examen.
 * @param {object} examen
 * @returns {Promise<{identificacion: string, nombreCompleto: string}|null>}
 */
export function pedirDatosEstudiante(examen) {
  let dialogo = document.querySelector('dialogo-estudiante');
  if (!dialogo) {
    dialogo = document.createElement('dialogo-estudiante');
    document.body.append(dialogo);
  }
  return dialogo.abrir(examen);
}
