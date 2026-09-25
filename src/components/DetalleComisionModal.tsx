import React from 'react';
import {
  FileText,
  Calendar,
  MapPin,
  Users,
  Truck,
  Plane,
  Wrench,
  Printer,
  CheckCircle2,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ComisionServicio } from '../types';
import {
  formatearFecha,
  calcularDiscrepanciaDias,
  getClasesEstadoComision,
} from '../utils/maintenance';
import {
  ExpedienteModal,
  BotonEncabezado,
  Seccion,
  ListaFilas,
  EstadoVacio,
  Aviso,
  ChipCodigo,
} from './expediente/ExpedienteLayout';

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
  const { aeropuertos, nomina, equipos, intervenciones } = useApp();

  if (!isOpen) return null;

  // Filtrar intervenciones de esta comisión
  const intervencionesComision = intervenciones.filter((i) => i.comisionId === comision.id);

  const imprimirExpediente = () => {
    window.print();
  };

  const puedeCerrar =
    comision.estado !== 'Finalizada' && comision.estado !== 'Cancelada' && !!onAbrirCierre;

  return (
    <ExpedienteModal
      icono={<FileText className="w-5 h-5" />}
      encabezado={
        <>
          <span className="text-xs font-mono font-bold bg-[#393939] text-[#82cfff] px-2 py-0.5 print:border print:border-black print:text-black">
            EXPEDIENTE {comision.codigo}
          </span>
          <span
            className={`text-xs px-2 py-0.5 font-bold uppercase ${
              getClasesEstadoComision(comision.estado).badge
            }`}
          >
            {comision.estado}
          </span>
        </>
      }
      accionesEncabezado={
        <BotonEncabezado onClick={imprimirExpediente} title="Imprimir / Exportar Reporte">
          <Printer className="w-4 h-4" />
        </BotonEncabezado>
      }
      pieIzquierda={`ID: ${comision.id}`}
      accionesPie={
        puedeCerrar && (
          <button
            type="button"
            onClick={onAbrirCierre}
            className="flex items-center space-x-1.5 px-4 py-2 bg-[#0f62fe] hover:bg-[#0353e9] text-white text-xs font-semibold tracking-wide transition-colors cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Ejecutar Guía de Cierre</span>
          </button>
        )
      }
      onClose={onClose}
    >
      {/* Cronograma Oficial */}
      <Seccion icono={<Calendar className="w-4 h-4" />} titulo="Cronograma Oficial">
        <div className="bg-[#f4f4f4] p-4 border border-[#e0e0e0]">
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
      </Seccion>

      {/* Destinos Visitados */}
      <Seccion icono={<MapPin className="w-4 h-4" />} titulo="Aeropuertos de Destino">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
          {comision.destinosAeropuertos.map((codigo) => {
            const aero = aeropuertos.find((a) => a.codigoIATA === codigo);
            return (
              <div
                key={codigo}
                className="bg-white border border-[#e0e0e0] p-2.5 flex items-start space-x-2"
              >
                <ChipCodigo>{codigo}</ChipCodigo>
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
      </Seccion>

      {/* Personal técnico */}
      <Seccion
        icono={<Users className="w-4 h-4" />}
        titulo={`Personal Técnico Participante (${comision.tecnicosIds.length})`}
      >
        <ListaFilas>
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
                <span className={`font-semibold ${esJefe ? 'text-[#002d9c]' : 'text-[#161616]'}`}>
                  <span className="uppercase">{tec.apellido}</span>, {tec.nombre}
                </span>
                <span className={`font-medium ${esJefe ? 'text-[#002d9c]' : 'text-[#0f62fe]'}`}>
                  {tec.puesto}
                </span>
              </div>
            );
          })}
        </ListaFilas>
      </Seccion>

      {/* Tareas realizadas */}
      <Seccion
        icono={<Wrench className="w-4 h-4" />}
        titulo={`Tareas Realizadas (${intervencionesComision.length})`}
      >
        {intervencionesComision.length === 0 ? (
          <EstadoVacio>
            No hay tareas o intervenciones registradas para esta comisión todavía.
            {puedeCerrar && (
              <div className="mt-2">
                <button
                  onClick={onAbrirCierre}
                  className="px-3 py-1.5 bg-[#0f62fe] text-white font-medium hover:bg-[#0353e9] cursor-pointer"
                >
                  Iniciar Guía de Cierre de Comisión
                </button>
              </div>
            )}
          </EstadoVacio>
        ) : (
          <ListaFilas>
            {intervencionesComision.map((int) => {
              const eq = equipos.find((e) => e.id === int.equipoId);

              return (
                <div key={int.id} className="p-3 bg-white space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                      <ChipCodigo>{eq?.identificador || int.equipoId}</ChipCodigo>
                      <span className="bg-[#edf5ff] text-[#002d9c] border border-[#b9d3ff] px-2 py-0.5 text-xs font-bold">
                        {int.tipoIntervencion === 'Preventivo' && int.tipoPreventivo
                          ? int.tipoPreventivo
                          : int.tipoIntervencion}
                      </span>
                      {int.subtipoVerificacionAerea === 'Con alarmas' && (
                        <span className="px-2 py-0.5 text-xs font-bold border bg-[#ffebee] text-[#da1e28] border-[#ffb3b8]">
                          Con alarmas
                        </span>
                      )}
                      <span className="text-[#6f6f6f]">• {formatearFecha(int.fechaEjecucion)}</span>
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
                    <Aviso tipo="advertencia" conIcono>
                      <strong>Tarea Pendiente para Próxima Visita:</strong>{' '}
                      {int.tareaPendienteProximaVisita}
                    </Aviso>
                  )}
                </div>
              );
            })}
          </ListaFilas>
        )}
      </Seccion>

      {/* Motivo de cancelación si fue cancelada */}
      {comision.estado === 'Cancelada' && (
        <Aviso tipo="error">
          <span className="font-bold block uppercase mb-1">
            Comisión Cancelada
            {comision.canceladaAt ? ` (${formatearFecha(comision.canceladaAt)})` : ''}:
          </span>
          <p className="text-[#161616]">
            {comision.motivoCancelacion || 'No se registró un motivo de cancelación.'}
          </p>
        </Aviso>
      )}
    </ExpedienteModal>
  );
};
