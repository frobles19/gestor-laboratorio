import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header, VistaActiva } from './components/Header';
import { ComisionesView } from './components/ComisionesView';
import { LogsComisionesView } from './components/LogsComisionesView';
import { RadioayudasView } from './components/RadioayudasView';
import { TecnicosView } from './components/TecnicosView';
import { AeropuertosView } from './components/AeropuertosView';
import { ModelosEquipoView } from './components/ModelosEquipoView';
import { RepuestosView } from './components/RepuestosView';
import { InstrumentalView } from './components/InstrumentalView';
import { Radio, Database, ShieldCheck, Server, AlertTriangle, X } from 'lucide-react';

function MainApp() {
  const { cargando, errorCarga, errorSync, limpiarErrorSync } = useApp();
  const [vistaActiva, setVistaActiva] = useState<VistaActiva>('comisiones-maestro');
  // Filtro de destino con el que se abre el Maestro cuando se llega desde otra pantalla.
  const [destinoInicialComisiones, setDestinoInicialComisiones] = useState('');
  const [tecnicoInicialComisiones, setTecnicoInicialComisiones] = useState('');

  const cambiarVista = (vista: VistaActiva) => {
    setDestinoInicialComisiones('');
    setTecnicoInicialComisiones('');
    setVistaActiva(vista);
  };

  const verComisionesDeAeropuerto = (nombreAeropuerto: string) => {
    setDestinoInicialComisiones(nombreAeropuerto);
    setTecnicoInicialComisiones('');
    setVistaActiva('comisiones-maestro');
  };

  const verComisionesDeTecnico = (nombreTecnico: string) => {
    setDestinoInicialComisiones('');
    setTecnicoInicialComisiones(nombreTecnico);
    setVistaActiva('comisiones-maestro');
  };

  if (errorCarga) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f4f4f4] p-4">
        <div className="max-w-md bg-white border border-[#da1e28] p-6 text-center space-y-3">
          <AlertTriangle className="w-10 h-10 text-[#da1e28] mx-auto" />
          <h1 className="text-lg font-bold text-[#161616]">No se pudo conectar con la base de datos</h1>
          <p className="text-sm text-[#525252]">{errorCarga}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-[#0f62fe] hover:bg-[#0353e9] text-white text-sm font-bold cursor-pointer"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  if (cargando) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f4f4f4]">
        <div className="flex items-center space-x-3 text-[#525252]">
          <Database className="w-5 h-5 animate-pulse text-[#0f62fe]" />
          <span className="text-sm font-medium">Cargando datos del servidor…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#f4f4f4] text-[#161616]">
      {/* Barra de cabecera estilo IBM Maximo Shell */}
      <Header vistaActiva={vistaActiva} setVistaActiva={cambiarVista} />

      {/* Aviso de fallo al guardar en el servidor (el cambio quedó solo en esta pantalla) */}
      {errorSync && (
        <div className="bg-[#fff1f1] border-b border-[#da1e28] px-4 py-2 flex items-center justify-between gap-3">
          <div className="flex items-center space-x-2 text-xs text-[#da1e28] max-w-5xl mx-auto w-full">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{errorSync}</span>
          </div>
          <button
            onClick={limpiarErrorSync}
            className="text-[#da1e28] hover:text-[#a2191f] shrink-0 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Contenedor Principal */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {vistaActiva === 'comisiones-maestro' && (
          <ComisionesView
            destinoInicial={destinoInicialComisiones}
            tecnicoInicial={tecnicoInicialComisiones}
          />
        )}
        {vistaActiva === 'comisiones-logs' && <LogsComisionesView />}
        {vistaActiva === 'radioayudas' && <RadioayudasView />}
        {vistaActiva === 'nomina' && <TecnicosView onVerComisiones={verComisionesDeTecnico} />}
        {vistaActiva === 'aeropuertos' && (
          <AeropuertosView onVerComisiones={verComisionesDeAeropuerto} />
        )}
        {vistaActiva === 'modelos' && <ModelosEquipoView />}
        {vistaActiva === 'repuestos' && <RepuestosView />}
        {vistaActiva === 'instrumental' && <InstrumentalView />}
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
              <span>Base de Datos Conectada</span>
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
