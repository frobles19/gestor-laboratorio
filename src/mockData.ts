import {
  Aeropuerto,
  ModeloEquipo,
  EquipoInstalado,
  Tecnico,
  ComisionServicio,
  IntervencionMantenimiento,
} from './types';

﻿export const INITIAL_AEROPUERTOS: Aeropuerto[] = [
  {
    codigoIATA: 'AEP',
    nombreOficial: 'AEROPARQUE',
    region: 'EZEIZA',
  },
  {
    codigoIATA: 'BCA',
    nombreOficial: 'BAHIA BLANCA',
    region: 'EZEIZA',
  },
  {
    codigoIATA: 'BRC',
    nombreOficial: 'BARILOCHE',
    region: 'EZEIZA',
  },
  {
    codigoIATA: 'CHP',
    nombreOficial: 'CHAPELCO',
    region: 'EZEIZA',
  },
  {
    codigoIATA: 'OEL',
    nombreOficial: 'CHOELE CHOEL',
    region: 'EZEIZA',
  },
  {
    codigoIATA: 'GBE',
    nombreOficial: 'GENERAL BELGRANO',
    region: 'EZEIZA',
  },
  {
    codigoIATA: 'GPI',
    nombreOficial: 'GENERAL PICO',
    region: 'EZEIZA',
  },
  {
    codigoIATA: 'GUA',
    nombreOficial: 'GUALEGUAYCHU',
    region: 'EZEIZA',
  },
  {
    codigoIATA: 'NIN',
    nombreOficial: 'JUNIN',
    region: 'EZEIZA',
  },
  {
    codigoIATA: 'PTA',
    nombreOficial: 'LA PLATA',
    region: 'EZEIZA',
  },
  {
    codigoIATA: 'LYE',
    nombreOficial: 'LABOULAYE',
    region: 'EZEIZA',
  },
  {
    codigoIATA: 'PDI',
    nombreOficial: 'PUNTA INDIO',
    region: 'EZEIZA',
  },
  {
    codigoIATA: 'MDP',
    nombreOficial: 'MAR DEL PLATA',
    region: 'EZEIZA',
  },
  {
    codigoIATA: 'NEU',
    nombreOficial: 'NEUQUEN',
    region: 'EZEIZA',
  },
  {
    codigoIATA: 'PAL',
    nombreOficial: 'PALOMAR',
    region: 'EZEIZA',
  },
  {
    codigoIATA: 'PAR',
    nombreOficial: 'PARANA',
    region: 'EZEIZA',
  },
  {
    codigoIATA: 'ROS',
    nombreOficial: 'ROSARIO',
    region: 'EZEIZA',
  },
  {
    codigoIATA: 'SNT',
    nombreOficial: 'SAN ANTONIO DE ARECO',
    region: 'EZEIZA',
  },
  {
    codigoIATA: 'FDO',
    nombreOficial: 'SAN FERNANDO',
    region: 'EZEIZA',
  },
  {
    codigoIATA: 'OSA',
    nombreOficial: 'SANTA ROSA',
    region: 'EZEIZA',
  },
  {
    codigoIATA: 'SVO',
    nombreOficial: 'SAUCE VIEJO',
    region: 'EZEIZA',
  },
  {
    codigoIATA: 'DIL',
    nombreOficial: 'TANDIL',
    region: 'EZEIZA',
  },
  {
    codigoIATA: 'CAT',
    nombreOficial: 'CATAMARCA',
    region: 'CORDOBA',
  },
  {
    codigoIATA: 'ERE',
    nombreOficial: 'CERES',
    region: 'CORDOBA',
  },
  {
    codigoIATA: 'CBA',
    nombreOficial: 'CORDOBA',
    region: 'CORDOBA',
  },
  {
    codigoIATA: 'SRC',
    nombreOficial: 'SANTA ROSA DE CONLARA',
    region: 'CORDOBA',
  },
  {
    codigoIATA: 'JUJ',
    nombreOficial: 'JUJUY',
    region: 'CORDOBA',
  },
  {
    codigoIATA: 'LAR',
    nombreOficial: 'LA RIOJA',
    region: 'CORDOBA',
  },
  {
    codigoIATA: 'MJZ',
    nombreOficial: 'MARCO JUAREZ',
    region: 'CORDOBA',
  },
  {
    codigoIATA: 'RCU',
    nombreOficial: 'RIO CUARTO',
    region: 'CORDOBA',
  },
  {
    codigoIATA: 'SAL',
    nombreOficial: 'SALTA',
    region: 'CORDOBA',
  },
  {
    codigoIATA: 'SDE',
    nombreOficial: 'SANTIAGO DEL ESTERO',
    region: 'CORDOBA',
  },
  {
    codigoIATA: 'TRH',
    nombreOficial: 'TERMAS DE RIO HONDO',
    region: 'CORDOBA',
  },
  {
    codigoIATA: 'TUC',
    nombreOficial: 'TUCUMAN',
    region: 'CORDOBA',
  },
  {
    codigoIATA: 'TRE',
    nombreOficial: 'TRELEW',
    region: 'COMODORO RIVADAVIA',
  },
  {
    codigoIATA: 'USU',
    nombreOficial: 'USHUAIA',
    region: 'COMODORO RIVADAVIA',
  },
  {
    codigoIATA: 'SJU',
    nombreOficial: 'SAN JULIAN',
    region: 'COMODORO RIVADAVIA',
  },
  {
    codigoIATA: 'ECA',
    nombreOficial: 'EL CALAFATE',
    region: 'COMODORO RIVADAVIA',
  },
  {
    codigoIATA: 'VIE',
    nombreOficial: 'VIEDMA',
    region: 'COMODORO RIVADAVIA',
  },
  {
    codigoIATA: 'DYN',
    nombreOficial: 'PUERTO MADRYN',
    region: 'COMODORO RIVADAVIA',
  },
  {
    codigoIATA: 'GAL',
    nombreOficial: 'RIO GALLEGOS',
    region: 'COMODORO RIVADAVIA',
  },
  {
    codigoIATA: 'GRA',
    nombreOficial: 'RIO GRANDE',
    region: 'COMODORO RIVADAVIA',
  },
  {
    codigoIATA: 'ESQ',
    nombreOficial: 'ESQUEL',
    region: 'COMODORO RIVADAVIA',
  },
  {
    codigoIATA: 'RYD',
    nombreOficial: 'VILLA REYNOLDS',
    region: 'MENDOZA',
  },
  {
    codigoIATA: 'DOZ',
    nombreOficial: 'MENDOZA',
    region: 'MENDOZA',
  },
  {
    codigoIATA: 'JUA',
    nombreOficial: 'SAN JUAN',
    region: 'MENDOZA',
  },
  {
    codigoIATA: 'MLG',
    nombreOficial: 'MALARGUE',
    region: 'MENDOZA',
  },
  {
    codigoIATA: 'SRA',
    nombreOficial: 'SAN RAFAEL',
    region: 'MENDOZA',
  },
  {
    codigoIATA: 'UIS',
    nombreOficial: 'SAN LUIS',
    region: 'MENDOZA',
  },
  {
    codigoIATA: 'RTA',
    nombreOficial: 'RECONQUISTA',
    region: 'RESISTENCIA',
  },
  {
    codigoIATA: 'SIS',
    nombreOficial: 'RESISTENCIA',
    region: 'RESISTENCIA',
  },
  {
    codigoIATA: 'FSA',
    nombreOficial: 'FORMOSA',
    region: 'RESISTENCIA',
  },
  {
    codigoIATA: 'IGU',
    nombreOficial: 'IGUAZU',
    region: 'RESISTENCIA',
  },
  {
    codigoIATA: 'POS',
    nombreOficial: 'POSADAS',
    region: 'RESISTENCIA',
  },
];

// Catálogo real de modelos de equipos, releído del backup de repuestos del
// Laboratorio (backup_completo_radioayudas). Denominación = número/nombre de
// modelo, fabricante = marca corta (edición del usuario desde la app), de
// modo que "fabricante + denominación" se lea como un solo texto (ej: "Selex
// 1118A"). Para ILS el modelo NO distingue entre Glide Path y Localizer: esa
// distinción se hace a nivel del equipo instalado, no del modelo (pendiente,
// todavía no cargamos equipos instalados reales).
export const INITIAL_MODELOS: ModeloEquipo[] = [
  // VOR
  {
    id: 'MOD-VOR-SEL4000',
    sistema: 'VOR',
    denominacion: '4000',
    fabricante: 'SEL',
  },
  {
    id: 'MOD-VOR-SELEX1150A',
    sistema: 'VOR',
    denominacion: '1150A',
    fabricante: 'Selex',
  },
  {
    id: 'MOD-VOR-THALES431',
    sistema: 'VOR',
    denominacion: '431',
    fabricante: 'Thales',
  },
  {
    id: 'MOD-VOR-THALES432',
    sistema: 'VOR',
    denominacion: '432',
    fabricante: 'Thales',
  },
  {
    id: 'MOD-VOR-WILCOX585B',
    sistema: 'VOR',
    denominacion: '585B',
    fabricante: 'Wilcox',
  },
  // DME
  {
    id: 'MOD-DME-THALES435',
    sistema: 'DME',
    denominacion: '435',
    fabricante: 'Thales',
  },
  {
    id: 'MOD-DME-SELEX1118A',
    sistema: 'DME',
    denominacion: '1118A',
    fabricante: 'Selex',
  },
  {
    id: 'MOD-DME-PELORUS8900',
    sistema: 'DME',
    denominacion: '8900',
    fabricante: 'Pelorus',
  },
  {
    id: 'MOD-DME-ALCATELFSD45',
    sistema: 'DME',
    denominacion: 'FSD-45',
    fabricante: 'Alcatel',
  },
  {
    id: 'MOD-DME-WILCOX596B',
    sistema: 'DME',
    denominacion: '596B',
    fabricante: 'Wilcox',
  },
  // ILS
  {
    id: 'MOD-ILS-NORMARC3500',
    sistema: 'ILS',
    denominacion: '3500',
    fabricante: 'Normarc',
  },
  {
    id: 'MOD-ILS-NORMARC7000',
    sistema: 'ILS',
    denominacion: '7000',
    fabricante: 'Normarc',
  },
];

// Se vació junto con los aeropuertos ficticios: los equipos instalados reales
// se cargan más adelante, ya asociados a los aeropuertos de la lista real.
export const INITIAL_EQUIPOS: EquipoInstalado[] = [];

export const INITIAL_NOMINA: Tecnico[] = [
  {
    id: 'TEC-001',
    nombre: 'Carlos Alberto',
    apellido: 'Méndez',
    dni: '23.451.902',
    email: 'cmendez@radioayudas.gov.ar',
    puesto: 'Jefe Departamento',
    laboratorio: true,
  },
  {
    id: 'TEC-002',
    nombre: 'Mariana Lucía',
    apellido: 'Gómez',
    dni: '27.892.410',
    email: 'mgomez@radioayudas.gov.ar',
    puesto: 'Jefe Laboratorio',
    laboratorio: true,
  },
  {
    id: 'TEC-003',
    nombre: 'Roberto Daniel',
    apellido: 'Fernández',
    dni: '29.102.345',
    email: 'rfernandez@radioayudas.gov.ar',
    puesto: 'Coordinador',
    laboratorio: true,
  },
  {
    id: 'TEC-004',
    nombre: 'Esteban Matías',
    apellido: 'Rossi',
    dni: '32.784.119',
    email: 'erossi@radioayudas.gov.ar',
    puesto: 'Coordinador Adjunto',
    laboratorio: true,
  },
  {
    id: 'TEC-005',
    nombre: 'Valeria Silvina',
    apellido: 'Castro',
    dni: '34.901.882',
    email: 'vcastro@radioayudas.gov.ar',
    puesto: 'Coordinador Adjunto',
    laboratorio: true,
  },
  {
    id: 'TEC-006',
    nombre: 'Lucas Gabriel',
    apellido: 'Benítez',
    dni: '36.442.109',
    email: 'lbenitez@radioayudas.gov.ar',
    puesto: 'Técnico',
    laboratorio: true,
  },
  {
    id: 'TEC-007',
    nombre: 'Gonzalo Javier',
    apellido: 'Navarro',
    dni: '38.129.004',
    email: 'gnavarro@radioayudas.gov.ar',
    puesto: 'Técnico',
    laboratorio: true,
  },
  {
    id: 'TEC-008',
    nombre: 'Florencia Sofía',
    apellido: 'Romero',
    dni: '39.554.810',
    email: 'fromero@radioayudas.gov.ar',
    puesto: 'Técnico',
    laboratorio: true,
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
