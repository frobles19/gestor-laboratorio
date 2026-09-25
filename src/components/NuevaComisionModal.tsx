import React, { useState, useMemo } from 'react';
import {
  X,
  Plus,
  Search,
  Check,
  UserCheck,
  Plane,
  Truck,
  MapPin,
  Calendar,
  AlertCircle,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { MedioTransporte, TipoIntervencion } from '../types';
import { getHoyLocalStr } from '../utils/maintenance';

interface NuevaComisionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NuevaComisionModal: React.FC<NuevaComisionModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { aeropuertos, nomina, crearComision } = useApp();

  // Fechas por defecto sugeridas
  const hoyStr = getHoyLocalStr();
  const enUnaSemanaStr = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0];

  const [fechaSalida, setFechaSalida] = useState(hoyStr);
  const [fechaRegreso, setFechaRegreso] = useState(enUnaSemanaStr);
  const [medioTransporte, setMedioTransporte] = useState<MedioTransporte>('Terrestre');
  const [tiposMantenimiento, setTiposMantenimiento] = useState<TipoIntervencion[]>(['Preventivo']);
  const [detalleOtros, setDetalleOtros] = useState('');
  const [destinosSeleccionados, setDestinosSeleccionados] = useState<string[]>([]);
  const [tecnicosSeleccionados, setTecnicosSeleccionados] = useState<string[]>([]);

  // Filtros de búsqueda para selectores
  const [busquedaDestino, setBusquedaDestino] = useState('');
  const [busquedaTecnico, setBusquedaTecnico] = useState('');
  const [errorForm, setErrorForm] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  // Lista de aeropuertos filtrada y no seleccionados aún
  const aeropuertosDisponibles = useMemo(() => {
    return aeropuertos.filter((a) => {
      const yaSeleccionado = destinosSeleccionados.includes(a.codigoIATA);
      const coincide =
        a.codigoIATA.toLowerCase().includes(busquedaDestino.toLowerCase()) ||
        a.nombreOficial.toLowerCase().includes(busquedaDestino.toLowerCase()) ||
        a.region.toLowerCase().includes(busquedaDestino.toLowerCase());
      return !yaSeleccionado && coincide;
    });
  }, [aeropuertos, destinosSeleccionados, busquedaDestino]);

  // Lista de técnicos filtrada y no seleccionados aún
  const tecnicosDisponibles = useMemo(() => {
    return nomina.filter((t) => {
      if (t.bajaAt) return false;
      const yaSeleccionado = tecnicosSeleccionados.includes(t.id);
      const nombreCompleto = `${t.nombre} ${t.apellido}`.toLowerCase();
      const coincide =
        nombreCompleto.includes(busquedaTecnico.toLowerCase()) ||
        t.dni.includes(busquedaTecnico) ||
        t.puesto.toLowerCase().includes(busquedaTecnico.toLowerCase());
      return !yaSeleccionado && coincide;
    });
  }, [nomina, tecnicosSeleccionados, busquedaTecnico]);

  const agregarDestino = (codigo: string) => {
    setDestinosSeleccionados((prev) => [...prev, codigo]);
    setBusquedaDestino('');
  };

  const quitarDestino = (codigo: string) => {
    setDestinosSeleccionados((prev) => prev.filter((c) => c !== codigo));
  };

  const agregarTecnico = (id: string) => {
    setTecnicosSeleccionados((prev) => [...prev, id]);
    setBusquedaTecnico('');
  };

  const quitarTecnico = (id: string) => {
    setTecnicosSeleccionados((prev) => prev.filter((i) => i !== id));
  };

  const toggleTipoMantenimiento = (tipo: TipoIntervencion) => {
    setTiposMantenimiento((prev) =>
      prev.includes(tipo) ? prev.filter((t) => t !== tipo) : [...prev, tipo]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorForm(null);

    // Evita crear comisiones duplicadas por doble clic mientras se procesa el envío.
    if (enviando) return;

    if (!fechaSalida || !fechaRegreso) {
      setErrorForm('Por favor ingrese las fechas de salida y regreso.');
      return;
    }

    if (new Date(fechaSalida) > new Date(fechaRegreso)) {
      setErrorForm('La fecha de salida no puede ser posterior a la fecha de regreso.');
      return;
    }

    if (destinosSeleccionados.length === 0) {
      setErrorForm('Debe seleccionar al menos un aeropuerto de destino.');
      return;
    }

    if (tecnicosSeleccionados.length === 0) {
      setErrorForm('Debe asignar al menos un técnico a la comisión.');
      return;
    }

    if (tiposMantenimiento.length === 0) {
      setErrorForm('Debe seleccionar al menos un tipo de mantenimiento previsto.');
      return;
    }

    setEnviando(true);
    try {
      crearComision({
        fechaSalida,
        fechaRegreso,
        medioTransporte,
        tiposMantenimiento,
        objetivo:
          tiposMantenimiento.includes('Otros') && detalleOtros.trim()
            ? detalleOtros.trim()
            : undefined,
        destinosAeropuertos: destinosSeleccionados,
        tecnicosIds: tecnicosSeleccionados,
      });
      onClose();
    } catch (err) {
      setErrorForm(err instanceof Error ? err.message : 'No se pudo crear la comisión.');
      setEnviando(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white border border-[#393939] shadow-2xl w-full max-w-4xl my-8 rounded-none overflow-hidden">
        {/* Cabecera estilo IBM Maximo Dialog */}
        <div className="bg-[#161616] text-white px-6 py-4 flex items-center justify-between border-b border-[#393939]">
          <div className="flex items-center space-x-3">
            <div className="bg-[#0f62fe] p-1.5 text-white">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold tracking-wide uppercase">
                NUEVA COMISIÓN
              </h2>
              <p className="text-xs text-[#a8a8a8]">
                Expediente de Mantenimiento de Radioayudas
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

        {/* Contenido del Formulario */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {errorForm && (
            <div className="bg-[#fff1f1] border-l-4 border-[#da1e28] p-3 text-xs text-[#da1e28] flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorForm}</span>
            </div>
          )}

          {/* Fila 1: Fechas del Viaje y Medio de Transporte */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-[#f4f4f4] p-4 border border-[#e0e0e0]">
            <div>
              <label className="block text-xs font-semibold text-[#161616] uppercase mb-1 flex items-center space-x-1">
                <Calendar className="w-3.5 h-3.5 text-[#0f62fe]" />
                <span>Fecha de Salida *</span>
              </label>
              <input
                type="date"
                value={fechaSalida}
                onChange={(e) => setFechaSalida(e.target.value)}
                required
                className="w-full bg-white border border-[#8d8d8d] px-3 py-1.5 text-xs focus:outline-hidden focus:ring-1 focus:ring-[#0f62fe]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#161616] uppercase mb-1 flex items-center space-x-1">
                <Calendar className="w-3.5 h-3.5 text-[#0f62fe]" />
                <span>Fecha de Regreso *</span>
              </label>
              <input
                type="date"
                value={fechaRegreso}
                onChange={(e) => setFechaRegreso(e.target.value)}
                required
                className="w-full bg-white border border-[#8d8d8d] px-3 py-1.5 text-xs focus:outline-hidden focus:ring-1 focus:ring-[#0f62fe]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#161616] uppercase mb-1">
                Medio de Transporte *
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setMedioTransporte('Terrestre')}
                  className={`flex items-center justify-center space-x-1.5 py-1.5 px-2 text-xs font-medium border transition-colors ${
                    medioTransporte === 'Terrestre'
                      ? 'bg-[#0f62fe] text-white border-[#0f62fe]'
                      : 'bg-white text-[#161616] border-[#8d8d8d] hover:bg-[#e0e0e0]'
                  }`}
                >
                  <Truck className="w-3.5 h-3.5" />
                  <span>Terrestre</span>
                </button>
                <button
                  type="button"
                  onClick={() => setMedioTransporte('Aéreo')}
                  className={`flex items-center justify-center space-x-1.5 py-1.5 px-2 text-xs font-medium border transition-colors ${
                    medioTransporte === 'Aéreo'
                      ? 'bg-[#0f62fe] text-white border-[#0f62fe]'
                      : 'bg-white text-[#161616] border-[#8d8d8d] hover:bg-[#e0e0e0]'
                  }`}
                >
                  <Plane className="w-3.5 h-3.5" />
                  <span>Aéreo</span>
                </button>
              </div>
            </div>

            {/* Tipo(s) de Mantenimiento Previsto */}
            <div className="sm:col-span-3">
              <label className="block text-xs font-semibold text-[#161616] uppercase mb-1">
                Tipo(s) de Mantenimiento Previsto ({tiposMantenimiento.length} seleccionado
                {tiposMantenimiento.length === 1 ? '' : 's'}) *
              </label>
              <p className="text-[11px] text-[#6f6f6f] mb-1.5">
                Puede seleccionar más de uno si la comisión abarca varios tipos de tarea.
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {(
                  [
                    'Verificación',
                    'Preventivo',
                    'Correctivo',
                    'Otros',
                  ] as const
                ).map((tipo) => (
                  <button
                    key={tipo}
                    type="button"
                    onClick={() => toggleTipoMantenimiento(tipo)}
                    className={`py-2 px-3 text-xs font-bold border transition-colors cursor-pointer text-center ${
                      tiposMantenimiento.includes(tipo)
                        ? 'bg-[#161616] text-white border-[#161616]'
                        : 'bg-white text-[#161616] border-[#8d8d8d] hover:bg-[#e0e0e0]'
                    }`}
                  >
                    {tipo}
                  </button>
                ))}
              </div>

              {tiposMantenimiento.includes('Otros') && (
                <div className="mt-2.5 bg-white p-3 border border-[#8d8d8d]">
                  <label className="block text-xs font-semibold text-[#161616] uppercase mb-1">
                    Especificar Detalle / Motivo del Mantenimiento:
                  </label>
                  <input
                    type="text"
                    value={detalleOtros}
                    onChange={(e) => setDetalleOtros(e.target.value)}
                    placeholder="Ej: Calibración especial, peritaje técnico, inspección edilicia..."
                    className="w-full bg-[#f4f4f4] border border-[#8d8d8d] px-3 py-1.5 text-xs text-[#161616] focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-[#0f62fe]"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Selector Múltiple de Destinos (Aeropuertos) */}
          <div className="border border-[#e0e0e0] bg-white p-4">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-[#161616] uppercase flex items-center space-x-1.5">
                <MapPin className="w-4 h-4 text-[#0f62fe]" />
                <span>Aeropuertos de Destino ({destinosSeleccionados.length} seleccionados) *</span>
              </label>
              <span className="text-[11px] text-[#6f6f6f]">
                Filtre y haga clic para agregar al itinerario
              </span>
            </div>

            {/* Tags seleccionados */}
            <div className="flex flex-wrap gap-2 mb-3 min-h-[34px] p-2 bg-[#f4f4f4] border border-[#e0e0e0]">
              {destinosSeleccionados.length === 0 ? (
                <span className="text-xs text-[#8d8d8d] italic">
                  Ningún aeropuerto seleccionado aún. Seleccione de la lista inferior.
                </span>
              ) : (
                destinosSeleccionados.map((codigo) => {
                  const aero = aeropuertos.find((a) => a.codigoIATA === codigo);
                  return (
                    <span
                      key={codigo}
                      className="inline-flex items-center space-x-1.5 bg-[#0f62fe] text-white text-xs px-2.5 py-1 font-mono font-bold shadow-xs"
                    >
                      <span>{codigo}</span>
                      <span className="font-sans font-normal text-[11px] text-[#d0e2ff]">
                        - {aero?.nombreOficial.slice(0, 20)}...
                      </span>
                      <button
                        type="button"
                        onClick={() => quitarDestino(codigo)}
                        className="hover:bg-[#0043ce] p-0.5 rounded"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  );
                })
              )}
            </div>

            {/* Buscador de aeropuertos */}
            <div className="relative mb-2">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-[#8d8d8d]" />
              <input
                type="text"
                value={busquedaDestino}
                onChange={(e) => setBusquedaDestino(e.target.value)}
                placeholder="Filtrar por código IATA (EZE, COR, MDZ), nombre o región..."
                className="w-full pl-9 pr-3 py-1.5 bg-white border border-[#8d8d8d] text-xs focus:outline-hidden focus:ring-1 focus:ring-[#0f62fe]"
              />
            </div>

            {/* Lista disponible de aeropuertos */}
            <div className="max-h-36 overflow-y-auto border border-[#e0e0e0] divide-y divide-[#f4f4f4]">
              {aeropuertosDisponibles.length === 0 ? (
                <div className="p-3 text-xs text-[#8d8d8d] text-center">
                  No hay más aeropuertos que coincidan con la búsqueda.
                </div>
              ) : (
                aeropuertosDisponibles.map((a) => (
                  <div
                    key={a.codigoIATA}
                    onClick={() => agregarDestino(a.codigoIATA)}
                    className="p-2 hover:bg-[#edf5ff] cursor-pointer flex items-center justify-between text-xs transition-colors"
                  >
                    <div className="flex items-center space-x-2">
                      <span className="font-mono font-bold bg-[#393939] text-white px-2 py-0.5 text-xs">
                        {a.codigoIATA}
                      </span>
                      <span className="font-medium text-[#161616]">{a.nombreOficial}</span>
                    </div>
                    <span className="text-[10px] bg-[#e0e0e0] text-[#393939] px-2 py-0.5 uppercase font-medium">
                      {a.region}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Selector Múltiple de Técnicos */}
          <div className="border border-[#e0e0e0] bg-white p-4">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-[#161616] uppercase flex items-center space-x-1.5">
                <UserCheck className="w-4 h-4 text-[#0f62fe]" />
                <span>TÉCNICOS DESIGNADOS ({tecnicosSeleccionados.length} seleccionados) *</span>
              </label>
              <span className="text-[11px] text-[#6f6f6f]">
                Seleccione los técnicos que integrarán la comisión
              </span>
            </div>

            {/* Tags de técnicos seleccionados */}
            <div className="flex flex-wrap gap-2 mb-3 min-h-[34px] p-2 bg-[#f4f4f4] border border-[#e0e0e0]">
              {tecnicosSeleccionados.length === 0 ? (
                <span className="text-xs text-[#8d8d8d] italic">
                  Ningún técnico asignado aún. Seleccione de la lista disponible.
                </span>
              ) : (
                tecnicosSeleccionados.map((id) => {
                  const tec = nomina.find((t) => t.id === id);
                  if (!tec) return null;

                  return (
                    <span
                      key={tec.id}
                      className="inline-flex items-center space-x-1.5 text-xs px-2.5 py-1 font-medium border bg-white text-[#161616] border-[#8d8d8d]"
                    >
                      <span>
                        <span className="uppercase">{tec.apellido}</span>, {tec.nombre}
                      </span>
                      <span className="text-[10px] text-[#525252]">({tec.puesto})</span>
                      <button
                        type="button"
                        onClick={() => quitarTecnico(tec.id)}
                        className="hover:bg-[#e0e0e0] p-0.5 rounded ml-1 text-[#525252] hover:text-[#161616]"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  );
                })
              )}
            </div>

            {/* Buscador de técnicos */}
            <div className="relative mb-2">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-[#8d8d8d]" />
              <input
                type="text"
                value={busquedaTecnico}
                onChange={(e) => setBusquedaTecnico(e.target.value)}
                placeholder="Filtrar por nombre o cargo (puesto)..."
                className="w-full pl-9 pr-3 py-1.5 bg-white border border-[#8d8d8d] text-xs focus:outline-hidden focus:ring-1 focus:ring-[#0f62fe]"
              />
            </div>

            {/* Lista disponible de técnicos */}
            <div className="max-h-40 overflow-y-auto border border-[#e0e0e0] divide-y divide-[#f4f4f4]">
              {tecnicosDisponibles.length === 0 ? (
                <div className="p-3 text-xs text-[#8d8d8d] text-center">
                  No hay más técnicos que coincidan con la búsqueda.
                </div>
              ) : (
                tecnicosDisponibles.map((t) => (
                  <div
                    key={t.id}
                    onClick={() => agregarTecnico(t.id)}
                    className="p-2 hover:bg-[#edf5ff] cursor-pointer flex items-center justify-between text-xs transition-colors"
                  >
                    <span className="font-semibold text-[#161616]">
                      <span className="uppercase">{t.apellido}</span>, {t.nombre}
                    </span>
                    <span className="text-[11px] bg-[#e0e0e0] text-[#161616] px-2.5 py-0.5 font-medium">
                      {t.puesto}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Botones de acción estilo IBM Maximo */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-[#e0e0e0]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-[#8d8d8d] text-xs font-medium text-[#161616] hover:bg-[#e0e0e0] transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={enviando}
              className="flex items-center space-x-2 px-5 py-2 bg-[#0f62fe] hover:bg-[#0353e9] disabled:bg-[#8d8d8d] disabled:cursor-not-allowed text-white text-xs font-semibold tracking-wide shadow-sm transition-colors"
            >
              <Check className="w-4 h-4" />
              <span>{enviando ? 'CREANDO...' : 'CREAR COMISIÓN'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
