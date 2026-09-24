import React, { useState } from 'react';
import { Search, Plus, X } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { RegionAeronautica, Aeropuerto } from '../types';

export const AeropuertosView: React.FC = () => {
  const { aeropuertos, equipos, guardarAeropuerto } = useApp();

  const [busqueda, setBusqueda] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
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

  const handleCrear = (e: React.FormEvent) => {
    e.preventDefault();
    if (!codigoIATA || !nombreOficial) return;

    guardarAeropuerto({
      codigoIATA: codigoIATA.trim().toUpperCase(),
      nombreOficial: nombreOficial.trim(),
      region,
    });

    setModalOpen(false);
    setCodigoIATA('');
    setNombreOficial('');
  };

  const aeropuertosFiltrados = aeropuertos.filter((a) => {
    const q = busqueda.toLowerCase();
    return (
      a.codigoIATA.toLowerCase().includes(q) ||
      a.nombreOficial.toLowerCase().includes(q) ||
      a.region.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-4">
      {/* Encabezado */}
      <div className="bg-white p-4 border border-[#e0e0e0] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#161616] tracking-tight">
            AERÓDROMOS
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
            onClick={() => setModalOpen(true)}
            className="flex items-center space-x-1.5 px-4 py-2.5 bg-[#0f62fe] hover:bg-[#0353e9] text-white text-sm font-bold tracking-wide transition-colors shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>AGREGAR AEROPUERTO</span>
          </button>
        </div>
      </div>

      {/* Buscador */}
      <div className="bg-white p-3 border border-[#e0e0e0] flex items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-2 text-[#8d8d8d]" />
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por código IATA, nombre oficial o región..."
            className="w-full pl-9 pr-3 py-1 bg-[#f4f4f4] border border-[#8d8d8d] text-xs focus:outline-hidden focus:ring-1 focus:ring-[#0f62fe] focus:bg-white"
          />
        </div>
        <span className="text-xs text-[#6f6f6f] hidden sm:block">
          {aeropuertosFiltrados.length} aeródromos registrados
        </span>
      </div>

      {/* Tarjetas de Aeropuertos (todos juntos, sin agrupar por región) */}
      <div className="bg-white border border-[#e0e0e0] p-4">
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
                  className="border border-[#e0e0e0] p-3 bg-[#fbfbfb] hover:bg-white transition-colors"
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

      {/* Modal Nuevo Aeropuerto */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white border border-[#393939] shadow-2xl w-full max-w-md my-8 rounded-none overflow-hidden">
            <div className="bg-[#161616] text-white px-6 py-4 flex items-center justify-between border-b border-[#393939]">
              <h2 className="text-sm font-semibold">ALTA DE AEROPUERTO</h2>
              <button
                onClick={() => setModalOpen(false)}
                className="text-[#a8a8a8] hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCrear} className="p-6 space-y-4">
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
                  className="w-full bg-white border border-[#8d8d8d] px-3 py-1.5 text-xs font-mono font-bold uppercase"
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
                  onClick={() => setModalOpen(false)}
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
    </div>
  );
};
