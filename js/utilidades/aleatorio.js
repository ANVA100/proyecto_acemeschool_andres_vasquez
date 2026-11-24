/**
 * aleatorio.js · Utilidades de azar
 */

/**
 * Devuelve una COPIA del arreglo con sus elementos en orden aleatorio.
 * Algoritmo de Fisher-Yates: recorre el arreglo de atrás hacia adelante e
 * intercambia cada elemento con otro de una posición al azar anterior o igual.
 * Todas las combinaciones posibles tienen la misma probabilidad.
 * @template T
 * @param {T[]} arreglo
 * @returns {T[]}
 */
export function mezclarArreglo(arreglo) {
  const copia = [...arreglo];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}
