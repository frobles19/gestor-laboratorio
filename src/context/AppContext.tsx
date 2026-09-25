import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import {
  Aeropuerto,
  ModeloEquipo,
  EquipoInstalado,
  Tecnico,
  ComisionServicio,
  IntervencionMantenimiento,
  EstadoComision,
  TipoIntervencion,
  RegistroAuditoria,
  AccionAuditoria,
} from '../types';
import {
  INITIAL_AEROPUERTOS,
  INITIAL_MODELOS,
  INITIAL_EQUIPOS,
  INITIAL_NOMINA,
  INITIAL_COMISIONES,
  INITIAL_INTERVENCIONES,
} from '../mockData';
import {
  determinarJefeComision,
  evaluarEstadoComisionSegunFecha,
  getHoyLocalStr,
  generarId,
} from '../utils/maintenance';

interface AppContextType {
  aeropuertos: Aeropuerto[];
  modelos: ModeloEquipo[];
  equipos: EquipoInstalado[];
  nomina: Tecnico[];
  comisiones: ComisionServicio[]; // solo las visibles (excluye las eliminadas)
  comisionesEliminadas: ComisionServicio[]; // baja lógica: se conservan para el historial
  intervenciones: IntervencionMantenimiento[];
  auditoria: RegistroAuditoria[];

  // Acciones de Comisiones
  crearComision: (
    datos: {
      fechaSalida: string;
      fechaRegreso: string;
      medioTransporte: any;
      destinosAeropuertos: string[];
      tecnicosIds: string[];
      tiposMantenimiento: TipoIntervencion[];
      objetivo?: string;
    }
  ) => ComisionServicio;
  actualizarComision: (comision: ComisionServicio) => void;
  cancelarComision: (comisionId: string, motivo?: string) => void;
  eliminarComision: (comisionId: string) => void;
  cerrarComisionConFlujo: (datosCierre: {
    comisionId: string;
    fechaSalidaReal: string;
    fechaRegresoReal: string;
    destinosVisitados?: string[];
    observacionesCierre: string;
    intervencionesNuevas: Omit<IntervencionMantenimiento, 'id' | 'comisionId'>[];
  }) => void;

  // Acciones de Equipos e Inventario
  guardarEquipo: (equipo: EquipoInstalado) => void;
  eliminarEquipo: (equipoId: string) => void;

  // Acciones de Nómina
  guardarTecnico: (tecnico: Tecnico) => void;
  darDeBajaTecnico: (id: string) => void;

  // Acciones de Aeropuertos
  crearAeropuerto: (datos: Pick<Aeropuerto, 'codigoIATA' | 'nombreOficial' | 'region'>) => void;
  actualizarAeropuerto: (
    codigoIATA: string,
    datos: Pick<Aeropuerto, 'nombreOficial' | 'region'>
  ) => void;
  eliminarAeropuerto: (codigoIATA: string) => void;

  // Utilidades
  restaurarDatosIniciales: () => void;
  getEquipoPorId: (id: string) => EquipoInstalado | undefined;
  getModeloPorId: (id: string) => ModeloEquipo | undefined;
  getAeropuertoPorCodigo: (codigo: string) => Aeropuerto | undefined;
  getTecnicoPorId: (id: string) => Tecnico | undefined;
}

const STORAGE_KEYS = {
  AEROPUERTOS: 'maximo_radioayudas_aeropuertos_v1',
  MODELOS: 'maximo_radioayudas_modelos_v1',
  EQUIPOS: 'maximo_radioayudas_equipos_v1',
  NOMINA: 'maximo_radioayudas_nomina_v1',
  COMISIONES: 'maximo_radioayudas_comisiones_v1',
  INTERVENCIONES: 'maximo_radioayudas_intervenciones_v1',
  AUDITORIA: 'maximo_radioayudas_auditoria_v1',
};

// Usuario fijo de la sesión actual: el sistema todavía no tiene autenticación
// multiusuario, por lo que toda acción auditada se atribuye a este usuario.
const USUARIO_ACTUAL = 'Ing. Fran';

const TIPOS_INTERVENCION_VALIDOS: TipoIntervencion[] = [
  'Verificación',
  'Preventivo',
  'Correctivo',
  'Otros',
];

/**
 * Migra comisiones guardadas en localStorage con el esquema anterior
 * (tipoMantenimiento: string + tipoMantenimientoPrevisto) al campo único
 * y estructurado tiposMantenimiento: TipoIntervencion[], para que datos
 * persistidos por una versión previa de la app no rompan la UI.
 */
function migrarComisionLegacy(raw: any): ComisionServicio {
  if (Array.isArray(raw.tiposMantenimiento) && raw.tiposMantenimiento.length > 0) {
    return raw as ComisionServicio;
  }
  const { tipoMantenimiento, tipoMantenimientoPrevisto, ...resto } = raw;
  const fuente: string = tipoMantenimiento || tipoMantenimientoPrevisto || '';
  const tipos = fuente
    .split(',')
    .map((s: string) => s.trim())
    .filter((s: string): s is TipoIntervencion =>
      TIPOS_INTERVENCION_VALIDOS.includes(s as TipoIntervencion)
    );
  return {
    ...resto,
    tiposMantenimiento: tipos.length > 0 ? tipos : ['Otros'],
  } as ComisionServicio;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Todos los aeropuertos, incluidos los dados de baja (baja lógica).
  const [aeropuertosTodos, setAeropuertos] = useState<Aeropuerto[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.AEROPUERTOS);
    return saved ? JSON.parse(saved) : INITIAL_AEROPUERTOS;
  });
  const aeropuertos = useMemo(
    () => aeropuertosTodos.filter((a) => !a.eliminadoAt),
    [aeropuertosTodos]
  );

  const [modelos, setModelos] = useState<ModeloEquipo[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.MODELOS);
    return saved ? JSON.parse(saved) : INITIAL_MODELOS;
  });

  const [equipos, setEquipos] = useState<EquipoInstalado[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.EQUIPOS);
    return saved ? JSON.parse(saved) : INITIAL_EQUIPOS;
  });

  const [nomina, setNomina] = useState<Tecnico[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.NOMINA);
    const datos: Tecnico[] = saved ? JSON.parse(saved) : INITIAL_NOMINA;
    // Registros anteriores al campo "laboratorio": se asumen del Laboratorio.
    return datos.map((t) => ({ ...t, laboratorio: t.laboratorio !== false }));
  });

  // Todas las comisiones, incluidas las eliminadas (baja lógica).
  const [comisionesTodas, setComisiones] = useState<ComisionServicio[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.COMISIONES);
    const datos = saved ? JSON.parse(saved) : INITIAL_COMISIONES;
    return datos.map(migrarComisionLegacy);
  });

  // Una comisión eliminada no aparece en ninguna pantalla operativa, pero su
  // registro se conserva (y su código queda reservado) para el historial.
  const comisiones = useMemo(
    () => comisionesTodas.filter((c) => !c.eliminadaAt),
    [comisionesTodas]
  );
  const comisionesEliminadas = useMemo(
    () => comisionesTodas.filter((c) => !!c.eliminadaAt),
    [comisionesTodas]
  );

  const [intervenciones, setIntervenciones] = useState<IntervencionMantenimiento[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.INTERVENCIONES);
    return saved ? JSON.parse(saved) : INITIAL_INTERVENCIONES;
  });

  const [auditoria, setAuditoria] = useState<RegistroAuditoria[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.AUDITORIA);
    return saved ? JSON.parse(saved) : [];
  });

  // Guardar en localStorage ante cambios
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.AEROPUERTOS, JSON.stringify(aeropuertosTodos));
  }, [aeropuertosTodos]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.MODELOS, JSON.stringify(modelos));
  }, [modelos]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.EQUIPOS, JSON.stringify(equipos));
  }, [equipos]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.NOMINA, JSON.stringify(nomina));
  }, [nomina]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.COMISIONES, JSON.stringify(comisionesTodas));
  }, [comisionesTodas]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.INTERVENCIONES, JSON.stringify(intervenciones));
  }, [intervenciones]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.AUDITORIA, JSON.stringify(auditoria));
  }, [auditoria]);

  // Registra un evento de auditoría genérico (por ahora solo se invoca desde
  // el módulo de Comisiones, pero el mecanismo es reutilizable por cualquier
  // otro módulo que necesite trazabilidad de sus acciones).
  const registrarAuditoria = (
    accion: AccionAuditoria,
    entidadId: string,
    entidadEtiqueta: string,
    estadoAnterior: Record<string, unknown> | null,
    estadoNuevo: Record<string, unknown> | null
  ) => {
    const registro: RegistroAuditoria = {
      id: generarId('AUD'),
      modulo: 'COMISIONES',
      entidadId,
      entidadEtiqueta,
      accion,
      fecha: new Date().toISOString(),
      usuario: USUARIO_ACTUAL,
      estadoAnterior,
      estadoNuevo,
    };
    setAuditoria((prev) => [registro, ...prev]);
  };

  // Regla de Negocio:
  // Toda comisión en estado de 'Planificada' pasa a estar 'En Curso' cuando la fecha está dentro del rango de fechas de la comisión.
  // Una vez finalizada no vuelve a cambiar.
  useEffect(() => {
    const hoyStr = getHoyLocalStr();
    setComisiones((prev) => {
      let cambio = false;
      const actualizadas = prev.map((com) => {
        if (com.estado === 'Planificada' && !com.eliminadaAt) {
          const evaluado = evaluarEstadoComisionSegunFecha(com, hoyStr);
          if (evaluado !== com.estado) {
            cambio = true;
            return { ...com, estado: evaluado };
          }
        }
        return com;
      });
      return cambio ? actualizadas : prev;
    });
  }, []);

  const getEquipoPorId = (id: string) => equipos.find((e) => e.id === id);
  const getModeloPorId = (id: string) => modelos.find((m) => m.id === id);
  const getAeropuertoPorCodigo = (codigo: string) =>
    aeropuertos.find((a) => a.codigoIATA.toUpperCase() === codigo.toUpperCase());
  const getTecnicoPorId = (id: string) => nomina.find((t) => t.id === id);

  const crearComision = (
    datos: {
      fechaSalida: string;
      fechaRegreso: string;
      medioTransporte: any;
      destinosAeropuertos: string[];
      tecnicosIds: string[];
      tiposMantenimiento: TipoIntervencion[];
      objetivo?: string;
    }
  ): ComisionServicio => {
    // Validación de datos de entrada: se repiten aquí las mismas reglas que exige
    // el formulario, para que la integridad no dependa exclusivamente de la UI.
    if (!datos.fechaSalida || !datos.fechaRegreso) {
      throw new Error('Debe especificar las fechas de salida y regreso.');
    }
    if (datos.fechaSalida > datos.fechaRegreso) {
      throw new Error('La fecha de salida no puede ser posterior a la fecha de regreso.');
    }
    if (!datos.destinosAeropuertos || datos.destinosAeropuertos.length === 0) {
      throw new Error('Debe seleccionar al menos un aeropuerto de destino.');
    }
    if (!datos.tecnicosIds || datos.tecnicosIds.length === 0) {
      throw new Error('Debe asignar al menos un técnico a la comisión.');
    }
    if (!datos.tiposMantenimiento || datos.tiposMantenimiento.length === 0) {
      throw new Error('Debe seleccionar al menos un tipo de mantenimiento previsto.');
    }

    // Validación de integridad referencial: los códigos y técnicos deben existir realmente.
    const codigosInvalidos = datos.destinosAeropuertos.filter(
      (cod) => !aeropuertos.some((a) => a.codigoIATA.toUpperCase() === cod.toUpperCase())
    );
    if (codigosInvalidos.length > 0) {
      throw new Error(`Aeropuerto(s) inexistente(s): ${codigosInvalidos.join(', ')}.`);
    }
    const tecnicosInvalidos = datos.tecnicosIds.filter(
      (tid) => !nomina.some((t) => t.id === tid)
    );
    if (tecnicosInvalidos.length > 0) {
      throw new Error(`Técnico(s) inexistente(s): ${tecnicosInvalidos.join(', ')}.`);
    }

    const hoyStr = getHoyLocalStr();
    const anio = new Date().getFullYear();

    // Generación de código único: se busca el próximo secuencial libre en vez de
    // confiar en la cantidad de comisiones. Se consideran también las eliminadas
    // (baja lógica) para no reutilizar nunca un código ya emitido.
    const codigosExistentes = new Set(comisionesTodas.map((c) => c.codigo));
    let numeroSecuencial = comisionesTodas.length + 1;
    let codigo = `COM-${anio}-${String(numeroSecuencial).padStart(3, '0')}`;
    while (codigosExistentes.has(codigo)) {
      numeroSecuencial += 1;
      codigo = `COM-${anio}-${String(numeroSecuencial).padStart(3, '0')}`;
    }

    const id = generarId('COM');

    // Determinación automática del Jefe de Comisión según la jerarquía institucional
    const jefe = determinarJefeComision(datos.tecnicosIds, nomina);
    const jefeComisionId = jefe ? jefe.id : datos.tecnicosIds[0];

    // Estado inicial siempre es Planificada.
    // Si la fecha de salida ya cae hoy o dentro del rango, la función de evaluación la activa a 'En Curso'.
    let estadoInicial: EstadoComision = 'Planificada';
    if (hoyStr >= datos.fechaSalida && hoyStr <= datos.fechaRegreso) {
      estadoInicial = 'En Curso';
    }

    const nuevaComision: ComisionServicio = {
      fechaSalida: datos.fechaSalida,
      fechaRegreso: datos.fechaRegreso,
      medioTransporte: datos.medioTransporte,
      destinosAeropuertos: datos.destinosAeropuertos,
      tecnicosIds: datos.tecnicosIds,
      id,
      codigo,
      jefeComisionId,
      estado: estadoInicial,
      tiposMantenimiento: datos.tiposMantenimiento,
      objetivo: datos.objetivo || '',
      createdAt: hoyStr,
    };

    setComisiones((prev) => [nuevaComision, ...prev]);
    registrarAuditoria('CREAR', id, codigo, null, nuevaComision as unknown as Record<string, unknown>);
    return nuevaComision;
  };

  const actualizarComision = (comisionActualizada: ComisionServicio) => {
    const comisionAnterior = comisiones.find((c) => c.id === comisionActualizada.id) || null;

    // Si cambiaron técnicos, recalcular automáticamente el Jefe de Comisión
    const jefe = determinarJefeComision(comisionActualizada.tecnicosIds, nomina);
    const jefeFinalId = jefe ? jefe.id : comisionActualizada.jefeComisionId;

    const objetoFinal: ComisionServicio = {
      ...comisionActualizada,
      jefeComisionId: jefeFinalId,
    };

    setComisiones((prev) =>
      prev.map((c) => (c.id === objetoFinal.id ? objetoFinal : c))
    );
    registrarAuditoria(
      'EDITAR',
      objetoFinal.id,
      objetoFinal.codigo,
      comisionAnterior as unknown as Record<string, unknown> | null,
      objetoFinal as unknown as Record<string, unknown>
    );
  };

  const cancelarComision = (comisionId: string, motivo?: string) => {
    const comision = comisiones.find((c) => c.id === comisionId);
    if (!comision) {
      throw new Error('La comisión indicada no existe.');
    }
    if (comision.estado === 'Finalizada') {
      throw new Error('No se puede cancelar una comisión ya finalizada.');
    }
    if (comision.estado === 'Cancelada') {
      throw new Error('Esta comisión ya fue cancelada.');
    }
    const comisionCancelada: ComisionServicio = {
      ...comision,
      estado: 'Cancelada' as EstadoComision,
      canceladaAt: getHoyLocalStr(),
      motivoCancelacion: motivo?.trim() || undefined,
    };

    setComisiones((prev) =>
      prev.map((c) => (c.id === comisionId ? comisionCancelada : c))
    );
    registrarAuditoria(
      'CANCELAR',
      comision.id,
      comision.codigo,
      comision as unknown as Record<string, unknown>,
      comisionCancelada as unknown as Record<string, unknown>
    );
  };

  const eliminarComision = (comisionId: string) => {
    const comision = comisiones.find((c) => c.id === comisionId);
    if (!comision) {
      throw new Error('La comisión indicada no existe.');
    }
    if (comision.estado === 'Finalizada') {
      throw new Error(
        'No se puede eliminar una comisión finalizada: es un registro histórico de trabajo realizado. Si nunca se realizó, cancélela en vez de eliminarla.'
      );
    }
    // Baja lógica: la comisión deja de listarse pero el registro se conserva.
    setComisiones((prev) =>
      prev.map((c) => (c.id === comisionId ? { ...c, eliminadaAt: new Date().toISOString() } : c))
    );
    registrarAuditoria(
      'ELIMINAR',
      comision.id,
      comision.codigo,
      comision as unknown as Record<string, unknown>,
      null
    );
  };

  const cerrarComisionConFlujo = (datosCierre: {
    comisionId: string;
    fechaSalidaReal: string;
    fechaRegresoReal: string;
    destinosVisitados?: string[];
    observacionesCierre: string;
    intervencionesNuevas: Omit<IntervencionMantenimiento, 'id' | 'comisionId'>[];
  }) => {
    // Guardia de idempotencia: no se puede cerrar una comisión inexistente
    // o que ya fue Finalizada (evita duplicar intervenciones y
    // sobrescribir los datos de cierre si el flujo se dispara dos veces).
    const comisionActual = comisiones.find((c) => c.id === datosCierre.comisionId);
    if (!comisionActual) {
      throw new Error('La comisión indicada no existe.');
    }
    if (comisionActual.estado === 'Finalizada') {
      throw new Error('Esta comisión ya fue finalizada anteriormente.');
    }

    // Validación de datos de cierre, repitiendo las reglas del wizard a nivel de dominio.
    if (!datosCierre.fechaSalidaReal || !datosCierre.fechaRegresoReal) {
      throw new Error('Debe especificar las fechas reales de salida y regreso.');
    }
    if (datosCierre.fechaSalidaReal > datosCierre.fechaRegresoReal) {
      throw new Error('La fecha real de salida no puede ser posterior a la de regreso.');
    }
    const destinosVisitados = datosCierre.destinosVisitados || comisionActual.destinosAeropuertos;
    if (destinosVisitados.length === 0) {
      throw new Error('Debe registrar al menos un aeropuerto visitado en la comisión.');
    }
    const codigosInvalidos = destinosVisitados.filter(
      (cod) => !aeropuertos.some((a) => a.codigoIATA.toUpperCase() === cod.toUpperCase())
    );
    if (codigosInvalidos.length > 0) {
      throw new Error(`Aeropuerto(s) inexistente(s): ${codigosInvalidos.join(', ')}.`);
    }
    const equiposInvalidos = datosCierre.intervencionesNuevas.filter(
      (item) => !equipos.some((e) => e.id === item.equipoId)
    );
    if (equiposInvalidos.length > 0) {
      throw new Error('Se registró una intervención sobre un equipo inexistente.');
    }

    const hoyStr = getHoyLocalStr();

    // 1. Crear las intervenciones con IDs únicos
    const nuevasIntervenciones: IntervencionMantenimiento[] = datosCierre.intervencionesNuevas.map(
      (item) => ({
        ...item,
        id: generarId('INT'),
        comisionId: datosCierre.comisionId,
      })
    );

    // 3. Actualizar equipos según las tareas realizadas
    // Cada intervención registrada actualiza las fechas de último mantenimiento del equipo intervenido
    setEquipos((prevEquipos) => {
      let actualizados = [...prevEquipos];
      const equiposConIntervencionExplicita = new Set(
        nuevasIntervenciones.map((i) => i.equipoId)
      );

      nuevasIntervenciones.forEach((interv) => {
        actualizados = actualizados.map((eq) => {
          if (eq.id === interv.equipoId) {
            const cambios: Partial<EquipoInstalado> = {
              estadoOperativo: interv.estadoOperativoResultante,
            };

            if (interv.tipoIntervencion === 'Verificación') {
              cambios.fechaUltimaVerificacionAerea = interv.fechaEjecucion;
            } else if (interv.tipoIntervencion === 'Preventivo') {
              cambios.fechaUltimoMantenimientoPreventivo = interv.fechaEjecucion;
            }

            return { ...eq, ...cambios };
          }
          return eq;
        });
      });

      // Sincronizar equipos funcionalmente asociados (ej. DME y VOR de la misma
      // cabecera, vinculados por equipoAsociadoId): en la práctica se verifican y
      // mantienen juntos en la misma visita, así que si uno recibe una Verificación
      // o Mantenimiento Preventivo y su pareja NO tiene su propia intervención
      // registrada en este cierre, se le replica la misma fecha (no el estado
      // operativo, que sí es específico de cada equipo).
      nuevasIntervenciones.forEach((interv) => {
        if (interv.tipoIntervencion !== 'Verificación' && interv.tipoIntervencion !== 'Preventivo') {
          return;
        }
        const equipoIntervenido = actualizados.find((eq) => eq.id === interv.equipoId);
        if (!equipoIntervenido) return;

        const asociados = actualizados.filter(
          (eq) =>
            (eq.id === equipoIntervenido.equipoAsociadoId ||
              eq.equipoAsociadoId === equipoIntervenido.id) &&
            !equiposConIntervencionExplicita.has(eq.id)
        );
        if (asociados.length === 0) return;

        const idsAsociados = new Set(asociados.map((eq) => eq.id));
        actualizados = actualizados.map((eq) => {
          if (!idsAsociados.has(eq.id)) return eq;
          return interv.tipoIntervencion === 'Verificación'
            ? { ...eq, fechaUltimaVerificacionAerea: interv.fechaEjecucion }
            : { ...eq, fechaUltimoMantenimientoPreventivo: interv.fechaEjecucion };
        });
      });

      return actualizados;
    });

    // 4. Agregar intervenciones al estado
    if (nuevasIntervenciones.length > 0) {
      setIntervenciones((prev) => [...prev, ...nuevasIntervenciones]);
    }

    // 5. Marcar comisión como Finalizada, guardar fechas reales, destinos visitados y reemplazar el/los tipo(s) de mantenimiento previstos por todos los realmente realizados
    // Extraer todos los tipos de mantenimiento únicos realizados en las tareas de la comisión.
    // Una comisión puede terminar abarcando más de un tipo (ej. Verificación + Preventivo).
    const tiposRealizados = Array.from(
      new Set(datosCierre.intervencionesNuevas.map((t) => t.tipoIntervencion))
    );

    const comisionFinalizada: ComisionServicio = {
      ...comisionActual,
      estado: 'Finalizada' as EstadoComision,
      tiposMantenimiento: tiposRealizados.length > 0 ? tiposRealizados : comisionActual.tiposMantenimiento,
      fechaSalidaReal: datosCierre.fechaSalidaReal,
      fechaRegresoReal: datosCierre.fechaRegresoReal,
      destinosAeropuertos: destinosVisitados,
      observacionesCierre: datosCierre.observacionesCierre,
      finalizadaAt: hoyStr,
    };

    setComisiones((prev) =>
      prev.map((com) => (com.id === datosCierre.comisionId ? comisionFinalizada : com))
    );
    registrarAuditoria(
      'CERRAR',
      comisionActual.id,
      comisionActual.codigo,
      comisionActual as unknown as Record<string, unknown>,
      comisionFinalizada as unknown as Record<string, unknown>
    );
  };

  const guardarEquipo = (equipo: EquipoInstalado) => {
    setEquipos((prev) => {
      const existe = prev.some((e) => e.id === equipo.id);
      if (existe) {
        return prev.map((e) => (e.id === equipo.id ? equipo : e));
      }
      return [...prev, equipo];
    });
  };

  const eliminarEquipo = (equipoId: string) => {
    setEquipos((prev) => prev.filter((e) => e.id !== equipoId));
  };

  const guardarTecnico = (tecnico: Tecnico) => {
    setNomina((prev) => {
      const existe = prev.some((t) => t.id === tecnico.id);
      if (existe) {
        return prev.map((t) => (t.id === tecnico.id ? tecnico : t));
      }
      return [...prev, tecnico];
    });
  };

  // Baja lógica: el técnico deja de listarse y de poder designarse, pero las
  // comisiones anteriores siguen mostrando su nombre.
  const darDeBajaTecnico = (id: string) => {
    if (!nomina.some((t) => t.id === id && !t.bajaAt)) {
      throw new Error('El técnico indicado no existe.');
    }
    const activas = comisiones.filter(
      (c) => (c.estado === 'Planificada' || c.estado === 'En Curso') && c.tecnicosIds.includes(id)
    ).length;
    if (activas > 0) {
      throw new Error(`No se puede dar de baja: está designado en ${activas} comisión(es) sin finalizar.`);
    }
    setNomina((prev) =>
      prev.map((t) => (t.id === id ? { ...t, bajaAt: new Date().toISOString() } : t))
    );
  };

  const crearAeropuerto = (datos: Pick<Aeropuerto, 'codigoIATA' | 'nombreOficial' | 'region'>) => {
    const codigo = datos.codigoIATA.trim().toUpperCase();
    const nombre = datos.nombreOficial.trim();
    if (!/^[A-Z]{3}$/.test(codigo)) {
      throw new Error('El código IATA debe tener exactamente 3 letras.');
    }
    if (!nombre) {
      throw new Error('El nombre oficial es obligatorio.');
    }
    // Se compara contra todos (incluidos los dados de baja) para no reutilizar un código.
    if (aeropuertosTodos.some((a) => a.codigoIATA.toUpperCase() === codigo)) {
      throw new Error(`El código ${codigo} ya está registrado.`);
    }
    setAeropuertos((prev) => [
      ...prev,
      { codigoIATA: codigo, nombreOficial: nombre, region: datos.region },
    ]);
  };

  // El código IATA no se puede modificar: es la clave con la que lo referencian
  // equipos y comisiones.
  const actualizarAeropuerto = (
    codigoIATA: string,
    datos: Pick<Aeropuerto, 'nombreOficial' | 'region'>
  ) => {
    if (!aeropuertos.some((a) => a.codigoIATA === codigoIATA)) {
      throw new Error('El aeropuerto indicado no existe.');
    }
    const nombre = datos.nombreOficial.trim();
    if (!nombre) {
      throw new Error('El nombre oficial es obligatorio.');
    }
    setAeropuertos((prev) =>
      prev.map((a) =>
        a.codigoIATA === codigoIATA ? { ...a, nombreOficial: nombre, region: datos.region } : a
      )
    );
  };

  // Baja lógica. Se bloquea si el aeropuerto todavía tiene equipos o comisiones
  // asociadas, para no dejar referencias a un aeropuerto que ya no se lista.
  const eliminarAeropuerto = (codigoIATA: string) => {
    if (!aeropuertos.some((a) => a.codigoIATA === codigoIATA)) {
      throw new Error('El aeropuerto indicado no existe.');
    }
    const cantEquipos = equipos.filter((e) => e.aeropuertoCodigo === codigoIATA).length;
    if (cantEquipos > 0) {
      throw new Error(
        `No se puede eliminar ${codigoIATA}: tiene ${cantEquipos} radioayuda(s) instalada(s).`
      );
    }
    const cantComisiones = comisiones.filter((c) =>
      c.destinosAeropuertos.includes(codigoIATA)
    ).length;
    if (cantComisiones > 0) {
      throw new Error(
        `No se puede eliminar ${codigoIATA}: figura en ${cantComisiones} comisión(es).`
      );
    }
    setAeropuertos((prev) =>
      prev.map((a) =>
        a.codigoIATA === codigoIATA ? { ...a, eliminadoAt: new Date().toISOString() } : a
      )
    );
  };

  const restaurarDatosIniciales = () => {
    if (
      window.confirm(
        '¿Desea restablecer todos los datos iniciales de prueba? Se reiniciarán aeropuertos, equipos, nómina y comisiones a sus valores predeterminados.'
      )
    ) {
      localStorage.removeItem(STORAGE_KEYS.AEROPUERTOS);
      localStorage.removeItem(STORAGE_KEYS.MODELOS);
      localStorage.removeItem(STORAGE_KEYS.EQUIPOS);
      localStorage.removeItem(STORAGE_KEYS.NOMINA);
      localStorage.removeItem(STORAGE_KEYS.COMISIONES);
      localStorage.removeItem(STORAGE_KEYS.INTERVENCIONES);
      localStorage.removeItem(STORAGE_KEYS.AUDITORIA);

      setAeropuertos(INITIAL_AEROPUERTOS);
      setModelos(INITIAL_MODELOS);
      setEquipos(INITIAL_EQUIPOS);
      setNomina(INITIAL_NOMINA);
      setComisiones(INITIAL_COMISIONES);
      setIntervenciones(INITIAL_INTERVENCIONES);
      setAuditoria([]);
    }
  };

  return (
    <AppContext.Provider
      value={{
        aeropuertos,
        modelos,
        equipos,
        nomina,
        comisiones,
        comisionesEliminadas,
        intervenciones,
        auditoria,
        crearComision,
        actualizarComision,
        cancelarComision,
        eliminarComision,
        cerrarComisionConFlujo,
        guardarEquipo,
        eliminarEquipo,
        guardarTecnico,
        darDeBajaTecnico,
        crearAeropuerto,
        actualizarAeropuerto,
        eliminarAeropuerto,
        restaurarDatosIniciales,
        getEquipoPorId,
        getModeloPorId,
        getAeropuertoPorCodigo,
        getTecnicoPorId,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp debe ser utilizado dentro de un AppProvider');
  }
  return context;
};
