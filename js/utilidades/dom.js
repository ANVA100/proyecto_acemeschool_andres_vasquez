/**
 * dom.js · Utilidades para generar HTML de forma segura
 */

const ENTIDADES_HTML = Object.freeze({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
});

/**
 * Escapa los caracteres especiales de HTML.
 * Se usa SIEMPRE que un texto escrito por el usuario (nombres, títulos,
 * enunciados...) se inserta con innerHTML. Así se evita que alguien inyecte
 * código (ataque XSS) escribiendo, por ejemplo, "<script>" en un formulario.
 * @param {*} texto
 * @returns {string}
 */
export function escaparHTML(texto) {
  return String(texto ?? '').replace(/[&<>"']/g, (caracter) => ENTIDADES_HTML[caracter]);
}
