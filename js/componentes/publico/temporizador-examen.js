/**
 * <temporizador-examen> · Reloj del tiempo restante en tiempo real
 * ---------------------------------------------------------------------------
 * Atributos:
 *  - finaliza-en: marca de tiempo (ms) en que se acaba el examen.
 *  - duracion:    duración total en segundos (para la barra de progreso).
 *
 * Evento que emite: "tiempo-agotado" (una sola vez, al llegar a 00:00).
 *
 * ¿Por qué no se "descuenta 1 segundo" en cada tick?
 * Porque setInterval no es exacto: si el navegador está ocupado, o la pestaña
 * en segundo plano, los ticks se retrasan y el reloj se desfasaría. Aquí cada
 * tick recalcula: restante = finalizaEn − Date.now(). Así el reloj siempre es
 * exacto, no bloquea la página y sobrevive a recargas (finalizaEn está guardado).
 *
 * Accesibilidad: role="timer" (no anuncia cada segundo) + avisos hablados al
 * quedar 5 minutos, 1 minuto y 10 segundos.
 *
 * Personalización desde fuera (las variables CSS atraviesan el Shadow DOM):
 *  --tamano-tiempo (tamaño de los dígitos) y --ancho-temporizador (ancho mínimo).
 */
import { formatearReloj } from '../../utilidades/formato.js';
import { icono } from '../../utilidades/iconos.js';

const INTERVALO_MS = 250;
const AVISOS = [
  { segundos: 300, texto: 'Quedan 5 minutos.' },
  { segundos: 60, texto: 'Queda 1 minuto.' },
  { segundos: 10, texto: 'Quedan 10 segundos.' },
];

const plantilla = document.createElement('template');
plantilla.innerHTML = `
  <style>
    :host { display: block; }
    *, *::before, *::after { box-sizing: border-box; }

    .temporizador {
      --color-estado: var(--color-acento);
      --color-texto-estado: var(--color-texto);
      display: grid;
      gap: var(--espacio-2);
      min-width: var(--ancho-temporizador, 10rem);
      padding: var(--espacio-3) var(--espacio-4);
      border: 1px solid var(--color-borde);
      border-radius: var(--radio-lg);
      background-color: var(--color-superficie);
      font-family: var(--fuente-cuerpo);
      transition: background-color var(--transicion-media), border-color var(--transicion-media);
    }

    .fila {
      display: flex;
      align-items: center;
      gap: var(--espacio-2);
    }

    .icono {
      flex-shrink: 0;
      width: 1.5rem;
      height: 1.5rem;
      color: var(--color-acento-texto);
    }

    .textos {
      display: flex;
      flex-direction: column;
      line-height: 1.1;
    }

    .etiqueta {
      color: var(--color-texto-tenue);
      font-size: var(--texto-xs);
      font-weight: var(--peso-seminegrita);
      letter-spacing: 0.04em;
      text-transform: uppercase;
    }

    .tiempo {
      color: var(--color-texto-estado);
      font-family: var(--fuente-titulos);
      font-size: var(--tamano-tiempo, 1.75rem);
      font-weight: var(--peso-extra);
      font-variant-numeric: tabular-nums; /* los dígitos no "bailan" al cambiar */
      letter-spacing: 0.02em;
    }

    .barra {
      height: 6px;
      border-radius: var(--radio-completo);
      background-color: var(--color-superficie-alterna);
      overflow: hidden;
    }

    .barra__relleno {
      display: block;
      height: 100%;
      background-color: var(--color-estado);
      transform-origin: left;
      transition: transform 1s linear, background-color var(--transicion-media);
    }

    /* Queda poco tiempo */
    .temporizador--advertencia {
      border-color: var(--color-acento-borde);
      background-color: var(--color-acento-suave);
      --color-texto-estado: var(--color-acento-texto);
    }

    /* Tiempo crítico: rojo y latido */
    .temporizador--critico {
      --color-estado: var(--color-peligro);
      --color-texto-estado: var(--color-peligro-texto);
      border-color: var(--color-peligro-borde);
      background-color: var(--color-peligro-suave);
    }

    .temporizador--critico .icono { color: var(--color-peligro-texto); }
    .temporizador--critico .tiempo { animation: latido 1s ease-in-out infinite; }

    .sr-only {
      position: absolute;
      width: 1px;
      height: 1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
    }

    @keyframes latido {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.06); }
    }

    @media (prefers-reduced-motion: reduce) {
      .temporizador--critico .tiempo { animation: none; }
      .barra__relleno { transition: none; }
    }
  </style>

  <div class="temporizador">
    <div class="fila">
      ${icono('reloj')}
      <div class="textos">
        <span class="etiqueta" id="etiqueta">Tiempo restante</span>
        <span class="tiempo" role="timer" aria-labelledby="etiqueta">--:--</span>
      </div>
    </div>
    <div class="barra" aria-hidden="true"><span class="barra__relleno"></span></div>
    <span class="sr-only" aria-live="assertive" data-ref="aviso"></span>
  </div>
`;

class TemporizadorExamen extends HTMLElement {
  static observedAttributes = ['finaliza-en', 'duracion'];

  #intervalo = null;
  #ultimoSegundo = null;
  #agotado = false;
  #avisosDados = new Set();

  constructor() {
    super();
    this.attachShadow({ mode: 'open' }).append(plantilla.content.cloneNode(true));
  }

  connectedCallback() {
    this.#iniciar();
    // Al volver a la pestaña se actualiza al instante (sin esperar el siguiente tick)
    document.addEventListener('visibilitychange', this.#actualizar);
  }

  disconnectedCallback() {
    clearInterval(this.#intervalo);
    document.removeEventListener('visibilitychange', this.#actualizar);
  }

  attributeChangedCallback() {
    if (this.isConnected) this.#iniciar();
  }

  /** Segundos que faltan (0 si ya terminó). */
  get segundosRestantes() {
    const finalizaEn = Number(this.getAttribute('finaliza-en'));
    return Math.max(0, Math.ceil((finalizaEn - Date.now()) / 1000));
  }

  /** Detiene el reloj (p. ej. cuando el estudiante termina antes). */
  detener() {
    clearInterval(this.#intervalo);
  }

  #iniciar() {
    clearInterval(this.#intervalo);
    this.#agotado = false;
    this.#ultimoSegundo = null;
    // Los avisos que ya pasaron no se repiten (p. ej. al recargar con 2 minutos restantes)
    const restantes = this.segundosRestantes;
    this.#avisosDados = new Set(AVISOS.filter((aviso) => restantes <= aviso.segundos).map((aviso) => aviso.segundos));
    this.#actualizar();
    this.#intervalo = setInterval(this.#actualizar, INTERVALO_MS);
  }

  #actualizar = () => {
    const restantes = this.segundosRestantes;

    // Solo se toca el DOM cuando cambia el segundo mostrado
    if (restantes !== this.#ultimoSegundo) {
      this.#ultimoSegundo = restantes;
      this.#pintar(restantes);
      this.#anunciar(restantes);
    }

    if (restantes === 0 && !this.#agotado) {
      this.#agotado = true;
      clearInterval(this.#intervalo);
      this.dispatchEvent(new CustomEvent('tiempo-agotado', { bubbles: true, composed: true }));
    }
  };

  #pintar(restantes) {
    const raiz = this.shadowRoot;
    const duracion = Math.max(1, Number(this.getAttribute('duracion')) || 1);
    const critico = restantes <= Math.max(10, Math.min(60, duracion * 0.1));
    const advertencia = !critico && restantes <= duracion * 0.25;

    raiz.querySelector('.tiempo').textContent = formatearReloj(restantes);
    raiz.querySelector('.barra__relleno').style.transform = `scaleX(${Math.min(1, restantes / duracion)})`;
    const contenedor = raiz.querySelector('.temporizador');
    contenedor.classList.toggle('temporizador--critico', critico);
    contenedor.classList.toggle('temporizador--advertencia', advertencia);
  }

  #anunciar(restantes) {
    const duracion = Number(this.getAttribute('duracion')) || 0;
    for (const aviso of AVISOS) {
      if (restantes <= aviso.segundos && duracion > aviso.segundos && !this.#avisosDados.has(aviso.segundos)) {
        this.#avisosDados.add(aviso.segundos);
        this.shadowRoot.querySelector('[data-ref="aviso"]').textContent = aviso.texto;
      }
    }
  }
}

customElements.define('temporizador-examen', TemporizadorExamen);
