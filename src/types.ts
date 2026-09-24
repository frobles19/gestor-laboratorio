export type RegionAeronautica = 
  | 'EZEIZA' 
  | 'CORDOBA' 
  | 'RESISTENCIA' 
  | 'MENDOZA' 
  | 'COMODORO RIVADAVIA';

export interface Aeropuerto {
  codigoIATA: string; // 3 letras, ej: EZE, AEP, COR
  nombreOficial: string;
  region: RegionAeronautica;
}

export type SistemaRadioayuda = 'VOR' | 'DME' | 'ILS';

export interface ModeloEquipo {
  id: string;
  sistema: SistemaRadioayuda;
  denominacion: string; // ej: "Doppler VOR 432", "NORMARC 7000B"
  fabricante: string;   // ej: "Thales ATM", "Indra Sistemas", "Selex ES"
}

export type EstadoOperativo = 'EN_SERVICIO' | 'FUERA_DE_SERVICIO';

export interface EquipoInstalado {
  id: string;
  identificador: string; // ej: "VOR CORDOBA", "DME/VOR IGUAZU", "ILS 35R EZEIZA"
  aeropuertoCodigo: string; // IATA
  modeloId: string;
  frecuenciaVerificacionAereaMeses: number;     // Frecuencia parametrizable en meses
  frecuenciaMantenimientoPreventivoMeses: number; // Frecuencia parametrizable en meses
  equipoAsociadoId: string | null; // Asociación funcional: ej DME asociado a VOR o ILS
  estadoOperativo: EstadoOperativo;
  fechaUltimaVerificacionAerea: string; // YYYY-MM-DD
  fechaUltimoMantenimientoPreventivo: string; // YYYY-MM-DD
  ubicacionDetalle?: string; // ej: "Cabecera 35R", "Sector Radiofaro Norte"
}

export type PuestoTecnico = 
  | 'Jefe Departamento' 
  | 'Jefe Laboratorio' 
  | 'Coordinador' 
  | 'Coordinador Adjunto' 
  | 'Técnico';

export interface Tecnico {
  id: string;
  nombre: string;
  apellido: string;
  dni: string;
  email: string;
  puesto: PuestoTecnico;
}

export type MedioTransporte = 'Terrestre' | 'Aéreo';

export type EstadoComision = 'Planificada' | 'En Curso' | 'Finalizada' | 'Cancelada';

export interface ComisionServicio {
  id: string;
  codigo: string; // ej: "COM-2026-001"
  fechaSalida: string; // YYYY-MM-DD
  fechaRegreso: string; // YYYY-MM-DD
  fechaSalidaReal?: string; // YYYY-MM-DD
  fechaRegresoReal?: string; // YYYY-MM-DD
  medioTransporte: MedioTransporte;
  destinosAeropuertos: string[]; // Códigos IATA
  tecnicosIds: string[];
  jefeComisionId: string; // Calculado automáticamente por jerarquía
  estado: EstadoComision;
  // Tipo(s) de mantenimiento de la comisión: al crearla contiene un único valor
  // (el previsto/planificado); al cerrarla se reemplaza por los tipos realmente
  // ejecutados en las tareas registradas (puede haber más de uno).
  tiposMantenimiento: TipoIntervencion[];
  objetivo?: string;
  observacionesCierre?: string;
  createdAt: string;
  finalizadaAt?: string;
  canceladaAt?: string;
  motivoCancelacion?: string;
}

export type TipoIntervencion =
  | 'Verificación'
  | 'Preventivo'
  | 'Correctivo'
  | 'Otros';

export type PeriodicidadMantenimientoPreventivo =
  | 'Mensual'
  | 'Trimestral'
  | 'Semestral'
  | 'Anual';

export type SubtipoVerificacionAerea =
  | 'Sin alarmas'
  | 'Con alarmas';

export interface IntervencionMantenimiento {
  id: string;
  comisionId: string;
  equipoId: string;
  fechaEjecucion: string; // Fecha individual para cada tarea
  tipoIntervencion: TipoIntervencion;
  tipoPreventivo?: PeriodicidadMantenimientoPreventivo;
  subtipoVerificacionAerea?: SubtipoVerificacionAerea;
  detalleTecnico: string; // Tareas realizadas, calibraciones, mediciones
  estadoOperativoResultante: EstadoOperativo;
  tareaPendienteProximaVisita?: string; // Repuestos necesarios, obras de infraestructura, etc.
}

export interface NovedadComision {
  id: string;
  comisionId: string;
  aeropuertoCodigo: string; // IATA
  observacion: string;
  fechaRegistro: string;
}

export type NivelSemaforo = 'AL_DIA' | 'PROXIMO_A_VENCER' | 'VENCIDO';

export interface EstadoVencimiento {
  fechaUltima: string;
  periodicidadMeses: number;
  fechaLimite: string;
  diasRestantes: number;
  nivel: NivelSemaforo;
  etiqueta: string;
}

// Auditoría / trazabilidad genérica, reutilizable por cualquier módulo del sistema.
// Por ahora solo se registran eventos del módulo de Comisiones.
export type ModuloAuditoria = 'COMISIONES';

export type AccionAuditoria = 'CREAR' | 'EDITAR' | 'CANCELAR' | 'ELIMINAR' | 'CERRAR';

export interface RegistroAuditoria {
  id: string;
  modulo: ModuloAuditoria;
  entidadId: string;
  entidadEtiqueta: string; // ej: código de la comisión, para mostrar sin tener que buscarla
  accion: AccionAuditoria;
  fecha: string; // ISO 8601 con hora
  usuario: string;
  estadoAnterior: Record<string, unknown> | null;
  estadoNuevo: Record<string, unknown> | null;
}
