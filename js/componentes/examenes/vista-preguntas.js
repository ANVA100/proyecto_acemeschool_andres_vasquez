/**
 * <vista-preguntas> · Preguntas de un examen (privado)
 * ---------------------------------------------------------------------------
 * Ruta: #/admin/examenes/:id/preguntas (el enrutador entrega el id en
 * this.contexto.parametros.id).
 *
 *   <formulario-pregunta> → "guardar-pregunta"  → agregarPregunta / actualizarPregunta
 *   <lista-preguntas>     → "editar-pregunta"   → formulario.editar(pregunta)
 *                         → "eliminar-pregunta" → confirmar() → eliminarPregunta
 *                         → "mover-pregunta"    → moverPregunta (cambia el orden)
 */
import {
  actualizarPregunta,
  agregarPregunta,
  eliminarPregunta,
  estaDisponible,
  moverPregunta,
  obtenerExamenPorId,
} from '../../servicios/servicio-examenes.js';
import { escaparHTML } from '../../utilidades/dom.js';
import { pluralizar } from '../../utilidades/formato.js';
import { icono } from '../../utilidades/iconos.js';
import { ErrorValidacion } from '../../utilidades/validaciones.js';
import { notificar } from '../compartidos/contenedor-notificaciones.js';
import { confirmar } from '../compartidos/dialogo-confirmacion.js';
import './formulario-pregunta.js';
import './lista-preguntas.js';

class VistaPreguntas extends HTMLElement {
  #examenId;
  #formulario;
  #lista;
  #resumen;

  connectedCallback() {
    this.#examenId = this.contexto?.parametros?.id;
    const examen = obtenerExamenPorId(this.#examenId);

    if (!examen) {
      this.innerHTML = `
        <section class="vista-mensaje tarjeta">
          <h1 class="vista-mensaje__titulo">Examen no encontrado</h1>
          <p class="vista-mensaje__texto">Es posible que haya sido eliminado.</p>
          <a class="btn btn--primario" href="#/admin/examenes">${icono('flecha-izquierda')} Volver a exámenes</a>
        </section>`;
      return;
    }

    this.innerHTML = `
      <a class="enlace-volver" href="#/admin/examenes">${icono('flecha-izquierda')} Volver a exámenes</a>

      <div class="encabezado-vista">
        <div>
          <h1 class="encabezado-vista__titulo">Preguntas del examen</h1>
          <p class="encabezado-vista__descripcion">
            Cada pregunta es de selección única: tiene varias respuestas y solo una correcta.
          </p>
        </div>
      </div>

      <section class="resumen-examen tarjeta" aria-label="Resumen del examen" data-ref="resumen"></section>

      <div class="rejilla-admin">
        <div class="rejilla-admin__lateral">
          <formulario-pregunta></formulario-pregunta>
        </div>
        <section aria-labelledby="titulo-lista-preguntas">
          <h2 class="sr-only" id="titulo-lista-preguntas">Preguntas registradas</h2>
          <lista-preguntas></lista-preguntas>
        </section>
      </div>`;

    this.#formulario = this.querySelector('formulario-pregunta');
    this.#lista = this.querySelector('lista-preguntas');
    this.#resumen = this.querySelector('[data-ref="resumen"]');

    this.addEventListener('guardar-pregunta', this.#alGuardar);
    this.addEventListener('editar-pregunta', this.#alEditar);
    this.addEventListener('eliminar-pregunta', this.#alEliminar);
    this.addEventListener('mover-pregunta', this.#alMover);

    this.#refrescar();
  }

  /** Lee el examen de nuevo y actualiza el resumen y la lista. */
  #refrescar() {
    const examen = obtenerExamenPorId(this.#examenId);
    if (!examen) {
      notificar('El examen ya no existe.', { tipo: 'error' });
      window.location.hash = '#/admin/examenes';
      return null;
    }
    this.#renderizarResumen(examen);
    this.#lista.preguntas = examen.preguntas;
    return examen;
  }

  #renderizarResumen(examen) {
    const disponible = estaDisponible(examen);
    this.#resumen.innerHTML = `
      <div class="resumen-examen__principal">
        <span class="codigo">${escaparHTML(examen.codigo)}</span>
        <h2 class="resumen-examen__titulo">${escaparHTML(examen.titulo)}</h2>
      </div>
      <ul class="resumen-examen__datos" role="list">
        <li>${icono('reloj')} ${examen.tiempoMinutos} min</li>
        <li>${icono('porcentaje')} Aprueba con ${examen.porcentajeAprobacion} %</li>
        <li>${icono('lista')} ${pluralizar(examen.preguntas.length, 'pregunta')}</li>
        ${examen.mezclarPreguntas ? `<li>${icono('reiniciar')} Orden aleatorio</li>` : ''}
      </ul>
      ${
        disponible
          ? `<span class="insignia insignia--exito">${icono('ojo')} Visible en el catálogo</span>`
          : `<span class="insignia insignia--acento">${icono('ojo-tachado')} Oculto: agrega preguntas</span>`
      }`;
  }

  #alGuardar = (evento) => {
    const { datos, id } = evento.detail;
    const estabaDisponible = estaDisponible(obtenerExamenPorId(this.#examenId) ?? { preguntas: [] });
    this.#formulario.cargando = true;

    try {
      const pregunta = id
        ? actualizarPregunta(this.#examenId, id, datos)
        : agregarPregunta(this.#examenId, datos);
      this.#formulario.reiniciar();
      const examen = this.#refrescar();
      this.#lista.resaltar(pregunta.id);

      if (id) {
        notificar('Pregunta actualizada.', { tipo: 'exito' });
      } else if (!estabaDisponible && examen && estaDisponible(examen)) {
        notificar('¡Primera pregunta agregada! El examen ya aparece en el catálogo público.', {
          tipo: 'exito',
          duracion: 6000,
        });
      } else {
        notificar(`Pregunta agregada. El examen tiene ${pluralizar(examen?.preguntas.length ?? 0, 'pregunta')}.`, {
          tipo: 'exito',
        });
      }
    } catch (error) {
      if (error instanceof ErrorValidacion) {
        this.#formulario.mostrarErrores(error.errores);
      }
      notificar(error.message || 'No se pudo guardar la pregunta.', { tipo: 'error' });
    } finally {
      this.#formulario.cargando = false;
    }
  };

  #alEditar = (evento) => {
    const examen = obtenerExamenPorId(this.#examenId);
    const indice = examen?.preguntas.findIndex((pregunta) => pregunta.id === evento.detail.id) ?? -1;
    if (indice === -1) {
      notificar('Esa pregunta ya no existe.', { tipo: 'error' });
      this.#refrescar();
      return;
    }
    this.#formulario.editar(examen.preguntas[indice], indice + 1);
  };

  #alEliminar = async (evento) => {
    const examen = obtenerExamenPorId(this.#examenId);
    const indice = examen?.preguntas.findIndex((pregunta) => pregunta.id === evento.detail.id) ?? -1;
    if (indice === -1) return;

    const quedaVacio = examen.preguntas.length === 1;
    const acepto = await confirmar({
      titulo: `¿Eliminar la pregunta ${indice + 1}?`,
      mensaje: quedaVacio
        ? 'Es la única pregunta: el examen dejará de aparecer en el catálogo público.'
        : 'Se eliminará junto con sus respuestas. Esta acción no se puede deshacer.',
      textoConfirmar: 'Eliminar pregunta',
    });
    if (!acepto) return;

    try {
      eliminarPregunta(this.#examenId, evento.detail.id);
      if (this.#formulario.idEditando === evento.detail.id) this.#formulario.reiniciar();
      notificar('Pregunta eliminada.', { tipo: 'exito' });
      this.#refrescar();
    } catch (error) {
      notificar(error.message, { tipo: 'error' });
    }
  };

  #alMover = (evento) => {
    const { id, desplazamiento, accion } = evento.detail;
    try {
      moverPregunta(this.#examenId, id, desplazamiento);
      this.#refrescar();
      this.#lista.resaltar(id);
      // Mantiene el foco en el mismo botón para poder mover varias veces con el teclado
      this.#lista.enfocarAccion(id, accion);
    } catch (error) {
      notificar(error.message, { tipo: 'error' });
    }
  };
}

customElements.define('vista-preguntas', VistaPreguntas);
