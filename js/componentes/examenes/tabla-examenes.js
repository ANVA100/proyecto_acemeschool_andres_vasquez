/**
 * <tabla-examenes> · Tabla de exámenes registrados
 * ---------------------------------------------------------------------------
 * Propiedades:
 *  - examenes:    arreglo de exámenes a mostrar
 *  - hayBusqueda: true si la lista está filtrada (cambia el mensaje de "vacío")
 *
 * Eventos que emite: "editar-examen" y "eliminar-examen" → detail: { id }
 * El botón "Preguntas" es un enlace a #/admin/examenes/:id/preguntas.
 */
import { escaparHTML } from '../../utilidades/dom.js';
import { pluralizar } from '../../utilidades/formato.js';
import { icono } from '../../utilidades/iconos.js';
import { estaDisponible } from '../../servicios/servicio-examenes.js';

class TablaExamenes extends HTMLElement {
  #examenes = [];
  hayBusqueda = false;

  connectedCallback() {
    this.addEventListener('click', this.#alHacerClic);
    this.#renderizar();
  }

  disconnectedCallback() {
    this.removeEventListener('click', this.#alHacerClic);
  }

  set examenes(lista) {
    this.#examenes = lista;
    if (this.isConnected) this.#renderizar();
  }

  /** Resalta brevemente la fila de un examen (después de crearlo o editarlo). */
  resaltar(id) {
    const fila = this.querySelector(`tr[data-id="${CSS.escape(id)}"]`);
    if (!fila) return;
    fila.classList.remove('escalonado');
    fila.classList.add('animar-destello');
    fila.addEventListener('animationend', () => fila.classList.remove('animar-destello'), { once: true });
  }

  /** Insignia con el número de preguntas (o aviso si no tiene ninguna). */
  #renderizarEstado(examen) {
    if (estaDisponible(examen)) {
      return `<span class="insignia insignia--exito">${icono('check')} ${pluralizar(examen.preguntas.length, 'pregunta')}</span>`;
    }
    return `<span class="insignia" title="No aparece en el catálogo público hasta que tenga preguntas">
              ${icono('alerta')} Sin preguntas
            </span>`;
  }

  #renderizarFila(examen, indice) {
    const titulo = escaparHTML(examen.titulo);
    const id = escaparHTML(examen.id);

    return `
      <tr data-id="${id}" class="escalonado" style="--indice: ${Math.min(indice, 10)}">
        <td data-etiqueta="Examen">
          <div class="celda-examen">
            <span class="codigo">${escaparHTML(examen.codigo)}</span>
            <span class="celda-examen__titulo">${titulo}</span>
            <span class="celda-examen__descripcion">${escaparHTML(examen.descripcion)}</span>
            ${examen.mezclarPreguntas ? `<span class="insignia insignia--primario">${icono('reiniciar')} Orden aleatorio</span>` : ''}
          </div>
        </td>
        <td data-etiqueta="Tiempo">${examen.tiempoMinutos} min</td>
        <td data-etiqueta="Aprobación">${examen.porcentajeAprobacion} %</td>
        <td data-etiqueta="Preguntas">${this.#renderizarEstado(examen)}</td>
        <td class="columna-acciones">
          <div class="tabla__acciones">
            <a class="btn btn--fantasma btn--icono" href="#/admin/examenes/${encodeURIComponent(examen.id)}/preguntas"
              aria-label="Gestionar preguntas de ${titulo}" title="Preguntas">${icono('lista')}</a>
            <button type="button" class="btn btn--fantasma btn--icono" data-accion="editar"
              aria-label="Editar ${titulo}" title="Editar">${icono('editar')}</button>
            <button type="button" class="btn btn--peligro-fantasma btn--icono" data-accion="eliminar"
              aria-label="Eliminar ${titulo}" title="Eliminar">${icono('eliminar')}</button>
          </div>
        </td>
      </tr>`;
  }

  #renderizar() {
    if (this.#examenes.length === 0) {
      this.innerHTML = this.hayBusqueda
        ? `<estado-vacio icono="buscar" titulo="Sin resultados"
             mensaje="Ningún examen coincide con la búsqueda. Prueba con otro código o título."></estado-vacio>`
        : `<estado-vacio icono="examen" titulo="Aún no hay exámenes"
             mensaje="Crea el primero con el formulario y luego agrégale preguntas."></estado-vacio>`;
      return;
    }

    this.innerHTML = `
      <div class="tabla-contenedor">
        <table class="tabla tabla--responsiva">
          <caption class="sr-only">Exámenes registrados</caption>
          <thead>
            <tr>
              <th scope="col">Examen</th>
              <th scope="col">Tiempo</th>
              <th scope="col">Aprobación</th>
              <th scope="col">Preguntas</th>
              <th scope="col" class="columna-acciones">Acciones</th>
            </tr>
          </thead>
          <tbody>${this.#examenes.map((examen, indice) => this.#renderizarFila(examen, indice)).join('')}</tbody>
        </table>
      </div>`;
  }

  #alHacerClic = (evento) => {
    const boton = evento.target.closest('button[data-accion]');
    const fila = boton?.closest('tr[data-id]');
    if (!boton || !fila) return;
    const nombreEvento = boton.dataset.accion === 'editar' ? 'editar-examen' : 'eliminar-examen';
    this.dispatchEvent(new CustomEvent(nombreEvento, { detail: { id: fila.dataset.id }, bubbles: true }));
  };
}

customElements.define('tabla-examenes', TablaExamenes);
