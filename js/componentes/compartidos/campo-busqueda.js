/**
 * <campo-busqueda> · Caja de búsqueda reutilizable para filtrar tablas
 * ---------------------------------------------------------------------------
 * Atributos:
 *  - etiqueta:    texto para lectores de pantalla (p. ej. "Buscar usuarios").
 *  - placeholder: texto de ayuda dentro del campo.
 *
 * Evento que emite:
 *  - "buscar" → detail: { termino } cada vez que el usuario deja de escribir
 *    por un momento (técnica "debounce": evita filtrar en cada tecla).
 *
 * @example
 *   <campo-busqueda etiqueta="Buscar usuarios" placeholder="Nombre o correo"></campo-busqueda>
 *   buscador.addEventListener('buscar', (e) => filtrar(e.detail.termino));
 */
import { icono } from '../../utilidades/iconos.js';

const ESPERA_MS = 200;

const plantilla = document.createElement('template');
plantilla.innerHTML = `
  <link rel="stylesheet" href="css/componentes.css">
  <style>
    :host { display: block; }
    *, *::before, *::after { box-sizing: border-box; }

    /* La regla global [hidden] de base.css no entra al Shadow DOM */
    [hidden] { display: none !important; }

    .sr-only {
      position: absolute;
      width: 1px;
      height: 1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
    }

    .buscador {
      position: relative;
      display: flex;
      align-items: center;
    }

    .icono-buscar {
      position: absolute;
      left: var(--espacio-3);
      width: 1.125rem;
      height: 1.125rem;
      color: var(--color-texto-tenue);
      pointer-events: none;
    }

    .campo__entrada {
      padding-left: 2.5rem;
      padding-right: 2.75rem;
      font-family: var(--fuente-cuerpo);
    }

    /* Oculta la "x" nativa del input search: se usa un botón propio */
    .campo__entrada::-webkit-search-cancel-button { appearance: none; }
  </style>

  <label class="sr-only" for="entrada">Buscar</label>
  <div class="buscador">
    ${icono('buscar', 'icono-buscar')}
    <input class="campo__entrada" id="entrada" type="search" autocomplete="off" spellcheck="false">
    <button type="button" class="campo__boton-interno" aria-label="Limpiar búsqueda" hidden>
      ${icono('cerrar')}
    </button>
  </div>
`;

class CampoBusqueda extends HTMLElement {
  static observedAttributes = ['etiqueta', 'placeholder'];

  #entrada;
  #botonLimpiar;
  #temporizador = null;

  constructor() {
    super();
    this.attachShadow({ mode: 'open' }).append(plantilla.content.cloneNode(true));
    this.#entrada = this.shadowRoot.querySelector('input');
    this.#botonLimpiar = this.shadowRoot.querySelector('button');
  }

  connectedCallback() {
    this.#entrada.addEventListener('input', this.#alEscribir);
    this.#entrada.addEventListener('keydown', this.#alPresionarTecla);
    this.#botonLimpiar.addEventListener('click', this.limpiar);
  }

  disconnectedCallback() {
    clearTimeout(this.#temporizador);
    this.#entrada.removeEventListener('input', this.#alEscribir);
    this.#entrada.removeEventListener('keydown', this.#alPresionarTecla);
    this.#botonLimpiar.removeEventListener('click', this.limpiar);
  }

  /** Se ejecuta cuando cambia un atributo observado. */
  attributeChangedCallback(nombre, _valorAnterior, valorNuevo) {
    if (nombre === 'etiqueta') {
      this.shadowRoot.querySelector('label').textContent = valorNuevo ?? 'Buscar';
    }
    if (nombre === 'placeholder') {
      this.#entrada.placeholder = valorNuevo ?? '';
    }
  }

  /** Texto escrito actualmente. */
  get valor() {
    return this.#entrada.value.trim();
  }

  /** Borra la búsqueda y avisa de inmediato. */
  limpiar = () => {
    this.#entrada.value = '';
    this.#botonLimpiar.hidden = true;
    this.#emitir();
    this.#entrada.focus();
  };

  #alEscribir = () => {
    this.#botonLimpiar.hidden = this.#entrada.value === '';
    clearTimeout(this.#temporizador);
    this.#temporizador = setTimeout(() => this.#emitir(), ESPERA_MS);
  };

  #alPresionarTecla = (evento) => {
    if (evento.key === 'Escape' && this.#entrada.value) {
      evento.preventDefault();
      this.limpiar();
    }
  };

  #emitir() {
    clearTimeout(this.#temporizador);
    // composed: true permite que el evento salga del Shadow DOM
    this.dispatchEvent(new CustomEvent('buscar', { detail: { termino: this.valor }, bubbles: true, composed: true }));
  }
}

customElements.define('campo-busqueda', CampoBusqueda);
