import React, { useMemo, useState } from 'react';
import {
  History,
  Plus,
  Pencil,
  Ban,
  Trash2,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  X,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { AccionAuditoria } from '../types';
import { formatearFecha, getClasesEstadoComision } from '../utils/maintenance';

const ACCION_CONFIG: Record<
  AccionAuditoria,
  { label: string; icon: React.ElementType; classes: string }
> = {
  // Los colores replican los del resto de la app: Creación = botón "Nueva Comisión"
  // (azul sólido), Cancelación/Cierre = etiquetas de estado Cancelada/Finalizada,
  // Eliminación = botón de eliminar (rojo sólido), Edición = neutro.
  CREAR: {
    label: 'Creación',
    icon: Plus,
    classes: 'bg-[#0f62fe] text-white border border-[#0f62fe]',
  },
  EDITAR: {
    label: 'Edición',
    icon: Pencil,
    classes: 'bg-[#f4f4f4] text-[#393939] border border-[#8d8d8d]',
  },
  CANCELAR: {
    label: 'Cancelación',
    icon: Ban,
    classes: getClasesEstadoComision('Cancelada').badge,
  },
  ELIMINAR: {
    label: 'Eliminación',
    icon: Trash2,
    classes: 'bg-[#da1e28] text-white border border-[#da1e28]',
  },
  CERRAR: {
    label: 'Cierre',
    icon: CheckCircle2,
    classes: getClasesEstadoComision('Finalizada').badge,
  },
};

// Campos que no aportan valor de trazabilidad al mostrarse en el diff (ruido visual).
const CAMPOS_OMITIDOS = new Set(['id']);

// Nombres legibles para los campos técnicos de ComisionServicio, usados tanto
// en la observación resumida como en el detalle campo por campo.
const ETIQUETA_CAMPO: Record<string, string> = {
  codigo: 'Código',
  estado: 'Estado',
  fechaSalida: 'Fecha de salida prevista',
  fechaRegreso: 'Fecha de regreso prevista',
  fechaSalidaReal: 'Fecha de salida real',
  fechaRegresoReal: 'Fecha de regreso real',
  medioTransporte: 'Medio de transporte',
  destinosAeropuertos: 'Destinos',
  tecnicosIds: 'Técnicos asignados',
  jefeComisionId: 'Jefe de comisión',
  tiposMantenimiento: 'Tipo(s) de mantenimiento',
  objetivo: 'Objetivo',
  observacionesCierre: 'Observaciones de cierre',
  canceladaAt: 'Fecha de cancelación',
  motivoCancelacion: 'Motivo de cancelación',
  finalizadaAt: 'Fecha de finalización',
  createdAt: 'Fecha de creación',
};

function etiquetaCampo(campo: string): string {
  return ETIQUETA_CAMPO[campo] || campo;
}

function formatearValor(valor: unknown): string {
  if (valor === null || valor === undefined || valor === '') return '—';
  if (Array.isArray(valor)) return valor.length > 0 ? valor.join(', ') : '—';
  return String(valor);
}

// Calcula qué campos cambiaron entre el estado anterior y el nuevo, para
// mostrar solo la diferencia en vez de dos objetos completos.
function calcularDiferencias(
  anterior: Record<string, unknown> | null,
  nuevo: Record<string, unknown> | null
): { campo: string; antes: unknown; despues: unknown }[] {
  const claves = new Set([
    ...Object.keys(anterior || {}),
    ...Object.keys(nuevo || {}),
  ]);
  const diffs: { campo: string; antes: unknown; despues: unknown }[] = [];
  claves.forEach((campo) => {
    if (CAMPOS_OMITIDOS.has(campo)) return;
    const antes = anterior ? anterior[campo] : undefined;
    const despues = nuevo ? nuevo[campo] : undefined;
    if (JSON.stringify(antes) !== JSON.stringify(despues)) {
      diffs.push({ campo, antes, despues });
    }
  });
  return diffs;
}

// Arma la observación en lenguaje natural que se muestra en el listado
// principal, según el tipo de acción registrada.
function generarObservacion(
  accion: AccionAuditoria,
  anterior: Record<string, unknown> | null,
  nuevo: Record<string, unknown> | null
): string {
  switch (accion) {
    case 'CREAR':
      return 'Se creó la comisión.';

    case 'EDITAR': {
      const diffs = calcularDiferencias(anterior, nuevo);
      if (diffs.length === 0) return 'Se editó la comisión sin cambios de datos.';
      const campos = diffs.map((d) => etiquetaCampo(d.campo)).join(', ');
      return `Se editaron los campos: ${campos}.`;
    }

    case 'CANCELAR': {
      const motivo = nuevo?.motivoCancelacion as string | undefined;
      return motivo
        ? `Se canceló la comisión. Motivo: ${motivo}`
        : 'Se canceló la comisión (sin motivo especificado).';
    }

    case 'CERRAR': {
      const tipos = (nuevo?.tiposMantenimiento as string[] | undefined) || [];
      return tipos.length > 0
        ? `Se cerró la comisión. Mantenimiento realizado: ${tipos.join(', ')}.`
        : 'Se cerró la comisión.';
    }

    case 'ELIMINAR':
      return 'Se eliminó la comisión.';

    default:
      return '';
  }
}

// Fecha local (YYYY-MM-DD) de un timestamp ISO, para comparar contra los filtros de fecha.
function fechaLocalDeISO(iso: string): string {
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dia = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dia}`;
}

const ACCIONES: AccionAuditoria[] = ['CREAR', 'EDITAR', 'CANCELAR', 'CERRAR', 'ELIMINAR'];

const INPUT_FILTRO =
  'w-full bg-[#161616] text-white border border-[#525252] px-2 py-1 text-xs font-mono font-normal normal-case tracking-normal placeholder-[#8d8d8d] focus:outline-hidden focus:border-[#0f62fe]';

export const LogsComisionesView: React.FC = () => {
  const { auditoria } = useApp();
  const [expandidoId, setExpandidoId] = useState<string | null>(null);

  const [filtroComision, setFiltroComision] = useState('');
  const [filtroFechaDesde, setFiltroFechaDesde] = useState('');
  const [filtroFechaHasta, setFiltroFechaHasta] = useState('');
  const [filtroUsuario, setFiltroUsuario] = useState('');
  const [filtroAccion, setFiltroAccion] = useState<AccionAuditoria | 'TODOS'>('TODOS');
  const [filtroObservacion, setFiltroObservacion] = useState('');

  const hayFiltrosActivos =
    filtroComision !== '' ||
    filtroFechaDesde !== '' ||
    filtroFechaHasta !== '' ||
    filtroUsuario !== '' ||
    filtroAccion !== 'TODOS' ||
    filtroObservacion !== '';

  const limpiarFiltros = () => {
    setFiltroComision('');
    setFiltroFechaDesde('');
    setFiltroFechaHasta('');
    setFiltroUsuario('');
    setFiltroAccion('TODOS');
    setFiltroObservacion('');
  };

  const registrosFiltrados = useMemo(() => {
    const qComision = filtroComision.trim().toLowerCase();
    const qUsuario = filtroUsuario.trim().toLowerCase();
    const qObs = filtroObservacion.trim().toLowerCase();
    return auditoria.filter((r) => {
      if (qComision && !r.entidadEtiqueta.toLowerCase().includes(qComision)) return false;
      if (qUsuario && !r.usuario.toLowerCase().includes(qUsuario)) return false;
      if (filtroAccion !== 'TODOS' && r.accion !== filtroAccion) return false;

      const fechaLocal = fechaLocalDeISO(r.fecha);
      if (filtroFechaDesde && fechaLocal < filtroFechaDesde) return false;
      if (filtroFechaHasta && fechaLocal > filtroFechaHasta) return false;

      if (
        qObs &&
        !generarObservacion(r.accion, r.estadoAnterior, r.estadoNuevo).toLowerCase().includes(qObs)
      ) {
        return false;
      }
      return true;
    });
  }, [
    auditoria,
    filtroComision,
    filtroFechaDesde,
    filtroFechaHasta,
    filtroUsuario,
    filtroAccion,
    filtroObservacion,
  ]);

  return (
    <div className="space-y-4">
      {/* Encabezado */}
      <div className="bg-white p-4 border border-[#e0e0e0] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center space-x-3">
          <History className="w-6 h-6 text-[#0f62fe]" />
          <h1 className="text-2xl sm:text-3xl font-bold text-[#161616] tracking-tight">
            HISTORIAL DE COMISIONES
          </h1>
        </div>

        <div className="flex items-center space-x-2.5 px-3.5 py-2 border bg-[#161616] text-white border-[#161616] shadow-xs">
          <span className="text-xs uppercase font-bold tracking-wider">Eventos Registrados</span>
          <span className="text-sm font-mono font-bold px-2 py-0.5 bg-white text-[#161616]">
            {auditoria.length}
          </span>
        </div>
      </div>

      {/* Listado */}
      <div className="bg-white border border-[#e0e0e0] shadow-xs">
        <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#262626] text-[#f4f4f4] text-xs uppercase tracking-wider font-semibold">
              <th className="py-3 px-3.5 border-r border-[#393939]">Comisión</th>
              <th className="py-3 px-3.5 border-r border-[#393939]">Fecha</th>
              <th className="py-3 px-3.5 border-r border-[#393939]">Usuario</th>
              <th className="py-3 px-3.5 border-r border-[#393939]">Tipo de Acción</th>
              <th className="py-3 px-3.5 border-r border-[#393939]">Observaciones</th>
              <th className="py-3 px-3.5 w-14"></th>
            </tr>
            <tr className="bg-[#333333] border-b-2 border-[#0f62fe]">
              <th className="p-2 align-middle border-r border-[#474747]">
                <input
                  type="text"
                  value={filtroComision}
                  onChange={(e) => setFiltroComision(e.target.value)}
                  placeholder="Comisión (ej: COM-2026)..."
                  className={INPUT_FILTRO}
                />
              </th>
              <th className="p-2 align-middle border-r border-[#474747]">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center space-x-1">
                    <span className="text-[10px] text-[#c6c6c6] w-11 shrink-0 font-semibold uppercase">
                      Desde:
                    </span>
                    <input
                      type="date"
                      value={filtroFechaDesde}
                      onChange={(e) => setFiltroFechaDesde(e.target.value)}
                      className={`${INPUT_FILTRO} px-1.5 py-0.5`}
                    />
                  </div>
                  <div className="flex items-center space-x-1">
                    <span className="text-[10px] text-[#c6c6c6] w-11 shrink-0 font-semibold uppercase">
                      Hasta:
                    </span>
                    <input
                      type="date"
                      value={filtroFechaHasta}
                      onChange={(e) => setFiltroFechaHasta(e.target.value)}
                      className={`${INPUT_FILTRO} px-1.5 py-0.5`}
                    />
                  </div>
                </div>
              </th>
              <th className="p-2 align-middle border-r border-[#474747]">
                <input
                  type="text"
                  value={filtroUsuario}
                  onChange={(e) => setFiltroUsuario(e.target.value)}
                  placeholder="Usuario..."
                  className={INPUT_FILTRO}
                />
              </th>
              <th className="p-2 align-middle border-r border-[#474747]">
                <select
                  value={filtroAccion}
                  onChange={(e) => setFiltroAccion(e.target.value as AccionAuditoria | 'TODOS')}
                  className={INPUT_FILTRO}
                >
                  <option value="TODOS">Todas</option>
                  {ACCIONES.map((accion) => (
                    <option key={accion} value={accion}>
                      {ACCION_CONFIG[accion].label}
                    </option>
                  ))}
                </select>
              </th>
              <th className="p-2 align-middle border-r border-[#474747]">
                <input
                  type="text"
                  value={filtroObservacion}
                  onChange={(e) => setFiltroObservacion(e.target.value)}
                  placeholder="Observaciones..."
                  className={INPUT_FILTRO}
                />
              </th>
              <th className="p-2 align-middle text-center">
                {hayFiltrosActivos && (
                  <button
                    onClick={limpiarFiltros}
                    title="Limpiar filtros"
                    className="p-1.5 bg-[#da1e28] hover:bg-[#a2191f] text-white transition-colors cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </th>
            </tr>
          </thead>
          <tbody>
            {registrosFiltrados.length === 0 && (
              <tr>
                <td colSpan={6} className="p-8 text-center text-sm text-[#8d8d8d]">
                  No hay eventos registrados que coincidan con los filtros.
                </td>
              </tr>
            )}
              {registrosFiltrados.map((registro) => {
                const config = ACCION_CONFIG[registro.accion];
                const Icon = config.icon;
                const expandido = expandidoId === registro.id;
                const diffs = calcularDiferencias(registro.estadoAnterior, registro.estadoNuevo);
                const observacion = generarObservacion(
                  registro.accion,
                  registro.estadoAnterior,
                  registro.estadoNuevo
                );
                const tieneDetalle = registro.accion === 'EDITAR' && diffs.length > 0;

                return (
                  <React.Fragment key={registro.id}>
                    <tr className="border-b border-[#e0e0e0] hover:bg-[#f4f8ff] transition-colors">
                      <td className="py-3 px-3.5 border-r border-[#e0e0e0] text-xs text-[#0f62fe] font-bold font-mono align-top whitespace-nowrap">
                        {registro.entidadEtiqueta}
                      </td>
                      <td className="py-3 px-3.5 border-r border-[#e0e0e0] text-sm text-[#161616] font-mono font-medium align-top whitespace-nowrap">
                        {formatearFecha(registro.fecha)}{' '}
                        {new Date(registro.fecha).toLocaleTimeString('es-AR', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="py-3 px-3.5 border-r border-[#e0e0e0] text-sm text-[#161616] font-mono align-top whitespace-nowrap">
                        {registro.usuario}
                      </td>
                      <td className="py-3 px-3.5 border-r border-[#e0e0e0] align-top whitespace-nowrap">
                        <span
                          className={`inline-flex items-center space-x-1.5 px-2.5 py-1 text-xs font-bold uppercase tracking-wider ${config.classes}`}
                        >
                          <Icon className="w-3.5 h-3.5" />
                          <span>{config.label}</span>
                        </span>
                      </td>
                      <td className="py-3 px-3.5 border-r border-[#e0e0e0] text-sm text-[#161616] align-top">
                        {observacion}
                      </td>
                      <td className="py-3 px-3.5 align-top text-center">
                        {tieneDetalle && (
                          <button
                            onClick={() => setExpandidoId(expandido ? null : registro.id)}
                            title="Ver detalle campo por campo"
                            className="p-1.5 text-[#525252] hover:bg-[#e0e0e0] transition-colors cursor-pointer"
                          >
                            {expandido ? (
                              <ChevronUp className="w-4 h-4" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
                          </button>
                        )}
                      </td>
                    </tr>

                    {expandido && tieneDetalle && (
                      <tr className="border-b border-[#e0e0e0] bg-[#f4f4f4]">
                        <td colSpan={6} className="p-3">
                          <table className="w-full text-xs border border-[#e0e0e0] bg-white">
                            <thead>
                              <tr className="bg-white text-[#525252] uppercase text-[10px] tracking-wide">
                                <th className="text-left p-2 font-bold border-b border-[#e0e0e0]">Campo</th>
                                <th className="text-left p-2 font-bold border-b border-[#e0e0e0]">Antes</th>
                                <th className="text-left p-2 font-bold border-b border-[#e0e0e0]">Después</th>
                              </tr>
                            </thead>
                            <tbody>
                              {diffs.map(({ campo, antes, despues }) => (
                                <tr key={campo} className="border-b border-[#e0e0e0] last:border-b-0">
                                  <td className="p-2 font-semibold text-[#161616] align-top">
                                    {etiquetaCampo(campo)}
                                  </td>
                                  <td className="p-2 text-[#da1e28] align-top">{formatearValor(antes)}</td>
                                  <td className="p-2 text-[#0e6027] align-top">{formatearValor(despues)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Barra de estado inferior */}
        <div className="bg-[#f4f4f4] px-4 py-2 border-t border-[#e0e0e0] flex items-center justify-between text-xs text-[#525252]">
          <span>
            Mostrando <strong>{registrosFiltrados.length}</strong> de{' '}
            <strong>{auditoria.length}</strong> eventos registrados
          </span>
        </div>
      </div>
    </div>
  );
};
