/**
 * <vista-respaldo> · Exportar / importar datos en JSON (privado, extra)
 * ---------------------------------------------------------------------------
 * 1. Exportar: descarga un archivo .json con usuarios, exámenes y resultados.
 * 2. Importar: se elige o se arrastra un archivo; se valida y se muestra una
 *    vista previa. Solo al confirmar se reemplazan los datos actuales.
 * 3. Restablecer: vuelve a los datos de demostración.
 *
 * Tras importar o restablecer, si el usuario de la sesión ya no existe en los
 * datos nuevos, la sesión se cierra y se envía al login.
 */
import { navegar, obtenerRutaActual } from '../../enrutador.js';
import { estaAutenticado, sincronizarSesion } from '../../servicios/servicio-autenticacion.js';
import {
  crearRespaldo,
  descargarRespaldo,
  importarRespaldo,
  leerArchivoRespaldo,
  restablecerDatosDemo,
  resumirDatos,
} from '../../servicios/servicio-respaldo.js';
import { escaparHTML } from '../../utilidades/dom.js';
import { formatearFechaHora, pluralizar } from '../../utilidades/formato.js';
import { ponerBotonCargando } from '../../utilidades/formularios.js';
import { icono } from '../../utilidades/iconos.js';
import { notificar } from '../compartidos/contenedor-notificaciones.js';
import { confirmar } from '../compartidos/dialogo-confirmacion.js';

/** Lista "3 usuarios · 2 exámenes · 11 preguntas · 5 resultados". */
function describirResumen(resumen) {
  return [
    pluralizar(resumen.usuarios, 'usuario'),
    pluralizar(resumen.examenes, 'examen', 'exámenes'),
    pluralizar(resumen.preguntas, 'pregunta'),
    pluralizar(resumen.intentos, 'resultado'),
  ];
}

class VistaRespaldo extends HTMLElement {
  #respaldoPendiente = null;

  connectedCallback() {
    this.innerHTML = `
      <div class="encabezado-vista">
        <div>
          <h1 class="encabezado-vista__titulo">Respaldo de datos</h1>
          <p class="encabezado-vista__descripcion">
            Toda la información vive en este navegador (localStorage). Descarga una copia en JSON para
            no perderla o para llevarla a otro equipo.
          </p>
        </div>
      </div>

      <div class="rejilla-respaldo">
        <section class="tarjeta respaldo-tarjeta" aria-labelledby="titulo-exportar">
          <span class="respaldo-tarjeta__icono">${icono('descargar')}</span>
          <h2 class="tarjeta__titulo" id="titulo-exportar">Exportar datos</h2>
          <p class="texto-secundario">Se descargará un archivo <code>.json</code> con:</p>
          <ul class="respaldo-resumen" data-ref="resumen-actual"></ul>
          <p class="alerta alerta--info">${icono('candado')}<span>Las contraseñas se exportan cifradas, nunca en texto plano.</span></p>
          <button type="button" class="btn btn--primario" data-accion="exportar">${icono('descargar')} Descargar respaldo</button>
        </section>

        <section class="tarjeta respaldo-tarjeta" aria-labelledby="titulo-importar">
          <span class="respaldo-tarjeta__icono">${icono('subir')}</span>
          <h2 class="tarjeta__titulo" id="titulo-importar">Importar datos</h2>
          <p class="texto-secundario">Reemplaza <strong>toda</strong> la información actual por la de un respaldo.</p>

          <label class="zona-archivo" data-ref="zona">
            <input class="sr-only" type="file" accept=".json,application/json" data-ref="archivo">
            ${icono('subir')}
            <span><strong>Elige un archivo</strong> o arrástralo aquí</span>
            <small>Respaldo .json de Acme School · máximo 5 MB</small>
          </label>

          <div class="alerta alerta--peligro" role="alert" data-ref="error" hidden></div>

          <div class="respaldo-previa" data-ref="previa" hidden>
            <p class="respaldo-previa__titulo">${icono('exito')} <span data-ref="nombre-archivo"></span></p>
            <p class="texto-tenue texto-pequeno" data-ref="fecha-archivo"></p>
            <ul class="respaldo-resumen" data-ref="resumen-archivo"></ul>
            <div class="grupo-botones">
              <button type="button" class="btn btn--fantasma" data-accion="cancelar-importacion">Cancelar</button>
              <button type="button" class="btn btn--peligro" data-accion="importar">${icono('subir')} Reemplazar datos</button>
            </div>
          </div>
        </section>

        <section class="tarjeta respaldo-tarjeta respaldo-tarjeta--peligro" aria-labelledby="titulo-restablecer">
          <span class="respaldo-tarjeta__icono">${icono('reiniciar')}</span>
          <h2 class="tarjeta__titulo" id="titulo-restablecer">Restablecer demostración</h2>
          <p class="texto-secundario">
            Borra todos los usuarios, exámenes y resultados, y vuelve a crear los datos de ejemplo
            (2 usuarios y 3 exámenes).
          </p>
          <button type="button" class="btn btn--peligro-fantasma" data-accion="restablecer">
            ${icono('reiniciar')} Restablecer datos
          </button>
        </section>
      </div>`;

    this.addEventListener('click', this.#alHacerClic);
    this.querySelector('[data-ref="archivo"]').addEventListener('change', (evento) => {
      this.#procesarArchivo(evento.target.files[0]);
    });
    this.#activarArrastrar();
    this.#mostrarResumenActual();
  }

  #ref(nombre) {
    return this.querySelector(`[data-ref="${nombre}"]`);
  }

  #mostrarResumenActual() {
    const resumen = resumirDatos(crearRespaldo().datos);
    this.#ref('resumen-actual').innerHTML = describirResumen(resumen)
      .map((texto) => `<li>${icono('check')} ${texto}</li>`)
      .join('');
  }

  /** Arrastrar y soltar un archivo sobre la zona. */
  #activarArrastrar() {
    const zona = this.#ref('zona');
    const marcar = (activa) => (evento) => {
      evento.preventDefault();
      zona.classList.toggle('zona-archivo--activa', activa);
    };
    zona.addEventListener('dragenter', marcar(true));
    zona.addEventListener('dragover', marcar(true));
    zona.addEventListener('dragleave', marcar(false));
    zona.addEventListener('drop', (evento) => {
      marcar(false)(evento);
      this.#procesarArchivo(evento.dataTransfer.files[0]);
    });
  }

  /** Lee y valida el archivo; si es válido muestra la vista previa. */
  async #procesarArchivo(archivo) {
    this.#cancelarImportacion();
    if (!archivo) return;

    try {
      const respaldo = await leerArchivoRespaldo(archivo);
      this.#respaldoPendiente = respaldo;
      this.#ref('nombre-archivo').textContent = archivo.name;
      this.#ref('fecha-archivo').textContent = `Exportado el ${formatearFechaHora(respaldo.exportadoEn)}`;
      this.#ref('resumen-archivo').innerHTML = describirResumen(resumirDatos(respaldo.datos))
        .map((texto) => `<li>${icono('check')} ${texto}</li>`)
        .join('');
      this.#ref('previa').hidden = false;
      this.#ref('zona').hidden = true;
      this.querySelector('[data-accion="importar"]').focus();
    } catch (error) {
      const detalles = error.detalles?.length
        ? `<ul>${error.detalles.map((detalle) => `<li>${escaparHTML(detalle)}</li>`).join('')}</ul>`
        : '';
      const alerta = this.#ref('error');
      alerta.innerHTML = `${icono('error')}<div><strong>${escaparHTML(error.message)}</strong>${detalles}</div>`;
      alerta.hidden = false;
    }
  }

  #cancelarImportacion() {
    this.#respaldoPendiente = null;
    this.#ref('previa').hidden = true;
    this.#ref('zona').hidden = false;
    this.#ref('error').hidden = true;
    this.#ref('archivo').value = '';
  }

  /** Después de cambiar los datos: si el usuario ya no existe, se cierra la sesión. */
  #despuesDeReemplazar(mensajeExito) {
    sincronizarSesion();
    if (!estaAutenticado()) {
      notificar(`${mensajeExito} Tu usuario no está en los datos nuevos: inicia sesión de nuevo.`, {
        tipo: 'advertencia',
        duracion: 8000,
      });
      navegar(obtenerRutaActual(), { reemplazar: true }); // la guardia envía al login
      return;
    }
    notificar(mensajeExito, { tipo: 'exito' });
    this.#cancelarImportacion();
    this.#mostrarResumenActual();
  }

  #alHacerClic = async (evento) => {
    const boton = evento.target.closest('button[data-accion]');
    if (!boton) return;

    switch (boton.dataset.accion) {
      case 'exportar': {
        const resumen = descargarRespaldo();
        notificar(`Respaldo descargado: ${describirResumen(resumen).join(', ')}.`, { tipo: 'exito' });
        break;
      }

      case 'cancelar-importacion':
        this.#cancelarImportacion();
        this.#ref('archivo').focus();
        break;

      case 'importar': {
        if (!this.#respaldoPendiente) return;
        const acepto = await confirmar({
          titulo: '¿Reemplazar todos los datos?',
          mensaje: 'Los usuarios, exámenes y resultados actuales se borrarán y se cargarán los del archivo.',
          textoConfirmar: 'Sí, reemplazar',
        });
        if (!acepto) return;
        try {
          const resumen = importarRespaldo(this.#respaldoPendiente);
          this.#despuesDeReemplazar(`Datos importados: ${describirResumen(resumen).join(', ')}.`);
        } catch (error) {
          notificar(error.message, { tipo: 'error' });
        }
        break;
      }

      case 'restablecer': {
        const acepto = await confirmar({
          titulo: '¿Restablecer los datos de demostración?',
          mensaje: 'Se borrará TODA la información actual. Descarga un respaldo antes si la necesitas.',
          textoConfirmar: 'Restablecer',
        });
        if (!acepto) return;
        ponerBotonCargando(boton, true);
        try {
          await restablecerDatosDemo();
          this.#despuesDeReemplazar('Se restablecieron los datos de demostración.');
        } catch (error) {
          notificar(error.message, { tipo: 'error' });
        } finally {
          if (boton.isConnected) ponerBotonCargando(boton, false);
        }
        break;
      }

      default:
        break;
    }
  };
}

customElements.define('vista-respaldo', VistaRespaldo);
