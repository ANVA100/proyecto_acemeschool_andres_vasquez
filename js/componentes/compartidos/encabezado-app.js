/**
 * <encabezado-app> · Barra superior de la aplicación
 * ---------------------------------------------------------------------------
 * Web Component (Custom Element) en light DOM: usa los estilos globales de
 * layout.css para mantener el mismo aspecto que el resto de la app.
 *
 * - Muestra el logo, los enlaces de navegación y el botón de modo oscuro.
 * - Marca el enlace de la vista actual (escucha el evento "ruta-cambiada").
 * - En pantallas pequeñas los enlaces se agrupan en un menú desplegable.
 * - Mientras se presenta un examen (modo "examen") oculta la navegación
 *   para que el estudiante no se distraiga.
 */
import { alternarTema, obtenerTema } from '../../servicios/servicio-tema.js';
import { escaparHTML } from '../../utilidades/dom.js';
import { icono } from '../../utilidades/iconos.js';

/** Enlaces visibles para cualquier visitante. */
const ENLACES_PUBLICOS = [
  { ruta: '/', texto: 'Exámenes', icono: 'examen' },
  { ruta: '/login', texto: 'Acceso personal', icono: 'entrar' },
];

class EncabezadoApp extends HTMLElement {
  #rutaActual = '/';
  #modo = 'normal';

  connectedCallback() {
    this.#renderizar();
    this.addEventListener('click', this.#alHacerClic);
    window.addEventListener('ruta-cambiada', this.#alCambiarRuta);
    window.addEventListener('tema-cambiado', this.#actualizarBotonTema);
    document.addEventListener('keydown', this.#alPresionarTecla);
    document.addEventListener('click', this.#alHacerClicFuera);
  }

  disconnectedCallback() {
    this.removeEventListener('click', this.#alHacerClic);
    window.removeEventListener('ruta-cambiada', this.#alCambiarRuta);
    window.removeEventListener('tema-cambiado', this.#actualizarBotonTema);
    document.removeEventListener('keydown', this.#alPresionarTecla);
    document.removeEventListener('click', this.#alHacerClicFuera);
  }

  /** Enlaces de navegación según el estado de la app. */
  #obtenerEnlaces() {
    return ENLACES_PUBLICOS;
  }

  #renderizar() {
    const enModoExamen = this.#modo === 'examen';
    const enlaces = this.#obtenerEnlaces()
      .map(
        (enlace) => `
          <li>
            <a class="navegacion__enlace" href="#${enlace.ruta}" data-ruta="${enlace.ruta}">
              ${icono(enlace.icono)}<span>${escaparHTML(enlace.texto)}</span>
            </a>
          </li>`
      )
      .join('');

    this.innerHTML = `
      <header class="encabezado">
        <div class="contenedor encabezado__contenido">
          <a class="marca" href="#/" aria-label="Acme School, ir al inicio">
            <img class="marca__logo" src="assets/img/logo.svg" alt="" width="36" height="36">
            <span class="marca__texto">Acme <strong>School</strong></span>
          </a>

          ${
            enModoExamen
              ? ''
              : `<nav class="navegacion" id="navegacion-principal" aria-label="Navegación principal">
                   <ul class="navegacion__lista" role="list">${enlaces}</ul>
                 </nav>`
          }

          <div class="encabezado__acciones">
            <button type="button" class="btn btn--fantasma btn--icono" data-accion="alternar-tema"
              aria-label="Modo oscuro" title="Cambiar tema"></button>
            ${
              enModoExamen
                ? ''
                : `<button type="button" class="btn btn--fantasma btn--icono encabezado__boton-menu"
                     data-accion="alternar-menu" aria-controls="navegacion-principal"
                     aria-expanded="false" aria-label="Abrir menú">${icono('menu')}</button>`
            }
          </div>
        </div>
      </header>`;

    this.#actualizarBotonTema();
    this.#marcarEnlaceActivo();
  }

  /** Muestra luna en tema claro y sol en tema oscuro; aria-pressed indica el estado. */
  #actualizarBotonTema = () => {
    const boton = this.querySelector('[data-accion="alternar-tema"]');
    if (!boton) return;
    const esOscuro = obtenerTema() === 'oscuro';
    boton.innerHTML = icono(esOscuro ? 'sol' : 'luna');
    boton.setAttribute('aria-pressed', String(esOscuro));
  };

  /** Resalta el enlace de la sección actual (aria-current="page"). */
  #marcarEnlaceActivo() {
    for (const enlace of this.querySelectorAll('[data-ruta]')) {
      const ruta = enlace.dataset.ruta;
      const estaActivo = ruta === '/' ? this.#rutaActual === '/' : this.#rutaActual.startsWith(ruta);
      if (estaActivo) {
        enlace.setAttribute('aria-current', 'page');
      } else {
        enlace.removeAttribute('aria-current');
      }
    }
  }

  #alternarMenu(abrir) {
    const navegacion = this.querySelector('.navegacion');
    const boton = this.querySelector('[data-accion="alternar-menu"]');
    if (!navegacion || !boton) return;
    const estaAbierto = navegacion.classList.contains('navegacion--abierta');
    const debeAbrir = abrir ?? !estaAbierto;
    if (debeAbrir === estaAbierto) return;
    navegacion.classList.toggle('navegacion--abierta', debeAbrir);
    boton.setAttribute('aria-expanded', String(debeAbrir));
    boton.setAttribute('aria-label', debeAbrir ? 'Cerrar menú' : 'Abrir menú');
    boton.innerHTML = icono(debeAbrir ? 'cerrar' : 'menu');
  }

  #alCambiarRuta = (evento) => {
    const { ruta, definicion } = evento.detail;
    const modoNuevo = definicion.modo === 'examen' ? 'examen' : 'normal';
    this.#rutaActual = ruta;

    if (modoNuevo !== this.#modo) {
      this.#modo = modoNuevo;
      this.#renderizar();
    } else {
      this.#marcarEnlaceActivo();
      this.#alternarMenu(false);
    }
  };

  #alHacerClic = (evento) => {
    const accion = evento.target.closest('[data-accion]')?.dataset.accion;
    if (accion === 'alternar-tema') alternarTema();
    if (accion === 'alternar-menu') this.#alternarMenu();
    if (evento.target.closest('.navegacion__enlace')) this.#alternarMenu(false);
  };

  #alPresionarTecla = (evento) => {
    if (evento.key === 'Escape') this.#alternarMenu(false);
  };

  #alHacerClicFuera = (evento) => {
    if (!this.contains(evento.target)) this.#alternarMenu(false);
  };
}

customElements.define('encabezado-app', EncabezadoApp);
