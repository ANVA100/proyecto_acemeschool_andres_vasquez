/**
 * servicio-intentos.js · Exámenes presentados por los estudiantes
 * ---------------------------------------------------------------------------
 * Un "intento" es la presentación de un examen por un estudiante. Mientras
 * está en curso se guarda en localStorage ("acme_intento_activo"):
 *
 *   {
 *     id, examenId,
 *     estudiante: { identificacion, nombreCompleto },
 *     iniciadoEn,  finalizaEn,            ← marcas de tiempo (ms)
 *     ordenPreguntas: [idPregunta...],    ← orden en que se muestran
 *     ordenRespuestas: { idPregunta: [idRespuesta...] },
 *     selecciones: { idPregunta: idRespuesta }
 *   }
 *
 * - El estudiante NO inicia sesión: solo escribe su identificación y nombre,
 *   que quedan asociados a sus respuestas.
 * - "finalizaEn" se calcula al empezar. Si se recarga la página, el reloj
 *   sigue contando desde esa hora y no vuelve a empezar.
 * - Si el examen tiene "mezclarPreguntas", el orden aleatorio se sortea UNA
 *   vez al empezar y se guarda, así no cambia al recargar.
 * - Solo puede haber un intento en curso por navegador.
 *
 * Al terminar (botón "Terminar" o tiempo agotado) se califica y el resultado
 * se guarda en "acme_intentos" con una copia de los datos del examen, así el
 * historial sigue siendo válido aunque después el examen se edite o elimine.
 */
import { CLAVES_ALMACENAMIENTO, LIMITES, MOTIVOS_FINALIZACION } from '../config/constantes.js';
import { mezclarArreglo } from '../utilidades/aleatorio.js';
import { generarId } from '../utilidades/generador-id.js';
import { ErrorValidacion, PATRONES, reglas, validar } from '../utilidades/validaciones.js';
import { eliminarDatos, guardarDatos, leerDatos } from './almacenamiento.js';
import { crearColeccion } from './coleccion.js';
import { estaDisponible, obtenerExamenPorId } from './servicio-examenes.js';

const resultados = crearColeccion(CLAVES_ALMACENAMIENTO.INTENTOS);

/** sessionStorage: último resultado de esta pestaña (para volver a mostrarlo si se recarga). */
const CLAVE_ULTIMO_RESULTADO = 'acme_ultimo_resultado';

/** Esquema de los datos con los que se identifica el estudiante. */
export function crearEsquemaEstudiante() {
  const { IDENTIFICACION, NOMBRE_COMPLETO } = LIMITES;
  return {
    identificacion: [
      reglas.requerido('Ingresa tu número de identificación.'),
      reglas.soloDigitos(IDENTIFICACION.MIN, IDENTIFICACION.MAX),
    ],
    nombreCompleto: [
      reglas.requerido('Ingresa tu nombre completo.'),
      reglas.longitud(NOMBRE_COMPLETO.MIN, NOMBRE_COMPLETO.MAX),
      reglas.patron(PATRONES.NOMBRE_PERSONA, 'Usa solo letras y espacios.'),
    ],
  };
}

/** @returns {object|null} El intento en curso guardado en este navegador. */
export function obtenerIntentoActivo() {
  const intento = leerDatos(CLAVES_ALMACENAMIENTO.INTENTO_ACTIVO);
  return intento && typeof intento === 'object' && intento.examenId ? intento : null;
}

/**
 * Segundos que le quedan a un intento (nunca negativo).
 * @param {object} intento
 * @param {number} [ahora=Date.now()]
 */
export function obtenerSegundosRestantes(intento, ahora = Date.now()) {
  return Math.max(0, Math.ceil((intento.finalizaEn - ahora) / 1000));
}

/**
 * Empieza un examen: valida los datos del estudiante, sortea el orden (si el
 * examen lo pide) y fija la hora en que se acaba el tiempo.
 * @param {string} examenId
 * @param {{identificacion: string, nombreCompleto: string}} datosEstudiante
 * @returns {object} El intento creado (o el que ya estaba en curso si es el mismo).
 * @throws {ErrorValidacion|Error}
 */
export function iniciarIntento(examenId, datosEstudiante) {
  const examen = obtenerExamenPorId(examenId);
  if (!examen || !estaDisponible(examen)) {
    throw new Error('Este examen ya no está disponible.');
  }

  const estudiante = {
    identificacion: String(datosEstudiante.identificacion ?? '').trim(),
    nombreCompleto: String(datosEstudiante.nombreCompleto ?? '').trim().replace(/\s+/g, ' '),
  };
  const { esValido, errores } = validar(estudiante, crearEsquemaEstudiante());
  if (!esValido) throw new ErrorValidacion(errores);

  const activo = obtenerIntentoActivo();
  if (activo) {
    // El mismo estudiante volviendo a su examen: se retoma, no se reinicia el tiempo
    if (activo.examenId === examenId && activo.estudiante.identificacion === estudiante.identificacion) {
      return activo;
    }
    throw new Error('Ya hay un examen en curso en este navegador. Termínalo antes de empezar otro.');
  }

  const mezclar = Boolean(examen.mezclarPreguntas);
  const preguntas = mezclar ? mezclarArreglo(examen.preguntas) : examen.preguntas;
  const ahora = Date.now();

  const intento = {
    id: generarId(),
    examenId,
    estudiante,
    iniciadoEn: ahora,
    finalizaEn: ahora + examen.tiempoMinutos * 60 * 1000,
    ordenPreguntas: preguntas.map((pregunta) => pregunta.id),
    ordenRespuestas: Object.fromEntries(
      preguntas.map((pregunta) => [
        pregunta.id,
        (mezclar ? mezclarArreglo(pregunta.respuestas) : pregunta.respuestas).map((respuesta) => respuesta.id),
      ])
    ),
    selecciones: {},
  };

  guardarDatos(CLAVES_ALMACENAMIENTO.INTENTO_ACTIVO, intento);
  return intento;
}

/**
 * Preguntas del examen en el orden del intento, cada una con sus respuestas
 * también en el orden del intento.
 * Es tolerante a cambios: si el docente eliminó una pregunta o respuesta
 * mientras el estudiante presentaba, simplemente no se muestra.
 * @param {object} examen
 * @param {object} intento
 * @returns {object[]}
 */
export function resolverPreguntas(examen, intento) {
  const preguntasPorId = new Map(examen.preguntas.map((pregunta) => [pregunta.id, pregunta]));

  return intento.ordenPreguntas
    .filter((id) => preguntasPorId.has(id))
    .map((id) => {
      const pregunta = preguntasPorId.get(id);
      const respuestasPorId = new Map(pregunta.respuestas.map((respuesta) => [respuesta.id, respuesta]));
      const orden = (intento.ordenRespuestas?.[id] ?? []).filter((idRespuesta) => respuestasPorId.has(idRespuesta));
      const faltantes = pregunta.respuestas.filter((respuesta) => !orden.includes(respuesta.id));
      return {
        ...pregunta,
        respuestas: [...orden.map((idRespuesta) => respuestasPorId.get(idRespuesta)), ...faltantes],
      };
    });
}

/**
 * Guarda la respuesta elegida para una pregunta (se llama en cada clic).
 * @returns {boolean} false si ya no hay intento o se acabó el tiempo.
 */
export function guardarSeleccion(preguntaId, respuestaId) {
  const intento = obtenerIntentoActivo();
  if (!intento || obtenerSegundosRestantes(intento) === 0) return false;
  intento.selecciones = { ...intento.selecciones, [preguntaId]: respuestaId };
  guardarDatos(CLAVES_ALMACENAMIENTO.INTENTO_ACTIVO, intento);
  return true;
}

/**
 * Califica el intento y arma el registro que se guarda en el historial.
 * - porcentajeObtenido = respuestas correctas / total de preguntas × 100
 * - aprobado si ese porcentaje es mayor o igual al de aprobación del examen.
 *   La comparación se hace con números enteros (correctas × 100 ≥ % × total)
 *   porque con decimales JavaScript se equivoca: 29 / 50 * 100 = 57.99999999999999.
 */
function construirResultado(examen, intento, motivo, ahora) {
  const respuestas = resolverPreguntas(examen, intento).map((pregunta) => {
    const idElegida = intento.selecciones?.[pregunta.id] ?? null;
    const elegida = pregunta.respuestas.find((respuesta) => respuesta.id === idElegida) ?? null;
    const correcta = pregunta.respuestas.find((respuesta) => respuesta.esCorrecta) ?? null;
    return {
      preguntaId: pregunta.id,
      enunciado: pregunta.enunciado,
      respuestaId: elegida?.id ?? null,
      respuestaElegida: elegida?.descripcion ?? null,
      respuestaCorrecta: correcta?.descripcion ?? null,
      esCorrecta: Boolean(elegida && correcta && elegida.id === correcta.id),
    };
  });

  const totalPreguntas = respuestas.length;
  const respuestasCorrectas = respuestas.filter((respuesta) => respuesta.esCorrecta).length;
  const porcentajeExacto = totalPreguntas > 0 ? (respuestasCorrectas / totalPreguntas) * 100 : 0;
  // Si se acabó el tiempo, la hora de fin es la del límite (aunque se califique después)
  const finReal = Math.min(ahora, intento.finalizaEn);

  return {
    examenId: examen.id,
    examen: {
      codigo: examen.codigo,
      titulo: examen.titulo,
      tiempoMinutos: examen.tiempoMinutos,
      porcentajeAprobacion: examen.porcentajeAprobacion,
    },
    estudiante: intento.estudiante,
    respuestas,
    totalPreguntas,
    respuestasCorrectas,
    sinResponder: respuestas.filter((respuesta) => respuesta.respuestaId === null).length,
    porcentajeObtenido: Math.round(porcentajeExacto * 10) / 10,
    aprobado: totalPreguntas > 0 && respuestasCorrectas * 100 >= examen.porcentajeAprobacion * totalPreguntas,
    motivoFinalizacion: motivo,
    iniciadoEn: new Date(intento.iniciadoEn).toISOString(),
    finalizadoEn: new Date(finReal).toISOString(),
    duracionSegundos: Math.max(0, Math.round((finReal - intento.iniciadoEn) / 1000)),
  };
}

/**
 * Termina el examen en curso: lo califica, guarda el resultado en el
 * historial ("acme_intentos") y elimina el intento activo.
 * @param {'estudiante'|'tiempo'} [motivo]
 * @returns {object} El resultado guardado.
 */
export function finalizarIntento(motivo = MOTIVOS_FINALIZACION.ESTUDIANTE) {
  const intento = obtenerIntentoActivo();
  if (!intento) throw new Error('No hay ningún examen en curso.');

  const examen = obtenerExamenPorId(intento.examenId);
  if (!examen) {
    eliminarDatos(CLAVES_ALMACENAMIENTO.INTENTO_ACTIVO);
    throw new Error('El examen fue eliminado mientras se presentaba y no se pudo calificar.');
  }

  const resultado = resultados.agregar(construirResultado(examen, intento, motivo, Date.now()));
  eliminarDatos(CLAVES_ALMACENAMIENTO.INTENTO_ACTIVO);
  sessionStorage.setItem(CLAVE_ULTIMO_RESULTADO, resultado.id);
  return resultado;
}

/**
 * Si el examen en curso ya se quedó sin tiempo (p. ej. el estudiante cerró la
 * pestaña), lo califica automáticamente. Se llama al arrancar la app.
 * @returns {object|null} El resultado, si se calificó alguno.
 */
export function finalizarIntentosVencidos() {
  const intento = obtenerIntentoActivo();
  if (!intento || obtenerSegundosRestantes(intento) > 0) return null;
  try {
    return finalizarIntento(MOTIVOS_FINALIZACION.TIEMPO);
  } catch (error) {
    console.warn('[Intentos] No se pudo calificar un examen vencido:', error);
    return null;
  }
}

/**
 * Último resultado de esta pestaña para un examen (para mostrarlo de nuevo
 * si se recarga la página después de terminar).
 * @returns {object|null}
 */
export function obtenerUltimoResultado(examenId) {
  const id = sessionStorage.getItem(CLAVE_ULTIMO_RESULTADO);
  const resultado = id ? resultados.obtenerPorId(id) : null;
  return resultado && resultado.examenId === examenId ? resultado : null;
}
