import { PuestoTecnico, Tecnico, NivelSemaforo, EstadoVencimiento } from '../types';

export const JERARQUIA_VALOR: Record<PuestoTecnico, number> = {
  'Jefe Departamento': 1,
  'Jefe Laboratorio': 2,
  'Coordinador': 3,
  'Coordinador Adjunto': 4,
  'Técnico': 5,
};

/**
 * Determina automáticamente el Jefe de Comisión:
 * El técnico de mayor jerarquía institucional entre los seleccionados.
 */
export function determinarJefeComision(
  tecnicosSeleccionadosIds: string[],
  nominaCompleta: Tecnico[]
): Tecnico | undefined {
  if (!tecnicosSeleccionadosIds || tecnicosSeleccionadosIds.length === 0) {
    return undefined;
  }

  const tecnicos = nominaCompleta.filter((t) =>
    tecnicosSeleccionadosIds.includes(t.id)
  );

  if (tecnicos.length === 0) return undefined;

  // Ordenar ascendentemente por el valor numérico (1 es la mayor jerarquía)
  return tecnicos.slice().sort((a, b) => {
    const jerA = JERARQUIA_VALOR[a.puesto] ?? 99;
    const jerB = JERARQUIA_VALOR[b.puesto] ?? 99;
    if (jerA !== jerB) return jerA - jerB;
    // Si tienen igual puesto, desempatar por apellido
    return a.apellido.localeCompare(b.apellido);
  })[0];
}

/**
 * Suma X meses a una fecha en formato YYYY-MM-DD de forma segura
 */
export function sumarMeses(fechaStr: string, meses: number): string {
  if (!fechaStr) return '';
  const [yearStr, monthStr, dayStr] = fechaStr.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10) - 1;
  const day = parseInt(dayStr, 10);

  const date = new Date(year, month, day);
  date.setMonth(date.getMonth() + meses);

  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');

  return `${y}-${m}-${d}`;
}

/**
 * Calcula los días de diferencia entre la fecha objetivo y la fecha base.
 * Valor positivo: faltan días para vencer.
 * Valor negativo: vencido hace X días.
 */
export function calcularDiasRestantes(fechaObjetivoStr: string, fechaBase?: Date): number {
  if (!fechaObjetivoStr) return -9999;
  const base = fechaBase ? new Date(fechaBase) : new Date();
  base.setHours(0, 0, 0, 0);

  const [yearStr, monthStr, dayStr] = fechaObjetivoStr.split('-');
  const objetivo = new Date(
    parseInt(yearStr, 10),
    parseInt(monthStr, 10) - 1,
    parseInt(dayStr, 10)
  );
  objetivo.setHours(0, 0, 0, 0);

  const diffTime = objetivo.getTime() - base.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Calcula el estado de vencimiento según la regla de negocio:
 * 1. Al día (vigente con más de 30 días restantes)
 * 2. Próximo a vencer (a 30 días o menos de la fecha límite)
 * 3. Vencido (fecha límite superada)
 */
export function calcularEstadoVencimiento(
  fechaUltima: string,
  periodicidadMeses: number,
  fechaBase?: Date
): EstadoVencimiento {
  if (!fechaUltima || !periodicidadMeses) {
    return {
      fechaUltima: fechaUltima || 'Sin registro',
      periodicidadMeses: periodicidadMeses || 0,
      fechaLimite: 'No calculada',
      diasRestantes: -999,
      nivel: 'VENCIDO',
      etiqueta: 'Vencido',
    };
  }

  const fechaLimite = sumarMeses(fechaUltima, periodicidadMeses);
  const diasRestantes = calcularDiasRestantes(fechaLimite, fechaBase);

  let nivel: NivelSemaforo = 'AL_DIA';
  let etiqueta = 'Al día';

  if (diasRestantes < 0) {
    nivel = 'VENCIDO';
    etiqueta = `Vencido (${Math.abs(diasRestantes)}d)`;
  } else if (diasRestantes <= 30) {
    nivel = 'PROXIMO_A_VENCER';
    etiqueta = `Próx. a vencer (${diasRestantes}d)`;
  } else {
    nivel = 'AL_DIA';
    etiqueta = `Al día (${diasRestantes}d)`;
  }

  return {
    fechaUltima,
    periodicidadMeses,
    fechaLimite,
    diasRestantes,
    nivel,
    etiqueta,
  };
}

/**
 * Clases de estilo IBM Maximo / Carbon Design para los niveles de semáforo
 */
export function getClasesSemaforo(nivel: NivelSemaforo) {
  switch (nivel) {
    case 'AL_DIA':
      return {
        badge: 'bg-[#defbe6] text-[#0e6027] border border-[#a7f0ba]',
        dot: 'bg-[#198038]',
        text: 'text-[#198038]',
        label: 'Al día',
      };
    case 'PROXIMO_A_VENCER':
      return {
        badge: 'bg-[#fef3d6] text-[#8a6100] border border-[#fddc69]',
        dot: 'bg-[#f1c21b]',
        text: 'text-[#8a6100]',
        label: 'Próximo a vencer',
      };
    case 'VENCIDO':
      return {
        badge: 'bg-[#ffebee] text-[#da1e28] border border-[#ffb3b8]',
        dot: 'bg-[#da1e28]',
        text: 'text-[#da1e28]',
        label: 'Vencido',
      };
  }
}

/**
 * Calcula la discrepancia en días entre la fecha de regreso real y la programada.
 * Si terminó después de lo planeado: valor positivo (ej: +2 días).
 * Si terminó antes de lo planeado: valor negativo (ej: -1 días).
 * Si no hubo discrepancia: 0.
 */
export function calcularDiscrepanciaDias(
  fechaRegresoReal?: string,
  fechaRegresoPlanificada?: string
): number {
  if (!fechaRegresoReal || !fechaRegresoPlanificada) return 0;
  try {
    const [y1, m1, d1] = fechaRegresoReal.split('-').map(Number);
    const [y2, m2, d2] = fechaRegresoPlanificada.split('-').map(Number);
    const dateReal = new Date(y1, m1 - 1, d1);
    const datePlan = new Date(y2, m2 - 1, d2);
    dateReal.setHours(0, 0, 0, 0);
    datePlan.setHours(0, 0, 0, 0);
    const diffTime = dateReal.getTime() - datePlan.getTime();
    return Math.round(diffTime / (1000 * 60 * 60 * 24));
  } catch {
    return 0;
  }
}

/**
 * Toda comisión en estado de 'Planificada' pasa a estar 'En Curso'
 * cuando la fecha actual está dentro del rango de fechas de la comisión (hoy >= fechaSalida && hoy <= fechaRegreso, o si hoy >= fechaSalida).
 * Una vez finalizada NO vuelve a cambiar.
 */
export function evaluarEstadoComisionSegunFecha(
  comision: { estado: string; fechaSalida: string; fechaRegreso: string },
  fechaHoy?: string
): 'Planificada' | 'En Curso' | 'Finalizada' {
  if (comision.estado === 'Finalizada') {
    return 'Finalizada';
  }

  const hoy = fechaHoy || new Date().toISOString().split('T')[0];

  if (comision.estado === 'Planificada') {
    // Si la fecha actual está dentro del rango de fechas de la comisión (o ya inició)
    if (hoy >= comision.fechaSalida) {
      return 'En Curso';
    }
  }

  return comision.estado as 'Planificada' | 'En Curso' | 'Finalizada';
}

/**
 * Formatea fechas a visualización obligatoria DD/MM/AAAA
 */
export function formatearFecha(fechaStr?: string): string {
  if (!fechaStr) return '-';
  try {
    const cleanStr = fechaStr.includes('T') ? fechaStr.split('T')[0] : fechaStr.trim();
    // Si ya está en formato DD/MM/AAAA
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(cleanStr)) {
      return cleanStr;
    }
    const parts = cleanStr.split('-');
    if (parts.length === 3) {
      const [year, month, day] = parts;
      const d = day.slice(0, 2).padStart(2, '0');
      const m = month.padStart(2, '0');
      const y = year.length === 4 ? year : year.padStart(4, '20');
      return `${d}/${m}/${y}`;
    }
    // Intento con objeto Date
    const dObj = new Date(fechaStr);
    if (!isNaN(dObj.getTime())) {
      const d = String(dObj.getDate()).padStart(2, '0');
      const m = String(dObj.getMonth() + 1).padStart(2, '0');
      const y = dObj.getFullYear();
      return `${d}/${m}/${y}`;
    }
    return fechaStr;
  } catch {
    return fechaStr;
  }
}
