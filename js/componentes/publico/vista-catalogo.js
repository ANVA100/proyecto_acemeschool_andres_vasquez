/**
 * <vista-catalogo> · Catálogo público de exámenes (ruta #/)
 * ---------------------------------------------------------------------------
 * Módulo público: el estudiante no necesita iniciar sesión.
 *
 * 1. Muestra los exámenes DISPONIBLES (los que tienen al menos una pregunta)
 *    con su título, tiempo para resolverlo y porcentaje para aprobar.
 * 2. Al elegir uno, pide identificación y nombre completo (<dialogo-estudiante>).
 * 3. Crea el intento y lleva a la vista del examen (#/examen/:id).
 *
 * Si en este navegador hay un examen en curso, muestra un aviso para retomarlo.
 */
import { navegar } from '../../enrutador.js';
import { estaDisponible, obtenerExamenPorId, obtenerExamenes } from '../../servicios/servicio-examenes.js';
import {
  iniciarIntento,
  obtenerIntentoActivo,
  obtenerSegundosRestantes,
} from '../../servicios/servicio-intentos.js';
import { escaparHTML } from '../../utilidades/dom.js';
import { normalizarTexto, obtenerPrimerNombre, pluralizar } from '../../utilidades/formato.js';
import { icono } from '../../utilidades/iconos.js';
import { notificar } from '../compartidos/contenedor-notificaciones.js';
import { pedirDatosEstudiante } from './dialogo-estudiante.js';
import './tarjeta-examen.js';

const PASOS = [
  { icono: 'examen', titulo: 'Elige un examen', texto: 'Revisa el tiempo y el porcentaje para aprobar.' },
  { icono: 'usuario', titulo: 'Identifícate', texto: 'Solo tu número de identificación y tu nombre.' },
  { icono: 'reloj', titulo: 'Responde a tiempo', texto: 'Al terminar verás tu resultado al instante.' },
];

class VistaCatalogo extends HTMLElement {
  #termino = '';
  #rejilla;
  #contador;

  connectedCallback() {
    const pasos = PASOS.map(
      (paso, indice) => `
        <li class="paso escalonado" style="--indice: ${indice + 1}">
          <span class="paso__icono">${icono(paso.icono)}</span>
          <span class="paso__texto"><strong>${indice + 1}. ${paso.titulo}</strong><span>${paso.texto}</span></span>
        </li>`
    ).join('');

    this.innerHTML = `
      <section class="hero hero--catalogo" aria-labelledby="titulo-catalogo">
        <span class="insignia insignia--acento">${icono('birrete')} Acme School</span>
        <h1 class="hero__titulo" id="titulo-catalogo">Exámenes <span class="texto-marca">disponibles</span></h1>
        <p class="hero__descripcion">Elige un examen, identifícate y respóndelo antes de que se acabe el tiempo.</p>
        <ol class="pasos" role="list">${pasos}</ol>
      </section>

      <div data-ref="aviso-intento"></div>

      <section class="seccion" aria-labelledby="titulo-lista-examenes">
        <div class="catalogo__barra">
          <div>
            <h2 class="seccion__titulo" id="titulo-lista-examenes">Elige tu examen</h2>
            <p class="texto-tenue texto-pequeno" data-ref="contador" aria-live="polite"></p>
          </div>
          <campo-busqueda class="catalogo__buscador" etiqueta="Buscar exámenes"
            placeholder="Buscar por título o código…"></campo-busqueda>
        </div>
        <div class="rejilla-tarjetas" data-ref="rejilla"></div>
      </section>`;

    this.#rejilla = this.querySelector('[data-ref="rejilla"]');
    this.#contador = this.querySelector('[data-ref="contador"]');

    this.addEventListener('seleccionar-examen', this.#alSeleccionar);
    this.addEventListener('buscar', this.#alBuscar);

    this.#renderizarAvisoIntento();
    this.#renderizarExamenes();
  }

  /** Exámenes que el estudiante puede presentar, ordenados por título. */
  #obtenerDisponibles() {
    return obtenerExamenes()
      .filter(estaDisponible)
      .sort((a, b) => a.titulo.localeCompare(b.titulo, 'es'));
  }

  #renderizarExamenes() {
    const disponibles = this.#obtenerDisponibles();
    const termino = normalizarTexto(this.#termino);
    const visibles = termino
      ? disponibles.filter((examen) =>
          [examen.titulo, examen.codigo, examen.descripcion].some((valor) => normalizarTexto(valor).includes(termino))
        )
      : disponibles;

    this.#contador.textContent = termino
      ? `Mostrando ${visibles.length} de ${pluralizar(disponibles.length, 'examen', 'exámenes')}`
      : pluralizar(disponibles.length, 'examen disponible', 'exámenes disponibles');

    if (visibles.length === 0) {
      this.#rejilla.innerHTML = termino
        ? `<estado-vacio class="rejilla-tarjetas__vacio" icono="buscar" titulo="Sin resultados"
             mensaje="Ningún examen coincide con tu búsqueda."></estado-vacio>`
        : `<estado-vacio class="rejilla-tarjetas__vacio" icono="examen" titulo="Todavía no hay exámenes disponibles"
             mensaje="Vuelve más tarde: tus docentes están preparando las preguntas."></estado-vacio>`;
      return;
    }

    // Las tarjetas se crean con createElement + setAttribute: los textos
    // nunca se interpretan como HTML, así que no hace falta escaparlos.
    const tarjetas = visibles.map((examen, indice) => {
      const tarjeta = document.createElement('tarjeta-examen');
      tarjeta.setAttribute('examen-id', examen.id);
      tarjeta.setAttribute('codigo', examen.codigo);
      tarjeta.setAttribute('titulo', examen.titulo);
      tarjeta.setAttribute('descripcion', examen.descripcion);
      tarjeta.setAttribute('tiempo', examen.tiempoMinutos);
      tarjeta.setAttribute('porcentaje', examen.porcentajeAprobacion);
      tarjeta.setAttribute('preguntas', examen.preguntas.length);
      tarjeta.toggleAttribute('aleatorio', Boolean(examen.mezclarPreguntas));
      tarjeta.classList.add('escalonado');
      tarjeta.style.setProperty('--indice', Math.min(indice, 10));
      return tarjeta;
    });
    this.#rejilla.replaceChildren(...tarjetas);
  }

  /** Aviso para retomar un examen que quedó en curso en este navegador. */
  #renderizarAvisoIntento() {
    const contenedor = this.querySelector('[data-ref="aviso-intento"]');
    const intento = obtenerIntentoActivo();
    const examen = intento ? obtenerExamenPorId(intento.examenId) : null;
    if (!intento || !examen) {
      contenedor.innerHTML = '';
      return;
    }

    const segundos = obtenerSegundosRestantes(intento);
    const detalle =
      segundos > 0
        ? `Te quedan aproximadamente ${pluralizar(Math.ceil(segundos / 60), 'minuto')}.`
        : 'El tiempo se agotó: ábrelo para ver tu resultado.';

    contenedor.innerHTML = `
      <div class="aviso-intento animar-entrada" role="status">
        <span class="aviso-intento__icono">${icono('reloj')}</span>
        <div class="aviso-intento__texto">
          <strong>${escaparHTML(obtenerPrimerNombre(intento.estudiante.nombreCompleto))}, tienes un examen en curso:
            ${escaparHTML(examen.titulo)}</strong>
          <span>${detalle}</span>
        </div>
        <a class="btn btn--acento" href="#/examen/${encodeURIComponent(examen.id)}">
          Continuar examen ${icono('flecha-derecha')}
        </a>
      </div>`;
  }

  #alSeleccionar = async (evento) => {
    const tarjeta = evento.target;
    const examen = obtenerExamenPorId(evento.detail.id);
    if (!examen || !estaDisponible(examen)) {
      notificar('Este examen ya no está disponible.', { tipo: 'error' });
      this.#renderizarExamenes();
      return;
    }

    // Si ya hay un examen en curso, solo se puede continuar ese
    const activo = obtenerIntentoActivo();
    if (activo) {
      if (activo.examenId === examen.id) {
        navegar(`/examen/${examen.id}`);
      } else {
        notificar('Ya tienes un examen en curso. Termínalo antes de empezar otro.', { tipo: 'advertencia' });
        this.querySelector('.aviso-intento')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    const estudiante = await pedirDatosEstudiante(examen);
    if (!estudiante) {
      tarjeta.focus(); // devuelve el foco a la tarjeta desde la que se abrió el diálogo
      return;
    }

    try {
      iniciarIntento(examen.id, estudiante);
      notificar(`¡Éxitos, ${obtenerPrimerNombre(estudiante.nombreCompleto)}! El tiempo ya está corriendo.`, {
        tipo: 'info',
      });
      navegar(`/examen/${examen.id}`);
    } catch (error) {
      notificar(error.message, { tipo: 'error' });
    }
  };

  #alBuscar = (evento) => {
    this.#termino = evento.detail.termino;
    this.#renderizarExamenes();
  };
}

customElements.define('vista-catalogo', VistaCatalogo);
