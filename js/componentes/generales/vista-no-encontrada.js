/**
 * <vista-no-encontrada> · Página 404
 * ---------------------------------------------------------------------------
 * El enrutador la muestra cuando la dirección no coincide con ninguna ruta.
 * Recibe del enrutador la propiedad "contexto" con la ruta solicitada.
 */
import { escaparHTML } from '../../utilidades/dom.js';
import { icono } from '../../utilidades/iconos.js';

class VistaNoEncontrada extends HTMLElement {
  connectedCallback() {
    const ruta = this.contexto?.ruta ?? '';
    this.innerHTML = `
      <section class="vista-mensaje tarjeta" aria-labelledby="titulo-404">
        <span class="vista-mensaje__icono">${icono('brujula')}</span>
        <p class="vista-mensaje__codigo" aria-hidden="true">404</p>
        <h1 class="vista-mensaje__titulo" id="titulo-404">Página no encontrada</h1>
        <p class="vista-mensaje__texto">
          La dirección <code>${escaparHTML(ruta)}</code> no existe o fue movida.
        </p>
        <a class="btn btn--primario" href="#/">${icono('inicio')} Ir al inicio</a>
      </section>`;
  }
}

customElements.define('vista-no-encontrada', VistaNoEncontrada);
