import React, { useEffect, useRef, useState } from 'react';
import { Radio, Plane, ShieldCheck, Layers, History, ChevronDown } from 'lucide-react';
import { useApp } from '../context/AppContext';

export type VistaActiva =
  | 'comisiones-maestro'
  | 'comisiones-logs'
  | 'radioayudas'
  | 'nomina'
  | 'aeropuertos';

interface HeaderProps {
  vistaActiva: VistaActiva;
  setVistaActiva: (vista: VistaActiva) => void;
}

const OPCIONES_COMISIONES: { vista: VistaActiva; label: string; icon: React.ElementType }[] = [
  { vista: 'comisiones-maestro', label: 'Maestro de Comisiones', icon: Plane },
  { vista: 'comisiones-logs', label: 'Historial de Comisiones', icon: History },
];

export const Header: React.FC<HeaderProps> = ({ vistaActiva, setVistaActiva }) => {
  const { equipos } = useApp();
  const [menuComisionesAbierto, setMenuComisionesAbierto] = useState(false);
  const menuRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const equiposFueraServicio = equipos.filter((e) => e.estadoOperativo === 'FUERA_DE_SERVICIO').length;
  const enModuloComisiones = vistaActiva === 'comisiones-maestro' || vistaActiva === 'comisiones-logs';

  // Cierra el menú desplegable de Comisiones al hacer click fuera del botón y del panel
  // (son hermanos en el DOM, no un único contenedor, para que el panel no quede
  // clipeado por el overflow-x-auto del <nav>).
  useEffect(() => {
    const handleClickFuera = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        menuRef.current &&
        !menuRef.current.contains(target) &&
        panelRef.current &&
        !panelRef.current.contains(target)
      ) {
        setMenuComisionesAbierto(false);
      }
    };
    document.addEventListener('mousedown', handleClickFuera);
    return () => document.removeEventListener('mousedown', handleClickFuera);
  }, []);

  const seleccionarOpcionComisiones = (vista: VistaActiva) => {
    setVistaActiva(vista);
    setMenuComisionesAbierto(false);
  };

  return (
    <header className="bg-[#161616] text-[#f4f4f4] border-b border-[#393939] sticky top-0 z-40 shadow-sm">
      {/* Barra superior estilo IBM Maximo Shell */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          {/* Logo e Identidad del Sistema */}
          <div className="flex items-center space-x-3">
            <div className="bg-[#0f62fe] text-white p-2 rounded flex items-center justify-center shadow-inner">
              <Radio className="w-5 h-5" />
            </div>
            <span className="text-sm font-semibold tracking-wide text-white uppercase">
              Laboratorio
            </span>
          </div>

          {/* Usuario que inició sesión */}
          <div className="flex items-center space-x-2 pl-2">
            <div className="w-8 h-8 rounded-full bg-[#0043ce] text-white font-bold flex items-center justify-center text-xs border border-[#4589ff]">
              FT
            </div>
            <div className="hidden lg:block text-left text-xs">
              <div className="font-medium text-white leading-tight">Ing. Fran</div>
              <div className="text-[10px] text-[#8d8d8d]">Admin Técnico Central</div>
            </div>
          </div>
        </div>
      </div>

      {/* Barra de Módulos / Aplicaciones estilo IBM Maximo */}
      <div className="bg-[#262626] border-t border-[#393939]">
        {/* Este contenedor (y no <nav>, que tiene overflow-x-auto y clipearía
            un hijo absoluto que sobresalga verticalmente) es el ancla de posición
            del menú desplegable de Comisiones. */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <nav className="flex space-x-1 overflow-x-auto py-1.5 scrollbar-none" aria-label="Tabs">
            <button
              ref={menuRef}
              onClick={() => setMenuComisionesAbierto((prev) => !prev)}
              className={`flex items-center space-x-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-all whitespace-nowrap cursor-pointer ${
                enModuloComisiones
                  ? 'border-[#0f62fe] bg-[#393939] text-white'
                  : 'border-transparent text-[#c6c6c6] hover:bg-[#333333] hover:text-white'
              }`}
            >
              <Plane className="w-4.5 h-4.5 text-[#82cfff]" />
              <span>Comisiones</span>
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform ${menuComisionesAbierto ? 'rotate-180' : ''}`}
              />
            </button>

            <button
              onClick={() => setVistaActiva('aeropuertos')}
              className={`flex items-center space-x-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-all whitespace-nowrap cursor-pointer ${
                vistaActiva === 'aeropuertos'
                  ? 'border-[#0f62fe] bg-[#393939] text-white'
                  : 'border-transparent text-[#c6c6c6] hover:bg-[#333333] hover:text-white'
              }`}
            >
              <Layers className="w-4.5 h-4.5 text-[#ff7eb6]" />
              <span>Aeropuertos</span>
            </button>

            <button
              onClick={() => setVistaActiva('radioayudas')}
              className={`flex items-center space-x-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-all whitespace-nowrap cursor-pointer ${
                vistaActiva === 'radioayudas'
                  ? 'border-[#0f62fe] bg-[#393939] text-white'
                  : 'border-transparent text-[#c6c6c6] hover:bg-[#333333] hover:text-white'
              }`}
            >
              <Radio className="w-4.5 h-4.5 text-[#3ddbd9]" />
              <span>Inventario y Semáforos de Radioayudas</span>
              {equiposFueraServicio > 0 && (
                <span className="ml-1 bg-[#da1e28] text-white px-2 py-0.5 rounded-full text-xs font-bold">
                  {equiposFueraServicio} fuera serv.
                </span>
              )}
            </button>

            <button
              onClick={() => setVistaActiva('nomina')}
              className={`flex items-center space-x-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-all whitespace-nowrap cursor-pointer ${
                vistaActiva === 'nomina'
                  ? 'border-[#0f62fe] bg-[#393939] text-white'
                  : 'border-transparent text-[#c6c6c6] hover:bg-[#333333] hover:text-white'
              }`}
            >
              <ShieldCheck className="w-4.5 h-4.5 text-[#42be65]" />
              <span>Técnicos</span>
            </button>

          </nav>

          {menuComisionesAbierto && (
            <div
              ref={panelRef}
              className="absolute left-4 sm:left-6 lg:left-8 top-full mt-1 w-72 bg-[#262626] border border-[#393939] shadow-lg z-50 py-1"
            >
              {OPCIONES_COMISIONES.map(({ vista, label, icon: Icon }) => (
                <button
                  key={vista}
                  onClick={() => seleccionarOpcionComisiones(vista)}
                  className={`w-full flex items-center space-x-2.5 px-4 py-2.5 text-sm text-left whitespace-nowrap transition-colors cursor-pointer ${
                    vistaActiva === vista
                      ? 'bg-[#393939] text-white'
                      : 'text-[#c6c6c6] hover:bg-[#333333] hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4 text-[#82cfff] shrink-0" />
                  <span>{label}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
