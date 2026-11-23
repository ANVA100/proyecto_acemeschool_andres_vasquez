/**
 * <estado-vacio> · Mensaje amigable cuando una lista no tiene elementos
 * ---------------------------------------------------------------------------
 * Atributos:
 *  - icono:   nombre del ícono (ver utilidades/iconos.js). Por defecto "bandeja".
 *  - titulo:  texto principal.
 *  - mensaje: texto secundario (opcional).
 *
 * Slot: el contenido interno (p. ej. un botón) se muestra debajo del mensaje.
 *
 * @example
 *   <estado-vacio icono="usuarios" titulo="Aún no hay usuarios"
 *                 mensaje="Crea el primero con el formulario.">
 *     <button class="btn btn--primario">Crear usuario</button>
 *   </estado-vacio>
 */
import { icono } from '../../utilidades/iconos.js';

const plantilla = document.createElement('template');
plantilla.innerHTML = `
  <style>
    :host { display: block; }

    .estado {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--espacio-3);
      padding: var(--espacio-10) var(--espacio-6);
      text-align: center;
      animation: aparecer 400ms ease both;
    }

    .icono {
      display: grid;
      place-items: center;
      width: 3.5rem;
      height: 3.5rem;
      border-radius: 50%;
      background-color: var(--color-primario-suave);
      color: var(--color-primario-texto);
    }

    .icono svg { width: 1.75rem; height: 1.75rem; }

    .titulo {
      margin: 0;
      color: var(--color-texto);
      font-family: var(--fuente-titulos);
      font-size: var(--texto-lg);
      line-height: 1.3;
    }

    .mensaje {
      max-width: 42ch;
      margin: 0;
      color: var(--color-texto-secundario);
      font-size: var(--texto-sm);
    }

    .mensaje:empty { display: none; }

    ::slotted(*) { margin-top: var(--espacio-2); }

    @keyframes aparecer {
      from { opacity: 0; transform: translateY(8px); }
      to { opacity: 1; transform: translateY(0); }
    }

    @media (prefers-reduced-motion: reduce) {
      .estado { animation: none; }
    }
  </style>
  <div class="estado">
    <span class="icono"></span>
    <h3 class="titulo"></h3>
    <p class="mensaje"></p>
    <slot></slot>
  </div>
`;

class EstadoVacio extends HTMLElement {
  static observedAttributes = ['icono', 'titulo', 'mensaje'];

  constructor() {
    super();
    this.attachShadow({ mode: 'open' }).append(plantilla.content.cloneNode(true));
  }

  connectedCallback() {
    this.#actualizar();
  }

  attributeChangedCallback() {
    this.#actualizar();
  }

  #actualizar() {
    const raiz = this.shadowRoot;
    raiz.querySelector('.icono').innerHTML = icono(this.getAttribute('icono') || 'bandeja');
    raiz.querySelector('.titulo').textContent = this.getAttribute('titulo') ?? '';
    raiz.querySelector('.mensaje').textContent = this.getAttribute('mensaje') ?? '';
  }
}

customElements.define('estado-vacio', EstadoVacio);
