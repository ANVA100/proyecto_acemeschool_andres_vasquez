/**
 * <dialogo-confirmacion> · Ventana para confirmar acciones importantes
 * ---------------------------------------------------------------------------
 * Reemplaza al confirm() nativo del navegador con un diálogo accesible y con
 * el estilo de la app. Usa el elemento <dialog>, que ya trae:
 *  - fondo que bloquea la página (modal),
 *  - cierre con la tecla Escape,
 *  - foco atrapado dentro del diálogo mientras está abierto.
 *
 * Uso (devuelve una promesa que se resuelve en true o false):
 *   import { confirmar } from '.../dialogo-confirmacion.js';
 *   const acepto = await confirmar({
 *     titulo: '¿Eliminar usuario?',
 *     mensaje: 'Esta acción no se puede deshacer.',
 *     textoConfirmar: 'Eliminar',
 *   });
 *
 * Shadow DOM + <link> a componentes.css: reutiliza los estilos de botones y
 * diálogos del sistema de diseño sin duplicarlos.
 */
import { icono } from '../../utilidades/iconos.js';

const ICONO_POR_TIPO = Object.freeze({ peligro: 'alerta', advertencia: 'alerta', info: 'info' });

const plantilla = document.createElement('template');
plantilla.innerHTML = `
  <link rel="stylesheet" href="css/componentes.css">
  <link rel="stylesheet" href="css/animaciones.css">
  <style>
    *, *::before, *::after { box-sizing: border-box; }
    h2, p { margin: 0; }

    .dialogo {
      width: min(100% - 2rem, 28rem);
      font-family: var(--fuente-cuerpo);
      line-height: var(--interlineado-normal);
    }

    .cuerpo {
      display: flex;
      align-items: flex-start;
      gap: var(--espacio-4);
    }

    .icono-tipo {
      display: grid;
      flex-shrink: 0;
      place-items: center;
      width: 2.75rem;
      height: 2.75rem;
      border-radius: 50%;
      background-color: var(--color-peligro-suave);
      color: var(--color-peligro-texto);
    }

    .icono-tipo svg { width: 1.375rem; height: 1.375rem; }

    .dialogo[data-tipo='advertencia'] .icono-tipo {
      background-color: var(--color-acento-suave);
      color: var(--color-acento-texto);
    }

    .dialogo[data-tipo='info'] .icono-tipo {
      background-color: var(--color-primario-suave);
      color: var(--color-primario-texto);
    }

    .dialogo__titulo {
      font-family: var(--fuente-titulos);
      line-height: 1.3;
    }
  </style>

  <dialog class="dialogo" aria-labelledby="titulo" aria-describedby="mensaje">
    <div class="dialogo__contenido">
      <div class="cuerpo">
        <span class="icono-tipo"></span>
        <div>
          <h2 class="dialogo__titulo" id="titulo"></h2>
          <p class="dialogo__mensaje" id="mensaje"></p>
        </div>
      </div>
      <div class="dialogo__acciones">
        <button type="button" class="btn btn--fantasma" data-respuesta="false"></button>
        <button type="button" class="btn" data-respuesta="true"></button>
      </div>
    </div>
  </dialog>
`;

class DialogoConfirmacion extends HTMLElement {
  #dialogo;
  #resolver = null;

  constructor() {
    super();
    this.attachShadow({ mode: 'open' }).append(plantilla.content.cloneNode(true));
    this.#dialogo = this.shadowRoot.querySelector('dialog');
  }

  connectedCallback() {
    this.#dialogo.addEventListener('click', this.#alHacerClic);
    this.#dialogo.addEventListener('close', this.#alCerrar);
  }

  disconnectedCallback() {
    this.#dialogo.removeEventListener('click', this.#alHacerClic);
    this.#dialogo.removeEventListener('close', this.#alCerrar);
  }

  /**
   * Abre el diálogo y espera la respuesta del usuario.
   * @param {object} opciones
   * @param {string} opciones.titulo
   * @param {string} [opciones.mensaje]
   * @param {string} [opciones.textoConfirmar='Aceptar']
   * @param {string} [opciones.textoCancelar='Cancelar']
   * @param {'peligro'|'advertencia'|'info'} [opciones.tipo='peligro']
   * @returns {Promise<boolean>} true si confirmó, false si canceló.
   */
  abrir({ titulo, mensaje = '', textoConfirmar = 'Aceptar', textoCancelar = 'Cancelar', tipo = 'peligro' }) {
    if (this.#dialogo.open) return Promise.resolve(false);

    const tipoValido = ICONO_POR_TIPO[tipo] ? tipo : 'peligro';
    const raiz = this.shadowRoot;
    raiz.querySelector('#titulo').textContent = titulo;
    raiz.querySelector('#mensaje').textContent = mensaje;
    raiz.querySelector('.icono-tipo').innerHTML = icono(ICONO_POR_TIPO[tipoValido]);

    const botonCancelar = raiz.querySelector('[data-respuesta="false"]');
    const botonConfirmar = raiz.querySelector('[data-respuesta="true"]');
    botonCancelar.textContent = textoCancelar;
    botonConfirmar.textContent = textoConfirmar;
    botonConfirmar.className = `btn ${tipoValido === 'peligro' ? 'btn--peligro' : 'btn--primario'}`;

    this.#dialogo.dataset.tipo = tipoValido;
    this.#dialogo.returnValue = '';
    this.#dialogo.showModal();
    // En acciones peligrosas el foco empieza en "Cancelar" para evitar confirmaciones accidentales
    (tipoValido === 'peligro' ? botonCancelar : botonConfirmar).focus();

    return new Promise((resolver) => {
      this.#resolver = resolver;
    });
  }

  #alHacerClic = (evento) => {
    const boton = evento.target.closest('[data-respuesta]');
    if (boton) {
      this.#dialogo.close(boton.dataset.respuesta);
    } else if (evento.target === this.#dialogo) {
      this.#dialogo.close('false'); // clic sobre el fondo oscuro
    }
  };

  /** Se ejecuta al cerrar por cualquier vía (botones, Escape o clic en el fondo). */
  #alCerrar = () => {
    this.#resolver?.(this.#dialogo.returnValue === 'true');
    this.#resolver = null;
  };
}

customElements.define('dialogo-confirmacion', DialogoConfirmacion);

/**
 * Atajo para pedir confirmación desde cualquier parte de la app.
 * @param {Parameters<DialogoConfirmacion['abrir']>[0]} opciones
 * @returns {Promise<boolean>}
 */
export function confirmar(opciones) {
  let dialogo = document.querySelector('dialogo-confirmacion');
  if (!dialogo) {
    dialogo = document.createElement('dialogo-confirmacion');
    document.body.append(dialogo);
  }
  return dialogo.abrir(opciones);
}
