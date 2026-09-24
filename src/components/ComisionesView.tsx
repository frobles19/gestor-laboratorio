import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Plus,
  Filter,
  CheckCircle2,
  Truck,
  Plane,
  PlaneTakeoff,
  PlaneLanding,
  Eye,
  Play,
  X,
  RotateCcw,
  Wrench,
  ChevronDown,
  Clock,
  Ban,
  Trash2,
  AlertCircle,
  Pencil,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import {
  ComisionServicio,
  EstadoComision,
  MedioTransporte,
} from '../types';
import {
  formatearFecha,
  calcularDiscrepanciaDias,
} from '../utils/maintenance';
import { NuevaComisionModal } from './NuevaComisionModal';
import { CierreComisionWizard } from './CierreComisionWizard';
import { DetalleComisionModal } from './DetalleComisionModal';

export const ComisionesView: React.FC = () => {
  const { comisiones, aeropuertos, nomina, cancelarComision, eliminarComision } = useApp();
  const [errorAccion, setErrorAccion] = useState<string | null>(null);

  // Estados de Modales
  const [modalNuevoOpen, setModalNuevoOpen] = useState(false);
  const [comisionParaCerrar, setComisionParaCerrar] = useState<ComisionServicio | null>(null);
  const [comisionParaDetalle, setComisionParaDetalle] = useState<ComisionServicio | null>(null);

  // Modal de Cancelar/Eliminar Comisión (el botón "Eliminar" abre una elección entre ambas acciones)
  const [comisionParaAccion, setComisionParaAccion] = useState<ComisionServicio | null>(null);
  const [pasoAccion, setPasoAccion] = useState<'elegir' | 'confirmarCancelar' | 'confirmarEliminar'>(
    'elegir'
  );
  const [motivoCancelacionInput, setMotivoCancelacionInput] = useState('');

  // Filtro superior principal: Tipo de Mantenimiento (selección múltiple)
  const TODOS_TIPOS_MANTENIMIENTO = [
    'Verificación',
    'Preventivo',
    'Correctivo',
    'Otros',
  ] as const;
  type OpcionTipoMantenimiento = (typeof TODOS_TIPOS_MANTENIMIENTO)[number];

  const [filtrosTipoMantenimiento, setFiltrosTipoMantenimiento] = useState<
    OpcionTipoMantenimiento[]
  >([...TODOS_TIPOS_MANTENIMIENTO]);

  const toggleFiltroTipo = (tipo: OpcionTipoMantenimiento) => {
    setFiltrosTipoMantenimiento((prev) =>
      prev.includes(tipo) ? prev.filter((t) => t !== tipo) : [...prev, tipo]
    );
  };

  // Filtros individuales por columna
  const [filtroFechaDesde, setFiltroFechaDesde] = useState('');
  const [filtroFechaHasta, setFiltroFechaHasta] = useState('');
  const [filtroColDestino, setFiltroColDestino] = useState('');
  const [filtroColTecnico, setFiltroColTecnico] = useState('');

  // Filtros de selección múltiple para Transporte y Estado
  const TODOS_TRANSPORTES: MedioTransporte[] = ['Terrestre', 'Aéreo'];
  const TODOS_ESTADOS: EstadoComision[] = ['Planificada', 'En Curso', 'Finalizada', 'Cancelada'];

  const [filtrosTransporte, setFiltrosTransporte] = useState<MedioTransporte[]>([
    ...TODOS_TRANSPORTES,
  ]);
  const [filtrosEstado, setFiltrosEstado] = useState<EstadoComision[]>([
    ...TODOS_ESTADOS,
  ]);

  const toggleFiltroCardEstado = (estado: EstadoComision | 'TODOS') => {
    if (estado === 'TODOS') {
      setFiltrosEstado([...TODOS_ESTADOS]);
    } else {
      if (filtrosEstado.length === 1 && filtrosEstado[0] === estado) {
        setFiltrosEstado([...TODOS_ESTADOS]);
      } else {
        setFiltrosEstado([estado]);
      }
    }
  };

  const [menuTransporteAbierto, setMenuTransporteAbierto] = useState(false);
  const [menuEstadoAbierto, setMenuEstadoAbierto] = useState(false);
  const menuTransporteRef = useRef<HTMLDivElement>(null);
  const menuEstadoRef = useRef<HTMLDivElement>(null);

  // Cerrar menús al hacer click afuera
  useEffect(() => {
    const handleClickAfuera = (event: MouseEvent) => {
      if (
        menuTransporteRef.current &&
        !menuTransporteRef.current.contains(event.target as Node)
      ) {
        setMenuTransporteAbierto(false);
      }
      if (
        menuEstadoRef.current &&
        !menuEstadoRef.current.contains(event.target as Node)
      ) {
        setMenuEstadoAbierto(false);
      }
    };

    document.addEventListener('mousedown', handleClickAfuera);
    return () => document.removeEventListener('mousedown', handleClickAfuera);
  }, []);

  // Controladores de selección múltiple
  const todosTransportesSeleccionados =
    filtrosTransporte.length === TODOS_TRANSPORTES.length;

  const toggleTransporte = (opcion: MedioTransporte) => {
    setFiltrosTransporte((prev) => {
      if (prev.includes(opcion)) {
        return prev.filter((x) => x !== opcion);
      } else {
        return [...prev, opcion];
      }
    });
  };

  const toggleTodosTransporte = () => {
    setFiltrosTransporte((prev) => {
      if (prev.length === TODOS_TRANSPORTES.length) {
        return [];
      } else {
        return [...TODOS_TRANSPORTES];
      }
    });
  };

  const todosEstadosSeleccionados =
    filtrosEstado.length === TODOS_ESTADOS.length;

  const toggleEstado = (opcion: EstadoComision) => {
    setFiltrosEstado((prev) => {
      if (prev.includes(opcion)) {
        return prev.filter((x) => x !== opcion);
      } else {
        return [...prev, opcion];
      }
    });
  };

  const toggleTodosEstado = () => {
    setFiltrosEstado((prev) => {
      if (prev.length === TODOS_ESTADOS.length) {
        return [];
      } else {
        return [...TODOS_ESTADOS];
      }
    });
  };

  // Tipos de mantenimiento de la comisión: se leen directamente del campo estructurado
  // (ya no se infieren por coincidencia de texto libre en el objetivo, que era frágil
  // ante errores de tipeo o redacciones no previstas).
  const obtenerTiposComision = (com: ComisionServicio): OpcionTipoMantenimiento[] =>
    com.tiposMantenimiento.length > 0 ? com.tiposMantenimiento : ['Otros'];

  // Estadísticas KPI por Estado de Comisión (Totales, Planificadas, En Curso, Finalizadas, Canceladas)
  const statsEstado = useMemo(() => {
    const total = comisiones.length;
    let planificada = 0;
    let enCurso = 0;
    let finalizada = 0;
    let cancelada = 0;

    comisiones.forEach((com) => {
      if (com.estado === 'Planificada') planificada++;
      else if (com.estado === 'En Curso') enCurso++;
      else if (com.estado === 'Finalizada') finalizada++;
      else if (com.estado === 'Cancelada') cancelada++;
    });

    return { total, planificada, enCurso, finalizada, cancelada };
  }, [comisiones]);

  // Flag de si hay algún filtro activo
  const hayFiltrosActivos =
    filtrosTipoMantenimiento.length !== TODOS_TIPOS_MANTENIMIENTO.length ||
    filtroFechaDesde !== '' ||
    filtroFechaHasta !== '' ||
    filtroColDestino.trim() !== '' ||
    filtroColTecnico.trim() !== '' ||
    filtrosTransporte.length !== TODOS_TRANSPORTES.length ||
    filtrosEstado.length !== TODOS_ESTADOS.length;

  const limpiarTodosLosFiltros = () => {
    setFiltrosTipoMantenimiento([...TODOS_TIPOS_MANTENIMIENTO]);
    setFiltroFechaDesde('');
    setFiltroFechaHasta('');
    setFiltroColDestino('');
    setFiltroColTecnico('');
    setFiltrosTransporte([...TODOS_TRANSPORTES]);
    setFiltrosEstado([...TODOS_ESTADOS]);
  };

  // Lista filtrada de comisiones considerando todos los filtros
  const comisionesFiltradas = useMemo(() => {
    return comisiones.filter((com) => {
      // 1. Filtro superior: Tipo de Mantenimiento (selección múltiple)
      if (filtrosTipoMantenimiento.length < TODOS_TIPOS_MANTENIMIENTO.length) {
        const tipos = obtenerTiposComision(com);
        const coincide = tipos.some((t) => filtrosTipoMantenimiento.includes(t));
        if (!coincide) return false;
      }

      // 2. Filtro columna Fechas: Rango de Fechas (Desde - Hasta)
      const comSalida = com.fechaSalidaReal || com.fechaSalida;
      const comRegreso = com.fechaRegresoReal || com.fechaRegreso;

      if (filtroFechaDesde) {
        if (comRegreso < filtroFechaDesde) return false;
      }
      if (filtroFechaHasta) {
        if (comSalida > filtroFechaHasta) return false;
      }

      // 3. Filtro columna Destinos (soporta múltiples destinos separados por coma)
      const terminosDestino = filtroColDestino
        .split(',')
        .map((s) =>
          s
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .trim()
        )
        .filter(Boolean);

      if (terminosDestino.length > 0) {
        const todosDestinosCoinciden = terminosDestino.every((term) => {
          return com.destinosAeropuertos.some((d) => {
            const dNorm = d
              .toLowerCase()
              .normalize('NFD')
              .replace(/[\u0300-\u036f]/g, '');
            const aero = aeropuertos.find(
              (a) => a.codigoIATA.toLowerCase() === d.toLowerCase()
            );
            const nombreNorm = aero?.nombreOficial
              ? aero.nombreOficial
                  .toLowerCase()
                  .normalize('NFD')
                  .replace(/[\u0300-\u036f]/g, '')
              : '';

            return dNorm.includes(term) || nombreNorm.includes(term);
          });
        });

        if (!todosDestinosCoinciden) return false;
      }

      // 4. Filtro columna Técnicos (soporta múltiples técnicos separados por coma)
      const terminosTecnico = filtroColTecnico
        .split(',')
        .map((s) =>
          s
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .trim()
        )
        .filter(Boolean);

      if (terminosTecnico.length > 0) {
        const todosTecnicosCoinciden = terminosTecnico.every((term) => {
          return com.tecnicosIds.some((tid) => {
            const t = nomina.find((x) => x.id === tid);
            if (!t) return false;
            const apellidoNorm = t.apellido
              .toLowerCase()
              .normalize('NFD')
              .replace(/[\u0300-\u036f]/g, '');
            const nombreNorm = t.nombre
              .toLowerCase()
              .normalize('NFD')
              .replace(/[\u0300-\u036f]/g, '');
            const completoNorm = `${t.apellido} ${t.nombre}`
              .toLowerCase()
              .normalize('NFD')
              .replace(/[\u0300-\u036f]/g, '');
            const puestoNorm = t.puesto
              .toLowerCase()
              .normalize('NFD')
              .replace(/[\u0300-\u036f]/g, '');

            return (
              apellidoNorm.includes(term) ||
              nombreNorm.includes(term) ||
              completoNorm.includes(term) ||
              puestoNorm.includes(term)
            );
          });
        });

        if (!todosTecnicosCoinciden) return false;
      }

      // 5. Filtro columna Transporte (selección múltiple)
      if (filtrosTransporte.length < TODOS_TRANSPORTES.length) {
        if (!filtrosTransporte.includes(com.medioTransporte)) return false;
      }

      // 6. Filtro columna Estado (selección múltiple)
      if (filtrosEstado.length < TODOS_ESTADOS.length) {
        if (!filtrosEstado.includes(com.estado)) return false;
      }

      return true;
    });
  }, [
    comisiones,
    aeropuertos,
    filtrosTipoMantenimiento,
    filtroFechaDesde,
    filtroFechaHasta,
    filtroColDestino,
    filtroColTecnico,
    filtrosTransporte,
    filtrosEstado,
    nomina,
  ]);

  const abrirCierreDesdeDetalle = (com: ComisionServicio) => {
    setComisionParaDetalle(null);
    setComisionParaCerrar(com);
  };

  const abrirAccionesComision = (com: ComisionServicio) => {
    setComisionParaAccion(com);
    setPasoAccion('elegir');
    setMotivoCancelacionInput('');
  };

  const cerrarAccionesComision = () => {
    setComisionParaAccion(null);
    setPasoAccion('elegir');
    setMotivoCancelacionInput('');
  };

  const confirmarCancelacion = () => {
    if (!comisionParaAccion) return;
    try {
      cancelarComision(comisionParaAccion.id, motivoCancelacionInput.trim() || undefined);
      setErrorAccion(null);
    } catch (err) {
      setErrorAccion(err instanceof Error ? err.message : 'No se pudo cancelar la comisión.');
    }
    cerrarAccionesComision();
  };

  const confirmarEliminacion = () => {
    if (!comisionParaAccion) return;
    try {
      eliminarComision(comisionParaAccion.id);
      setErrorAccion(null);
    } catch (err) {
      setErrorAccion(err instanceof Error ? err.message : 'No se pudo eliminar la comisión.');
    }
    cerrarAccionesComision();
  };

  return (
    <div className="space-y-4">
      {errorAccion && (
        <div className="bg-[#fff1f1] border-l-4 border-[#da1e28] p-3 text-xs text-[#da1e28] flex items-center justify-between space-x-2">
          <span className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorAccion}</span>
          </span>
          <button
            onClick={() => setErrorAccion(null)}
            className="text-[#da1e28] hover:bg-[#ffb3b8] p-1 shrink-0"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Primer Renglón: Título, Total de Comisiones y Acción Nueva Comisión */}
      <div className="bg-white p-4 border border-[#e0e0e0] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#161616] tracking-tight">
            CONTROL DE COMISIONES
          </h1>
        </div>

        <div className="flex items-center flex-wrap gap-2.5">
          {/* Botón Total Comisiones en el primer renglón */}
          <button
            onClick={() => toggleFiltroCardEstado('TODOS')}
            title="Mostrar todas las comisiones"
            className={`flex items-center space-x-2.5 px-3.5 py-2 border transition-all cursor-pointer ${
              filtrosEstado.length === TODOS_ESTADOS.length
                ? 'bg-[#161616] text-white border-[#161616] shadow-xs'
                : 'bg-white text-[#161616] border-[#e0e0e0] hover:border-[#8d8d8d]'
            }`}
          >
            <span className="text-xs uppercase font-bold tracking-wider">
              Total Comisiones
            </span>
            <span
              className={`text-sm font-mono font-bold px-2 py-0.5 ${
                filtrosEstado.length === TODOS_ESTADOS.length
                  ? 'bg-white text-[#161616]'
                  : 'bg-[#f4f4f4] text-[#161616] border border-[#e0e0e0]'
              }`}
            >
              {statsEstado.total}
            </span>
          </button>

          {/* Botón + NUEVA COMISIÓN */}
          <button
            onClick={() => setModalNuevoOpen(true)}
            className="flex items-center space-x-1.5 px-4 py-2.5 bg-[#0f62fe] hover:bg-[#0353e9] text-white text-sm font-bold tracking-wide transition-colors shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>NUEVA COMISIÓN</span>
          </button>
        </div>
      </div>

      {/* Segundo Renglón: KPI Cards de Estados (Planificadas, En Curso, Finalizadas, Canceladas) uno al lado del otro */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* 1. Planificadas */}
        <button
          onClick={() => toggleFiltroCardEstado('Planificada')}
          className={`p-3.5 text-left border transition-all cursor-pointer ${
            filtrosEstado.length === 1 && filtrosEstado[0] === 'Planificada'
              ? 'bg-white border-[#0f62fe] shadow-xs ring-1 ring-[#0f62fe]'
              : 'bg-white border-[#e0e0e0] hover:border-[#8d8d8d]'
          }`}
        >
          <div className="text-xs uppercase font-bold text-[#0043ce] tracking-wider flex items-center justify-between">
            <span>Planificadas</span>
            <Clock className="w-4 h-4 text-[#0f62fe]" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold font-mono text-[#0043ce] mt-1">
            {statsEstado.planificada}
          </div>
          <div className="text-xs text-[#525252] mt-1">Próximas a ejecutarse</div>
        </button>

        {/* 2. En Curso */}
        <button
          onClick={() => toggleFiltroCardEstado('En Curso')}
          className={`p-3.5 text-left border transition-all cursor-pointer ${
            filtrosEstado.length === 1 && filtrosEstado[0] === 'En Curso'
              ? 'bg-white border-[#b28600] shadow-xs ring-1 ring-[#b28600]'
              : 'bg-white border-[#e0e0e0] hover:border-[#8d8d8d]'
          }`}
        >
          <div className="text-xs uppercase font-bold text-[#8a6d00] tracking-wider flex items-center justify-between">
            <span>En Curso</span>
            <span className="flex items-center space-x-1">
              <span className="w-2 h-2 rounded-full bg-[#b28600] animate-pulse"></span>
              <Play className="w-3.5 h-3.5 text-[#8a6d00]" />
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-bold font-mono text-[#8a6d00] mt-1">
            {statsEstado.enCurso}
          </div>
          <div className="text-xs text-[#525252] mt-1">En despliegue activo</div>
        </button>

        {/* 3. Finalizadas */}
        <button
          onClick={() => toggleFiltroCardEstado('Finalizada')}
          className={`p-3.5 text-left border transition-all cursor-pointer ${
            filtrosEstado.length === 1 && filtrosEstado[0] === 'Finalizada'
              ? 'bg-white border-[#0e6027] shadow-xs ring-1 ring-[#0e6027]'
              : 'bg-white border-[#e0e0e0] hover:border-[#8d8d8d]'
          }`}
        >
          <div className="text-xs uppercase font-bold text-[#0e6027] tracking-wider flex items-center justify-between">
            <span>Finalizadas</span>
            <CheckCircle2 className="w-4 h-4 text-[#0e6027]" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold font-mono text-[#0e6027] mt-1">
            {statsEstado.finalizada}
          </div>
          <div className="text-xs text-[#525252] mt-1">Cerradas y cumplimentadas</div>
        </button>

        {/* 4. Canceladas */}
        <button
          onClick={() => toggleFiltroCardEstado('Cancelada')}
          className={`p-3.5 text-left border transition-all cursor-pointer ${
            filtrosEstado.length === 1 && filtrosEstado[0] === 'Cancelada'
              ? 'bg-white border-[#da1e28] shadow-xs ring-1 ring-[#da1e28]'
              : 'bg-white border-[#e0e0e0] hover:border-[#8d8d8d]'
          }`}
        >
          <div className="text-xs uppercase font-bold text-[#da1e28] tracking-wider flex items-center justify-between">
            <span>Canceladas</span>
            <X className="w-4 h-4 text-[#da1e28]" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold font-mono text-[#da1e28] mt-1">
            {statsEstado.cancelada}
          </div>
          <div className="text-xs text-[#525252] mt-1">No se realizaron</div>
        </button>
      </div>

      {/* Barra de Filtros por Tipo de Mantenimiento y Búsqueda */}
      <div className="bg-white p-3.5 border border-[#e0e0e0] flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Filtros de Pestañas por Tipo de Mantenimiento */}
        <div className="flex items-center space-x-1.5 w-full sm:w-auto overflow-x-auto">
          <span className="text-xs font-bold text-[#525252] mr-2 flex items-center space-x-1 shrink-0">
            <Filter className="w-4 h-4 text-[#0f62fe]" />
            <span>TIPO DE MANTENIMIENTO:</span>
          </span>

          {TODOS_TIPOS_MANTENIMIENTO.map((tipo) => {
            const estaSeleccionado = filtrosTipoMantenimiento.includes(tipo);
            return (
              <button
                key={tipo}
                onClick={() => toggleFiltroTipo(tipo)}
                className={`px-3 py-1.5 text-xs font-bold border transition-colors whitespace-nowrap cursor-pointer ${
                  estaSeleccionado
                    ? 'bg-[#161616] text-white border-[#161616]'
                    : 'bg-[#f4f4f4] text-[#161616] border-[#e0e0e0] hover:bg-[#e0e0e0]'
                }`}
              >
                {tipo}
              </button>
            );
          })}
        </div>

        {/* Botón de Reset si hay filtros activos */}
        {hayFiltrosActivos && (
          <div className="flex items-center">
            <button
              onClick={limpiarTodosLosFiltros}
              title="Restablecer todos los filtros"
              className="px-3 py-1.5 bg-[#f4f4f4] hover:bg-[#e0e0e0] text-[#161616] border border-[#8d8d8d] text-xs font-bold flex items-center space-x-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 text-[#da1e28]" />
              <span>Restablecer Filtros</span>
            </button>
          </div>
        )}
      </div>

      {/* Tabla de Comisiones con Filtrado Individual por Cada Columna */}
      <div className="bg-white border border-[#e0e0e0] shadow-xs">
        <div className="overflow-x-auto min-h-[380px]">
          <table className="w-full text-left border-collapse">
            <thead>
              {/* Fila 1: Títulos de Cabecera (Columna de acciones SIN TEXTO) */}
              <tr className="bg-[#262626] text-[#f4f4f4] text-xs uppercase tracking-wider font-semibold">
                <th className="py-3 px-3.5 border-r border-[#393939] min-w-[210px]">Fechas</th>
                <th className="py-3 px-3.5 border-r border-[#393939] min-w-[130px]">Destinos</th>
                <th className="py-3 px-3.5 border-r border-[#393939] min-w-[190px]">Técnicos</th>
                <th className="py-3 px-3.5 border-r border-[#393939] w-36 text-center">
                  Transporte
                </th>
                <th className="py-3 px-3.5 border-r border-[#393939] w-36 text-center">Estado</th>
                <th className="py-3 px-3.5 text-center w-28"></th>
              </tr>

              {/* Fila 2: FILTROS INDIVIDUALES POR COLUMNA */}
              <tr className="bg-[#333333] border-b-2 border-[#0f62fe]">
                {/* 1. Filtro Columna Fechas: Rango de Fechas (Desde / Hasta) */}
                <th className="p-2 border-r border-[#474747] min-w-[210px]">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center space-x-1">
                      <span className="text-[10px] text-[#c6c6c6] w-11 shrink-0 font-semibold uppercase">
                        Desde:
                      </span>
                      <input
                        type="date"
                        value={filtroFechaDesde}
                        onChange={(e) => setFiltroFechaDesde(e.target.value)}
                        className="w-full bg-[#161616] text-white border border-[#525252] px-1.5 py-0.5 text-xs font-mono focus:outline-hidden focus:border-[#0f62fe]"
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
                        className="w-full bg-[#161616] text-white border border-[#525252] px-1.5 py-0.5 text-xs font-mono focus:outline-hidden focus:border-[#0f62fe]"
                      />
                    </div>
                  </div>
                </th>

                {/* 2. Filtro Columna Destinos: Escribiendo */}
                <th className="p-2 border-r border-[#474747]">
                  <input
                    type="text"
                    value={filtroColDestino}
                    onChange={(e) => setFiltroColDestino(e.target.value)}
                    placeholder="Destinos (ej: EZE, COR)..."
                    className="w-full bg-[#161616] text-white border border-[#525252] px-2 py-1 text-xs font-mono placeholder-[#8d8d8d] focus:outline-hidden focus:border-[#0f62fe]"
                  />
                </th>

                {/* 3. Filtro Columna Técnicos: Escribiendo */}
                <th className="p-2 border-r border-[#474747]">
                  <input
                    type="text"
                    value={filtroColTecnico}
                    onChange={(e) => setFiltroColTecnico(e.target.value)}
                    placeholder="Técnicos (ej: Gómez, Méndez)..."
                    className="w-full bg-[#161616] text-white border border-[#525252] px-2 py-1 text-xs font-mono placeholder-[#8d8d8d] focus:outline-hidden focus:border-[#0f62fe]"
                  />
                </th>

                {/* 4. Filtro Columna Transporte: Selección múltiple */}
                <th className="p-2 border-r border-[#474747] relative">
                  <div className="relative" ref={menuTransporteRef}>
                    <button
                      type="button"
                      onClick={() => {
                        setMenuTransporteAbierto((prev) => !prev);
                        setMenuEstadoAbierto(false);
                      }}
                      className={`w-full flex items-center justify-between px-2 py-1 text-xs border transition-colors cursor-pointer ${
                        filtrosTransporte.length !== TODOS_TRANSPORTES.length
                          ? 'bg-[#0f62fe] text-white border-[#0f62fe] font-semibold'
                          : 'bg-[#161616] text-white border-[#525252] hover:border-[#8d8d8d]'
                      }`}
                    >
                      <span className="truncate">
                        {filtrosTransporte.length === TODOS_TRANSPORTES.length
                          ? 'Todos'
                          : filtrosTransporte.length === 0
                          ? 'Ninguno (0)'
                          : filtrosTransporte.length === 1
                          ? filtrosTransporte[0]
                          : `${filtrosTransporte.length} selecc.`}
                      </span>
                      <ChevronDown className="w-3.5 h-3.5 ml-1 shrink-0 opacity-80" />
                    </button>

                    {menuTransporteAbierto && (
                      <div className="absolute top-full left-0 mt-1 w-44 bg-[#262626] border border-[#525252] shadow-2xl z-40 p-2 text-left">
                        <div className="text-[10px] uppercase font-bold text-[#82cfff] px-1 pb-1 mb-1 border-b border-[#393939] tracking-wider">
                          Transporte
                        </div>

                        {/* Casilla de Todos */}
                        <label className="flex items-center space-x-2 px-1.5 py-1.5 hover:bg-[#333333] cursor-pointer text-xs text-white select-none">
                          <input
                            type="checkbox"
                            checked={todosTransportesSeleccionados}
                            onChange={toggleTodosTransporte}
                            className="w-3.5 h-3.5 accent-[#0f62fe] rounded-none cursor-pointer"
                          />
                          <span className="font-semibold">Todos</span>
                        </label>

                        <div className="my-1 border-t border-[#393939]" />

                        {/* Opciones individuales */}
                        {TODOS_TRANSPORTES.map((tipo) => (
                          <label
                            key={tipo}
                            className="flex items-center space-x-2 px-1.5 py-1.5 hover:bg-[#333333] cursor-pointer text-xs text-white select-none"
                          >
                            <input
                              type="checkbox"
                              checked={filtrosTransporte.includes(tipo)}
                              onChange={() => toggleTransporte(tipo)}
                              className="w-3.5 h-3.5 accent-[#0f62fe] rounded-none cursor-pointer"
                            />
                            <span>{tipo}</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                </th>

                {/* 5. Filtro Columna Estado: Selección múltiple */}
                <th className="p-2 border-r border-[#474747] relative">
                  <div className="relative" ref={menuEstadoRef}>
                    <button
                      type="button"
                      onClick={() => {
                        setMenuEstadoAbierto((prev) => !prev);
                        setMenuTransporteAbierto(false);
                      }}
                      className={`w-full flex items-center justify-between px-2 py-1 text-xs border transition-colors cursor-pointer ${
                        filtrosEstado.length !== TODOS_ESTADOS.length
                          ? 'bg-[#0f62fe] text-white border-[#0f62fe] font-semibold'
                          : 'bg-[#161616] text-white border-[#525252] hover:border-[#8d8d8d]'
                      }`}
                    >
                      <span className="truncate">
                        {filtrosEstado.length === TODOS_ESTADOS.length
                          ? 'Todos'
                          : filtrosEstado.length === 0
                          ? 'Ninguno (0)'
                          : filtrosEstado.length === 1
                          ? filtrosEstado[0]
                          : `${filtrosEstado.length} selecc.`}
                      </span>
                      <ChevronDown className="w-3.5 h-3.5 ml-1 shrink-0 opacity-80" />
                    </button>

                    {menuEstadoAbierto && (
                      <div className="absolute top-full right-0 mt-1 w-48 bg-[#262626] border border-[#525252] shadow-2xl z-40 p-2 text-left">
                        <div className="text-[10px] uppercase font-bold text-[#82cfff] px-1 pb-1 mb-1 border-b border-[#393939] tracking-wider">
                          Estado
                        </div>

                        {/* Casilla de Todos */}
                        <label className="flex items-center space-x-2 px-1.5 py-1.5 hover:bg-[#333333] cursor-pointer text-xs text-white select-none">
                          <input
                            type="checkbox"
                            checked={todosEstadosSeleccionados}
                            onChange={toggleTodosEstado}
                            className="w-3.5 h-3.5 accent-[#0f62fe] rounded-none cursor-pointer"
                          />
                          <span className="font-semibold">Todos</span>
                        </label>

                        <div className="my-1 border-t border-[#393939]" />

                        {/* Opciones individuales */}
                        {TODOS_ESTADOS.map((est) => (
                          <label
                            key={est}
                            className="flex items-center space-x-2 px-1.5 py-1.5 hover:bg-[#333333] cursor-pointer text-xs text-white select-none"
                          >
                            <input
                              type="checkbox"
                              checked={filtrosEstado.includes(est)}
                              onChange={() => toggleEstado(est)}
                              className="w-3.5 h-3.5 accent-[#0f62fe] rounded-none cursor-pointer"
                            />
                            <span>{est}</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                </th>

                {/* 6. Columna Acciones / Botón Limpiar (sin texto) */}
                <th className="p-2 text-center">
                  {hayFiltrosActivos ? (
                    <button
                      onClick={limpiarTodosLosFiltros}
                      title="Limpiar filtros"
                      className="p-1.5 bg-[#da1e28] hover:bg-[#ba1b23] text-white transition-colors cursor-pointer inline-flex items-center justify-center"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  ) : null}
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-[#e0e0e0] text-sm">
              {comisionesFiltradas.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-[#8d8d8d] text-sm">
                    No se encontraron comisiones para los filtros seleccionados.
                  </td>
                </tr>
              ) : (
                comisionesFiltradas.map((com) => {
                  // Reglas de habilitación de acciones según el estado de la comisión.
                  // Los botones siempre se muestran; solo cambia si están habilitados.
                  const puedeCerrar = com.estado === 'Planificada' || com.estado === 'En Curso';
                  const puedeCancelarOEliminar = com.estado !== 'Finalizada';

                  return (
                    <tr
                      key={com.id}
                      className="hover:bg-[#f4f8ff] transition-colors group"
                    >
                      {/* 1. Fechas: Siempre en formato DD/MM/AAAA */}
                      <td className="py-3 px-3.5 border-r border-[#e0e0e0]">
                        <div className="text-xs text-[#0f62fe] font-bold font-mono mb-1">
                          {com.codigo}
                        </div>
                        {/* Arriba la fecha de salida con un dibujo de un avión despegando */}
                        <div className="flex items-center space-x-2 text-sm text-[#161616] font-mono font-medium">
                          <PlaneTakeoff className="w-4 h-4 text-[#0f62fe] shrink-0" />
                          <span>{formatearFecha(com.fechaSalidaReal || com.fechaSalida)}</span>
                        </div>
                        {/* Abajo la fecha de llegada con un dibujo de un avión aterrizando */}
                        <div className="flex items-center space-x-2 text-sm text-[#161616] font-mono font-medium mt-1">
                          <PlaneLanding className="w-4 h-4 text-[#0043ce] shrink-0" />
                          <span>{formatearFecha(com.fechaRegresoReal || com.fechaRegreso)}</span>
                        </div>
                        {/* Si al cerrarse no hubo discrepancia no dice nada; si la hay, en colorado "Extensión de x días" */}
                        {(() => {
                          if (com.estado === 'Finalizada' && com.fechaRegresoReal) {
                            const disc = calcularDiscrepanciaDias(
                              com.fechaRegresoReal,
                              com.fechaRegreso
                            );
                            if (disc !== 0) {
                              return (
                                <div className="text-xs font-bold text-[#da1e28] mt-1 font-mono">
                                  Extensión de {disc} días
                                </div>
                              );
                            }
                          }
                          return null;
                        })()}
                      </td>

                      {/* 2. Destinos: Códigos IATA */}
                      <td className="py-3 px-3.5 border-r border-[#e0e0e0]">
                        <div className="flex flex-wrap gap-1.5">
                          {com.destinosAeropuertos.map((codigo) => (
                            <span
                              key={codigo}
                              className="bg-[#161616] text-white px-2.5 py-1 font-mono font-bold text-xs tracking-wider"
                            >
                              {codigo}
                            </span>
                          ))}
                        </div>
                      </td>

                      {/* 3. Técnicos: Solo nombres de los técnicos */}
                      <td className="py-3 px-3.5 border-r border-[#e0e0e0]">
                        <div className="space-y-1">
                          {com.tecnicosIds.map((tid) => {
                            const t = nomina.find((x) => x.id === tid);
                            if (!t) return null;
                            return (
                              <div key={tid} className="text-sm font-semibold text-[#161616]">
                                <span className="uppercase">{t.apellido}</span>, {t.nombre}
                              </div>
                            );
                          })}
                        </div>
                      </td>

                      {/* 4. Transporte */}
                      <td className="py-3 px-3.5 text-center border-r border-[#e0e0e0]">
                        <span className="w-28 h-7 relative inline-flex items-center text-xs font-semibold text-[#161616] bg-[#f4f4f4] border border-[#e0e0e0]">
                          <span className="absolute left-2.5 flex items-center">
                            {com.medioTransporte === 'Aéreo' ? (
                              <Plane className="w-3.5 h-3.5 text-[#0f62fe] shrink-0" />
                            ) : (
                              <Truck className="w-3.5 h-3.5 text-[#525252] shrink-0" />
                            )}
                          </span>
                          <span className="w-full text-center pl-3">
                            {com.medioTransporte}
                          </span>
                        </span>
                      </td>

                      {/* 5. Estado */}
                      <td className="py-3 px-3.5 text-center border-r border-[#e0e0e0]">
                        <span
                          className={`w-28 h-7 inline-flex items-center justify-center text-xs font-bold uppercase tracking-wider ${
                            com.estado === 'Finalizada'
                              ? 'bg-[#defbe6] text-[#0e6027] border border-[#a7f0ba]'
                              : com.estado === 'En Curso'
                              ? 'bg-[#d0e2ff] text-[#002d9c] border border-[#a6c8ff]'
                              : com.estado === 'Cancelada'
                              ? 'bg-[#fff1f1] text-[#da1e28] border border-[#ffb3b8]'
                              : 'bg-[#fef3d6] text-[#8a6100] border border-[#fddc69]'
                          }`}
                        >
                          {com.estado}
                        </span>
                      </td>

                      {/* 6. Acciones: siempre visibles; según el estado quedan deshabilitadas (color gris) */}
                      <td className="py-3 px-3.5 text-center">
                        <div className="flex items-center justify-center space-x-1.5">
                          {/* Ver Expediente: disponible para cualquier estado */}
                          <button
                            onClick={() => setComisionParaDetalle(com)}
                            title="Ver Expediente"
                            className="p-2 bg-white hover:bg-[#e0e0e0] text-[#0f62fe] border border-[#8d8d8d] transition-colors cursor-pointer"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Cerrar Comisión: solo Planificada / En Curso */}
                          <button
                            onClick={() => puedeCerrar && setComisionParaCerrar(com)}
                            disabled={!puedeCerrar}
                            title={
                              puedeCerrar
                                ? 'Cerrar Comisión'
                                : `No disponible: la comisión está ${com.estado.toLowerCase()}`
                            }
                            className={
                              puedeCerrar
                                ? 'p-2 bg-[#0f62fe] hover:bg-[#0353e9] text-white transition-colors cursor-pointer'
                                : 'p-2 bg-[#f4f4f4] text-[#c6c6c6] border border-[#e0e0e0] cursor-not-allowed'
                            }
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </button>

                          {/* Editar Comisión: funcionalidad pendiente de implementar */}
                          <button
                            disabled
                            title="Editar Comisión (disponible próximamente)"
                            className="p-2 bg-[#f4f4f4] text-[#c6c6c6] border border-[#e0e0e0] cursor-not-allowed"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>

                          {/* Eliminar Comisión: abre la elección entre Cancelar y Eliminar definitivamente */}
                          <button
                            onClick={() => puedeCancelarOEliminar && abrirAccionesComision(com)}
                            disabled={!puedeCancelarOEliminar}
                            title={
                              puedeCancelarOEliminar
                                ? 'Cancelar o Eliminar Comisión'
                                : 'No disponible: la comisión ya está finalizada'
                            }
                            className={
                              puedeCancelarOEliminar
                                ? 'p-2 bg-white hover:bg-[#da1e28] text-[#da1e28] hover:text-white border border-[#ffb3b8] transition-colors cursor-pointer'
                                : 'p-2 bg-[#f4f4f4] text-[#c6c6c6] border border-[#e0e0e0] cursor-not-allowed'
                            }
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Barra de estado inferior */}
        <div className="bg-[#f4f4f4] px-4 py-2 border-t border-[#e0e0e0] flex items-center justify-between text-xs text-[#525252]">
          <span>
            Mostrando <strong>{comisionesFiltradas.length}</strong> de{' '}
            <strong>{comisiones.length}</strong> comisiones de servicio
          </span>
        </div>
      </div>

      {/* Modal Crear Comisión */}
      {modalNuevoOpen && (
        <NuevaComisionModal
          isOpen={modalNuevoOpen}
          onClose={() => setModalNuevoOpen(false)}
        />
      )}

      {/* Modal Guía Interactiva de Cierre */}
      {comisionParaCerrar && (
        <CierreComisionWizard
          comision={comisionParaCerrar}
          isOpen={!!comisionParaCerrar}
          onClose={() => setComisionParaCerrar(null)}
          onComisionCerrada={() => setComisionParaCerrar(null)}
        />
      )}

      {/* Modal Vista de Datos / Expediente Histórico */}
      {comisionParaDetalle && (
        <DetalleComisionModal
          comision={comisionParaDetalle}
          isOpen={!!comisionParaDetalle}
          onClose={() => setComisionParaDetalle(null)}
          onAbrirCierre={() => abrirCierreDesdeDetalle(comisionParaDetalle)}
        />
      )}

      {/* Modal Cancelar / Eliminar Comisión */}
      {comisionParaAccion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white border border-[#393939] shadow-2xl w-full max-w-sm rounded-none overflow-hidden">
            <div className="bg-[#161616] text-white px-5 py-3 flex items-center justify-between border-b border-[#393939]">
              <div>
                <h2 className="text-sm font-semibold tracking-wide uppercase">
                  {pasoAccion === 'elegir' && 'Cancelar / Eliminar Comisión'}
                  {pasoAccion === 'confirmarCancelar' && 'Confirmar Cancelación'}
                  {pasoAccion === 'confirmarEliminar' && 'Confirmar Eliminación'}
                </h2>
                <p className="text-xs text-[#a8a8a8]">{comisionParaAccion.codigo}</p>
              </div>
              <button
                onClick={cerrarAccionesComision}
                className="text-[#a8a8a8] hover:text-white p-1 hover:bg-[#393939] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {pasoAccion === 'elegir' && (
              <>
                <div className="p-5 space-y-3">
                  <p className="text-xs text-[#525252]">
                    Elija qué acción desea realizar sobre esta comisión:
                  </p>

                  <button
                    disabled={comisionParaAccion.estado === 'Cancelada'}
                    onClick={() => setPasoAccion('confirmarCancelar')}
                    className={`w-full flex items-center space-x-2 px-4 py-2.5 text-xs font-bold border transition-colors ${
                      comisionParaAccion.estado === 'Cancelada'
                        ? 'bg-[#f4f4f4] text-[#c6c6c6] border-[#e0e0e0] cursor-not-allowed'
                        : 'bg-white text-[#8a6100] border-[#fddc69] hover:bg-[#fef3d6] cursor-pointer'
                    }`}
                  >
                    <Ban className="w-4 h-4 shrink-0" />
                    <span>
                      {comisionParaAccion.estado === 'Cancelada'
                        ? 'Cancelar Comisión (ya está cancelada)'
                        : 'Cancelar Comisión (no se realizó)'}
                    </span>
                  </button>

                  <button
                    onClick={() => setPasoAccion('confirmarEliminar')}
                    className="w-full flex items-center space-x-2 px-4 py-2.5 bg-white text-[#da1e28] border border-[#ffb3b8] hover:bg-[#fff1f1] text-xs font-bold transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4 shrink-0" />
                    <span>Eliminar Permanentemente</span>
                  </button>
                </div>
                <div className="bg-[#f4f4f4] px-5 py-3 border-t border-[#e0e0e0] flex justify-end">
                  <button
                    onClick={cerrarAccionesComision}
                    className="px-3 py-1.5 border border-[#8d8d8d] text-xs font-medium text-[#161616] hover:bg-[#e0e0e0] transition-colors"
                  >
                    Cerrar
                  </button>
                </div>
              </>
            )}

            {pasoAccion === 'confirmarCancelar' && (
              <>
                <div className="p-5 space-y-3">
                  <p className="text-xs text-[#525252]">
                    La comisión quedará registrada como <strong>Cancelada</strong> y no podrá
                    reactivarse. Puede indicar el motivo (opcional):
                  </p>
                  <textarea
                    value={motivoCancelacionInput}
                    onChange={(e) => setMotivoCancelacionInput(e.target.value)}
                    rows={3}
                    placeholder="Ej: Se pospuso por condiciones climáticas..."
                    className="w-full bg-white border border-[#8d8d8d] p-2 text-xs focus:outline-hidden focus:ring-1 focus:ring-[#0f62fe]"
                  />
                </div>
                <div className="bg-[#f4f4f4] px-5 py-3 border-t border-[#e0e0e0] flex justify-between">
                  <button
                    onClick={() => setPasoAccion('elegir')}
                    className="px-3 py-1.5 border border-[#8d8d8d] text-xs font-medium text-[#161616] hover:bg-[#e0e0e0] transition-colors"
                  >
                    Volver
                  </button>
                  <button
                    onClick={confirmarCancelacion}
                    className="flex items-center space-x-1.5 px-4 py-1.5 bg-[#8a6100] hover:bg-[#6f4e00] text-white text-xs font-bold transition-colors cursor-pointer"
                  >
                    <Ban className="w-3.5 h-3.5" />
                    <span>Confirmar Cancelación</span>
                  </button>
                </div>
              </>
            )}

            {pasoAccion === 'confirmarEliminar' && (
              <>
                <div className="p-5 space-y-3">
                  <p className="text-xs text-[#da1e28]">
                    <strong>Esta acción no se puede deshacer.</strong> Se eliminará
                    definitivamente la comisión {comisionParaAccion.codigo} y toda tarea o
                    novedad asociada.
                  </p>
                </div>
                <div className="bg-[#f4f4f4] px-5 py-3 border-t border-[#e0e0e0] flex justify-between">
                  <button
                    onClick={() => setPasoAccion('elegir')}
                    className="px-3 py-1.5 border border-[#8d8d8d] text-xs font-medium text-[#161616] hover:bg-[#e0e0e0] transition-colors"
                  >
                    Volver
                  </button>
                  <button
                    onClick={confirmarEliminacion}
                    className="flex items-center space-x-1.5 px-4 py-1.5 bg-[#da1e28] hover:bg-[#a2191f] text-white text-xs font-bold transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Sí, Eliminar</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
