import React, { useState } from 'react';
import { Search, Plus, X, Filter } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { RegionAeronautica, Aeropuerto } from '../types';
import { AeropuertoFichaModal } from './AeropuertoFichaModal';

// Cada región se identifica por el código IATA de su aeropuerto principal.
const CODIGO_REGION: Record<RegionAeronautica, string> = {
  EZEIZA: 'EZE',
  CORDOBA: 'COR',
  RESISTENCIA: 'RES',
  MENDOZA: 'MDZ',
  'COMODORO RIVADAVIA': 'CRD',
};

interface AeropuertosViewProps {
  onVerComisiones: (nombreAeropuerto: string) => void;
}

export const AeropuertosView: React.FC<AeropuertosViewProps> = ({ onVerComisiones }) => {
  const { aeropuertos, equipos, crearAeropuerto, actualizarAeropuerto } = useApp();

  const [busqueda, setBusqueda] = useState('');
  const [filtrosRegion, setFiltrosRegion] = useState<RegionAeronautica[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [aeropuertoEditando, setAeropuertoEditando] = useState<Aeropuerto | null>(null);
  const [aeropuertoFicha, setAeropuertoFicha] = useState<Aeropuerto | null>(null);
  const [errorForm, setErrorForm] = useState<string | null>(null);
  const [codigoIATA, setCodigoIATA] = useState('');
  const [nombreOficial, setNombreOficial] = useState('');
  const [region, setRegion] = useState<RegionAeronautica>('EZEIZA');

  const REGIONES: RegionAeronautica[] = [
    'EZEIZA',
    'CORDOBA',
    'RESISTENCIA',
    'MENDOZA',
    'COMODORO RIVADAVIA',
  ];

  const abrirAlta = () => {
    setAeropuertoEditando(null);
    setCodigoIATA('');
    setNombreOficial('');
    setRegion('EZEIZA');
    setErrorForm(null);
    setModalOpen(true);
  };

  const abrirEdicion = (aero: Aeropuerto) => {
    setAeropuertoFicha(null);
    setAeropuertoEditando(aero);
    setCodigoIATA(aero.codigoIATA);
    setNombreOficial(aero.nombreOficial);
    setRegion(aero.region);
    setErrorForm(null);
    setModalOpen(true);
  };

  const cerrarFormulario = () => {
    setModalOpen(false);
    setAeropuertoEditando(null);
    setErrorForm(null);
  };

  const handleGuardar = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (aeropuertoEditando) {
        actualizarAeropuerto(aeropuertoEditando.codigoIATA, { nombreOficial, region });
      } else {
        crearAeropuerto({ codigoIATA, nombreOficial, region });
      }
      cerrarFormulario();
    } catch (err) {
      setErrorForm(err instanceof Error ? err.message : 'No se pudo guardar el aeropuerto.');
    }
  };

  // Sin regiones seleccionadas se muestran todas; el texto solo busca por código IATA y nombre.
  const toggleRegion = (reg: RegionAeronautica) => {
    setFiltrosRegion((prev) =>
      prev.includes(reg) ? prev.filter((r) => r !== reg) : [...prev, reg]
    );
  };

  const aeropuertosFiltrados = aeropuertos.filter((a) => {
    const q = busqueda.toLowerCase();
    const coincideTexto =
      a.codigoIATA.toLowerCase().includes(q) || a.nombreOficial.toLowerCase().includes(q);
    const coincideRegion = filtrosRegion.length === 0 || filtrosRegion.includes(a.region);
    return coincideTexto && coincideRegion;
  });

  return (
    <div className="space-y-4">
      {/* Encabezado */}
      <div className="bg-white p-4 border border-[#e0e0e0] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#161616] tracking-tight">
            MAESTRO DE AEROPUERTOS
          </h1>
        </div>

        <div className="flex items-center flex-wrap gap-2.5">
          <div className="flex items-center space-x-2.5 px-3.5 py-2 border bg-[#161616] text-white border-[#161616] shadow-xs">
            <span className="text-xs uppercase font-bold tracking-wider">Total Aeródromos</span>
            <span className="text-sm font-mono font-bold px-2 py-0.5 bg-white text-[#161616]">
              {aeropuertos.length}
            </span>
          </div>

          <button
            onClick={abrirAlta}
            className="flex items-center space-x-1.5 px-4 py-2.5 bg-[#0f62fe] hover:bg-[#0353e9] text-white text-sm font-bold tracking-wide transition-colors shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>AGREGAR AEROPUERTO</span>
          </button>
        </div>
      </div>

      {/* Buscador y filtro por región */}
      <div className="bg-white p-3 border border-[#e0e0e0] flex flex-col sm:flex-row items-center gap-3">
        <div className="relative w-full sm:w-80 shrink-0">
          <Search className="w-4 h-4 absolute left-3 top-2 text-[#8d8d8d]" />
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por código IATA o nombre..."
            className="w-full pl-9 pr-3 py-1 bg-[#f4f4f4] border border-[#8d8d8d] text-xs focus:outline-hidden focus:ring-1 focus:ring-[#0f62fe] focus:bg-white"
          />
        </div>

        <div className="flex items-center space-x-1.5 w-full sm:w-auto sm:ml-auto overflow-x-auto">
          <span className="text-xs font-bold text-[#525252] mr-1 flex items-center space-x-1 shrink-0">
            <Filter className="w-4 h-4 text-[#0f62fe]" />
            <span>REGIÓN:</span>
          </span>

          {REGIONES.map((reg) => {
            const estaSeleccionada = filtrosRegion.includes(reg);
            return (
              <button
                key={reg}
                onClick={() => toggleRegion(reg)}
                title={reg}
                className={`px-3 py-1 text-xs font-bold font-mono border transition-colors whitespace-nowrap cursor-pointer ${
                  estaSeleccionada
                    ? 'bg-[#161616] text-white border-[#161616]'
                    : 'bg-[#f4f4f4] text-[#161616] border-[#e0e0e0] hover:bg-[#e0e0e0]'
                }`}
              >
                {CODIGO_REGION[reg]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tarjetas de Aeropuertos (todos juntos, sin agrupar por región) */}
      <div className="bg-white border border-[#e0e0e0] shadow-xs">
      <div className="p-4">
        {aeropuertosFiltrados.length === 0 ? (
          <div className="py-8 text-center text-[#8d8d8d] text-sm">
            No se encontraron aeropuertos para la búsqueda.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {aeropuertosFiltrados.map((aero) => {
              const equiposInstalados = equipos.filter(
                (e) => e.aeropuertoCodigo === aero.codigoIATA
              );

              return (
                <div
                  key={aero.codigoIATA}
                  onClick={() => setAeropuertoFicha(aero)}
                  title="Ver ficha del aeródromo"
                  className="border border-[#e0e0e0] p-3 bg-[#fbfbfb] hover:bg-white hover:border-[#0f62fe] transition-colors cursor-pointer"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono font-bold text-sm bg-[#161616] text-white px-2 py-0.5 shrink-0">
                        {aero.codigoIATA}
                      </span>
                      <h3 className="text-xs font-bold text-[#161616] leading-tight">
                        {aero.nombreOficial}
                      </h3>
                    </div>
                    <span className="text-[10px] text-[#6f6f6f] font-medium uppercase font-mono shrink-0">
                      {aero.region}
                    </span>
                  </div>

                  {/* Radioayudas instaladas en este aeropuerto */}
                  <div className="mt-3 pt-2 border-t border-[#e0e0e0]">
                    {equiposInstalados.length === 0 ? (
                      <span className="text-[11px] text-[#8d8d8d] italic">
                        Sin equipos registrados
                      </span>
                    ) : (
                      <div className="space-y-1">
                        {equiposInstalados.map((eq) => (
                          <div
                            key={eq.id}
                            className="text-[11px] flex items-center justify-between font-mono bg-white p-1 border border-[#e0e0e0]"
                          >
                            <span className="font-bold text-[#161616]">{eq.identificador}</span>
                            <span
                              className={`text-[9px] px-1 font-bold ${
                                eq.estadoOperativo === 'EN_SERVICIO'
                                  ? 'text-[#0e6027] bg-[#defbe6]'
                                  : 'text-[#da1e28] bg-[#ffebee]'
                              }`}
                            >
                              {eq.estadoOperativo === 'EN_SERVICIO' ? 'E/S' : 'F/S'}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

        {/* Barra de estado inferior */}
        <div className="bg-[#f4f4f4] px-4 py-2 border-t border-[#e0e0e0] flex items-center justify-between text-xs text-[#525252]">
          <span>
            Mostrando <strong>{aeropuertosFiltrados.length}</strong> de{' '}
            <strong>{aeropuertos.length}</strong> aeródromos
          </span>
        </div>
      </div>

      {/* Modal Nuevo Aeropuerto */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white border border-[#393939] shadow-2xl w-full max-w-md my-8 rounded-none overflow-hidden">
            <div className="bg-[#161616] text-white px-6 py-4 flex items-center justify-between border-b border-[#393939]">
              <h2 className="text-sm font-semibold">
                {aeropuertoEditando ? 'EDITAR AEROPUERTO' : 'ALTA DE AEROPUERTO'}
              </h2>
              <button onClick={cerrarFormulario} className="text-[#a8a8a8] hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleGuardar} className="p-6 space-y-4">
              {errorForm && (
                <div className="bg-[#fff1f1] border-l-4 border-[#da1e28] p-3 text-xs text-[#da1e28]">
                  {errorForm}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold uppercase mb-1">
                  Código IATA (3 letras) *
                </label>
                <input
                  type="text"
                  maxLength={3}
                  value={codigoIATA}
                  onChange={(e) => setCodigoIATA(e.target.value.toUpperCase())}
                  placeholder="Ej: ROS, TUC, NQN"
                  required
                  disabled={!!aeropuertoEditando}
                  title={
                    aeropuertoEditando
                      ? 'El código IATA no se puede modificar: lo usan equipos y comisiones.'
                      : undefined
                  }
                  className="w-full bg-white border border-[#8d8d8d] px-3 py-1.5 text-xs font-mono font-bold uppercase disabled:bg-[#f4f4f4] disabled:text-[#8d8d8d] disabled:cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase mb-1">
                  Nombre Oficial del Aeropuerto *
                </label>
                <input
                  type="text"
                  value={nombreOficial}
                  onChange={(e) => setNombreOficial(e.target.value)}
                  placeholder="Ej: Aeropuerto Internacional Rosario Islas Malvinas"
                  required
                  className="w-full bg-white border border-[#8d8d8d] px-3 py-1.5 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase mb-1">
                  Región Aeronáutica *
                </label>
                <select
                  value={region}
                  onChange={(e) => setRegion(e.target.value as RegionAeronautica)}
                  className="w-full bg-white border border-[#8d8d8d] px-3 py-1.5 text-xs font-bold"
                >
                  {REGIONES.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end space-x-3 pt-3 border-t border-[#e0e0e0]">
                <button
                  type="button"
                  onClick={cerrarFormulario}
                  className="px-4 py-2 border border-[#8d8d8d] text-xs font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#0f62fe] text-white text-xs font-bold"
                >
                  Guardar Aeropuerto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Ficha del aeródromo */}
      {aeropuertoFicha && (
        <AeropuertoFichaModal
          aeropuerto={aeropuertoFicha}
          onClose={() => setAeropuertoFicha(null)}
          onEditar={abrirEdicion}
          onVerComisiones={onVerComisiones}
        />
      )}
    </div>
  );
};
