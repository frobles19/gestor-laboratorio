import React, { useState } from 'react';
import { AppProvider } from './context/AppContext';
import { Header, VistaActiva } from './components/Header';
import { ComisionesView } from './components/ComisionesView';
import { LogsComisionesView } from './components/LogsComisionesView';
import { RadioayudasView } from './components/RadioayudasView';
import { NominaTecnicaView } from './components/NominaTecnicaView';
import { AeropuertosView } from './components/AeropuertosView';
import { Radio, Database, ShieldCheck, Server } from 'lucide-react';

function MainApp() {
  const [vistaActiva, setVistaActiva] = useState<VistaActiva>('comisiones-maestro');

  return (
    <div className="min-h-screen flex flex-col bg-[#f4f4f4] text-[#161616]">
      {/* Barra de cabecera estilo IBM Maximo Shell */}
      <Header vistaActiva={vistaActiva} setVistaActiva={setVistaActiva} />

      {/* Contenedor Principal */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {vistaActiva === 'comisiones-maestro' && <ComisionesView />}
        {vistaActiva === 'comisiones-logs' && <LogsComisionesView />}
        {vistaActiva === 'radioayudas' && <RadioayudasView />}
        {vistaActiva === 'nomina' && <NominaTecnicaView />}
        {vistaActiva === 'aeropuertos' && <AeropuertosView />}
      </main>

      {/* Pie de Página estilo IBM Maximo Enterprise */}
      <footer className="bg-[#161616] text-[#8d8d8d] border-t border-[#393939] py-3 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <span className="font-mono font-bold text-white tracking-widest text-[11px]">
              IBM MAXIMO ASSET MANAGEMENT
            </span>
            <span>•</span>
            <span className="text-[11px]">Gestión Técnica de Radioayudas Aeronáuticas (VOR / DME / ILS)</span>
          </div>

          <div className="flex items-center space-x-4 text-[11px] font-mono">
            <span className="flex items-center space-x-1 text-[#82cfff]">
              <Database className="w-3.5 h-3.5" />
              <span>LocalStorage Persistente</span>
            </span>
            <span className="flex items-center space-x-1 text-[#42be65]">
              <Server className="w-3.5 h-3.5" />
              <span>Motor de Semáforos Activo</span>
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <MainApp />
    </AppProvider>
  );
}
