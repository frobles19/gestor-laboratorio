import React, { useState } from 'react';
import { MapPin, Pencil, Trash2, Radio, Wrench, Plane } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Aeropuerto, EquipoInstalado } from '../types';
import {
  calcularEstadoVencimiento,
  getClasesSemaforo,
  getClasesEstadoComision,
  formatearFecha,
  formatearMesAnio,
  tipoPreventivoPorFrecuencia,
} from '../utils/maintenance';
import {
  ExpedienteModal,
  BotonEncabezado,
  Seccion,
  AccionSeccion,
  ListaFilas,
  EstadoVacio,
  Aviso,
  ChipCodigo,
} from './expediente/ExpedienteLayout';

interface AeropuertoFichaModalProps {
  aeropuerto: Aeropuerto;
  onClose: () => void;
  onEditar: (aeropuerto: Aeropuerto) => void;
  onVerComisiones: (nombreAeropuerto: string) => void;
}

// Par "etiqueta: valor" con el mismo formato en todas las celdas de la tabla.
const Dato: React.FC<{ etiqueta: string; valor: string; clase?: string }> = ({
  etiqueta,
  valor,
  clase,
}) => (
  <div className="whitespace-nowrap">
    <span className="text-[#6f6f6f]">{etiqueta}: </span>
    <span className={`font-mono font-semibold ${clase || 'text-[#161616]'}`}>{valor}</span>
  </div>
);

export const AeropuertoFichaModal: React.FC<AeropuertoFichaModalProps> = ({
  aeropuerto,
  onClose,
  onEditar,
  onVerComisiones,
}) => {
  const { equipos, modelos, comisiones, intervenciones, eliminarAeropuerto } = useApp();
  const [confirmandoEliminar, setConfirmandoEliminar] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const equiposAeropuerto = equipos.filter((e) => e.aeropuertoCodigo === aeropuerto.codigoIATA);

  // Tipo del último preventivo: se toma de la intervención preventiva cuya fecha
  // coincide con la del equipo (propia o de su equipo asociado, ya que comparten
  // el mantenimiento). Si no hay una intervención que lo respalde, no se inventa.
  const tipoUltimoPreventivo = (eq: EquipoInstalado): string => {
    const idsRelacionados = [eq.id, eq.equipoAsociadoId].filter(Boolean);
    const intervencion = intervenciones.find(
      (i) =>
        idsRelacionados.includes(i.equipoId) &&
        i.tipoIntervencion === 'Preventivo' &&
        i.fechaEjecucion === eq.fechaUltimoMantenimientoPreventivo &&
        i.tipoPreventivo
    );
    return intervencion?.tipoPreventivo || '—';
  };

  const comisionesAeropuerto = comisiones
    .filter((c) => c.destinosAeropuertos.includes(aeropuerto.codigoIATA))
    .sort((a, b) => b.fechaSalida.localeCompare(a.fechaSalida));

  // En el listado se muestran todas salvo las canceladas (las eliminadas ya no llegan acá).
  // Para bloquear la baja del aeropuerto se sigue considerando la lista completa.
  const comisionesListadas = comisionesAeropuerto.filter((c) => c.estado !== 'Cancelada');

  // Pendientes de la última intervención de cada equipo: es lo que hay que
  // resolver (repuestos, obras, etc.) en la próxima visita a este aeropuerto.
  const pendientes = equiposAeropuerto
    .map((eq) => {
      const ultima = intervenciones
        .filter((i) => i.equipoId === eq.id)
        .sort((a, b) => b.fechaEjecucion.localeCompare(a.fechaEjecucion))[0];
      return ultima?.tareaPendienteProximaVisita?.trim()
        ? {
            equipo: eq.identificador,
            texto: ultima.tareaPendienteProximaVisita.trim(),
            comisionCodigo: comisiones.find((c) => c.id === ultima.comisionId)?.codigo,
          }
        : null;
    })
    .filter((p): p is { equipo: string; texto: string; comisionCodigo: string | undefined } => !!p);

  // Se puede eliminar solo si no quedan equipos ni comisiones asociadas.
  const motivoBloqueo =
    equiposAeropuerto.length > 0
      ? `Tiene ${equiposAeropuerto.length} radioayuda(s) instalada(s)`
      : comisionesAeropuerto.length > 0
      ? `Figura en ${comisionesAeropuerto.length} comisión(es)`
      : null;

  const handleEliminar = () => {
    try {
      eliminarAeropuerto(aeropuerto.codigoIATA);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo eliminar el aeropuerto.');
      setConfirmandoEliminar(false);
    }
  };


  return (
    <ExpedienteModal
      icono={<MapPin className="w-5 h-5" />}
      encabezado={
        <>
          <span className="text-xs font-mono font-bold bg-[#393939] text-[#82cfff] px-2 py-0.5">
            {aeropuerto.codigoIATA}
          </span>
          <span className="text-sm font-bold">{aeropuerto.nombreOficial}</span>
          <span className="text-[10px] font-mono uppercase text-[#c6c6c6]">
            {aeropuerto.region}
          </span>
        </>
      }
      accionesEncabezado={
        <>
          <BotonEncabezado onClick={() => onEditar(aeropuerto)} title="Editar Aeropuerto">
            <Pencil className="w-4 h-4" />
          </BotonEncabezado>
          <button
            onClick={() => motivoBloqueo === null && setConfirmandoEliminar(true)}
            disabled={motivoBloqueo !== null}
            title={
              motivoBloqueo === null
                ? 'Eliminar Aeropuerto'
                : `No disponible: ${motivoBloqueo.toLowerCase()}`
            }
            className={
              motivoBloqueo === null
                ? 'p-2 bg-white hover:bg-[#da1e28] text-[#da1e28] hover:text-white border border-[#ffb3b8] transition-colors cursor-pointer'
                : 'p-2 bg-[#f4f4f4] text-[#c6c6c6] border border-[#e0e0e0] cursor-not-allowed'
            }
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </>
      }
      onClose={onClose}
    >
      {error && <Aviso tipo="error">{error}</Aviso>}

      {confirmandoEliminar && (
        <Aviso tipo="error">
          <div className="flex items-center justify-between gap-3">
            <span>
              Se eliminará <strong>{aeropuerto.codigoIATA}</strong> de la lista de aeródromos. Su
              código queda reservado.
            </span>
            <span className="flex items-center space-x-2 shrink-0">
              <button
                onClick={() => setConfirmandoEliminar(false)}
                className="px-3 py-1 border border-[#8d8d8d] bg-white text-[#161616] font-medium hover:bg-[#e0e0e0] transition-colors cursor-pointer"
              >
                Volver
              </button>
              <button
                onClick={handleEliminar}
                className="px-3 py-1 bg-[#da1e28] hover:bg-[#a2191f] text-white font-bold transition-colors cursor-pointer"
              >
                Sí, Eliminar
              </button>
            </span>
          </div>
        </Aviso>
      )}

      {/* Radioayudas instaladas */}
      <Seccion
        icono={<Radio className="w-4 h-4" />}
        titulo={`Radioayudas (${equiposAeropuerto.length})`}
      >
        {equiposAeropuerto.length === 0 ? (
          <EstadoVacio>Sin radioayudas registradas en este aeropuerto.</EstadoVacio>
        ) : (
          <div className="border border-[#e0e0e0] overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#262626] text-[#f4f4f4] uppercase tracking-wider font-semibold text-[11px]">
                  <th className="py-2 px-3 border-r border-[#393939]">Radioayuda</th>
                  <th className="py-2 px-3 border-r border-[#393939]">Estado</th>
                  <th className="py-2 px-3 border-r border-[#393939]">Verificación</th>
                  <th className="py-2 px-3 border-r border-[#393939]">Mantenimiento</th>
                  <th className="py-2 px-3">Próximo mantenimiento</th>
                </tr>
              </thead>
              <tbody>
                {equiposAeropuerto.map((eq) => {
                  const modelo = modelos.find((m) => m.id === eq.modeloId);
                  const verificacion = calcularEstadoVencimiento(
                    eq.fechaUltimaVerificacionAerea,
                    eq.frecuenciaVerificacionAereaMeses
                  );
                  const preventivo = calcularEstadoVencimiento(
                    eq.fechaUltimoMantenimientoPreventivo,
                    eq.frecuenciaMantenimientoPreventivoMeses
                  );
                  const tipoRealizado = tipoUltimoPreventivo(eq);
                  const tipoProximo = tipoPreventivoPorFrecuencia(
                    eq.frecuenciaMantenimientoPreventivoMeses
                  );

                  return (
                    <tr key={eq.id} className="border-t border-[#e0e0e0] bg-white align-top">
                      <td className="py-2.5 px-3 border-r border-[#e0e0e0]">
                        <ChipCodigo>{eq.identificador}</ChipCodigo>
                        {modelo && (
                          <div className="text-[11px] text-[#525252] mt-1">
                            {modelo.sistema} · {modelo.denominacion}
                          </div>
                        )}
                      </td>
                      <td className="py-2.5 px-3 border-r border-[#e0e0e0]">
                        <span
                          className={`px-2 py-0.5 text-[10px] font-bold ${
                            eq.estadoOperativo === 'EN_SERVICIO'
                              ? 'bg-[#defbe6] text-[#0e6027]'
                              : 'bg-[#ffebee] text-[#da1e28]'
                          }`}
                        >
                          {eq.estadoOperativo === 'EN_SERVICIO' ? 'E/S' : 'F/S'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 border-r border-[#e0e0e0] space-y-0.5">
                        <Dato
                          etiqueta="Realizada"
                          valor={formatearFecha(eq.fechaUltimaVerificacionAerea)}
                        />
                        <Dato
                          etiqueta="Vence"
                          valor={formatearFecha(verificacion.fechaLimite)}
                          clase={getClasesSemaforo(verificacion.nivel).text}
                        />
                      </td>
                      <td className="py-2.5 px-3 border-r border-[#e0e0e0] space-y-0.5">
                        <Dato
                          etiqueta="Realizado"
                          valor={formatearFecha(eq.fechaUltimoMantenimientoPreventivo)}
                        />
                        <Dato etiqueta="Tipo" valor={tipoRealizado} />
                      </td>
                      <td className="py-2.5 px-3 space-y-0.5">
                        <Dato
                          etiqueta="Fecha"
                          valor={formatearMesAnio(preventivo.fechaLimite)}
                          clase={getClasesSemaforo(preventivo.nivel).text}
                        />
                        <Dato etiqueta="Tipo" valor={tipoProximo} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Seccion>

      {/* Pendientes para la próxima visita */}
      <Seccion
        icono={<Wrench className="w-4 h-4" />}
        titulo={`Pendientes para la próxima visita (${pendientes.length})`}
      >
        {pendientes.length === 0 ? (
          <EstadoVacio>Sin tareas pendientes.</EstadoVacio>
        ) : (
          <ListaFilas>
            {pendientes.map((p) => (
              <Aviso key={p.equipo} tipo="advertencia" conIcono>
                <strong>{p.equipo}:</strong> {p.texto}
                {p.comisionCodigo && <span className="text-[#6f6f6f]"> ({p.comisionCodigo})</span>}
              </Aviso>
            ))}
          </ListaFilas>
        )}
      </Seccion>

      {/* Comisiones que visitaron el aeropuerto */}
      <Seccion
        icono={<Plane className="w-4 h-4" />}
        titulo={`Comisiones (${comisionesListadas.length})`}
        accion={
          <AccionSeccion onClick={() => onVerComisiones(aeropuerto.nombreOficial)}>
            Ver todos
          </AccionSeccion>
        }
      >
        {comisionesListadas.length === 0 ? (
          <EstadoVacio>Ninguna comisión tiene este aeropuerto como destino.</EstadoVacio>
        ) : (
          <ListaFilas>
            {comisionesListadas.map((c) => (
              <div
                key={c.id}
                className="p-3 bg-white flex flex-wrap items-center justify-between gap-2 text-xs"
              >
                <div className="flex items-center space-x-3 flex-wrap gap-y-1">
                  <span className="text-xs text-[#0f62fe] font-bold font-mono">{c.codigo}</span>
                  <span className="font-mono text-[#161616]">
                    {formatearFecha(c.fechaSalidaReal || c.fechaSalida)} –{' '}
                    {formatearFecha(c.fechaRegresoReal || c.fechaRegreso)}
                  </span>
                  <span className="text-[#525252]">{c.tiposMantenimiento.join(', ')}</span>
                </div>
                <span
                  className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                    getClasesEstadoComision(c.estado).badge
                  }`}
                >
                  {c.estado}
                </span>
              </div>
            ))}
          </ListaFilas>
        )}
      </Seccion>
    </ExpedienteModal>
  );
};
