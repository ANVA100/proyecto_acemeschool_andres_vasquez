# Acme School · Plataforma de exámenes

Plataforma web para que la escuela **Acme School** cree, administre y aplique exámenes en línea.

- **Área privada** (requiere iniciar sesión): el personal administrativo y docente gestiona usuarios, exámenes y preguntas.
- **Módulo público**: los estudiantes eligen un examen, se identifican y lo presentan con un reloj en tiempo real. Al terminar ven su porcentaje de aciertos y si aprobaron.

> 🚧 **Proyecto en construcción** · Avance actual: **Parte 5 de 10**

---

## 🗺️ Hoja de ruta

| Parte | Contenido | Estado |
|:-----:|-----------|:------:|
| 1 | Estructura base e identidad visual (sistema de diseño, tema claro/oscuro) | ✅ |
| 2 | Modelo de datos en JSON, persistencia con `localStorage` y datos iniciales | ✅ |
| 3 | Enrutador SPA y Web Components compartidos (encabezado, notificaciones, diálogos, modo oscuro) | ✅ |
| 4 | Login y protección de las rutas privadas | ✅ |
| 5 | Gestión de usuarios (crear, listar, actualizar, eliminar) | ✅ |
| 6 | Gestión de exámenes (crear, listar, actualizar, eliminar) con opción de orden aleatorio | ⏳ |
| 7 | Preguntas y respuestas de cada examen | ⏳ |
| 8 | Módulo público: catálogo de exámenes e identificación del estudiante | ⏳ |
| 9 | Presentación del examen con temporizador en tiempo real, preguntas en orden aleatorio y resultado | ⏳ |
| 10 | Panel de resultados, respaldo JSON (exportar/importar) y documentación final | ⏳ |

---

## 🧰 Tecnologías

- **HTML5** semántico y accesible.
- **CSS3**: variables (tokens de diseño), Grid, Flexbox, container queries, animaciones y diseño responsive.
- **JavaScript (ES Modules)** sin frameworks ni librerías externas.
- **Web Components**: Custom Elements, Shadow DOM y eventos personalizados.
- **localStorage** para guardar la información en formato JSON.

---

## ▶️ Cómo ejecutar el proyecto

El proyecto usa módulos de JavaScript (`<script type="module">`). Estos módulos **no funcionan** si abres `index.html` con doble clic (`file://`), así que necesitas un servidor local:

1. Abre la carpeta del proyecto en **Visual Studio Code**.
2. Instala la extensión **Live Server**.
3. Haz clic derecho sobre `index.html` → **Open with Live Server**.

> Live Server abre la app en `http://127.0.0.1:5500`, que el navegador trata como un origen seguro. Esto es necesario para cifrar las contraseñas con la Web Crypto API.

---

## 🔑 Usuarios de prueba

La primera vez que se abre la aplicación se crean estos usuarios para poder entrar al área privada:

| Cargo | Correo | Contraseña |
|-------|--------|------------|
| Administrativo | `admin@acmeschool.edu` | `Admin123*` |
| Docente | `docente@acmeschool.edu` | `Docente123*` |

También se crean 3 exámenes de ejemplo: *Fundamentos de JavaScript* y *Cultura general* (con preguntas) y *Álgebra básica* (sin preguntas, para mostrar que no aparece en el catálogo público).

> Para volver a los datos de ejemplo: DevTools (F12) → **Application** → **Local Storage** → clic derecho sobre el origen → **Clear**, y recarga la página.

---

## 📁 Estructura del proyecto

```text
├── index.html              # Página principal (estructura de la aplicación)
├── README.md
├── assets/
│   └── img/
│       └── logo.svg        # Logo y favicon
├── css/
│   ├── estilos.css         # Punto de entrada: importa todas las capas
│   ├── variables.css       # Tokens de diseño (colores, tipografía, espacios) y tema oscuro
│   ├── base.css            # Reset, estilos base y utilidades de accesibilidad
│   ├── layout.css          # Contenedor, encabezado, pie de página y rejillas
│   ├── componentes.css     # Botones, tarjetas, formularios, tablas, insignias, alertas, diálogos
│   ├── animaciones.css     # Keyframes y soporte de movimiento reducido
│   └── vistas/
│       ├── generales.css   # Carga inicial, página 404 y vista "en construcción"
│       ├── login.css       # Vista de inicio de sesión
│       └── admin.css       # Estructura común de los módulos privados (formulario + tabla)
└── js/
    ├── main.js             # Punto de entrada: registra componentes, prepara datos y arranca el enrutador
    ├── enrutador.js        # Navegación SPA por hash (#/ruta), parámetros y guardias
    ├── config/
    │   ├── constantes.js   # Claves de localStorage, temas, cargos y límites de cada campo
    │   └── rutas.js        # Tabla de rutas: ruta → Web Component
    ├── datos/
    │   └── datos-iniciales.js  # Usuarios y exámenes de ejemplo (primer uso)
    ├── servicios/
    │   ├── almacenamiento.js   # Único módulo que lee/escribe localStorage (JSON)
    │   ├── coleccion.js        # CRUD genérico reutilizable (crear, leer, actualizar, eliminar)
    │   ├── servicio-autenticacion.js  # Login, logout, sesión con expiración y ruta pendiente
    │   ├── servicio-tema.js    # Modo claro / oscuro
    │   └── servicio-usuarios.js       # Reglas de negocio de usuarios (validación, únicos, cifrado)
    ├── utilidades/
    │   ├── cifrado.js          # Hash SHA-256 + sal para las contraseñas (Web Crypto API)
    │   ├── dom.js              # escaparHTML(): evita inyección de código (XSS)
    │   ├── formato.js          # Iniciales, primer nombre...
    │   ├── formularios.js      # Leer formularios, mostrar errores accesibles, mostrar contraseña
    │   ├── generador-id.js     # Identificadores únicos (UUID v4)
    │   ├── iconos.js           # Íconos SVG en línea
    │   └── validaciones.js     # Reglas reutilizables (requerido, email, longitud, rangos...)
    └── componentes/
        ├── autenticacion/
        │   └── vista-login.js
        ├── usuarios/
        │   ├── vista-usuarios.js       # Orquesta formulario + tabla + buscador
        │   ├── formulario-usuario.js   # Crear / editar (emite "guardar-usuario")
        │   └── tabla-usuarios.js       # Lista (emite "editar-usuario" / "eliminar-usuario")
        ├── compartidos/        # Web Components reutilizables en toda la app
        │   ├── encabezado-app.js
        │   ├── contenedor-notificaciones.js
        │   ├── dialogo-confirmacion.js
        │   ├── campo-busqueda.js
        │   └── estado-vacio.js
        └── generales/
            ├── vista-no-encontrada.js
            └── vista-en-construccion.js
```

---

## 🧩 Web Components

Cada pieza de la interfaz es un **Custom Element** (`class ... extends HTMLElement` + `customElements.define`).

| Componente | Shadow DOM | Qué hace |
|------------|:----------:|----------|
| `<encabezado-app>` | No | Logo, navegación (con menú móvil) y botón de modo oscuro. Marca la sección actual y oculta la navegación mientras se presenta un examen. |
| `<contenedor-notificaciones>` | Sí | Mensajes emergentes de éxito, error, advertencia e información. Se cierran solos y los anuncia el lector de pantalla. |
| `<dialogo-confirmacion>` | Sí | Confirmación accesible basada en `<dialog>`. `await confirmar({...})` devuelve `true` o `false`. |
| `<campo-busqueda>` | Sí | Buscador para las tablas. Emite el evento `buscar` con *debounce* (espera a que el usuario deje de escribir). |
| `<estado-vacio>` | Sí | Mensaje amigable cuando una lista está vacía. Tiene atributos `icono`, `titulo` y `mensaje`, y un `<slot>` para acciones. |
| `<vista-no-encontrada>` | No | Página 404. |
| `<vista-en-construccion>` | No | Se muestra mientras la vista de una ruta todavía no existe. |

**¿Por qué algunos usan Shadow DOM y otros no?**

- **Con Shadow DOM:** los componentes pequeños y autónomos encapsulan sus estilos. Así no afectan ni se ven afectados por el resto de la página. Toman los colores de las variables CSS globales, que sí atraviesan el Shadow DOM, y reutilizan `componentes.css` mediante `<link>`.
- **Sin Shadow DOM (light DOM):** las vistas y el encabezado usan directamente el sistema de diseño global.

---

## 🧭 Rutas

La aplicación es una **SPA**: un solo `index.html`, y el enrutador cambia la vista según el *hash* de la URL.

| Ruta | Vista | Acceso |
|------|-------|--------|
| `#/` | Catálogo de exámenes disponibles | Público |
| `#/login` | Inicio de sesión | Público |
| `#/examen/:id` | Presentar un examen | Público |
| `#/admin/examenes` | Gestión de exámenes | Privado |
| `#/admin/examenes/:id/preguntas` | Preguntas de un examen | Privado |
| `#/admin/usuarios` | Gestión de usuarios | Privado |
| `#/admin/resultados` | Panel de resultados | Privado |
| `#/admin/respaldo` | Exportar / importar datos | Privado |

Cualquier otra ruta muestra la página 404.

---

## 🔐 Autenticación

- **Login** (`#/login`) con correo y contraseña. Primero se valida en el navegador (campos obligatorios y formato del correo). Luego se compara el *hash* de la contraseña escrita con el guardado.
- Si las credenciales no coinciden, el mensaje es genérico ("Correo o contraseña incorrectos"), para no revelar qué correos existen.
- **Guardia de rutas**: antes de mostrar una vista privada, el enrutador comprueba la sesión.
  - **Sin sesión:** envía al login y recuerda la ruta que se quería abrir. Después de iniciar sesión, lleva allí.
  - **Con sesión:** al visitar `#/login` envía directamente al área administrativa.
- **Sesión** (`acme_sesion`): guarda solo los datos básicos del usuario (nunca la contraseña) y **expira a las 8 horas**.
  - La app revisa cada 30 segundos si expiró y, en ese caso, avisa y vuelve al login.
  - Si se inicia o cierra sesión en otra pestaña, todas se sincronizan (evento `storage`).
- **Encabezado**: con sesión muestra los módulos privados, el avatar con el nombre y cargo del usuario y el botón **Cerrar sesión**.

---

## 👥 Gestión de usuarios (`#/admin/usuarios`)

La vista tiene un **formulario** (crear / actualizar), una **tabla** con los usuarios registrados y **botones para editar y eliminar** cada registro.

| Campo | Reglas |
|-------|--------|
| Número de identificación | Obligatorio, solo dígitos (5 a 15), **único** |
| Nombre completo | Obligatorio, 3 a 80 caracteres, solo letras y espacios |
| Email | Obligatorio, formato válido, **único** (sin distinguir mayúsculas) |
| Teléfono | Obligatorio, solo dígitos (7 a 15) |
| Cargo | Obligatorio: *Administrativo* o *Docente* |
| Contraseña | Al crear: obligatoria, mínimo 8 caracteres con letras y números. Al editar: si se deja vacía, se conserva la actual |

- **Arquitectura por eventos**: `<formulario-usuario>` y `<tabla-usuarios>` no guardan nada. Emiten eventos (`guardar-usuario`, `editar-usuario`, `eliminar-usuario`) y `<vista-usuarios>` los conecta con el servicio.
- **Validación en dos capas**: el formulario valida antes de enviar. El servicio vuelve a validar y además comprueba que la identificación y el correo no estén repetidos.
- **Eliminar** pide confirmación con `<dialogo-confirmacion>`. **No se puede eliminar la propia cuenta** con la que se inició sesión (marcada con "Tú").
- Si el usuario se edita a sí mismo, el encabezado se actualiza al instante.
- **Buscador**: filtra por nombre, correo, identificación, teléfono o cargo, sin importar mayúsculas ni tildes ("gomez" encuentra "Gómez").
- En el celular la tabla se transforma en tarjetas.

---

## 💾 Modelo de datos

Toda la información se guarda en `localStorage` como texto **JSON**. Cada colección tiene su propia clave:

| Clave | Contenido | Se usa desde |
|-------|-----------|:------------:|
| `acme_usuarios` | Arreglo de usuarios del área privada | Parte 2 |
| `acme_examenes` | Arreglo de exámenes, cada uno con sus preguntas y respuestas | Parte 2 |
| `acme_intentos` | Arreglo de exámenes presentados por los estudiantes | Parte 2 (vacío) |
| `acme_tema` | Tema elegido: `"claro"` u `"oscuro"` | Parte 3 |
| `acme_sesion` | Usuario autenticado y fecha de expiración de la sesión | Parte 4 |
| `acme_intento_activo` | Examen en curso, para retomarlo si se recarga la página | Parte 8 |

### Capas de acceso a datos

```text
Componentes (vistas)  →  Servicios (reglas de negocio)  →  coleccion.js (CRUD)  →  almacenamiento.js  →  localStorage
```

- **`almacenamiento.js`** es el único archivo que usa `localStorage`. Convierte los datos con `JSON.stringify()` al guardar y con `JSON.parse()` al leer.
- **`coleccion.js`** ofrece el CRUD genérico y agrega automáticamente `id`, `creadoEn` y `actualizadoEn` a cada registro.

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

- `cargo` puede ser `"administrativo"` o `"docente"`.
- **Las contraseñas no se guardan en texto plano**: se guarda una *sal* aleatoria por usuario y el *hash* SHA-256 de `sal + contraseña`, calculado con la Web Crypto API. Al iniciar sesión se recalcula el hash y se compara.

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
  "creadoEn": "2026-11-23T15:30:00.000Z",
  "actualizadoEn": "2026-11-23T15:30:00.000Z"
}
```

- Las preguntas se guardan **dentro** de su examen, así un examen se obtiene completo con una sola lectura.
- Cada pregunta tiene entre **2 y 6 respuestas** y **solo una** con `"esCorrecta": true`.
- Un examen **sin preguntas** no aparece en el catálogo público.
- Si `mezclarPreguntas` es `true`, cada estudiante ve las preguntas y las respuestas en un orden aleatorio distinto.

---

## 🎨 Identidad visual

| Rol | Color | Uso |
|-----|-------|-----|
| Primario | `#4F46E5` (índigo) | Botones principales, enlaces, foco |
| Acento | `#F59E0B` (ámbar) | Temporizador, elementos destacados |
| Fondo | `#F8FAFC` | Fondo general (tema claro) |
| Texto | `#0F172A` | Texto principal (tema claro) |
| Éxito | `#047857` / `#10B981` | Examen aprobado, confirmaciones |
| Peligro | `#DC2626` | Eliminar, errores, examen no aprobado |

- **Tipografías:** *Plus Jakarta Sans* para títulos e *Inter* para textos.
- **Tema oscuro:** se activa con el atributo `data-tema="oscuro"` en `<html>`. Si el usuario no ha elegido un tema, se respeta la preferencia de su sistema operativo.
- **Accesibilidad:** todos los colores de texto cumplen el contraste mínimo **WCAG AA (4.5:1)** en ambos temas. Además hay foco visible para teclado, enlace "Saltar al contenido" y soporte para "reducir movimiento".

---

## 👤 Autor

**Andrés Felipe Vásquez Velasco** · Campuslands · Skill JavaScript
