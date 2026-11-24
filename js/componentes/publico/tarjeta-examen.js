/**
 * <tarjeta-examen> · Tarjeta de un examen en el catálogo público
 * ---------------------------------------------------------------------------
 * Web Component con Shadow DOM que recibe todos sus datos por ATRIBUTOS:
 *
 *   <tarjeta-examen examen-id="..." codigo="JS-101" titulo="Fundamentos..."
 *     descripcion="..." tiempo="10" porcentaje="60" preguntas="6" aleatorio>
 *   </tarjeta-examen>
 *
 * Muestra lo que pide el catálogo: título, tiempo para resolverlo y
 * porcentaje para aprobar (además del código, la descripción y las preguntas).
 *
 * Evento que emite: "seleccionar-examen" → detail: { id }
 */
import { pluralizar } from '../../utilidades/formato.js';
import { icono } from '../../utilidades/iconos.js';

const plantilla = document.createElement('template');
plantilla.innerHTML = `
  <link rel="stylesheet" href="css/componentes.css">
  <style>
    :host { display: block; }
    *, *::before, *::after { box-sizing: border-box; }
    [hidden] { display: none !important; }
    h3, p, dl, dd { margin: 0; }

    .tarjeta {
      position: relative;
      display: flex;
      flex-direction: column;
      gap: var(--espacio-4);
      height: 100%;
      padding: var(--espacio-6);
      border: 1px solid var(--color-borde);
      border-radius: var(--radio-lg);
      background-color: var(--color-superficie);
      box-shadow: var(--sombra-sm);
      font-family: var(--fuente-cuerpo);
      overflow: hidden;
      transition:
        transform var(--transicion-media),
        box-shadow var(--transicion-media),
        border-color var(--transicion-media);
    }

    /* Franja superior con el degradado de la marca */
    .tarjeta::before {
      content: '';
      position: absolute;
      inset: 0 0 auto;
      height: 4px;
      background: var(--degradado-marca);
    }

    .tarjeta:hover,
    .tarjeta:focus-within {
      transform: translateY(-4px);
      border-color: var(--color-primario-borde);
      box-shadow: var(--sombra-lg);
    }

    .cabecera {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: var(--espacio-2);
    }

    .titulo {
      color: var(--color-texto);
      font-family: var(--fuente-titulos);
      font-size: var(--texto-xl);
      line-height: 1.3;
    }

    .descripcion {
      display: -webkit-box;
      overflow: hidden;
      color: var(--color-texto-secundario);
      font-size: var(--texto-sm);
      -webkit-box-orient: vertical;
      -webkit-line-clamp: 3;
      line-clamp: 3;
    }

    /* Datos del examen: tiempo, porcentaje y preguntas */
    .datos {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: var(--espacio-2);
      margin-top: auto;
      padding-top: var(--espacio-4);
      border-top: 1px solid var(--color-borde);
    }

    .dato {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.15rem;
      padding: var(--espacio-2);
      border-radius: var(--radio-md);
      background-color: var(--color-superficie-alterna);
      text-align: center;
    }

    .dato svg {
      width: 1.1rem;
      height: 1.1rem;
      color: var(--color-primario-texto);
    }

    .dato dt {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.15rem;
      color: var(--color-texto-tenue);
      font-size: var(--texto-xs);
    }

    .dato dd {
      color: var(--color-texto);
      font-size: var(--texto-base);
      font-weight: var(--peso-negrita);
    }

    .dato--tiempo svg { color: var(--color-acento-texto); }

    @media (prefers-reduced-motion: reduce) {
      .tarjeta, .tarjeta:hover, .tarjeta:focus-within { transform: none; }
    }
  </style>

  <article class="tarjeta" aria-labelledby="titulo">
    <div class="cabecera">
      <span class="codigo" data-ref="codigo"></span>
      <span class="insignia insignia--primario" data-ref="aleatorio" hidden>${icono('reiniciar')} Orden aleatorio</span>
    </div>
    <h3 class="titulo" id="titulo"></h3>
    <p class="descripcion" data-ref="descripcion"></p>

    <dl class="datos">
      <div class="dato dato--tiempo">
        <dt>${icono('reloj')} Tiempo</dt>
        <dd data-ref="tiempo"></dd>
      </div>
      <div class="dato">
        <dt>${icono('porcentaje')} Aprobación</dt>
        <dd data-ref="porcentaje"></dd>
      </div>
      <div class="dato">
        <dt>${icono('lista')} Preguntas</dt>
        <dd data-ref="preguntas"></dd>
      </div>
    </dl>

    <button type="button" class="btn btn--primario btn--bloque">
      Presentar examen ${icono('flecha-derecha')}
    </button>
  </article>
`;

class TarjetaExamen extends HTMLElement {
  static observedAttributes = ['codigo', 'titulo', 'descripcion', 'tiempo', 'porcentaje', 'preguntas', 'aleatorio'];

  constructor() {
    super();
    this.attachShadow({ mode: 'open' }).append(plantilla.content.cloneNode(true));
    this.shadowRoot.querySelector('button').addEventListener('click', () => {
      this.dispatchEvent(
        new CustomEvent('seleccionar-examen', {
          detail: { id: this.getAttribute('examen-id') },
          bubbles: true,
          composed: true, // permite que el evento salga del Shadow DOM
        })
      );
    });
  }

  connectedCallback() {
    this.#actualizar();
  }

  attributeChangedCallback() {
    this.#actualizar();
  }

  /** Enfoca el botón de la tarjeta (p. ej. al cerrar el diálogo del estudiante). */
  focus() {
    this.shadowRoot.querySelector('button').focus();
  }

  #actualizar() {
    const raiz = this.shadowRoot;
    const ref = (nombre) => raiz.querySelector(`[data-ref="${nombre}"]`);
    const titulo = this.getAttribute('titulo') ?? '';
    const cantidadPreguntas = Number(this.getAttribute('preguntas') ?? 0);

    raiz.querySelector('#titulo').textContent = titulo;
    ref('codigo').textContent = this.getAttribute('codigo') ?? '';
    ref('descripcion').textContent = this.getAttribute('descripcion') ?? '';
    ref('tiempo').textContent = `${this.getAttribute('tiempo') ?? '–'} min`;
    ref('porcentaje').textContent = `${this.getAttribute('porcentaje') ?? '–'} %`;
    ref('preguntas').textContent = String(cantidadPreguntas);
    ref('aleatorio').hidden = !this.hasAttribute('aleatorio');
    raiz.querySelector('button').setAttribute(
      'aria-label',
      `Presentar el examen ${titulo}: ${pluralizar(cantidadPreguntas, 'pregunta')}, ${this.getAttribute('tiempo')} minutos`
    );
  }
}

customElements.define('tarjeta-examen', TarjetaExamen);
