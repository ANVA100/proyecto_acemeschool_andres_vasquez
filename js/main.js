/**
 * main.js · Punto de entrada de la aplicación
 * ---------------------------------------------------------------------------
 * Se carga como módulo ES (type="module"), por eso se ejecuta cuando el HTML
 * ya está listo y no necesita esperar el evento DOMContentLoaded.
 *
 * Por ahora solo inicializa detalles de la interfaz. En las siguientes partes
 * aquí se cargarán los datos iniciales, se registrarán los Web Components y
 * se arrancará el enrutador.
 */

/** Muestra el año actual en el pie de página. */
function mostrarAnioActual() {
  const elementoAnio = document.querySelector('#anio-actual');
  if (elementoAnio) {
    elementoAnio.textContent = new Date().getFullYear();
  }
}

mostrarAnioActual();
