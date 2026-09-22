import React, { useState } from 'react';
import { Layers, MapPin, Radio, Search, Plus, X } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { RegionAeronautica, Aeropuerto } from '../types';

export const AeropuertosView: React.FC = () => {
  const { aeropuertos, equipos, modelos, guardarAeropuerto } = useApp();

  const [busqueda, setBusqueda] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [codigoIATA, setCodigoIATA] = useState('');
  const [nombreOficial, setNombreOficial] = useState('');
  const [region, setRegion] = useState<RegionAeronautica>('EZEIZA');
  const [ciudad, setCiudad] = useState('');
  const [provincia, setProvincia] = useState('');

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
      ciudad: ciudad.trim(),
      provincia: provincia.trim(),
    });

    setModalOpen(false);
    setCodigoIATA('');
    setNombreOficial('');
    setCiudad('');
    setProvincia('');
  };

  const aeropuertosFiltrados = aeropuertos.filter((a) => {
    const q = busqueda.toLowerCase();
    return (
      a.codigoIATA.toLowerCase().includes(q) ||
      a.nombreOficial.toLowerCase().includes(q) ||
      a.region.toLowerCase().includes(q) ||
      (a.ciudad || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-4">
      {/* Encabezado */}
      <div className="bg-white p-4 border border-[#e0e0e0] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-mono font-bold bg-[#393939] text-white px-2 py-0.5">
              MÓDULO 404
            </span>
            <h1 className="text-lg font-bold text-[#161616] tracking-tight">
              RED AERONÁUTICA NACIONAL Y REGIONES TÉCNICAS
            </h1>
          </div>
          <p className="text-xs text-[#525252] mt-0.5">
            Distribución de aeropuertos clasificados por las 5 Regiones de Infraestructura: Ezeiza,
            Córdoba, Resistencia, Mendoza y Comodoro Rivadavia.
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-[#0f62fe] hover:bg-[#0353e9] text-white text-xs font-bold tracking-wide transition-colors shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>AGREGAR AEROPUERTO</span>
        </button>
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

      {/* Tarjetas Agrupadas por Región */}
      <div className="space-y-4">
        {REGIONES.map((reg) => {
          const aerosEnRegion = aeropuertosFiltrados.filter((a) => a.region === reg);
          if (aerosEnRegion.length === 0 && busqueda) return null;

          return (
            <div key={reg} className="bg-white border border-[#e0e0e0] overflow-hidden">
              <div className="bg-[#262626] text-white px-4 py-2 text-xs font-bold uppercase tracking-wider flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="w-2 h-2 bg-[#0f62fe] inline-block"></span>
                  <span>{reg}</span>
                </div>
                <span className="text-[11px] font-mono font-normal text-[#c6c6c6]">
                  {aerosEnRegion.length} Aeropuerto(s)
                </span>
              </div>

              <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {aerosEnRegion.map((aero) => {
                  const equiposInstalados = equipos.filter(
                    (e) => e.aeropuertoCodigo === aero.codigoIATA
                  );

                  return (
                    <div
                      key={aero.codigoIATA}
                      className="border border-[#e0e0e0] p-3 bg-[#fbfbfb] hover:bg-white transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <span className="font-mono font-bold text-sm bg-[#161616] text-white px-2 py-0.5">
                          {aero.codigoIATA}
                        </span>
                        <span className="text-[10px] text-[#6f6f6f] font-medium uppercase font-mono">
                          {aero.region}
                        </span>
                      </div>

                      <h3 className="text-xs font-bold text-[#161616] mt-2 line-clamp-2">
                        {aero.nombreOficial}
                      </h3>

                      {/* Radioayudas instaladas en este aeropuerto */}
                      <div className="mt-3 pt-2 border-t border-[#e0e0e0]">
                        <div className="text-[10px] font-bold text-[#6f6f6f] uppercase mb-1 flex items-center space-x-1">
                          <Radio className="w-3 h-3 text-[#0f62fe]" />
                          <span>Radioayudas Instaladas ({equiposInstalados.length}):</span>
                        </div>

                        {equiposInstalados.length === 0 ? (
                          <span className="text-[11px] text-[#8d8d8d] italic">
                            Sin equipos registrados
                          </span>
                        ) : (
                          <div className="space-y-1">
                            {equiposInstalados.map((eq) => {
                              const mod = modelos.find((m) => m.id === eq.modeloId);
                              return (
                                <div
                                  key={eq.id}
                                  className="text-[11px] flex items-center justify-between font-mono bg-white p-1 border border-[#e0e0e0]"
                                >
                                  <span className="font-bold text-[#161616]">
                                    {eq.identificador}
                                  </span>
                                  <span
                                    className={`text-[9px] px-1 font-bold ${
                                      eq.estadoOperativo === 'EN_SERVICIO'
                                        ? 'text-[#0e6027] bg-[#defbe6]'
                                        : 'text-[#da1e28] bg-[#ffebee]'
                                    }`}
                                  >
                                    {eq.estadoOperativo === 'EN_SERVICIO' ? 'OPR' : 'FS'}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
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

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase mb-1">Ciudad</label>
                  <input
                    type="text"
                    value={ciudad}
                    onChange={(e) => setCiudad(e.target.value)}
                    className="w-full bg-white border border-[#8d8d8d] px-3 py-1.5 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase mb-1">Provincia</label>
                  <input
                    type="text"
                    value={provincia}
                    onChange={(e) => setProvincia(e.target.value)}
                    className="w-full bg-white border border-[#8d8d8d] px-3 py-1.5 text-xs"
                  />
                </div>
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
