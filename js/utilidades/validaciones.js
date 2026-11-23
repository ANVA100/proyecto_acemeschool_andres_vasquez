/**
 * validaciones.js · Reglas de validación reutilizables
 * ---------------------------------------------------------------------------
 * Cada formulario define un "esquema": para cada campo, una lista de reglas.
 * Cada regla es una función que recibe el valor y devuelve:
 *  - ''        si el valor es válido,
 *  - un texto  con el mensaje de error si no lo es.
 *
 * @example
 *   const esquema = {
 *     email: [reglas.requerido(), reglas.email()],
 *     edad:  [reglas.numeroEntero(1, 120)],
 *   };
 *   const { esValido, errores } = validar({ email: 'x', edad: '200' }, esquema);
 *   // errores → { email: 'Ingresa un correo...', edad: 'Debe estar entre 1 y 120.' }
 */

/** Error que lanzan los servicios cuando los datos no cumplen las reglas. */
export class ErrorValidacion extends Error {
  /**
   * @param {Record<string, string>} errores - Mensaje de error por campo.
   * @param {string} [mensaje]
   */
  constructor(errores, mensaje = 'Revisa los campos marcados en rojo.') {
    super(mensaje);
    this.name = 'ErrorValidacion';
    this.errores = errores;
  }
}

/** Expresiones regulares de uso común. */
export const PATRONES = Object.freeze({
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/,
  SOLO_DIGITOS: /^\d+$/,
  // Letras (con tildes y ñ), espacios, apóstrofos, puntos y guiones
  NOMBRE_PERSONA: /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ' .-]+$/,
});

/** true si el valor está vacío (undefined, null o solo espacios). */
export function estaVacio(valor) {
  return valor === undefined || valor === null || String(valor).trim() === '';
}

/**
 * Fábricas de reglas. Excepto "requerido", todas aceptan un valor vacío:
 * así un campo opcional vacío no muestra errores de formato.
 */
export const reglas = Object.freeze({
  requerido:
    (mensaje = 'Este campo es obligatorio.') =>
    (valor) =>
      estaVacio(valor) ? mensaje : '',

  email:
    (mensaje = 'Ingresa un correo válido, por ejemplo: nombre@dominio.com.') =>
    (valor) =>
      estaVacio(valor) || PATRONES.EMAIL.test(String(valor).trim()) ? '' : mensaje,

  longitud: (minimo, maximo) => (valor) => {
    if (estaVacio(valor)) return '';
    const largo = String(valor).trim().length;
    if (largo < minimo) return `Debe tener al menos ${minimo} caracteres.`;
    if (largo > maximo) return `Debe tener máximo ${maximo} caracteres.`;
    return '';
  },

  soloDigitos: (minimo, maximo) => (valor) => {
    if (estaVacio(valor)) return '';
    const texto = String(valor).trim();
    if (!PATRONES.SOLO_DIGITOS.test(texto)) return 'Solo se permiten números, sin espacios ni puntos.';
    if (texto.length < minimo || texto.length > maximo) return `Debe tener entre ${minimo} y ${maximo} dígitos.`;
    return '';
  },

  patron: (expresion, mensaje) => (valor) =>
    estaVacio(valor) || expresion.test(String(valor).trim()) ? '' : mensaje,

  numeroEntero: (minimo, maximo) => (valor) => {
    if (estaVacio(valor)) return '';
    const numero = Number(valor);
    if (!Number.isInteger(numero)) return 'Ingresa un número entero.';
    if (numero < minimo || numero > maximo) return `Debe estar entre ${minimo} y ${maximo}.`;
    return '';
  },

  contrasenaSegura:
    (mensaje = 'Debe combinar letras y números.') =>
    (valor) =>
      estaVacio(valor) || (/[A-Za-z]/.test(valor) && /\d/.test(valor)) ? '' : mensaje,
});

/**
 * Valida un objeto de datos contra un esquema.
 * Por cada campo se detiene en la primera regla que falla.
 * @param {Record<string, *>} datos
 * @param {Record<string, Function[]>} esquema
 * @returns {{esValido: boolean, errores: Record<string, string>}}
 */
export function validar(datos, esquema) {
  const errores = {};
  for (const [campo, listaReglas] of Object.entries(esquema)) {
    for (const regla of listaReglas) {
      const mensaje = regla(datos[campo], datos);
      if (mensaje) {
        errores[campo] = mensaje;
        break;
      }
    }
  }
  return { esValido: Object.keys(errores).length === 0, errores };
}
