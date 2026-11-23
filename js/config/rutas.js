/**
 * rutas.js · Tabla de rutas de la aplicación
 * ---------------------------------------------------------------------------
 * La app es una SPA (Single Page Application): hay un solo index.html y el
 * enrutador cambia la vista según la parte de la URL que va después de "#".
 *   Ejemplo: index.html#/admin/usuarios → <vista-usuarios>
 *
 * Cada ruta indica:
 *  - patron:        ruta a comparar (":id" es un parámetro variable).
 *  - componente:    etiqueta del Web Component que se muestra.
 *  - titulo:        título de la pestaña del navegador.
 *  - privada:       true si exige haber iniciado sesión.
 *  - soloInvitados: true si solo tiene sentido sin sesión (p. ej. el login).
 *  - modo:          "examen" oculta la navegación mientras se presenta un examen.
 *  - redirigir:     envía automáticamente a otra ruta.
 *  - parte:         parte del proyecto donde se construye la vista (mientras
 *                   no exista se muestra la vista "en construcción").
 */
export const RUTAS = [
  { patron: '/', componente: 'vista-catalogo', titulo: 'Exámenes disponibles', parte: 8 },
  { patron: '/login', componente: 'vista-login', titulo: 'Iniciar sesión', soloInvitados: true, parte: 4 },
  { patron: '/examen/:id', componente: 'vista-examen', titulo: 'Presentando examen', modo: 'examen', parte: 9 },

  { patron: '/admin', redirigir: '/admin/examenes' },
  { patron: '/admin/examenes', componente: 'vista-examenes', titulo: 'Gestión de exámenes', privada: true, parte: 6 },
  {
    patron: '/admin/examenes/:id/preguntas',
    componente: 'vista-preguntas',
    titulo: 'Preguntas del examen',
    privada: true,
    parte: 7,
  },
  { patron: '/admin/usuarios', componente: 'vista-usuarios', titulo: 'Gestión de usuarios', privada: true, parte: 5 },
  { patron: '/admin/resultados', componente: 'vista-resultados', titulo: 'Resultados', privada: true, parte: 10 },
  { patron: '/admin/respaldo', componente: 'vista-respaldo', titulo: 'Respaldo de datos', privada: true, parte: 10 },
];
