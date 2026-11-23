/**
 * <vista-en-construccion> · Vista temporal
 * ---------------------------------------------------------------------------
 * El enrutador la muestra cuando una ruta existe pero su Web Component aún
 * no se ha registrado (se construye en una parte posterior del proyecto).
 */
import { escaparHTML } from '../../utilidades/dom.js';
import { icono } from '../../utilidades/iconos.js';

class VistaEnConstruccion extends HTMLElement {
  connectedCallback() {
    const { titulo = 'Esta sección', parte } = this.contexto?.definicion ?? {};
    const textoParte = parte ? ` en la <strong>parte ${parte} de 10</strong> del proyecto` : ' próximamente';

    this.innerHTML = `
      <section class="vista-mensaje tarjeta" aria-labelledby="titulo-construccion">
        <span class="vista-mensaje__icono vista-mensaje__icono--acento">${icono('herramienta')}</span>
        <h1 class="vista-mensaje__titulo" id="titulo-construccion">${escaparHTML(titulo)}</h1>
        <p class="vista-mensaje__texto">Esta vista se construye${textoParte}.</p>
        <a class="btn btn--secundario" href="#/">${icono('inicio')} Ir al inicio</a>
      </section>`;
  }
}

customElements.define('vista-en-construccion', VistaEnConstruccion);
