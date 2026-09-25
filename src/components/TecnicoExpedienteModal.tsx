import React from 'react';
import { User, Pencil, UserMinus, Plane, BarChart3 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Tecnico } from '../types';
import { formatearFecha, getClasesEstadoComision } from '../utils/maintenance';
import {
  ExpedienteModal,
  BotonEncabezado,
  Seccion,
  AccionSeccion,
  ListaFilas,
  EstadoVacio,
} from './expediente/ExpedienteLayout';

interface TecnicoExpedienteModalProps {
  tecnico: Tecnico;
  /** Estado operativo (solo personal del Laboratorio) con las clases de su badge. */
  estado: { etiqueta: string; clases: string } | null;
  onClose: () => void;
  onEditar: (tecnico: Tecnico) => void;
  onDarDeBaja: (tecnico: Tecnico) => void;
  onVerComisiones: (nombreCompleto: string) => void;
}

const MS_DIA = 24 * 60 * 60 * 1000;

// Días corridos entre dos fechas YYYY-MM-DD, contando ambos extremos.
const diasEntre = (desde: string, hasta: string): number => {
  const d = new Date(`${desde}T00:00:00`).getTime();
  const h = new Date(`${hasta}T00:00:00`).getTime();
  return Math.max(1, Math.round((h - d) / MS_DIA) + 1);
};

const Dato: React.FC<{ etiqueta: string; children: React.ReactNode }> = ({
  etiqueta,
  children,
}) => (
  <div>
    <span className="text-[#525252] block">{etiqueta}</span>
    <span className="font-semibold">{children}</span>
  </div>
);

export const TecnicoExpedienteModal: React.FC<TecnicoExpedienteModalProps> = ({
  tecnico,
  estado,
  onClose,
  onEditar,
  onDarDeBaja,
  onVerComisiones,
}) => {
  const { comisiones } = useApp();

  // Comisiones donde participó, sin canceladas (las eliminadas ya no llegan acá).
  const comisionesTecnico = comisiones
    .filter((c) => c.tecnicosIds.includes(tecnico.id) && c.estado !== 'Cancelada')
    .sort((a, b) => b.fechaSalida.localeCompare(a.fechaSalida));
  const ultimas = comisionesTecnico.slice(0, 5);

  // Resumen con las comisiones ya cumplidas.
  const finalizadas = comisionesTecnico.filter((c) => c.estado === 'Finalizada');
  const diasEnComision = finalizadas.reduce(
    (acc, c) =>
      acc + diasEntre(c.fechaSalidaReal || c.fechaSalida, c.fechaRegresoReal || c.fechaRegreso),
    0
  );
  const aeropuertosVisitados = new Set(finalizadas.flatMap((c) => c.destinosAeropuertos)).size;

  const nombreCompleto = `${tecnico.apellido} ${tecnico.nombre}`;

  return (
    <ExpedienteModal
      icono={<User className="w-5 h-5" />}
      encabezado={
        <>
          <span className="text-sm font-bold">
            <span className="uppercase">{tecnico.apellido}</span>, {tecnico.nombre}
          </span>
          {estado ? (
            <span
              className={`text-xs px-2 py-0.5 font-bold uppercase ${estado.clases}`}
            >
              {estado.etiqueta}
            </span>
          ) : (
            <span className="text-[10px] px-1.5 py-0.5 font-bold uppercase tracking-wider bg-[#e0e0e0] text-[#525252]">
              Externo
            </span>
          )}
        </>
      }
      accionesEncabezado={
        <>
          <BotonEncabezado onClick={() => onEditar(tecnico)} title="Editar técnico">
            <Pencil className="w-4 h-4" />
          </BotonEncabezado>
          <button
            onClick={() => onDarDeBaja(tecnico)}
            title="Dar de baja"
            className="p-2 bg-white hover:bg-[#da1e28] text-[#da1e28] hover:text-white border border-[#ffb3b8] transition-colors cursor-pointer"
          >
            <UserMinus className="w-4 h-4" />
          </button>
        </>
      }
      onClose={onClose}
    >
      {/* Datos personales */}
      <Seccion icono={<User className="w-4 h-4" />} titulo="Datos Personales">
        <div className="bg-[#f4f4f4] p-4 border border-[#e0e0e0]">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-[#161616]">
            <Dato etiqueta="Puesto">{tecnico.puesto}</Dato>
            <Dato etiqueta="Correo Electrónico">{tecnico.email}</Dato>
            <Dato etiqueta="DNI">{tecnico.dni}</Dato>
          </div>
        </div>
      </Seccion>

      {/* Últimas comisiones */}
      <Seccion
        icono={<Plane className="w-4 h-4" />}
        titulo={`Últimas Comisiones (${ultimas.length})`}
        accion={
          <AccionSeccion onClick={() => onVerComisiones(nombreCompleto)}>Ver todos</AccionSeccion>
        }
      >
        {ultimas.length === 0 ? (
          <EstadoVacio>Este técnico no participó en ninguna comisión.</EstadoVacio>
        ) : (
          <ListaFilas>
            {ultimas.map((c) => (
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
                  <span className="flex flex-wrap gap-1">
                    {c.destinosAeropuertos.map((codigo) => (
                      <span
                        key={codigo}
                        className="bg-[#161616] text-white px-2 py-0.5 font-mono font-bold text-[10px] tracking-wider"
                      >
                        {codigo}
                      </span>
                    ))}
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

      {/* Resumen de actividad */}
      <Seccion icono={<BarChart3 className="w-4 h-4" />} titulo="Resumen de Actividad">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { etiqueta: 'Comisiones finalizadas', valor: finalizadas.length },
            { etiqueta: 'Días en comisión', valor: diasEnComision },
            { etiqueta: 'Aeropuertos visitados', valor: aeropuertosVisitados },
          ].map(({ etiqueta, valor }) => (
            <div key={etiqueta} className="bg-white border border-[#e0e0e0] p-3.5">
              <div className="text-xs uppercase font-bold tracking-wider text-[#525252]">
                {etiqueta}
              </div>
              <div className="text-2xl font-bold font-mono mt-1 text-[#161616]">{valor}</div>
            </div>
          ))}
        </div>
      </Seccion>
    </ExpedienteModal>
  );
};
