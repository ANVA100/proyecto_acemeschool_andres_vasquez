/**
 * <tabla-resultados> · Historial de exámenes presentados
 * ---------------------------------------------------------------------------
 * Propiedades:
 *  - resultados:  arreglo de resultados a mostrar
 *  - hayFiltros:  true si la lista está filtrada (cambia el mensaje de "vacío")
 *
 * Eventos que emite: "ver-resultado" y "eliminar-resultado" → detail: { id }
 */
import { MOTIVOS_FINALIZACION } from '../../config/constantes.js';
import { escaparHTML } from '../../utilidades/dom.js';
import {
  formatearDuracion,
  formatearFechaHora,
  formatearPorcentaje,
  obtenerIniciales,
} from '../../utilidades/formato.js';
import { icono } from '../../utilidades/iconos.js';

class TablaResultados extends HTMLElement {
  #resultados = [];
  hayFiltros = false;

  connectedCallback() {
    this.addEventListener('click', this.#alHacerClic);
    this.#renderizar();
  }

  disconnectedCallback() {
    this.removeEventListener('click', this.#alHacerClic);
  }

  set resultados(lista) {
    this.#resultados = lista;
    if (this.isConnected) this.#renderizar();
  }

  #renderizarFila(resultado, indice) {
    const nombre = escaparHTML(resultado.estudiante.nombreCompleto);
    const porTiempo = resultado.motivoFinalizacion === MOTIVOS_FINALIZACION.TIEMPO;

    return `
      <tr data-id="${escaparHTML(resultado.id)}" class="escalonado" style="--indice: ${Math.min(indice, 10)}">
        <td data-etiqueta="Estudiante">
          <div class="celda-persona">
            <span class="avatar" aria-hidden="true">${escaparHTML(obtenerIniciales(resultado.estudiante.nombreCompleto))}</span>
            <span class="celda-persona__texto">
              <span class="celda-persona__nombre">${nombre}</span>
              <span class="celda-persona__detalle">ID ${escaparHTML(resultado.estudiante.identificacion)}</span>
            </span>
          </div>
        </td>
        <td data-etiqueta="Examen">
          <span class="celda-resultado-examen">
            <span class="codigo">${escaparHTML(resultado.examen.codigo)}</span>
            <span>${escaparHTML(resultado.examen.titulo)}</span>
          </span>
        </td>
        <td data-etiqueta="Aciertos">
          <span class="celda-aciertos">
            <span><strong>${formatearPorcentaje(resultado.porcentajeObtenido)}</strong>
              <span class="texto-tenue">(${resultado.respuestasCorrectas}/${resultado.totalPreguntas})</span></span>
            <span class="mini-barra ${resultado.aprobado ? 'mini-barra--exito' : 'mini-barra--peligro'}" aria-hidden="true">
              <span style="--valor: ${Math.min(100, resultado.porcentajeObtenido)}%"></span>
            </span>
          </span>
        </td>
        <td data-etiqueta="Estado">
          <span class="celda-estado">
            <span class="insignia ${resultado.aprobado ? 'insignia--exito' : 'insignia--peligro'}">
              ${icono(resultado.aprobado ? 'check' : 'cerrar')} ${resultado.aprobado ? 'Aprobado' : 'No aprobado'}
            </span>
            ${porTiempo ? `<span class="insignia insignia--acento" title="El tiempo se agotó">${icono('reloj')} Tiempo agotado</span>` : ''}
          </span>
        </td>
        <td data-etiqueta="Fecha">
          <span class="celda-fecha">
            <span>${formatearFechaHora(resultado.finalizadoEn)}</span>
            <span class="texto-tenue">Duró ${formatearDuracion(resultado.duracionSegundos)}</span>
          </span>
        </td>
        <td class="columna-acciones">
          <div class="tabla__acciones">
            <button type="button" class="btn btn--fantasma btn--icono" data-accion="ver"
              aria-label="Ver el detalle del resultado de ${nombre}" title="Ver detalle">${icono('ojo')}</button>
            <button type="button" class="btn btn--peligro-fantasma btn--icono" data-accion="eliminar"
              aria-label="Eliminar el resultado de ${nombre}" title="Eliminar">${icono('eliminar')}</button>
          </div>
        </td>
      </tr>`;
  }

  #renderizar() {
    if (this.#resultados.length === 0) {
      this.innerHTML = this.hayFiltros
        ? `<estado-vacio icono="buscar" titulo="Sin resultados"
             mensaje="Ningún intento coincide con los filtros elegidos."></estado-vacio>`
        : `<estado-vacio icono="grafica" titulo="Todavía no hay resultados"
             mensaje="Cuando los estudiantes presenten exámenes, aquí verás su porcentaje de aciertos y si aprobaron.">
             <a class="btn btn--secundario" href="#/">Ir al catálogo de exámenes</a>
           </estado-vacio>`;
      return;
    }

    this.innerHTML = `
      <div class="tabla-contenedor">
        <table class="tabla tabla--responsiva">
          <caption class="sr-only">Historial de exámenes presentados</caption>
          <thead>
            <tr>
              <th scope="col">Estudiante</th>
              <th scope="col">Examen</th>
              <th scope="col">Aciertos</th>
              <th scope="col">Estado</th>
              <th scope="col">Fecha</th>
              <th scope="col" class="columna-acciones">Acciones</th>
            </tr>
          </thead>
          <tbody>${this.#resultados.map((resultado, indice) => this.#renderizarFila(resultado, indice)).join('')}</tbody>
        </table>
      </div>`;
  }

  #alHacerClic = (evento) => {
    const boton = evento.target.closest('button[data-accion]');
    const fila = boton?.closest('tr[data-id]');
    if (!boton || !fila) return;
    const nombreEvento = boton.dataset.accion === 'ver' ? 'ver-resultado' : 'eliminar-resultado';
    this.dispatchEvent(new CustomEvent(nombreEvento, { detail: { id: fila.dataset.id }, bubbles: true }));
  };
}

customElements.define('tabla-resultados', TablaResultados);
