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
  Search,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { AccionAuditoria } from '../types';
import { formatearFecha } from '../utils/maintenance';

const ACCION_CONFIG: Record<
  AccionAuditoria,
  { label: string; icon: React.ElementType; classes: string }
> = {
  CREAR: {
    label: 'Creación',
    icon: Plus,
    classes: 'bg-[#defbe6] text-[#0e6027] border border-[#a7f0ba]',
  },
  EDITAR: {
    label: 'Edición',
    icon: Pencil,
    classes: 'bg-[#edf5ff] text-[#0043ce] border border-[#a6c8ff]',
  },
  CANCELAR: {
    label: 'Cancelación',
    icon: Ban,
    classes: 'bg-[#fef3d6] text-[#8a6100] border border-[#fddc69]',
  },
  ELIMINAR: {
    label: 'Eliminación',
    icon: Trash2,
    classes: 'bg-[#ffebee] text-[#da1e28] border border-[#ffb3b8]',
  },
  CERRAR: {
    label: 'Cierre',
    icon: CheckCircle2,
    classes: 'bg-[#f6f2ff] text-[#6929c4] border border-[#d4bbff]',
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
      return 'Se eliminó la comisión definitivamente.';

    default:
      return '';
  }
}

export const LogsComisionesView: React.FC = () => {
  const { auditoria } = useApp();
  const [busqueda, setBusqueda] = useState('');
  const [filtroAccion, setFiltroAccion] = useState<AccionAuditoria | 'TODOS'>('TODOS');
  const [expandidoId, setExpandidoId] = useState<string | null>(null);

  const registrosFiltrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return auditoria.filter((r) => {
      const coincideBusqueda =
        q === '' ||
        r.entidadEtiqueta.toLowerCase().includes(q) ||
        r.usuario.toLowerCase().includes(q);
      const coincideAccion = filtroAccion === 'TODOS' || r.accion === filtroAccion;
      return coincideBusqueda && coincideAccion;
    });
  }, [auditoria, busqueda, filtroAccion]);

  const ACCIONES: (AccionAuditoria | 'TODOS')[] = [
    'TODOS',
    'CREAR',
    'EDITAR',
    'CANCELAR',
    'CERRAR',
    'ELIMINAR',
  ];

  return (
    <div className="space-y-4">
      {/* Encabezado */}
      <div className="bg-white p-4 border border-[#e0e0e0] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center space-x-3">
          <History className="w-6 h-6 text-[#6929c4]" />
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

      {/* Filtros */}
      <div className="bg-white p-4 border border-[#e0e0e0] flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#8d8d8d] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por código de comisión o usuario..."
            className="w-full pl-9 pr-3 py-2 border border-[#e0e0e0] text-sm focus:outline-none focus:border-[#0f62fe]"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {ACCIONES.map((accion) => (
            <button
              key={accion}
              onClick={() => setFiltroAccion(accion)}
              className={`px-3 py-1.5 text-xs font-semibold uppercase tracking-wide border transition-colors cursor-pointer ${
                filtroAccion === accion
                  ? 'bg-[#161616] text-white border-[#161616]'
                  : 'bg-white text-[#525252] border-[#e0e0e0] hover:border-[#8d8d8d]'
              }`}
            >
              {accion === 'TODOS' ? 'Todos' : ACCION_CONFIG[accion].label}
            </button>
          ))}
        </div>
      </div>

      {/* Listado */}
      <div className="bg-white border border-[#e0e0e0] overflow-x-auto">
        {registrosFiltrados.length === 0 ? (
          <div className="p-8 text-center text-sm text-[#8d8d8d]">
            No hay eventos registrados que coincidan con la búsqueda.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#161616] text-white text-xs uppercase tracking-wide">
                <th className="text-left p-3 font-bold">Comisión</th>
                <th className="text-left p-3 font-bold">Fecha</th>
                <th className="text-left p-3 font-bold">Tipo de Acción</th>
                <th className="text-left p-3 font-bold">Observaciones</th>
                <th className="p-3 font-bold w-10"></th>
              </tr>
            </thead>
            <tbody>
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
                    <tr className="border-b border-[#e0e0e0] hover:bg-[#f4f4f4] transition-colors">
                      <td className="p-3 font-mono font-semibold text-[#161616] align-top whitespace-nowrap">
                        {registro.entidadEtiqueta}
                      </td>
                      <td className="p-3 text-xs text-[#525252] align-top whitespace-nowrap font-mono">
                        {formatearFecha(registro.fecha)}{' '}
                        {new Date(registro.fecha).toLocaleTimeString('es-AR', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="p-3 align-top whitespace-nowrap">
                        <span
                          className={`inline-flex items-center space-x-1.5 px-2.5 py-1 text-xs font-bold uppercase tracking-wide ${config.classes}`}
                        >
                          <Icon className="w-3.5 h-3.5" />
                          <span>{config.label}</span>
                        </span>
                      </td>
                      <td className="p-3 text-[#161616] align-top">{observacion}</td>
                      <td className="p-3 align-top text-right">
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
                        <td colSpan={5} className="p-3">
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
        )}
      </div>
    </div>
  );
};
