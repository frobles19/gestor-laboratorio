import React from 'react';
import {
  X,
  FileText,
  Calendar,
  MapPin,
  Users,
  Truck,
  Plane,
  Wrench,
  AlertTriangle,
  Printer,
  CheckCircle2,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ComisionServicio } from '../types';
import { formatearFecha, calcularDiscrepanciaDias } from '../utils/maintenance';

interface DetalleComisionModalProps {
  comision: ComisionServicio;
  isOpen: boolean;
  onClose: () => void;
  onAbrirCierre?: () => void;
}

export const DetalleComisionModal: React.FC<DetalleComisionModalProps> = ({
  comision,
  isOpen,
  onClose,
  onAbrirCierre,
}) => {
  const { aeropuertos, nomina, equipos, intervenciones, novedades } = useApp();

  if (!isOpen) return null;

  // Filtrar intervenciones y novedades de esta comisión
  const intervencionesComision = intervenciones.filter(
    (i) => i.comisionId === comision.id
  );
  const novedadesComision = novedades.filter((n) => n.comisionId === comision.id);

  const imprimirExpediente = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-xs p-4 overflow-y-auto print:p-0 print:bg-white print:static">
      <div className="bg-white border border-[#393939] shadow-2xl w-full max-w-4xl my-8 rounded-none overflow-hidden print:border-none print:shadow-none print:my-0">
        {/* Encabezado estilo IBM Maximo Record View */}
        <div className="bg-[#161616] text-white px-6 py-4 flex items-center justify-between border-b border-[#393939] print:bg-white print:text-black print:border-b-2 print:border-black">
          <div className="flex items-center space-x-3">
            <div className="bg-[#0f62fe] p-1.5 text-white print:hidden">
              <FileText className="w-5 h-5" />
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-mono font-bold bg-[#393939] text-[#82cfff] px-2 py-0.5 print:border print:border-black print:text-black">
                EXPEDIENTE {comision.codigo}
              </span>
              <span
                className={`text-xs px-2 py-0.5 font-bold uppercase ${
                  comision.estado === 'Finalizada'
                    ? 'bg-[#defbe6] text-[#0e6027]'
                    : comision.estado === 'En Curso'
                    ? 'bg-[#d0e2ff] text-[#002d9c]'
                    : comision.estado === 'Cancelada'
                    ? 'bg-[#fff1f1] text-[#da1e28] border border-[#ffb3b8]'
                    : 'bg-[#f4f4f4] text-[#393939] border border-[#8d8d8d]'
                }`}
              >
                {comision.estado}
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-2 print:hidden">
            <button
              onClick={imprimirExpediente}
              className="p-2 bg-[#262626] hover:bg-[#393939] text-white border border-[#525252] transition-colors"
              title="Imprimir / Exportar Reporte"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="text-[#a8a8a8] hover:text-white p-1 hover:bg-[#393939] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Contenido del Expediente */}
        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto print:max-h-none print:overflow-visible">
          {/* Cronograma Oficial */}
          <div className="bg-[#f4f4f4] p-4 border border-[#e0e0e0]">
            <div className="text-[11px] font-bold text-[#6f6f6f] uppercase tracking-wider mb-2 flex items-center space-x-1">
              <Calendar className="w-3.5 h-3.5 text-[#0f62fe]" />
              <span>Cronograma Oficial</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-[#161616]">
              <div>
                <span className="text-[#525252] block">Fecha de Salida</span>
                <span className="font-mono font-semibold">
                  {formatearFecha(comision.fechaSalidaReal || comision.fechaSalida)}
                </span>
              </div>
              <div>
                <span className="text-[#525252] block">Fecha de Llegada</span>
                <span className="font-mono font-semibold">
                  {formatearFecha(comision.fechaRegresoReal || comision.fechaRegreso)}
                </span>
              </div>
              <div>
                <span className="text-[#525252] block">Medio de Transporte</span>
                <span className="font-bold flex items-center space-x-1.5">
                  {comision.medioTransporte === 'Aéreo' ? (
                    <Plane className="w-3.5 h-3.5 text-[#0f62fe]" />
                  ) : (
                    <Truck className="w-3.5 h-3.5 text-[#0f62fe]" />
                  )}
                  <span>{comision.medioTransporte}</span>
                </span>
              </div>
            </div>
            {(() => {
              const discrepancia = calcularDiscrepanciaDias(
                comision.fechaRegresoReal,
                comision.fechaRegreso
              );
              if (!comision.fechaRegresoReal || discrepancia === 0) return null;
              return (
                <div
                  className={`mt-2.5 pt-2 border-t border-[#e0e0e0] text-xs font-semibold ${
                    discrepancia > 0 ? 'text-[#da1e28]' : 'text-[#0e6027]'
                  }`}
                >
                  {discrepancia > 0
                    ? `Se extendió ${discrepancia} día${discrepancia === 1 ? '' : 's'} respecto a lo programado.`
                    : `Finalizó ${Math.abs(discrepancia)} día${Math.abs(discrepancia) === 1 ? '' : 's'} antes de lo programado.`}
                </div>
              );
            })()}
          </div>

          {/* Destinos Visitados */}
          <div>
            <h3 className="text-xs font-bold text-[#161616] uppercase tracking-wider mb-2 flex items-center space-x-1.5">
              <MapPin className="w-4 h-4 text-[#0f62fe]" />
              <span>Aeropuertos de Destino</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
              {comision.destinosAeropuertos.map((codigo) => {
                const aero = aeropuertos.find((a) => a.codigoIATA === codigo);
                return (
                  <div
                    key={codigo}
                    className="bg-white border border-[#e0e0e0] p-2.5 flex items-start space-x-2"
                  >
                    <span className="font-mono font-bold bg-[#161616] text-white px-2 py-0.5 text-xs">
                      {codigo}
                    </span>
                    <div className="text-xs">
                      <div className="font-semibold text-[#161616] leading-tight">
                        {aero?.nombreOficial || codigo}
                      </div>
                      <div className="text-[10px] text-[#6f6f6f] uppercase font-mono">
                        {aero?.region}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Nómina de Técnicos Participantes */}
          <div>
            <h3 className="text-xs font-bold text-[#161616] uppercase tracking-wider mb-2 flex items-center space-x-1.5">
              <Users className="w-4 h-4 text-[#0f62fe]" />
              <span>Personal Técnico Participante ({comision.tecnicosIds.length})</span>
            </h3>
            <div className="border border-[#e0e0e0] divide-y divide-[#e0e0e0]">
              {comision.tecnicosIds.map((tid) => {
                const tec = nomina.find((t) => t.id === tid);
                if (!tec) return null;
                const esJefe = tec.id === comision.jefeComisionId;

                return (
                  <div
                    key={tec.id}
                    className={`p-2.5 flex items-center justify-between text-xs ${
                      esJefe ? 'bg-[#f0f7ff]' : 'bg-white'
                    }`}
                  >
                    <span
                      className={`font-semibold ${esJefe ? 'text-[#002d9c]' : 'text-[#161616]'}`}
                    >
                      <span className="uppercase">{tec.apellido}</span>, {tec.nombre}
                    </span>
                    <span className={`font-medium ${esJefe ? 'text-[#002d9c]' : 'text-[#0f62fe]'}`}>
                      {tec.puesto}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Historial de Tareas e Intervenciones Técnicas */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold text-[#161616] uppercase tracking-wider flex items-center space-x-1.5">
                <Wrench className="w-4 h-4 text-[#0f62fe]" />
                <span>Tareas Realizadas ({intervencionesComision.length})</span>
              </h3>
            </div>

            {intervencionesComision.length === 0 ? (
              <div className="bg-[#f4f4f4] border border-[#e0e0e0] p-4 text-center text-xs text-[#8d8d8d]">
                No hay tareas o intervenciones registradas para esta comisión todavía.
                {comision.estado !== 'Finalizada' && comision.estado !== 'Cancelada' && onAbrirCierre && (
                  <div className="mt-2">
                    <button
                      onClick={onAbrirCierre}
                      className="px-3 py-1.5 bg-[#0f62fe] text-white font-medium hover:bg-[#0353e9]"
                    >
                      Iniciar Guía de Cierre de Comisión
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="border border-[#e0e0e0] divide-y divide-[#e0e0e0]">
                {intervencionesComision.map((int) => {
                  const eq = equipos.find((e) => e.id === int.equipoId);

                  return (
                    <div key={int.id} className="p-3 bg-white space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                          <span className="font-mono font-bold bg-[#161616] text-white px-2 py-0.5">
                            {eq?.identificador || int.equipoId}
                          </span>
                          <span className="bg-[#edf5ff] text-[#002d9c] border border-[#b9d3ff] px-2 py-0.5 text-xs font-bold">
                            {int.tipoIntervencion === 'Preventivo' && int.tipoPreventivo
                              ? int.tipoPreventivo
                              : int.tipoIntervencion}
                          </span>
                          {int.subtipoVerificacionAerea === 'Con alarmas' && (
                            <span className="px-2 py-0.5 text-xs font-bold border bg-[#fff1f1] text-[#da1e28] border-[#ffb3b8]">
                              Con alarmas
                            </span>
                          )}
                          <span className="text-[#6f6f6f]">
                            • {formatearFecha(int.fechaEjecucion)}
                          </span>
                        </div>
                        <span
                          className={`px-2 py-0.5 text-[10px] font-bold ${
                            int.estadoOperativoResultante === 'EN_SERVICIO'
                              ? 'bg-[#defbe6] text-[#0e6027]'
                              : 'bg-[#ffebee] text-[#da1e28]'
                          }`}
                        >
                          {int.estadoOperativoResultante}
                        </span>
                      </div>

                      <div className="bg-[#f4f4f4] p-2.5 font-mono text-[11px] text-[#161616] border border-[#e0e0e0]">
                        <span className="font-bold text-[#0043ce] block mb-0.5 font-sans uppercase text-[10px]">
                          Detalles Técnicos:
                        </span>
                        {int.detalleTecnico}
                      </div>

                      {int.tareaPendienteProximaVisita && (
                        <div className="bg-[#fff8e1] border-l-2 border-[#f1c21b] p-2 text-[11px] text-[#8a6100] flex items-center space-x-1.5">
                          <AlertTriangle className="w-3.5 h-3.5 text-[#f1c21b] shrink-0" />
                          <span>
                            <strong>Tarea Pendiente para Próxima Visita:</strong>{' '}
                            {int.tareaPendienteProximaVisita}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Novedades y Observaciones por Aeropuerto */}
          <div>
            <h3 className="text-xs font-bold text-[#161616] uppercase tracking-wider mb-2 flex items-center space-x-1.5">
              <FileText className="w-4 h-4 text-[#0f62fe]" />
              <span>Novedades ({novedadesComision.length})</span>
            </h3>

            {novedadesComision.length === 0 ? (
              <div className="bg-[#f4f4f4] border border-[#e0e0e0] p-3 text-xs text-[#8d8d8d]">
                Sin novedades de infraestructura u observaciones reportadas en los aeropuertos
                visitados.
              </div>
            ) : (
              <div className="border border-[#e0e0e0] divide-y divide-[#e0e0e0]">
                {novedadesComision.map((nov) => {
                  const aero = aeropuertos.find((a) => a.codigoIATA === nov.aeropuertoCodigo);
                  return (
                    <div key={nov.id} className="p-3 bg-white text-xs">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="font-mono font-bold bg-[#161616] text-white px-2 py-0.5">
                          {aero?.nombreOficial || nov.aeropuertoCodigo}
                        </span>
                      </div>
                      <p className="text-[#525252]">{nov.observacion}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Motivo de cancelación si fue cancelada */}
          {comision.estado === 'Cancelada' && (
            <div className="bg-[#fff1f1] p-3 border-l-4 border-[#da1e28] text-xs">
              <span className="font-bold text-[#da1e28] block uppercase mb-1">
                Comisión Cancelada{comision.canceladaAt ? ` (${formatearFecha(comision.canceladaAt)})` : ''}:
              </span>
              <p className="text-[#161616]">
                {comision.motivoCancelacion || 'No se registró un motivo de cancelación.'}
              </p>
            </div>
          )}
        </div>

        {/* Pie de modal con acciones */}
        <div className="bg-[#f4f4f4] px-6 py-3 border-t border-[#e0e0e0] flex items-center justify-between print:hidden">
          <span className="text-[11px] text-[#6f6f6f] font-mono">
            ID: {comision.id}
          </span>

          <div className="flex items-center space-x-3">
            {comision.estado !== 'Finalizada' && comision.estado !== 'Cancelada' && onAbrirCierre && (
              <button
                type="button"
                onClick={onAbrirCierre}
                className="flex items-center space-x-1.5 px-4 py-2 bg-[#0f62fe] hover:bg-[#0353e9] text-white text-xs font-semibold tracking-wide transition-colors"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Ejecutar Guía de Cierre</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-[#8d8d8d] text-xs font-medium text-[#161616] hover:bg-[#e0e0e0] transition-colors"
            >
              Cerrar Vista
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
