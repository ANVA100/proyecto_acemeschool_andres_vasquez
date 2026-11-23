/**
 * cifrado.js · Protección de contraseñas con la Web Crypto API
 * ---------------------------------------------------------------------------
 * Las contraseñas NUNCA se guardan en texto plano. Se guarda:
 *  - una "sal": texto aleatorio distinto para cada usuario.
 *  - un "hash": huella SHA-256 de (sal + contraseña).
 *
 * Para iniciar sesión se calcula de nuevo el hash con la contraseña escrita
 * y se compara con el guardado. Gracias a la sal, dos usuarios con la misma
 * contraseña tienen hashes diferentes.
 *
 * Nota: en un sistema con servidor se usarían algoritmos lentos como bcrypt
 * o Argon2; para esta app (100 % en el navegador) SHA-256 con sal es suficiente.
 *
 * Importante: crypto.subtle solo existe en contextos seguros (localhost o
 * HTTPS). Live Server sirve en 127.0.0.1, que cuenta como seguro.
 */

const codificador = new TextEncoder();

/**
 * Convierte bytes a texto hexadecimal (p. ej. [255, 10] → "ff0a").
 * @param {Uint8Array} bytes
 * @returns {string}
 */
function convertirAHexadecimal(bytes) {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Indica si el navegador puede calcular hashes (requiere contexto seguro).
 * @returns {boolean}
 */
export function estaDisponibleCifrado() {
  return Boolean(globalThis.crypto?.subtle);
}

/**
 * Genera una sal aleatoria.
 * @param {number} [cantidadBytes=16]
 * @returns {string} Texto hexadecimal (32 caracteres con el valor por defecto).
 */
export function generarSal(cantidadBytes = 16) {
  return convertirAHexadecimal(crypto.getRandomValues(new Uint8Array(cantidadBytes)));
}

/**
 * Calcula el hash SHA-256 de un texto combinado con una sal.
 * @param {string} texto
 * @param {string} [sal='']
 * @returns {Promise<string>} Hash en hexadecimal (64 caracteres).
 */
export async function generarHash(texto, sal = '') {
  if (!estaDisponibleCifrado()) {
    throw new Error(
      'El navegador no permite cifrar contraseñas en esta dirección. ' +
        'Abre la aplicación desde localhost o HTTPS (por ejemplo, con Live Server).'
    );
  }
  const datos = codificador.encode(`${sal}${texto}`);
  const resumen = await crypto.subtle.digest('SHA-256', datos);
  return convertirAHexadecimal(new Uint8Array(resumen));
}

/**
 * Prepara una contraseña para guardarla: genera su sal y su hash.
 * @param {string} contrasena - Contraseña en texto plano.
 * @returns {Promise<{salContrasena: string, hashContrasena: string}>}
 */
export async function protegerContrasena(contrasena) {
  const salContrasena = generarSal();
  const hashContrasena = await generarHash(contrasena, salContrasena);
  return { salContrasena, hashContrasena };
}

/**
 * Comprueba si una contraseña escrita coincide con la guardada.
 * @param {string} contrasena - Contraseña escrita por el usuario.
 * @param {string} sal - Sal guardada del usuario.
 * @param {string} hashGuardado - Hash guardado del usuario.
 * @returns {Promise<boolean>}
 */
export async function verificarContrasena(contrasena, sal, hashGuardado) {
  const hashCalculado = await generarHash(contrasena, sal);
  return hashCalculado === hashGuardado;
}
