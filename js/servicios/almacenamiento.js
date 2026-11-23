/**
 * almacenamiento.js · Acceso a localStorage en formato JSON
 * ---------------------------------------------------------------------------
 * Es el ÚNICO módulo que usa localStorage directamente. El resto de la app
 * llama a estas funciones, así toda la lectura/escritura queda en un solo
 * lugar (si mañana se cambia a IndexedDB, solo se modifica este archivo).
 *
 * localStorage solo guarda texto, por eso:
 *  - al guardar se convierte el valor a JSON con JSON.stringify()
 *  - al leer se convierte de vuelta a objeto con JSON.parse()
 */

/**
 * Error propio para problemas de almacenamiento (permite mostrar mensajes claros).
 */
export class ErrorAlmacenamiento extends Error {
  constructor(mensaje, causa) {
    super(mensaje);
    this.name = 'ErrorAlmacenamiento';
    this.cause = causa;
  }
}

/**
 * Comprueba si el navegador permite usar localStorage
 * (puede estar bloqueado por la configuración de privacidad).
 * @returns {boolean}
 */
export function estaDisponibleAlmacenamiento() {
  try {
    const clavePrueba = '__acme_prueba__';
    localStorage.setItem(clavePrueba, '1');
    localStorage.removeItem(clavePrueba);
    return true;
  } catch {
    return false;
  }
}

/**
 * Lee un valor guardado y lo convierte de JSON a objeto.
 * @param {string} clave - Clave en localStorage.
 * @param {*} [valorPorDefecto=null] - Lo que se devuelve si no existe o está dañado.
 * @returns {*} El valor guardado o el valor por defecto.
 */
export function leerDatos(clave, valorPorDefecto = null) {
  try {
    const texto = localStorage.getItem(clave);
    return texto === null ? valorPorDefecto : JSON.parse(texto);
  } catch (error) {
    console.error(`[Almacenamiento] No se pudo leer "${clave}":`, error);
    return valorPorDefecto;
  }
}

/**
 * Convierte un valor a JSON y lo guarda.
 * @param {string} clave - Clave en localStorage.
 * @param {*} valor - Cualquier valor serializable (objeto, arreglo, texto, número...).
 * @throws {ErrorAlmacenamiento} Si el almacenamiento está lleno o bloqueado.
 */
export function guardarDatos(clave, valor) {
  try {
    localStorage.setItem(clave, JSON.stringify(valor));
  } catch (error) {
    const estaLleno = error instanceof DOMException && error.name === 'QuotaExceededError';
    const mensaje = estaLleno
      ? 'El almacenamiento del navegador está lleno. Elimina datos antiguos e inténtalo de nuevo.'
      : 'No se pudo guardar la información en el navegador.';
    throw new ErrorAlmacenamiento(mensaje, error);
  }
}

/**
 * Elimina una clave del almacenamiento.
 * @param {string} clave
 */
export function eliminarDatos(clave) {
  try {
    localStorage.removeItem(clave);
  } catch (error) {
    console.error(`[Almacenamiento] No se pudo eliminar "${clave}":`, error);
  }
}

/**
 * Indica si una clave ya existe (aunque su valor sea un arreglo vacío).
 * @param {string} clave
 * @returns {boolean}
 */
export function existeDato(clave) {
  try {
    return localStorage.getItem(clave) !== null;
  } catch {
    return false;
  }
}
