/**
 * <lista-preguntas> · Preguntas de un examen con sus respuestas
 * ---------------------------------------------------------------------------
 * Muestra cada pregunta numerada con sus respuestas (la correcta marcada con
 * texto e ícono, no solo con color) y botones para reordenar, editar y eliminar.
 *
 * Propiedad: preguntas (arreglo).
 * Eventos que emite:
 *  - "editar-pregunta"   → detail: { id }
 *  - "eliminar-pregunta" → detail: { id }
 *  - "mover-pregunta"    → detail: { id, desplazamiento }  (-1 sube, +1 baja)
 */
import { escaparHTML } from '../../utilidades/dom.js';
import { obtenerLetra } from '../../utilidades/formato.js';
import { icono } from '../../utilidades/iconos.js';

class ListaPreguntas extends HTMLElement {
  #preguntas = [];

  connectedCallback() {
    this.addEventListener('click', this.#alHacerClic);
    this.#renderizar();
  }

  disconnectedCallback() {
    this.removeEventListener('click', this.#alHacerClic);
  }

  set preguntas(lista) {
    this.#preguntas = lista;
    if (this.isConnected) this.#renderizar();
  }

  /** Resalta brevemente una pregunta (después de crearla, editarla o moverla). */
  resaltar(id) {
    const tarjeta = this.querySelector(`[data-id="${CSS.escape(id)}"]`);
    if (!tarjeta) return;
    tarjeta.classList.remove('escalonado');
    tarjeta.classList.add('animar-destello');
    tarjeta.addEventListener('animationend', () => tarjeta.classList.remove('animar-destello'), { once: true });
  }

  /**
   * Devuelve el foco a un botón tras volver a pintar (p. ej. al reordenar con
   * teclado). Si ese botón quedó deshabilitado (la pregunta llegó al inicio o
   * al final), enfoca el botón contrario para no perder el foco.
   */
  enfocarAccion(id, accion) {
    const tarjeta = this.querySelector(`[data-id="${CSS.escape(id)}"]`);
    const alternativa = accion === 'subir' ? 'bajar' : 'subir';
    const boton =
      tarjeta?.querySelector(`[data-accion="${accion}"]:not(:disabled)`) ??
      tarjeta?.querySelector(`[data-accion="${alternativa}"]:not(:disabled)`) ??
      tarjeta?.querySelector('[data-accion="editar"]');
    boton?.focus();
  }

  #renderizarRespuestas(respuestas) {
    return respuestas
      .map(
        (respuesta, indice) => `
          <li class="respuesta-vista ${respuesta.esCorrecta ? 'respuesta-vista--correcta' : ''}">
            <span class="respuesta-vista__letra" aria-hidden="true">${obtenerLetra(indice)}</span>
            <span class="respuesta-vista__texto">${escaparHTML(respuesta.descripcion)}</span>
            ${respuesta.esCorrecta ? `<span class="insignia insignia--exito">${icono('check')} Correcta</span>` : ''}
          </li>`
      )
      .join('');
  }

  #renderizarPregunta(pregunta, indice, total) {
    const numero = indice + 1;
    return `
      <li class="pregunta-tarjeta escalonado" data-id="${escaparHTML(pregunta.id)}" style="--indice: ${Math.min(indice, 10)}">
        <div class="pregunta-tarjeta__encabezado">
          <span class="pregunta-tarjeta__numero" aria-hidden="true">${numero}</span>
          <h3 class="pregunta-tarjeta__enunciado"><span class="sr-only">Pregunta ${numero}: </span><span class="pregunta-tarjeta__texto">${escaparHTML(pregunta.enunciado)}</span></h3>
          <div class="pregunta-tarjeta__acciones">
            <button type="button" class="btn btn--fantasma btn--icono" data-accion="subir"
              aria-label="Subir la pregunta ${numero}" title="Subir" ${indice === 0 ? 'disabled' : ''}>
              ${icono('flecha-arriba')}
            </button>
            <button type="button" class="btn btn--fantasma btn--icono" data-accion="bajar"
              aria-label="Bajar la pregunta ${numero}" title="Bajar" ${indice === total - 1 ? 'disabled' : ''}>
              ${icono('flecha-abajo')}
            </button>
            <button type="button" class="btn btn--fantasma btn--icono" data-accion="editar"
              aria-label="Editar la pregunta ${numero}" title="Editar">${icono('editar')}</button>
            <button type="button" class="btn btn--peligro-fantasma btn--icono" data-accion="eliminar"
              aria-label="Eliminar la pregunta ${numero}" title="Eliminar">${icono('eliminar')}</button>
          </div>
        </div>
        <ol class="pregunta-tarjeta__respuestas" role="list">${this.#renderizarRespuestas(pregunta.respuestas)}</ol>
      </li>`;
  }

  #renderizar() {
    if (this.#preguntas.length === 0) {
      this.innerHTML = `
        <estado-vacio icono="lista" titulo="Este examen aún no tiene preguntas"
          mensaje="Agrega la primera con el formulario. Mientras no tenga preguntas, no aparecerá en el catálogo público.">
        </estado-vacio>`;
      return;
    }

    const total = this.#preguntas.length;
    this.innerHTML = `
      <ol class="lista-preguntas" role="list">
        ${this.#preguntas.map((pregunta, indice) => this.#renderizarPregunta(pregunta, indice, total)).join('')}
      </ol>`;
  }

  #alHacerClic = (evento) => {
    const boton = evento.target.closest('button[data-accion]');
    const tarjeta = boton?.closest('[data-id]');
    if (!boton || !tarjeta || boton.disabled) return;

    const id = tarjeta.dataset.id;
    const accion = boton.dataset.accion;
    if (accion === 'subir' || accion === 'bajar') {
      const desplazamiento = accion === 'subir' ? -1 : 1;
      this.dispatchEvent(new CustomEvent('mover-pregunta', { detail: { id, desplazamiento, accion }, bubbles: true }));
    } else {
      this.dispatchEvent(new CustomEvent(`${accion}-pregunta`, { detail: { id }, bubbles: true }));
    }
  };
}

customElements.define('lista-preguntas', ListaPreguntas);
