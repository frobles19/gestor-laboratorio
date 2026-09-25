import React, { useMemo, useState } from 'react';
import { Plus, Search, Eye, Pencil, UserMinus, X, Filter } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { PuestoTecnico, Tecnico } from '../types';
import { JERARQUIA_VALOR, getClasesEstadoComision } from '../utils/maintenance';
import { TecnicoExpedienteModal } from './TecnicoExpedienteModal';

type EstadoTecnico = 'Laboratorio' | 'Comisión' | 'Licencia';
type Alcance = 'LABORATORIO' | 'TODOS';

const PUESTOS: PuestoTecnico[] = [
  'Jefe Departamento',
  'Jefe Laboratorio',
  'Coordinador',
  'Coordinador Adjunto',
  'Técnico',
];

// Mismos colores que el resto de la app: verde = disponible, azul = en curso, amarillo = pendiente.
const CLASES_ESTADO_TECNICO: Record<EstadoTecnico, string> = {
  Laboratorio: getClasesEstadoComision('Finalizada').badge,
  Comisión: getClasesEstadoComision('En Curso').badge,
  Licencia: getClasesEstadoComision('Planificada').badge,
};

interface TecnicosViewProps {
  onVerComisiones: (nombreTecnico: string) => void;
}

export const TecnicosView: React.FC<TecnicosViewProps> = ({ onVerComisiones }) => {
  const { nomina, comisiones, guardarTecnico, darDeBajaTecnico } = useApp();

  const [busqueda, setBusqueda] = useState('');
  const [alcance, setAlcance] = useState<Alcance>('LABORATORIO');

  const [modalOpen, setModalOpen] = useState(false);
  const [tecnicoEdit, setTecnicoEdit] = useState<Tecnico | null>(null);
  const [tecnicoVer, setTecnicoVer] = useState<Tecnico | null>(null);
  const [tecnicoBaja, setTecnicoBaja] = useState<Tecnico | null>(null);
  const [errorBaja, setErrorBaja] = useState('');

  // Campos del formulario
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [dni, setDni] = useState('');
  const [email, setEmail] = useState('');
  const [puesto, setPuesto] = useState<PuestoTecnico>('Técnico');
  const [laboratorio, setLaboratorio] = useState(true);
  const [enLicencia, setEnLicencia] = useState(false);

  const abrirModalNuevo = () => {
    setTecnicoEdit(null);
    setNombre('');
    setApellido('');
    setDni('');
    setEmail('');
    setPuesto('Técnico');
    setLaboratorio(true);
    setEnLicencia(false);
    setModalOpen(true);
  };

  const abrirModalEditar = (t: Tecnico) => {
    setTecnicoEdit(t);
    setNombre(t.nombre);
    setApellido(t.apellido);
    setDni(t.dni);
    setEmail(t.email);
    setPuesto(t.puesto);
    setLaboratorio(t.laboratorio);
    setEnLicencia(!!t.enLicencia);
    setModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim() || !apellido.trim() || !dni.trim()) return;

    guardarTecnico({
      ...(tecnicoEdit ?? {}),
      id: tecnicoEdit ? tecnicoEdit.id : `TEC-${Date.now()}`,
      nombre: nombre.trim(),
      apellido: apellido.trim(),
      dni: dni.trim(),
      email: email.trim() || `${nombre.trim().toLowerCase()}.${apellido.trim().toLowerCase()}@radioayudas.gov.ar`,
      puesto,
      laboratorio,
      enLicencia: laboratorio ? enLicencia : false,
    });
    setModalOpen(false);
  };

  const confirmarBaja = () => {
    if (!tecnicoBaja) return;
    try {
      darDeBajaTecnico(tecnicoBaja.id);
      setTecnicoBaja(null);
      setErrorBaja('');
    } catch (err) {
      setErrorBaja(err instanceof Error ? err.message : 'No se pudo dar de baja al técnico.');
    }
  };

  // Estado operativo (solo personal del Laboratorio)
  const idsEnComision = useMemo(
    () =>
      new Set(comisiones.filter((c) => c.estado === 'En Curso').flatMap((c) => c.tecnicosIds)),
    [comisiones]
  );
  const estadoDe = (t: Tecnico): EstadoTecnico | null => {
    if (!t.laboratorio) return null;
    if (t.enLicencia) return 'Licencia';
    if (idsEnComision.has(t.id)) return 'Comisión';
    return 'Laboratorio';
  };

  const vigentes = useMemo(() => nomina.filter((t) => !t.bajaAt), [nomina]);
  const enAlcance = useMemo(
    () => (alcance === 'LABORATORIO' ? vigentes.filter((t) => t.laboratorio) : vigentes),
    [vigentes, alcance]
  );

  // Orden por jerarquía institucional y luego por apellido
  const tecnicosFiltrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return enAlcance
      .filter(
        (t) =>
          !q ||
          t.nombre.toLowerCase().includes(q) ||
          t.apellido.toLowerCase().includes(q) ||
          t.dni.replace(/\./g, '').includes(q.replace(/\./g, '')) ||
          t.puesto.toLowerCase().includes(q) ||
          t.email.toLowerCase().includes(q)
      )
      .sort((a, b) => {
        const rA = JERARQUIA_VALOR[a.puesto] ?? 99;
        const rB = JERARQUIA_VALOR[b.puesto] ?? 99;
        if (rA !== rB) return rA - rB;
        return a.apellido.localeCompare(b.apellido);
      });
  }, [enAlcance, busqueda]);

  const hayFiltrosActivos = busqueda.trim() !== '' || alcance !== 'LABORATORIO';
  const limpiarFiltros = () => {
    setBusqueda('');
    setAlcance('LABORATORIO');
  };

  return (
    <div className="space-y-4">
      {/* Título, total y alta */}
      <div className="bg-white p-4 border border-[#e0e0e0] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-[#161616] tracking-tight">
          MAESTRO DE TÉCNICOS
        </h1>

        <div className="flex items-center flex-wrap gap-2.5">
          <div className="flex items-center space-x-2.5 px-3.5 py-2 border bg-white text-[#161616] border-[#e0e0e0]">
            <span className="text-xs uppercase font-bold tracking-wider">Total Técnicos</span>
            <span className="text-sm font-mono font-bold px-2 py-0.5 bg-[#f4f4f4] text-[#161616] border border-[#e0e0e0]">
              {enAlcance.length}
            </span>
          </div>

          <button
            onClick={abrirModalNuevo}
            className="flex items-center space-x-1.5 px-4 py-2.5 bg-[#0f62fe] hover:bg-[#0353e9] text-white text-sm font-bold tracking-wide transition-colors shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>AGREGAR TÉCNICO</span>
          </button>
        </div>
      </div>

      {/* Buscador y alcance */}
      <div className="bg-white p-3 border border-[#e0e0e0] flex flex-col sm:flex-row items-center gap-3">
        <div className="relative w-full sm:w-80 shrink-0">
          <Search className="w-4 h-4 absolute left-3 top-2 text-[#8d8d8d]" />
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por nombre, DNI, puesto o correo..."
            className="w-full pl-9 pr-3 py-1 bg-[#f4f4f4] border border-[#8d8d8d] text-xs focus:outline-hidden focus:ring-1 focus:ring-[#0f62fe] focus:bg-white"
          />
        </div>

        <div className="flex items-center space-x-1.5 w-full sm:w-auto sm:ml-auto overflow-x-auto">
          <span className="text-xs font-bold text-[#525252] mr-1 flex items-center space-x-1 shrink-0">
            <Filter className="w-4 h-4 text-[#0f62fe]" />
            <span>MOSTRAR:</span>
          </span>
          {(
            [
              { valor: 'LABORATORIO', etiqueta: 'Laboratorio' },
              { valor: 'TODOS', etiqueta: 'Todos' },
            ] as const
          ).map(({ valor, etiqueta }) => (
            <button
              key={valor}
              onClick={() => setAlcance(valor)}
              className={`px-3 py-1 text-xs font-bold border transition-colors whitespace-nowrap cursor-pointer ${
                alcance === valor
                  ? 'bg-[#161616] text-white border-[#161616]'
                  : 'bg-[#f4f4f4] text-[#161616] border-[#e0e0e0] hover:bg-[#e0e0e0]'
              }`}
            >
              {etiqueta}
            </button>
          ))}

        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white border border-[#e0e0e0] shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#262626] text-[#f4f4f4] text-xs uppercase tracking-wider font-semibold">
                <th className="py-3 px-3.5 border-r border-[#393939]">Nombre</th>
                <th className="py-3 px-3.5 border-r border-[#393939] w-32">DNI</th>
                <th className="py-3 px-3.5 border-r border-[#393939]">Puesto</th>
                <th className="py-3 px-3.5 border-r border-[#393939]">Correo electrónico</th>
                <th className="py-3 px-3.5 border-r border-[#393939] w-36 text-center">Estado</th>
                <th className="py-2 px-3.5 text-center w-32">
                  {hayFiltrosActivos && (
                    <button
                      onClick={limpiarFiltros}
                      title="Limpiar filtros"
                      className="p-1.5 bg-[#da1e28] hover:bg-[#ba1b23] text-white transition-colors cursor-pointer inline-flex items-center justify-center"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e0e0e0]">
              {tecnicosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-sm text-[#6f6f6f]">
                    No hay técnicos que coincidan con los filtros.
                  </td>
                </tr>
              ) : (
                tecnicosFiltrados.map((t) => {
                  const estado = estadoDe(t);
                  return (
                    <tr key={t.id} className="hover:bg-[#f4f8ff] transition-colors">
                      <td className="py-3 px-3.5 border-r border-[#e0e0e0] text-sm font-semibold text-[#161616]">
                        <span className="uppercase">{t.apellido}</span>, {t.nombre}
                        {!t.laboratorio && (
                          <span className="ml-2 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-[#e0e0e0] text-[#525252]">
                            Externo
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3.5 border-r border-[#e0e0e0] text-sm font-mono">
                        {t.dni}
                      </td>
                      <td className="py-3 px-3.5 border-r border-[#e0e0e0] text-sm text-[#161616]">
                        {t.puesto}
                      </td>
                      <td className="py-3 px-3.5 border-r border-[#e0e0e0] text-sm text-[#525252]">
                        {t.email}
                      </td>
                      <td className="py-3 px-3.5 border-r border-[#e0e0e0] text-center">
                        {estado ? (
                          <span
                            className={`w-28 h-7 inline-flex items-center justify-center text-xs font-bold uppercase tracking-wider ${CLASES_ESTADO_TECNICO[estado]}`}
                          >
                            {estado}
                          </span>
                        ) : (
                          <span className="text-[#8d8d8d]">—</span>
                        )}
                      </td>
                      <td className="py-3 px-3.5 text-center">
                        <div className="flex items-center justify-center space-x-1.5">
                          <button
                            onClick={() => setTecnicoVer(t)}
                            title="Ver técnico"
                            className="p-2 bg-white hover:bg-[#e0e0e0] text-[#0f62fe] border border-[#8d8d8d] transition-colors cursor-pointer"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => abrirModalEditar(t)}
                            title="Editar técnico"
                            className="p-2 bg-white hover:bg-[#e0e0e0] text-[#161616] border border-[#8d8d8d] transition-colors cursor-pointer"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setErrorBaja('');
                              setTecnicoBaja(t);
                            }}
                            title="Dar de baja"
                            className="p-2 bg-white hover:bg-[#da1e28] text-[#da1e28] hover:text-white border border-[#ffb3b8] transition-colors cursor-pointer"
                          >
                            <UserMinus className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="bg-[#f4f4f4] px-4 py-2 border-t border-[#e0e0e0] flex items-center justify-between text-xs text-[#525252]">
          <span>
            Mostrando <strong>{tecnicosFiltrados.length}</strong> de{' '}
            <strong>{vigentes.length}</strong> técnicos registrados
          </span>
        </div>
      </div>

      {/* Modal Nuevo / Editar */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white border border-[#393939] shadow-2xl w-full max-w-lg my-8 overflow-hidden">
            <div className="bg-[#161616] text-white px-6 py-4 flex items-center justify-between border-b border-[#393939]">
              <h2 className="text-sm font-semibold uppercase">
                {tecnicoEdit ? 'Editar técnico' : 'Agregar técnico'}
              </h2>
              <button
                onClick={() => setModalOpen(false)}
                className="text-[#a8a8a8] hover:text-white p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase mb-1">Nombre *</label>
                  <input
                    type="text"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    required
                    className="w-full bg-white border border-[#8d8d8d] px-3 py-1.5 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase mb-1">Apellido *</label>
                  <input
                    type="text"
                    value={apellido}
                    onChange={(e) => setApellido(e.target.value)}
                    required
                    className="w-full bg-white border border-[#8d8d8d] px-3 py-1.5 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase mb-1">DNI *</label>
                <input
                  type="text"
                  value={dni}
                  onChange={(e) => setDni(e.target.value)}
                  placeholder="Ej: 34.123.456"
                  required
                  className="w-full bg-white border border-[#8d8d8d] px-3 py-1.5 text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase mb-1">
                  Puesto (determina el nivel de mando) *
                </label>
                <select
                  value={puesto}
                  onChange={(e) => setPuesto(e.target.value as PuestoTecnico)}
                  className="w-full bg-white border border-[#8d8d8d] px-3 py-1.5 text-xs font-bold"
                >
                  {PUESTOS.map((p) => (
                    <option key={p} value={p}>
                      {p} (Nivel {JERARQUIA_VALOR[p]})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase mb-1">
                  Correo electrónico
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nombre.apellido@radioayudas.gov.ar"
                  className="w-full bg-white border border-[#8d8d8d] px-3 py-1.5 text-xs"
                />
              </div>

              <div className="space-y-2 pt-1">
                <label className="flex items-center space-x-2 text-xs font-semibold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={laboratorio}
                    onChange={(e) => setLaboratorio(e.target.checked)}
                  />
                  <span>Pertenece al Laboratorio</span>
                </label>
                {laboratorio && (
                  <label className="flex items-center space-x-2 text-xs font-semibold cursor-pointer">
                    <input
                      type="checkbox"
                      checked={enLicencia}
                      onChange={(e) => setEnLicencia(e.target.checked)}
                    />
                    <span>Actualmente en licencia</span>
                  </label>
                )}
              </div>

              <div className="flex justify-end space-x-3 pt-3 border-t border-[#e0e0e0]">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 border border-[#8d8d8d] text-xs font-medium cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#0f62fe] hover:bg-[#0353e9] text-white text-xs font-bold cursor-pointer"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Expediente del técnico */}
      {tecnicoVer && (
        <TecnicoExpedienteModal
          tecnico={tecnicoVer}
          estado={
            estadoDe(tecnicoVer)
              ? { etiqueta: estadoDe(tecnicoVer)!, clases: CLASES_ESTADO_TECNICO[estadoDe(tecnicoVer)!] }
              : null
          }
          onClose={() => setTecnicoVer(null)}
          onEditar={(t) => {
            setTecnicoVer(null);
            abrirModalEditar(t);
          }}
          onDarDeBaja={(t) => {
            setTecnicoVer(null);
            setErrorBaja('');
            setTecnicoBaja(t);
          }}
          onVerComisiones={onVerComisiones}
        />
      )}

      {/* Modal Dar de baja */}
      {tecnicoBaja && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white border border-[#393939] shadow-2xl w-full max-w-md overflow-hidden">
            <div className="bg-[#161616] text-white px-6 py-4 flex items-center justify-between border-b border-[#393939]">
              <h2 className="text-sm font-semibold uppercase">Dar de baja técnico</h2>
              <button
                onClick={() => setTecnicoBaja(null)}
                className="text-[#a8a8a8] hover:text-white p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-3 text-sm">
              <p>
                ¿Dar de baja a{' '}
                <strong>
                  {tecnicoBaja.apellido.toUpperCase()}, {tecnicoBaja.nombre}
                </strong>
                ? Dejará de listarse y de poder designarse en comisiones; su nombre se conserva en
                las comisiones anteriores.
              </p>
              {errorBaja && (
                <p className="text-xs font-semibold text-[#da1e28] bg-[#ffebee] border border-[#ffb3b8] p-2">
                  {errorBaja}
                </p>
              )}
              <div className="flex justify-end space-x-3 pt-3 border-t border-[#e0e0e0]">
                <button
                  onClick={() => setTecnicoBaja(null)}
                  className="px-4 py-2 border border-[#8d8d8d] text-xs font-medium cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmarBaja}
                  className="px-5 py-2 bg-[#da1e28] hover:bg-[#b81921] text-white text-xs font-bold cursor-pointer"
                >
                  Dar de baja
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
