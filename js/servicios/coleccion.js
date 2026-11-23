/**
 * coleccion.js · Operaciones CRUD genéricas sobre localStorage
 * ---------------------------------------------------------------------------
 * Una "colección" es un arreglo de registros JSON guardado bajo una clave
 * (p. ej. "acme_usuarios"). Esta fábrica crea un objeto con las operaciones
 * básicas: Crear, Leer, Actualizar y Eliminar (CRUD).
 *
 * Así los servicios de usuarios, exámenes e intentos reutilizan la misma
 * lógica y solo se ocupan de sus propias reglas de negocio.
 *
 * Cada registro recibe automáticamente:
 *  - id:            identificador único
 *  - creadoEn:      fecha de creación (ISO 8601)
 *  - actualizadoEn: fecha de la última modificación (ISO 8601)
 *
 * @example
 *   const usuarios = crearColeccion('acme_usuarios');
 *   const nuevo = usuarios.agregar({ nombreCompleto: 'Ana' });
 *   usuarios.actualizar(nuevo.id, { nombreCompleto: 'Ana María' });
 *   usuarios.eliminar(nuevo.id);
 */
import { leerDatos, guardarDatos } from './almacenamiento.js';
import { generarId } from '../utilidades/generador-id.js';

/**
 * Crea un registro nuevo con id y fechas.
 * Los campos automáticos van al final para que no se puedan sobrescribir.
 * @param {object} datos
 * @returns {object}
 */
function construirRegistro(datos) {
  const ahora = new Date().toISOString();
  return { ...datos, id: generarId(), creadoEn: ahora, actualizadoEn: ahora };
}

/**
 * Crea las operaciones CRUD para una clave de localStorage.
 * @param {string} clave - Clave donde se guarda el arreglo.
 */
export function crearColeccion(clave) {
  /** @returns {object[]} Todos los registros (copia nueva en cada lectura). */
  const obtenerTodos = () => {
    const registros = leerDatos(clave, []);
    return Array.isArray(registros) ? registros : [];
  };

  /** Reemplaza el arreglo completo. */
  const guardarTodos = (registros) => guardarDatos(clave, registros);

  /** @returns {object|null} El registro con ese id o null si no existe. */
  const obtenerPorId = (id) => obtenerTodos().find((registro) => registro.id === id) ?? null;

  /** Agrega un registro y lo devuelve ya con id y fechas. */
  const agregar = (datos) => {
    const nuevo = construirRegistro(datos);
    guardarTodos([...obtenerTodos(), nuevo]);
    return nuevo;
  };

  /** Agrega varios registros con una sola escritura (útil para datos iniciales). */
  const agregarVarios = (listaDatos) => {
    const nuevos = listaDatos.map(construirRegistro);
    guardarTodos([...obtenerTodos(), ...nuevos]);
    return nuevos;
  };

  /**
   * Actualiza los campos indicados de un registro.
   * El id y la fecha de creación nunca cambian.
   * @returns {object|null} El registro actualizado o null si no existe.
   */
  const actualizar = (id, cambios) => {
    const registros = obtenerTodos();
    const indice = registros.findIndex((registro) => registro.id === id);
    if (indice === -1) return null;

    const original = registros[indice];
    const actualizado = {
      ...original,
      ...cambios,
      id: original.id,
      creadoEn: original.creadoEn,
      actualizadoEn: new Date().toISOString(),
    };
    registros[indice] = actualizado;
    guardarTodos(registros);
    return actualizado;
  };

  /** @returns {boolean} true si se eliminó, false si no existía. */
  const eliminar = (id) => {
    const registros = obtenerTodos();
    const restantes = registros.filter((registro) => registro.id !== id);
    if (restantes.length === registros.length) return false;
    guardarTodos(restantes);
    return true;
  };

  return Object.freeze({
    clave,
    obtenerTodos,
    obtenerPorId,
    agregar,
    agregarVarios,
    actualizar,
    eliminar,
    guardarTodos,
  });
}
