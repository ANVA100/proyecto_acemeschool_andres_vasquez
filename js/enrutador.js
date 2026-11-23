/**
 * enrutador.js · Navegación entre vistas sin recargar la página (SPA)
 * ---------------------------------------------------------------------------
 * Escucha los cambios del "hash" de la URL (lo que va después de #) y muestra
 * el Web Component que corresponde a cada ruta de config/rutas.js.
 *
 * Flujo al cambiar de ruta:
 *  1. Busca la ruta que coincide y extrae sus parámetros (p. ej. ":id").
 *  2. Si la ruta redirige, o la guardia lo indica (p. ej. falta iniciar
 *     sesión), navega a la ruta de destino.
 *  3. Crea la vista, le entrega su contexto y reemplaza la anterior.
 *  4. Actualiza el título, mueve el foco (accesibilidad) y emite el evento
 *     "ruta-cambiada" para que otros componentes (el encabezado) reaccionen.
 */
import { NOMBRE_APLICACION } from './config/constantes.js';

/** Vista que se muestra cuando ninguna ruta coincide. */
const RUTA_NO_ENCONTRADA = Object.freeze({ componente: 'vista-no-encontrada', titulo: 'Página no encontrada' });

/** Vista temporal para rutas cuyo componente aún no existe. */
const VISTA_EN_CONSTRUCCION = 'vista-en-construccion';

let rutasCompiladas = [];
let contenedor = null;
let guardia = null;
let esPrimeraCarga = true;

/**
 * Convierte un patrón como "/examen/:id" en una expresión regular
 * y guarda el nombre de cada parámetro.
 */
function compilarRuta(definicion) {
  const nombresParametros = [];
  const patronRegex = definicion.patron.replace(/:([a-zA-Z]+)/g, (_, nombre) => {
    nombresParametros.push(nombre);
    return '([^/]+)';
  });
  return { ...definicion, expresion: new RegExp(`^${patronRegex}/?$`), nombresParametros };
}

/**
 * Ruta actual a partir del hash ("#/admin/usuarios" → "/admin/usuarios").
 * @returns {string}
 */
export function obtenerRutaActual() {
  const { hash } = window.location;
  if (!hash.startsWith('#/')) return '/';
  return hash.slice(1).split('?')[0] || '/';
}

/** Busca la definición que coincide con la ruta y extrae sus parámetros. */
function buscarRuta(ruta) {
  for (const definicion of rutasCompiladas) {
    const coincidencia = ruta.match(definicion.expresion);
    if (coincidencia) {
      const parametros = Object.fromEntries(
        definicion.nombresParametros.map((nombre, indice) => [nombre, decodeURIComponent(coincidencia[indice + 1])])
      );
      return { definicion, parametros };
    }
  }
  return null;
}

/**
 * Navega a una ruta de la aplicación.
 * @param {string} ruta - p. ej. "/admin/usuarios"
 * @param {{reemplazar?: boolean}} [opciones] - reemplazar: no deja la ruta
 *   anterior en el historial (útil en redirecciones).
 */
export function navegar(ruta, { reemplazar = false } = {}) {
  if (reemplazar) {
    window.history.replaceState(null, '', `#${ruta}`);
    resolverRuta();
  } else if (obtenerRutaActual() === ruta) {
    resolverRuta(); // misma ruta: se vuelve a pintar la vista
  } else {
    window.location.hash = ruta; // dispara "hashchange"
  }
}

/** Pone el foco en el título de la vista para que los lectores de pantalla la anuncien. */
function enfocarTitulo(vista) {
  const titulo = vista.querySelector('h1');
  if (!titulo) return;
  titulo.setAttribute('tabindex', '-1');
  titulo.focus({ preventScroll: true });
}

/** Crea la vista de la ruta y reemplaza la que estaba en pantalla. */
function mostrarVista(definicion, ruta, parametros) {
  const etiqueta = customElements.get(definicion.componente) ? definicion.componente : VISTA_EN_CONSTRUCCION;
  const vista = document.createElement(etiqueta);

  // El contexto se asigna ANTES de insertar la vista, así su connectedCallback ya lo tiene
  vista.contexto = { ruta, parametros, definicion };
  vista.classList.add('vista', 'animar-entrada');
  contenedor.replaceChildren(vista);

  document.title = `${definicion.titulo} · ${NOMBRE_APLICACION}`;
  if (!esPrimeraCarga) {
    window.scrollTo({ top: 0 });
    enfocarTitulo(vista);
  }
  esPrimeraCarga = false;

  window.dispatchEvent(new CustomEvent('ruta-cambiada', { detail: { ruta, definicion, parametros } }));
}

/** Decide qué mostrar para la ruta actual. */
function resolverRuta() {
  const ruta = obtenerRutaActual();
  const resultado = buscarRuta(ruta);

  if (!resultado) {
    mostrarVista(RUTA_NO_ENCONTRADA, ruta, {});
    return;
  }

  const { definicion, parametros } = resultado;

  if (definicion.redirigir) {
    navegar(definicion.redirigir, { reemplazar: true });
    return;
  }

  const redireccion = guardia?.(definicion, ruta);
  if (redireccion && redireccion !== ruta) {
    navegar(redireccion, { reemplazar: true });
    return;
  }

  mostrarVista(definicion, ruta, parametros);
}

/**
 * Arranca el enrutador.
 * @param {object} opciones
 * @param {object[]} opciones.rutas - Tabla de rutas (config/rutas.js).
 * @param {HTMLElement} opciones.contenedor - Elemento donde se pintan las vistas.
 * @param {(definicion: object, ruta: string) => string|null} [opciones.guardia] -
 *   Función que devuelve una ruta para redirigir, o null para permitir el acceso.
 */
export function iniciarEnrutador(opciones) {
  rutasCompiladas = opciones.rutas.map(compilarRuta);
  contenedor = opciones.contenedor;
  guardia = opciones.guardia ?? null;

  window.addEventListener('hashchange', () => {
    // Se ignoran los hash que no son rutas (p. ej. anclas internas)
    if (window.location.hash && !window.location.hash.startsWith('#/')) return;
    resolverRuta();
  });

  if (!window.location.hash.startsWith('#/')) {
    window.history.replaceState(null, '', '#/');
  }
  resolverRuta();
}
