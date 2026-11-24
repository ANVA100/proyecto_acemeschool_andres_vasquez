/**
 * <vista-examenes> · Módulo "Gestión de exámenes" (privado)
 * ---------------------------------------------------------------------------
 * Igual que la gestión de usuarios: compone formulario + tabla + buscador
 * y conecta sus eventos con el servicio de exámenes.
 *
 *   <formulario-examen>  → "guardar-examen"   → crearExamen / actualizarExamen
 *   <tabla-examenes>     → "editar-examen"    → formulario.editar(examen)
 *                        → "eliminar-examen"  → confirmar() → eliminarExamen
 *   <campo-busqueda>     → "buscar"           → filtra la tabla
 */
import {
  actualizarExamen,
  crearExamen,
  eliminarExamen,
  estaDisponible,
  obtenerExamenPorId,
  obtenerExamenes,
} from '../../servicios/servicio-examenes.js';
import { normalizarTexto, pluralizar } from '../../utilidades/formato.js';
import { ErrorValidacion } from '../../utilidades/validaciones.js';
import { notificar } from '../compartidos/contenedor-notificaciones.js';
import { confirmar } from '../compartidos/dialogo-confirmacion.js';
import './formulario-examen.js';
import './tabla-examenes.js';

class VistaExamenes extends HTMLElement {
  #formulario;
  #tabla;
  #contador;
  #termino = '';

  connectedCallback() {
    this.innerHTML = `
      <div class="encabezado-vista">
        <div>
          <h1 class="encabezado-vista__titulo">Gestión de exámenes</h1>
          <p class="encabezado-vista__descripcion">
            Crea los exámenes, define su tiempo y porcentaje de aprobación, y agrégales preguntas.
          </p>
        </div>
      </div>

      <div class="rejilla-admin">
        <div class="rejilla-admin__lateral">
          <formulario-examen></formulario-examen>
        </div>

        <section class="tarjeta tarjeta--tabla" aria-labelledby="titulo-tabla-examenes">
          <div class="tarjeta__encabezado">
            <div>
              <h2 class="tarjeta__titulo" id="titulo-tabla-examenes">Exámenes registrados</h2>
              <p class="tarjeta__subtitulo" data-ref="contador" aria-live="polite"></p>
            </div>
            <campo-busqueda class="buscador-tabla" etiqueta="Buscar exámenes"
              placeholder="Código, título o descripción…"></campo-busqueda>
          </div>
          <tabla-examenes></tabla-examenes>
        </section>
      </div>`;

    this.#formulario = this.querySelector('formulario-examen');
    this.#tabla = this.querySelector('tabla-examenes');
    this.#contador = this.querySelector('.tarjeta--tabla [data-ref="contador"]');

    this.addEventListener('guardar-examen', this.#alGuardar);
    this.addEventListener('editar-examen', this.#alEditar);
    this.addEventListener('eliminar-examen', this.#alEliminar);
    this.addEventListener('buscar', this.#alBuscar);

    this.#refrescar();
  }

  #refrescar() {
    const todos = obtenerExamenes();
    const termino = normalizarTexto(this.#termino);
    const visibles = termino
      ? todos.filter((examen) =>
          [examen.codigo, examen.titulo, examen.descripcion].some((valor) => normalizarTexto(valor).includes(termino))
        )
      : todos;

    const disponibles = todos.filter(estaDisponible).length;
    this.#tabla.hayBusqueda = termino !== '';
    this.#tabla.examenes = visibles;
    this.#contador.textContent = termino
      ? `Mostrando ${visibles.length} de ${pluralizar(todos.length, 'examen', 'exámenes')}`
      : `${pluralizar(todos.length, 'examen', 'exámenes')} · ${disponibles} ${disponibles === 1 ? 'disponible' : 'disponibles'} para estudiantes`;
  }

  #alGuardar = (evento) => {
    const { datos, id } = evento.detail;
    this.#formulario.cargando = true;

    try {
      const examen = id ? actualizarExamen(id, datos) : crearExamen(datos);
      this.#formulario.reiniciar();
      this.#refrescar();
      this.#tabla.resaltar(examen.id);

      if (id) {
        notificar(`Se actualizó el examen ${examen.codigo}.`, { tipo: 'exito' });
      } else {
        notificar(`Examen ${examen.codigo} creado. Ahora agrégale preguntas con el botón de la lista.`, {
          tipo: 'exito',
          duracion: 6000,
        });
      }
    } catch (error) {
      if (error instanceof ErrorValidacion) {
        this.#formulario.mostrarErrores(error.errores);
      }
      notificar(error.message || 'No se pudo guardar el examen.', { tipo: 'error' });
    } finally {
      this.#formulario.cargando = false;
    }
  };

  #alEditar = (evento) => {
    const examen = obtenerExamenPorId(evento.detail.id);
    if (!examen) {
      notificar('Ese examen ya no existe.', { tipo: 'error' });
      this.#refrescar();
      return;
    }
    this.#formulario.editar(examen);
  };

  #alEliminar = async (evento) => {
    const examen = obtenerExamenPorId(evento.detail.id);
    if (!examen) return;

    const cantidad = examen.preguntas.length;
    const acepto = await confirmar({
      titulo: `¿Eliminar el examen ${examen.codigo}?`,
      mensaje:
        (cantidad > 0 ? `También se eliminarán sus ${pluralizar(cantidad, 'pregunta')}. ` : '') +
        'Los resultados ya registrados se conservan. Esta acción no se puede deshacer.',
      textoConfirmar: 'Eliminar examen',
    });
    if (!acepto) return;

    try {
      eliminarExamen(examen.id);
      if (this.#formulario.idEditando === examen.id) this.#formulario.reiniciar();
      notificar(`Se eliminó el examen ${examen.codigo}.`, { tipo: 'exito' });
      this.#refrescar();
    } catch (error) {
      notificar(error.message, { tipo: 'error' });
    }
  };

  #alBuscar = (evento) => {
    this.#termino = evento.detail.termino;
    this.#refrescar();
  };
}

customElements.define('vista-examenes', VistaExamenes);
