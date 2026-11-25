/**
 * <vista-examen> · Presentación de un examen (ruta pública #/examen/:id)
 * ---------------------------------------------------------------------------
 * Pantalla 1 · EXAMEN
 *  - Encabezado: título, número total de preguntas y porcentaje para aprobar.
 *  - Barra fija: <temporizador-examen> (tiempo restante en tiempo real) y el
 *    progreso de preguntas respondidas con un mapa para saltar a cada una.
 *  - Preguntas numeradas con sus respuestas: botones de opción (radio), así
 *    solo se puede elegir UNA respuesta por pregunta. Cada clic se guarda.
 *  - Botón "Terminar" al final (pide confirmación si faltan preguntas).
 *  - Si el reloj llega a 0, el examen se envía automáticamente.
 *
 * Pantalla 2 · RESULTADO
 *  - Porcentaje de respuestas acertadas (<anillo-progreso>) y mensaje de
 *    aprobación o no aprobación según el porcentaje configurado en el examen.
 */
import { MOTIVOS_FINALIZACION } from '../../config/constantes.js';
import { obtenerExamenPorId } from '../../servicios/servicio-examenes.js';
import {
  finalizarIntento,
  guardarSeleccion,
  obtenerIntentoActivo,
  obtenerSegundosRestantes,
  obtenerUltimoResultado,
  resolverPreguntas,
} from '../../servicios/servicio-intentos.js';
import { escaparHTML } from '../../utilidades/dom.js';
import {
  formatearDuracion,
  formatearFechaHora,
  formatearPorcentaje,
  obtenerLetra,
  obtenerPrimerNombre,
  pluralizar,
} from '../../utilidades/formato.js';
import { icono } from '../../utilidades/iconos.js';
import { notificar } from '../compartidos/contenedor-notificaciones.js';
import { cancelarConfirmacion, confirmar } from '../compartidos/dialogo-confirmacion.js';
import './anillo-progreso.js';
import './temporizador-examen.js';

class VistaExamen extends HTMLElement {
  #examen = null;
  #intento = null;
  #preguntas = [];
  #selecciones = {};
  #finalizando = false;

  connectedCallback() {
    const examenId = this.contexto?.parametros?.id;
    const intento = obtenerIntentoActivo();

    // 1. Hay un examen en curso para esta ruta
    if (intento && intento.examenId === examenId) {
      const examen = obtenerExamenPorId(examenId);
      if (!examen || obtenerSegundosRestantes(intento) === 0) {
        // Examen eliminado o tiempo agotado mientras no se estaba en la página
        this.#finalizar(MOTIVOS_FINALIZACION.TIEMPO);
        return;
      }
      this.#examen = examen;
      this.#intento = intento;
      this.#selecciones = { ...intento.selecciones };
      this.#preguntas = resolverPreguntas(examen, intento);
      this.#renderizarExamen();
      return;
    }

    // 2. El examen ya terminó en esta pestaña (p. ej. se recargó la página del resultado)
    const ultimoResultado = obtenerUltimoResultado(examenId);
    if (ultimoResultado) {
      this.#renderizarResultado(ultimoResultado, { animar: false });
      return;
    }

    // 3. Hay otro examen en curso, o ninguno
    if (intento) {
      this.#mostrarMensaje({
        icono: 'reloj',
        titulo: 'Tienes otro examen en curso',
        texto: 'Termínalo antes de empezar uno nuevo.',
        enlace: { href: `#/examen/${encodeURIComponent(intento.examenId)}`, texto: 'Continuar mi examen' },
      });
    } else {
      this.#mostrarMensaje({
        icono: 'examen',
        titulo: 'No tienes este examen en curso',
        texto: 'Para presentarlo, elígelo en el catálogo e identifícate.',
        enlace: { href: '#/examenes', texto: 'Ir al catálogo' },
      });
    }
  }

  /* ========================================================================
     PANTALLA DEL EXAMEN
     ======================================================================== */

  #renderizarExamen() {
    const examen = this.#examen;
    const intento = this.#intento;
    const total = this.#preguntas.length;
    const duracionSegundos = Math.round((intento.finalizaEn - intento.iniciadoEn) / 1000);

    const botonesMapa = this.#preguntas
      .map(
        (_, indice) => `
          <li><button type="button" class="mapa-preguntas__boton" data-numero="${indice + 1}">${indice + 1}</button></li>`
      )
      .join('');

    this.innerHTML = `
      <div class="examen">
        <header class="examen__cabecera tarjeta">
          <div class="examen__identidad">
            <span class="codigo">${escaparHTML(examen.codigo)}</span>
            <h1 class="examen__titulo">${escaparHTML(examen.titulo)}</h1>
          </div>
          <ul class="examen__datos" role="list">
            <li>${icono('lista')} <span><strong>${total}</strong> ${total === 1 ? 'pregunta' : 'preguntas'} en total</span></li>
            <li>${icono('porcentaje')} <span>Para aprobar: <strong>${examen.porcentajeAprobacion} %</strong></span></li>
            <li>${icono('usuario')} <span>${escaparHTML(intento.estudiante.nombreCompleto)} · ${escaparHTML(intento.estudiante.identificacion)}</span></li>
          </ul>
        </header>

        <div class="examen__barra">
          <temporizador-examen finaliza-en="${intento.finalizaEn}" duracion="${duracionSegundos}"></temporizador-examen>
          <div class="examen__progreso">
            <p class="examen__progreso-texto">
              Respondidas: <strong data-ref="respondidas" aria-live="polite"></strong>
            </p>
            <div class="barra-progreso" role="progressbar" aria-label="Preguntas respondidas"
              aria-valuemin="0" aria-valuemax="${total}">
              <span class="barra-progreso__relleno"></span>
            </div>
            <nav class="mapa-preguntas" aria-label="Ir a una pregunta">
              <ol role="list">${botonesMapa}</ol>
            </nav>
          </div>
        </div>

        <form class="examen__formulario" novalidate aria-label="Preguntas del examen">
          ${this.#preguntas.map((pregunta, indice) => this.#renderizarPregunta(pregunta, indice, total)).join('')}

          <div class="examen__final tarjeta">
            <p data-ref="resumen-final"></p>
            <button type="submit" class="btn btn--primario btn--grande">${icono('bandera')} Terminar examen</button>
          </div>
        </form>
      </div>`;

    const formulario = this.querySelector('form');
    formulario.addEventListener('change', this.#alElegirRespuesta);
    formulario.addEventListener('submit', this.#alTerminar);
    this.querySelector('.mapa-preguntas').addEventListener('click', this.#alSaltarAPregunta);
    this.addEventListener('tiempo-agotado', this.#alAgotarTiempo);

    this.#actualizarProgreso();
  }

  #renderizarPregunta(pregunta, indice, total) {
    const numero = indice + 1;
    const opciones = pregunta.respuestas
      .map(
        (respuesta, posicion) => `
          <label class="opcion">
            <input class="opcion__entrada" type="radio" name="pregunta-${escaparHTML(pregunta.id)}"
              value="${escaparHTML(respuesta.id)}" ${this.#selecciones[pregunta.id] === respuesta.id ? 'checked' : ''}>
            <span class="opcion__letra" aria-hidden="true">${obtenerLetra(posicion)}</span>
            <span class="opcion__texto">${escaparHTML(respuesta.descripcion)}</span>
          </label>`
      )
      .join('');

    return `
      <fieldset class="pregunta-examen escalonado" id="pregunta-examen-${numero}"
        data-pregunta-id="${escaparHTML(pregunta.id)}" style="--indice: ${Math.min(indice, 8)}">
        <legend class="pregunta-examen__enunciado">
          <span class="pregunta-examen__numero">Pregunta ${numero} de ${total}</span>
          <span class="pregunta-examen__texto">${escaparHTML(pregunta.enunciado)}</span>
        </legend>
        <div class="opciones">${opciones}</div>
      </fieldset>`;
  }

  /** Actualiza contador, barra de progreso, mapa y mensaje final. */
  #actualizarProgreso() {
    const total = this.#preguntas.length;
    const respondidas = this.#preguntas.filter((pregunta) => this.#selecciones[pregunta.id]).length;
    const faltan = total - respondidas;

    this.querySelector('[data-ref="respondidas"]').textContent = `${respondidas} de ${total}`;
    const barra = this.querySelector('.barra-progreso');
    barra.setAttribute('aria-valuenow', String(respondidas));
    barra.querySelector('.barra-progreso__relleno').style.transform = `scaleX(${total ? respondidas / total : 0})`;

    this.querySelectorAll('.mapa-preguntas__boton').forEach((boton, indice) => {
      const respondida = Boolean(this.#selecciones[this.#preguntas[indice].id]);
      boton.classList.toggle('mapa-preguntas__boton--respondida', respondida);
      boton.setAttribute('aria-label', `Pregunta ${indice + 1}, ${respondida ? 'respondida' : 'sin responder'}`);
    });

    this.querySelector('[data-ref="resumen-final"]').innerHTML =
      faltan > 0
        ? `Te falta${faltan === 1 ? '' : 'n'} <strong>${pluralizar(faltan, 'pregunta')}</strong> por responder.`
        : '¡Respondiste todas las preguntas! Revisa tus respuestas y pulsa <strong>Terminar examen</strong>.';
  }

  #alElegirRespuesta = (evento) => {
    const entrada = evento.target;
    if (!entrada.matches('.opcion__entrada')) return;
    const preguntaId = entrada.closest('[data-pregunta-id]').dataset.preguntaId;

    if (!guardarSeleccion(preguntaId, entrada.value)) {
      // El tiempo terminó justo ahora (o el intento ya no existe)
      this.#alAgotarTiempo();
      return;
    }
    this.#selecciones[preguntaId] = entrada.value;
    this.#actualizarProgreso();
  };

  /** El mapa de preguntas lleva a cada una y enfoca su respuesta. */
  #alSaltarAPregunta = (evento) => {
    const boton = evento.target.closest('[data-numero]');
    if (!boton) return;
    const pregunta = this.querySelector(`#pregunta-examen-${boton.dataset.numero}`);
    pregunta.scrollIntoView({ behavior: 'smooth', block: 'start' });
    const entrada = pregunta.querySelector('.opcion__entrada:checked') ?? pregunta.querySelector('.opcion__entrada');
    entrada?.focus({ preventScroll: true });
  };

  #alTerminar = async (evento) => {
    evento.preventDefault();
    if (this.#finalizando) return;

    const faltan = this.#preguntas.filter((pregunta) => !this.#selecciones[pregunta.id]).length;
    const acepto = await confirmar(
      faltan > 0
        ? {
            titulo: `Tienes ${pluralizar(faltan, 'pregunta')} sin responder`,
            mensaje: 'Las preguntas sin responder cuentan como incorrectas. ¿Quieres terminar de todos modos?',
            textoConfirmar: 'Terminar examen',
            textoCancelar: 'Seguir respondiendo',
            tipo: 'advertencia',
          }
        : {
            titulo: '¿Terminar el examen?',
            mensaje: 'Después de terminar ya no podrás cambiar tus respuestas.',
            textoConfirmar: 'Terminar examen',
            textoCancelar: 'Revisar respuestas',
            tipo: 'info',
          }
    );
    if (acepto) this.#finalizar(MOTIVOS_FINALIZACION.ESTUDIANTE);
  };

  #alAgotarTiempo = () => {
    if (this.#finalizando) return;
    notificar('¡Se acabó el tiempo! Tus respuestas se enviaron automáticamente.', {
      tipo: 'advertencia',
      duracion: 7000,
    });
    this.#finalizar(MOTIVOS_FINALIZACION.TIEMPO);
  };

  /** Califica una sola vez (el botón y el reloj podrían intentarlo a la vez). */
  #finalizar(motivo) {
    if (this.#finalizando) return;
    this.#finalizando = true;
    this.querySelector('temporizador-examen')?.detener();
    cancelarConfirmacion(); // si el diálogo "¿Terminar?" estaba abierto, se cierra

    try {
      const resultado = finalizarIntento(motivo);
      this.#renderizarResultado(resultado, { animar: true });
      window.scrollTo({ top: 0 });
      this.querySelector('h1')?.focus();
    } catch (error) {
      this.#mostrarMensaje({
        icono: 'alerta',
        titulo: 'No se pudo calificar el examen',
        texto: error.message,
        enlace: { href: '#/examenes', texto: 'Ir al catálogo' },
      });
    }
  }

  /* ========================================================================
     PANTALLA DEL RESULTADO
     ======================================================================== */

  #renderizarResultado(resultado, { animar }) {
    const { examen, estudiante, aprobado } = resultado;
    const nombre = escaparHTML(obtenerPrimerNombre(estudiante.nombreCompleto));
    const incorrectas = resultado.totalPreguntas - resultado.respuestasCorrectas - resultado.sinResponder;
    const porTiempo = resultado.motivoFinalizacion === MOTIVOS_FINALIZACION.TIEMPO;

    const detalles = [
      ['Examen', `${escaparHTML(examen.codigo)} · ${escaparHTML(examen.titulo)}`],
      ['Estudiante', escaparHTML(estudiante.nombreCompleto)],
      ['Identificación', escaparHTML(estudiante.identificacion)],
      ['Correctas', resultado.respuestasCorrectas],
      ['Incorrectas', incorrectas],
      ['Sin responder', resultado.sinResponder],
      ['Tiempo empleado', `${formatearDuracion(resultado.duracionSegundos)} de ${examen.tiempoMinutos} min`],
      ['Finalizado', formatearFechaHora(resultado.finalizadoEn)],
    ]
      .map(([titulo, valor]) => `<div class="resultado__dato"><dt>${titulo}</dt><dd>${valor}</dd></div>`)
      .join('');

    const confeti =
      animar && aprobado
        ? `<div class="confeti" aria-hidden="true">${'<span></span>'.repeat(14)}</div>`
        : '';

    this.innerHTML = `
      <section class="resultado tarjeta ${aprobado ? 'resultado--aprobado' : 'resultado--reprobado'} ${animar ? 'animar-escala' : ''}"
        aria-labelledby="titulo-resultado">
        ${confeti}
        <div class="resultado__principal">
          <anillo-progreso valor="${resultado.porcentajeObtenido}" estado="${aprobado ? 'aprobado' : 'reprobado'}"
            etiqueta="de aciertos"></anillo-progreso>
          <div class="resultado__texto">
            <span class="insignia ${aprobado ? 'insignia--exito' : 'insignia--peligro'} resultado__insignia">
              ${icono(aprobado ? 'medalla' : 'error')} ${aprobado ? 'Examen aprobado' : 'Examen no aprobado'}
            </span>
            <h1 class="resultado__titulo" id="titulo-resultado" tabindex="-1">
              ${aprobado ? `¡Felicitaciones, ${nombre}! Aprobaste` : `${nombre}, esta vez no alcanzaste el puntaje`}
            </h1>
            <p class="resultado__mensaje">
              Respondiste correctamente <strong>${resultado.respuestasCorrectas} de ${resultado.totalPreguntas}</strong>
              preguntas, es decir, el <strong>${formatearPorcentaje(resultado.porcentajeObtenido)}</strong>.
              Para aprobar se necesitaba el <strong>${examen.porcentajeAprobacion} %</strong>.
            </p>
            ${
              porTiempo
                ? `<p class="alerta alerta--advertencia">${icono('reloj')}<span>El tiempo se agotó y el examen se envió automáticamente.</span></p>`
                : ''
            }
          </div>
        </div>

        <dl class="resultado__detalles">${detalles}</dl>

        <div class="resultado__acciones">
          <a class="btn btn--primario btn--grande" href="#/examenes">${icono('flecha-izquierda')} Volver al catálogo</a>
        </div>
      </section>`;
  }

  #mostrarMensaje({ icono: nombreIcono, titulo, texto, enlace }) {
    this.innerHTML = `
      <section class="vista-mensaje tarjeta" aria-labelledby="titulo-mensaje-examen">
        <span class="vista-mensaje__icono">${icono(nombreIcono)}</span>
        <h1 class="vista-mensaje__titulo" id="titulo-mensaje-examen">${escaparHTML(titulo)}</h1>
        <p class="vista-mensaje__texto">${escaparHTML(texto)}</p>
        <a class="btn btn--primario" href="${enlace.href}">${escaparHTML(enlace.texto)}</a>
      </section>`;
  }
}

customElements.define('vista-examen', VistaExamen);
