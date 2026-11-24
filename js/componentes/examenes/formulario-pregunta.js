/**
 * <formulario-pregunta> · Crear y editar una pregunta con sus respuestas
 * ---------------------------------------------------------------------------
 * - Enunciado de la pregunta.
 * - Lista dinámica de respuestas (entre 2 y 6): se pueden agregar y quitar.
 * - La respuesta correcta se marca con un botón de opción (radio): como todos
 *   comparten el mismo "name", el navegador solo deja marcar UNA.
 *
 * Eventos que emite:
 *  - "guardar-pregunta" → detail: { datos: { enunciado, respuestas }, id }
 *  - "cancelar-edicion"
 *
 * Métodos públicos: editar(pregunta, numero), reiniciar(), mostrarErrores(errores),
 * propiedad cargando = true/false.
 */
import { LIMITES } from '../../config/constantes.js';
import { validarPregunta } from '../../servicios/servicio-examenes.js';
import { escaparHTML } from '../../utilidades/dom.js';
import { obtenerLetra } from '../../utilidades/formato.js';
import {
  activarLimpiezaAutomatica,
  limpiarErrores,
  mostrarErrores,
  ponerBotonCargando,
} from '../../utilidades/formularios.js';
import { icono } from '../../utilidades/iconos.js';

const { MIN: MINIMO_RESPUESTAS, MAX: MAXIMO_RESPUESTAS } = LIMITES.RESPUESTAS_POR_PREGUNTA;

/** Respuestas vacías con las que empieza una pregunta nueva. */
const crearRespuestasVacias = () =>
  Array.from({ length: MINIMO_RESPUESTAS + 2 }, () => ({ id: null, descripcion: '', esCorrecta: false }));

class FormularioPregunta extends HTMLElement {
  #formulario;
  #listaRespuestas;
  #errorRespuestas;
  #idEditando = null;
  #respuestas = crearRespuestasVacias();

  connectedCallback() {
    this.#renderizar();
    this.#formulario = this.querySelector('form');
    this.#listaRespuestas = this.querySelector('[data-ref="respuestas"]');
    this.#errorRespuestas = this.querySelector('#pregunta-respuestas-error');

    this.#formulario.addEventListener('submit', this.#alEnviar);
    this.#formulario.addEventListener('click', this.#alHacerClic);
    this.#formulario.addEventListener('change', (evento) => {
      if (evento.target.name === 'correcta') this.#errorRespuestas.textContent = '';
    });
    activarLimpiezaAutomatica(this.#formulario);

    this.#renderizarRespuestas();
    this.#aplicarModo();
  }

  get idEditando() {
    return this.#idEditando;
  }

  set cargando(valor) {
    ponerBotonCargando(this.#formulario.querySelector('[type="submit"]'), valor);
  }

  /**
   * Carga una pregunta para editarla.
   * @param {object} pregunta
   * @param {number} numero - Posición de la pregunta (para el título "Editar pregunta 3").
   */
  editar(pregunta, numero) {
    this.#idEditando = pregunta.id;
    this.#formulario.elements.enunciado.value = pregunta.enunciado;
    this.#respuestas = pregunta.respuestas.map((respuesta) => ({ ...respuesta }));
    this.#limpiarTodo();
    this.#renderizarRespuestas();
    this.#aplicarModo(numero);

    this.scrollIntoView({ behavior: 'smooth', block: 'start' });
    this.#formulario.elements.enunciado.focus({ preventScroll: true });
  }

  reiniciar() {
    this.#idEditando = null;
    this.#formulario.reset();
    this.#respuestas = crearRespuestasVacias();
    this.#limpiarTodo();
    this.#renderizarRespuestas();
    this.#aplicarModo();
  }

  /**
   * Muestra los errores. "respuestas" y "correcta" van en el mensaje general
   * de la lista; el resto (enunciado, respuesta-N) en su propio campo.
   */
  mostrarErrores({ respuestas, correcta, ...erroresDeCampos }) {
    mostrarErrores(this.#formulario, erroresDeCampos);
    this.#errorRespuestas.textContent = respuestas || correcta || '';
    if (Object.keys(erroresDeCampos).length === 0 && (respuestas || correcta)) {
      this.#formulario.querySelector('[name="correcta"]')?.focus();
    }
  }

  #limpiarTodo() {
    limpiarErrores(this.#formulario);
    this.#errorRespuestas.textContent = '';
  }

  #renderizar() {
    this.innerHTML = `
      <form class="tarjeta formulario formulario-tarjeta" novalidate aria-labelledby="titulo-formulario-pregunta">
        <div class="formulario-tarjeta__encabezado">
          <span class="formulario-tarjeta__icono" data-ref="icono"></span>
          <div>
            <h2 class="tarjeta__titulo" id="titulo-formulario-pregunta" data-ref="titulo"></h2>
            <p class="tarjeta__subtitulo">Selección única: marca la letra de la respuesta correcta.</p>
          </div>
        </div>

        <div class="campo">
          <label class="campo__etiqueta" for="pregunta-enunciado">
            Enunciado <span class="campo__obligatorio" aria-hidden="true">*</span>
          </label>
          <textarea class="campo__entrada" id="pregunta-enunciado" name="enunciado" rows="3"
            maxlength="${LIMITES.ENUNCIADO.MAX}" placeholder="Ej: ¿Cuál es la capital de Colombia?" required
            aria-describedby="pregunta-enunciado-error"></textarea>
          <p class="campo__error" id="pregunta-enunciado-error"></p>
        </div>

        <fieldset class="editor-respuestas" aria-describedby="pregunta-respuestas-ayuda pregunta-respuestas-error">
          <legend class="campo__etiqueta">
            Respuestas <span class="campo__obligatorio" aria-hidden="true">*</span>
          </legend>
          <p class="campo__ayuda" id="pregunta-respuestas-ayuda">
            Entre ${MINIMO_RESPUESTAS} y ${MAXIMO_RESPUESTAS} respuestas. Toca la letra para marcar la correcta.
          </p>
          <ol class="editor-respuestas__lista" role="list" data-ref="respuestas"></ol>
          <p class="campo__error" id="pregunta-respuestas-error" role="alert"></p>
          <button type="button" class="btn btn--secundario btn--pequeno" data-accion="agregar-respuesta">
            ${icono('mas')} Agregar respuesta
          </button>
        </fieldset>

        <div class="formulario__acciones">
          <button type="button" class="btn btn--fantasma" data-accion="cancelar">Cancelar edición</button>
          <button type="submit" class="btn btn--primario" data-ref="boton-guardar"></button>
        </div>
      </form>`;
  }

  /** Pinta las filas de respuestas a partir del estado #respuestas. */
  #renderizarRespuestas() {
    const sePuedeQuitar = this.#respuestas.length > MINIMO_RESPUESTAS;

    this.#listaRespuestas.innerHTML = this.#respuestas
      .map((respuesta, indice) => {
        const letra = obtenerLetra(indice);
        const idCampo = `pregunta-respuesta-${indice}`;
        return `
          <li class="campo editor-respuestas__item">
            <div class="editor-respuestas__fila">
              <label class="editor-respuestas__correcta" title="Marcar ${letra} como correcta">
                <input class="editor-respuestas__radio" type="radio" name="correcta" value="${indice}"
                  ${respuesta.esCorrecta ? 'checked' : ''}>
                <span class="editor-respuestas__letra" aria-hidden="true">${letra}</span>
                <span class="sr-only">Respuesta ${letra} es la correcta</span>
              </label>
              <input class="campo__entrada" id="${idCampo}" name="respuesta-${indice}" type="text"
                maxlength="${LIMITES.DESCRIPCION_RESPUESTA.MAX}" value="${escaparHTML(respuesta.descripcion)}"
                placeholder="Texto de la respuesta ${letra}" aria-label="Texto de la respuesta ${letra}"
                aria-describedby="${idCampo}-error">
              <button type="button" class="btn btn--peligro-fantasma btn--icono" data-accion="quitar-respuesta"
                data-indice="${indice}" aria-label="Quitar respuesta ${letra}" title="Quitar respuesta"
                ${sePuedeQuitar ? '' : 'disabled'}>${icono('cerrar')}</button>
            </div>
            <p class="campo__error" id="${idCampo}-error"></p>
          </li>`;
      })
      .join('');

    this.querySelector('[data-accion="agregar-respuesta"]').disabled = this.#respuestas.length >= MAXIMO_RESPUESTAS;
  }

  /** Copia al estado lo que el usuario escribió (antes de volver a pintar la lista). */
  #leerRespuestasDelFormulario() {
    const marcada = this.#formulario.querySelector('[name="correcta"]:checked');
    this.#respuestas = this.#respuestas.map((respuesta, indice) => ({
      ...respuesta,
      descripcion: this.#formulario.elements[`respuesta-${indice}`].value.trim(),
      esCorrecta: marcada !== null && Number(marcada.value) === indice,
    }));
  }

  #aplicarModo(numero) {
    const esEdicion = this.#idEditando !== null;
    const ref = (nombre) => this.querySelector(`[data-ref="${nombre}"]`);

    ref('titulo').textContent = esEdicion ? `Editar pregunta ${numero ?? ''}`.trim() : 'Nueva pregunta';
    ref('icono').innerHTML = icono(esEdicion ? 'editar' : 'mas');
    ref('boton-guardar').innerHTML = esEdicion
      ? `${icono('check')} Guardar cambios`
      : `${icono('mas')} Agregar pregunta`;
    this.querySelector('[data-accion="cancelar"]').hidden = !esEdicion;
    this.#formulario.classList.toggle('formulario-tarjeta--editando', esEdicion);
  }

  #alHacerClic = (evento) => {
    const boton = evento.target.closest('[data-accion]');
    if (!boton || boton.disabled) return;

    if (boton.dataset.accion === 'agregar-respuesta') {
      this.#leerRespuestasDelFormulario();
      this.#respuestas.push({ id: null, descripcion: '', esCorrecta: false });
      this.#renderizarRespuestas();
      this.#errorRespuestas.textContent = '';
      this.#formulario.elements[`respuesta-${this.#respuestas.length - 1}`].focus();
    }

    if (boton.dataset.accion === 'quitar-respuesta') {
      this.#leerRespuestasDelFormulario();
      const indice = Number(boton.dataset.indice);
      this.#respuestas.splice(indice, 1);
      this.#renderizarRespuestas();
      // El foco pasa a la respuesta que quedó en esa posición (o a la anterior)
      const siguiente = Math.min(indice, this.#respuestas.length - 1);
      this.#formulario.elements[`respuesta-${siguiente}`].focus();
    }

    if (boton.dataset.accion === 'cancelar') {
      this.reiniciar();
      this.dispatchEvent(new CustomEvent('cancelar-edicion', { bubbles: true }));
    }
  };

  #alEnviar = (evento) => {
    evento.preventDefault();
    this.#leerRespuestasDelFormulario();

    const datos = {
      enunciado: this.#formulario.elements.enunciado.value.trim(),
      respuestas: this.#respuestas.map((respuesta) => ({ ...respuesta })),
    };

    const { esValido, errores } = validarPregunta(datos);
    if (!esValido) {
      this.mostrarErrores(errores);
      return;
    }
    this.dispatchEvent(new CustomEvent('guardar-pregunta', { detail: { datos, id: this.#idEditando }, bubbles: true }));
  };
}

customElements.define('formulario-pregunta', FormularioPregunta);
