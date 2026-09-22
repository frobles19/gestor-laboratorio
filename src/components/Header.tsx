import React from 'react';
import { Radio, Plane, ShieldCheck, RefreshCw, Layers } from 'lucide-react';
import { useApp } from '../context/AppContext';

interface HeaderProps {
  vistaActiva: 'comisiones' | 'radioayudas' | 'nomina' | 'aeropuertos';
  setVistaActiva: (vista: 'comisiones' | 'radioayudas' | 'nomina' | 'aeropuertos') => void;
}

export const Header: React.FC<HeaderProps> = ({ vistaActiva, setVistaActiva }) => {
  const { comisiones, equipos, restaurarDatosIniciales } = useApp();

  const comisionesEnCurso = comisiones.filter((c) => c.estado === 'En Curso').length;
  const comisionesPlanificadas = comisiones.filter((c) => c.estado === 'Planificada').length;
  const equiposFueraServicio = equipos.filter((e) => e.estadoOperativo === 'FUERA_DE_SERVICIO').length;

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
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-mono font-bold tracking-widest bg-[#393939] text-[#82cfff] px-1.5 py-0.5 rounded">
                  IBM MAXIMO
                </span>
                <span className="text-sm font-semibold tracking-wide text-white uppercase">
                  Gestión Técnica de Radioayudas Aeronáuticas
                </span>
              </div>
              <p className="text-[11px] text-[#c6c6c6] hidden sm:block">
                Dirección Nacional de Infraestructura y Comunicaciones Aeronáuticas
              </p>
            </div>
          </div>

          {/* Acciones y Perfil de Usuario */}
          <div className="flex items-center space-x-4">
            <div className="hidden md:flex items-center space-x-2 text-xs text-[#a8a8a8] border-r border-[#393939] pr-4">
              <span className="inline-block w-2 h-2 rounded-full bg-[#198038]"></span>
              <span>Base Central EZEIZA</span>
              <span className="text-[#6f6f6f]">•</span>
              <span className="font-mono text-[#c6c6c6]">v2.6.4</span>
            </div>

            <button
              onClick={restaurarDatosIniciales}
              title="Restablecer datos de prueba a valores iniciales"
              className="flex items-center space-x-1.5 px-2.5 py-1.5 bg-[#262626] hover:bg-[#393939] text-[#f4f4f4] text-xs rounded border border-[#525252] transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5 text-[#82cfff]" />
              <span className="hidden sm:inline">Restablecer Datos</span>
            </button>

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
      </div>

      {/* Barra de Módulos / Aplicaciones estilo IBM Maximo */}
      <div className="bg-[#262626] border-t border-[#393939]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-1 overflow-x-auto py-1.5 scrollbar-none" aria-label="Tabs">
            <button
              onClick={() => setVistaActiva('comisiones')}
              className={`flex items-center space-x-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-all whitespace-nowrap cursor-pointer ${
                vistaActiva === 'comisiones'
                  ? 'border-[#0f62fe] bg-[#393939] text-white'
                  : 'border-transparent text-[#c6c6c6] hover:bg-[#333333] hover:text-white'
              }`}
            >
              <Plane className="w-4.5 h-4.5 text-[#82cfff]" />
              <span>Comisiones de Servicio</span>
              {comisionesEnCurso > 0 && (
                <span className="ml-1 bg-[#0f62fe] text-white px-2 py-0.5 rounded-full text-xs font-bold">
                  {comisionesEnCurso} en curso
                </span>
              )}
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
              <span>Nómina Técnica y Mando</span>
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
              <span>Aeropuertos y Regiones</span>
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
};
