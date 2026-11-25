# Acme School · Plataforma de exámenes

Plataforma web para que la escuela **Acme School** cree, administre y aplique exámenes en línea. Está construida con **HTML, CSS y JavaScript puro (ES Modules)** usando **Web Components** y **localStorage**, sin frameworks ni librerías.

- **Área privada** (requiere iniciar sesión): el personal administrativo y docente gestiona usuarios, exámenes, preguntas y resultados.
- **Módulo público**: los estudiantes eligen un examen, se identifican y lo presentan con un reloj en tiempo real. Al terminar ven su porcentaje de aciertos y si aprobaron.

---

## 📑 Contenido

1. [Cumplimiento de requisitos](#-cumplimiento-de-requisitos)
2. [Extras implementados](#-extras-implementados)
3. [Cómo ejecutar](#️-cómo-ejecutar-el-proyecto)
4. [Usuarios de prueba](#-usuarios-de-prueba)
5. [Guía rápida: flujo completo](#-guía-rápida-flujo-completo)
6. [Tecnologías](#-tecnologías)
7. [Arquitectura](#️-arquitectura)
8. [Estructura del proyecto](#-estructura-del-proyecto)
9. [Modelo de datos](#-modelo-de-datos)
10. [Web Components](#-web-components)
11. [Rutas](#-rutas)
12. [Módulos en detalle](#-módulos-en-detalle)
13. [Accesibilidad y diseño responsive](#-accesibilidad-y-diseño-responsive)
14. [Identidad visual](#-identidad-visual)
15. [Desarrollo por partes](#️-desarrollo-por-partes)
16. [Autor](#-autor)

---

## ✅ Cumplimiento de requisitos

| Requisito del proyecto | Implementación |
|------------------------|----------------|
| **Login** como vista inicial, con correo y contraseña | Al abrir la app se muestra `#/login`. Cualquier ruta privada sin sesión redirige al login y, tras iniciar sesión, regresa a la ruta solicitada |
| **Gestión de usuarios**: crear, actualizar y eliminar | `#/admin/usuarios`: tabla, formulario de creación/actualización y botones para editar y eliminar |
| Datos de usuario: identificación, nombre, email, teléfono, cargo (Administrativo/Docente), contraseña | Todos los campos con validaciones. Identificación y email únicos. Contraseña cifrada (SHA-256 + sal) |
| **Gestión de exámenes** (solo autenticados): código, título, tiempo, % de aprobación, descripción | `#/admin/examenes`: tabla, formulario y botones para editar y eliminar. Código único |
| Preguntas por examen con respuestas (descripción + si es correcta), **solo una correcta** | `#/admin/examenes/:id/preguntas`: de 2 a 6 respuestas por pregunta y una sola marcada como correcta (radio + validación en el servicio) |
| **Módulo de resolución público** (sin autenticación) | `#/examenes` y `#/examen/:id` no exigen sesión. Se llega desde el enlace **Presentar examen** del encabezado o desde el login ("¿Eres estudiante?") |
| Lista de exámenes con **título, tiempo y % para aprobar** | Catálogo con tarjetas `<tarjeta-examen>` (solo exámenes que ya tienen preguntas) |
| Pedir **identificación y nombre completo** antes de empezar; quedan asociados a las respuestas | `<dialogo-estudiante>`. Cada resultado guarda `estudiante: { identificacion, nombreCompleto }` |
| Encabezado del examen con **título, total de preguntas y % para aprobar** | Encabezado de `<vista-examen>` |
| Preguntas **enumeradas**, con sus respuestas y **una sola seleccionable** | "Pregunta 1 de 6"… Botones de opción (`radio`) con el mismo `name` por pregunta |
| Botón **Terminar** para acabar antes del tiempo | Al final del examen, con confirmación si faltan preguntas |
| **Reloj en tiempo real** que empieza en los minutos del examen y termina en 0 | `<temporizador-examen>`: al llegar a 00:00 el examen se envía automáticamente |
| Al finalizar: **% de respuestas acertadas** y mensaje de **aprobación / no aprobación** | Pantalla de resultado con anillo animado, mensaje y detalle |
| Estructura de datos en **JSON** con **localStorage** | 5 colecciones JSON (ver [Modelo de datos](#-modelo-de-datos)) |
| Módulos privados visibles **solo con sesión** | Guardia del enrutador + encabezado que solo muestra los enlaces privados con sesión |
| **UX**: agradable visualmente e intuitivo | Sistema de diseño propio, mensajes claros, estados vacíos, confirmaciones y notificaciones |
| **Diseño responsive y accesible** | Ver [Accesibilidad y diseño responsive](#-accesibilidad-y-diseño-responsive) |
| **Colores e identidad visual** coherentes | Tokens de diseño en `variables.css` (paleta índigo y ámbar) |
| **Animaciones y transiciones** | Entrada de vistas, tarjetas, diálogos, notificaciones, reloj, anillo y confeti. Respetan "reducir movimiento" |
| Interacción **fluida y sin bloqueos**, en especial con el tiempo | El reloj recalcula contra la hora de fin, no se desfasa y sobrevive a recargas |
| **Web Components** | 27 Custom Elements; 9 de ellos con Shadow DOM. Galería interactiva en `#/componentes` (ver [Web Components](#-web-components)) |
| Archivos **modularizados** y **README.md** | 48 módulos JS y 15 hojas CSS organizadas por capas |

---

## ⭐ Extras implementados

| Extra | Dónde |
|-------|-------|
| **Galería interactiva de Web Components** con registro de eventos en vivo | `#/componentes` (enlace en el pie de página) |
| **Panel de resultados** con estadísticas, filtros y detalle de respuestas por estudiante | `#/admin/resultados` |
| **Modo oscuro** (sigue la preferencia del sistema operativo y recuerda la elección) | Botón 🌙/☀️ del encabezado |
| **Buscador** en las tablas y en el catálogo (sin importar mayúsculas ni tildes) | Usuarios, exámenes, resultados y catálogo |
| **Exportar / importar respaldo en JSON** y restablecer la demostración | `#/admin/respaldo` |
| **Orden aleatorio** de preguntas y respuestas por examen (anti-copia) | Interruptor en el formulario del examen |
| Contraseñas **cifradas** con SHA-256 + sal (Web Crypto API) | `utilidades/cifrado.js` |
| **Sesión con expiración** (8 h) sincronizada entre pestañas | `servicio-autenticacion.js` |
| Examen **reanudable**: recargar no reinicia el reloj ni borra las respuestas | `servicio-intentos.js` |
| **Mapa de preguntas** y progreso durante el examen | Barra fija de `<vista-examen>` |
| Reordenar preguntas (↑ ↓) | Vista de preguntas |

---

## ▶️ Cómo ejecutar el proyecto

El proyecto usa módulos de JavaScript (`<script type="module">`). Estos **no funcionan** si abres `index.html` con doble clic (`file://`), así que necesitas un servidor local:

1. Abre la carpeta del proyecto en **Visual Studio Code**.
2. Instala la extensión **Live Server**.
3. Haz clic derecho sobre `index.html` → **Open with Live Server**.

> Live Server abre la app en `http://127.0.0.1:5500`, que el navegador trata como un origen seguro. Esto es necesario para cifrar las contraseñas con la Web Crypto API. Si se abre con doble clic, la página muestra un aviso con estas instrucciones.

---

## 🔑 Usuarios de prueba

La primera vez que se abre la aplicación se crean estos usuarios. El login también tiene botones para autocompletarlos.

| Cargo | Correo | Contraseña |
|-------|--------|------------|
| Administrativo | `admin@acmeschool.edu` | `Admin123*` |
| Docente | `docente@acmeschool.edu` | `Docente123*` |

También se crean 4 exámenes de ejemplo:

| Código | Examen | Tiempo | Preguntas | Para qué sirve |
|--------|--------|:------:|:---------:|----------------|
| `CG-001` | Cultura general | 5 min | 5 | Examen normal (una sola respuesta correcta por pregunta) |
| `JS-101` | Fundamentos de JavaScript | 10 min | 6 | Examen normal con **orden aleatorio** |
| `REL-01` | Reto relámpago | **1 min** | 3 | Ver cómo el reloj llega a 0 y el examen **se envía solo** |
| `MAT-201` | Álgebra básica | 20 min | 0 | Mostrar que un examen sin preguntas **no aparece** en el catálogo |

> Para volver a los datos de ejemplo: **Respaldo → Restablecer datos**, o en DevTools (F12) → Application → Local Storage → **Clear** y recargar.

---

## 🧭 Guía rápida: flujo completo

1. **Crear el examen:** inicia sesión → **Exámenes** → completa el formulario (código, título, tiempo, % de aprobación, descripción) → **Crear examen**.
2. **Agregar preguntas:** en la tabla, botón de lista (☰✓) del examen → escribe el enunciado y las respuestas, **toca la letra de la correcta** → **Agregar pregunta**. Con la primera pregunta el examen aparece en el catálogo.
3. **Presentar el examen** (sin sesión): cierra sesión → enlace **Presentar examen** del encabezado → botón **Presentar examen** de la tarjeta → escribe identificación y nombre → **Comenzar examen**.
4. **Responder:** elige una respuesta por pregunta mientras corre el reloj. Puedes recargar la página: nada se pierde.
5. **Terminar:** botón **Terminar examen** (o espera a que el reloj llegue a 0) → verás el **porcentaje de aciertos** y si **aprobaste**.
6. **Consultar:** inicia sesión → **Resultados** para ver el historial, las estadísticas y el detalle de cada intento.

---

## 🧰 Tecnologías

- **HTML5** semántico y accesible.
- **CSS3**: variables (tokens de diseño), Grid, Flexbox, container queries, `:has()`, animaciones, tema oscuro y diseño responsive.
- **JavaScript (ES Modules)** sin frameworks ni librerías externas.
- **Web Components**: Custom Elements, Shadow DOM, `<template>`, `<slot>`, atributos observados y eventos personalizados.
- **Web APIs:**
  - `localStorage` y `sessionStorage`;
  - Web Crypto (`crypto.subtle`, `getRandomValues`);
  - `<dialog>`;
  - `Blob` / `File` (respaldo);
  - `Intl` (fechas y porcentajes);
  - `requestAnimationFrame`;
  - `matchMedia`.

---

## 🏛️ Arquitectura

```text
index.html
   └── main.js ── registra los Web Components, prepara los datos y arranca el enrutador
         │
         ├── enrutador.js ── lee el hash (#/ruta), aplica la guardia de sesión y pinta la vista
         │
         ├── componentes/ ── Web Components (vistas, formularios, tablas, widgets)
         │        │  se comunican con eventos personalizados (guardar-usuario, buscar, tiempo-agotado…)
         │        ▼
         ├── servicios/ ──── reglas de negocio (validación, unicidad, calificación, sesión)
         │        ▼
         ├── coleccion.js ── CRUD genérico (id, creadoEn, actualizadoEn)
         │        ▼
         └── almacenamiento.js ── ÚNICO módulo que usa localStorage (JSON.stringify / JSON.parse)
```

- **Vistas orquestadoras:** cada módulo tiene una vista (`<vista-usuarios>`) que compone componentes de presentación (`<formulario-usuario>`, `<tabla-usuarios>`, `<campo-busqueda>`). Los componentes **no guardan datos**: emiten eventos y la vista llama al servicio.
- **Validación en dos capas:** los formularios validan antes de enviar con el **mismo esquema** que usa el servicio, y el servicio vuelve a validar y comprueba la unicidad.
- **Seguridad:**
  - todo texto escrito por el usuario se inserta con `escaparHTML()` o `textContent`, para evitar XSS;
  - las contraseñas nunca se guardan ni se exportan en texto plano.

---

## 📁 Estructura del proyecto

```text
├── index.html              # Estructura de la aplicación (encabezado, contenido, pie)
├── README.md
├── assets/img/logo.svg     # Logo y favicon
├── css/
│   ├── estilos.css         # Punto de entrada: importa todas las capas
│   ├── variables.css       # Tokens de diseño y tema oscuro
│   ├── base.css            # Reset, estilos base y utilidades de accesibilidad
│   ├── layout.css          # Contenedor, encabezado, navegación, pie y rejillas
│   ├── componentes.css     # Botones, tarjetas, formularios, tablas, insignias, alertas, diálogos
│   ├── animaciones.css     # Keyframes y soporte de movimiento reducido
│   └── vistas/             # Estilos de cada pantalla
│       ├── generales.css   ├── login.css      ├── admin.css      ├── preguntas.css
│       ├── catalogo.css    ├── examen.css     ├── resultados.css ├── respaldo.css
│       └── galeria.css     # Galería de Web Components
└── js/
    ├── main.js             # Punto de entrada
    ├── enrutador.js        # SPA por hash: rutas, parámetros, guardia, foco y títulos
    ├── config/
    │   ├── constantes.js   # Claves de localStorage, cargos, temas, límites de cada campo
    │   └── rutas.js        # Tabla de rutas: ruta → Web Component
    ├── datos/
    │   └── datos-iniciales.js       # Usuarios y exámenes de ejemplo
    ├── servicios/
    │   ├── almacenamiento.js        # Lectura/escritura JSON en localStorage
    │   ├── coleccion.js             # CRUD genérico reutilizable
    │   ├── servicio-autenticacion.js  # Login, logout, sesión con expiración
    │   ├── servicio-usuarios.js     # Usuarios: validación, únicos, cifrado
    │   ├── servicio-examenes.js     # Exámenes y preguntas (una sola correcta)
    │   ├── servicio-intentos.js     # Examen en curso, calificación e historial
    │   ├── servicio-respaldo.js     # Exportar / importar / restablecer
    │   └── servicio-tema.js         # Modo claro / oscuro
    ├── utilidades/
    │   ├── aleatorio.js    # Fisher-Yates      ├── cifrado.js      # SHA-256 + sal
    │   ├── dom.js          # escaparHTML()     ├── formato.js      # Reloj, %, fechas, plurales
    │   ├── formularios.js  # Errores accesibles├── generador-id.js # UUID v4
    │   ├── iconos.js       # Íconos SVG        └── validaciones.js # Reglas reutilizables
    └── componentes/
        ├── compartidos/    # encabezado-app, contenedor-notificaciones, dialogo-confirmacion,
        │                   # campo-busqueda, estado-vacio, tarjeta-estadistica
        ├── generales/      # vista-no-encontrada (404), vista-componentes (galería)
        ├── autenticacion/  # vista-login
        ├── usuarios/       # vista-usuarios, formulario-usuario, tabla-usuarios
        ├── examenes/       # vista-examenes, formulario-examen, tabla-examenes,
        │                   # vista-preguntas, formulario-pregunta, lista-preguntas
        ├── publico/        # vista-catalogo, tarjeta-examen, dialogo-estudiante,
        │                   # vista-examen, temporizador-examen, anillo-progreso
        ├── resultados/     # vista-resultados, tabla-resultados
        └── respaldo/       # vista-respaldo
```

---

## 💾 Modelo de datos

Toda la información se guarda en `localStorage` como **JSON**:

| Clave | Contenido |
|-------|-----------|
| `acme_usuarios` | Usuarios del área privada |
| `acme_examenes` | Exámenes, cada uno con sus preguntas y respuestas anidadas |
| `acme_intentos` | Resultados de los exámenes presentados (historial) |
| `acme_intento_activo` | Examen en curso (para retomarlo si se recarga la página) |
| `acme_sesion` | Usuario autenticado y fecha de expiración |
| `acme_tema` | Tema elegido: `"claro"` u `"oscuro"` |

### Usuario
```json
{
  "id": "3f2b8c1e-9a4d-4e6f-8b2a-1c5d7e9f0a3b",
  "identificacion": "1000000001",
  "nombreCompleto": "Administrador Acme",
  "email": "admin@acmeschool.edu",
  "telefono": "3001234567",
  "cargo": "administrativo",
  "salContrasena": "9c1f0e7a…",
  "hashContrasena": "b5d4a2e8…",
  "creadoEn": "2026-11-23T15:30:00.000Z",
  "actualizadoEn": "2026-11-23T15:30:00.000Z"
}
```
La contraseña se guarda como `hash = SHA-256(sal + contraseña)`, con una sal aleatoria por usuario. Al iniciar sesión se recalcula el hash y se compara.

### Examen (con preguntas y respuestas anidadas)
```json
{
  "id": "a71c2d9e-…",
  "codigo": "JS-101",
  "titulo": "Fundamentos de JavaScript",
  "tiempoMinutos": 10,
  "porcentajeAprobacion": 60,
  "descripcion": "Evalúa los conceptos básicos de JavaScript…",
  "mezclarPreguntas": true,
  "preguntas": [
    {
      "id": "5d0e8b3a-…",
      "enunciado": "¿Qué palabra clave declara una variable cuyo valor no se puede reasignar?",
      "respuestas": [
        { "id": "e1a0…", "descripcion": "var", "esCorrecta": false },
        { "id": "e2b1…", "descripcion": "let", "esCorrecta": false },
        { "id": "e3c2…", "descripcion": "const", "esCorrecta": true },
        { "id": "e4d3…", "descripcion": "static", "esCorrecta": false }
      ]
    }
  ],
  "creadoEn": "…",
  "actualizadoEn": "…"
}
```

### Examen en curso (`acme_intento_activo`)
```json
{
  "id": "…",
  "examenId": "…",
  "estudiante": { "identificacion": "1098765432", "nombreCompleto": "María Fernanda López" },
  "iniciadoEn": 1795437000000,
  "finalizaEn": 1795437600000,
  "ordenPreguntas": ["idPregunta3", "idPregunta1", "…"],
  "ordenRespuestas": { "idPregunta3": ["idRespuestaB", "idRespuestaD", "…"] },
  "selecciones": { "idPregunta3": "idRespuestaB" }
}
```

### Resultado (`acme_intentos`)
```json
{
  "id": "…",
  "examenId": "…",
  "examen": { "codigo": "CG-001", "titulo": "Cultura general", "tiempoMinutos": 5, "porcentajeAprobacion": 70 },
  "estudiante": { "identificacion": "1098765432", "nombreCompleto": "María Fernanda López" },
  "respuestas": [
    { "preguntaId": "…", "enunciado": "¿Cuál es la capital de Colombia?", "respuestaId": "…",
      "respuestaElegida": "Bogotá", "respuestaCorrecta": "Bogotá", "esCorrecta": true }
  ],
  "totalPreguntas": 5,
  "respuestasCorrectas": 4,
  "sinResponder": 0,
  "porcentajeObtenido": 80,
  "aprobado": true,
  "motivoFinalizacion": "estudiante",
  "iniciadoEn": "2026-11-24T15:00:00.000Z",
  "finalizadoEn": "2026-11-24T15:03:41.000Z",
  "duracionSegundos": 221
}
```
El resultado guarda una **copia** de los datos del examen y de cada respuesta. Así el historial sigue siendo válido aunque el examen se edite o elimine después.

---

## 🧩 Web Components

Cada pieza de la interfaz es un **Custom Element** (`class … extends HTMLElement` + `customElements.define`).

| Componente | Shadow DOM | Qué hace |
|------------|:----------:|----------|
| `<encabezado-app>` | No | Logo, navegación (con menú móvil), usuario, cerrar sesión y modo oscuro. Oculta la navegación durante un examen. |
| `<contenedor-notificaciones>` | Sí | Notificaciones de éxito, error, advertencia e información. Se cierran solas y se anuncian al lector de pantalla. `notificar(mensaje, opciones)` |
| `<dialogo-confirmacion>` | Sí | Confirmación accesible con `<dialog>`. `await confirmar({...})` devuelve `true` o `false`. |
| `<campo-busqueda>` | Sí | Buscador con *debounce*. Emite `buscar`. |
| `<estado-vacio>` | Sí | Mensaje para listas vacías. Atributos `icono`, `titulo`, `mensaje` y `<slot>` para acciones. |
| `<tarjeta-estadistica>` | Sí | Indicador numérico. Atributos `icono`, `titulo`, `valor`, `detalle`, `tono`. |
| `<tarjeta-examen>` | Sí | Tarjeta del catálogo. Recibe sus datos por **atributos observados**; emite `seleccionar-examen`. |
| `<dialogo-estudiante>` | Sí | Identificación del estudiante. `await pedirDatosEstudiante(examen)`. |
| `<temporizador-examen>` | Sí | Reloj en tiempo real. Atributos `finaliza-en` y `duracion`; emite `tiempo-agotado`. Se personaliza con variables CSS. |
| `<anillo-progreso>` | Sí | Porcentaje como anillo SVG animado. |
| Vistas, formularios, tablas y listas | No | `<vista-login>`, `<vista-usuarios>`, `<formulario-usuario>`, `<tabla-usuarios>`, `<vista-examenes>`, `<formulario-examen>`, `<tabla-examenes>`, `<vista-preguntas>`, `<formulario-pregunta>`, `<lista-preguntas>`, `<vista-catalogo>`, `<vista-examen>`, `<vista-resultados>`, `<tabla-resultados>`, `<vista-respaldo>`, `<vista-no-encontrada>`, `<vista-componentes>` |

### 🎁 Galería interactiva (`#/componentes`)

Se abre desde el enlace **Galería de Web Components** del pie de página, sin necesidad de iniciar sesión. Allí cada componente reutilizable funciona en vivo:

- `<tarjeta-examen>`: controles que cambian sus **atributos** (`titulo`, `tiempo`, `porcentaje`, `aleatorio`). El componente se actualiza solo gracias a `observedAttributes` + `attributeChangedCallback`.
- `<temporizador-examen>`: botones para iniciar un reloj de 15 s o de 1:15. Cambia de color y emite `tiempo-agotado`.
- `<anillo-progreso>`: un control deslizante cambia su `valor` y su `estado`.
- `<tarjeta-estadistica>`, `<campo-busqueda>` y `<estado-vacio>` (con contenido insertado por `<slot>`).
- `<contenedor-notificaciones>`, `<dialogo-confirmacion>` y `<dialogo-estudiante>`, que devuelven promesas.
- Un **registro de eventos** muestra cada `CustomEvent` que emiten los componentes, con su `detail`.
- Una **tabla con los 27 Custom Elements**: si usan Shadow DOM y en qué archivo están.

> Para ver el encapsulamiento: DevTools → **Elements** → expande, por ejemplo, `<tarjeta-examen>` y aparecerá `#shadow-root (open)`.

**¿Por qué algunos usan Shadow DOM y otros no?**

- **Con Shadow DOM:** los widgets autónomos encapsulan sus estilos.
  - Toman los colores de las variables CSS globales, que sí atraviesan el Shadow DOM.
  - Reutilizan `componentes.css` mediante `<link>`.
- **Sin Shadow DOM (light DOM):** las vistas y los formularios usan directamente el sistema de diseño global. Así los estilos de formularios y tablas no se duplican.

---

## 🧭 Rutas

SPA con un solo `index.html`: el enrutador cambia la vista según el *hash* de la URL.

| Ruta | Vista | Acceso |
|------|-------|--------|
| `#/` | Redirige al login (vista inicial) | — |
| `#/login` | Inicio de sesión | Público (con sesión redirige al área privada) |
| `#/examenes` | Catálogo de exámenes disponibles | Público |
| `#/examen/:id` | Presentar un examen y ver el resultado | Público |
| `#/componentes` | Galería interactiva de Web Components | Público |
| `#/admin/examenes` | Gestión de exámenes | Privado |
| `#/admin/examenes/:id/preguntas` | Preguntas de un examen | Privado |
| `#/admin/usuarios` | Gestión de usuarios | Privado |
| `#/admin/resultados` | Panel de resultados | Privado |
| `#/admin/respaldo` | Exportar / importar datos | Privado |

Cualquier otra ruta muestra la página 404.

---

## 🔎 Módulos en detalle

### 🔐 Autenticación (`#/login`)
- Valida en el navegador y luego compara el *hash* de la contraseña.
- Si falla, muestra un mensaje genérico ("Correo o contraseña incorrectos"), para no revelar qué correos existen.
- **Guardia de rutas:** sin sesión, las rutas privadas envían al login y se recuerda la ruta pedida.
- **Sesión** (`acme_sesion`):
  - guarda solo datos básicos, nunca la contraseña;
  - **expira a las 8 horas**, y la app lo revisa cada 30 s;
  - se **sincroniza entre pestañas** (evento `storage`).

### 👥 Gestión de usuarios (`#/admin/usuarios`)
| Campo | Reglas |
|-------|--------|
| Número de identificación | Obligatorio, solo dígitos (5 a 15), **único** |
| Nombre completo | Obligatorio, 3 a 80 caracteres, solo letras y espacios |
| Email | Obligatorio, formato válido, **único** (sin distinguir mayúsculas) |
| Teléfono | Obligatorio, solo dígitos (7 a 15) |
| Cargo | *Administrativo* o *Docente* |
| Contraseña | Al crear: obligatoria, mínimo 8 caracteres con letras y números. Al editar: vacía = se conserva |

- Eliminar pide confirmación.
- **No se puede eliminar la propia cuenta** de la sesión, que aparece marcada con "Tú".
- Si un usuario se edita a sí mismo, el encabezado se actualiza al instante.

### 📝 Gestión de exámenes (`#/admin/examenes`)
| Campo | Reglas |
|-------|--------|
| Código | 2 a 15 caracteres (letras, números, guiones), **único**, se guarda en mayúsculas |
| Título | 3 a 100 caracteres |
| Tiempo | Minutos enteros entre 1 y 300 |
| Porcentaje de aprobación | Entero entre 1 y 100 |
| Descripción | 10 a 500 caracteres (con contador) |
| Mezclar preguntas y respuestas | Interruptor opcional |

- La tabla avisa qué exámenes **no tienen preguntas**, porque no aparecen en el catálogo.
- Editar los datos generales conserva las preguntas.

### ❓ Preguntas y respuestas (`#/admin/examenes/:id/preguntas`)
- Enunciado + **2 a 6 respuestas** dinámicas. La correcta se marca tocando su letra: son botones `radio`, así que solo puede haber **una**.
- No se permiten respuestas repetidas (sin importar mayúsculas ni tildes).
- Se pueden reordenar las preguntas con ↑ ↓.
- La respuesta correcta se indica con color **y** con texto ("Correcta").

### 🎓 Catálogo e identificación (`#/examenes`)
- Muestra solo los exámenes con preguntas, con **título, tiempo y % para aprobar**, y tiene buscador.
- Antes de empezar se piden **identificación y nombre completo**, y se muestran las instrucciones.
- Solo hay **un examen en curso por navegador**. Si existe, el catálogo muestra un aviso con el botón **Continuar examen**.

### ⏱️ Presentación del examen (`#/examen/:id`)
- **Encabezado** con título, total de preguntas y % para aprobar.
- **Barra fija** con el reloj y el progreso: "Respondidas 3 de 6" y un mapa de preguntas.
- **Reloj:**
  - empieza en los minutos del examen y baja hasta 00:00;
  - pasa a ámbar al quedar el 25 % del tiempo y a rojo, con latido, en el último minuto;
  - el lector de pantalla avisa cuando quedan 5 min, 1 min y 10 s.
- **Manejo del tiempo sin bloqueos:**
  - el reloj recalcula `finalizaEn − Date.now()` en cada actualización, en vez de descontar segundos, así que nunca se desfasa;
  - recargar no reinicia nada;
  - al llegar a 0 el examen se **envía automáticamente**;
  - si el estudiante cerró la página, se califica al volver a abrir la app.
- **Calificación:**
  - `% = correctas / total × 100`; las preguntas sin responder cuentan como incorrectas;
  - **aprueba si el % es mayor o igual** al del examen;
  - se compara con enteros (`correctas × 100 ≥ % × total`), porque en JavaScript `29 / 50 * 100 = 57.99999999999999`.

### 📊 Panel de resultados (`#/admin/resultados`) — extra
- **Estadísticas:** intentos, aprobados (% de aprobación), promedio de aciertos y estudiantes distintos. Se recalculan con los filtros.
- **Filtros:** búsqueda libre, examen y estado (aprobado / no aprobado).
- **Detalle de cada intento:**
  - para cada pregunta, la respuesta elegida, si fue correcta y cuál era la correcta;
  - si terminó por tiempo agotado;
  - el foco vuelve al botón que abrió el detalle.
- Se pueden eliminar resultados, con confirmación.

### 💾 Respaldo (`#/admin/respaldo`) — extra
- **Exportar:** descarga `acme-school-respaldo-AAAA-MM-DD.json` con usuarios, exámenes y resultados. Las contraseñas van cifradas.
- **Importar:**
  - se elige o se arrastra un archivo;
  - se **valida** su estructura: usuarios completos, códigos y correos únicos, una sola correcta por pregunta, etc.;
  - se muestra una **vista previa** antes de reemplazar;
  - si algo falla a mitad de camino, se restauran los datos anteriores;
  - si el usuario de la sesión ya no existe en los datos nuevos, la sesión se cierra.
- **Restablecer demostración:** vuelve a los datos de ejemplo.

---

## ♿ Accesibilidad y diseño responsive

- **Contraste WCAG AA (≥ 4.5:1)** de todos los colores de texto, en tema claro y oscuro. Se verificó calculando cada combinación.
- **Teclado:**
  - foco visible en todos los controles;
  - enlace "Saltar al contenido";
  - diálogos nativos `<dialog>`: atrapan el foco y se cierran con Esc;
  - al cambiar de vista, el foco pasa al título.
- **Lectores de pantalla:**
  - etiquetas en todos los campos y errores asociados con `aria-describedby` / `aria-invalid`;
  - `aria-current` en la navegación;
  - `role="timer"` y avisos `aria-live` en el reloj y en las notificaciones;
  - tablas con `<caption>` y `scope`;
  - botones de solo ícono con `aria-label`.
- **No depender solo del color:** estados con texto e ícono ("Correcta", "Aprobado", "Tiempo agotado").
- **Movimiento reducido:** las animaciones se desactivan si el sistema lo pide (`prefers-reduced-motion`).
- **Responsive:**
  - diseño *mobile-first* con Grid, Flexbox y container queries;
  - las tablas se transforman en tarjetas en el celular;
  - el menú de navegación se agrupa en ☰;
  - el reloj y el mapa de preguntas se compactan;
  - se verificó que ninguna vista tenga scroll horizontal a 390 px y a 768 px;
  - áreas táctiles de 40–44 px.

---

## 🎨 Identidad visual

| Rol | Color | Uso |
|-----|-------|-----|
| Primario | `#4F46E5` (índigo) | Botones principales, enlaces, foco |
| Acento | `#F59E0B` (ámbar) | Temporizador, elementos destacados |
| Fondo | `#F8FAFC` / `#0B1120` | Fondo general (claro / oscuro) |
| Texto | `#0F172A` / `#E2E8F0` | Texto principal (claro / oscuro) |
| Éxito | `#047857` / `#10B981` | Aprobado, confirmaciones |
| Peligro | `#DC2626` | Eliminar, errores, no aprobado |

- **Tipografías:** *Plus Jakarta Sans* para títulos e *Inter* para textos.
- **Tema oscuro:** atributo `data-tema="oscuro"` en `<html>`. Un script en línea lo aplica antes de pintar la página, para evitar parpadeos.

---

## 🗂️ Desarrollo por partes

El proyecto se construyó de forma incremental, una parte por commit:

| Parte | Contenido |
|:-----:|-----------|
| 1 | Estructura base e identidad visual (sistema de diseño, tema claro/oscuro) |
| 2 | Modelo de datos en JSON, persistencia con `localStorage` y datos iniciales |
| 3 | Enrutador SPA y Web Components compartidos (encabezado, notificaciones, diálogos, modo oscuro) |
| 4 | Login y protección de las rutas privadas |
| 5 | Gestión de usuarios |
| 6 | Gestión de exámenes con opción de orden aleatorio |
| 7 | Preguntas y respuestas de cada examen |
| 8 | Módulo público: catálogo e identificación del estudiante |
| 9 | Presentación del examen con temporizador en tiempo real y resultado |
| 10 | Panel de resultados, respaldo JSON, revisión de accesibilidad y documentación final |
| + | Ajustes para la sustentación: login como vista inicial, examen de 1 minuto y galería de Web Components |

---

## 👤 Autor

**Andrés Felipe Vásquez Velasco** · Campuslands · Skill JavaScript
