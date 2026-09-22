import React, { useState, useMemo } from 'react';
import {
  Radio,
  Plus,
  Search,
  Filter,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Layers,
  Edit2,
  Activity,
  Plane,
  Wrench,
  ChevronDown,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import {
  EquipoInstalado,
  SistemaRadioayuda,
  RegionAeronautica,
  NivelSemaforo,
} from '../types';
import {
  calcularEstadoVencimiento,
  getClasesSemaforo,
  formatearFecha,
} from '../utils/maintenance';
import { ModalEditarEquipo } from './ModalEditarEquipo';

export const RadioayudasView: React.FC = () => {
  const { equipos, modelos, aeropuertos, intervenciones } = useApp();

  const [modalEditarOpen, setModalEditarOpen] = useState(false);
  const [equipoSeleccionado, setEquipoSeleccionado] = useState<EquipoInstalado | null>(null);

  // Filtros
  const [filtroSistema, setFiltroSistema] = useState<'TODOS' | SistemaRadioayuda>('TODOS');
  const [filtroRegion, setFiltroRegion] = useState<'TODAS' | RegionAeronautica>('TODAS');
  const [filtroSemaforo, setFiltroSemaforo] = useState<'TODOS' | 'VENCIDO' | 'PROXIMO_A_VENCER' | 'AL_DIA'>('TODOS');
  const [busqueda, setBusqueda] = useState('');

  // Estadísticas globales de semáforos
  const resumenSemaforos = useMemo(() => {
    let vencidos = 0;
    let proximos = 0;
    let alDia = 0;

    equipos.forEach((eq) => {
      const vAerea = calcularEstadoVencimiento(
        eq.fechaUltimaVerificacionAerea,
        eq.frecuenciaVerificacionAereaMeses
      );
      const mPrev = calcularEstadoVencimiento(
        eq.fechaUltimoMantenimientoPreventivo,
        eq.frecuenciaMantenimientoPreventivoMeses
      );

      // Si cualquiera de los dos está vencido, cuenta como vencido en el equipo
      if (vAerea.nivel === 'VENCIDO' || mPrev.nivel === 'VENCIDO') {
        vencidos++;
      } else if (
        vAerea.nivel === 'PROXIMO_A_VENCER' ||
        mPrev.nivel === 'PROXIMO_A_VENCER'
      ) {
        proximos++;
      } else {
        alDia++;
      }
    });

    return { total: equipos.length, vencidos, proximos, alDia };
  }, [equipos]);

  // Lista filtrada de equipos con cálculo de semáforos
  const equiposConCalculo = useMemo(() => {
    return equipos
      .map((eq) => {
        const modelo = modelos.find((m) => m.id === eq.modeloId);
        const aeropuerto = aeropuertos.find((a) => a.codigoIATA === eq.aeropuertoCodigo);
        const equipoAsociado = equipos.find((e) => e.id === eq.equipoAsociadoId);

        // 1. Semáforo Verificación Aérea
        const estadoVerificacionAerea = calcularEstadoVencimiento(
          eq.fechaUltimaVerificacionAerea,
          eq.frecuenciaVerificacionAereaMeses
        );

        // 2. Semáforo Mantenimiento Preventivo
        const estadoPreventivo = calcularEstadoVencimiento(
          eq.fechaUltimoMantenimientoPreventivo,
          eq.frecuenciaMantenimientoPreventivoMeses
        );

        // Nivel crítico general del equipo
        let nivelCritico: NivelSemaforo = 'AL_DIA';
        if (
          estadoVerificacionAerea.nivel === 'VENCIDO' ||
          estadoPreventivo.nivel === 'VENCIDO'
        ) {
          nivelCritico = 'VENCIDO';
        } else if (
          estadoVerificacionAerea.nivel === 'PROXIMO_A_VENCER' ||
          estadoPreventivo.nivel === 'PROXIMO_A_VENCER'
        ) {
          nivelCritico = 'PROXIMO_A_VENCER';
        }

        return {
          ...eq,
          modelo,
          aeropuerto,
          equipoAsociado,
          estadoVerificacionAerea,
          estadoPreventivo,
          nivelCritico,
        };
      })
      .filter((item) => {
        const coincideSistema =
          filtroSistema === 'TODOS' || item.modelo?.sistema === filtroSistema;
        const coincideRegion =
          filtroRegion === 'TODAS' || item.aeropuerto?.region === filtroRegion;
        const coincideSemaforo =
          filtroSemaforo === 'TODOS' || item.nivelCritico === filtroSemaforo;

        const busqLower = busqueda.toLowerCase();
        const coincideBusqueda =
          item.identificador.toLowerCase().includes(busqLower) ||
          item.aeropuertoCodigo.toLowerCase().includes(busqLower) ||
          (item.aeropuerto?.nombreOficial || '').toLowerCase().includes(busqLower) ||
          (item.modelo?.denominacion || '').toLowerCase().includes(busqLower);

        return (
          coincideSistema && coincideRegion && coincideSemaforo && coincideBusqueda
        );
      });
  }, [equipos, modelos, aeropuertos, filtroSistema, filtroRegion, filtroSemaforo, busqueda]);

  const abrirNuevoEquipo = () => {
    setEquipoSeleccionado(null);
    setModalEditarOpen(true);
  };

  const abrirEdicion = (eq: EquipoInstalado) => {
    setEquipoSeleccionado(eq);
    setModalEditarOpen(true);
  };

  return (
    <div className="space-y-4">
      {/* Barra de Título y Acciones */}
      <div className="bg-white p-4 border border-[#e0e0e0] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-mono font-bold bg-[#393939] text-white px-2 py-0.5">
              MÓDULO 202
            </span>
            <h1 className="text-lg font-bold text-[#161616] tracking-tight">
              INVENTARIO Y SEMÁFOROS DE VENCIMIENTO DE RADIOAYUDAS
            </h1>
          </div>
          <p className="text-xs text-[#525252] mt-0.5">
            Monitoreo en tiempo real de Verificación Aérea en vuelo y Mantenimiento Preventivo
            terrestre con cálculo automático de días límites.
          </p>
        </div>

        <button
          onClick={abrirNuevoEquipo}
          className="flex items-center space-x-2 px-4 py-2 bg-[#0f62fe] hover:bg-[#0353e9] text-white text-xs font-bold tracking-wide transition-colors shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>ALTA DE RADIOAYUDA</span>
        </button>
      </div>

      {/* Tarjetas de Semáforo General */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <button
          onClick={() => setFiltroSemaforo('TODOS')}
          className={`p-3 text-left border transition-all ${
            filtroSemaforo === 'TODOS'
              ? 'bg-white border-[#0f62fe] shadow-xs ring-1 ring-[#0f62fe]'
              : 'bg-white border-[#e0e0e0] hover:border-[#8d8d8d]'
          }`}
        >
          <div className="text-[10px] uppercase font-bold text-[#6f6f6f] tracking-wider">
            Total Radioayudas
          </div>
          <div className="text-2xl font-bold font-mono text-[#161616] mt-0.5">
            {resumenSemaforos.total}
          </div>
          <div className="text-[11px] text-[#525252] mt-1">Activos monitoreados</div>
        </button>

        <button
          onClick={() => setFiltroSemaforo('AL_DIA')}
          className={`p-3 text-left border transition-all ${
            filtroSemaforo === 'AL_DIA'
              ? 'bg-white border-[#198038] shadow-xs ring-1 ring-[#198038]'
              : 'bg-white border-[#e0e0e0] hover:border-[#8d8d8d]'
          }`}
        >
          <div className="text-[10px] uppercase font-bold text-[#0e6027] tracking-wider flex items-center justify-between">
            <span>Al Día (&gt; 30 días)</span>
            <span className="w-2.5 h-2.5 rounded-full bg-[#198038]"></span>
          </div>
          <div className="text-2xl font-bold font-mono text-[#0e6027] mt-0.5">
            {resumenSemaforos.alDia}
          </div>
          <div className="text-[11px] text-[#0e6027] mt-1">Mantenimientos vigentes</div>
        </button>

        <button
          onClick={() => setFiltroSemaforo('PROXIMO_A_VENCER')}
          className={`p-3 text-left border transition-all ${
            filtroSemaforo === 'PROXIMO_A_VENCER'
              ? 'bg-white border-[#f1c21b] shadow-xs ring-1 ring-[#f1c21b]'
              : 'bg-white border-[#e0e0e0] hover:border-[#8d8d8d]'
          }`}
        >
          <div className="text-[10px] uppercase font-bold text-[#8a6100] tracking-wider flex items-center justify-between">
            <span>Próximo a Vencer (≤ 30d)</span>
            <span className="w-2.5 h-2.5 rounded-full bg-[#f1c21b]"></span>
          </div>
          <div className="text-2xl font-bold font-mono text-[#8a6100] mt-0.5">
            {resumenSemaforos.proximos}
          </div>
          <div className="text-[11px] text-[#8a6100] mt-1">Coordinar comisión urgente</div>
        </button>

        <button
          onClick={() => setFiltroSemaforo('VENCIDO')}
          className={`p-3 text-left border transition-all ${
            filtroSemaforo === 'VENCIDO'
              ? 'bg-white border-[#da1e28] shadow-xs ring-1 ring-[#da1e28]'
              : 'bg-white border-[#e0e0e0] hover:border-[#8d8d8d]'
          }`}
        >
          <div className="text-[10px] uppercase font-bold text-[#da1e28] tracking-wider flex items-center justify-between">
            <span>Vencidos (&lt; 0 días)</span>
            <span className="w-2.5 h-2.5 rounded-full bg-[#da1e28] animate-ping"></span>
          </div>
          <div className="text-2xl font-bold font-mono text-[#da1e28] mt-0.5">
            {resumenSemaforos.vencidos}
          </div>
          <div className="text-[11px] text-[#da1e28] mt-1">Periodicidad superada</div>
        </button>
      </div>

      {/* Barra de Filtros Multifacética */}
      <div className="bg-white p-3 border border-[#e0e0e0] space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Filtro por Sistema */}
          <div className="flex items-center space-x-1">
            <span className="text-xs font-semibold text-[#525252] mr-1">SISTEMA:</span>
            {(['TODOS', 'VOR', 'DME', 'ILS'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setFiltroSistema(s)}
                className={`px-2.5 py-1 text-xs font-mono font-semibold border transition-colors ${
                  filtroSistema === s
                    ? 'bg-[#161616] text-white border-[#161616]'
                    : 'bg-[#f4f4f4] text-[#161616] border-[#e0e0e0] hover:bg-[#e0e0e0]'
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          {/* Filtro por Región */}
          <div className="flex items-center space-x-2">
            <span className="text-xs font-semibold text-[#525252]">REGIÓN:</span>
            <select
              value={filtroRegion}
              onChange={(e) => setFiltroRegion(e.target.value as any)}
              className="bg-[#f4f4f4] border border-[#8d8d8d] px-2.5 py-1 text-xs focus:outline-hidden focus:ring-1 focus:ring-[#0f62fe]"
            >
              <option value="TODAS">Todas las Regiones</option>
              <option value="EZEIZA">EZEIZA</option>
              <option value="CORDOBA">CORDOBA</option>
              <option value="RESISTENCIA">RESISTENCIA</option>
              <option value="MENDOZA">MENDOZA</option>
              <option value="COMODORO RIVADAVIA">COMODORO RIVADAVIA</option>
            </select>
          </div>

          {/* Buscador */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-2 text-[#8d8d8d]" />
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar por identificador o aeropuerto..."
              className="w-full pl-9 pr-3 py-1 bg-[#f4f4f4] border border-[#8d8d8d] text-xs focus:outline-hidden focus:ring-1 focus:ring-[#0f62fe] focus:bg-white"
            />
          </div>
        </div>
      </div>

      {/* Tabla Densa de Activos estilo IBM Maximo */}
      <div className="bg-white border border-[#e0e0e0] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#262626] text-[#f4f4f4] text-[11px] uppercase tracking-wider font-semibold">
                <th className="py-2.5 px-3 border-r border-[#393939] w-48">Radioayuda / Activo</th>
                <th className="py-2.5 px-3 border-r border-[#393939] w-36">Aeropuerto / Región</th>
                <th className="py-2.5 px-3 border-r border-[#393939] w-28">Estado Operativo</th>
                <th className="py-2.5 px-3 border-r border-[#393939]">
                  Semáforo 1: Verificación Aérea (Vuelo)
                </th>
                <th className="py-2.5 px-3 border-r border-[#393939]">
                  Semáforo 2: Mantenimiento Preventivo
                </th>
                <th className="py-2.5 px-3 border-r border-[#393939] w-44">Asociación Funcional</th>
                <th className="py-2.5 px-3 text-right w-24">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e0e0e0] text-xs">
              {equiposConCalculo.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-[#8d8d8d] text-xs">
                    No se encontraron radioayudas para los criterios de búsqueda.
                  </td>
                </tr>
              ) : (
                equiposConCalculo.map((item) => {
                  const clasesVA = getClasesSemaforo(item.estadoVerificacionAerea.nivel);
                  const clasesPrev = getClasesSemaforo(item.estadoPreventivo.nivel);

                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-[#f4f8ff] transition-colors"
                    >
                      {/* Identificador y Modelo */}
                      <td className="py-3 px-3 font-mono border-r border-[#e0e0e0]">
                        <div className="font-bold text-[#161616] flex items-center space-x-1.5">
                          <span className="text-[#0f62fe] font-sans font-black">
                            [{item.modelo?.sistema}]
                          </span>
                          <span>{item.identificador}</span>
                        </div>
                        <div className="text-[11px] text-[#525252] font-sans">
                          {item.modelo?.denominacion} ({item.modelo?.fabricante})
                        </div>
                        {item.ubicacionDetalle && (
                          <div className="text-[10px] text-[#8d8d8d] font-sans italic truncate max-w-[190px]">
                            {item.ubicacionDetalle}
                          </div>
                        )}
                      </td>

                      {/* Aeropuerto */}
                      <td className="py-3 px-3 border-r border-[#e0e0e0]">
                        <div className="flex items-center space-x-1.5">
                          <span className="font-mono font-bold bg-[#161616] text-white px-1.5 py-0.5 text-xs">
                            {item.aeropuertoCodigo}
                          </span>
                          <span className="font-semibold text-[#161616] truncate max-w-[120px]" title={item.aeropuerto?.nombreOficial}>
                            {item.aeropuerto?.nombreOficial || item.aeropuertoCodigo}
                          </span>
                        </div>
                        <div className="text-[10px] text-[#6f6f6f] mt-0.5 uppercase font-mono">
                          {item.aeropuerto?.region}
                        </div>
                      </td>

                      {/* Estado Operativo */}
                      <td className="py-3 px-3 border-r border-[#e0e0e0]">
                        <span
                          className={`inline-block px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                            item.estadoOperativo === 'EN_SERVICIO'
                              ? 'bg-[#defbe6] text-[#0e6027] border border-[#a7f0ba]'
                              : 'bg-[#ffebee] text-[#da1e28] border border-[#ffb3b8]'
                          }`}
                        >
                          {item.estadoOperativo === 'EN_SERVICIO'
                            ? 'EN SERVICIO'
                            : 'FUERA DE SERV.'}
                        </span>
                      </td>

                      {/* Semáforo 1: Verificación Aérea */}
                      <td className="py-3 px-3 border-r border-[#e0e0e0]">
                        <div className="flex items-center justify-between mb-1">
                          <span
                            className={`inline-flex items-center space-x-1.5 px-2 py-0.5 text-[10px] font-bold ${clasesVA.badge}`}
                          >
                            <span
                              className={`w-2 h-2 rounded-full ${clasesVA.dot}`}
                            ></span>
                            <span>{clasesVA.label}</span>
                          </span>
                          <span className="font-mono text-[11px] font-bold text-[#161616]">
                            {item.estadoVerificacionAerea.diasRestantes >= 0
                              ? `${item.estadoVerificacionAerea.diasRestantes} días rest.`
                              : `Vencido ${Math.abs(item.estadoVerificacionAerea.diasRestantes)}d`}
                          </span>
                        </div>

                        <div className="text-[10px] text-[#525252] space-y-0.5">
                          <div>
                            Última: {formatearFecha(item.fechaUltimaVerificacionAerea)} • Frec:{' '}
                            {item.frecuenciaVerificacionAereaMeses}m
                          </div>
                          <div>
                            Límite:{' '}
                            <strong className="text-[#161616]">
                              {formatearFecha(item.estadoVerificacionAerea.fechaLimite)}
                            </strong>
                          </div>
                        </div>
                      </td>

                      {/* Semáforo 2: Mantenimiento Preventivo */}
                      <td className="py-3 px-3 border-r border-[#e0e0e0]">
                        <div className="flex items-center justify-between mb-1">
                          <span
                            className={`inline-flex items-center space-x-1.5 px-2 py-0.5 text-[10px] font-bold ${clasesPrev.badge}`}
                          >
                            <span
                              className={`w-2 h-2 rounded-full ${clasesPrev.dot}`}
                            ></span>
                            <span>{clasesPrev.label}</span>
                          </span>
                          <span className="font-mono text-[11px] font-bold text-[#161616]">
                            {item.estadoPreventivo.diasRestantes >= 0
                              ? `${item.estadoPreventivo.diasRestantes} días rest.`
                              : `Vencido ${Math.abs(item.estadoPreventivo.diasRestantes)}d`}
                          </span>
                        </div>

                        <div className="text-[10px] text-[#525252] space-y-0.5">
                          <div>
                            Último: {formatearFecha(item.fechaUltimoMantenimientoPreventivo)} • Frec:{' '}
                            {item.frecuenciaMantenimientoPreventivoMeses}m
                          </div>
                          <div>
                            Límite:{' '}
                            <strong className="text-[#161616]">
                              {formatearFecha(item.estadoPreventivo.fechaLimite)}
                            </strong>
                          </div>
                        </div>
                      </td>

                      {/* Asociación Funcional */}
                      <td className="py-3 px-3 border-r border-[#e0e0e0]">
                        {item.equipoAsociado ? (
                          <div className="bg-[#edf5ff] p-1.5 border border-[#b9d3ff] text-[11px]">
                            <div className="text-[9px] font-bold text-[#0043ce] uppercase">
                              Asociado a:
                            </div>
                            <div className="font-mono font-semibold text-[#161616] truncate">
                              {item.equipoAsociado.identificador}
                            </div>
                          </div>
                        ) : (
                          <span className="text-[#8d8d8d] text-[11px] italic">
                            Sin radioayuda complementaria
                          </span>
                        )}
                      </td>

                      {/* Acciones */}
                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={() => abrirEdicion(item)}
                          className="px-2.5 py-1 bg-white hover:bg-[#e0e0e0] text-[#161616] border border-[#8d8d8d] text-xs font-medium transition-colors inline-flex items-center space-x-1"
                          title="Editar parámetros y frecuencias"
                        >
                          <Edit2 className="w-3 h-3 text-[#0f62fe]" />
                          <span>Editar</span>
                        </button>
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
            Mostrando <strong>{equiposConCalculo.length}</strong> de{' '}
            <strong>{equipos.length}</strong> radioayudas instaladas
          </span>
          <span className="font-mono text-[11px] text-[#6f6f6f]">
            CÁLCULO AUTOMÁTICO DE SEMÁFOROS (VERIFICACIÓN AÉREA + PREVENTIVO)
          </span>
        </div>
      </div>

      {/* Modal Editar / Nuevo Equipo */}
      {modalEditarOpen && (
        <ModalEditarEquipo
          equipoAEditar={equipoSeleccionado}
          isOpen={modalEditarOpen}
          onClose={() => setModalEditarOpen(false)}
        />
      )}
    </div>
  );
};
