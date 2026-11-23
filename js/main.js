/**
 * main.js · Punto de entrada de la aplicación
 * ---------------------------------------------------------------------------
 * Se carga como módulo ES (type="module"), por eso se ejecuta cuando el HTML
 * ya está listo y no necesita esperar el evento DOMContentLoaded.
 *
 * Orden de arranque:
 *  1. Detalles de la interfaz (año del pie de página).
 *  2. Datos: la primera vez se crean los usuarios y exámenes de ejemplo.
 *  (En la parte 3 se agregan los Web Components y el enrutador.)
 */
import { estaDisponibleAlmacenamiento } from './servicios/almacenamiento.js';
import { inicializarDatos } from './datos/datos-iniciales.js';

/** Muestra el año actual en el pie de página. */
function mostrarAnioActual() {
  const elementoAnio = document.querySelector('#anio-actual');
  if (elementoAnio) {
    elementoAnio.textContent = new Date().getFullYear();
  }
}

/** Prepara los datos guardados (crea los de ejemplo la primera vez). */
async function prepararDatos() {
  if (!estaDisponibleAlmacenamiento()) {
    console.error('[Acme School] El navegador bloquea localStorage: la información no se podrá guardar.');
    return;
  }

  try {
    const coleccionesCreadas = await inicializarDatos();
    if (coleccionesCreadas.length > 0) {
      console.info(`[Acme School] Datos iniciales creados: ${coleccionesCreadas.join(', ')}.`);
    } else {
      console.info('[Acme School] Datos cargados desde localStorage.');
    }
  } catch (error) {
    console.error('[Acme School] No se pudieron preparar los datos iniciales:', error);
  }
}

/** Arranca la aplicación. */
async function iniciarAplicacion() {
  mostrarAnioActual();
  await prepararDatos();
}

iniciarAplicacion();
