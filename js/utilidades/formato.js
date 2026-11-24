/**
 * formato.js · Funciones para mostrar datos de forma legible
 */

/**
 * Iniciales para el avatar: primera letra de las dos primeras palabras.
 * "Laura Gómez" → "LG"
 * @param {string} nombreCompleto
 * @returns {string}
 */
export function obtenerIniciales(nombreCompleto = '') {
  const palabras = nombreCompleto.trim().split(/\s+/).filter(Boolean);
  return palabras
    .slice(0, 2)
    .map((palabra) => palabra[0].toUpperCase())
    .join('');
}

/**
 * Primer nombre de una persona. "Laura Gómez" → "Laura"
 * @param {string} nombreCompleto
 * @returns {string}
 */
export function obtenerPrimerNombre(nombreCompleto = '') {
  return nombreCompleto.trim().split(/\s+/)[0] ?? '';
}

/**
 * Prepara un texto para comparar en búsquedas: minúsculas y sin tildes.
 * "Gómez" → "gomez" (así buscar "gomez" encuentra "Gómez").
 * @param {*} texto
 * @returns {string}
 */
export function normalizarTexto(texto) {
  return String(texto ?? '')
    .normalize('NFD') // separa cada letra de su tilde: "ó" → "o" + "´"
    .replace(/[\u0300-\u036f]/g, '') // elimina las tildes sueltas
    .toLowerCase()
    .trim();
}

/**
 * Letra de una opción según su posición: 0 → "A", 1 → "B", 2 → "C"...
 * @param {number} indice
 * @returns {string}
 */
export function obtenerLetra(indice) {
  return String.fromCharCode(65 + indice);
}

/**
 * Formato de reloj: 600 → "10:00", 65 → "01:05", 3725 → "1:02:05".
 * @param {number} segundos
 * @returns {string}
 */
export function formatearReloj(segundos) {
  const total = Math.max(0, Math.floor(segundos));
  const horas = Math.floor(total / 3600);
  const minutos = Math.floor((total % 3600) / 60);
  const resto = total % 60;
  const dosDigitos = (numero) => String(numero).padStart(2, '0');
  return horas > 0
    ? `${horas}:${dosDigitos(minutos)}:${dosDigitos(resto)}`
    : `${dosDigitos(minutos)}:${dosDigitos(resto)}`;
}

/**
 * Duración legible: 252 → "4 min 12 s", 45 → "45 s", 600 → "10 min".
 * @param {number} segundos
 * @returns {string}
 */
export function formatearDuracion(segundos) {
  const total = Math.max(0, Math.round(segundos));
  const minutos = Math.floor(total / 60);
  const resto = total % 60;
  if (minutos === 0) return `${resto} s`;
  return resto === 0 ? `${minutos} min` : `${minutos} min ${resto} s`;
}

/**
 * Porcentaje con máximo un decimal y coma decimal: 66.666 → "66,7 %".
 * @param {number} valor
 * @returns {string}
 */
export function formatearPorcentaje(valor) {
  return `${new Intl.NumberFormat('es-CO', { maximumFractionDigits: 1 }).format(valor)} %`;
}

/**
 * Fecha y hora legibles: "24 nov 2026, 10:35 a. m."
 * @param {string|number|Date} fecha
 * @returns {string}
 */
export function formatearFechaHora(fecha) {
  return new Intl.DateTimeFormat('es-CO', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(fecha));
}

/**
 * Cantidad con la palabra en singular o plural.
 * pluralizar(1, 'usuario') → "1 usuario" · pluralizar(3, 'usuario') → "3 usuarios"
 * @param {number} cantidad
 * @param {string} singular
 * @param {string} [plural]
 * @returns {string}
 */
export function pluralizar(cantidad, singular, plural = `${singular}s`) {
  return `${cantidad} ${cantidad === 1 ? singular : plural}`;
}
