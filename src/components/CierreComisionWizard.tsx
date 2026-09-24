import React, { useState, useEffect } from 'react';
import {
  X,
  CheckCircle2,
  Calendar,
  Radio,
  FileText,
  AlertTriangle,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Plus,
  Trash2,
  Check,
  ShieldAlert,
  Wrench,
  MapPin,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import {
  ComisionServicio,
  TipoIntervencion,
  PeriodicidadMantenimientoPreventivo,
  SubtipoVerificacionAerea,
  EstadoOperativo,
} from '../types';
import { formatearFecha, getHoyLocalStr } from '../utils/maintenance';

interface CierreComisionWizardProps {
  comision: ComisionServicio;
  isOpen: boolean;
  onClose: () => void;
  onComisionCerrada?: () => void;
}

interface TareaEquipoDraft {
  equipoId: string;
  fechaEjecucion: string;
  tipoIntervencion: TipoIntervencion;
  tipoPreventivo?: PeriodicidadMantenimientoPreventivo;
  subtipoVerificacionAerea?: SubtipoVerificacionAerea;
  detalleTecnico: string;
  estadoOperativoResultante: EstadoOperativo;
  tareaPendienteProximaVisita: string;
}

interface NovedadDraft {
  aeropuertoCodigo: string;
  observacion: string;
  fechaRegistro: string;
}

export const CierreComisionWizard: React.FC<CierreComisionWizardProps> = ({
  comision,
  isOpen,
  onClose,
  onComisionCerrada,
}) => {
  const { equipos, aeropuertos, nomina, cerrarComisionConFlujo } = useApp();

  const hoyStr = getHoyLocalStr();

  // Estado del Wizard: Pasos 1 a 4
  const [pasoActual, setPasoActual] = useState<1 | 2 | 3 | 4>(1);

  // Paso 1: Fechas reales y observaciones generales
  const [fechaSalidaReal, setFechaSalidaReal] = useState(
    comision.fechaSalidaReal || comision.fechaSalida
  );
  const [fechaRegresoReal, setFechaRegresoReal] = useState(
    comision.fechaRegresoReal || comision.fechaRegreso || hoyStr
  );
  const [observacionesCierre, setObservacionesCierre] = useState(
    comision.observacionesCierre || ''
  );

  // Aeropuertos efectivamente visitados (permite agregar o quitar por fuerza mayor)
  const [destinosVisitados, setDestinosVisitados] = useState<string[]>(
    comision.destinosAeropuertos
  );
  const [aeropuertoAAgregar, setAeropuertoAAgregar] = useState<string>('');

  const agregarDestinoVisitado = () => {
    if (!aeropuertoAAgregar) return;
    if (!destinosVisitados.includes(aeropuertoAAgregar)) {
      setDestinosVisitados((prev) => [...prev, aeropuertoAAgregar]);
    }
    setAeropuertoAAgregar('');
    setErrorPaso(null);
  };

  const quitarDestinoVisitado = (codigoIATA: string) => {
    if (destinosVisitados.length <= 1) {
      setErrorPaso('La comisión debe registrar al menos un aeropuerto visitado.');
      return;
    }
    setDestinosVisitados((prev) => prev.filter((c) => c !== codigoIATA));
    setErrorPaso(null);
  };

  // Equipos instalados en los aeropuertos visitados de esta comisión
  const equiposDeLaComision = equipos.filter((e) =>
    destinosVisitados.includes(e.aeropuertoCodigo)
  );

  // Paso 2: Tareas e intervenciones realizadas en los equipos
  const [tareasRegistradas, setTareasRegistradas] = useState<TareaEquipoDraft[]>([]);

  // Formulario temporal de una nueva tarea en equipo
  const [draftEquipoId, setDraftEquipoId] = useState<string>(
    equiposDeLaComision[0]?.id || ''
  );
  const [draftFecha, setDraftFecha] = useState<string>(hoyStr);
  const [draftTipo, setDraftTipo] = useState<TipoIntervencion>(
    comision.tiposMantenimiento[0] || 'Preventivo'
  );
  const [draftTipoPreventivo, setDraftTipoPreventivo] =
    useState<PeriodicidadMantenimientoPreventivo>('Mensual');
  const [draftSubtipoVerificacionAerea, setDraftSubtipoVerificacionAerea] =
    useState<SubtipoVerificacionAerea>('Sin alarmas');
  const [draftDetalle, setDraftDetalle] = useState<string>('');
  const [draftEstadoResultante, setDraftEstadoResultante] =
    useState<EstadoOperativo>('EN_SERVICIO');
  const [draftPendiente, setDraftPendiente] = useState<string>('');

  // Paso 3: Novedades técnicas y de infraestructura
  const [novedadesRegistradas, setNovedadesRegistradas] = useState<NovedadDraft[]>([]);
  const [draftNovAeropuerto, setDraftNovAeropuerto] = useState<string>(
    destinosVisitados[0] || ''
  );
  const [draftNovObs, setDraftNovObs] = useState<string>('');

  // Si el aeropuerto elegido para la novedad deja de estar entre los efectivamente
  // visitados (se quitó por fuerza mayor en el Paso 1), se reajusta la selección.
  useEffect(() => {
    if (!destinosVisitados.includes(draftNovAeropuerto)) {
      setDraftNovAeropuerto(destinosVisitados[0] || '');
    }
  }, [destinosVisitados]);

  const [errorPaso, setErrorPaso] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  if (!isOpen) return null;

  // Agregar una tarea al listado del Paso 2
  const handleAgregarTarea = () => {
    if (!draftEquipoId) {
      setErrorPaso('Seleccione un equipo para registrar la intervención.');
      return;
    }
    const isCorrectivo = draftTipo === 'Correctivo';
    const isPreventivo = draftTipo === 'Preventivo';
    const isVerificacion = draftTipo === 'Verificación';

    if (isCorrectivo && !draftDetalle.trim()) {
      setErrorPaso(
        'El detalle técnico es obligatorio para intervenciones de tipo Correctivo.'
      );
      return;
    }

    if (draftTipo === 'Otros' && !draftDetalle.trim()) {
      setErrorPaso(
        'El detalle técnico es obligatorio para intervenciones de tipo Otros.'
      );
      return;
    }

    const detalleFinal = draftDetalle.trim()
      ? draftDetalle.trim()
      : isVerificacion
      ? `Verificación: ${draftSubtipoVerificacionAerea}`
      : isPreventivo
      ? `Preventivo: ${draftTipoPreventivo}`
      : `${draftTipo}: Tarea técnica finalizada`;

    setTareasRegistradas((prev) => [
      ...prev,
      {
        equipoId: draftEquipoId,
        fechaEjecucion: draftFecha,
        tipoIntervencion: draftTipo,
        tipoPreventivo: isPreventivo ? draftTipoPreventivo : undefined,
        subtipoVerificacionAerea: isVerificacion ? draftSubtipoVerificacionAerea : undefined,
        detalleTecnico: detalleFinal,
        estadoOperativoResultante: draftEstadoResultante,
        tareaPendienteProximaVisita: draftPendiente.trim(),
      },
    ]);

    // Limpiar borrador para permitir registrar otra tarea
    setDraftDetalle('');
    setDraftPendiente('');
    setErrorPaso(null);
  };

  const handleEliminarTarea = (index: number) => {
    setTareasRegistradas((prev) => prev.filter((_, i) => i !== index));
  };

  // Agregar una novedad al listado del Paso 3
  const handleAgregarNovedad = () => {
    if (!draftNovObs.trim()) {
      setErrorPaso('Ingrese la descripción de la novedad u observación.');
      return;
    }

    setNovedadesRegistradas((prev) => [
      ...prev,
      {
        aeropuertoCodigo: draftNovAeropuerto,
        observacion: draftNovObs.trim(),
        fechaRegistro: hoyStr,
      },
    ]);

    setDraftNovObs('');
    setErrorPaso(null);
  };

  const handleEliminarNovedad = (index: number) => {
    setNovedadesRegistradas((prev) => prev.filter((_, i) => i !== index));
  };

  // Navegación entre pasos con validación
  const irAlPaso = (nuevoPaso: 1 | 2 | 3 | 4) => {
    setErrorPaso(null);

    if (nuevoPaso > pasoActual) {
      if (pasoActual === 1) {
        if (!fechaSalidaReal || !fechaRegresoReal) {
          setErrorPaso('Debe especificar las fechas reales de salida y regreso.');
          return;
        }
        if (new Date(fechaSalidaReal) > new Date(fechaRegresoReal)) {
          setErrorPaso('La fecha real de salida no puede ser posterior a la de regreso.');
          return;
        }
        if (destinosVisitados.length === 0) {
          setErrorPaso('Debe registrar al menos un aeropuerto visitado en la comisión.');
          return;
        }
      }
    }

    setPasoActual(nuevoPaso);
  };

  // Finalizar cierre definitivo
  const handleConfirmarCierre = () => {
    // Evita reenvíos duplicados por doble clic y re-cierres si el flujo se dispara dos veces.
    if (enviando) return;
    setEnviando(true);
    try {
      cerrarComisionConFlujo({
        comisionId: comision.id,
        fechaSalidaReal,
        fechaRegresoReal,
        destinosVisitados,
        observacionesCierre:
          observacionesCierre.trim() ||
          `Cierre técnico formal de comisión ${comision.codigo}. Intervenciones registradas en sistema.`,
        intervencionesNuevas: tareasRegistradas,
        novedadesNuevas: novedadesRegistradas,
      });

      if (onComisionCerrada) onComisionCerrada();
      onClose();
    } catch (err) {
      setErrorPaso(err instanceof Error ? err.message : 'No se pudo cerrar la comisión.');
      setEnviando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white border border-[#393939] shadow-2xl w-full max-w-4xl my-8 rounded-none overflow-hidden">
        {/* Encabezado estilo IBM Maximo Workflow */}
        <div className="bg-[#161616] text-white px-6 py-4 flex items-center justify-between border-b border-[#393939]">
          <div className="flex items-center space-x-3">
            <div className="bg-[#0f62fe] p-1.5 text-white">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-mono font-bold bg-[#393939] text-[#82cfff] px-1.5 py-0.5">
                  CIERRE DE COMISIÓN
                </span>
                <span className="text-base font-semibold tracking-wide">
                  {comision.codigo}
                </span>
              </div>
              <p className="text-xs text-[#a8a8a8]">
                Flujo Asistido de Cierre Técnico • Actualización Automática de Radioayudas
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#a8a8a8] hover:text-white p-1 hover:bg-[#393939] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Barra de Progreso de Pasos (Wizard Stepper) */}
        <div className="bg-[#262626] px-6 py-3 border-b border-[#393939]">
          <div className="grid grid-cols-4 gap-2 text-xs">
            <button
              onClick={() => irAlPaso(1)}
              className={`flex items-center space-x-2 p-2 text-left transition-colors ${
                pasoActual === 1
                  ? 'bg-[#0f62fe] text-white font-bold'
                  : pasoActual > 1
                  ? 'bg-[#393939] text-[#82cfff]'
                  : 'text-[#8d8d8d]'
              }`}
            >
              <span className="w-5 h-5 rounded-full border border-current flex items-center justify-center text-[10px] shrink-0">
                1
              </span>
              <span className="truncate">Fechas Reales</span>
            </button>

            <button
              onClick={() => irAlPaso(2)}
              className={`flex items-center space-x-2 p-2 text-left transition-colors ${
                pasoActual === 2
                  ? 'bg-[#0f62fe] text-white font-bold'
                  : pasoActual > 2
                  ? 'bg-[#393939] text-[#82cfff]'
                  : 'text-[#8d8d8d]'
              }`}
            >
              <span className="w-5 h-5 rounded-full border border-current flex items-center justify-center text-[10px] shrink-0">
                2
              </span>
              <span className="truncate">Tareas en Equipos ({tareasRegistradas.length})</span>
            </button>

            <button
              onClick={() => irAlPaso(3)}
              className={`flex items-center space-x-2 p-2 text-left transition-colors ${
                pasoActual === 3
                  ? 'bg-[#0f62fe] text-white font-bold'
                  : pasoActual > 3
                  ? 'bg-[#393939] text-[#82cfff]'
                  : 'text-[#8d8d8d]'
              }`}
            >
              <span className="w-5 h-5 rounded-full border border-current flex items-center justify-center text-[10px] shrink-0">
                3
              </span>
              <span className="truncate">Novedades ({novedadesRegistradas.length})</span>
            </button>

            <button
              onClick={() => irAlPaso(4)}
              className={`flex items-center space-x-2 p-2 text-left transition-colors ${
                pasoActual === 4
                  ? 'bg-[#0f62fe] text-white font-bold'
                  : 'text-[#8d8d8d]'
              }`}
            >
              <span className="w-5 h-5 rounded-full border border-current flex items-center justify-center text-[10px] shrink-0">
                4
              </span>
              <span className="truncate">Balance y Cierre</span>
            </button>
          </div>
        </div>

        {/* Mensaje de error general si aplica */}
        {errorPaso && (
          <div className="bg-[#fff1f1] border-l-4 border-[#da1e28] p-3 text-xs text-[#da1e28] flex items-center space-x-2 mx-6 mt-4">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{errorPaso}</span>
          </div>
        )}

        {/* Cuerpo del Asistente según Paso */}
        <div className="p-6 max-h-[65vh] overflow-y-auto space-y-4">
          {/* PASO 1: FECHAS REALES */}
          {pasoActual === 1 && (
            <div className="space-y-4">
              <div className="bg-[#f4f4f4] p-4 border border-[#e0e0e0]">
                <h3 className="text-xs font-bold text-[#161616] uppercase tracking-wider mb-2 flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-[#0f62fe]" />
                  <span>Paso 1: Fechas Reales de Ejecución de la Comisión</span>
                </h3>
                <p className="text-xs text-[#525252] mb-4">
                  Registre los días exactos en que la comisión se desarrolló en terreno. Esto
                  asegura la trazabilidad técnica y la auditoría de viáticos y servicios aeronáuticos.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#161616] uppercase mb-1">
                      Fecha Real de Salida *
                    </label>
                    <input
                      type="date"
                      value={fechaSalidaReal}
                      onChange={(e) => setFechaSalidaReal(e.target.value)}
                      className="w-full bg-white border border-[#8d8d8d] px-3 py-1.5 text-xs focus:outline-hidden focus:ring-1 focus:ring-[#0f62fe]"
                      required
                    />
                    <span className="text-[11px] text-[#6f6f6f] mt-1 block">
                      Programada inicialmente: {formatearFecha(comision.fechaSalida)}
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#161616] uppercase mb-1">
                      Fecha Real de Regreso *
                    </label>
                    <input
                      type="date"
                      value={fechaRegresoReal}
                      onChange={(e) => setFechaRegresoReal(e.target.value)}
                      className="w-full bg-white border border-[#8d8d8d] px-3 py-1.5 text-xs focus:outline-hidden focus:ring-1 focus:ring-[#0f62fe]"
                      required
                    />
                    <span className="text-[11px] text-[#6f6f6f] mt-1 block">
                      Programada inicialmente: {formatearFecha(comision.fechaRegreso)}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#161616] uppercase mb-1">
                  Observaciones Generales de la Comisión
                </label>
                <textarea
                  value={observacionesCierre}
                  onChange={(e) => setObservacionesCierre(e.target.value)}
                  rows={4}
                  placeholder="Resumen del viaje, condiciones climáticas, estado de rutas, traslados y consideraciones generales..."
                  className="w-full bg-white border border-[#8d8d8d] p-3 text-xs focus:outline-hidden focus:ring-1 focus:ring-[#0f62fe]"
                />
              </div>

              {/* Sección de Aeropuertos Efectivamente Visitados (Fuerza Mayor) */}
              <div className="bg-[#edf5ff] p-4 border border-[#0f62fe]/40 space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center space-x-2 text-xs font-bold text-[#002d9c] uppercase tracking-wide">
                    <MapPin className="w-4 h-4 text-[#0f62fe]" />
                    <span>Aeropuertos Efectivamente Visitados (Ajuste por Fuerza Mayor)</span>
                  </div>
                  {JSON.stringify([...destinosVisitados].sort()) !==
                    JSON.stringify([...comision.destinosAeropuertos].sort()) && (
                    <span className="text-[10px] font-bold bg-[#fff1f1] text-[#da1e28] border border-[#da1e28] px-2 py-0.5">
                      Itinerario modificado por fuerza mayor
                    </span>
                  )}
                </div>

                <p className="text-xs text-[#525252]">
                  En caso de cambios de ruta, contingencias meteorológicas o desvíos de fuerza mayor,
                  puede agregar o quitar aeropuertos para reflejar con fidelidad dónde se intervino:
                </p>

                {/* Listado de aeropuertos actualmente visitados con botón para remover */}
                <div className="flex flex-wrap gap-2 pt-1">
                  {destinosVisitados.map((cod) => {
                    const aero = aeropuertos.find((a) => a.codigoIATA === cod);
                    return (
                      <span
                        key={cod}
                        className="inline-flex items-center space-x-1.5 bg-white border border-[#0f62fe] text-[#0f62fe] px-2.5 py-1 text-xs font-bold font-mono"
                      >
                        <span>
                          [{cod}] {aero?.nombreOficial || cod} ({aero?.region || 'S/D'})
                        </span>
                        <button
                          type="button"
                          onClick={() => quitarDestinoVisitado(cod)}
                          title={`Quitar ${cod} de los destinos visitados`}
                          className="text-[#da1e28] hover:bg-[#fff1f1] p-0.5 ml-1 transition-colors cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </span>
                    );
                  })}
                </div>

                {/* Selector para agregar un nuevo aeropuerto visitado */}
                <div className="flex items-center space-x-2 pt-2 border-t border-[#b9d3ff]">
                  <select
                    value={aeropuertoAAgregar}
                    onChange={(e) => setAeropuertoAAgregar(e.target.value)}
                    className="bg-white border border-[#8d8d8d] px-3 py-1.5 text-xs focus:outline-hidden focus:ring-1 focus:ring-[#0f62fe] flex-1 max-w-md"
                  >
                    <option value="">-- Seleccionar aeropuerto para agregar por fuerza mayor --</option>
                    {aeropuertos
                      .filter((a) => !destinosVisitados.includes(a.codigoIATA))
                      .map((a) => (
                        <option key={a.codigoIATA} value={a.codigoIATA}>
                          [{a.codigoIATA}] {a.nombreOficial} ({a.region})
                        </option>
                      ))}
                  </select>
                  <button
                    type="button"
                    onClick={agregarDestinoVisitado}
                    disabled={!aeropuertoAAgregar}
                    className="px-3 py-1.5 bg-[#0f62fe] disabled:bg-[#8d8d8d] text-white text-xs font-bold flex items-center space-x-1 cursor-pointer disabled:cursor-not-allowed"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Agregar Aeropuerto</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* PASO 2: TAREAS REALIZADAS EN LOS EQUIPOS */}
          {pasoActual === 2 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-xs font-bold text-[#161616] uppercase tracking-wider flex items-center space-x-2">
                  <Wrench className="w-4 h-4 text-[#0f62fe]" />
                  <span>Paso 2: Registro de Tareas Realizadas en Equipos</span>
                </h3>
                <p className="text-xs text-[#525252] mt-0.5">
                  Seleccione cada equipo intervenido y registre la tarea con su fecha de ejecución.
                </p>
              </div>

              {/* Formulario de carga de una tarea */}
              <div className="bg-[#f4f4f4] p-4 border border-[#0f62fe]/40 space-y-3">
                <div className="text-xs font-bold text-[#0043ce] uppercase tracking-wider flex items-center justify-between">
                  <span>Nueva Intervención Técnica</span>
                  <span className="text-[11px] font-normal text-[#525252]">
                    Equipos de {destinosVisitados.join(', ')}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {/* Selector de equipo */}
                  <div>
                    <label className="block text-xs font-semibold text-[#161616] uppercase mb-1">
                      Equipo Instalado *
                    </label>
                    <select
                      value={draftEquipoId}
                      onChange={(e) => setDraftEquipoId(e.target.value)}
                      className="w-full bg-white border border-[#8d8d8d] px-2 py-1.5 text-xs font-medium focus:outline-hidden focus:ring-1 focus:ring-[#0f62fe]"
                    >
                      {equiposDeLaComision.length === 0 ? (
                        <option value="">No hay equipos registrados en estos destinos</option>
                      ) : (
                        equiposDeLaComision.map((eq) => (
                          <option key={eq.id} value={eq.id}>
                            [{eq.aeropuertoCodigo}] {eq.identificador}
                          </option>
                        ))
                      )}
                    </select>
                  </div>

                  {/* Fecha de ejecución individual */}
                  <div>
                    <label className="block text-xs font-semibold text-[#161616] uppercase mb-1">
                      Fecha de Ejecución *
                    </label>
                    <input
                      type="date"
                      value={draftFecha}
                      onChange={(e) => setDraftFecha(e.target.value)}
                      className="w-full bg-white border border-[#8d8d8d] px-2 py-1.5 text-xs focus:outline-hidden focus:ring-1 focus:ring-[#0f62fe]"
                    />
                  </div>

                  {/* Tipo de intervención */}
                  <div>
                    <label className="block text-xs font-semibold text-[#161616] uppercase mb-1">
                      Tipo de Intervención *
                    </label>
                    <select
                      value={draftTipo}
                      onChange={(e) => setDraftTipo(e.target.value as TipoIntervencion)}
                      className="w-full bg-white border border-[#8d8d8d] px-2 py-1.5 text-xs focus:outline-hidden focus:ring-1 focus:ring-[#0f62fe]"
                    >
                      <option value="Verificación">Verificación</option>
                      <option value="Preventivo">Preventivo</option>
                      <option value="Correctivo">Correctivo</option>
                      <option value="Otros">Otros</option>
                    </select>
                  </div>
                </div>

                {/* Subtipo condicional según el tipo de intervención */}
                {draftTipo === 'Preventivo' && (
                  <div className="bg-[#edf5ff] p-3 border border-[#b9d3ff]">
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-bold text-[#002d9c] uppercase">
                        Tipo / Periodicidad del Mantenimiento Preventivo *
                      </label>
                      <span className="text-[11px] text-[#0043ce]">
                        Seleccione el alcance ejecutado
                      </span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {(
                        ['Mensual', 'Trimestral', 'Semestral', 'Anual'] as PeriodicidadMantenimientoPreventivo[]
                      ).map((periodo) => (
                        <button
                          key={periodo}
                          type="button"
                          onClick={() => setDraftTipoPreventivo(periodo)}
                          className={`px-3 py-2 text-xs font-bold border transition-all cursor-pointer ${
                            draftTipoPreventivo === periodo
                              ? 'bg-[#002d9c] text-white border-[#002d9c] shadow-xs ring-1 ring-[#002d9c]'
                              : 'bg-white text-[#161616] border-[#8d8d8d] hover:bg-[#e0e0e0]'
                          }`}
                        >
                          {periodo}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {draftTipo === 'Verificación' && (
                  <div className="bg-[#edf5ff] p-3 border border-[#b9d3ff]">
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-bold text-[#002d9c] uppercase">
                        Condición / Resultado de la Verificación *
                      </label>
                      <span className="text-[11px] text-[#0043ce]">
                        Informe de vuelo de la aeronave verificadora
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setDraftSubtipoVerificacionAerea('Sin alarmas')}
                        className={`px-3 py-2 text-xs font-bold border transition-all cursor-pointer flex items-center justify-center space-x-1.5 ${
                          draftSubtipoVerificacionAerea === 'Sin alarmas'
                            ? 'bg-[#0e6027] text-white border-[#0e6027] shadow-xs ring-1 ring-[#0e6027]'
                            : 'bg-white text-[#161616] border-[#8d8d8d] hover:bg-[#e0e0e0]'
                        }`}
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Sin alarmas</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setDraftSubtipoVerificacionAerea('Con alarmas')}
                        className={`px-3 py-2 text-xs font-bold border transition-all cursor-pointer flex items-center justify-center space-x-1.5 ${
                          draftSubtipoVerificacionAerea === 'Con alarmas'
                            ? 'bg-[#da1e28] text-white border-[#da1e28] shadow-xs ring-1 ring-[#da1e28]'
                            : 'bg-white text-[#161616] border-[#8d8d8d] hover:bg-[#e0e0e0]'
                        }`}
                      >
                        <AlertTriangle className="w-4 h-4" />
                        <span>Con alarmas</span>
                      </button>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 gap-3">
                  {/* Estado operativo resultante */}
                  <div>
                    <label className="block text-xs font-semibold text-[#161616] uppercase mb-1">
                      Estado Operativo Resultante *
                    </label>
                    <select
                      value={draftEstadoResultante}
                      onChange={(e) =>
                        setDraftEstadoResultante(e.target.value as EstadoOperativo)
                      }
                      className={`w-full border px-2 py-1.5 text-xs font-bold focus:outline-hidden ${
                        draftEstadoResultante === 'EN_SERVICIO'
                          ? 'bg-[#defbe6] text-[#0e6027] border-[#a7f0ba]'
                          : 'bg-[#ffebee] text-[#da1e28] border-[#ffb3b8]'
                      }`}
                    >
                      <option value="EN_SERVICIO">EN SERVICIO (Operativo)</option>
                      <option value="FUERA_DE_SERVICIO">FUERA DE SERVICIO (Inoperativo)</option>
                    </select>
                  </div>
                </div>

                {/* Detalle técnico de tareas y mediciones */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-[#161616] uppercase">
                      Detalle Técnico{' '}
                      {draftTipo === 'Correctivo' || draftTipo === 'Otros' ? '*' : '(Opcional)'}
                    </label>
                    <span className="text-[11px] text-[#525252]">
                      {draftTipo === 'Correctivo'
                        ? 'Obligatorio para correctivos'
                        : draftTipo === 'Otros'
                        ? 'Obligatorio para tipo Otros'
                        : 'Opcional (calibraciones, mediciones, ajustes)'}
                    </span>
                  </div>
                  <textarea
                    value={draftDetalle}
                    onChange={(e) => setDraftDetalle(e.target.value)}
                    rows={2}
                    placeholder={
                      draftTipo === 'Correctivo'
                        ? 'Describa la falla, diagnóstico, componentes reemplazados y ajustes ejecutados...'
                        : draftTipo === 'Otros'
                        ? 'Describa detalladamente las tareas ejecutadas...'
                        : 'Opcional: Calibración de fase, potencia RF, mediciones, chequeo de monitores...'
                    }
                    className="w-full bg-white border border-[#8d8d8d] p-2 text-xs focus:outline-hidden focus:ring-1 focus:ring-[#0f62fe]"
                  />
                </div>

                {/* Tarea pendiente para próxima visita */}
                <div>
                  <label className="block text-xs font-semibold text-[#161616] uppercase mb-1">
                    Tarea Pendiente para Próxima Visita (Opcional - repuestos, infraestructura)
                  </label>
                  <input
                    type="text"
                    value={draftPendiente}
                    onChange={(e) => setDraftPendiente(e.target.value)}
                    placeholder="Ej: Reemplazar módulo de potencia de repuesto, cambiar cable coaxial de monitor..."
                    className="w-full bg-white border border-[#8d8d8d] px-2 py-1.5 text-xs focus:outline-hidden focus:ring-1 focus:ring-[#0f62fe]"
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleAgregarTarea}
                    className="flex items-center space-x-1.5 px-3 py-1.5 bg-[#0f62fe] hover:bg-[#0353e9] text-white text-xs font-semibold transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Agregar Tarea a la Lista de Cierre</span>
                  </button>
                </div>
              </div>

              {/* Lista de tareas registradas para este cierre */}
              <div className="border border-[#e0e0e0]">
                <div className="bg-[#262626] text-white px-3 py-2 text-xs font-semibold flex items-center justify-between">
                  <span>Tareas Registradas en esta Comisión ({tareasRegistradas.length})</span>
                  <span className="text-[11px] text-[#c6c6c6]">
                    Se actualizarán en la base técnica al cerrar
                  </span>
                </div>

                {tareasRegistradas.length === 0 ? (
                  <div className="p-4 text-center text-xs text-[#8d8d8d]">
                    No ha agregado tareas aún. Complete el formulario superior para registrar lo
                    realizado en cada equipo.
                  </div>
                ) : (
                  <div className="divide-y divide-[#e0e0e0]">
                    {tareasRegistradas.map((item, idx) => {
                      const eq = equipos.find((e) => e.id === item.equipoId);

                      return (
                        <div key={idx} className="p-3 bg-white hover:bg-[#f4f4f4] text-xs">
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                              <span className="font-mono font-bold bg-[#161616] text-white px-1.5 py-0.5">
                                {eq?.identificador}
                              </span>
                              <span className="bg-[#edf5ff] text-[#002d9c] border border-[#b9d3ff] px-2 py-0.5 text-xs font-bold">
                                {item.tipoIntervencion === 'Preventivo' && item.tipoPreventivo
                                  ? item.tipoPreventivo
                                  : item.tipoIntervencion}
                              </span>
                              {item.subtipoVerificacionAerea === 'Con alarmas' && (
                                <span className="px-2 py-0.5 text-xs font-bold border bg-[#fff1f1] text-[#da1e28] border-[#ffb3b8]">
                                  Con alarmas
                                </span>
                              )}
                              <span className="text-[#6f6f6f]">• {formatearFecha(item.fechaEjecucion)}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span
                                className={`px-2 py-0.5 text-[10px] font-bold ${
                                  item.estadoOperativoResultante === 'EN_SERVICIO'
                                    ? 'bg-[#defbe6] text-[#0e6027]'
                                    : 'bg-[#ffebee] text-[#da1e28]'
                                }`}
                              >
                                {item.estadoOperativoResultante}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleEliminarTarea(idx)}
                                className="text-[#da1e28] hover:bg-[#fff1f1] p-1 rounded"
                                title="Eliminar tarea"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          <p className="text-[#161616] font-mono text-[11px] bg-[#f4f4f4] p-2 border border-[#e0e0e0] mt-1">
                            {item.detalleTecnico}
                          </p>

                          {item.tareaPendienteProximaVisita && (
                            <div className="mt-1 text-[11px] text-[#8a6100] flex items-center space-x-1">
                              <AlertTriangle className="w-3 h-3 text-[#f1c21b] shrink-0" />
                              <span>
                                <strong>Pendiente prox. visita:</strong>{' '}
                                {item.tareaPendienteProximaVisita}
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* PASO 3: NOVEDADES POR AEROPUERTO */}
          {pasoActual === 3 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-xs font-bold text-[#161616] uppercase tracking-wider flex items-center space-x-2">
                  <FileText className="w-4 h-4 text-[#0f62fe]" />
                  <span>Paso 3: Novedades Técnicas o de Infraestructura por Aeropuerto</span>
                </h3>
                <p className="text-xs text-[#525252] mt-0.5">
                  Registre observaciones de sitio, fallas en suministros eléctricos, estado de
                  casetas, accesos viales o temas de infraestructura aeronáutica.
                </p>
              </div>

              {/* Formulario de carga de novedad */}
              <div className="bg-[#f4f4f4] p-4 border border-[#e0e0e0] space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-[#161616] uppercase mb-1">
                    Aeropuerto Afectado *
                  </label>
                  <select
                    value={draftNovAeropuerto}
                    onChange={(e) => setDraftNovAeropuerto(e.target.value)}
                    className="w-full bg-white border border-[#8d8d8d] px-2 py-1.5 text-xs focus:outline-hidden focus:ring-1 focus:ring-[#0f62fe]"
                  >
                    {destinosVisitados.map((cod) => {
                      const a = aeropuertos.find((ar) => ar.codigoIATA === cod);
                      return (
                        <option key={cod} value={cod}>
                          {cod} - {a?.nombreOficial}
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#161616] uppercase mb-1">
                    Descripción de la Novedad / Observación *
                  </label>
                  <textarea
                    value={draftNovObs}
                    onChange={(e) => setDraftNovObs(e.target.value)}
                    rows={2}
                    placeholder="Ej: Se detectó humedad en sector de transformador de aislamiento de la cabecera 35R..."
                    className="w-full bg-white border border-[#8d8d8d] p-2 text-xs focus:outline-hidden focus:ring-1 focus:ring-[#0f62fe]"
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleAgregarNovedad}
                    className="flex items-center space-x-1.5 px-3 py-1.5 bg-[#262626] hover:bg-[#393939] text-white text-xs font-medium transition-colors border border-[#525252]"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Agregar Novedad</span>
                  </button>
                </div>
              </div>

              {/* Lista de novedades registradas */}
              <div className="border border-[#e0e0e0]">
                <div className="bg-[#262626] text-white px-3 py-2 text-xs font-semibold flex items-center justify-between">
                  <span>Novedades Agrupadas por Aeropuerto ({novedadesRegistradas.length})</span>
                </div>

                {novedadesRegistradas.length === 0 ? (
                  <div className="p-4 text-center text-xs text-[#8d8d8d]">
                    No se han ingresado novedades para los aeropuertos visitados. (Opcional).
                  </div>
                ) : (
                  <div className="divide-y divide-[#e0e0e0]">
                    {novedadesRegistradas.map((nov, idx) => (
                      <div key={idx} className="p-3 bg-white flex items-start justify-between text-xs">
                        <div>
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="font-mono font-bold bg-[#0f62fe] text-white px-2 py-0.5">
                              {nov.aeropuertoCodigo}
                            </span>
                            <span className="text-[#6f6f6f]">• {formatearFecha(nov.fechaRegistro)}</span>
                          </div>
                          <p className="text-[#525252]">{nov.observacion}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleEliminarNovedad(idx)}
                          className="text-[#da1e28] hover:bg-[#fff1f1] p-1 rounded ml-2"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* PASO 4: BALANCE Y CIERRE */}
          {pasoActual === 4 && (
            <div className="space-y-4">
              <div className="bg-[#defbe6] border-l-4 border-[#198038] p-3 text-xs text-[#0e6027]">
                <div className="font-bold text-sm flex items-center space-x-2">
                  <CheckCircle2 className="w-5 h-5 text-[#198038]" />
                  <span>Listo para Finalizar y Cerrar la Comisión</span>
                </div>
              </div>

              {/* Resumen ejecutivo */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="bg-[#f4f4f4] p-3 border border-[#e0e0e0]">
                  <div className="font-bold text-[#161616] uppercase mb-2">
                    Resumen de Comisión
                  </div>
                  <div className="space-y-1 text-[#525252]">
                    <div>
                      <strong>Código:</strong> {comision.codigo}
                    </div>
                    <div>
                      <strong>Período Real:</strong> {formatearFecha(fechaSalidaReal)} al {formatearFecha(fechaRegresoReal)}
                    </div>
                    <div>
                      <strong>Destinos Visitados:</strong> {destinosVisitados.join(', ')}
                      {JSON.stringify([...destinosVisitados].sort()) !==
                        JSON.stringify([...comision.destinosAeropuertos].sort()) && (
                        <span className="ml-1 text-[11px] text-[#da1e28] font-bold">
                          (Modificado por fuerza mayor)
                        </span>
                      )}
                    </div>
                    <div>
                      <strong>Técnicos ({comision.tecnicosIds.length}):</strong>{' '}
                      {comision.tecnicosIds
                        .map((tid) => {
                          const t = nomina.find((x) => x.id === tid);
                          return t ? `${t.apellido.toUpperCase()} (${t.puesto})` : tid;
                        })
                        .join(', ')}
                    </div>
                  </div>
                </div>

                <div className="bg-[#f4f4f4] p-3 border border-[#e0e0e0]">
                  <div className="font-bold text-[#161616] uppercase mb-2">
                    Impacto en Radioayudas
                  </div>
                  <div className="space-y-1 text-[#525252]">
                    <div>
                      <strong>Tareas a impactar:</strong> {tareasRegistradas.length} registradas
                    </div>
                    <div>
                      <strong>Novedades técnicas:</strong> {novedadesRegistradas.length} registradas
                    </div>
                    <div>
                      <strong>Equipos actualizados:</strong>{' '}
                      {Array.from(new Set(tareasRegistradas.map((t) => t.equipoId)))
                        .map((id) => equipos.find((e) => e.id === id)?.identificador)
                        .filter(Boolean)
                        .join(', ') || 'Ninguno'}
                    </div>
                  </div>
                </div>
              </div>

              {tareasRegistradas.length > 0 && (
                <div className="border border-[#e0e0e0]">
                  <div className="bg-[#161616] text-white px-3 py-1.5 text-xs font-bold uppercase">
                    Tareas Registradas a Asentar ({tareasRegistradas.length})
                  </div>
                  <div className="divide-y divide-[#e0e0e0] max-h-48 overflow-y-auto">
                    {tareasRegistradas.map((t, idx) => {
                      const eq = equipos.find((e) => e.id === t.equipoId);
                      return (
                        <div key={idx} className="p-2 bg-white flex items-center justify-between text-xs">
                          <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                            <span className="font-mono font-bold bg-[#161616] text-white px-1.5 py-0.5">
                              {eq?.identificador}
                            </span>
                            <span className="bg-[#edf5ff] text-[#002d9c] border border-[#b9d3ff] px-2 py-0.5 text-[11px] font-bold">
                              {t.tipoIntervencion === 'Preventivo' && t.tipoPreventivo
                                ? t.tipoPreventivo
                                : t.tipoIntervencion}
                            </span>
                            {t.subtipoVerificacionAerea === 'Con alarmas' && (
                              <span className="px-2 py-0.5 text-[11px] font-bold border bg-[#fff1f1] text-[#da1e28] border-[#ffb3b8]">
                                Con alarmas
                              </span>
                            )}
                            <span className="text-[#6f6f6f]">• {formatearFecha(t.fechaEjecucion)}</span>
                          </div>
                          <span
                            className={`px-2 py-0.5 text-[10px] font-bold shrink-0 ml-2 ${
                              t.estadoOperativoResultante === 'EN_SERVICIO'
                                ? 'bg-[#defbe6] text-[#0e6027]'
                                : 'bg-[#ffebee] text-[#da1e28]'
                            }`}
                          >
                            {t.estadoOperativoResultante}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {tareasRegistradas.length === 0 && (
                <div className="bg-[#fff8e1] border-l-4 border-[#f1c21b] p-3 text-xs text-[#8a6100] flex items-center space-x-2">
                  <ShieldAlert className="w-4 h-4 shrink-0" />
                  <span>
                    Atención: No ha registrado tareas en equipos en el Paso 2. La comisión se cerrará
                    sin actualizar fechas de mantenimiento para las radioayudas.
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Barra de Acciones y Navegación del Asistente */}
        <div className="bg-[#f4f4f4] px-6 py-3 border-t border-[#e0e0e0] flex items-center justify-between">
          <div>
            {pasoActual > 1 ? (
              <button
                type="button"
                onClick={() => irAlPaso((pasoActual - 1) as 1 | 2 | 3)}
                className="flex items-center space-x-1.5 px-3 py-1.5 border border-[#8d8d8d] text-xs font-medium text-[#161616] hover:bg-[#e0e0e0] transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Paso Anterior</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 border border-[#8d8d8d] text-xs font-medium text-[#161616] hover:bg-[#e0e0e0] transition-colors"
              >
                Cancelar
              </button>
            )}
          </div>

          <div className="flex items-center space-x-3">
            {pasoActual < 4 ? (
              <button
                type="button"
                onClick={() => irAlPaso((pasoActual + 1) as 2 | 3 | 4)}
                className="flex items-center space-x-1.5 px-4 py-2 bg-[#0f62fe] hover:bg-[#0353e9] text-white text-xs font-semibold tracking-wide transition-colors"
              >
                <span>Siguiente Paso</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleConfirmarCierre}
                disabled={enviando}
                className="flex items-center space-x-1.5 px-5 py-2 bg-[#198038] hover:bg-[#0e6027] disabled:bg-[#8d8d8d] disabled:cursor-not-allowed text-white text-xs font-bold tracking-wide shadow-sm transition-colors"
              >
                <Check className="w-4 h-4" />
                <span>{enviando ? 'FINALIZANDO...' : 'CONFIRMAR Y FINALIZAR COMISIÓN'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
