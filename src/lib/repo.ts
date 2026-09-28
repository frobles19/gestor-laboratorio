// Capa de datos: traduce entre las filas de Supabase (snake_case) y los tipos
// de dominio de la app (camelCase, ver src/types.ts), y expone una función
// por operación. AppContext es el único que importa este módulo.
import { supabase } from './supabaseClient';
import {
  Aeropuerto,
  ModeloEquipo,
  EquipoInstalado,
  Tecnico,
  ComisionServicio,
  IntervencionMantenimiento,
  RegistroAuditoria,
} from '../types';

function throwSiError(error: { message: string } | null) {
  if (error) throw new Error(error.message);
}

// ---------- Aeropuertos ----------
const rowToAeropuerto = (r: any): Aeropuerto => ({
  codigoIATA: r.codigo_iata,
  nombreOficial: r.nombre_oficial,
  region: r.region,
  eliminadoAt: r.eliminado_at ?? undefined,
});

export async function fetchAeropuertos(): Promise<Aeropuerto[]> {
  const { data, error } = await supabase.from('aeropuertos').select('*').order('codigo_iata');
  throwSiError(error);
  return (data || []).map(rowToAeropuerto);
}

export async function insertarAeropuerto(a: Aeropuerto) {
  const { error } = await supabase.from('aeropuertos').insert({
    codigo_iata: a.codigoIATA,
    nombre_oficial: a.nombreOficial,
    region: a.region,
  });
  throwSiError(error);
}

export async function actualizarAeropuertoDB(
  codigoIATA: string,
  datos: { nombreOficial: string; region: string }
) {
  const { error } = await supabase
    .from('aeropuertos')
    .update({ nombre_oficial: datos.nombreOficial, region: datos.region })
    .eq('codigo_iata', codigoIATA);
  throwSiError(error);
}

export async function darDeBajaAeropuertoDB(codigoIATA: string, eliminadoAt: string) {
  const { error } = await supabase
    .from('aeropuertos')
    .update({ eliminado_at: eliminadoAt })
    .eq('codigo_iata', codigoIATA);
  throwSiError(error);
}

// ---------- Modelos de equipo ----------
const rowToModelo = (r: any): ModeloEquipo => ({
  id: r.id,
  sistema: r.sistema,
  denominacion: r.denominacion,
  fabricante: r.fabricante,
  eliminadoAt: r.eliminado_at ?? undefined,
});

export async function fetchModelos(): Promise<ModeloEquipo[]> {
  const { data, error } = await supabase.from('modelos_equipo').select('*').order('denominacion');
  throwSiError(error);
  return (data || []).map(rowToModelo);
}

export async function insertarModelo(m: ModeloEquipo) {
  const { error } = await supabase.from('modelos_equipo').insert({
    id: m.id,
    sistema: m.sistema,
    denominacion: m.denominacion,
    fabricante: m.fabricante,
  });
  throwSiError(error);
}

export async function actualizarModeloDB(
  id: string,
  datos: { sistema: string; denominacion: string; fabricante: string }
) {
  const { error } = await supabase
    .from('modelos_equipo')
    .update({ sistema: datos.sistema, denominacion: datos.denominacion, fabricante: datos.fabricante })
    .eq('id', id);
  throwSiError(error);
}

export async function darDeBajaModeloDB(id: string, eliminadoAt: string) {
  const { error } = await supabase
    .from('modelos_equipo')
    .update({ eliminado_at: eliminadoAt })
    .eq('id', id);
  throwSiError(error);
}

// ---------- Equipos instalados ----------
const rowToEquipo = (r: any): EquipoInstalado => ({
  id: r.id,
  identificador: r.identificador,
  aeropuertoCodigo: r.aeropuerto_codigo,
  modeloId: r.modelo_id,
  frecuenciaVerificacionAereaMeses: r.frecuencia_verificacion_aerea_meses,
  frecuenciaMantenimientoPreventivoMeses: r.frecuencia_mantenimiento_preventivo_meses,
  equipoAsociadoId: r.equipo_asociado_id,
  estadoOperativo: r.estado_operativo,
  fechaUltimaVerificacionAerea: r.fecha_ultima_verificacion_aerea,
  fechaUltimoMantenimientoPreventivo: r.fecha_ultimo_mantenimiento_preventivo,
  ubicacionDetalle: r.ubicacion_detalle ?? undefined,
});

const equipoToRow = (e: EquipoInstalado) => ({
  id: e.id,
  identificador: e.identificador,
  aeropuerto_codigo: e.aeropuertoCodigo,
  modelo_id: e.modeloId,
  frecuencia_verificacion_aerea_meses: e.frecuenciaVerificacionAereaMeses,
  frecuencia_mantenimiento_preventivo_meses: e.frecuenciaMantenimientoPreventivoMeses,
  equipo_asociado_id: e.equipoAsociadoId,
  estado_operativo: e.estadoOperativo,
  fecha_ultima_verificacion_aerea: e.fechaUltimaVerificacionAerea,
  fecha_ultimo_mantenimiento_preventivo: e.fechaUltimoMantenimientoPreventivo,
  ubicacion_detalle: e.ubicacionDetalle ?? null,
});

export async function fetchEquipos(): Promise<EquipoInstalado[]> {
  const { data, error } = await supabase.from('equipos_instalados').select('*').order('identificador');
  throwSiError(error);
  return (data || []).map(rowToEquipo);
}

export async function guardarEquipoDB(e: EquipoInstalado) {
  const { error } = await supabase.from('equipos_instalados').upsert(equipoToRow(e));
  throwSiError(error);
}

export async function actualizarEquiposMasivoDB(equipos: EquipoInstalado[]) {
  if (equipos.length === 0) return;
  const { error } = await supabase.from('equipos_instalados').upsert(equipos.map(equipoToRow));
  throwSiError(error);
}

export async function eliminarEquipoDB(id: string) {
  const { error } = await supabase.from('equipos_instalados').delete().eq('id', id);
  throwSiError(error);
}

// ---------- Técnicos ----------
const rowToTecnico = (r: any): Tecnico => ({
  id: r.id,
  nombre: r.nombre,
  apellido: r.apellido,
  dni: r.dni,
  email: r.email,
  puesto: r.puesto,
  laboratorio: r.laboratorio,
  enLicencia: r.en_licencia ?? undefined,
  bajaAt: r.baja_at ?? undefined,
});

export async function fetchTecnicos(): Promise<Tecnico[]> {
  const { data, error } = await supabase.from('tecnicos').select('*').order('apellido');
  throwSiError(error);
  return (data || []).map(rowToTecnico);
}

export async function guardarTecnicoDB(t: Tecnico) {
  const { error } = await supabase.from('tecnicos').upsert({
    id: t.id,
    nombre: t.nombre,
    apellido: t.apellido,
    dni: t.dni,
    email: t.email,
    puesto: t.puesto,
    laboratorio: t.laboratorio,
    en_licencia: t.enLicencia ?? false,
  });
  throwSiError(error);
}

export async function darDeBajaTecnicoDB(id: string, bajaAt: string) {
  const { error } = await supabase.from('tecnicos').update({ baja_at: bajaAt }).eq('id', id);
  throwSiError(error);
}

// ---------- Comisiones de servicio ----------
const rowToComision = (r: any): ComisionServicio => ({
  id: r.id,
  codigo: r.codigo,
  fechaSalida: r.fecha_salida,
  fechaRegreso: r.fecha_regreso,
  fechaSalidaReal: r.fecha_salida_real ?? undefined,
  fechaRegresoReal: r.fecha_regreso_real ?? undefined,
  medioTransporte: r.medio_transporte,
  destinosAeropuertos: r.destinos_aeropuertos || [],
  tecnicosIds: r.tecnicos_ids || [],
  jefeComisionId: r.jefe_comision_id,
  estado: r.estado,
  tiposMantenimiento: r.tipos_mantenimiento || [],
  objetivo: r.objetivo ?? undefined,
  observacionesCierre: r.observaciones_cierre ?? undefined,
  createdAt: r.created_at,
  finalizadaAt: r.finalizada_at ?? undefined,
  canceladaAt: r.cancelada_at ?? undefined,
  eliminadaAt: r.eliminada_at ?? undefined,
  motivoCancelacion: r.motivo_cancelacion ?? undefined,
});

const comisionToRow = (c: ComisionServicio) => ({
  id: c.id,
  codigo: c.codigo,
  fecha_salida: c.fechaSalida,
  fecha_regreso: c.fechaRegreso,
  fecha_salida_real: c.fechaSalidaReal ?? null,
  fecha_regreso_real: c.fechaRegresoReal ?? null,
  medio_transporte: c.medioTransporte,
  destinos_aeropuertos: c.destinosAeropuertos,
  tecnicos_ids: c.tecnicosIds,
  jefe_comision_id: c.jefeComisionId,
  estado: c.estado,
  tipos_mantenimiento: c.tiposMantenimiento,
  objetivo: c.objetivo ?? null,
  observaciones_cierre: c.observacionesCierre ?? null,
  created_at: c.createdAt,
  finalizada_at: c.finalizadaAt ?? null,
  cancelada_at: c.canceladaAt ?? null,
  eliminada_at: c.eliminadaAt ?? null,
  motivo_cancelacion: c.motivoCancelacion ?? null,
});

export async function fetchComisiones(): Promise<ComisionServicio[]> {
  const { data, error } = await supabase
    .from('comisiones_servicio')
    .select('*')
    .order('fecha_salida', { ascending: false });
  throwSiError(error);
  return (data || []).map(rowToComision);
}

export async function insertarComisionDB(c: ComisionServicio) {
  const { error } = await supabase.from('comisiones_servicio').insert(comisionToRow(c));
  throwSiError(error);
}

export async function actualizarComisionDB(c: ComisionServicio) {
  const { error } = await supabase
    .from('comisiones_servicio')
    .update(comisionToRow(c))
    .eq('id', c.id);
  throwSiError(error);
}

// ---------- Intervenciones de mantenimiento ----------
const rowToIntervencion = (r: any): IntervencionMantenimiento => ({
  id: r.id,
  comisionId: r.comision_id,
  equipoId: r.equipo_id,
  fechaEjecucion: r.fecha_ejecucion,
  tipoIntervencion: r.tipo_intervencion,
  tipoPreventivo: r.tipo_preventivo ?? undefined,
  subtipoVerificacionAerea: r.subtipo_verificacion_aerea ?? undefined,
  detalleTecnico: r.detalle_tecnico,
  estadoOperativoResultante: r.estado_operativo_resultante,
  tareaPendienteProximaVisita: r.tarea_pendiente_proxima_visita ?? undefined,
});

export async function fetchIntervenciones(): Promise<IntervencionMantenimiento[]> {
  const { data, error } = await supabase
    .from('intervenciones_mantenimiento')
    .select('*')
    .order('fecha_ejecucion', { ascending: false });
  throwSiError(error);
  return (data || []).map(rowToIntervencion);
}

export async function insertarIntervencionesDB(items: IntervencionMantenimiento[]) {
  if (items.length === 0) return;
  const { error } = await supabase.from('intervenciones_mantenimiento').insert(
    items.map((i) => ({
      id: i.id,
      comision_id: i.comisionId,
      equipo_id: i.equipoId,
      fecha_ejecucion: i.fechaEjecucion,
      tipo_intervencion: i.tipoIntervencion,
      tipo_preventivo: i.tipoPreventivo ?? null,
      subtipo_verificacion_aerea: i.subtipoVerificacionAerea ?? null,
      detalle_tecnico: i.detalleTecnico,
      estado_operativo_resultante: i.estadoOperativoResultante,
      tarea_pendiente_proxima_visita: i.tareaPendienteProximaVisita ?? null,
    }))
  );
  throwSiError(error);
}

// ---------- Auditoría ----------
const rowToAuditoria = (r: any): RegistroAuditoria => ({
  id: r.id,
  modulo: r.modulo,
  entidadId: r.entidad_id,
  entidadEtiqueta: r.entidad_etiqueta,
  accion: r.accion,
  fecha: r.fecha,
  usuario: r.usuario,
  estadoAnterior: r.estado_anterior,
  estadoNuevo: r.estado_nuevo,
});

export async function fetchAuditoria(): Promise<RegistroAuditoria[]> {
  const { data, error } = await supabase
    .from('registro_auditoria')
    .select('*')
    .order('fecha', { ascending: false });
  throwSiError(error);
  return (data || []).map(rowToAuditoria);
}

export async function insertarAuditoriaDB(r: RegistroAuditoria) {
  const { error } = await supabase.from('registro_auditoria').insert({
    id: r.id,
    modulo: r.modulo,
    entidad_id: r.entidadId,
    entidad_etiqueta: r.entidadEtiqueta,
    accion: r.accion,
    fecha: r.fecha,
    usuario: r.usuario,
    estado_anterior: r.estadoAnterior,
    estado_nuevo: r.estadoNuevo,
  });
  throwSiError(error);
}
