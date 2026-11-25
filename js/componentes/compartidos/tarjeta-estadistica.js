/**
 * <tarjeta-estadistica> · Indicador numérico con ícono
 * ---------------------------------------------------------------------------
 * Atributos:
 *  - icono:   nombre del ícono (utilidades/iconos.js).
 *  - titulo:  qué mide (p. ej. "Intentos").
 *  - valor:   el número o texto principal (p. ej. "12" o "75 %").
 *  - detalle: texto secundario opcional.
 *  - tono:    "primario" | "exito" | "peligro" | "acento" (color del ícono).
 *
 * @example
 *   <tarjeta-estadistica icono="medalla" titulo="Aprobados" valor="9"
 *     detalle="75 % de los intentos" tono="exito"></tarjeta-estadistica>
 */
import { icono } from '../../utilidades/iconos.js';

const plantilla = document.createElement('template');
plantilla.innerHTML = `
  <style>
    :host {
      --fondo-icono: var(--color-primario-suave);
      --color-icono: var(--color-primario-texto);
      display: block;
    }

    /* El reset de base.css no entra al Shadow DOM: sin esto, height:100% + padding desborda */
    *, *::before, *::after { box-sizing: border-box; }

    :host([tono='exito']) { --fondo-icono: var(--color-exito-suave); --color-icono: var(--color-exito-texto); }
    :host([tono='peligro']) { --fondo-icono: var(--color-peligro-suave); --color-icono: var(--color-peligro-texto); }
    :host([tono='acento']) { --fondo-icono: var(--color-acento-suave); --color-icono: var(--color-acento-texto); }

    .tarjeta {
      display: flex;
      align-items: center;
      gap: var(--espacio-4);
      height: 100%;
      padding: var(--espacio-5);
      border: 1px solid var(--color-borde);
      border-radius: var(--radio-lg);
      background-color: var(--color-superficie);
      box-shadow: var(--sombra-sm);
      font-family: var(--fuente-cuerpo);
    }

    .icono {
      display: grid;
      flex-shrink: 0;
      place-items: center;
      width: 3rem;
      height: 3rem;
      border-radius: var(--radio-md);
      background-color: var(--fondo-icono);
      color: var(--color-icono);
    }

    .icono svg { width: 1.5rem; height: 1.5rem; }

    .textos {
      display: flex;
      flex-direction: column;
      min-width: 0;
    }

    .titulo {
      color: var(--color-texto-secundario);
      font-size: var(--texto-sm);
      font-weight: var(--peso-medio);
    }

    .valor {
      color: var(--color-texto);
      font-family: var(--fuente-titulos);
      font-size: var(--texto-2xl);
      font-weight: var(--peso-extra);
      line-height: 1.2;
      font-variant-numeric: tabular-nums;
    }

    .detalle {
      color: var(--color-texto-tenue);
      font-size: var(--texto-xs);
    }

    .detalle:empty { display: none; }
  </style>

  <div class="tarjeta">
    <span class="icono" aria-hidden="true"></span>
    <p class="textos" style="margin: 0">
      <span class="titulo"></span>
      <span class="valor"></span>
      <span class="detalle"></span>
    </p>
  </div>
`;

class TarjetaEstadistica extends HTMLElement {
  static observedAttributes = ['icono', 'titulo', 'valor', 'detalle'];

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
    raiz.querySelector('.icono').innerHTML = icono(this.getAttribute('icono') || 'grafica');
    raiz.querySelector('.titulo').textContent = this.getAttribute('titulo') ?? '';
    raiz.querySelector('.valor').textContent = this.getAttribute('valor') ?? '';
    raiz.querySelector('.detalle').textContent = this.getAttribute('detalle') ?? '';
  }
}

customElements.define('tarjeta-estadistica', TarjetaEstadistica);
