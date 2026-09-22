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
import { determinarJefeComision, evaluarEstadoComisionSegunFecha } from '../utils/maintenance';

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
      tipoMantenimiento?: any;
      objetivo?: string;
    }
  ) => ComisionServicio;
  actualizarComision: (comision: ComisionServicio) => void;
  cambiarEstadoComision: (comisionId: string, nuevoEstado: EstadoComision) => void;
  cerrarComisionConFlujo: (datosCierre: {
    comisionId: string;
    fechaSalidaReal: string;
    fechaRegresoReal: string;
    destinosVisitados?: string[];
    tipoMantenimientoReal?: string;
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
    return saved ? JSON.parse(saved) : INITIAL_COMISIONES;
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
    const hoyStr = new Date().toISOString().split('T')[0];
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
      tipoMantenimiento?: any;
      objetivo?: string;
    }
  ): ComisionServicio => {
    const anio = new Date().getFullYear();
    const numeroSecuencial = comisiones.length + 1;
    const codigo = `COM-${anio}-${String(numeroSecuencial).padStart(3, '0')}`;
    const id = `COM-${Date.now()}`;
    const hoyStr = new Date().toISOString().split('T')[0];

    // Determinación automática del Jefe de Comisión según la jerarquía institucional
    const jefe = determinarJefeComision(datos.tecnicosIds, nomina);
    const jefeComisionId = jefe ? jefe.id : datos.tecnicosIds[0] || '';

    // Estado inicial siempre es Planificada.
    // Si la fecha de salida ya cae hoy o dentro del rango, la función de evaluación la activa a 'En Curso'.
    let estadoInicial: EstadoComision = 'Planificada';
    if (hoyStr >= datos.fechaSalida && hoyStr <= datos.fechaRegreso) {
      estadoInicial = 'En Curso';
    }

    const nuevaComision: ComisionServicio = {
      ...datos,
      id,
      codigo,
      jefeComisionId,
      estado: estadoInicial,
      tipoMantenimiento: datos.tipoMantenimiento,
      tipoMantenimientoPrevisto: datos.tipoMantenimiento,
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

  const cambiarEstadoComision = (comisionId: string, nuevoEstado: EstadoComision) => {
    setComisiones((prev) =>
      prev.map((c) =>
        c.id === comisionId
          ? {
              ...c,
              estado: nuevoEstado,
              finalizadaAt:
                nuevoEstado === 'Finalizada' ? new Date().toISOString().split('T')[0] : c.finalizadaAt,
            }
          : c
      )
    );
  };

  const cerrarComisionConFlujo = (datosCierre: {
    comisionId: string;
    fechaSalidaReal: string;
    fechaRegresoReal: string;
    destinosVisitados?: string[];
    tipoMantenimientoReal?: string;
    observacionesCierre: string;
    intervencionesNuevas: Omit<IntervencionMantenimiento, 'id' | 'comisionId'>[];
    novedadesNuevas: Omit<NovedadComision, 'id' | 'comisionId'>[];
  }) => {
    const timestamp = Date.now();
    const hoyStr = new Date().toISOString().split('T')[0];

    // 1. Crear las intervenciones con IDs
    const nuevasIntervenciones: IntervencionMantenimiento[] = datosCierre.intervencionesNuevas.map(
      (item, idx) => ({
        ...item,
        id: `INT-${timestamp}-${idx}`,
        comisionId: datosCierre.comisionId,
      })
    );

    // 2. Crear las novedades con IDs
    const nuevasNovedades: NovedadComision[] = datosCierre.novedadesNuevas.map(
      (nov, idx) => ({
        ...nov,
        id: `NOV-${timestamp}-${idx}`,
        comisionId: datosCierre.comisionId,
        fechaRegistro: nov.fechaRegistro || hoyStr,
      })
    );

    // 3. Actualizar equipos según las tareas realizadas
    // Cada intervención registrada actualiza las fechas de último mantenimiento del equipo intervenido
    setEquipos((prevEquipos) => {
      let actualizados = [...prevEquipos];

      nuevasIntervenciones.forEach((interv) => {
        actualizados = actualizados.map((eq) => {
          if (eq.id === interv.equipoId) {
            const cambios: Partial<EquipoInstalado> = {
              estadoOperativo: interv.estadoOperativoResultante,
            };

            if (interv.tipoIntervencion === 'Verificación' || interv.tipoIntervencion === 'Verificación Aérea') {
              cambios.fechaUltimaVerificacionAerea = interv.fechaEjecucion;
            } else if (interv.tipoIntervencion === 'Preventivo' || interv.tipoIntervencion === 'Mantenimiento Preventivo') {
              cambios.fechaUltimoMantenimientoPreventivo = interv.fechaEjecucion;
            }

            return { ...eq, ...cambios };
          }
          return eq;
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

    // 5. Marcar comisión como Finalizada, guardar fechas reales, destinos visitados y reemplazar el tipo de mantenimiento por todos los realizados
    setComisiones((prev) =>
      prev.map((com) => {
        if (com.id === datosCierre.comisionId) {
          // Extraer todos los tipos de mantenimiento únicos realizados en las tareas de la comisión
          const tiposRealizados = Array.from(
            new Set(datosCierre.intervencionesNuevas.map((t) => t.tipoIntervencion))
          );

          // Se borra el tipo provisto/previsto original y se reemplaza por todos los tipos realizados en tareas
          const nuevoTipoMantenimiento =
            tiposRealizados.length > 0
              ? tiposRealizados.join(', ')
              : datosCierre.tipoMantenimientoReal || com.tipoMantenimiento || 'Otros';

          return {
            ...com,
            estado: 'Finalizada' as EstadoComision,
            tipoMantenimiento: nuevoTipoMantenimiento,
            tiposMantenimiento: tiposRealizados.length > 0 ? (tiposRealizados as TipoIntervencion[]) : undefined,
            tipoMantenimientoPrevisto: undefined, // Se borra el tipo provisto/previsto original
            fechaSalidaReal: datosCierre.fechaSalidaReal,
            fechaRegresoReal: datosCierre.fechaRegresoReal,
            destinosAeropuertos: datosCierre.destinosVisitados || com.destinosAeropuertos,
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
        cambiarEstadoComision,
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
