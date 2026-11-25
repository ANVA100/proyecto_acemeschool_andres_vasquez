/**
 * servicio-respaldo.js · Exportar e importar toda la información en JSON
 * ---------------------------------------------------------------------------
 * Formato del archivo de respaldo:
 *   {
 *     "aplicacion": "Acme School",
 *     "version": 1,
 *     "exportadoEn": "2026-11-25T15:00:00.000Z",
 *     "datos": { "usuarios": [...], "examenes": [...], "intentos": [...] }
 *   }
 *
 * - Exportar: genera el archivo y lo descarga con un enlace temporal (Blob).
 * - Importar: lee el archivo, VALIDA su estructura y reemplaza los datos.
 *   Si algo falla a mitad de camino, se restauran los datos anteriores.
 * - Las contraseñas viajan cifradas (sal + hash), nunca en texto plano.
 */
import { CARGOS, CLAVES_ALMACENAMIENTO, LIMITES, NOMBRE_APLICACION } from '../config/constantes.js';
import { inicializarDatos } from '../datos/datos-iniciales.js';
import { eliminarDatos, guardarDatos, leerDatos } from './almacenamiento.js';

const VERSION_RESPALDO = 1;
const TAMANO_MAXIMO_BYTES = 5 * 1024 * 1024; // 5 MB
const MAXIMO_ERRORES_MOSTRADOS = 6;

/** Claves que se reemplazan al importar o restablecer. */
const CLAVES_DATOS = [
  CLAVES_ALMACENAMIENTO.USUARIOS,
  CLAVES_ALMACENAMIENTO.EXAMENES,
  CLAVES_ALMACENAMIENTO.INTENTOS,
  CLAVES_ALMACENAMIENTO.INTENTO_ACTIVO,
];

/** Error de importación con la lista de problemas encontrados. */
export class ErrorRespaldo extends Error {
  constructor(mensaje, detalles = []) {
    super(mensaje);
    this.name = 'ErrorRespaldo';
    this.detalles = detalles;
  }
}

/** Arma el objeto de respaldo con todos los datos actuales. */
export function crearRespaldo() {
  return {
    aplicacion: NOMBRE_APLICACION,
    version: VERSION_RESPALDO,
    exportadoEn: new Date().toISOString(),
    datos: {
      usuarios: leerDatos(CLAVES_ALMACENAMIENTO.USUARIOS, []),
      examenes: leerDatos(CLAVES_ALMACENAMIENTO.EXAMENES, []),
      intentos: leerDatos(CLAVES_ALMACENAMIENTO.INTENTOS, []),
    },
  };
}

/** Cantidades de cada tipo de dato (para mostrarlas en pantalla). */
export function resumirDatos({ usuarios = [], examenes = [], intentos = [] }) {
  return {
    usuarios: usuarios.length,
    examenes: examenes.length,
    preguntas: examenes.reduce((suma, examen) => suma + (examen.preguntas?.length ?? 0), 0),
    intentos: intentos.length,
  };
}

/**
 * Descarga el respaldo como archivo .json.
 * @returns {object} Resumen de lo exportado.
 */
export function descargarRespaldo() {
  const respaldo = crearRespaldo();
  const archivo = new Blob([JSON.stringify(respaldo, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(archivo);
  const fecha = respaldo.exportadoEn.slice(0, 10);

  // Un enlace con el atributo "download" hace que el navegador descargue el archivo
  const enlace = document.createElement('a');
  enlace.href = url;
  enlace.download = `acme-school-respaldo-${fecha}.json`;
  document.body.append(enlace);
  enlace.click();
  enlace.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000); // libera la memoria del Blob

  return resumirDatos(respaldo.datos);
}

/* ==========================================================================
   VALIDACIÓN DEL ARCHIVO
   ========================================================================== */

const esObjeto = (valor) => valor !== null && typeof valor === 'object' && !Array.isArray(valor);
const esTexto = (valor) => typeof valor === 'string' && valor.trim() !== '';
const esNumero = (valor) => typeof valor === 'number' && Number.isFinite(valor);

/** Agrega un error si hay valores repetidos en la lista. */
function verificarRepetidos(valores, descripcion, errores) {
  const vistos = new Set();
  for (const valor of valores) {
    if (vistos.has(valor)) {
      errores.push(`Hay ${descripcion} repetido: "${valor}".`);
      return;
    }
    vistos.add(valor);
  }
}

function validarUsuarios(usuarios, errores) {
  if (usuarios.length === 0) {
    errores.push('Debe incluir al menos un usuario para poder iniciar sesión.');
  }
  usuarios.forEach((usuario, indice) => {
    const completo =
      esObjeto(usuario) &&
      [usuario.id, usuario.identificacion, usuario.nombreCompleto, usuario.email, usuario.salContrasena, usuario.hashContrasena].every(esTexto) &&
      Object.values(CARGOS).includes(usuario.cargo);
    if (!completo) errores.push(`El usuario ${indice + 1} está incompleto o tiene un cargo inválido.`);
  });
  const validos = usuarios.filter(esObjeto);
  verificarRepetidos(validos.map((u) => u.id), 'un id de usuario', errores);
  verificarRepetidos(validos.map((u) => String(u.email).toLowerCase()), 'un correo', errores);
  verificarRepetidos(validos.map((u) => u.identificacion), 'una identificación', errores);
}

function validarExamenes(examenes, errores) {
  const { RESPUESTAS_POR_PREGUNTA } = LIMITES;
  examenes.forEach((examen, indice) => {
    const nombre = esObjeto(examen) && esTexto(examen.codigo) ? examen.codigo : `#${indice + 1}`;
    const completo =
      esObjeto(examen) &&
      [examen.id, examen.codigo, examen.titulo].every(esTexto) &&
      esNumero(examen.tiempoMinutos) &&
      esNumero(examen.porcentajeAprobacion) &&
      Array.isArray(examen.preguntas);
    if (!completo) {
      errores.push(`El examen ${nombre} está incompleto.`);
      return;
    }
    examen.preguntas.forEach((pregunta, posicion) => {
      const respuestas = pregunta?.respuestas;
      const valida =
        esObjeto(pregunta) &&
        esTexto(pregunta.id) &&
        esTexto(pregunta.enunciado) &&
        Array.isArray(respuestas) &&
        respuestas.length >= RESPUESTAS_POR_PREGUNTA.MIN &&
        respuestas.length <= RESPUESTAS_POR_PREGUNTA.MAX &&
        respuestas.every((r) => esObjeto(r) && esTexto(r.id) && esTexto(r.descripcion)) &&
        respuestas.filter((r) => r.esCorrecta === true).length === 1;
      if (!valida) errores.push(`La pregunta ${posicion + 1} del examen ${nombre} no es válida.`);
    });
  });
  const validos = examenes.filter(esObjeto);
  verificarRepetidos(validos.map((e) => e.id), 'un id de examen', errores);
  verificarRepetidos(validos.map((e) => e.codigo), 'un código de examen', errores);
}

function validarIntentos(intentos, errores) {
  intentos.forEach((intento, indice) => {
    const completo =
      esObjeto(intento) &&
      esTexto(intento.id) &&
      esObjeto(intento.estudiante) &&
      esTexto(intento.estudiante.identificacion) &&
      esObjeto(intento.examen) &&
      esNumero(intento.porcentajeObtenido) &&
      typeof intento.aprobado === 'boolean';
    if (!completo) errores.push(`El resultado ${indice + 1} está incompleto.`);
  });
}

/**
 * Revisa que el objeto tenga la estructura de un respaldo de Acme School.
 * @param {*} respaldo
 * @returns {string[]} Lista de problemas (vacía si es válido).
 */
export function validarRespaldo(respaldo) {
  if (!esObjeto(respaldo)) return ['El contenido debe ser un objeto JSON.'];

  const errores = [];
  if (respaldo.aplicacion !== NOMBRE_APLICACION) errores.push('El archivo no fue generado por Acme School.');
  if (respaldo.version !== VERSION_RESPALDO) errores.push(`La versión del respaldo (${respaldo.version}) no es compatible.`);

  const { datos } = respaldo;
  if (!esObjeto(datos) || !Array.isArray(datos.usuarios) || !Array.isArray(datos.examenes) || !Array.isArray(datos.intentos)) {
    errores.push('Faltan las listas de usuarios, exámenes o resultados.');
    return errores;
  }

  validarUsuarios(datos.usuarios, errores);
  validarExamenes(datos.examenes, errores);
  validarIntentos(datos.intentos, errores);

  if (errores.length > MAXIMO_ERRORES_MOSTRADOS) {
    const restantes = errores.length - MAXIMO_ERRORES_MOSTRADOS;
    return [...errores.slice(0, MAXIMO_ERRORES_MOSTRADOS), `…y ${restantes} problema(s) más.`];
  }
  return errores;
}

/**
 * Lee y valida un archivo elegido por el usuario.
 * @param {File} archivo
 * @returns {Promise<object>} El respaldo ya validado.
 * @throws {ErrorRespaldo}
 */
export async function leerArchivoRespaldo(archivo) {
  if (!archivo) throw new ErrorRespaldo('Selecciona un archivo de respaldo.');
  if (!archivo.name.toLowerCase().endsWith('.json')) {
    throw new ErrorRespaldo('El archivo debe tener la extensión .json.');
  }
  if (archivo.size > TAMANO_MAXIMO_BYTES) {
    throw new ErrorRespaldo('El archivo es demasiado grande (máximo 5 MB).');
  }

  let contenido;
  try {
    contenido = JSON.parse(await archivo.text());
  } catch {
    throw new ErrorRespaldo('El archivo no contiene JSON válido.');
  }

  const errores = validarRespaldo(contenido);
  if (errores.length > 0) {
    throw new ErrorRespaldo('El archivo no es un respaldo válido de Acme School.', errores);
  }
  return contenido;
}

/** Ejecuta un cambio de datos y, si falla, deja todo como estaba antes. */
function reemplazarConSeguridad(cambio) {
  const anteriores = CLAVES_DATOS.map((clave) => [clave, localStorage.getItem(clave)]);
  try {
    return cambio();
  } catch (error) {
    for (const [clave, valor] of anteriores) {
      if (valor === null) localStorage.removeItem(clave);
      else localStorage.setItem(clave, valor);
    }
    throw error;
  }
}

/**
 * Reemplaza TODOS los datos por los del respaldo.
 * También descarta cualquier examen en curso (podría no existir en el respaldo).
 * @param {object} respaldo - Objeto ya validado.
 * @returns {object} Resumen de lo importado.
 */
export function importarRespaldo(respaldo) {
  const errores = validarRespaldo(respaldo);
  if (errores.length > 0) throw new ErrorRespaldo('El respaldo no es válido.', errores);

  return reemplazarConSeguridad(() => {
    guardarDatos(CLAVES_ALMACENAMIENTO.USUARIOS, respaldo.datos.usuarios);
    guardarDatos(CLAVES_ALMACENAMIENTO.EXAMENES, respaldo.datos.examenes);
    guardarDatos(CLAVES_ALMACENAMIENTO.INTENTOS, respaldo.datos.intentos);
    eliminarDatos(CLAVES_ALMACENAMIENTO.INTENTO_ACTIVO);
    return resumirDatos(respaldo.datos);
  });
}

/**
 * Borra todo y vuelve a crear los usuarios y exámenes de demostración.
 * @returns {Promise<object>} Resumen de los datos nuevos.
 */
export async function restablecerDatosDemo() {
  CLAVES_DATOS.forEach(eliminarDatos);
  await inicializarDatos();
  return resumirDatos(crearRespaldo().datos);
}
