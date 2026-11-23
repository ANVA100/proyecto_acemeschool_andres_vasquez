/**
 * <formulario-usuario> · Formulario para crear y actualizar usuarios
 * ---------------------------------------------------------------------------
 * Componente "de presentación": no guarda nada por sí mismo. Valida los datos
 * con el mismo esquema que el servicio y avisa a la vista con un evento.
 *
 * Eventos que emite:
 *  - "guardar-usuario"  → detail: { datos, id }  (id = null si es nuevo)
 *  - "cancelar-edicion"
 *
 * Métodos públicos:
 *  - editar(usuario)        pasa a modo edición con los datos del usuario
 *  - reiniciar()            vuelve a modo creación con el formulario vacío
 *  - mostrarErrores(errores) marca los campos con error (p. ej. correo repetido)
 *  - cargando = true/false   estado del botón de guardar
 */
import { CARGOS, NOMBRES_CARGOS, LIMITES } from '../../config/constantes.js';
import { crearEsquemaUsuario } from '../../servicios/servicio-usuarios.js';
import { escaparHTML } from '../../utilidades/dom.js';
import {
  activarLimpiezaAutomatica,
  activarMostrarContrasena,
  limpiarErrores,
  mostrarErrores,
  obtenerDatosFormulario,
  ponerBotonCargando,
} from '../../utilidades/formularios.js';
import { icono } from '../../utilidades/iconos.js';
import { validar } from '../../utilidades/validaciones.js';

const TEXTOS = Object.freeze({
  crear: {
    titulo: 'Nuevo usuario',
    subtitulo: 'Completa los datos para dar acceso al área privada.',
    boton: 'Crear usuario',
    icono: 'mas',
    ayudaContrasena: `Mínimo ${LIMITES.CONTRASENA.MIN} caracteres, combinando letras y números.`,
  },
  editar: {
    titulo: 'Editar usuario',
    subtitulo: 'Modifica los datos y guarda los cambios.',
    boton: 'Guardar cambios',
    icono: 'check',
    ayudaContrasena: 'Déjala vacía para conservar la contraseña actual.',
  },
});

class FormularioUsuario extends HTMLElement {
  #formulario;
  #idEditando = null;

  connectedCallback() {
    this.#renderizar();
    this.#formulario = this.querySelector('form');
    this.#formulario.addEventListener('submit', this.#alEnviar);
    this.querySelector('[data-accion="cancelar"]').addEventListener('click', this.#alCancelar);
    activarLimpiezaAutomatica(this.#formulario);
    activarMostrarContrasena(this.#formulario);
    this.#aplicarModo();
  }

  /** id del usuario en edición (null si se está creando). */
  get idEditando() {
    return this.#idEditando;
  }

  set cargando(valor) {
    ponerBotonCargando(this.#formulario.querySelector('[type="submit"]'), valor);
  }

  /** Carga un usuario en el formulario para editarlo. */
  editar(usuario) {
    this.#idEditando = usuario.id;
    const campos = this.#formulario.elements;
    campos.identificacion.value = usuario.identificacion;
    campos.nombreCompleto.value = usuario.nombreCompleto;
    campos.email.value = usuario.email;
    campos.telefono.value = usuario.telefono;
    campos.cargo.value = usuario.cargo;
    campos.contrasena.value = '';
    limpiarErrores(this.#formulario);
    this.#aplicarModo();

    this.scrollIntoView({ behavior: 'smooth', block: 'start' });
    campos.nombreCompleto.focus({ preventScroll: true });
  }

  /** Vacía el formulario y vuelve al modo "crear". */
  reiniciar() {
    this.#idEditando = null;
    this.#formulario.reset();
    limpiarErrores(this.#formulario);
    this.#aplicarModo();
  }

  /** @param {Record<string, string>} errores */
  mostrarErrores(errores) {
    mostrarErrores(this.#formulario, errores);
  }

  #renderizar() {
    const opcionesCargo = Object.values(CARGOS)
      .map((cargo) => `<option value="${cargo}">${escaparHTML(NOMBRES_CARGOS[cargo])}</option>`)
      .join('');
    const obligatorio = '<span class="campo__obligatorio" aria-hidden="true">*</span>';

    this.innerHTML = `
      <form class="tarjeta formulario formulario-tarjeta" novalidate aria-labelledby="titulo-formulario-usuario">
        <div class="formulario-tarjeta__encabezado">
          <span class="formulario-tarjeta__icono" data-ref="icono"></span>
          <div>
            <h2 class="tarjeta__titulo" id="titulo-formulario-usuario" data-ref="titulo"></h2>
            <p class="tarjeta__subtitulo" data-ref="subtitulo"></p>
          </div>
        </div>

        <div class="campo">
          <label class="campo__etiqueta" for="usuario-identificacion">Número de identificación ${obligatorio}</label>
          <input class="campo__entrada" id="usuario-identificacion" name="identificacion" type="text"
            inputmode="numeric" autocomplete="off" maxlength="${LIMITES.IDENTIFICACION.MAX}"
            placeholder="Ej: 1098765432" required aria-describedby="usuario-identificacion-error">
          <p class="campo__error" id="usuario-identificacion-error"></p>
        </div>

        <div class="campo">
          <label class="campo__etiqueta" for="usuario-nombre">Nombre completo ${obligatorio}</label>
          <input class="campo__entrada" id="usuario-nombre" name="nombreCompleto" type="text"
            autocomplete="name" maxlength="${LIMITES.NOMBRE_COMPLETO.MAX}" placeholder="Ej: Ana María Pérez"
            required aria-describedby="usuario-nombre-error">
          <p class="campo__error" id="usuario-nombre-error"></p>
        </div>

        <div class="campo">
          <label class="campo__etiqueta" for="usuario-email">Correo electrónico ${obligatorio}</label>
          <input class="campo__entrada" id="usuario-email" name="email" type="email" inputmode="email"
            autocomplete="off" maxlength="100" placeholder="nombre@acmeschool.edu" required
            aria-describedby="usuario-email-error">
          <p class="campo__error" id="usuario-email-error"></p>
        </div>

        <div class="formulario__fila">
          <div class="campo">
            <label class="campo__etiqueta" for="usuario-telefono">Teléfono ${obligatorio}</label>
            <input class="campo__entrada" id="usuario-telefono" name="telefono" type="tel" inputmode="numeric"
              autocomplete="off" maxlength="${LIMITES.TELEFONO.MAX}" placeholder="Ej: 3001234567" required
              aria-describedby="usuario-telefono-error">
            <p class="campo__error" id="usuario-telefono-error"></p>
          </div>

          <div class="campo">
            <label class="campo__etiqueta" for="usuario-cargo">Cargo ${obligatorio}</label>
            <select class="campo__entrada" id="usuario-cargo" name="cargo" required aria-describedby="usuario-cargo-error">
              <option value="">Selecciona…</option>
              ${opcionesCargo}
            </select>
            <p class="campo__error" id="usuario-cargo-error"></p>
          </div>
        </div>

        <div class="campo">
          <label class="campo__etiqueta" for="usuario-contrasena">
            Contraseña <span data-ref="obligatorio-contrasena">${obligatorio}</span>
          </label>
          <div class="campo__grupo">
            <input class="campo__entrada" id="usuario-contrasena" name="contrasena" type="password"
              autocomplete="new-password" maxlength="${LIMITES.CONTRASENA.MAX}"
              aria-describedby="usuario-contrasena-ayuda usuario-contrasena-error">
            <button type="button" class="campo__boton-interno" data-accion="mostrar-contrasena"
              aria-label="Mostrar contraseña" aria-pressed="false">${icono('ojo')}</button>
          </div>
          <p class="campo__ayuda" id="usuario-contrasena-ayuda" data-ref="ayuda-contrasena"></p>
          <p class="campo__error" id="usuario-contrasena-error"></p>
        </div>

        <div class="formulario__acciones">
          <button type="button" class="btn btn--fantasma" data-accion="cancelar">Cancelar edición</button>
          <button type="submit" class="btn btn--primario" data-ref="boton-guardar"></button>
        </div>
      </form>`;
  }

  /** Cambia textos, ícono y estilos según se esté creando o editando. */
  #aplicarModo() {
    const esEdicion = this.#idEditando !== null;
    const textos = esEdicion ? TEXTOS.editar : TEXTOS.crear;
    const ref = (nombre) => this.querySelector(`[data-ref="${nombre}"]`);

    ref('titulo').textContent = textos.titulo;
    ref('subtitulo').textContent = textos.subtitulo;
    ref('icono').innerHTML = icono(esEdicion ? 'editar' : 'usuario');
    ref('ayuda-contrasena').textContent = textos.ayudaContrasena;
    ref('obligatorio-contrasena').hidden = esEdicion;
    ref('boton-guardar').innerHTML = `${icono(textos.icono)} ${textos.boton}`;
    this.querySelector('[data-accion="cancelar"]').hidden = !esEdicion;
    this.#formulario.elements.contrasena.required = !esEdicion;
    this.#formulario.classList.toggle('formulario-tarjeta--editando', esEdicion);
  }

  #alEnviar = (evento) => {
    evento.preventDefault();
    const datos = obtenerDatosFormulario(this.#formulario, { sinRecortar: ['contrasena'] });
    const { esValido, errores } = validar(datos, crearEsquemaUsuario({ esNuevo: this.#idEditando === null }));
    if (!esValido) {
      mostrarErrores(this.#formulario, errores);
      return;
    }
    this.dispatchEvent(
      new CustomEvent('guardar-usuario', { detail: { datos, id: this.#idEditando }, bubbles: true })
    );
  };

  #alCancelar = () => {
    this.reiniciar();
    this.dispatchEvent(new CustomEvent('cancelar-edicion', { bubbles: true }));
  };
}

customElements.define('formulario-usuario', FormularioUsuario);
