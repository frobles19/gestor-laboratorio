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
  ciudad?: string;
  provincia?: string;
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

export type EstadoComision = 'Planificada' | 'En Curso' | 'Finalizada';

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
  tipoMantenimiento?: string;
  tiposMantenimiento?: TipoIntervencion[];
  tipoMantenimientoPrevisto?: TipoIntervencion; // Tipo originalmente elegido en la planificación
  objetivo?: string;
  observacionesCierre?: string;
  createdAt: string;
  finalizadaAt?: string;
}

export type TipoIntervencion = 
  | 'Verificación' 
  | 'Preventivo' 
  | 'Correctivo'
  | 'Otros'
  | 'Verificación Aérea' 
  | 'Mantenimiento Preventivo' 
  | 'Mantenimiento Correctivo';

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
  tecnicoResponsableId?: string;
}

export type TipoNovedad = 'TECNICA' | 'INFRAESTRUCTURA' | 'OPERATIVA';

export interface NovedadComision {
  id: string;
  comisionId: string;
  aeropuertoCodigo: string; // IATA
  tipo: TipoNovedad;
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
