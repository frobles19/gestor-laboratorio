import React, { useState } from 'react';
import {
  Shield,
  Plus,
  Search,
  UserCheck,
  Mail,
  FileText,
  Award,
  Edit2,
  X,
  Check,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { PuestoTecnico, Tecnico } from '../types';
import { JERARQUIA_VALOR } from '../utils/maintenance';

export const NominaTecnicaView: React.FC = () => {
  const { nomina, guardarTecnico } = useApp();

  const [busqueda, setBusqueda] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [tecnicoEdit, setTecnicoEdit] = useState<Tecnico | null>(null);

  // Campos de formulario modal
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [dni, setDni] = useState('');
  const [email, setEmail] = useState('');
  const [puesto, setPuesto] = useState<PuestoTecnico>('Técnico');

  const abrirModalNuevo = () => {
    setTecnicoEdit(null);
    setNombre('');
    setApellido('');
    setDni('');
    setEmail('');
    setPuesto('Técnico');
    setModalOpen(true);
  };

  const abrirModalEditar = (t: Tecnico) => {
    setTecnicoEdit(t);
    setNombre(t.nombre);
    setApellido(t.apellido);
    setDni(t.dni);
    setEmail(t.email);
    setPuesto(t.puesto);
    setModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre || !apellido || !dni) return;

    const id = tecnicoEdit ? tecnicoEdit.id : `TEC-${Date.now()}`;
    guardarTecnico({
      id,
      nombre: nombre.trim(),
      apellido: apellido.trim(),
      dni: dni.trim(),
      email: email.trim() || `${nombre.toLowerCase()}.${apellido.toLowerCase()}@radioayudas.gov.ar`,
      puesto,
    });

    setModalOpen(false);
  };

  // Ordenar nómina por jerarquía institucional (1 es mayor mando)
  const nominaOrdenada = [...nomina].sort((a, b) => {
    const rA = JERARQUIA_VALOR[a.puesto] ?? 99;
    const rB = JERARQUIA_VALOR[b.puesto] ?? 99;
    if (rA !== rB) return rA - rB;
    return a.apellido.localeCompare(b.apellido);
  });

  const nominaFiltrada = nominaOrdenada.filter((t) => {
    const q = busqueda.toLowerCase();
    return (
      t.nombre.toLowerCase().includes(q) ||
      t.apellido.toLowerCase().includes(q) ||
      t.dni.includes(q) ||
      t.puesto.toLowerCase().includes(q) ||
      t.email.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-4">
      {/* Encabezado */}
      <div className="bg-white p-4 border border-[#e0e0e0] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-mono font-bold bg-[#393939] text-white px-2 py-0.5">
              MÓDULO 303
            </span>
            <h1 className="text-lg font-bold text-[#161616] tracking-tight">
              NÓMINA TÉCNICA Y ESCALAFÓN DE MANDO INSTITUCIONAL
            </h1>
          </div>
          <p className="text-xs text-[#525252] mt-0.5">
            Registro de especialistas, credenciales y jerarquía reglamentaria para la designación
            automática de Jefes de Comisión de Servicio.
          </p>
        </div>

        <button
          onClick={abrirModalNuevo}
          className="flex items-center space-x-2 px-4 py-2 bg-[#0f62fe] hover:bg-[#0353e9] text-white text-xs font-bold tracking-wide transition-colors shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>ALTA DE PERSONAL TÉCNICO</span>
        </button>
      </div>

      {/* Explicación de la Cadena de Mando Institucional */}
      <div className="bg-[#edf5ff] border-l-4 border-[#0f62fe] p-4 text-xs text-[#002d9c]">
        <div className="font-bold text-xs uppercase tracking-wider mb-2 flex items-center space-x-1.5">
          <Shield className="w-4 h-4 text-[#0f62fe]" />
          <span>Regla de Mando Aeronáutico para Comisiones de Servicio:</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 text-center text-xs">
          <div className="bg-white p-2 border border-[#0f62fe]/30 font-semibold shadow-2xs">
            <span className="block text-[10px] text-[#0f62fe] font-mono font-bold">JERARQUÍA 1</span>
            Jefe Departamento
          </div>
          <div className="bg-white p-2 border border-[#0f62fe]/30 font-semibold shadow-2xs">
            <span className="block text-[10px] text-[#0f62fe] font-mono font-bold">JERARQUÍA 2</span>
            Jefe Laboratorio
          </div>
          <div className="bg-white p-2 border border-[#0f62fe]/30 font-semibold shadow-2xs">
            <span className="block text-[10px] text-[#0f62fe] font-mono font-bold">JERARQUÍA 3</span>
            Coordinador
          </div>
          <div className="bg-white p-2 border border-[#0f62fe]/30 font-semibold shadow-2xs">
            <span className="block text-[10px] text-[#0f62fe] font-mono font-bold">JERARQUÍA 4</span>
            Coordinador Adjunto
          </div>
          <div className="bg-white p-2 border border-[#0f62fe]/30 font-semibold shadow-2xs">
            <span className="block text-[10px] text-[#0f62fe] font-mono font-bold">JERARQUÍA 5</span>
            Técnico
          </div>
        </div>
        <p className="text-[11px] text-[#525252] mt-2">
          Cuando se crea una comisión y se asignan varios técnicos, el sistema determina
          automáticamente como <strong>Jefe de Comisión</strong> al funcionario de mayor jerarquía.
        </p>
      </div>

      {/* Buscador */}
      <div className="bg-white p-3 border border-[#e0e0e0] flex items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-2 text-[#8d8d8d]" />
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por apellido, nombre, DNI o puesto..."
            className="w-full pl-9 pr-3 py-1 bg-[#f4f4f4] border border-[#8d8d8d] text-xs focus:outline-hidden focus:ring-1 focus:ring-[#0f62fe] focus:bg-white"
          />
        </div>
        <span className="text-xs text-[#6f6f6f] hidden sm:block">
          {nominaFiltrada.length} especialistas en nómina
        </span>
      </div>

      {/* Tabla de Personal Técnico */}
      <div className="bg-white border border-[#e0e0e0] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#262626] text-[#f4f4f4] text-[11px] uppercase tracking-wider font-semibold">
                <th className="py-2.5 px-3 border-r border-[#393939] w-24 text-center">Nivel Mando</th>
                <th className="py-2.5 px-3 border-r border-[#393939]">Apellido y Nombre</th>
                <th className="py-2.5 px-3 border-r border-[#393939] w-32 font-mono">DNI</th>
                <th className="py-2.5 px-3 border-r border-[#393939]">Puesto Institucional</th>
                <th className="py-2.5 px-3 border-r border-[#393939]">Correo Electrónico</th>
                <th className="py-2.5 px-3 text-right w-24">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e0e0e0] text-xs">
              {nominaFiltrada.map((t) => {
                const jerarquia = JERARQUIA_VALOR[t.puesto];
                return (
                  <tr key={t.id} className="hover:bg-[#f4f8ff] transition-colors">
                    <td className="py-3 px-3 text-center font-mono border-r border-[#e0e0e0]">
                      <span
                        className={`inline-block px-2 py-0.5 text-xs font-bold ${
                          jerarquia === 1
                            ? 'bg-[#002d9c] text-white'
                            : jerarquia === 2
                            ? 'bg-[#0f62fe] text-white'
                            : jerarquia === 3
                            ? 'bg-[#198038] text-white'
                            : 'bg-[#e0e0e0] text-[#161616]'
                        }`}
                      >
                        Nivel {jerarquia}
                      </span>
                    </td>
                    <td className="py-3 px-3 border-r border-[#e0e0e0]">
                      <div className="font-bold text-[#161616]">
                        <span className="uppercase">{t.apellido}</span>, {t.nombre}
                      </div>
                      <div className="text-[10px] text-[#6f6f6f] font-mono">ID: {t.id}</div>
                    </td>
                    <td className="py-3 px-3 font-mono font-semibold border-r border-[#e0e0e0]">
                      {t.dni}
                    </td>
                    <td className="py-3 px-3 border-r border-[#e0e0e0]">
                      <span className="font-semibold text-[#0043ce]">{t.puesto}</span>
                    </td>
                    <td className="py-3 px-3 font-mono text-[11px] text-[#525252] border-r border-[#e0e0e0]">
                      {t.email}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => abrirModalEditar(t)}
                        className="px-2.5 py-1 bg-white hover:bg-[#e0e0e0] text-[#161616] border border-[#8d8d8d] text-xs font-medium transition-colors inline-flex items-center space-x-1"
                      >
                        <Edit2 className="w-3 h-3 text-[#0f62fe]" />
                        <span>Editar</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Nuevo/Editar Técnico */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white border border-[#393939] shadow-2xl w-full max-w-lg my-8 rounded-none overflow-hidden">
            <div className="bg-[#161616] text-white px-6 py-4 flex items-center justify-between border-b border-[#393939]">
              <div className="flex items-center space-x-2">
                <Shield className="w-5 h-5 text-[#0f62fe]" />
                <h2 className="text-sm font-semibold">
                  {tecnicoEdit ? 'EDITAR PERSONAL TÉCNICO' : 'NUEVO PROFESIONAL TÉCNICO'}
                </h2>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="text-[#a8a8a8] hover:text-white p-1"
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
                  Puesto Institucional (Determina Nivel de Mando) *
                </label>
                <select
                  value={puesto}
                  onChange={(e) => setPuesto(e.target.value as PuestoTecnico)}
                  className="w-full bg-white border border-[#8d8d8d] px-3 py-1.5 text-xs font-bold"
                >
                  <option value="Jefe Departamento">Jefe Departamento (Nivel 1)</option>
                  <option value="Jefe Laboratorio">Jefe Laboratorio (Nivel 2)</option>
                  <option value="Coordinador">Coordinador (Nivel 3)</option>
                  <option value="Coordinador Adjunto">Coordinador Adjunto (Nivel 4)</option>
                  <option value="Técnico">Técnico (Nivel 5)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase mb-1">
                  Correo Electrónico
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nombre.apellido@radioayudas.gov.ar"
                  className="w-full bg-white border border-[#8d8d8d] px-3 py-1.5 text-xs"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-3 border-t border-[#e0e0e0]">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 border border-[#8d8d8d] text-xs font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#0f62fe] text-white text-xs font-bold"
                >
                  Guardar Profesional
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
