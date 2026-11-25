/**
 * <vista-resultados> · Panel de resultados (privado, extra)
 * ---------------------------------------------------------------------------
 * Muestra los exámenes presentados por los estudiantes (acme_intentos):
 *  - Estadísticas: intentos, aprobados, promedio de aciertos y estudiantes.
 *  - Filtros: búsqueda libre + examen + estado (aprobado / no aprobado).
 *    Las estadísticas se recalculan según los filtros.
 *  - Tabla con botón para ver el detalle (respuesta elegida vs. correcta en
 *    cada pregunta) y para eliminar un resultado.
 */
import {
  calcularEstadisticas,
  eliminarResultado,
  obtenerResultadoPorId,
  obtenerResultados,
} from '../../servicios/servicio-intentos.js';
import { MOTIVOS_FINALIZACION } from '../../config/constantes.js';
import { escaparHTML } from '../../utilidades/dom.js';
import {
  formatearDuracion,
  formatearFechaHora,
  formatearPorcentaje,
  normalizarTexto,
  pluralizar,
} from '../../utilidades/formato.js';
import { icono } from '../../utilidades/iconos.js';
import { notificar } from '../compartidos/contenedor-notificaciones.js';
import { confirmar } from '../compartidos/dialogo-confirmacion.js';
import '../compartidos/tarjeta-estadistica.js';
import '../publico/anillo-progreso.js';
import './tabla-resultados.js';

const ESTADOS = Object.freeze({ TODOS: '', APROBADOS: 'aprobados', NO_APROBADOS: 'no-aprobados' });

class VistaResultados extends HTMLElement {
  #filtros = { termino: '', examen: '', estado: ESTADOS.TODOS };
  #tabla;
  #detalle;
  #disparadorDetalle = null;

  connectedCallback() {
    this.innerHTML = `
      <div class="encabezado-vista">
        <div>
          <h1 class="encabezado-vista__titulo">Resultados</h1>
          <p class="encabezado-vista__descripcion">
            Consulta los exámenes presentados por los estudiantes: su porcentaje de aciertos y si aprobaron.
          </p>
        </div>
      </div>

      <section class="estadisticas" aria-label="Resumen de resultados" data-ref="estadisticas"></section>

      <section class="tarjeta tarjeta--tabla" aria-labelledby="titulo-historial">
        <div class="tarjeta__encabezado">
          <div>
            <h2 class="tarjeta__titulo" id="titulo-historial">Historial de intentos</h2>
            <p class="tarjeta__subtitulo" data-ref="contador" aria-live="polite"></p>
          </div>
          <div class="filtros-resultados">
            <campo-busqueda class="filtros-resultados__busqueda" etiqueta="Buscar resultados"
              placeholder="Estudiante, identificación o examen…"></campo-busqueda>
            <label class="sr-only" for="filtro-examen">Filtrar por examen</label>
            <select class="campo__entrada filtros-resultados__select" id="filtro-examen" data-filtro="examen"></select>
            <label class="sr-only" for="filtro-estado">Filtrar por estado</label>
            <select class="campo__entrada filtros-resultados__select" id="filtro-estado" data-filtro="estado">
              <option value="${ESTADOS.TODOS}">Todos los estados</option>
              <option value="${ESTADOS.APROBADOS}">Aprobados</option>
              <option value="${ESTADOS.NO_APROBADOS}">No aprobados</option>
            </select>
          </div>
        </div>
        <tabla-resultados></tabla-resultados>
      </section>

      <dialog class="dialogo dialogo--ancho" aria-labelledby="titulo-detalle-resultado" data-ref="detalle"></dialog>`;

    this.#tabla = this.querySelector('tabla-resultados');
    this.#detalle = this.querySelector('[data-ref="detalle"]');

    this.addEventListener('buscar', this.#alBuscar);
    this.addEventListener('change', this.#alCambiarFiltro);
    this.addEventListener('ver-resultado', this.#alVer);
    this.addEventListener('eliminar-resultado', this.#alEliminar);
    this.#detalle.addEventListener('click', this.#alHacerClicEnDetalle);
    this.#detalle.addEventListener('close', () => this.#disparadorDetalle?.focus());

    this.#renderizarOpcionesExamen();
    this.#refrescar();
  }

  /** Opciones del filtro de examen, a partir de los exámenes que tienen resultados. */
  #renderizarOpcionesExamen() {
    const select = this.querySelector('#filtro-examen');
    const examenes = new Map();
    for (const resultado of obtenerResultados()) {
      examenes.set(resultado.examen.codigo, resultado.examen.titulo);
    }
    const opciones = [...examenes]
      .sort(([a], [b]) => a.localeCompare(b, 'es', { numeric: true }))
      .map(([codigo, titulo]) => `<option value="${escaparHTML(codigo)}">${escaparHTML(codigo)} · ${escaparHTML(titulo)}</option>`)
      .join('');
    select.innerHTML = `<option value="">Todos los exámenes</option>${opciones}`;
    select.value = examenes.has(this.#filtros.examen) ? this.#filtros.examen : '';
    this.#filtros.examen = select.value;
  }

  #aplicarFiltros(resultados) {
    const termino = normalizarTexto(this.#filtros.termino);
    return resultados.filter((resultado) => {
      if (this.#filtros.examen && resultado.examen.codigo !== this.#filtros.examen) return false;
      if (this.#filtros.estado === ESTADOS.APROBADOS && !resultado.aprobado) return false;
      if (this.#filtros.estado === ESTADOS.NO_APROBADOS && resultado.aprobado) return false;
      if (!termino) return true;
      return [
        resultado.estudiante.nombreCompleto,
        resultado.estudiante.identificacion,
        resultado.examen.codigo,
        resultado.examen.titulo,
      ].some((valor) => normalizarTexto(valor).includes(termino));
    });
  }

  #refrescar() {
    const todos = obtenerResultados();
    const visibles = this.#aplicarFiltros(todos);
    const hayFiltros = Boolean(this.#filtros.termino || this.#filtros.examen || this.#filtros.estado);

    this.#renderizarEstadisticas(calcularEstadisticas(visibles), hayFiltros);
    this.#tabla.hayFiltros = hayFiltros;
    this.#tabla.resultados = visibles;
    this.querySelector('[data-ref="contador"]').textContent = hayFiltros
      ? `Mostrando ${visibles.length} de ${pluralizar(todos.length, 'intento')}`
      : pluralizar(todos.length, 'intento registrado', 'intentos registrados');
  }

  #renderizarEstadisticas(estadisticas, hayFiltros) {
    const sufijo = hayFiltros ? ' (con los filtros)' : '';
    const tarjetas = [
      { icono: 'examen', tono: 'primario', titulo: 'Intentos', valor: estadisticas.total, detalle: `Exámenes presentados${sufijo}` },
      {
        icono: 'medalla',
        tono: 'exito',
        titulo: 'Aprobados',
        valor: estadisticas.aprobados,
        detalle: `${formatearPorcentaje(estadisticas.tasaAprobacion)} de aprobación`,
      },
      {
        icono: 'porcentaje',
        tono: 'acento',
        titulo: 'Promedio de aciertos',
        valor: formatearPorcentaje(estadisticas.promedio),
        detalle: `${pluralizar(estadisticas.reprobados, 'intento')} sin aprobar`,
      },
      { icono: 'usuarios', tono: 'primario', titulo: 'Estudiantes', valor: estadisticas.estudiantes, detalle: 'Identificaciones distintas' },
    ];

    const contenedor = this.querySelector('[data-ref="estadisticas"]');
    contenedor.replaceChildren(
      ...tarjetas.map((datos) => {
        const tarjeta = document.createElement('tarjeta-estadistica');
        for (const [atributo, valor] of Object.entries(datos)) tarjeta.setAttribute(atributo, valor);
        return tarjeta;
      })
    );
  }

  /* ---------- Detalle de un resultado ---------- */

  #renderizarDetalle(resultado) {
    const porTiempo = resultado.motivoFinalizacion === MOTIVOS_FINALIZACION.TIEMPO;
    const preguntas = resultado.respuestas
      .map((respuesta, indice) => {
        const estado = respuesta.respuestaId === null ? 'sin-responder' : respuesta.esCorrecta ? 'correcta' : 'incorrecta';
        const etiqueta = { correcta: 'Correcta', incorrecta: 'Incorrecta', 'sin-responder': 'Sin responder' }[estado];
        const iconoEstado = { correcta: 'exito', incorrecta: 'error', 'sin-responder': 'alerta' }[estado];
        return `
          <li class="detalle-pregunta detalle-pregunta--${estado}">
            <p class="detalle-pregunta__enunciado"><span>${indice + 1}.</span> ${escaparHTML(respuesta.enunciado)}</p>
            <p class="detalle-pregunta__fila">
              ${icono(iconoEstado)}
              <span><strong>${etiqueta}.</strong> Respondió: ${respuesta.respuestaElegida ? `«${escaparHTML(respuesta.respuestaElegida)}»` : '—'}</span>
            </p>
            ${
              respuesta.esCorrecta
                ? ''
                : `<p class="detalle-pregunta__correcta">Respuesta correcta: «${escaparHTML(respuesta.respuestaCorrecta ?? '—')}»</p>`
            }
          </li>`;
      })
      .join('');

    this.#detalle.innerHTML = `
      <div class="dialogo__contenido detalle">
        <div class="detalle__encabezado">
          <div>
            <p class="detalle__antetitulo">${escaparHTML(resultado.examen.codigo)} · ${escaparHTML(resultado.examen.titulo)}</p>
            <h2 class="dialogo__titulo" id="titulo-detalle-resultado">${escaparHTML(resultado.estudiante.nombreCompleto)}</h2>
            <p class="texto-tenue texto-pequeno">Identificación ${escaparHTML(resultado.estudiante.identificacion)}</p>
          </div>
          <button type="button" class="btn btn--fantasma btn--icono" data-accion="cerrar-detalle" aria-label="Cerrar detalle">
            ${icono('cerrar')}
          </button>
        </div>

        <div class="detalle__resumen">
          <anillo-progreso style="--tamano: 7rem" valor="${resultado.porcentajeObtenido}"
            estado="${resultado.aprobado ? 'aprobado' : 'reprobado'}" etiqueta="de aciertos"></anillo-progreso>
          <div class="detalle__datos">
            <span class="insignia ${resultado.aprobado ? 'insignia--exito' : 'insignia--peligro'}">
              ${resultado.aprobado ? 'Aprobado' : 'No aprobado'} · necesitaba ${resultado.examen.porcentajeAprobacion} %
            </span>
            <p>${resultado.respuestasCorrectas} de ${resultado.totalPreguntas} correctas · ${pluralizar(resultado.sinResponder, 'sin responder', 'sin responder')}</p>
            <p class="texto-tenue texto-pequeno">
              ${formatearFechaHora(resultado.finalizadoEn)} · duró ${formatearDuracion(resultado.duracionSegundos)}
              ${porTiempo ? ' · terminó por tiempo agotado' : ''}
            </p>
          </div>
        </div>

        <h3 class="detalle__subtitulo">Respuestas</h3>
        <ol class="detalle__preguntas" role="list">${preguntas}</ol>

        <div class="dialogo__acciones">
          <button type="button" class="btn btn--primario" data-accion="cerrar-detalle">Cerrar</button>
        </div>
      </div>`;
  }

  #alVer = (evento) => {
    const resultado = obtenerResultadoPorId(evento.detail.id);
    if (!resultado) {
      notificar('Ese resultado ya no existe.', { tipo: 'error' });
      this.#refrescar();
      return;
    }
    // Se recuerda el botón que abrió el detalle para devolverle el foco al cerrar
    this.#disparadorDetalle = this.querySelector(`tr[data-id="${CSS.escape(resultado.id)}"] [data-accion="ver"]`);
    this.#renderizarDetalle(resultado);
    this.#detalle.showModal();
    this.#detalle.querySelector('[data-accion="cerrar-detalle"]').focus();
  };

  #alHacerClicEnDetalle = (evento) => {
    // Clic en un botón "cerrar" o en el fondo oscuro (fuera del contenido)
    if (evento.target.closest('[data-accion="cerrar-detalle"]') || evento.target === this.#detalle) {
      this.#detalle.close();
    }
  };

  #alEliminar = async (evento) => {
    const resultado = obtenerResultadoPorId(evento.detail.id);
    if (!resultado) return;

    const acepto = await confirmar({
      titulo: '¿Eliminar este resultado?',
      mensaje: `Se borrará el intento de ${resultado.estudiante.nombreCompleto} en ${resultado.examen.titulo}. Esta acción no se puede deshacer.`,
      textoConfirmar: 'Eliminar resultado',
    });
    if (!acepto) return;

    try {
      eliminarResultado(resultado.id);
      notificar('Resultado eliminado.', { tipo: 'exito' });
      this.#renderizarOpcionesExamen();
      this.#refrescar();
    } catch (error) {
      notificar(error.message, { tipo: 'error' });
    }
  };

  #alBuscar = (evento) => {
    this.#filtros.termino = evento.detail.termino;
    this.#refrescar();
  };

  #alCambiarFiltro = (evento) => {
    const filtro = evento.target.dataset?.filtro;
    if (!filtro) return;
    this.#filtros[filtro] = evento.target.value;
    this.#refrescar();
  };
}

customElements.define('vista-resultados', VistaResultados);
