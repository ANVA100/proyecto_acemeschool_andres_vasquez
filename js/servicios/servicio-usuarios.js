/**
 * servicio-usuarios.js · Reglas de negocio de los usuarios del área privada
 * ---------------------------------------------------------------------------
 * Usa la colección genérica (coleccion.js) para el CRUD y agrega:
 *  - validación de cada campo (el mismo esquema que usa el formulario),
 *  - número de identificación y correo ÚNICOS,
 *  - cifrado de la contraseña (nunca se guarda en texto plano),
 *  - protección: no se puede eliminar la cuenta con la que se inició sesión.
 *
 * Los usuarios que se entregan a las vistas NO incluyen la sal ni el hash.
 */
import { CARGOS, CLAVES_ALMACENAMIENTO, LIMITES } from '../config/constantes.js';
import { protegerContrasena } from '../utilidades/cifrado.js';
import { ErrorValidacion, PATRONES, reglas, validar } from '../utilidades/validaciones.js';
import { crearColeccion } from './coleccion.js';
import { actualizarDatosSesion, obtenerSesion } from './servicio-autenticacion.js';

const usuarios = crearColeccion(CLAVES_ALMACENAMIENTO.USUARIOS);

/**
 * Esquema de validación de un usuario.
 * Al crear, la contraseña es obligatoria; al editar es opcional
 * (si se deja vacía se conserva la actual).
 * @param {{esNuevo: boolean}} opciones
 */
export function crearEsquemaUsuario({ esNuevo }) {
  const { IDENTIFICACION, NOMBRE_COMPLETO, TELEFONO, CONTRASENA } = LIMITES;
  const reglasContrasena = [
    reglas.longitud(CONTRASENA.MIN, CONTRASENA.MAX),
    reglas.contrasenaSegura(),
  ];

  return {
    identificacion: [
      reglas.requerido('Ingresa el número de identificación.'),
      reglas.soloDigitos(IDENTIFICACION.MIN, IDENTIFICACION.MAX),
    ],
    nombreCompleto: [
      reglas.requerido('Ingresa el nombre completo.'),
      reglas.longitud(NOMBRE_COMPLETO.MIN, NOMBRE_COMPLETO.MAX),
      reglas.patron(PATRONES.NOMBRE_PERSONA, 'Usa solo letras y espacios.'),
    ],
    email: [reglas.requerido('Ingresa el correo electrónico.'), reglas.email(), reglas.longitud(6, 100)],
    telefono: [
      reglas.requerido('Ingresa el número de teléfono.'),
      reglas.soloDigitos(TELEFONO.MIN, TELEFONO.MAX),
    ],
    cargo: [
      reglas.requerido('Selecciona el cargo.'),
      (valor) => (Object.values(CARGOS).includes(valor) ? '' : 'Selecciona un cargo válido.'),
    ],
    contrasena: esNuevo ? [reglas.requerido('Ingresa una contraseña.'), ...reglasContrasena] : reglasContrasena,
  };
}

/** Quita los datos sensibles antes de entregar un usuario a la interfaz. */
function quitarCredenciales({ salContrasena, hashContrasena, ...usuario }) {
  return usuario;
}

/** Limpia los datos: espacios sobrantes, correo en minúsculas... */
function normalizarDatos(datos) {
  return {
    identificacion: String(datos.identificacion ?? '').trim(),
    nombreCompleto: String(datos.nombreCompleto ?? '').trim().replace(/\s+/g, ' '),
    email: String(datos.email ?? '').trim().toLowerCase(),
    telefono: String(datos.telefono ?? '').trim(),
    cargo: String(datos.cargo ?? '').trim(),
    contrasena: String(datos.contrasena ?? ''),
  };
}

/** Errores si la identificación o el correo ya pertenecen a otro usuario. */
function verificarDatosUnicos(datos, idExcluido = null) {
  const errores = {};
  for (const usuario of usuarios.obtenerTodos()) {
    if (usuario.id === idExcluido) continue;
    if (usuario.identificacion === datos.identificacion) {
      errores.identificacion = 'Ya existe un usuario con este número de identificación.';
    }
    if (usuario.email.toLowerCase() === datos.email) {
      errores.email = 'Ya existe un usuario con este correo electrónico.';
    }
  }
  return errores;
}

/** Valida formato y unicidad; lanza ErrorValidacion si algo falla. */
function validarUsuario(datos, { esNuevo, idExcluido = null }) {
  const { errores } = validar(datos, crearEsquemaUsuario({ esNuevo }));
  const erroresUnicidad = verificarDatosUnicos(datos, idExcluido);
  // Los errores de formato tienen prioridad sobre los de unicidad
  const todos = { ...erroresUnicidad, ...errores };
  if (Object.keys(todos).length > 0) throw new ErrorValidacion(todos);
}

/** @returns {object[]} Usuarios ordenados alfabéticamente (sin credenciales). */
export function obtenerUsuarios() {
  return usuarios
    .obtenerTodos()
    .sort((a, b) => a.nombreCompleto.localeCompare(b.nombreCompleto, 'es'))
    .map(quitarCredenciales);
}

/** @returns {object|null} */
export function obtenerUsuarioPorId(id) {
  const usuario = usuarios.obtenerPorId(id);
  return usuario ? quitarCredenciales(usuario) : null;
}

/**
 * Crea un usuario.
 * @param {object} datosFormulario
 * @returns {Promise<object>} Usuario creado (sin credenciales).
 * @throws {ErrorValidacion}
 */
export async function crearUsuario(datosFormulario) {
  const datos = normalizarDatos(datosFormulario);
  validarUsuario(datos, { esNuevo: true });

  const { contrasena, ...datosUsuario } = datos;
  const credenciales = await protegerContrasena(contrasena);
  return quitarCredenciales(usuarios.agregar({ ...datosUsuario, ...credenciales }));
}

/**
 * Actualiza un usuario. Si la contraseña viene vacía se conserva la actual.
 * @param {string} id
 * @param {object} datosFormulario
 * @returns {Promise<object>} Usuario actualizado (sin credenciales).
 */
export async function actualizarUsuario(id, datosFormulario) {
  if (!usuarios.obtenerPorId(id)) {
    throw new Error('El usuario que intentas editar ya no existe.');
  }

  const datos = normalizarDatos(datosFormulario);
  validarUsuario(datos, { esNuevo: false, idExcluido: id });

  const { contrasena, ...cambios } = datos;
  const credenciales = contrasena ? await protegerContrasena(contrasena) : {};
  const actualizado = quitarCredenciales(usuarios.actualizar(id, { ...cambios, ...credenciales }));

  // Si el usuario se editó a sí mismo, el encabezado debe mostrar los datos nuevos
  actualizarDatosSesion(actualizado);
  return actualizado;
}

/**
 * Elimina un usuario.
 * @param {string} id
 * @throws {Error} Si es la cuenta de la sesión actual o ya no existe.
 */
export function eliminarUsuario(id) {
  if (obtenerSesion()?.usuarioId === id) {
    throw new Error('No puedes eliminar tu propia cuenta mientras tienes la sesión iniciada.');
  }
  if (!usuarios.eliminar(id)) {
    throw new Error('El usuario que intentas eliminar ya no existe.');
  }
}
