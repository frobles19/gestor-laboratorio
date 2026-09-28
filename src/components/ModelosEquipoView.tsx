import React, { useMemo, useState } from 'react';
import { Search, Plus, X, Filter, Pencil, Trash2, Cpu } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ModeloEquipo, SistemaRadioayuda } from '../types';
import { getClasesSistema } from '../utils/maintenance';
import {
  ExpedienteModal,
  BotonEncabezado,
  Seccion,
  ListaFilas,
  EstadoVacio,
  Aviso,
} from './expediente/ExpedienteLayout';

const SISTEMAS: SistemaRadioayuda[] = ['VOR', 'DME', 'ILS'];

export const ModelosEquipoView: React.FC = () => {
  const { modelos, equipos, aeropuertos, crearModelo, actualizarModelo, eliminarModelo } =
    useApp();

  const [busqueda, setBusqueda] = useState('');
  const [filtrosSistema, setFiltrosSistema] = useState<SistemaRadioayuda[]>([]);

  const [modalOpen, setModalOpen] = useState(false);
  const [modeloEditando, setModeloEditando] = useState<ModeloEquipo | null>(null);
  const [modeloFicha, setModeloFicha] = useState<ModeloEquipo | null>(null);
  const [confirmandoEliminar, setConfirmandoEliminar] = useState(false);
  const [errorForm, setErrorForm] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Campos del formulario
  const [sistema, setSistema] = useState<SistemaRadioayuda>('VOR');
  const [denominacion, setDenominacion] = useState('');
  const [fabricante, setFabricante] = useState('');

  const toggleFiltroSistema = (s: SistemaRadioayuda) => {
    setFiltrosSistema((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));
  };

  const abrirAlta = () => {
    setModeloFicha(null);
    setModeloEditando(null);
    setSistema('VOR');
    setDenominacion('');
    setFabricante('');
    setErrorForm(null);
    setModalOpen(true);
  };

  const abrirEdicion = (m: ModeloEquipo) => {
    setModeloFicha(null);
    setModeloEditando(m);
    setSistema(m.sistema);
    setDenominacion(m.denominacion);
    setFabricante(m.fabricante);
    setErrorForm(null);
    setModalOpen(true);
  };

  const cerrarFormulario = () => {
    setModalOpen(false);
    setModeloEditando(null);
    setErrorForm(null);
  };

  const handleGuardar = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (modeloEditando) {
        actualizarModelo(modeloEditando.id, { sistema, denominacion, fabricante });
      } else {
        crearModelo({ sistema, denominacion, fabricante });
      }
      cerrarFormulario();
    } catch (err) {
      setErrorForm(err instanceof Error ? err.message : 'No se pudo guardar el modelo.');
    }
  };

  // Cantidad de radioayudas instaladas que usan cada modelo.
  const cantidadEquiposPorModelo = useMemo(() => {
    const mapa = new Map<string, number>();
    equipos.forEach((eq) => mapa.set(eq.modeloId, (mapa.get(eq.modeloId) || 0) + 1));
    return mapa;
  }, [equipos]);

  const modelosFiltrados = useMemo(() => {
    const q = busqueda.toLowerCase();
    return [...modelos]
      .filter((m) => {
        const coincideTexto =
          m.denominacion.toLowerCase().includes(q) || m.fabricante.toLowerCase().includes(q);
        const coincideSistema = filtrosSistema.length === 0 || filtrosSistema.includes(m.sistema);
        return coincideTexto && coincideSistema;
      })
      .sort((a, b) => a.denominacion.localeCompare(b.denominacion));
  }, [modelos, busqueda, filtrosSistema]);

  const equiposDelModeloFicha = modeloFicha
    ? equipos.filter((eq) => eq.modeloId === modeloFicha.id)
    : [];
  const cantidadModeloFicha = modeloFicha ? cantidadEquiposPorModelo.get(modeloFicha.id) || 0 : 0;

  const handleEliminar = () => {
    if (!modeloFicha) return;
    try {
      eliminarModelo(modeloFicha.id);
      setModeloFicha(null);
      setConfirmandoEliminar(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo eliminar el modelo.');
      setConfirmandoEliminar(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Encabezado */}
      <div className="bg-white p-4 border border-[#e0e0e0] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-[#161616] tracking-tight">
          MAESTRO DE MODELOS DE EQUIPOS
        </h1>

        <div className="flex items-center flex-wrap gap-2.5">
          <div className="flex items-center space-x-2.5 px-3.5 py-2 border bg-[#161616] text-white border-[#161616] shadow-xs">
            <span className="text-xs uppercase font-bold tracking-wider">Total Modelos</span>
            <span className="text-sm font-mono font-bold px-2 py-0.5 bg-white text-[#161616]">
              {modelos.length}
            </span>
          </div>

          <button
            onClick={abrirAlta}
            className="flex items-center space-x-1.5 px-4 py-2.5 bg-[#0f62fe] hover:bg-[#0353e9] text-white text-sm font-bold tracking-wide transition-colors shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>AGREGAR MODELO</span>
          </button>
        </div>
      </div>

      {/* Buscador y filtro por sistema */}
      <div className="bg-white p-3 border border-[#e0e0e0] flex flex-col sm:flex-row items-center gap-3">
        <div className="relative w-full sm:w-80 shrink-0">
          <Search className="w-4 h-4 absolute left-3 top-2 text-[#8d8d8d]" />
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por modelo o fabricante..."
            className="w-full pl-9 pr-3 py-1 bg-[#f4f4f4] border border-[#8d8d8d] text-xs focus:outline-hidden focus:ring-1 focus:ring-[#0f62fe] focus:bg-white"
          />
        </div>

        <div className="flex items-center space-x-1.5 w-full sm:w-auto sm:ml-auto overflow-x-auto">
          <span className="text-xs font-bold text-[#525252] mr-1 flex items-center space-x-1 shrink-0">
            <Filter className="w-4 h-4 text-[#0f62fe]" />
            <span>SISTEMA:</span>
          </span>

          {SISTEMAS.map((s) => {
            const estaSeleccionado = filtrosSistema.includes(s);
            return (
              <button
                key={s}
                onClick={() => toggleFiltroSistema(s)}
                className={`px-3 py-1 text-xs font-bold font-mono border transition-colors whitespace-nowrap cursor-pointer ${
                  estaSeleccionado
                    ? 'bg-[#161616] text-white border-[#161616]'
                    : 'bg-[#f4f4f4] text-[#161616] border-[#e0e0e0] hover:bg-[#e0e0e0]'
                }`}
              >
                {s}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tarjetas de Modelos */}
      <div className="bg-white border border-[#e0e0e0] shadow-xs">
        <div className="p-4">
          {modelosFiltrados.length === 0 ? (
            <div className="py-8 text-center text-[#8d8d8d] text-sm">
              No se encontraron modelos para la búsqueda.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {modelosFiltrados.map((m) => {
                const cantidad = cantidadEquiposPorModelo.get(m.id) || 0;
                const nombreCompleto = m.fabricante
                  ? `${m.fabricante} ${m.denominacion}`
                  : m.denominacion;
                return (
                  <div
                    key={m.id}
                    onClick={() => setModeloFicha(m)}
                    title="Ver ficha del modelo"
                    className="border border-[#e0e0e0] p-3 bg-[#fbfbfb] hover:bg-white hover:border-[#0f62fe] transition-colors cursor-pointer flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center space-x-3 min-w-0">
                      <span
                        className={`text-[10px] font-bold uppercase px-2.5 py-1 shrink-0 ${
                          getClasesSistema(m.sistema).badge
                        }`}
                      >
                        {m.sistema}
                      </span>
                      <h3 className="text-sm font-bold text-[#161616] truncate">
                        {nombreCompleto}
                      </h3>
                    </div>

                    <span className="text-sm font-mono font-bold text-[#161616] shrink-0">
                      {cantidad} instalada{cantidad === 1 ? '' : 's'}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Barra de estado inferior */}
        <div className="bg-[#f4f4f4] px-4 py-2 border-t border-[#e0e0e0] flex items-center justify-between text-xs text-[#525252]">
          <span>
            Mostrando <strong>{modelosFiltrados.length}</strong> de{' '}
            <strong>{modelos.length}</strong> modelos registrados
          </span>
        </div>
      </div>

      {/* Modal Nuevo / Editar Modelo */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white border border-[#393939] shadow-2xl w-full max-w-md my-8 rounded-none overflow-hidden">
            <div className="bg-[#161616] text-white px-6 py-4 flex items-center justify-between border-b border-[#393939]">
              <h2 className="text-sm font-semibold">
                {modeloEditando ? 'EDITAR MODELO' : 'ALTA DE MODELO'}
              </h2>
              <button onClick={cerrarFormulario} className="text-[#a8a8a8] hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleGuardar} className="p-6 space-y-4">
              {errorForm && (
                <div className="bg-[#fff1f1] border-l-4 border-[#da1e28] p-3 text-xs text-[#da1e28]">
                  {errorForm}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold uppercase mb-1">Sistema *</label>
                <select
                  value={sistema}
                  onChange={(e) => setSistema(e.target.value as SistemaRadioayuda)}
                  className="w-full bg-white border border-[#8d8d8d] px-3 py-1.5 text-xs font-bold"
                >
                  {SISTEMAS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase mb-1">Modelo *</label>
                <input
                  type="text"
                  value={denominacion}
                  onChange={(e) => setDenominacion(e.target.value)}
                  placeholder="Ej: SEL 4000"
                  required
                  className="w-full bg-white border border-[#8d8d8d] px-3 py-1.5 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase mb-1">Fabricante</label>
                <input
                  type="text"
                  value={fabricante}
                  onChange={(e) => setFabricante(e.target.value)}
                  placeholder="Ej: Thales ATM"
                  className="w-full bg-white border border-[#8d8d8d] px-3 py-1.5 text-xs"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-3 border-t border-[#e0e0e0]">
                <button
                  type="button"
                  onClick={cerrarFormulario}
                  className="px-4 py-2 border border-[#8d8d8d] text-xs font-medium"
                >
                  Cancelar
                </button>
                <button type="submit" className="px-5 py-2 bg-[#0f62fe] text-white text-xs font-bold">
                  Guardar Modelo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Ficha del modelo */}
      {modeloFicha && (
        <ExpedienteModal
          icono={<Cpu className="w-5 h-5" />}
          encabezado={
            <>
              <span
                className={`text-xs font-bold uppercase px-2 py-0.5 ${
                  getClasesSistema(modeloFicha.sistema).badge
                }`}
              >
                {modeloFicha.sistema}
              </span>
              <span className="text-sm font-bold">{modeloFicha.denominacion}</span>
              {modeloFicha.fabricante && (
                <span className="text-[10px] font-mono uppercase text-[#c6c6c6]">
                  {modeloFicha.fabricante}
                </span>
              )}
            </>
          }
          accionesEncabezado={
            <>
              <BotonEncabezado onClick={() => abrirEdicion(modeloFicha)} title="Editar Modelo">
                <Pencil className="w-4 h-4" />
              </BotonEncabezado>
              <button
                onClick={() => cantidadModeloFicha === 0 && setConfirmandoEliminar(true)}
                disabled={cantidadModeloFicha > 0}
                title={
                  cantidadModeloFicha === 0
                    ? 'Eliminar Modelo'
                    : `No disponible: tiene ${cantidadModeloFicha} radioayuda(s) instalada(s)`
                }
                className={
                  cantidadModeloFicha === 0
                    ? 'p-2 bg-white hover:bg-[#da1e28] text-[#da1e28] hover:text-white border border-[#ffb3b8] transition-colors cursor-pointer'
                    : 'p-2 bg-[#f4f4f4] text-[#c6c6c6] border border-[#e0e0e0] cursor-not-allowed'
                }
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          }
          onClose={() => setModeloFicha(null)}
        >
          {error && <Aviso tipo="error">{error}</Aviso>}

          {confirmandoEliminar && (
            <Aviso tipo="error">
              <div className="flex items-center justify-between gap-3">
                <span>
                  Se eliminará <strong>{modeloFicha.denominacion}</strong> del catálogo de
                  modelos.
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

          <Seccion
            icono={<Cpu className="w-4 h-4" />}
            titulo={`Equipos Instalados (${equiposDelModeloFicha.length})`}
          >
            {equiposDelModeloFicha.length === 0 ? (
              <EstadoVacio>Ningún equipo instalado usa este modelo todavía.</EstadoVacio>
            ) : (
              <ListaFilas>
                {equiposDelModeloFicha.map((eq) => {
                  const aero = aeropuertos.find((a) => a.codigoIATA === eq.aeropuertoCodigo);
                  return (
                    <div
                      key={eq.id}
                      className="p-3 bg-white flex flex-wrap items-center justify-between gap-2 text-xs"
                    >
                      <span className="font-semibold text-[#161616]">{eq.identificador}</span>
                      <span className="text-[#525252]">
                        {aero?.nombreOficial || eq.aeropuertoCodigo}
                      </span>
                    </div>
                  );
                })}
              </ListaFilas>
            )}
          </Seccion>
        </ExpedienteModal>
      )}
    </div>
  );
};
