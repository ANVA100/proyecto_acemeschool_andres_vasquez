/**
 * <contenedor-notificaciones> · Mensajes emergentes ("toasts")
 * ---------------------------------------------------------------------------
 * Web Component con Shadow DOM: sus estilos están encapsulados y no chocan
 * con los del resto de la página. Los colores salen de las variables CSS
 * globales, que sí atraviesan el Shadow DOM.
 *
 * Uso desde cualquier módulo:
 *   import { notificar } from '.../contenedor-notificaciones.js';
 *   notificar('Usuario creado correctamente', { tipo: 'exito' });
 *
 * - Tipos: "exito", "error", "advertencia", "info".
 * - Se cierran solas; la barra inferior muestra el tiempo restante y se
 *   pausa al pasar el mouse o enfocar la notificación.
 * - Accesible: los lectores de pantalla anuncian cada mensaje.
 */
import { icono } from '../../utilidades/iconos.js';

const ICONO_POR_TIPO = Object.freeze({ exito: 'exito', error: 'error', advertencia: 'alerta', info: 'info' });
const DURACION_POR_TIPO = Object.freeze({ exito: 4000, info: 4000, advertencia: 6000, error: 7000 });

const plantilla = document.createElement('template');
plantilla.innerHTML = `
  <style>
    :host {
      position: fixed;
      right: var(--espacio-4);
      bottom: var(--espacio-4);
      z-index: var(--capa-notificaciones);
      width: min(24rem, calc(100vw - 2 * var(--espacio-4)));
      pointer-events: none;
    }

    *, *::before, *::after { box-sizing: border-box; }

    .region {
      display: flex;
      flex-direction: column;
      gap: var(--espacio-3);
    }

    .notificacion {
      --color-tipo: var(--color-info);
      --color-icono: var(--color-info-texto);
      position: relative;
      display: flex;
      align-items: flex-start;
      gap: var(--espacio-3);
      padding: var(--espacio-4) var(--espacio-10) var(--espacio-4) var(--espacio-4);
      border: 1px solid var(--color-borde);
      border-left: 4px solid var(--color-tipo);
      border-radius: var(--radio-lg);
      background-color: var(--color-superficie-elevada);
      color: var(--color-texto);
      box-shadow: var(--sombra-lg);
      font-family: var(--fuente-cuerpo);
      font-size: var(--texto-sm);
      line-height: 1.5;
      overflow: hidden;
      pointer-events: auto;
      animation: entrar 320ms cubic-bezier(0.2, 0.8, 0.2, 1) both;
    }

    .notificacion--exito { --color-tipo: var(--color-exito); --color-icono: var(--color-exito-texto); }
    .notificacion--error { --color-tipo: var(--color-peligro); --color-icono: var(--color-peligro-texto); }
    .notificacion--advertencia { --color-tipo: var(--color-advertencia); --color-icono: var(--color-advertencia-texto); }

    .notificacion--saliendo {
      animation: salir 260ms ease forwards;
    }

    .icono {
      flex-shrink: 0;
      width: 1.25rem;
      height: 1.25rem;
      color: var(--color-icono);
    }

    .mensaje {
      margin: 0;
      flex: 1;
      overflow-wrap: anywhere;
    }

    .cerrar {
      position: absolute;
      top: var(--espacio-2);
      right: var(--espacio-2);
      display: grid;
      place-items: center;
      width: 2rem;
      height: 2rem;
      border: none;
      border-radius: var(--radio-sm);
      background: transparent;
      color: var(--color-texto-tenue);
      cursor: pointer;
    }

    .cerrar:hover { background-color: var(--color-superficie-alterna); color: var(--color-texto); }
    .cerrar:focus-visible { outline: 3px solid var(--color-foco); outline-offset: 1px; }
    .cerrar .icono { width: 1rem; height: 1rem; color: inherit; }

    .progreso {
      position: absolute;
      left: 0;
      bottom: 0;
      width: 100%;
      height: 3px;
      background-color: var(--color-tipo);
      transform-origin: left;
      animation: progreso var(--duracion) linear forwards;
    }

    .notificacion:hover .progreso,
    .notificacion:focus-within .progreso {
      animation-play-state: paused;
    }

    @keyframes entrar {
      from { opacity: 0; transform: translateX(110%); }
      to { opacity: 1; transform: translateX(0); }
    }

    @keyframes salir {
      to { opacity: 0; transform: translateX(110%); }
    }

    @keyframes progreso {
      from { transform: scaleX(1); }
      to { transform: scaleX(0); }
    }

    @media (max-width: 640px) {
      :host { left: var(--espacio-4); width: auto; }
    }

    @media (prefers-reduced-motion: reduce) {
      .notificacion, .notificacion--saliendo { animation-duration: 1ms; }
    }
  </style>
  <div class="region" role="region" aria-label="Notificaciones" aria-live="polite"></div>
`;

class ContenedorNotificaciones extends HTMLElement {
  #region;

  constructor() {
    super();
    this.attachShadow({ mode: 'open' }).append(plantilla.content.cloneNode(true));
    this.#region = this.shadowRoot.querySelector('.region');
  }

  /**
   * Muestra una notificación.
   * @param {string} mensaje
   * @param {{tipo?: 'exito'|'error'|'advertencia'|'info', duracion?: number}} [opciones]
   */
  mostrar(mensaje, { tipo = 'info', duracion } = {}) {
    const tipoValido = ICONO_POR_TIPO[tipo] ? tipo : 'info';
    const notificacion = document.createElement('div');
    notificacion.className = `notificacion notificacion--${tipoValido}`;
    // Los errores se anuncian de inmediato; el resto, cuando el lector termina lo que está leyendo
    notificacion.setAttribute('role', tipoValido === 'error' ? 'alert' : 'status');
    notificacion.style.setProperty('--duracion', `${duracion ?? DURACION_POR_TIPO[tipoValido]}ms`);
    notificacion.innerHTML = `
      ${icono(ICONO_POR_TIPO[tipoValido])}
      <p class="mensaje"></p>
      <button type="button" class="cerrar" aria-label="Cerrar notificación">${icono('cerrar')}</button>
      <span class="progreso"></span>`;

    // textContent (no innerHTML) para que el mensaje nunca se interprete como HTML
    notificacion.querySelector('.mensaje').textContent = mensaje;
    notificacion.querySelector('.cerrar').addEventListener('click', () => this.#cerrar(notificacion));
    // Cuando la barra de progreso termina, la notificación se cierra sola
    notificacion.querySelector('.progreso').addEventListener('animationend', () => this.#cerrar(notificacion));

    this.#region.append(notificacion);
  }

  #cerrar(notificacion) {
    if (notificacion.classList.contains('notificacion--saliendo')) return;
    notificacion.classList.add('notificacion--saliendo');
    // Se filtra por target: el animationend de la barra de progreso también sube hasta aquí
    notificacion.addEventListener('animationend', (evento) => {
      if (evento.target === notificacion) notificacion.remove();
    });
  }
}

customElements.define('contenedor-notificaciones', ContenedorNotificaciones);

/**
 * Atajo para mostrar una notificación desde cualquier parte de la app.
 * @param {string} mensaje
 * @param {{tipo?: 'exito'|'error'|'advertencia'|'info', duracion?: number}} [opciones]
 */
export function notificar(mensaje, opciones) {
  let contenedor = document.querySelector('contenedor-notificaciones');
  if (!contenedor) {
    contenedor = document.createElement('contenedor-notificaciones');
    document.body.append(contenedor);
  }
  contenedor.mostrar(mensaje, opciones);
}
