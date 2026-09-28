import React, { useMemo, useState } from 'react';
import { Plus, X, Eye, Pencil, Trash2, Ruler } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ArticuloStock, EstadoArticulo } from '../types';
import { formatearFecha, getClasesEstadoArticulo } from '../utils/maintenance';
import {
  ExpedienteModal,
  BotonEncabezado,
  Seccion,
  Aviso,
} from './expediente/ExpedienteLayout';

const INPUT_FILTRO =
  'w-full bg-[#161616] text-white border border-[#525252] px-2 py-1 text-xs font-mono placeholder-[#8d8d8d] focus:outline-hidden focus:border-[#0f62fe]';

const ESTADOS: EstadoArticulo[] = ['EN_SERVICIO', 'FUERA_DE_SERVICIO', 'A_REVISAR', 'BAJA'];

export const InstrumentalView: React.FC = () => {
  const {
    articulos,
    aeropuertos,
    ultimosMovimientosPorArticulo,
    crearArticulo,
    actualizarArticulo,
    eliminarArticulo,
  } = useApp();

  const instrumentos = useMemo(
    () => articulos.filter((a) => a.categoria === 'Instrumental'),
    [articulos]
  );

  // Filtros por columna
  const [filtroInstrumento, setFiltroInstrumento] = useState('');
  const [filtroMarca, setFiltroMarca] = useState('');
  const [filtroNSerie, setFiltroNSerie] = useState('');
  const [filtroUbicacion, setFiltroUbicacion] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [articuloEditando, setArticuloEditando] = useState<ArticuloStock | null>(null);
  const [articuloFicha, setArticuloFicha] = useState<ArticuloStock | null>(null);
  const [confirmandoEliminar, setConfirmandoEliminar] = useState(false);
  const [errorForm, setErrorForm] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Campos del formulario
  const [modulo, setModulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [nParte, setNParte] = useState('');
  const [marca, setMarca] = useState('');
  const [nSerie, setNSerie] = useState('');
  const [estado, setEstado] = useState<EstadoArticulo>('EN_SERVICIO');
  // La ubicación es un solo selector: 'LABORATORIO' o el código IATA del aeropuerto.
  const [ubicacionSel, setUbicacionSel] = useState('LABORATORIO');

  const abrirAlta = () => {
    setArticuloEditando(null);
    setModulo('');
    setDescripcion('');
    setNParte('');
    setMarca('');
    setNSerie('');
    setEstado('EN_SERVICIO');
    setUbicacionSel('LABORATORIO');
    setErrorForm(null);
    setModalOpen(true);
  };

  const abrirEdicion = (a: ArticuloStock) => {
    setArticuloFicha(null);
    setArticuloEditando(a);
    setModulo(a.modulo);
    setDescripcion(a.descripcion || '');
    setNParte(a.nParte || '');
    setMarca(a.marca || '');
    setNSerie(a.nSerie || '');
    setEstado(a.estado);
    setUbicacionSel(a.ubicacionTipo === 'AEROPUERTO' ? a.ubicacionAeropuertoCodigo || '' : 'LABORATORIO');
    setErrorForm(null);
    setModalOpen(true);
  };

  const cerrarFormulario = () => {
    setModalOpen(false);
    setArticuloEditando(null);
    setErrorForm(null);
  };

  const handleGuardar = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const datos = {
        modulo,
        descripcion,
        nParte,
        marca,
        nSerie,
        modeloEquipoId: null, // no aplica a Instrumental
        estado,
        cantidad: 1,
        ubicacionTipo: (ubicacionSel === 'LABORATORIO' ? 'LABORATORIO' : 'AEROPUERTO') as
          | 'LABORATORIO'
          | 'AEROPUERTO',
        ubicacionAeropuertoCodigo: ubicacionSel === 'LABORATORIO' ? null : ubicacionSel,
      };
      if (articuloEditando) {
        actualizarArticulo(articuloEditando.id, datos);
      } else {
        crearArticulo({ categoria: 'Instrumental', ...datos });
      }
      cerrarFormulario();
    } catch (err) {
      setErrorForm(err instanceof Error ? err.message : 'No se pudo guardar el instrumento.');
    }
  };

  const handleEliminar = () => {
    if (!articuloFicha) return;
    try {
      eliminarArticulo(articuloFicha.id);
      setArticuloFicha(null);
      setConfirmandoEliminar(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo eliminar el instrumento.');
      setConfirmandoEliminar(false);
    }
  };

  // En la tabla, la ubicación se ve corta: solo el código (LAB o el IATA).
  const codigoUbicacion = (a: ArticuloStock): string =>
    a.ubicacionTipo === 'LABORATORIO' ? 'LAB' : a.ubicacionAeropuertoCodigo || '—';

  const nombreUbicacion = (a: ArticuloStock): string => {
    if (a.ubicacionTipo === 'LABORATORIO') return 'Laboratorio';
    const aero = aeropuertos.find((x) => x.codigoIATA === a.ubicacionAeropuertoCodigo);
    return aero ? `${aero.codigoIATA} · ${aero.nombreOficial}` : a.ubicacionAeropuertoCodigo || '—';
  };

  const ultimoMovimiento = (a: ArticuloStock): string | undefined => ultimosMovimientosPorArticulo[a.id];

  const instrumentosFiltrados = useMemo(() => {
    const qInstrumento = filtroInstrumento.trim().toLowerCase();
    const qMarca = filtroMarca.trim().toLowerCase();
    const qSerie = filtroNSerie.trim().toLowerCase();
    return instrumentos
      .filter((a) => {
        if (qInstrumento && !a.modulo.toLowerCase().includes(qInstrumento)) return false;
        if (qMarca && !(a.marca || '').toLowerCase().includes(qMarca)) return false;
        if (qSerie && !(a.nSerie || '').toLowerCase().includes(qSerie)) return false;
        if (filtroUbicacion) {
          if (filtroUbicacion === 'LABORATORIO') {
            if (a.ubicacionTipo !== 'LABORATORIO') return false;
          } else if (a.ubicacionAeropuertoCodigo !== filtroUbicacion) {
            return false;
          }
        }
        if (filtroEstado && a.estado !== filtroEstado) return false;
        return true;
      })
      .sort((a, b) => a.modulo.localeCompare(b.modulo));
  }, [instrumentos, filtroInstrumento, filtroMarca, filtroNSerie, filtroUbicacion, filtroEstado]);

  const hayFiltrosActivos =
    filtroInstrumento.trim() !== '' ||
    filtroMarca.trim() !== '' ||
    filtroNSerie.trim() !== '' ||
    filtroUbicacion !== '' ||
    filtroEstado !== '';

  const limpiarFiltros = () => {
    setFiltroInstrumento('');
    setFiltroMarca('');
    setFiltroNSerie('');
    setFiltroUbicacion('');
    setFiltroEstado('');
  };

  return (
    <div className="space-y-4">
      {/* Encabezado */}
      <div className="bg-white p-4 border border-[#e0e0e0] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-[#161616] tracking-tight">
          MAESTRO DE INSTRUMENTAL
        </h1>

        <div className="flex items-center flex-wrap gap-2.5">
          <div className="flex items-center space-x-2.5 px-3.5 py-2 border bg-[#161616] text-white border-[#161616] shadow-xs">
            <span className="text-xs uppercase font-bold tracking-wider">Total Instrumental</span>
            <span className="text-sm font-mono font-bold px-2 py-0.5 bg-white text-[#161616]">
              {instrumentos.length}
            </span>
          </div>

          <button
            onClick={abrirAlta}
            className="flex items-center space-x-1.5 px-4 py-2.5 bg-[#0f62fe] hover:bg-[#0353e9] text-white text-sm font-bold tracking-wide transition-colors shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>AGREGAR INSTRUMENTO</span>
          </button>
        </div>
      </div>

      {/* Tabla con filtros por columna */}
      <div className="bg-white border border-[#e0e0e0] shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#262626] text-[#f4f4f4] text-xs uppercase tracking-wider font-semibold">
                <th className="py-3 px-3.5 border-r border-[#393939]">Instrumento</th>
                <th className="py-3 px-3.5 border-r border-[#393939]">Marca/Modelo</th>
                <th className="py-3 px-3.5 border-r border-[#393939]">N° de Serie</th>
                <th className="py-3 px-3.5 border-r border-[#393939] w-20 text-center">Ubic.</th>
                <th className="py-3 px-3.5 border-r border-[#393939] w-20 text-center">Estado</th>
                <th className="py-3 px-3.5 text-center w-28"></th>
              </tr>
              <tr className="bg-[#333333] border-b-2 border-[#0f62fe]">
                <th className="p-2 border-r border-[#474747]">
                  <input
                    type="text"
                    value={filtroInstrumento}
                    onChange={(e) => setFiltroInstrumento(e.target.value)}
                    placeholder="Instrumento..."
                    className={INPUT_FILTRO}
                  />
                </th>
                <th className="p-2 border-r border-[#474747]">
                  <input
                    type="text"
                    value={filtroMarca}
                    onChange={(e) => setFiltroMarca(e.target.value)}
                    placeholder="Marca/Modelo..."
                    className={INPUT_FILTRO}
                  />
                </th>
                <th className="p-2 border-r border-[#474747]">
                  <input
                    type="text"
                    value={filtroNSerie}
                    onChange={(e) => setFiltroNSerie(e.target.value)}
                    placeholder="N° de serie..."
                    className={INPUT_FILTRO}
                  />
                </th>
                <th className="p-2 border-r border-[#474747]">
                  <select
                    value={filtroUbicacion}
                    onChange={(e) => setFiltroUbicacion(e.target.value)}
                    className={INPUT_FILTRO}
                  >
                    <option value="">Todas</option>
                    <option value="LABORATORIO">Laboratorio</option>
                    {aeropuertos.map((a) => (
                      <option key={a.codigoIATA} value={a.codigoIATA}>
                        {a.codigoIATA} · {a.nombreOficial}
                      </option>
                    ))}
                  </select>
                </th>
                <th className="p-2 border-r border-[#474747]">
                  <select
                    value={filtroEstado}
                    onChange={(e) => setFiltroEstado(e.target.value)}
                    className={INPUT_FILTRO}
                  >
                    <option value="">Todos</option>
                    {ESTADOS.map((e) => (
                      <option key={e} value={e}>
                        {getClasesEstadoArticulo(e).etiqueta}
                      </option>
                    ))}
                  </select>
                </th>
                <th className="p-2 text-center">
                  {hayFiltrosActivos && (
                    <button
                      onClick={limpiarFiltros}
                      title="Limpiar filtros"
                      className="p-1.5 bg-[#da1e28] hover:bg-[#a2191f] text-white transition-colors cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e0e0e0]">
              {instrumentosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-sm text-[#6f6f6f]">
                    No hay instrumental que coincida con los filtros.
                  </td>
                </tr>
              ) : (
                instrumentosFiltrados.map((a) => (
                  <tr key={a.id} className="hover:bg-[#f4f8ff] transition-colors">
                    <td className="py-3 px-3.5 border-r border-[#e0e0e0] text-sm font-semibold text-[#161616]">
                      {a.modulo}
                    </td>
                    <td className="py-3 px-3.5 border-r border-[#e0e0e0] text-sm text-[#525252]">
                      {a.marca || '—'}
                    </td>
                    <td className="py-3 px-3.5 border-r border-[#e0e0e0] text-sm font-mono">
                      {a.nSerie || '—'}
                    </td>
                    <td className="py-3 px-3.5 border-r border-[#e0e0e0] text-sm text-center font-mono font-bold text-[#161616]">
                      {codigoUbicacion(a)}
                    </td>
                    <td className="py-3 px-3.5 border-r border-[#e0e0e0] text-center">
                      <span
                        className={`inline-flex items-center justify-center w-14 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                          getClasesEstadoArticulo(a.estado).badge
                        }`}
                      >
                        {getClasesEstadoArticulo(a.estado).corta}
                      </span>
                    </td>
                    <td className="py-3 px-3.5 text-center">
                      <div className="flex items-center justify-center space-x-1.5">
                        <button
                          onClick={() => setArticuloFicha(a)}
                          title="Ver instrumento"
                          className="p-2 bg-white hover:bg-[#e0e0e0] text-[#0f62fe] border border-[#8d8d8d] transition-colors cursor-pointer"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => abrirEdicion(a)}
                          title="Editar instrumento"
                          className="p-2 bg-white hover:bg-[#e0e0e0] text-[#161616] border border-[#8d8d8d] transition-colors cursor-pointer"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="bg-[#f4f4f4] px-4 py-2 border-t border-[#e0e0e0] flex items-center justify-between text-xs text-[#525252]">
          <span>
            Mostrando <strong>{instrumentosFiltrados.length}</strong> de{' '}
            <strong>{instrumentos.length}</strong> instrumentos registrados
          </span>
        </div>
      </div>

      {/* Modal Nuevo / Editar */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white border border-[#393939] shadow-2xl w-full max-w-lg my-8 rounded-none overflow-hidden">
            <div className="bg-[#161616] text-white px-6 py-4 flex items-center justify-between border-b border-[#393939]">
              <h2 className="text-sm font-semibold">
                {articuloEditando ? 'EDITAR INSTRUMENTO' : 'ALTA DE INSTRUMENTO'}
              </h2>
              <button onClick={cerrarFormulario} className="text-[#a8a8a8] hover:text-white p-1 cursor-pointer">
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
                <label className="block text-xs font-semibold uppercase mb-1">Instrumento *</label>
                <input
                  type="text"
                  value={modulo}
                  onChange={(e) => setModulo(e.target.value)}
                  placeholder="Ej: Multímetro Fluke 87V"
                  required
                  className="w-full bg-white border border-[#8d8d8d] px-3 py-1.5 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase mb-1">Descripción</label>
                <input
                  type="text"
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  placeholder="Información adicional, opcional"
                  className="w-full bg-white border border-[#8d8d8d] px-3 py-1.5 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase mb-1">Marca/Modelo</label>
                  <input
                    type="text"
                    value={marca}
                    onChange={(e) => setMarca(e.target.value)}
                    placeholder="Ej: Fluke 87V"
                    className="w-full bg-white border border-[#8d8d8d] px-3 py-1.5 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase mb-1">N° de Parte</label>
                  <input
                    type="text"
                    value={nParte}
                    onChange={(e) => setNParte(e.target.value)}
                    className="w-full bg-white border border-[#8d8d8d] px-3 py-1.5 text-xs font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase mb-1">N° de Serie</label>
                <input
                  type="text"
                  value={nSerie}
                  onChange={(e) => setNSerie(e.target.value)}
                  placeholder="Opcional"
                  className="w-full bg-white border border-[#8d8d8d] px-3 py-1.5 text-xs font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase mb-1">Estado *</label>
                  <select
                    value={estado}
                    onChange={(e) => setEstado(e.target.value as EstadoArticulo)}
                    className="w-full bg-white border border-[#8d8d8d] px-3 py-1.5 text-xs font-bold"
                  >
                    {ESTADOS.map((e) => (
                      <option key={e} value={e}>
                        {getClasesEstadoArticulo(e).etiqueta}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase mb-1">Ubicación *</label>
                  <select
                    value={ubicacionSel}
                    onChange={(e) => setUbicacionSel(e.target.value)}
                    className="w-full bg-white border border-[#8d8d8d] px-3 py-1.5 text-xs font-bold"
                  >
                    <option value="LABORATORIO">Laboratorio</option>
                    {aeropuertos.map((a) => (
                      <option key={a.codigoIATA} value={a.codigoIATA}>
                        {a.codigoIATA} · {a.nombreOficial}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-3 border-t border-[#e0e0e0]">
                <button
                  type="button"
                  onClick={cerrarFormulario}
                  className="px-4 py-2 border border-[#8d8d8d] text-xs font-medium cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#0f62fe] hover:bg-[#0353e9] text-white text-xs font-bold cursor-pointer"
                >
                  Guardar Instrumento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Ficha del instrumento */}
      {articuloFicha && (
        <ExpedienteModal
          icono={<Ruler className="w-5 h-5" />}
          encabezado={
            <>
              <span className="text-sm font-bold">{articuloFicha.modulo}</span>
              <span
                className={`text-xs px-2 py-0.5 font-bold uppercase ${
                  getClasesEstadoArticulo(articuloFicha.estado).badge
                }`}
              >
                {getClasesEstadoArticulo(articuloFicha.estado).etiqueta}
              </span>
            </>
          }
          accionesEncabezado={
            <>
              <BotonEncabezado onClick={() => abrirEdicion(articuloFicha)} title="Editar Instrumento">
                <Pencil className="w-4 h-4" />
              </BotonEncabezado>
              <button
                onClick={() => setConfirmandoEliminar(true)}
                title="Eliminar Instrumento"
                className="p-2 bg-white hover:bg-[#da1e28] text-[#da1e28] hover:text-white border border-[#ffb3b8] transition-colors cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          }
          onClose={() => setArticuloFicha(null)}
        >
          {error && <Aviso tipo="error">{error}</Aviso>}

          {confirmandoEliminar && (
            <Aviso tipo="error">
              <div className="flex items-center justify-between gap-3">
                <span>
                  Se eliminará <strong>{articuloFicha.modulo}</strong> del stock.
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

          <Seccion icono={<Ruler className="w-4 h-4" />} titulo="Datos del Instrumento">
            <div className="bg-[#f4f4f4] p-4 border border-[#e0e0e0]">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-[#161616]">
                {articuloFicha.descripcion && (
                  <div className="sm:col-span-3">
                    <span className="text-[#525252] block">Descripción</span>
                    <span className="font-semibold">{articuloFicha.descripcion}</span>
                  </div>
                )}
                <div>
                  <span className="text-[#525252] block">Marca/Modelo</span>
                  <span className="font-semibold">{articuloFicha.marca || '—'}</span>
                </div>
                <div>
                  <span className="text-[#525252] block">N° de Parte</span>
                  <span className="font-semibold font-mono">{articuloFicha.nParte || '—'}</span>
                </div>
                <div>
                  <span className="text-[#525252] block">N° de Serie</span>
                  <span className="font-semibold font-mono">{articuloFicha.nSerie || '—'}</span>
                </div>
                <div>
                  <span className="text-[#525252] block">Ubicación</span>
                  <span className="font-semibold">{nombreUbicacion(articuloFicha)}</span>
                </div>
                <div>
                  <span className="text-[#525252] block">Último Movimiento</span>
                  <span className="font-semibold">
                    {ultimoMovimiento(articuloFicha)
                      ? formatearFecha(ultimoMovimiento(articuloFicha))
                      : 'Sin movimientos registrados'}
                  </span>
                </div>
              </div>
            </div>
          </Seccion>
        </ExpedienteModal>
      )}
    </div>
  );
};
