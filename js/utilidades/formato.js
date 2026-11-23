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
