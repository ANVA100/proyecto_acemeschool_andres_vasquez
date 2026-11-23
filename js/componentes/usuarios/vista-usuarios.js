/**
 * <vista-usuarios> · Módulo "Gestión de usuarios" (privado)
 * ---------------------------------------------------------------------------
 * Vista "orquestadora": compone tres Web Components y conecta sus eventos
 * con el servicio de usuarios.
 *
 *   <formulario-usuario>  → "guardar-usuario"   → crearUsuario / actualizarUsuario
 *   <tabla-usuarios>      → "editar-usuario"    → formulario.editar(usuario)
 *                         → "eliminar-usuario"  → confirmar() → eliminarUsuario
 *   <campo-busqueda>      → "buscar"            → filtra la tabla
 */
import { obtenerSesion } from '../../servicios/servicio-autenticacion.js';
import {
  actualizarUsuario,
  crearUsuario,
  eliminarUsuario,
  obtenerUsuarioPorId,
  obtenerUsuarios,
} from '../../servicios/servicio-usuarios.js';
import { normalizarTexto, pluralizar } from '../../utilidades/formato.js';
import { ErrorValidacion } from '../../utilidades/validaciones.js';
import { NOMBRES_CARGOS } from '../../config/constantes.js';
import { notificar } from '../compartidos/contenedor-notificaciones.js';
import { confirmar } from '../compartidos/dialogo-confirmacion.js';
import './formulario-usuario.js';
import './tabla-usuarios.js';

class VistaUsuarios extends HTMLElement {
  #formulario;
  #tabla;
  #contador;
  #termino = '';

  connectedCallback() {
    this.innerHTML = `
      <div class="encabezado-vista">
        <div>
          <h1 class="encabezado-vista__titulo">Gestión de usuarios</h1>
          <p class="encabezado-vista__descripcion">
            Crea, actualiza y elimina las cuentas del personal que puede acceder al área privada.
          </p>
        </div>
      </div>

      <div class="rejilla-admin">
        <div class="rejilla-admin__lateral">
          <formulario-usuario></formulario-usuario>
        </div>

        <section class="tarjeta tarjeta--tabla" aria-labelledby="titulo-tabla-usuarios">
          <div class="tarjeta__encabezado">
            <div>
              <h2 class="tarjeta__titulo" id="titulo-tabla-usuarios">Usuarios registrados</h2>
              <p class="tarjeta__subtitulo" data-ref="contador" aria-live="polite"></p>
            </div>
            <campo-busqueda class="buscador-tabla" etiqueta="Buscar usuarios"
              placeholder="Nombre, correo, identificación…"></campo-busqueda>
          </div>
          <tabla-usuarios></tabla-usuarios>
        </section>
      </div>`;

    this.#formulario = this.querySelector('formulario-usuario');
    this.#tabla = this.querySelector('tabla-usuarios');
    this.#contador = this.querySelector('[data-ref="contador"]');

    this.addEventListener('guardar-usuario', this.#alGuardar);
    this.addEventListener('editar-usuario', this.#alEditar);
    this.addEventListener('eliminar-usuario', this.#alEliminar);
    this.addEventListener('buscar', this.#alBuscar);

    this.#refrescar();
  }

  /** Vuelve a leer los usuarios, aplica la búsqueda y actualiza tabla y contador. */
  #refrescar() {
    const todos = obtenerUsuarios();
    const termino = normalizarTexto(this.#termino);
    const visibles = termino
      ? todos.filter((usuario) =>
          [usuario.nombreCompleto, usuario.email, usuario.identificacion, usuario.telefono, NOMBRES_CARGOS[usuario.cargo]]
            .some((valor) => normalizarTexto(valor).includes(termino))
        )
      : todos;

    this.#tabla.idSesion = obtenerSesion()?.usuarioId ?? null;
    this.#tabla.hayBusqueda = termino !== '';
    this.#tabla.usuarios = visibles;
    this.#contador.textContent = termino
      ? `Mostrando ${visibles.length} de ${pluralizar(todos.length, 'usuario')}`
      : `${pluralizar(todos.length, 'usuario registrado', 'usuarios registrados')}`;
  }

  #alGuardar = async (evento) => {
    const { datos, id } = evento.detail;
    this.#formulario.cargando = true;

    try {
      const usuario = id ? await actualizarUsuario(id, datos) : await crearUsuario(datos);
      notificar(
        id ? `Se actualizaron los datos de ${usuario.nombreCompleto}.` : `Usuario ${usuario.nombreCompleto} creado correctamente.`,
        { tipo: 'exito' }
      );
      this.#formulario.reiniciar();
      this.#refrescar();
      this.#tabla.resaltar(usuario.id);
    } catch (error) {
      if (error instanceof ErrorValidacion) {
        this.#formulario.mostrarErrores(error.errores);
      }
      notificar(error.message || 'No se pudo guardar el usuario.', { tipo: 'error' });
    } finally {
      this.#formulario.cargando = false;
    }
  };

  #alEditar = (evento) => {
    const usuario = obtenerUsuarioPorId(evento.detail.id);
    if (!usuario) {
      notificar('Ese usuario ya no existe.', { tipo: 'error' });
      this.#refrescar();
      return;
    }
    this.#formulario.editar(usuario);
  };

  #alEliminar = async (evento) => {
    const usuario = obtenerUsuarioPorId(evento.detail.id);
    if (!usuario) return;

    const acepto = await confirmar({
      titulo: `¿Eliminar a ${usuario.nombreCompleto}?`,
      mensaje: 'Perderá el acceso al área privada. Esta acción no se puede deshacer.',
      textoConfirmar: 'Eliminar usuario',
    });
    if (!acepto) return;

    try {
      eliminarUsuario(usuario.id);
      if (this.#formulario.idEditando === usuario.id) this.#formulario.reiniciar();
      notificar(`Se eliminó a ${usuario.nombreCompleto}.`, { tipo: 'exito' });
      this.#refrescar();
    } catch (error) {
      notificar(error.message, { tipo: 'error' });
    }
  };

  #alBuscar = (evento) => {
    this.#termino = evento.detail.termino;
    this.#refrescar();
  };
}

customElements.define('vista-usuarios', VistaUsuarios);
