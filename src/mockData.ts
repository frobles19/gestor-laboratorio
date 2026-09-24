import {
  Aeropuerto,
  ModeloEquipo,
  EquipoInstalado,
  Tecnico,
  ComisionServicio,
  IntervencionMantenimiento,
  NovedadComision,
} from './types';

export const INITIAL_AEROPUERTOS: Aeropuerto[] = [
  {
    codigoIATA: 'EZE',
    nombreOficial: 'Aeropuerto Internacional Ministro Pistarini',
    region: 'EZEIZA',
  },
  {
    codigoIATA: 'AEP',
    nombreOficial: 'Aeroparque Jorge Newbery',
    region: 'EZEIZA',
  },
  {
    codigoIATA: 'COR',
    nombreOficial: 'Aeropuerto Internacional Ing. Ambrosio Taravella',
    region: 'CORDOBA',
  },
  {
    codigoIATA: 'MDZ',
    nombreOficial: 'Aeropuerto Internacional Gobernador Francisco Gabrielli',
    region: 'MENDOZA',
  },
  {
    codigoIATA: 'IGR',
    nombreOficial: 'Aeropuerto Internacional Mayor D. Carlos Eduardo Krause',
    region: 'RESISTENCIA',
  },
  {
    codigoIATA: 'RES',
    nombreOficial: 'Aeropuerto Internacional de Resistencia',
    region: 'RESISTENCIA',
  },
  {
    codigoIATA: 'CRD',
    nombreOficial: 'Aeropuerto Internacional General Enrique Mosconi',
    region: 'COMODORO RIVADAVIA',
  },
  {
    codigoIATA: 'BRC',
    nombreOficial: 'Aeropuerto Internacional Teniente Luis Candelaria',
    region: 'COMODORO RIVADAVIA',
  },
  {
    codigoIATA: 'SLA',
    nombreOficial: 'Aeropuerto Internacional Martín Miguel de Güemes',
    region: 'CORDOBA',
  },
  {
    codigoIATA: 'USH',
    nombreOficial: 'Aeropuerto Internacional Malvinas Argentinas',
    region: 'COMODORO RIVADAVIA',
  },
];

export const INITIAL_MODELOS: ModeloEquipo[] = [
  {
    id: 'MOD-DVOR-432',
    sistema: 'VOR',
    denominacion: 'Doppler VOR 432',
    fabricante: 'Thales ATM',
  },
  {
    id: 'MOD-DVOR-1150',
    sistema: 'VOR',
    denominacion: 'SELEX 1150 DVOR',
    fabricante: 'Selex ES / Leonardo',
  },
  {
    id: 'MOD-DME-1118',
    sistema: 'DME',
    denominacion: 'DME 1118A High Power (1kW)',
    fabricante: 'Fernau Avionics / Selex',
  },
  {
    id: 'MOD-DME-415',
    sistema: 'DME',
    denominacion: 'Thales DME 415/435',
    fabricante: 'Thales ATM',
  },
  {
    id: 'MOD-ILS-7000B',
    sistema: 'ILS',
    denominacion: 'NORMARC 7000B Cat II/III',
    fabricante: 'Indra Sistemas / Normarc',
  },
  {
    id: 'MOD-ILS-420',
    sistema: 'ILS',
    denominacion: 'Thales ILS 420 (Dual TX)',
    fabricante: 'Thales ATM',
  },
];

export const INITIAL_EQUIPOS: EquipoInstalado[] = [
  {
    id: 'EQ-VOR-COR',
    identificador: 'VOR CORDOBA',
    aeropuertoCodigo: 'COR',
    modeloId: 'MOD-DVOR-432',
    frecuenciaVerificacionAereaMeses: 12,
    frecuenciaMantenimientoPreventivoMeses: 3,
    equipoAsociadoId: 'EQ-DME-COR',
    estadoOperativo: 'EN_SERVICIO',
    fechaUltimaVerificacionAerea: '2025-10-15', // Límite: 2026-10-15 (Próximo a vencer en sept 2026)
    fechaUltimoMantenimientoPreventivo: '2026-07-10', // Límite: 2026-10-10
    ubicacionDetalle: 'Sector Radiofaro Central 1.5 NM al Sur RWY 01',
  },
  {
    id: 'EQ-DME-COR',
    identificador: 'DME/VOR CORDOBA',
    aeropuertoCodigo: 'COR',
    modeloId: 'MOD-DME-1118',
    frecuenciaVerificacionAereaMeses: 12,
    frecuenciaMantenimientoPreventivoMeses: 3,
    equipoAsociadoId: 'EQ-VOR-COR',
    estadoOperativo: 'EN_SERVICIO',
    fechaUltimaVerificacionAerea: '2025-10-15',
    fechaUltimoMantenimientoPreventivo: '2026-07-10',
    ubicacionDetalle: 'Caseta DVOR Córdoba',
  },
  {
    id: 'EQ-VOR-EZE',
    identificador: 'VOR EZEIZA',
    aeropuertoCodigo: 'EZE',
    modeloId: 'MOD-DVOR-1150',
    frecuenciaVerificacionAereaMeses: 12,
    frecuenciaMantenimientoPreventivoMeses: 3,
    equipoAsociadoId: 'EQ-DME-EZE',
    estadoOperativo: 'EN_SERVICIO',
    fechaUltimaVerificacionAerea: '2026-08-12', // Al día
    fechaUltimoMantenimientoPreventivo: '2026-08-12', // Al día
    ubicacionDetalle: 'Emplazamiento VOR 2 NM al SW',
  },
  {
    id: 'EQ-DME-EZE',
    identificador: 'DME/VOR EZEIZA',
    aeropuertoCodigo: 'EZE',
    modeloId: 'MOD-DME-415',
    frecuenciaVerificacionAereaMeses: 12,
    frecuenciaMantenimientoPreventivoMeses: 3,
    equipoAsociadoId: 'EQ-VOR-EZE',
    estadoOperativo: 'EN_SERVICIO',
    fechaUltimaVerificacionAerea: '2026-08-12',
    fechaUltimoMantenimientoPreventivo: '2026-08-12',
    ubicacionDetalle: 'Co-localizado VOR Ezeiza',
  },
  {
    id: 'EQ-ILS-EZE-35R',
    identificador: 'ILS 35R EZEIZA',
    aeropuertoCodigo: 'EZE',
    modeloId: 'MOD-ILS-7000B',
    frecuenciaVerificacionAereaMeses: 6,
    frecuenciaMantenimientoPreventivoMeses: 3,
    equipoAsociadoId: null,
    estadoOperativo: 'EN_SERVICIO',
    fechaUltimaVerificacionAerea: '2026-05-18', // Límite: 2026-11-18 (Al día)
    fechaUltimoMantenimientoPreventivo: '2026-06-05', // Límite: 2026-09-05 (Vencido en sept 2026!)
    ubicacionDetalle: 'Cabecera 35R (LOC en extremo 17L, GP en cabecera)',
  },
  {
    id: 'EQ-VOR-IGR',
    identificador: 'VOR IGUAZU',
    aeropuertoCodigo: 'IGR',
    modeloId: 'MOD-DVOR-432',
    frecuenciaVerificacionAereaMeses: 12,
    frecuenciaMantenimientoPreventivoMeses: 3,
    equipoAsociadoId: 'EQ-DME-IGR',
    estadoOperativo: 'EN_SERVICIO',
    fechaUltimaVerificacionAerea: '2025-08-20', // Límite: 2026-08-20 (Vencido!)
    fechaUltimoMantenimientoPreventivo: '2026-05-15', // Límite: 2026-08-15 (Vencido!)
    ubicacionDetalle: 'Sector Noroeste Aeropuerto',
  },
  {
    id: 'EQ-DME-IGR',
    identificador: 'DME/VOR IGUAZU',
    aeropuertoCodigo: 'IGR',
    modeloId: 'MOD-DME-415',
    frecuenciaVerificacionAereaMeses: 12,
    frecuenciaMantenimientoPreventivoMeses: 3,
    equipoAsociadoId: 'EQ-VOR-IGR',
    estadoOperativo: 'EN_SERVICIO',
    fechaUltimaVerificacionAerea: '2025-08-20',
    fechaUltimoMantenimientoPreventivo: '2026-05-15',
    ubicacionDetalle: 'Torre contraantena DVOR Iguazú',
  },
  {
    id: 'EQ-VOR-MDZ',
    identificador: 'VOR MENDOZA',
    aeropuertoCodigo: 'MDZ',
    modeloId: 'MOD-DVOR-1150',
    frecuenciaVerificacionAereaMeses: 12,
    frecuenciaMantenimientoPreventivoMeses: 3,
    equipoAsociadoId: 'EQ-DME-MDZ',
    estadoOperativo: 'EN_SERVICIO',
    fechaUltimaVerificacionAerea: '2025-11-04', // Límite: 2026-11-04 (Al día ~44d)
    fechaUltimoMantenimientoPreventivo: '2026-06-25', // Límite: 2026-09-25 (Próximo a vencer ~4d)
    ubicacionDetalle: 'Área de Radiofaro Mendoza El Plumerillo',
  },
  {
    id: 'EQ-DME-MDZ',
    identificador: 'DME/VOR MENDOZA',
    aeropuertoCodigo: 'MDZ',
    modeloId: 'MOD-DME-1118',
    frecuenciaVerificacionAereaMeses: 12,
    frecuenciaMantenimientoPreventivoMeses: 3,
    equipoAsociadoId: 'EQ-VOR-MDZ',
    estadoOperativo: 'EN_SERVICIO',
    fechaUltimaVerificacionAerea: '2025-11-04',
    fechaUltimoMantenimientoPreventivo: '2026-06-25',
    ubicacionDetalle: 'Caseta DVOR El Plumerillo',
  },
  {
    id: 'EQ-ILS-MDZ-18',
    identificador: 'ILS 18 MENDOZA',
    aeropuertoCodigo: 'MDZ',
    modeloId: 'MOD-ILS-420',
    frecuenciaVerificacionAereaMeses: 6,
    frecuenciaMantenimientoPreventivoMeses: 3,
    equipoAsociadoId: null,
    estadoOperativo: 'EN_SERVICIO',
    fechaUltimaVerificacionAerea: '2026-04-10', // Límite: 2026-10-10 (Próximo a vencer)
    fechaUltimoMantenimientoPreventivo: '2026-06-28', // Límite: 2026-09-28 (Próximo a vencer)
    ubicacionDetalle: 'Pista 18',
  },
  {
    id: 'EQ-VOR-RES',
    identificador: 'VOR RESISTENCIA',
    aeropuertoCodigo: 'RES',
    modeloId: 'MOD-DVOR-432',
    frecuenciaVerificacionAereaMeses: 12,
    frecuenciaMantenimientoPreventivoMeses: 3,
    equipoAsociadoId: 'EQ-DME-RES',
    estadoOperativo: 'FUERA_DE_SERVICIO',
    fechaUltimaVerificacionAerea: '2025-06-14', // Vencido
    fechaUltimoMantenimientoPreventivo: '2026-03-20', // Vencido
    ubicacionDetalle: 'Sector Operativo Resistencia',
  },
  {
    id: 'EQ-DME-RES',
    identificador: 'DME/VOR RESISTENCIA',
    aeropuertoCodigo: 'RES',
    modeloId: 'MOD-DME-1118',
    frecuenciaVerificacionAereaMeses: 12,
    frecuenciaMantenimientoPreventivoMeses: 3,
    equipoAsociadoId: 'EQ-VOR-RES',
    estadoOperativo: 'FUERA_DE_SERVICIO',
    fechaUltimaVerificacionAerea: '2025-06-14',
    fechaUltimoMantenimientoPreventivo: '2026-03-20',
    ubicacionDetalle: 'Emplazamiento VOR Resistencia',
  },
  {
    id: 'EQ-ILS-BRC-29',
    identificador: 'ILS 29 BARILOCHE',
    aeropuertoCodigo: 'BRC',
    modeloId: 'MOD-ILS-7000B',
    frecuenciaVerificacionAereaMeses: 6,
    frecuenciaMantenimientoPreventivoMeses: 3,
    equipoAsociadoId: null,
    estadoOperativo: 'EN_SERVICIO',
    fechaUltimaVerificacionAerea: '2026-07-22', // Al día
    fechaUltimoMantenimientoPreventivo: '2026-07-22', // Al día
    ubicacionDetalle: 'Cabecera RWY 29 San Carlos de Bariloche',
  },
];

export const INITIAL_NOMINA: Tecnico[] = [
  {
    id: 'TEC-001',
    nombre: 'Carlos Alberto',
    apellido: 'Méndez',
    dni: '23.451.902',
    email: 'cmendez@radioayudas.gov.ar',
    puesto: 'Jefe Departamento',
  },
  {
    id: 'TEC-002',
    nombre: 'Mariana Lucía',
    apellido: 'Gómez',
    dni: '27.892.410',
    email: 'mgomez@radioayudas.gov.ar',
    puesto: 'Jefe Laboratorio',
  },
  {
    id: 'TEC-003',
    nombre: 'Roberto Daniel',
    apellido: 'Fernández',
    dni: '29.102.345',
    email: 'rfernandez@radioayudas.gov.ar',
    puesto: 'Coordinador',
  },
  {
    id: 'TEC-004',
    nombre: 'Esteban Matías',
    apellido: 'Rossi',
    dni: '32.784.119',
    email: 'erossi@radioayudas.gov.ar',
    puesto: 'Coordinador Adjunto',
  },
  {
    id: 'TEC-005',
    nombre: 'Valeria Silvina',
    apellido: 'Castro',
    dni: '34.901.882',
    email: 'vcastro@radioayudas.gov.ar',
    puesto: 'Coordinador Adjunto',
  },
  {
    id: 'TEC-006',
    nombre: 'Lucas Gabriel',
    apellido: 'Benítez',
    dni: '36.442.109',
    email: 'lbenitez@radioayudas.gov.ar',
    puesto: 'Técnico',
  },
  {
    id: 'TEC-007',
    nombre: 'Gonzalo Javier',
    apellido: 'Navarro',
    dni: '38.129.004',
    email: 'gnavarro@radioayudas.gov.ar',
    puesto: 'Técnico',
  },
  {
    id: 'TEC-008',
    nombre: 'Florencia Sofía',
    apellido: 'Romero',
    dni: '39.554.810',
    email: 'fromero@radioayudas.gov.ar',
    puesto: 'Técnico',
  },
];

export const INITIAL_COMISIONES: ComisionServicio[] = [
  {
    id: 'COM-2026-001',
    codigo: 'COM-2026-001',
    fechaSalida: '2026-09-18',
    fechaRegreso: '2026-09-25',
    medioTransporte: 'Terrestre',
    destinosAeropuertos: ['COR', 'MDZ'],
    tecnicosIds: ['TEC-003', 'TEC-006', 'TEC-007'], // Fernández (Coordinador), Benítez, Navarro
    jefeComisionId: 'TEC-003', // Automático: Roberto Daniel Fernández (Coordinador)
    estado: 'En Curso',
    tiposMantenimiento: ['Preventivo'],
    objetivo: 'Mantenimiento Preventivo y Calibración Semestral en radioayudas de Córdoba y Mendoza',
    createdAt: '2026-09-10',
  },
  {
    id: 'COM-2026-002',
    codigo: 'COM-2026-002',
    fechaSalida: '2026-10-05',
    fechaRegreso: '2026-10-12',
    medioTransporte: 'Aéreo',
    destinosAeropuertos: ['RES', 'IGR'],
    tecnicosIds: ['TEC-002', 'TEC-004', 'TEC-008'], // Mariana Gómez (Jefe Lab), Rossi, Romero
    jefeComisionId: 'TEC-002', // Automático: Mariana Gómez (Jefe Laboratorio)
    estado: 'Planificada',
    tiposMantenimiento: ['Correctivo'],
    objetivo: 'Verificación de falla y reemplazo de módulo excitador VOR Resistencia y calibración VOR Iguazú',
    createdAt: '2026-09-15',
  },
  {
    id: 'COM-2026-003',
    codigo: 'COM-2026-003',
    fechaSalida: '2026-08-10',
    fechaRegreso: '2026-08-15',
    fechaSalidaReal: '2026-08-10',
    fechaRegresoReal: '2026-08-14',
    medioTransporte: 'Terrestre',
    destinosAeropuertos: ['EZE'],
    tecnicosIds: ['TEC-001', 'TEC-005'], // Carlos Méndez (Jefe Dpto), Valeria Castro
    jefeComisionId: 'TEC-001', // Automático: Carlos Méndez (Jefe Departamento)
    estado: 'Finalizada',
    // Se planificó como Preventivo pero, según las tareas registradas al cierre
    // (INT-001 Verificación, INT-002 Preventivo), terminó abarcando ambos tipos.
    tiposMantenimiento: ['Verificación', 'Preventivo'],
    objetivo: 'Verificación Aérea Anual e Inspección Preventiva de VOR/DME Ezeiza',
    observacionesCierre: 'Comisión ejecutada en tiempo y forma. Parámetros de radiofrecuencia alineados a normas OACI Anexo 10.',
    createdAt: '2026-08-01',
    finalizadaAt: '2026-08-14',
  },
];

export const INITIAL_INTERVENCIONES: IntervencionMantenimiento[] = [
  {
    id: 'INT-001',
    comisionId: 'COM-2026-003',
    equipoId: 'EQ-VOR-EZE',
    fechaEjecucion: '2026-08-12',
    tipoIntervencion: 'Verificación',
    subtipoVerificacionAerea: 'Sin alarmas',
    detalleTecnico:
      'Coordinación con avión verificador LV-FCE. Calibración de fase 30Hz variable vs 30Hz referencia. Error de azimut residual < 0.8° en 360° de cobertura. Potencia TX1: 100W, TX2: 99.5W.',
    estadoOperativoResultante: 'EN_SERVICIO',
    tareaPendienteProximaVisita: 'Reemplazo preventivo de banco de baterías de respaldo de 24V DC.',
  },
  {
    id: 'INT-002',
    comisionId: 'COM-2026-003',
    equipoId: 'EQ-DME-EZE',
    fechaEjecucion: '2026-08-12',
    tipoIntervencion: 'Preventivo',
    tipoPreventivo: 'Anual',
    detalleTecnico:
      'Alineación de retardo de transpondedor a 50.00 microsegundos (+/- 0.05 us). Medición de eficiencia de respuesta al 85% de interrogación con 1200 pp/s. Limpieza de filtros y verificación de acoplador direccional.',
    estadoOperativoResultante: 'EN_SERVICIO',
    tareaPendienteProximaVisita: '',
  },
];

export const INITIAL_NOVEDADES: NovedadComision[] = [
  {
    id: 'NOV-001',
    comisionId: 'COM-2026-003',
    aeropuertoCodigo: 'EZE',
    observacion:
      'Se observó fisura menor en el sellado del domo superior de la contraantena del DVOR. Se aplicó sellador poliuretánico provisional, programar mantenimiento civil.',
    fechaRegistro: '2026-08-13',
  },
];
