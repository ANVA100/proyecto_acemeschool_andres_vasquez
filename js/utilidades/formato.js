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
