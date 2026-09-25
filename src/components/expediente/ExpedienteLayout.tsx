import React from 'react';
import { X, AlertTriangle } from 'lucide-react';

/**
 * Plantilla común de los expedientes (comisión, aeropuerto, y los que vengan).
 *
 * Estructura fija:
 *   1. Encabezado oscuro: ícono + identificación (izquierda) | acciones + cerrar (derecha)
 *   2. Cuerpo con scroll: una o más <Seccion>
 *   3. Pie gris: dato de referencia (izquierda) | acciones propias + "Cerrar Vista" (derecha)
 *
 * Cada expediente solo decide QUÉ mostrar; el formato (tamaños, colores, vacíos,
 * avisos, impresión) vive acá.
 */

interface ExpedienteModalProps {
  icono: React.ReactNode;
  /** Identificación del registro (código, estado, nombre...). */
  encabezado: React.ReactNode;
  /** Botones propios del encabezado (imprimir, editar, eliminar...). Se ubican antes de la X. */
  accionesEncabezado?: React.ReactNode;
  /** Dato de referencia a la izquierda del pie (ej: ID del registro). */
  pieIzquierda?: React.ReactNode;
  /** Botones propios del pie, a la izquierda de "Cerrar Vista". */
  accionesPie?: React.ReactNode;
  onClose: () => void;
  children: React.ReactNode;
}

export const ExpedienteModal: React.FC<ExpedienteModalProps> = ({
  icono,
  encabezado,
  accionesEncabezado,
  pieIzquierda,
  accionesPie,
  onClose,
  children,
}) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-xs p-4 overflow-y-auto print:p-0 print:bg-white print:static">
    <div className="bg-white border border-[#393939] shadow-2xl w-full max-w-5xl my-8 rounded-none overflow-hidden print:border-none print:shadow-none print:my-0">
      {/* Encabezado */}
      <div className="bg-[#161616] text-white px-6 py-4 flex items-center justify-between border-b border-[#393939] print:bg-white print:text-black print:border-b-2 print:border-black">
        <div className="flex items-center space-x-3 min-w-0">
          <div className="bg-[#0f62fe] p-1.5 text-white shrink-0 print:hidden">{icono}</div>
          <div className="flex items-center space-x-2 min-w-0 flex-wrap gap-y-1">{encabezado}</div>
        </div>

        <div className="flex items-center space-x-2 shrink-0 print:hidden">
          {accionesEncabezado}
          <button
            onClick={onClose}
            className="text-[#a8a8a8] hover:text-white p-1 hover:bg-[#393939] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Cuerpo */}
      <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto print:max-h-none print:overflow-visible">
        {children}
      </div>

      {/* Pie */}
      <div className="bg-[#f4f4f4] px-6 py-3 border-t border-[#e0e0e0] flex items-center justify-between print:hidden">
        <span className="text-[11px] text-[#6f6f6f] font-mono">{pieIzquierda}</span>
        <div className="flex items-center space-x-3">
          {accionesPie}
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-[#8d8d8d] text-xs font-medium text-[#161616] hover:bg-[#e0e0e0] transition-colors cursor-pointer"
          >
            Cerrar Vista
          </button>
        </div>
      </div>
    </div>
  </div>
);

/** Botón cuadrado del encabezado oscuro (imprimir, editar). */
export const BotonEncabezado: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = ({
  className = '',
  ...props
}) => (
  <button
    {...props}
    className={`p-2 bg-[#262626] hover:bg-[#393939] text-white border border-[#525252] transition-colors cursor-pointer ${className}`}
  />
);

interface SeccionProps {
  icono: React.ReactNode;
  titulo: React.ReactNode;
  /** Enlace o acción junto al título (ej: "Ver todos"). */
  accion?: React.ReactNode;
  children: React.ReactNode;
}

/** Bloque del cuerpo: título en mayúsculas con ícono azul + contenido. */
export const Seccion: React.FC<SeccionProps> = ({ icono, titulo, accion, children }) => (
  <div>
    <div className="mb-2 flex items-center space-x-3">
      <h3 className="text-xs font-bold text-[#161616] uppercase tracking-wider flex items-center space-x-1.5">
        <span className="text-[#0f62fe] flex">{icono}</span>
        <span>{titulo}</span>
      </h3>
      {accion}
    </div>
    {children}
  </div>
);

/** Enlace discreto que va junto al título de una sección. */
export const AccionSeccion: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = ({
  className = '',
  ...props
}) => (
  <button
    {...props}
    className={`text-xs text-[#525252] hover:text-[#161616] hover:underline transition-colors cursor-pointer ${className}`}
  />
);

/** Lista de filas separadas por línea (personal, tareas, comisiones, pendientes...). */
export const ListaFilas: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="border border-[#e0e0e0] divide-y divide-[#e0e0e0]">{children}</div>
);

/** Mensaje cuando una sección no tiene registros. */
export const EstadoVacio: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="bg-[#f4f4f4] border border-[#e0e0e0] p-4 text-center text-xs text-[#8d8d8d]">
    {children}
  </div>
);

/** Recuadro informativo con borde a la izquierda. */
export const Aviso: React.FC<{
  tipo: 'error' | 'advertencia';
  children: React.ReactNode;
  conIcono?: boolean;
  className?: string;
}> = ({ tipo, children, conIcono, className = '' }) => {
  const estilo =
    tipo === 'error'
      ? 'bg-[#fff1f1] border-[#da1e28] text-[#da1e28]'
      : 'bg-[#fff8e1] border-[#f1c21b] text-[#8a6100]';
  return (
    <div className={`border-l-4 p-3 text-xs ${estilo} ${conIcono ? 'flex items-start space-x-2' : ''} ${className}`}>
      {conIcono && <AlertTriangle className="w-3.5 h-3.5 text-[#f1c21b] shrink-0 mt-0.5" />}
      <div>{children}</div>
    </div>
  );
};

/** Código o identificador destacado (IATA, equipo). */
export const ChipCodigo: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span className="font-mono font-bold bg-[#161616] text-white px-2 py-0.5 text-xs inline-block">
    {children}
  </span>
);
