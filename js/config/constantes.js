/**
 * constantes.js · Valores fijos de la aplicación
 * ---------------------------------------------------------------------------
 * Centralizar estos valores evita "números mágicos" repartidos por el código:
 * si algo cambia (una clave, un límite), se cambia solo en este archivo.
 * Object.freeze() impide que se modifiquen por error mientras la app corre.
 */

/** Nombre de la aplicación (se usa en títulos y en los respaldos). */
export const NOMBRE_APLICACION = 'Acme School';

/**
 * Claves con las que se guarda cada colección en localStorage.
 * Todas llevan el prefijo "acme_" para no chocar con otras apps del mismo origen.
 * Nota: index.html lee "acme_tema" directamente para aplicar el tema sin parpadeo.
 */
export const CLAVES_ALMACENAMIENTO = Object.freeze({
  USUARIOS: 'acme_usuarios',
  EXAMENES: 'acme_examenes',
  INTENTOS: 'acme_intentos',
  INTENTO_ACTIVO: 'acme_intento_activo',
  SESION: 'acme_sesion',
  TEMA: 'acme_tema',
});

/** Temas visuales disponibles (se aplican con data-tema en <html>). */
export const TEMAS = Object.freeze({
  CLARO: 'claro',
  OSCURO: 'oscuro',
});

/** Cargos posibles de un usuario del área privada. */
export const CARGOS = Object.freeze({
  ADMINISTRATIVO: 'administrativo',
  DOCENTE: 'docente',
});

/** Nombre visible de cada cargo (para tablas, insignias y el formulario). */
export const NOMBRES_CARGOS = Object.freeze({
  [CARGOS.ADMINISTRATIVO]: 'Administrativo',
  [CARGOS.DOCENTE]: 'Docente',
});

/** Cómo terminó un examen: el estudiante pulsó "Terminar" o se acabó el tiempo. */
export const MOTIVOS_FINALIZACION = Object.freeze({
  ESTUDIANTE: 'estudiante',
  TIEMPO: 'tiempo',
});

/** Tiempo que dura una sesión antes de pedir de nuevo el inicio de sesión. */
export const DURACION_SESION_MS = 8 * 60 * 60 * 1000; // 8 horas

/**
 * Límites de cada campo del modelo de datos.
 * Los usan las validaciones de los formularios y de los servicios.
 */
export const LIMITES = Object.freeze({
  // Usuarios
  IDENTIFICACION: Object.freeze({ MIN: 5, MAX: 15 }), // cantidad de dígitos
  NOMBRE_COMPLETO: Object.freeze({ MIN: 3, MAX: 80 }), // caracteres
  TELEFONO: Object.freeze({ MIN: 7, MAX: 15 }), // cantidad de dígitos
  CONTRASENA: Object.freeze({ MIN: 8, MAX: 64 }), // caracteres

  // Exámenes
  CODIGO_EXAMEN: Object.freeze({ MIN: 2, MAX: 15 }), // caracteres
  TITULO_EXAMEN: Object.freeze({ MIN: 3, MAX: 100 }), // caracteres
  TIEMPO_MINUTOS: Object.freeze({ MIN: 1, MAX: 300 }), // minutos
  PORCENTAJE_APROBACION: Object.freeze({ MIN: 1, MAX: 100 }), // porcentaje
  DESCRIPCION_EXAMEN: Object.freeze({ MIN: 10, MAX: 500 }), // caracteres

  // Preguntas y respuestas
  ENUNCIADO: Object.freeze({ MIN: 5, MAX: 300 }), // caracteres
  DESCRIPCION_RESPUESTA: Object.freeze({ MIN: 1, MAX: 200 }), // caracteres
  RESPUESTAS_POR_PREGUNTA: Object.freeze({ MIN: 2, MAX: 6 }), // cantidad
});
