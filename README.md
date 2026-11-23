# Acme School · Plataforma de exámenes

Plataforma web para que la escuela **Acme School** cree, administre y aplique exámenes en línea.

- **Área privada** (requiere iniciar sesión): el personal administrativo y docente gestiona usuarios, exámenes y preguntas.
- **Módulo público**: los estudiantes eligen un examen, se identifican y lo presentan con un reloj en tiempo real. Al terminar ven su porcentaje de aciertos y si aprobaron.

> 🚧 **Proyecto en construcción** · Avance actual: **Parte 1 de 10**

---

## 🗺️ Hoja de ruta

| Parte | Contenido | Estado |
|:-----:|-----------|:------:|
| 1 | Estructura base e identidad visual (sistema de diseño, tema claro/oscuro) | ✅ |
| 2 | Modelo de datos en JSON, persistencia con `localStorage` y datos iniciales | ⏳ |
| 3 | Enrutador SPA y Web Components compartidos (encabezado, notificaciones, diálogos, modo oscuro) | ⏳ |
| 4 | Login y protección de las rutas privadas | ⏳ |
| 5 | Gestión de usuarios (crear, listar, actualizar, eliminar) | ⏳ |
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
│   └── animaciones.css     # Keyframes y soporte de movimiento reducido
└── js/
    └── main.js             # Punto de entrada de JavaScript
```

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
