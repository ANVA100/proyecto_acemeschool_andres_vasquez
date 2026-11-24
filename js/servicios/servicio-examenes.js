/**
 * servicio-examenes.js · Reglas de negocio de los exámenes
 * ---------------------------------------------------------------------------
 * Datos de un examen: código, título, tiempo (minutos), porcentaje de
 * aprobación, descripción y la opción "mezclarPreguntas" (orden aleatorio).
 * Cada examen guarda además su arreglo de preguntas (se gestionan en la parte 7).
 *
 * Reglas:
 *  - Todos los campos son obligatorios y tienen límites (config/constantes.js).
 *  - El código es ÚNICO y se guarda en mayúsculas (p. ej. "MAT-101").
 *  - Al editar los datos generales, las preguntas del examen se conservan.
 */
import { CLAVES_ALMACENAMIENTO, LIMITES } from '../config/constantes.js';
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
