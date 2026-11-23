/**
 * main.js · Punto de entrada de la aplicación
 * ---------------------------------------------------------------------------
 * Se carga como módulo ES (type="module"), por eso se ejecuta cuando el HTML
 * ya está listo y no necesita esperar el evento DOMContentLoaded.
 *
 * Orden de arranque:
 *  1. Registrar los Web Components (al importarlos se ejecuta su
 *     customElements.define y el navegador "activa" las etiquetas del HTML).
 *  2. Tema claro/oscuro y detalles de la interfaz.
 *  3. Datos: la primera vez se crean los usuarios y exámenes de ejemplo.
 *  4. Enrutador: pinta la vista que corresponde a la URL.
 */

// 1. Web Components compartidos
import './componentes/compartidos/encabezado-app.js';
import './componentes/compartidos/contenedor-notificaciones.js';
import './componentes/compartidos/dialogo-confirmacion.js';
import './componentes/compartidos/campo-busqueda.js';
import './componentes/compartidos/estado-vacio.js';

// Vistas generales
import './componentes/generales/vista-no-encontrada.js';
import './componentes/generales/vista-en-construccion.js';

import { RUTAS } from './config/rutas.js';
import { inicializarDatos } from './datos/datos-iniciales.js';
import { iniciarEnrutador } from './enrutador.js';
import { estaDisponibleAlmacenamiento } from './servicios/almacenamiento.js';
import { iniciarTema } from './servicios/servicio-tema.js';

/** Muestra el año actual en el pie de página. */
function mostrarAnioActual() {
  const elementoAnio = document.querySelector('#anio-actual');
  if (elementoAnio) {
    elementoAnio.textContent = new Date().getFullYear();
  }
}

/**
 * El enlace "Saltar al contenido" usa un ancla (#contenido-principal).
 * Como la app usa el hash para sus rutas, se maneja con JS: mueve el foco
 * al contenido sin cambiar la URL.
 */
function configurarEnlaceSaltarContenido() {
  const enlace = document.querySelector('.saltar-contenido');
  const contenido = document.querySelector('#contenido-principal');
  enlace?.addEventListener('click', (evento) => {
    evento.preventDefault();
    contenido?.focus();
  });
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
  iniciarTema();
  mostrarAnioActual();
  configurarEnlaceSaltarContenido();
  await prepararDatos();

  iniciarEnrutador({
    rutas: RUTAS,
    contenedor: document.querySelector('#app'),
  });
}

iniciarAplicacion();
