/**
 * servicio-autenticacion.js · Inicio y cierre de sesión
 * ---------------------------------------------------------------------------
 * - iniciarSesion(): busca el usuario por correo y compara el hash de la
 *   contraseña escrita con el guardado (nunca se compara texto plano).
 * - La sesión se guarda en localStorage ("acme_sesion") con fecha de
 *   expiración: después de 8 horas hay que volver a iniciar sesión.
 * - Cada cambio de sesión emite el evento global "sesion-cambiada", que
 *   escucha el encabezado para mostrar u ocultar los enlaces privados.
 * - "Ruta pendiente": si alguien intenta entrar a una ruta privada sin
 *   sesión, se recuerda esa ruta para llevarlo allí después del login.
 */
import { CLAVES_ALMACENAMIENTO, DURACION_SESION_MS } from '../config/constantes.js';
import { verificarContrasena } from '../utilidades/cifrado.js';
import { eliminarDatos, guardarDatos, leerDatos } from './almacenamiento.js';
import { crearColeccion } from './coleccion.js';

const usuarios = crearColeccion(CLAVES_ALMACENAMIENTO.USUARIOS);

/** sessionStorage: dura solo mientras la pestaña está abierta. */
const CLAVE_RUTA_PENDIENTE = 'acme_ruta_pendiente';

/** Error de credenciales inválidas. */
export class ErrorAutenticacion extends Error {
  constructor(mensaje) {
    super(mensaje);
    this.name = 'ErrorAutenticacion';
  }
}

/** Avisa a toda la app que la sesión cambió. */
function emitirCambioSesion(sesion) {
  window.dispatchEvent(new CustomEvent('sesion-cambiada', { detail: { sesion } }));
}

/** Datos mínimos del usuario que se guardan en la sesión (sin contraseña). */
function crearSesion(usuario) {
  const ahora = Date.now();
  return {
    usuarioId: usuario.id,
    nombreCompleto: usuario.nombreCompleto,
    email: usuario.email,
    cargo: usuario.cargo,
    iniciadaEn: ahora,
    expiraEn: ahora + DURACION_SESION_MS,
  };
}

/**
 * Inicia sesión con correo y contraseña.
 * @param {string} email
 * @param {string} contrasena
 * @returns {Promise<object>} La sesión creada.
 * @throws {ErrorAutenticacion} Si las credenciales no coinciden.
 */
export async function iniciarSesion(email, contrasena) {
  const emailNormalizado = String(email).trim().toLowerCase();
  const usuario = usuarios.obtenerTodos().find((u) => u.email.toLowerCase() === emailNormalizado);

  const esValida = usuario
    ? await verificarContrasena(contrasena, usuario.salContrasena, usuario.hashContrasena)
    : false;

  // Mismo mensaje en ambos casos: no se revela si el correo existe o no
  if (!esValida) {
    throw new ErrorAutenticacion('Correo o contraseña incorrectos.');
  }

  const sesion = crearSesion(usuario);
  guardarDatos(CLAVES_ALMACENAMIENTO.SESION, sesion);
  emitirCambioSesion(sesion);
  return sesion;
}

/** Cierra la sesión actual. */
export function cerrarSesion() {
  eliminarDatos(CLAVES_ALMACENAMIENTO.SESION);
  emitirCambioSesion(null);
}

/**
 * Sesión vigente o null. Si expiró o el usuario ya no existe, se elimina.
 * @returns {object|null}
 */
export function obtenerSesion() {
  const sesion = leerDatos(CLAVES_ALMACENAMIENTO.SESION);
  if (!sesion) return null;

  const expiro = Date.now() >= sesion.expiraEn;
  const usuarioExiste = usuarios.obtenerPorId(sesion.usuarioId) !== null;
  if (expiro || !usuarioExiste) {
    eliminarDatos(CLAVES_ALMACENAMIENTO.SESION);
    return null;
  }
  return sesion;
}

/** @returns {boolean} */
export function estaAutenticado() {
  return obtenerSesion() !== null;
}

/** Vuelve a emitir el estado actual (p. ej. cuando la sesión cambió en otra pestaña). */
export function sincronizarSesion() {
  emitirCambioSesion(obtenerSesion());
}

/** Recuerda la ruta privada que se intentó abrir sin sesión. */
export function guardarRutaPendiente(ruta) {
  sessionStorage.setItem(CLAVE_RUTA_PENDIENTE, ruta);
}

/** @returns {string|null} La ruta pendiente, sin borrarla. */
export function consultarRutaPendiente() {
  return sessionStorage.getItem(CLAVE_RUTA_PENDIENTE);
}

/** @returns {string|null} La ruta pendiente, y la borra (se usa una sola vez). */
export function tomarRutaPendiente() {
  const ruta = sessionStorage.getItem(CLAVE_RUTA_PENDIENTE);
  sessionStorage.removeItem(CLAVE_RUTA_PENDIENTE);
  return ruta;
}
