/**
 * datos-iniciales.js · Datos de ejemplo para el primer uso
 * ---------------------------------------------------------------------------
 * La primera vez que se abre la aplicación, localStorage está vacío y nadie
 * podría iniciar sesión (para crear usuarios hay que estar autenticado).
 * Por eso aquí se crean:
 *  - 2 usuarios de prueba (administrativo y docente).
 *  - 3 exámenes de ejemplo (dos con preguntas y uno vacío).
 *
 * Solo se crean si la colección NO existe todavía; así nunca se duplican ni
 * se pisan los datos que el usuario ya creó.
 */
import { CARGOS, CLAVES_ALMACENAMIENTO } from '../config/constantes.js';
import { existeDato, guardarDatos } from '../servicios/almacenamiento.js';
import { crearColeccion } from '../servicios/coleccion.js';
import { protegerContrasena } from '../utilidades/cifrado.js';
import { generarId } from '../utilidades/generador-id.js';

/** Usuarios de prueba. La contraseña se cifra antes de guardarse. */
const USUARIOS_INICIALES = [
  {
    identificacion: '1000000001',
    nombreCompleto: 'Administrador Acme',
    email: 'admin@acmeschool.edu',
    telefono: '3001234567',
    cargo: CARGOS.ADMINISTRATIVO,
    contrasena: 'Admin123*',
  },
  {
    identificacion: '1000000002',
    nombreCompleto: 'Laura Gómez',
    email: 'docente@acmeschool.edu',
    telefono: '3109876543',
    cargo: CARGOS.DOCENTE,
    contrasena: 'Docente123*',
  },
];

/**
 * Exámenes de ejemplo en formato compacto:
 * cada pregunta indica sus opciones y la posición (desde 0) de la correcta.
 */
const EXAMENES_INICIALES = [
  {
    codigo: 'JS-101',
    titulo: 'Fundamentos de JavaScript',
    tiempoMinutos: 10,
    porcentajeAprobacion: 60,
    descripcion:
      'Evalúa los conceptos básicos de JavaScript: variables, tipos de datos, operadores, arreglos y JSON.',
    mezclarPreguntas: true,
    preguntas: [
      {
        enunciado: '¿Qué palabra clave declara una variable cuyo valor no se puede reasignar?',
        opciones: ['var', 'let', 'const', 'static'],
        correcta: 2,
      },
      {
        enunciado: '¿Qué devuelve la expresión typeof [] ?',
        opciones: ['"array"', '"object"', '"list"', '"undefined"'],
        correcta: 1,
      },
      {
        enunciado: '¿Qué método agrega un elemento al final de un arreglo?',
        opciones: ['push()', 'pop()', 'shift()', 'unshift()'],
        correcta: 0,
      },
      {
        enunciado: "¿Cuál es el resultado de 2 + '2' en JavaScript?",
        opciones: ['4', '"22"', 'NaN', 'Se produce un error'],
        correcta: 1,
      },
      {
        enunciado: '¿Qué operador compara el valor y también el tipo de dato?',
        opciones: ['==', '===', '=', '!='],
        correcta: 1,
      },
      {
        enunciado: '¿Qué método convierte un objeto de JavaScript en texto JSON?',
        opciones: ['JSON.parse()', 'JSON.stringify()', 'toString()', 'Object.json()'],
        correcta: 1,
      },
    ],
  },
  {
    codigo: 'CG-001',
    titulo: 'Cultura general',
    tiempoMinutos: 5,
    porcentajeAprobacion: 70,
    descripcion: 'Preguntas rápidas de geografía, literatura y ciencia para poner a prueba tus conocimientos.',
    mezclarPreguntas: false,
    preguntas: [
      {
        enunciado: '¿Cuál es la capital de Colombia?',
        opciones: ['Medellín', 'Bogotá', 'Cali', 'Barranquilla'],
        correcta: 1,
      },
      {
        enunciado: '¿Cuál es el planeta más grande del sistema solar?',
        opciones: ['La Tierra', 'Saturno', 'Júpiter', 'Neptuno'],
        correcta: 2,
      },
      {
        enunciado: '¿Quién escribió la novela «Cien años de soledad»?',
        opciones: ['Gabriel García Márquez', 'Mario Vargas Llosa', 'Julio Cortázar', 'Isabel Allende'],
        correcta: 0,
      },
      {
        enunciado: '¿Cuál es el océano más grande del mundo?',
        opciones: ['Atlántico', 'Índico', 'Pacífico', 'Ártico'],
        correcta: 2,
      },
      {
        enunciado: '¿Cuál es la fórmula química del agua?',
        opciones: ['CO₂', 'H₂O', 'O₂', 'NaCl'],
        correcta: 1,
      },
    ],
  },
  {
    codigo: 'MAT-201',
    titulo: 'Álgebra básica',
    tiempoMinutos: 20,
    porcentajeAprobacion: 65,
    descripcion: 'Ecuaciones de primer grado, factorización y productos notables.',
    mezclarPreguntas: false,
    preguntas: [], // Sin preguntas: no aparecerá en el catálogo público hasta que se le agreguen
  },
];

/**
 * Convierte un examen del formato compacto al formato que se guarda:
 * cada pregunta y cada respuesta recibe su propio id, y cada respuesta
 * indica con "esCorrecta" si es la correcta.
 */
function construirExamen({ preguntas, ...datosExamen }) {
  return {
    ...datosExamen,
    preguntas: preguntas.map(({ enunciado, opciones, correcta }) => ({
      id: generarId(),
      enunciado,
      respuestas: opciones.map((descripcion, indice) => ({
        id: generarId(),
        descripcion,
        esCorrecta: indice === correcta,
      })),
    })),
  };
}

/** Crea los usuarios de prueba con sus contraseñas cifradas. */
async function crearUsuariosIniciales() {
  // Se cifran todas las contraseñas en paralelo y luego se guardan de una vez,
  // así la colección nunca queda a medias si algo falla.
  const usuarios = await Promise.all(
    USUARIOS_INICIALES.map(async ({ contrasena, ...datosUsuario }) => ({
      ...datosUsuario,
      ...(await protegerContrasena(contrasena)),
    }))
  );
  crearColeccion(CLAVES_ALMACENAMIENTO.USUARIOS).agregarVarios(usuarios);
}

/** Crea los exámenes de ejemplo. */
function crearExamenesIniciales() {
  crearColeccion(CLAVES_ALMACENAMIENTO.EXAMENES).agregarVarios(EXAMENES_INICIALES.map(construirExamen));
}

/**
 * Prepara los datos de la aplicación. Se llama una vez al iniciar.
 * Los exámenes se crean primero porque no dependen del cifrado: así el
 * módulo público funciona aunque el navegador no permita cifrar.
 * @returns {Promise<string[]>} Nombres de las colecciones que se crearon.
 */
export async function inicializarDatos() {
  const coleccionesCreadas = [];

  if (!existeDato(CLAVES_ALMACENAMIENTO.EXAMENES)) {
    crearExamenesIniciales();
    coleccionesCreadas.push('exámenes');
  }

  if (!existeDato(CLAVES_ALMACENAMIENTO.INTENTOS)) {
    guardarDatos(CLAVES_ALMACENAMIENTO.INTENTOS, []);
    coleccionesCreadas.push('intentos');
  }

  if (!existeDato(CLAVES_ALMACENAMIENTO.USUARIOS)) {
    await crearUsuariosIniciales();
    coleccionesCreadas.push('usuarios');
  }

  return coleccionesCreadas;
}
