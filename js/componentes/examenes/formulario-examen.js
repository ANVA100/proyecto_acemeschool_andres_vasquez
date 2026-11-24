/**
 * <formulario-examen> · Formulario para crear y actualizar exámenes
 * ---------------------------------------------------------------------------
 * Misma estructura que <formulario-usuario>: valida con el esquema del
 * servicio y avisa a la vista con un evento; no guarda nada por sí mismo.
 *
 * Eventos que emite:
 *  - "guardar-examen"   → detail: { datos, id }  (id = null si es nuevo)
 *  - "cancelar-edicion"
 *
 * Métodos públicos: editar(examen), reiniciar(), mostrarErrores(errores),
 * propiedad cargando = true/false.
 */
import { LIMITES } from '../../config/constantes.js';
import { crearEsquemaExamen } from '../../servicios/servicio-examenes.js';
import {
  activarLimpiezaAutomatica,
  limpiarErrores,
  mostrarErrores,
  obtenerDatosFormulario,
  ponerBotonCargando,
} from '../../utilidades/formularios.js';
import { icono } from '../../utilidades/iconos.js';
import { validar } from '../../utilidades/validaciones.js';

const TEXTOS = Object.freeze({
  crear: {
    titulo: 'Nuevo examen',
    subtitulo: 'Define los datos generales; las preguntas se agregan después.',
    boton: 'Crear examen',
    icono: 'mas',
  },
  editar: {
    titulo: 'Editar examen',
    subtitulo: 'Los cambios aplican a los próximos intentos.',
    boton: 'Guardar cambios',
    icono: 'check',
  },
});

class FormularioExamen extends HTMLElement {
  #formulario;
  #idEditando = null;

  connectedCallback() {
    this.#renderizar();
    this.#formulario = this.querySelector('form');
    this.#formulario.addEventListener('submit', this.#alEnviar);
    this.#formulario.elements.descripcion.addEventListener('input', this.#actualizarContador);
    this.querySelector('[data-accion="cancelar"]').addEventListener('click', this.#alCancelar);
    activarLimpiezaAutomatica(this.#formulario);
    this.#aplicarModo();
    this.#actualizarContador();
  }

  get idEditando() {
    return this.#idEditando;
  }

  set cargando(valor) {
    ponerBotonCargando(this.#formulario.querySelector('[type="submit"]'), valor);
  }

  /** Carga un examen en el formulario para editarlo. */
  editar(examen) {
    this.#idEditando = examen.id;
    const campos = this.#formulario.elements;
    campos.codigo.value = examen.codigo;
    campos.titulo.value = examen.titulo;
    campos.tiempoMinutos.value = examen.tiempoMinutos;
    campos.porcentajeAprobacion.value = examen.porcentajeAprobacion;
    campos.descripcion.value = examen.descripcion;
    campos.mezclarPreguntas.checked = Boolean(examen.mezclarPreguntas);
    limpiarErrores(this.#formulario);
    this.#aplicarModo();
    this.#actualizarContador();

    this.scrollIntoView({ behavior: 'smooth', block: 'start' });
    campos.titulo.focus({ preventScroll: true });
  }

  reiniciar() {
    this.#idEditando = null;
    this.#formulario.reset();
    limpiarErrores(this.#formulario);
    this.#aplicarModo();
    this.#actualizarContador();
  }

  mostrarErrores(errores) {
    mostrarErrores(this.#formulario, errores);
  }

  #renderizar() {
    const { CODIGO_EXAMEN, TITULO_EXAMEN, TIEMPO_MINUTOS, PORCENTAJE_APROBACION, DESCRIPCION_EXAMEN } = LIMITES;
    const obligatorio = '<span class="campo__obligatorio" aria-hidden="true">*</span>';

    this.innerHTML = `
      <form class="tarjeta formulario formulario-tarjeta" novalidate aria-labelledby="titulo-formulario-examen">
        <div class="formulario-tarjeta__encabezado">
          <span class="formulario-tarjeta__icono" data-ref="icono"></span>
          <div>
            <h2 class="tarjeta__titulo" id="titulo-formulario-examen" data-ref="titulo"></h2>
            <p class="tarjeta__subtitulo" data-ref="subtitulo"></p>
          </div>
        </div>

        <div class="campo">
          <label class="campo__etiqueta" for="examen-codigo">Código ${obligatorio}</label>
          <input class="campo__entrada campo__entrada--mayusculas" id="examen-codigo" name="codigo" type="text"
            autocomplete="off" maxlength="${CODIGO_EXAMEN.MAX}" placeholder="Ej: MAT-101" required
            aria-describedby="examen-codigo-ayuda examen-codigo-error">
          <p class="campo__ayuda" id="examen-codigo-ayuda">Identificador único: letras, números y guiones.</p>
          <p class="campo__error" id="examen-codigo-error"></p>
        </div>

        <div class="campo">
          <label class="campo__etiqueta" for="examen-titulo">Título ${obligatorio}</label>
          <input class="campo__entrada" id="examen-titulo" name="titulo" type="text" autocomplete="off"
            maxlength="${TITULO_EXAMEN.MAX}" placeholder="Ej: Álgebra básica" required
            aria-describedby="examen-titulo-error">
          <p class="campo__error" id="examen-titulo-error"></p>
        </div>

        <div class="formulario__fila formulario__fila--compacta">
          <div class="campo">
            <label class="campo__etiqueta" for="examen-tiempo">Tiempo ${obligatorio}</label>
            <div class="campo__grupo">
              <input class="campo__entrada" id="examen-tiempo" name="tiempoMinutos" type="number" inputmode="numeric"
                min="${TIEMPO_MINUTOS.MIN}" max="${TIEMPO_MINUTOS.MAX}" step="1" placeholder="30" required
                aria-describedby="examen-tiempo-error">
              <span class="campo__sufijo" aria-hidden="true">min</span>
            </div>
            <p class="campo__error" id="examen-tiempo-error"></p>
          </div>

          <div class="campo">
            <label class="campo__etiqueta" for="examen-porcentaje">Aprobación ${obligatorio}</label>
            <div class="campo__grupo">
              <input class="campo__entrada" id="examen-porcentaje" name="porcentajeAprobacion" type="number"
                inputmode="numeric" min="${PORCENTAJE_APROBACION.MIN}" max="${PORCENTAJE_APROBACION.MAX}" step="1"
                placeholder="60" required aria-describedby="examen-porcentaje-error">
              <span class="campo__sufijo" aria-hidden="true">%</span>
            </div>
            <p class="campo__error" id="examen-porcentaje-error"></p>
          </div>
        </div>

        <div class="campo">
          <label class="campo__etiqueta" for="examen-descripcion">Descripción ${obligatorio}</label>
          <textarea class="campo__entrada" id="examen-descripcion" name="descripcion" rows="4"
            maxlength="${DESCRIPCION_EXAMEN.MAX}" placeholder="¿Qué temas evalúa este examen?" required
            aria-describedby="examen-descripcion-contador examen-descripcion-error"></textarea>
          <p class="campo__ayuda campo__contador" id="examen-descripcion-contador" data-ref="contador-descripcion"></p>
          <p class="campo__error" id="examen-descripcion-error"></p>
        </div>

        <label class="interruptor">
          <input class="interruptor__entrada" type="checkbox" role="switch" name="mezclarPreguntas">
          <span class="interruptor__pista" aria-hidden="true"></span>
          <span class="interruptor__texto">
            <strong>Mezclar preguntas y respuestas</strong>
            <small>Cada estudiante las verá en un orden aleatorio distinto.</small>
          </span>
        </label>

        <div class="formulario__acciones">
          <button type="button" class="btn btn--fantasma" data-accion="cancelar">Cancelar edición</button>
          <button type="submit" class="btn btn--primario" data-ref="boton-guardar"></button>
        </div>
      </form>`;
  }

  #aplicarModo() {
    const esEdicion = this.#idEditando !== null;
    const textos = esEdicion ? TEXTOS.editar : TEXTOS.crear;
    const ref = (nombre) => this.querySelector(`[data-ref="${nombre}"]`);

    ref('titulo').textContent = textos.titulo;
    ref('subtitulo').textContent = textos.subtitulo;
    ref('icono').innerHTML = icono(esEdicion ? 'editar' : 'examen');
    ref('boton-guardar').innerHTML = `${icono(textos.icono)} ${textos.boton}`;
    this.querySelector('[data-accion="cancelar"]').hidden = !esEdicion;
    this.#formulario.classList.toggle('formulario-tarjeta--editando', esEdicion);
  }

  /** Muestra cuántos caracteres lleva la descripción. */
  #actualizarContador = () => {
    const largo = this.#formulario.elements.descripcion.value.length;
    this.querySelector('[data-ref="contador-descripcion"]').textContent = `${largo} / ${LIMITES.DESCRIPCION_EXAMEN.MAX} caracteres`;
  };

  #alEnviar = (evento) => {
    evento.preventDefault();
    const datos = obtenerDatosFormulario(this.#formulario);
    datos.mezclarPreguntas = this.#formulario.elements.mezclarPreguntas.checked;

    const { esValido, errores } = validar(datos, crearEsquemaExamen());
    if (!esValido) {
      mostrarErrores(this.#formulario, errores);
      return;
    }
    this.dispatchEvent(new CustomEvent('guardar-examen', { detail: { datos, id: this.#idEditando }, bubbles: true }));
  };

  #alCancelar = () => {
    this.reiniciar();
    this.dispatchEvent(new CustomEvent('cancelar-edicion', { bubbles: true }));
  };
}

customElements.define('formulario-examen', FormularioExamen);
