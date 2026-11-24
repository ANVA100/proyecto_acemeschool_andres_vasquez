/**
 * <anillo-progreso> · Porcentaje dibujado como un anillo animado (SVG)
 * ---------------------------------------------------------------------------
 * Atributos:
 *  - valor:    número de 0 a 100.
 *  - estado:   "aprobado" (verde) o "reprobado" (rojo).
 *  - etiqueta: texto bajo el número (p. ej. "de aciertos").
 *
 * El anillo se rellena y el número sube desde 0 con una animación
 * (se desactiva si el usuario prefiere reducir el movimiento).
 */
import { formatearPorcentaje } from '../../utilidades/formato.js';

const DURACION_ANIMACION_MS = 1100;

const plantilla = document.createElement('template');
plantilla.innerHTML = `
  <style>
    :host {
      --tamano: 11rem;
      --color-anillo: var(--color-primario);
      display: inline-block;
    }

    :host([estado='aprobado']) { --color-anillo: var(--color-exito); }
    :host([estado='reprobado']) { --color-anillo: var(--color-peligro); }

    .anillo {
      position: relative;
      width: var(--tamano);
      height: var(--tamano);
    }

    svg {
      display: block;
      width: 100%;
      height: 100%;
      transform: rotate(-90deg); /* el trazo empieza arriba */
    }

    circle {
      fill: none;
      stroke-width: 10;
    }

    .fondo { stroke: var(--color-superficie-alterna); }

    .valor {
      stroke: var(--color-anillo);
      stroke-linecap: round;
      stroke-dasharray: 100;
      stroke-dashoffset: 100;
      transition: stroke-dashoffset ${DURACION_ANIMACION_MS}ms cubic-bezier(0.2, 0.8, 0.2, 1);
    }

    .centro {
      position: absolute;
      inset: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      font-family: var(--fuente-titulos);
      text-align: center;
    }

    .numero {
      color: var(--color-texto);
      font-size: 2rem;
      font-weight: var(--peso-extra);
      font-variant-numeric: tabular-nums;
      line-height: 1;
    }

    .etiqueta {
      margin-top: var(--espacio-1);
      color: var(--color-texto-tenue);
      font-family: var(--fuente-cuerpo);
      font-size: var(--texto-xs);
    }

    @media (prefers-reduced-motion: reduce) {
      .valor { transition: none; }
    }
  </style>

  <div class="anillo" role="img">
    <svg viewBox="0 0 120 120" aria-hidden="true">
      <circle class="fondo" cx="60" cy="60" r="52"></circle>
      <!-- pathLength="100": el largo del trazo se mide en "porcentaje" -->
      <circle class="valor" cx="60" cy="60" r="52" pathLength="100"></circle>
    </svg>
    <div class="centro" aria-hidden="true">
      <span class="numero">0 %</span>
      <span class="etiqueta"></span>
    </div>
  </div>
`;

class AnilloProgreso extends HTMLElement {
  static observedAttributes = ['valor', 'etiqueta'];
  #animacion = null;

  constructor() {
    super();
    this.attachShadow({ mode: 'open' }).append(plantilla.content.cloneNode(true));
  }

  connectedCallback() {
    this.#actualizar();
  }

  disconnectedCallback() {
    cancelAnimationFrame(this.#animacion);
  }

  attributeChangedCallback() {
    if (this.isConnected) this.#actualizar();
  }

  #actualizar() {
    const raiz = this.shadowRoot;
    const valor = Math.min(100, Math.max(0, Number(this.getAttribute('valor')) || 0));
    const etiqueta = this.getAttribute('etiqueta') ?? '';

    raiz.querySelector('.etiqueta').textContent = etiqueta;
    raiz.querySelector('.anillo').setAttribute('aria-label', `${formatearPorcentaje(valor)} ${etiqueta}`.trim());

    // Se espera un cuadro para que la transición CSS del anillo se vea desde 0
    requestAnimationFrame(() => {
      raiz.querySelector('.valor').style.strokeDashoffset = String(100 - valor);
    });
    this.#animarNumero(valor);
  }

  /** Sube el número de 0 al valor final con requestAnimationFrame. */
  #animarNumero(valorFinal) {
    const numero = this.shadowRoot.querySelector('.numero');
    cancelAnimationFrame(this.#animacion);

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      numero.textContent = formatearPorcentaje(valorFinal);
      return;
    }

    const inicio = performance.now();
    const paso = (ahora) => {
      const progreso = Math.min(1, (ahora - inicio) / DURACION_ANIMACION_MS);
      const suavizado = 1 - (1 - progreso) ** 3; // desacelera al final
      numero.textContent = formatearPorcentaje(Math.round(valorFinal * suavizado * 10) / 10);
      if (progreso < 1) this.#animacion = requestAnimationFrame(paso);
    };
    this.#animacion = requestAnimationFrame(paso);
  }
}

customElements.define('anillo-progreso', AnilloProgreso);
