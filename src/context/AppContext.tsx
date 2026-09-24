import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  Aeropuerto,
  ModeloEquipo,
  EquipoInstalado,
  Tecnico,
  ComisionServicio,
  IntervencionMantenimiento,
  NovedadComision,
  EstadoComision,
  TipoIntervencion,
} from '../types';
import {
  INITIAL_AEROPUERTOS,
  INITIAL_MODELOS,
  INITIAL_EQUIPOS,
  INITIAL_NOMINA,
  INITIAL_COMISIONES,
  INITIAL_INTERVENCIONES,
  INITIAL_NOVEDADES,
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
  comisiones: ComisionServicio[];
  intervenciones: IntervencionMantenimiento[];
  novedades: NovedadComision[];

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
    novedadesNuevas: Omit<NovedadComision, 'id' | 'comisionId'>[];
  }) => void;

  // Acciones de Equipos e Inventario
  guardarEquipo: (equipo: EquipoInstalado) => void;
  eliminarEquipo: (equipoId: string) => void;

  // Acciones de Nómina
  guardarTecnico: (tecnico: Tecnico) => void;

  // Acciones de Aeropuertos
  guardarAeropuerto: (aeropuerto: Aeropuerto) => void;

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
  NOVEDADES: 'maximo_radioayudas_novedades_v1',
};

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
  const [aeropuertos, setAeropuertos] = useState<Aeropuerto[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.AEROPUERTOS);
    return saved ? JSON.parse(saved) : INITIAL_AEROPUERTOS;
  });

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
    return saved ? JSON.parse(saved) : INITIAL_NOMINA;
  });

  const [comisiones, setComisiones] = useState<ComisionServicio[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.COMISIONES);
    const datos = saved ? JSON.parse(saved) : INITIAL_COMISIONES;
    return datos.map(migrarComisionLegacy);
  });

  const [intervenciones, setIntervenciones] = useState<IntervencionMantenimiento[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.INTERVENCIONES);
    return saved ? JSON.parse(saved) : INITIAL_INTERVENCIONES;
  });

  const [novedades, setNovedades] = useState<NovedadComision[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.NOVEDADES);
    return saved ? JSON.parse(saved) : INITIAL_NOVEDADES;
  });

  // Guardar en localStorage ante cambios
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.AEROPUERTOS, JSON.stringify(aeropuertos));
  }, [aeropuertos]);

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
    localStorage.setItem(STORAGE_KEYS.COMISIONES, JSON.stringify(comisiones));
  }, [comisiones]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.INTERVENCIONES, JSON.stringify(intervenciones));
  }, [intervenciones]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.NOVEDADES, JSON.stringify(novedades));
  }, [novedades]);

  // Regla de Negocio:
  // Toda comisión en estado de 'Planificada' pasa a estar 'En Curso' cuando la fecha está dentro del rango de fechas de la comisión.
  // Una vez finalizada no vuelve a cambiar.
  useEffect(() => {
    const hoyStr = getHoyLocalStr();
    setComisiones((prev) => {
      let cambio = false;
      const actualizadas = prev.map((com) => {
        if (com.estado === 'Planificada') {
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
    // confiar en comisiones.length, que puede colisionar si se llegaran a borrar
    // comisiones o si dos creaciones ocurren con un state todavía no actualizado.
    const codigosExistentes = new Set(comisiones.map((c) => c.codigo));
    let numeroSecuencial = comisiones.length + 1;
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
    return nuevaComision;
  };

  const actualizarComision = (comisionActualizada: ComisionServicio) => {
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
    setComisiones((prev) =>
      prev.map((c) =>
        c.id === comisionId
          ? {
              ...c,
              estado: 'Cancelada' as EstadoComision,
              canceladaAt: getHoyLocalStr(),
              motivoCancelacion: motivo?.trim() || undefined,
            }
          : c
      )
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
    setComisiones((prev) => prev.filter((c) => c.id !== comisionId));
    // Limpieza defensiva: una comisión no Finalizada no debería tener intervenciones/novedades
    // asociadas (esas solo se generan en cerrarComisionConFlujo), pero se filtran igual por las dudas.
    setIntervenciones((prev) => prev.filter((i) => i.comisionId !== comisionId));
    setNovedades((prev) => prev.filter((n) => n.comisionId !== comisionId));
  };

  const cerrarComisionConFlujo = (datosCierre: {
    comisionId: string;
    fechaSalidaReal: string;
    fechaRegresoReal: string;
    destinosVisitados?: string[];
    observacionesCierre: string;
    intervencionesNuevas: Omit<IntervencionMantenimiento, 'id' | 'comisionId'>[];
    novedadesNuevas: Omit<NovedadComision, 'id' | 'comisionId'>[];
  }) => {
    // Guardia de idempotencia: no se puede cerrar una comisión inexistente
    // o que ya fue Finalizada (evita duplicar intervenciones/novedades y
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

    // 2. Crear las novedades con IDs únicos
    const nuevasNovedades: NovedadComision[] = datosCierre.novedadesNuevas.map(
      (nov) => ({
        ...nov,
        id: generarId('NOV'),
        comisionId: datosCierre.comisionId,
        fechaRegistro: nov.fechaRegistro || hoyStr,
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

    // 4. Agregar intervenciones y novedades al estado
    if (nuevasIntervenciones.length > 0) {
      setIntervenciones((prev) => [...prev, ...nuevasIntervenciones]);
    }
    if (nuevasNovedades.length > 0) {
      setNovedades((prev) => [...prev, ...nuevasNovedades]);
    }

    // 5. Marcar comisión como Finalizada, guardar fechas reales, destinos visitados y reemplazar el/los tipo(s) de mantenimiento previstos por todos los realmente realizados
    setComisiones((prev) =>
      prev.map((com) => {
        if (com.id === datosCierre.comisionId) {
          // Extraer todos los tipos de mantenimiento únicos realizados en las tareas de la comisión.
          // Una comisión puede terminar abarcando más de un tipo (ej. Verificación + Preventivo).
          const tiposRealizados = Array.from(
            new Set(datosCierre.intervencionesNuevas.map((t) => t.tipoIntervencion))
          );

          return {
            ...com,
            estado: 'Finalizada' as EstadoComision,
            tiposMantenimiento: tiposRealizados.length > 0 ? tiposRealizados : com.tiposMantenimiento,
            fechaSalidaReal: datosCierre.fechaSalidaReal,
            fechaRegresoReal: datosCierre.fechaRegresoReal,
            destinosAeropuertos: destinosVisitados,
            observacionesCierre: datosCierre.observacionesCierre,
            finalizadaAt: hoyStr,
          };
        }
        return com;
      })
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

  const guardarAeropuerto = (aeropuerto: Aeropuerto) => {
    setAeropuertos((prev) => {
      const existe = prev.some(
        (a) => a.codigoIATA.toUpperCase() === aeropuerto.codigoIATA.toUpperCase()
      );
      if (existe) {
        return prev.map((a) =>
          a.codigoIATA.toUpperCase() === aeropuerto.codigoIATA.toUpperCase()
            ? aeropuerto
            : a
        );
      }
      return [...prev, aeropuerto];
    });
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
      localStorage.removeItem(STORAGE_KEYS.NOVEDADES);

      setAeropuertos(INITIAL_AEROPUERTOS);
      setModelos(INITIAL_MODELOS);
      setEquipos(INITIAL_EQUIPOS);
      setNomina(INITIAL_NOMINA);
      setComisiones(INITIAL_COMISIONES);
      setIntervenciones(INITIAL_INTERVENCIONES);
      setNovedades(INITIAL_NOVEDADES);
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
        intervenciones,
        novedades,
        crearComision,
        actualizarComision,
        cancelarComision,
        eliminarComision,
        cerrarComisionConFlujo,
        guardarEquipo,
        eliminarEquipo,
        guardarTecnico,
        guardarAeropuerto,
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
