/**
 * <vista-login> · Inicio de sesión (vista inicial de los módulos privados)
 * ---------------------------------------------------------------------------
 * - Valida el correo y la contraseña antes de enviar.
 * - Muestra errores accesibles por campo y un mensaje general si las
 *   credenciales no coinciden (con una pequeña animación de "sacudida").
 * - Tras iniciar sesión lleva a la ruta privada que se intentó abrir o,
 *   si no hay ninguna, al área administrativa.
 * - Incluye botones para autocompletar las cuentas de demostración.
 */
import { CARGOS, NOMBRES_CARGOS } from '../../config/constantes.js';
import { CREDENCIALES_DEMO } from '../../datos/datos-iniciales.js';
import { navegar } from '../../enrutador.js';
import {
  consultarRutaPendiente,
  iniciarSesion,
  tomarRutaPendiente,
} from '../../servicios/servicio-autenticacion.js';
import { escaparHTML } from '../../utilidades/dom.js';
import { obtenerPrimerNombre } from '../../utilidades/formato.js';
import {
  activarLimpiezaAutomatica,
  activarMostrarContrasena,
  limpiarErrores,
  mostrarErrores,
  obtenerDatosFormulario,
  ponerBotonCargando,
} from '../../utilidades/formularios.js';
import { icono } from '../../utilidades/iconos.js';
import { reglas, validar } from '../../utilidades/validaciones.js';
import { notificar } from '../compartidos/contenedor-notificaciones.js';

const ESQUEMA_LOGIN = {
  email: [reglas.requerido('Ingresa tu correo electrónico.'), reglas.email()],
  contrasena: [reglas.requerido('Ingresa tu contraseña.')],
};

const BENEFICIOS = [
  { icono: 'examen', texto: 'Crea exámenes con preguntas de selección única.' },
  { icono: 'reloj', texto: 'Define el tiempo y el porcentaje de aprobación.' },
  { icono: 'grafica', texto: 'Consulta los resultados de tus estudiantes.' },
];

class VistaLogin extends HTMLElement {
  #formulario;
  #tarjeta;
  #errorGeneral;

  connectedCallback() {
    this.#renderizar();
    this.#formulario = this.querySelector('form');
    this.#tarjeta = this.querySelector('.login');
    this.#errorGeneral = this.querySelector('[data-ref="error-general"]');

    this.#formulario.addEventListener('submit', this.#alEnviar);
    this.querySelector('.login__demo').addEventListener('click', this.#alElegirDemo);
    this.#formulario.addEventListener('input', () => {
      this.#errorGeneral.hidden = true;
    });
    activarLimpiezaAutomatica(this.#formulario);
    activarMostrarContrasena(this.#formulario);
  }

  #renderizar() {
    const hayRutaPendiente = consultarRutaPendiente() !== null;
    const beneficios = BENEFICIOS.map(
      (beneficio) => `
        <li class="login__beneficio">
          <span class="login__beneficio-icono">${icono(beneficio.icono)}</span>
          <span>${escaparHTML(beneficio.texto)}</span>
        </li>`
    ).join('');
    const botonesDemo = CREDENCIALES_DEMO.map(
      ({ cargo }) => `
        <button type="button" class="btn btn--secundario btn--pequeno" data-cargo="${cargo}">
          ${icono(cargo === CARGOS.ADMINISTRATIVO ? 'usuarios' : 'birrete')}
          ${escaparHTML(NOMBRES_CARGOS[cargo])}
        </button>`
    ).join('');

    this.innerHTML = `
      <section class="login" aria-labelledby="titulo-login">
        <div class="login__panel">
          <img class="login__logo" src="assets/img/logo.svg" alt="" width="56" height="56">
          <h2 class="login__panel-titulo">Plataforma de exámenes</h2>
          <p class="login__panel-texto">Gestiona usuarios, crea exámenes y consulta resultados desde un solo lugar.</p>
          <ul class="login__beneficios" role="list">${beneficios}</ul>
        </div>

        <div class="login__contenido">
          <div>
            <h1 class="login__titulo" id="titulo-login">Iniciar sesión</h1>
            <p class="login__subtitulo">Acceso exclusivo para el personal administrativo y docente.</p>
          </div>

          <div class="alerta alerta--info" ${hayRutaPendiente ? '' : 'hidden'}>
            ${icono('candado')}
            <span>Inicia sesión para acceder a esa sección.</span>
          </div>
          <div class="alerta alerta--peligro" role="alert" data-ref="error-general" hidden></div>

          <form class="formulario" novalidate>
            <div class="campo">
              <label class="campo__etiqueta" for="login-email">
                Correo electrónico <span class="campo__obligatorio" aria-hidden="true">*</span>
              </label>
              <input class="campo__entrada" id="login-email" name="email" type="email" inputmode="email"
                autocomplete="username" placeholder="nombre@acmeschool.edu" required
                aria-describedby="login-email-error">
              <p class="campo__error" id="login-email-error"></p>
            </div>

            <div class="campo">
              <label class="campo__etiqueta" for="login-contrasena">
                Contraseña <span class="campo__obligatorio" aria-hidden="true">*</span>
              </label>
              <div class="campo__grupo">
                <input class="campo__entrada" id="login-contrasena" name="contrasena" type="password"
                  autocomplete="current-password" required aria-describedby="login-contrasena-error">
                <button type="button" class="campo__boton-interno" data-accion="mostrar-contrasena"
                  aria-label="Mostrar contraseña" aria-pressed="false">${icono('ojo')}</button>
              </div>
              <p class="campo__error" id="login-contrasena-error"></p>
            </div>

            <button type="submit" class="btn btn--primario btn--grande btn--bloque">
              ${icono('entrar')} Iniciar sesión
            </button>
          </form>

          <div class="login__demo">
            <p><strong>Acceso de demostración:</strong> autocompleta una cuenta de prueba.</p>
            <div class="grupo-botones">${botonesDemo}</div>
          </div>

          <a class="login__volver" href="#/">${icono('flecha-izquierda')} Volver al catálogo de exámenes</a>
        </div>
      </section>`;
  }

  /** Rellena el formulario con una cuenta de prueba. */
  #alElegirDemo = (evento) => {
    const boton = evento.target.closest('[data-cargo]');
    if (!boton) return;
    const credencial = CREDENCIALES_DEMO.find((c) => c.cargo === boton.dataset.cargo);
    this.#formulario.elements.email.value = credencial.email;
    this.#formulario.elements.contrasena.value = credencial.contrasena;
    limpiarErrores(this.#formulario);
    this.#errorGeneral.hidden = true;
    this.#formulario.querySelector('[type="submit"]').focus();
  };

  #alEnviar = async (evento) => {
    evento.preventDefault();
    this.#errorGeneral.hidden = true;

    const datos = obtenerDatosFormulario(this.#formulario, { sinRecortar: ['contrasena'] });
    const { esValido, errores } = validar(datos, ESQUEMA_LOGIN);
    if (!esValido) {
      mostrarErrores(this.#formulario, errores);
      return;
    }

    const botonEnviar = this.#formulario.querySelector('[type="submit"]');
    ponerBotonCargando(botonEnviar, true);

    try {
      const sesion = await iniciarSesion(datos.email, datos.contrasena);
      notificar(`¡Bienvenido(a), ${obtenerPrimerNombre(sesion.nombreCompleto)}!`, { tipo: 'exito' });
      navegar(tomarRutaPendiente() ?? '/admin', { reemplazar: true });
    } catch (error) {
      this.#mostrarErrorGeneral(error.message);
      ponerBotonCargando(botonEnviar, false);
    }
  };

  #mostrarErrorGeneral(mensaje) {
    this.#errorGeneral.innerHTML = `${icono('error')}<span>${escaparHTML(mensaje)}</span>`;
    this.#errorGeneral.hidden = false;

    // Reinicia la animación de sacudida (forzar reflow permite repetirla)
    this.#tarjeta.classList.remove('animar-sacudir');
    void this.#tarjeta.offsetWidth;
    this.#tarjeta.classList.add('animar-sacudir');

    const campoContrasena = this.#formulario.elements.contrasena;
    campoContrasena.select();
    campoContrasena.focus();
  }
}

customElements.define('vista-login', VistaLogin);
