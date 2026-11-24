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

// Vistas de cada módulo
import './componentes/autenticacion/vista-login.js';
import './componentes/usuarios/vista-usuarios.js';
import './componentes/examenes/vista-examenes.js';
import './componentes/examenes/vista-preguntas.js';

import { notificar } from './componentes/compartidos/contenedor-notificaciones.js';
import { CLAVES_ALMACENAMIENTO } from './config/constantes.js';
import { RUTAS } from './config/rutas.js';
import { inicializarDatos } from './datos/datos-iniciales.js';
import { iniciarEnrutador, navegar, obtenerRutaActual } from './enrutador.js';
import { estaDisponibleAlmacenamiento } from './servicios/almacenamiento.js';
import {
  estaAutenticado,
  guardarRutaPendiente,
  sincronizarSesion,
} from './servicios/servicio-autenticacion.js';
import { iniciarTema } from './servicios/servicio-tema.js';

/** Cada cuánto se revisa si la sesión expiró. */
const INTERVALO_REVISION_SESION_MS = 30 * 1000;

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

/**
 * Guardia del enrutador: se ejecuta antes de mostrar cada vista.
 * - Ruta privada sin sesión → al login (recordando a dónde se quería ir).
 * - Login con sesión ya iniciada → al área administrativa.
 * @returns {string|null} Ruta a la que redirigir, o null para permitir el acceso.
 */
function guardiaDeAcceso(definicion, ruta) {
  const autenticado = estaAutenticado();
  if (definicion.privada && !autenticado) {
    guardarRutaPendiente(ruta);
    return '/login';
  }
  if (definicion.soloInvitados && autenticado) {
    return '/admin';
  }
  return null;
}

/**
 * Vigila la sesión mientras la app está abierta:
 * - si expira, avisa y vuelve a evaluar la ruta (la guardia envía al login);
 * - si se inicia o cierra sesión en otra pestaña, se sincroniza esta.
 */
function vigilarSesion() {
  let teniaSesion = estaAutenticado();

  const reevaluar = () => {
    sincronizarSesion();
    navegar(obtenerRutaActual(), { reemplazar: true });
  };

  setInterval(() => {
    if (teniaSesion && !estaAutenticado()) {
      teniaSesion = false;
      notificar('Tu sesión expiró. Inicia sesión de nuevo para continuar.', { tipo: 'advertencia' });
      reevaluar();
    }
  }, INTERVALO_REVISION_SESION_MS);

  window.addEventListener('sesion-cambiada', (evento) => {
    teniaSesion = evento.detail.sesion !== null;
  });

  // El evento "storage" solo se dispara en las OTRAS pestañas del mismo sitio
  window.addEventListener('storage', (evento) => {
    if (evento.key === CLAVES_ALMACENAMIENTO.SESION) reevaluar();
  });
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
    guardia: guardiaDeAcceso,
  });
  vigilarSesion();
}

iniciarAplicacion();
