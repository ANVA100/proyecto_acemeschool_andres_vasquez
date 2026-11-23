/**
 * generador-id.js · Identificadores únicos para cada registro
 * ---------------------------------------------------------------------------
 * Cada usuario, examen, pregunta, respuesta e intento tiene un "id" único
 * (formato UUID v4, p. ej. "3f2b8c1e-9a4d-4e6f-8b2a-1c5d7e9f0a3b").
 */

/**
 * Genera un identificador único.
 * Usa crypto.randomUUID() cuando existe. Si no (algunos navegadores solo lo
 * permiten en localhost o HTTPS), lo construye con crypto.getRandomValues(),
 * que está disponible en cualquier contexto.
 * @returns {string} UUID v4
 */
export function generarId() {
  if (typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  const bytes = crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 0x0f) | 0x40; // versión 4
  bytes[8] = (bytes[8] & 0x3f) | 0x80; // variante RFC 4122

  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20),
  ].join('-');
}
