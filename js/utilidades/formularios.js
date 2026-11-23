/**
 * formularios.js · Ayudas para trabajar con formularios accesibles
 * ---------------------------------------------------------------------------
 * Convención de marcado que siguen todos los formularios de la app:
 *
 *   <div class="campo">
 *     <label class="campo__etiqueta" for="usuario-email">Email</label>
 *     <input class="campo__entrada" id="usuario-email" name="email"
 *            aria-describedby="usuario-email-error">
 *     <p class="campo__error" id="usuario-email-error"></p>
 *   </div>
 *
 * Al marcar un error se pone aria-invalid="true" en el campo (borde rojo y
 * aviso para lectores de pantalla) y se escribe el mensaje en .campo__error.
 */
import { icono } from './iconos.js';

/**
 * Lee los valores de un formulario como objeto { nombreCampo: valor }.
 * Los textos se recortan (trim), salvo los campos indicados (p. ej. contraseñas).
 * @param {HTMLFormElement} formulario
 * @param {{sinRecortar?: string[]}} [opciones]
 */
export function obtenerDatosFormulario(formulario, { sinRecortar = [] } = {}) {
  const datos = {};
  for (const [nombre, valor] of new FormData(formulario)) {
    datos[nombre] = typeof valor === 'string' && !sinRecortar.includes(nombre) ? valor.trim() : valor;
  }
  return datos;
}

function obtenerElementoError(campo) {
  return campo.closest('.campo')?.querySelector('.campo__error') ?? null;
}

/** Marca un campo como inválido con su mensaje. */
export function marcarCampo(campo, mensaje) {
  campo.setAttribute('aria-invalid', 'true');
  const elementoError = obtenerElementoError(campo);
  if (elementoError) elementoError.textContent = mensaje;
}

/** Quita la marca de error de un campo. */
export function limpiarErrorCampo(campo) {
  campo.removeAttribute('aria-invalid');
  const elementoError = obtenerElementoError(campo);
  if (elementoError) elementoError.textContent = '';
}

/** Quita todas las marcas de error de un formulario. */
export function limpiarErrores(formulario) {
  formulario.querySelectorAll('[aria-invalid="true"]').forEach(limpiarErrorCampo);
}

/**
 * Muestra los errores de validación y enfoca el primer campo con error.
 * @param {HTMLFormElement} formulario
 * @param {Record<string, string>} errores - { nombreCampo: mensaje }
 */
export function mostrarErrores(formulario, errores) {
  limpiarErrores(formulario);
  let primerCampo = null;
  for (const [nombre, mensaje] of Object.entries(errores)) {
    const campo = formulario.querySelector(`[name="${nombre}"]`);
    if (!campo) continue;
    marcarCampo(campo, mensaje);
    primerCampo ??= campo;
  }
  primerCampo?.focus();
}

/** Borra el error de un campo en cuanto el usuario lo corrige. */
export function activarLimpiezaAutomatica(formulario) {
  formulario.addEventListener('input', (evento) => {
    if (evento.target.matches('[aria-invalid="true"]')) limpiarErrorCampo(evento.target);
  });
}

/**
 * Activa los botones "mostrar/ocultar contraseña" ([data-accion="mostrar-contrasena"])
 * que estén dentro del contenedor.
 * @param {HTMLElement} contenedor
 */
export function activarMostrarContrasena(contenedor) {
  contenedor.addEventListener('click', (evento) => {
    const boton = evento.target.closest('[data-accion="mostrar-contrasena"]');
    if (!boton) return;
    const entrada = boton.closest('.campo__grupo')?.querySelector('input');
    if (!entrada) return;
    const mostrar = entrada.type === 'password';
    entrada.type = mostrar ? 'text' : 'password';
    boton.setAttribute('aria-pressed', String(mostrar));
    boton.setAttribute('aria-label', mostrar ? 'Ocultar contraseña' : 'Mostrar contraseña');
    boton.innerHTML = icono(mostrar ? 'ojo-tachado' : 'ojo');
    entrada.focus();
  });
}

/**
 * Activa o desactiva el estado "cargando" de un botón.
 * @param {HTMLButtonElement} boton
 * @param {boolean} cargando
 */
export function ponerBotonCargando(boton, cargando) {
  boton.disabled = cargando;
  boton.setAttribute('aria-busy', String(cargando));
}
