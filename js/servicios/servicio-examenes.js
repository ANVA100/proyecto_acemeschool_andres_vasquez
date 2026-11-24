/**
 * servicio-examenes.js · Reglas de negocio de los exámenes
 * ---------------------------------------------------------------------------
 * Datos de un examen: código, título, tiempo (minutos), porcentaje de
 * aprobación, descripción y la opción "mezclarPreguntas" (orden aleatorio).
 * Cada examen guarda además su arreglo de preguntas, y cada pregunta su
 * arreglo de respuestas ({ descripcion, esCorrecta }).
 *
 * Reglas:
 *  - Todos los campos son obligatorios y tienen límites (config/constantes.js).
 *  - El código es ÚNICO y se guarda en mayúsculas (p. ej. "MAT-101").
 *  - Al editar los datos generales, las preguntas del examen se conservan.
 *  - Cada pregunta tiene entre 2 y 6 respuestas, sin repetir, y SOLO UNA correcta.
 */
import { CLAVES_ALMACENAMIENTO, LIMITES } from '../config/constantes.js';
import { normalizarTexto, obtenerLetra } from '../utilidades/formato.js';
import { generarId } from '../utilidades/generador-id.js';
import { ErrorValidacion, reglas, validar } from '../utilidades/validaciones.js';
import { crearColeccion } from './coleccion.js';

const examenes = crearColeccion(CLAVES_ALMACENAMIENTO.EXAMENES);

/** Esquema de validación de los datos generales de un examen. */
export function crearEsquemaExamen() {
  const { CODIGO_EXAMEN, TITULO_EXAMEN, TIEMPO_MINUTOS, PORCENTAJE_APROBACION, DESCRIPCION_EXAMEN } = LIMITES;
  return {
    codigo: [
      reglas.requerido('Ingresa el código del examen.'),
      reglas.longitud(CODIGO_EXAMEN.MIN, CODIGO_EXAMEN.MAX),
      reglas.patron(/^[A-Za-z0-9-]+$/, 'Usa solo letras, números y guiones (ej: MAT-101).'),
    ],
    titulo: [reglas.requerido('Ingresa el título del examen.'), reglas.longitud(TITULO_EXAMEN.MIN, TITULO_EXAMEN.MAX)],
    tiempoMinutos: [
      reglas.requerido('Indica cuántos minutos dura el examen.'),
      reglas.numeroEntero(TIEMPO_MINUTOS.MIN, TIEMPO_MINUTOS.MAX),
    ],
    porcentajeAprobacion: [
      reglas.requerido('Indica el porcentaje necesario para aprobar.'),
      reglas.numeroEntero(PORCENTAJE_APROBACION.MIN, PORCENTAJE_APROBACION.MAX),
    ],
    descripcion: [
      reglas.requerido('Escribe una descripción del examen.'),
      reglas.longitud(DESCRIPCION_EXAMEN.MIN, DESCRIPCION_EXAMEN.MAX),
    ],
  };
}

/** Limpia los datos del formulario: espacios, mayúsculas en el código, checkbox → booleano. */
function normalizarDatos(datos) {
  return {
    codigo: String(datos.codigo ?? '').trim().toUpperCase(),
    titulo: String(datos.titulo ?? '').trim().replace(/\s+/g, ' '),
    tiempoMinutos: String(datos.tiempoMinutos ?? '').trim(),
    porcentajeAprobacion: String(datos.porcentajeAprobacion ?? '').trim(),
    descripcion: String(datos.descripcion ?? '').trim(),
    // Un checkbox marcado llega como "on"; si no está marcado, no llega
    mezclarPreguntas: [true, 'on', 'true'].includes(datos.mezclarPreguntas),
  };
}

/** Valida formato y código único; lanza ErrorValidacion si algo falla. */
function validarExamen(datos, idExcluido = null) {
  const { errores } = validar(datos, crearEsquemaExamen());
  const codigoRepetido = examenes
    .obtenerTodos()
    .some((examen) => examen.id !== idExcluido && examen.codigo === datos.codigo);
  if (codigoRepetido && !errores.codigo) {
    errores.codigo = `Ya existe un examen con el código ${datos.codigo}.`;
  }
  if (Object.keys(errores).length > 0) throw new ErrorValidacion(errores);
}

/** Convierte los campos numéricos de texto a número. */
function convertirTipos(datos) {
  return {
    ...datos,
    tiempoMinutos: Number(datos.tiempoMinutos),
    porcentajeAprobacion: Number(datos.porcentajeAprobacion),
  };
}

/** @returns {object[]} Exámenes ordenados por código (MAT-2 antes que MAT-10). */
export function obtenerExamenes() {
  return examenes
    .obtenerTodos()
    .sort((a, b) => a.codigo.localeCompare(b.codigo, 'es', { numeric: true }));
}

/** @returns {object|null} */
export function obtenerExamenPorId(id) {
  return examenes.obtenerPorId(id);
}

/**
 * Un examen está disponible para los estudiantes si tiene al menos una pregunta.
 * @param {object} examen
 * @returns {boolean}
 */
export function estaDisponible(examen) {
  return Array.isArray(examen.preguntas) && examen.preguntas.length > 0;
}

/**
 * Crea un examen (todavía sin preguntas).
 * @param {object} datosFormulario
 * @returns {object} Examen creado.
 * @throws {ErrorValidacion}
 */
export function crearExamen(datosFormulario) {
  const datos = normalizarDatos(datosFormulario);
  validarExamen(datos);
  return examenes.agregar({ ...convertirTipos(datos), preguntas: [] });
}

/**
 * Actualiza los datos generales de un examen (sus preguntas no cambian).
 * @param {string} id
 * @param {object} datosFormulario
 * @returns {object} Examen actualizado.
 */
export function actualizarExamen(id, datosFormulario) {
  if (!examenes.obtenerPorId(id)) {
    throw new Error('El examen que intentas editar ya no existe.');
  }
  const datos = normalizarDatos(datosFormulario);
  validarExamen(datos, id);
  return examenes.actualizar(id, convertirTipos(datos));
}

/**
 * Elimina un examen junto con sus preguntas.
 * @param {string} id
 */
export function eliminarExamen(id) {
  if (!examenes.eliminar(id)) {
    throw new Error('El examen que intentas eliminar ya no existe.');
  }
}

/* ==========================================================================
   PREGUNTAS Y RESPUESTAS
   Las preguntas viven dentro de su examen: cada operación lee el examen,
   modifica su arreglo "preguntas" y lo guarda de nuevo.
   ========================================================================== */

/** Primer mensaje de error de una lista de reglas (o '' si todas se cumplen). */
function primerError(valor, listaReglas) {
  return listaReglas.map((regla) => regla(valor)).find(Boolean) ?? '';
}

/** Limpia los textos de una pregunta antes de validarla. */
function normalizarPregunta({ enunciado, respuestas }) {
  return {
    enunciado: String(enunciado ?? '').trim(),
    respuestas: (Array.isArray(respuestas) ? respuestas : []).map((respuesta) => ({
      id: respuesta.id || null,
      descripcion: String(respuesta.descripcion ?? '').trim(),
      esCorrecta: Boolean(respuesta.esCorrecta),
    })),
  };
}

/**
 * Valida una pregunta. La usan el formulario (antes de enviar) y el servicio.
 * Claves de error posibles:
 *  - "enunciado"
 *  - "respuesta-0", "respuesta-1"... (texto de cada respuesta)
 *  - "respuestas" (cantidad incorrecta) y "correcta" (ninguna o varias correctas)
 * @param {{enunciado: string, respuestas: {descripcion: string, esCorrecta: boolean}[]}} pregunta
 * @returns {{esValido: boolean, errores: Record<string, string>}}
 */
export function validarPregunta(pregunta) {
  const { ENUNCIADO, DESCRIPCION_RESPUESTA, RESPUESTAS_POR_PREGUNTA } = LIMITES;
  const { enunciado, respuestas } = normalizarPregunta(pregunta);
  const errores = {};

  const errorEnunciado = primerError(enunciado, [
    reglas.requerido('Escribe el enunciado de la pregunta.'),
    reglas.longitud(ENUNCIADO.MIN, ENUNCIADO.MAX),
  ]);
  if (errorEnunciado) errores.enunciado = errorEnunciado;

  if (respuestas.length < RESPUESTAS_POR_PREGUNTA.MIN || respuestas.length > RESPUESTAS_POR_PREGUNTA.MAX) {
    errores.respuestas = `La pregunta debe tener entre ${RESPUESTAS_POR_PREGUNTA.MIN} y ${RESPUESTAS_POR_PREGUNTA.MAX} respuestas.`;
  }

  // Texto de cada respuesta: obligatorio y sin repetir (sin importar mayúsculas ni tildes)
  const textosVistos = new Map();
  respuestas.forEach((respuesta, indice) => {
    const clave = `respuesta-${indice}`;
    const error = primerError(respuesta.descripcion, [
      reglas.requerido('Escribe el texto de esta respuesta.'),
      reglas.longitud(DESCRIPCION_RESPUESTA.MIN, DESCRIPCION_RESPUESTA.MAX),
    ]);
    if (error) {
      errores[clave] = error;
      return;
    }
    const textoNormalizado = normalizarTexto(respuesta.descripcion);
    if (textosVistos.has(textoNormalizado)) {
      errores[clave] = `Es igual a la respuesta ${obtenerLetra(textosVistos.get(textoNormalizado))}.`;
    } else {
      textosVistos.set(textoNormalizado, indice);
    }
  });

  // Exactamente una respuesta correcta
  const cantidadCorrectas = respuestas.filter((respuesta) => respuesta.esCorrecta).length;
  if (cantidadCorrectas === 0) {
    errores.correcta = 'Marca cuál es la respuesta correcta.';
  } else if (cantidadCorrectas > 1) {
    errores.correcta = 'Solo puede haber una respuesta correcta.';
  }

  return { esValido: Object.keys(errores).length === 0, errores };
}

/** Examen que debe existir para operar con sus preguntas. */
function obtenerExamenObligatorio(examenId) {
  const examen = examenes.obtenerPorId(examenId);
  if (!examen) throw new Error('El examen ya no existe.');
  return examen;
}

/** Valida y arma una pregunta lista para guardar (asigna ids nuevos donde falten). */
function construirPregunta(datos, idPregunta = null) {
  const pregunta = normalizarPregunta(datos);
  const { esValido, errores } = validarPregunta(pregunta);
  if (!esValido) throw new ErrorValidacion(errores);

  return {
    id: idPregunta ?? generarId(),
    enunciado: pregunta.enunciado,
    respuestas: pregunta.respuestas.map((respuesta) => ({ ...respuesta, id: respuesta.id ?? generarId() })),
  };
}

/**
 * Agrega una pregunta al final del examen.
 * @param {string} examenId
 * @param {{enunciado: string, respuestas: object[]}} datos
 * @returns {object} La pregunta creada.
 * @throws {ErrorValidacion}
 */
export function agregarPregunta(examenId, datos) {
  const examen = obtenerExamenObligatorio(examenId);
  const pregunta = construirPregunta(datos);
  examenes.actualizar(examenId, { preguntas: [...examen.preguntas, pregunta] });
  return pregunta;
}

/**
 * Reemplaza el enunciado y las respuestas de una pregunta existente.
 * @returns {object} La pregunta actualizada.
 */
export function actualizarPregunta(examenId, preguntaId, datos) {
  const examen = obtenerExamenObligatorio(examenId);
  const indice = examen.preguntas.findIndex((pregunta) => pregunta.id === preguntaId);
  if (indice === -1) throw new Error('La pregunta que intentas editar ya no existe.');

  const pregunta = construirPregunta(datos, preguntaId);
  const preguntas = examen.preguntas.map((actual, posicion) => (posicion === indice ? pregunta : actual));
  examenes.actualizar(examenId, { preguntas });
  return pregunta;
}

/** Elimina una pregunta del examen. */
export function eliminarPregunta(examenId, preguntaId) {
  const examen = obtenerExamenObligatorio(examenId);
  const preguntas = examen.preguntas.filter((pregunta) => pregunta.id !== preguntaId);
  if (preguntas.length === examen.preguntas.length) {
    throw new Error('La pregunta que intentas eliminar ya no existe.');
  }
  examenes.actualizar(examenId, { preguntas });
}

/**
 * Cambia la posición de una pregunta (el orden en que se muestra si el
 * examen no mezcla las preguntas).
 * @param {number} desplazamiento - -1 para subir, +1 para bajar.
 */
export function moverPregunta(examenId, preguntaId, desplazamiento) {
  const examen = obtenerExamenObligatorio(examenId);
  const origen = examen.preguntas.findIndex((pregunta) => pregunta.id === preguntaId);
  const destino = origen + desplazamiento;
  if (origen === -1 || destino < 0 || destino >= examen.preguntas.length) return;

  const preguntas = [...examen.preguntas];
  [preguntas[origen], preguntas[destino]] = [preguntas[destino], preguntas[origen]];
  examenes.actualizar(examenId, { preguntas });
}
