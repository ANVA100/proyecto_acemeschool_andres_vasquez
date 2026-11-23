/**
 * servicio-tema.js · Modo claro / oscuro
 * ---------------------------------------------------------------------------
 * El tema se aplica con el atributo data-tema="claro|oscuro" en <html>;
 * variables.css cambia los colores según ese atributo.
 *
 * - Si el usuario eligió un tema, se guarda en localStorage ("acme_tema").
 * - Si nunca eligió, se sigue la preferencia del sistema operativo y se
 *   actualiza sola si esa preferencia cambia.
 * (El script en línea de index.html aplica el tema antes de pintar la página.)
 */
import { CLAVES_ALMACENAMIENTO, TEMAS } from '../config/constantes.js';
import { existeDato, guardarDatos } from './almacenamiento.js';

/** Color de la barra del navegador en móviles según el tema. */
const COLOR_BARRA_NAVEGADOR = Object.freeze({
  [TEMAS.CLARO]: '#4f46e5',
  [TEMAS.OSCURO]: '#0b1120',
});

/** @returns {'claro'|'oscuro'} Tema aplicado actualmente. */
export function obtenerTema() {
  return document.documentElement.dataset.tema === TEMAS.OSCURO ? TEMAS.OSCURO : TEMAS.CLARO;
}

/**
 * Aplica un tema y avisa con el evento "tema-cambiado".
 * @param {'claro'|'oscuro'} tema
 * @param {{guardar?: boolean}} [opciones] - guardar: recordar la elección.
 */
export function aplicarTema(tema, { guardar = true } = {}) {
  const temaValido = tema === TEMAS.OSCURO ? TEMAS.OSCURO : TEMAS.CLARO;
  document.documentElement.dataset.tema = temaValido;
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', COLOR_BARRA_NAVEGADOR[temaValido]);

  if (guardar) {
    try {
      guardarDatos(CLAVES_ALMACENAMIENTO.TEMA, temaValido);
    } catch (error) {
      console.warn('[Tema] No se pudo guardar la preferencia:', error);
    }
  }

  window.dispatchEvent(new CustomEvent('tema-cambiado', { detail: { tema: temaValido } }));
}

/** Cambia de claro a oscuro y viceversa. */
export function alternarTema() {
  aplicarTema(obtenerTema() === TEMAS.OSCURO ? TEMAS.CLARO : TEMAS.OSCURO);
}

/** Sincroniza el tema al arrancar y sigue al sistema si no hay preferencia guardada. */
export function iniciarTema() {
  aplicarTema(obtenerTema(), { guardar: false });

  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (evento) => {
    if (!existeDato(CLAVES_ALMACENAMIENTO.TEMA)) {
      aplicarTema(evento.matches ? TEMAS.OSCURO : TEMAS.CLARO, { guardar: false });
    }
  });
}
