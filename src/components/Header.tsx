import React, { useEffect, useRef, useState } from 'react';
import { Radio, Plane, ShieldCheck, Layers, History, ChevronDown, Cpu, Wrench, Ruler } from 'lucide-react';
import { useApp } from '../context/AppContext';

export type VistaActiva =
  | 'comisiones-maestro'
  | 'comisiones-logs'
  | 'radioayudas'
  | 'nomina'
  | 'aeropuertos'
  | 'modelos'
  | 'repuestos'
  | 'instrumental';

interface HeaderProps {
  vistaActiva: VistaActiva;
  setVistaActiva: (vista: VistaActiva) => void;
}

const OPCIONES_COMISIONES: { vista: VistaActiva; label: string; icon: React.ElementType }[] = [
  { vista: 'comisiones-maestro', label: 'Maestro de Comisiones', icon: Plane },
  { vista: 'comisiones-logs', label: 'Historial de Comisiones', icon: History },
];

const OPCIONES_ARTICULOS: { vista: VistaActiva; label: string; icon: React.ElementType }[] = [
  { vista: 'repuestos', label: 'Repuestos', icon: Wrench },
  { vista: 'instrumental', label: 'Instrumental', icon: Ruler },
];

export const Header: React.FC<HeaderProps> = ({ vistaActiva, setVistaActiva }) => {
  const { equipos } = useApp();
  const [menuComisionesAbierto, setMenuComisionesAbierto] = useState(false);
  const menuRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const [menuArticulosAbierto, setMenuArticulosAbierto] = useState(false);
  const menuArticulosRef = useRef<HTMLButtonElement>(null);
  const panelArticulosRef = useRef<HTMLDivElement>(null);
  const contenedorRef = useRef<HTMLDivElement>(null);
  // Posición horizontal del panel de Artículos, calculada a partir del botón
  // (a diferencia de Comisiones, no está primero en el menú, así que no le
  // sirve un offset fijo: tiene que abrirse justo debajo de su propio botón).
  const [articulosPanelLeft, setArticulosPanelLeft] = useState(0);

  const equiposFueraServicio = equipos.filter((e) => e.estadoOperativo === 'FUERA_DE_SERVICIO').length;
  const enModuloComisiones = vistaActiva === 'comisiones-maestro' || vistaActiva === 'comisiones-logs';
  const enModuloArticulos = vistaActiva === 'repuestos' || vistaActiva === 'instrumental';

  // Cierra los menúes desplegables al hacer click fuera del botón y del panel
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
      if (
        menuArticulosRef.current &&
        !menuArticulosRef.current.contains(target) &&
        panelArticulosRef.current &&
        !panelArticulosRef.current.contains(target)
      ) {
        setMenuArticulosAbierto(false);
      }
    };
    document.addEventListener('mousedown', handleClickFuera);
    return () => document.removeEventListener('mousedown', handleClickFuera);
  }, []);

  const seleccionarOpcionComisiones = (vista: VistaActiva) => {
    setVistaActiva(vista);
    setMenuComisionesAbierto(false);
  };

  const seleccionarOpcionArticulos = (vista: VistaActiva) => {
    setVistaActiva(vista);
    setMenuArticulosAbierto(false);
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
        <div ref={contenedorRef} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <nav className="flex space-x-1 overflow-x-auto py-1.5 scrollbar-none" aria-label="Tabs">
            <button
              ref={menuRef}
              onClick={() => {
                setMenuComisionesAbierto((prev) => !prev);
                setMenuArticulosAbierto(false);
              }}
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
              onClick={() => setVistaActiva('modelos')}
              className={`flex items-center space-x-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-all whitespace-nowrap cursor-pointer ${
                vistaActiva === 'modelos'
                  ? 'border-[#0f62fe] bg-[#393939] text-white'
                  : 'border-transparent text-[#c6c6c6] hover:bg-[#333333] hover:text-white'
              }`}
            >
              <Cpu className="w-4.5 h-4.5 text-[#be95ff]" />
              <span>Modelos</span>
            </button>

            <button
              ref={menuArticulosRef}
              onClick={() => {
                if (menuArticulosRef.current && contenedorRef.current) {
                  const btnRect = menuArticulosRef.current.getBoundingClientRect();
                  const contRect = contenedorRef.current.getBoundingClientRect();
                  setArticulosPanelLeft(btnRect.left - contRect.left);
                }
                setMenuArticulosAbierto((prev) => !prev);
                setMenuComisionesAbierto(false);
              }}
              className={`flex items-center space-x-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-all whitespace-nowrap cursor-pointer ${
                enModuloArticulos
                  ? 'border-[#0f62fe] bg-[#393939] text-white'
                  : 'border-transparent text-[#c6c6c6] hover:bg-[#333333] hover:text-white'
              }`}
            >
              <Wrench className="w-4.5 h-4.5 text-[#ff832b]" />
              <span>Artículos</span>
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform ${menuArticulosAbierto ? 'rotate-180' : ''}`}
              />
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

          {menuArticulosAbierto && (
            <div
              ref={panelArticulosRef}
              style={{ left: articulosPanelLeft }}
              className="absolute top-full mt-1 w-72 bg-[#262626] border border-[#393939] shadow-lg z-50 py-1"
            >
              {OPCIONES_ARTICULOS.map(({ vista, label, icon: Icon }) => (
                <button
                  key={vista}
                  onClick={() => seleccionarOpcionArticulos(vista)}
                  className={`w-full flex items-center space-x-2.5 px-4 py-2.5 text-sm text-left whitespace-nowrap transition-colors cursor-pointer ${
                    vistaActiva === vista
                      ? 'bg-[#393939] text-white'
                      : 'text-[#c6c6c6] hover:bg-[#333333] hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4 text-[#ff832b] shrink-0" />
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
