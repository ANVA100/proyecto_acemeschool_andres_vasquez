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
 */
import { CLAVES_ALMACENAMIENTO, LIMITES } from '../config/constantes.js';
import { mezclarArreglo } from '../utilidades/aleatorio.js';
import { generarId } from '../utilidades/generador-id.js';
import { ErrorValidacion, PATRONES, reglas, validar } from '../utilidades/validaciones.js';
import { guardarDatos, leerDatos } from './almacenamiento.js';
import { estaDisponible, obtenerExamenPorId } from './servicio-examenes.js';

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
