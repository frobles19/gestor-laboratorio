import React, { useState } from 'react';
import { X, Save, Radio, Layers, Clock, AlertTriangle } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { EquipoInstalado, EstadoOperativo } from '../types';

interface ModalEditarEquipoProps {
  equipoAEditar?: EquipoInstalado | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ModalEditarEquipo: React.FC<ModalEditarEquipoProps> = ({
  equipoAEditar,
  isOpen,
  onClose,
}) => {
  const { aeropuertos, modelos, equipos, guardarEquipo } = useApp();

  const hoyStr = new Date().toISOString().split('T')[0];

  const [identificador, setIdentificador] = useState(
    equipoAEditar?.identificador || ''
  );
  const [aeropuertoCodigo, setAeropuertoCodigo] = useState(
    equipoAEditar?.aeropuertoCodigo || aeropuertos[0]?.codigoIATA || 'EZE'
  );
  const [modeloId, setModeloId] = useState(
    equipoAEditar?.modeloId || modelos[0]?.id || ''
  );
  const [frecuenciaVerificacionAereaMeses, setFrecuenciaVerificacionAereaMeses] =
    useState<number>(equipoAEditar?.frecuenciaVerificacionAereaMeses || 12);
  const [
    frecuenciaMantenimientoPreventivoMeses,
    setFrecuenciaMantenimientoPreventivoMeses,
  ] = useState<number>(equipoAEditar?.frecuenciaMantenimientoPreventivoMeses || 3);
  const [equipoAsociadoId, setEquipoAsociadoId] = useState<string | null>(
    equipoAEditar?.equipoAsociadoId || null
  );
  const [estadoOperativo, setEstadoOperativo] = useState<EstadoOperativo>(
    equipoAEditar?.estadoOperativo || 'EN_SERVICIO'
  );
  const [fechaUltimaVerificacionAerea, setFechaUltimaVerificacionAerea] =
    useState(equipoAEditar?.fechaUltimaVerificacionAerea || hoyStr);
  const [fechaUltimoMantenimientoPreventivo, setFechaUltimoMantenimientoPreventivo] =
    useState(equipoAEditar?.fechaUltimoMantenimientoPreventivo || hoyStr);
  const [ubicacionDetalle, setUbicacionDetalle] = useState(
    equipoAEditar?.ubicacionDetalle || ''
  );

  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  // Equipos disponibles para asociar (del mismo aeropuerto o compatibles, excluyendo este mismo)
  const equiposDisponiblesParaAsociar = equipos.filter(
    (e) => e.id !== equipoAEditar?.id && e.aeropuertoCodigo === aeropuertoCodigo
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!identificador.trim()) {
      setErrorMsg('Debe ingresar un identificador único para el equipo.');
      return;
    }

    const id = equipoAEditar ? equipoAEditar.id : `EQ-${Date.now()}`;

    const equipoGuardar: EquipoInstalado = {
      id,
      identificador: identificador.trim().toUpperCase(),
      aeropuertoCodigo,
      modeloId,
      frecuenciaVerificacionAereaMeses: Number(frecuenciaVerificacionAereaMeses),
      frecuenciaMantenimientoPreventivoMeses: Number(
        frecuenciaMantenimientoPreventivoMeses
      ),
      equipoAsociadoId: equipoAsociadoId || null,
      estadoOperativo,
      fechaUltimaVerificacionAerea,
      fechaUltimoMantenimientoPreventivo,
      ubicacionDetalle: ubicacionDetalle.trim(),
    };

    guardarEquipo(equipoGuardar);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white border border-[#393939] shadow-2xl w-full max-w-2xl my-8 rounded-none overflow-hidden">
        {/* Encabezado */}
        <div className="bg-[#161616] text-white px-6 py-4 flex items-center justify-between border-b border-[#393939]">
          <div className="flex items-center space-x-3">
            <div className="bg-[#0f62fe] p-1.5 text-white">
              <Radio className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold tracking-wide">
                {equipoAEditar ? 'EDITAR RADIOAYUDA INSTALADA' : 'ALTA DE RADIOAYUDA'}
              </h2>
              <p className="text-xs text-[#a8a8a8]">
                Parametrización técnica de activo y frecuencias de mantenimiento
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

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {errorMsg && (
            <div className="bg-[#fff1f1] border-l-4 border-[#da1e28] p-3 text-xs text-[#da1e28] flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Fila 1: Identificador y Aeropuerto */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#161616] uppercase mb-1">
                Identificador Único *
              </label>
              <input
                type="text"
                value={identificador}
                onChange={(e) => setIdentificador(e.target.value)}
                placeholder="Ej: VOR CORDOBA, DME/VOR IGUAZU, ILS 35R EZEIZA"
                className="w-full bg-white border border-[#8d8d8d] px-3 py-1.5 text-xs font-mono font-bold focus:outline-hidden focus:ring-1 focus:ring-[#0f62fe]"
                required
              />
              <span className="text-[10px] text-[#6f6f6f] mt-0.5 block">
                Para DMEs asociados use nomenclatura: DME/VOR [CIUDAD] o DME/ILS [PISTA]
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#161616] uppercase mb-1">
                Aeropuerto de Emplazamiento *
              </label>
              <select
                value={aeropuertoCodigo}
                onChange={(e) => setAeropuertoCodigo(e.target.value)}
                className="w-full bg-white border border-[#8d8d8d] px-3 py-1.5 text-xs focus:outline-hidden focus:ring-1 focus:ring-[#0f62fe]"
              >
                {aeropuertos.map((a) => (
                  <option key={a.codigoIATA} value={a.codigoIATA}>
                    [{a.codigoIATA}] {a.nombreOficial} ({a.region})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Fila 2: Modelo y Estado Operativo */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#161616] uppercase mb-1">
                Modelo y Sistema *
              </label>
              <select
                value={modeloId}
                onChange={(e) => setModeloId(e.target.value)}
                className="w-full bg-white border border-[#8d8d8d] px-3 py-1.5 text-xs focus:outline-hidden focus:ring-1 focus:ring-[#0f62fe]"
              >
                {modelos.map((m) => (
                  <option key={m.id} value={m.id}>
                    [{m.sistema}] {m.denominacion} - {m.fabricante}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#161616] uppercase mb-1">
                Estado Operativo *
              </label>
              <select
                value={estadoOperativo}
                onChange={(e) => setEstadoOperativo(e.target.value as EstadoOperativo)}
                className={`w-full border px-3 py-1.5 text-xs font-bold focus:outline-hidden ${
                  estadoOperativo === 'EN_SERVICIO'
                    ? 'bg-[#defbe6] text-[#0e6027] border-[#a7f0ba]'
                    : 'bg-[#ffebee] text-[#da1e28] border-[#ffb3b8]'
                }`}
              >
                <option value="EN_SERVICIO">EN SERVICIO</option>
                <option value="FUERA_DE_SERVICIO">FUERA DE SERVICIO</option>
              </select>
            </div>
          </div>

          {/* Fila 3: Asociación funcional entre equipos */}
          <div className="bg-[#edf5ff] p-3 border border-[#b9d3ff]">
            <label className="block text-xs font-semibold text-[#0043ce] uppercase mb-1 flex items-center space-x-1.5">
              <Layers className="w-3.5 h-3.5 text-[#0f62fe]" />
              <span>Asociación Funcional Complementaria (Ej: DME asociado a VOR o ILS)</span>
            </label>
            <select
              value={equipoAsociadoId || ''}
              onChange={(e) => setEquipoAsociadoId(e.target.value || null)}
              className="w-full bg-white border border-[#8d8d8d] px-3 py-1.5 text-xs focus:outline-hidden focus:ring-1 focus:ring-[#0f62fe]"
            >
              <option value="">(Sin equipo complementario asociado)</option>
              {equiposDisponiblesParaAsociar.map((eq) => (
                <option key={eq.id} value={eq.id}>
                  Vincular a: [{eq.aeropuertoCodigo}] {eq.identificador}
                </option>
              ))}
            </select>
            <span className="text-[11px] text-[#525252] mt-1 block">
              Permite ligar operativamente radioayudas que funcionan en conjunto (VOR + DME o ILS + DME).
            </span>
          </div>

          {/* Fila 4: Periodicidades Parametrizables */}
          <div className="bg-[#f4f4f4] p-4 border border-[#e0e0e0] space-y-3">
            <div className="text-xs font-bold text-[#161616] uppercase flex items-center space-x-1.5">
              <Clock className="w-4 h-4 text-[#0f62fe]" />
              <span>Periodicidades de Mantenimiento Parametrizables (Meses)</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#525252] mb-1">
                  Periodicidad Verificación Aérea (Meses)
                </label>
                <input
                  type="number"
                  min={1}
                  max={36}
                  value={frecuenciaVerificacionAereaMeses}
                  onChange={(e) =>
                    setFrecuenciaVerificacionAereaMeses(parseInt(e.target.value, 10) || 12)
                  }
                  className="w-full bg-white border border-[#8d8d8d] px-3 py-1.5 text-xs font-mono font-bold"
                  required
                />
                <span className="text-[10px] text-[#6f6f6f]">
                  Inspección en vuelo con avión verificador (Típico: 6 o 12 meses)
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#525252] mb-1">
                  Periodicidad Mantenimiento Preventivo (Meses)
                </label>
                <input
                  type="number"
                  min={1}
                  max={24}
                  value={frecuenciaMantenimientoPreventivoMeses}
                  onChange={(e) =>
                    setFrecuenciaMantenimientoPreventivoMeses(
                      parseInt(e.target.value, 10) || 3
                    )
                  }
                  className="w-full bg-white border border-[#8d8d8d] px-3 py-1.5 text-xs font-mono font-bold"
                  required
                />
                <span className="text-[10px] text-[#6f6f6f]">
                  Inspección técnica terrestre en sitio (Típico: 3 o 6 meses)
                </span>
              </div>
            </div>
          </div>

          {/* Fila 5: Fechas de Último Mantenimiento */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#161616] uppercase mb-1">
                Fecha Última Verificación Aérea
              </label>
              <input
                type="date"
                value={fechaUltimaVerificacionAerea}
                onChange={(e) => setFechaUltimaVerificacionAerea(e.target.value)}
                className="w-full bg-white border border-[#8d8d8d] px-3 py-1.5 text-xs focus:outline-hidden focus:ring-1 focus:ring-[#0f62fe]"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#161616] uppercase mb-1">
                Fecha Último Mantenimiento Preventivo
              </label>
              <input
                type="date"
                value={fechaUltimoMantenimientoPreventivo}
                onChange={(e) => setFechaUltimoMantenimientoPreventivo(e.target.value)}
                className="w-full bg-white border border-[#8d8d8d] px-3 py-1.5 text-xs focus:outline-hidden focus:ring-1 focus:ring-[#0f62fe]"
                required
              />
            </div>
          </div>

          {/* Fila 6: Ubicación Detallada */}
          <div>
            <label className="block text-xs font-semibold text-[#161616] uppercase mb-1">
              Ubicación Detallada en Aeropuerto (Opcional)
            </label>
            <input
              type="text"
              value={ubicacionDetalle}
              onChange={(e) => setUbicacionDetalle(e.target.value)}
              placeholder="Ej: Cabecera 35R, Caseta Central VOR, 1.2 NM al Norte"
              className="w-full bg-white border border-[#8d8d8d] px-3 py-1.5 text-xs focus:outline-hidden focus:ring-1 focus:ring-[#0f62fe]"
            />
          </div>

          {/* Botones de acción */}
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
              className="flex items-center space-x-2 px-5 py-2 bg-[#0f62fe] hover:bg-[#0353e9] text-white text-xs font-bold tracking-wide transition-colors shadow-xs"
            >
              <Save className="w-4 h-4" />
              <span>GUARDAR CONFIGURACIÓN DE EQUIPO</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
