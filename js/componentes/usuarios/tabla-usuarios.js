/**
 * <tabla-usuarios> · Tabla de usuarios registrados
 * ---------------------------------------------------------------------------
 * Componente de presentación: recibe los datos por propiedades y avisa con
 * eventos cuando se pulsa "Editar" o "Eliminar".
 *
 * Propiedades:
 *  - usuarios:     arreglo de usuarios a mostrar (al asignarlo se vuelve a pintar)
 *  - idSesion:     id del usuario autenticado (se marca con "Tú" y no se puede eliminar)
 *  - hayBusqueda:  true si la lista está filtrada (cambia el mensaje de "vacío")
 *
 * Eventos que emite: "editar-usuario" y "eliminar-usuario" → detail: { id }
 *
 * En pantallas pequeñas la tabla se muestra como tarjetas (clase tabla--responsiva).
 */
import { NOMBRES_CARGOS, CARGOS } from '../../config/constantes.js';
import { escaparHTML } from '../../utilidades/dom.js';
import { obtenerIniciales } from '../../utilidades/formato.js';
import { icono } from '../../utilidades/iconos.js';

class TablaUsuarios extends HTMLElement {
  #usuarios = [];
  idSesion = null;
  hayBusqueda = false;

  connectedCallback() {
    this.addEventListener('click', this.#alHacerClic);
    this.#renderizar();
  }

  disconnectedCallback() {
    this.removeEventListener('click', this.#alHacerClic);
  }

  set usuarios(lista) {
    this.#usuarios = lista;
    if (this.isConnected) this.#renderizar();
  }

  get usuarios() {
    return this.#usuarios;
  }

  /** Resalta brevemente la fila de un usuario (después de crearlo o editarlo). */
  resaltar(id) {
    const fila = this.querySelector(`tr[data-id="${CSS.escape(id)}"]`);
    if (!fila) return;
    // .escalonado también define "animation": se quita para que no tape el destello
    fila.classList.remove('escalonado');
    fila.classList.add('animar-destello');
    fila.addEventListener('animationend', () => fila.classList.remove('animar-destello'), { once: true });
  }

  #renderizarFila(usuario, indice) {
    const esSesion = usuario.id === this.idSesion;
    const nombre = escaparHTML(usuario.nombreCompleto);
    const claseCargo = usuario.cargo === CARGOS.ADMINISTRATIVO ? 'insignia--primario' : 'insignia--acento';

    return `
      <tr data-id="${escaparHTML(usuario.id)}" class="escalonado" style="--indice: ${Math.min(indice, 10)}">
        <td data-etiqueta="Usuario">
          <div class="celda-persona">
            <span class="avatar" aria-hidden="true">${escaparHTML(obtenerIniciales(usuario.nombreCompleto))}</span>
            <span class="celda-persona__texto">
              <span class="celda-persona__nombre">
                ${nombre} ${esSesion ? '<span class="insignia insignia--exito">Tú</span>' : ''}
              </span>
              <span class="celda-persona__detalle">${escaparHTML(usuario.email)}</span>
            </span>
          </div>
        </td>
        <td data-etiqueta="Identificación">${escaparHTML(usuario.identificacion)}</td>
        <td data-etiqueta="Teléfono">${escaparHTML(usuario.telefono)}</td>
        <td data-etiqueta="Cargo">
          <span class="insignia ${claseCargo}">${escaparHTML(NOMBRES_CARGOS[usuario.cargo] ?? usuario.cargo)}</span>
        </td>
        <td class="columna-acciones">
          <div class="tabla__acciones">
            <button type="button" class="btn btn--fantasma btn--icono" data-accion="editar"
              aria-label="Editar a ${nombre}" title="Editar">${icono('editar')}</button>
            <button type="button" class="btn btn--peligro-fantasma btn--icono" data-accion="eliminar"
              aria-label="Eliminar a ${nombre}"
              title="${esSesion ? 'No puedes eliminar tu propia cuenta' : 'Eliminar'}"
              ${esSesion ? 'disabled' : ''}>${icono('eliminar')}</button>
          </div>
        </td>
      </tr>`;
  }

  #renderizar() {
    if (this.#usuarios.length === 0) {
      this.innerHTML = this.hayBusqueda
        ? `<estado-vacio icono="buscar" titulo="Sin resultados"
             mensaje="Ningún usuario coincide con la búsqueda. Prueba con otro nombre, correo o identificación.">
           </estado-vacio>`
        : `<estado-vacio icono="usuarios" titulo="Aún no hay usuarios"
             mensaje="Crea el primero con el formulario."></estado-vacio>`;
      return;
    }

    this.innerHTML = `
      <div class="tabla-contenedor">
        <table class="tabla tabla--responsiva">
          <caption class="sr-only">Usuarios registrados</caption>
          <thead>
            <tr>
              <th scope="col">Usuario</th>
              <th scope="col">Identificación</th>
              <th scope="col">Teléfono</th>
              <th scope="col">Cargo</th>
              <th scope="col" class="columna-acciones">Acciones</th>
            </tr>
          </thead>
          <tbody>${this.#usuarios.map((usuario, indice) => this.#renderizarFila(usuario, indice)).join('')}</tbody>
        </table>
      </div>`;
  }

  #alHacerClic = (evento) => {
    const boton = evento.target.closest('[data-accion]');
    const fila = boton?.closest('tr[data-id]');
    if (!boton || !fila || boton.disabled) return;
    const nombreEvento = boton.dataset.accion === 'editar' ? 'editar-usuario' : 'eliminar-usuario';
    this.dispatchEvent(new CustomEvent(nombreEvento, { detail: { id: fila.dataset.id }, bubbles: true }));
  };
}

customElements.define('tabla-usuarios', TablaUsuarios);
