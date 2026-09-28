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
  determinarJefeComision,
  evaluarEstadoComisionSegunFecha,
  getHoyLocalStr,
  generarId,
} from '../utils/maintenance';
import * as repo from '../lib/repo';

interface AppContextType {
  cargando: boolean;
  errorCarga: string | null;
  errorSync: string | null;
  limpiarErrorSync: () => void;

  aeropuertos: Aeropuerto[];
  modelos: ModeloEquipo[]; // solo los visibles (excluye los dados de baja)
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

  // Acciones de Modelos de Equipo
  crearModelo: (datos: Pick<ModeloEquipo, 'sistema' | 'denominacion' | 'fabricante'>) => void;
  actualizarModelo: (
    id: string,
    datos: Pick<ModeloEquipo, 'sistema' | 'denominacion' | 'fabricante'>
  ) => void;
  eliminarModelo: (id: string) => void;

  // Utilidades
  getEquipoPorId: (id: string) => EquipoInstalado | undefined;
  getModeloPorId: (id: string) => ModeloEquipo | undefined;
  getAeropuertoPorCodigo: (codigo: string) => Aeropuerto | undefined;
  getTecnicoPorId: (id: string) => Tecnico | undefined;
}

// Usuario fijo de la sesión actual: el sistema todavía no tiene autenticación
// multiusuario, por lo que toda acción auditada se atribuye a este usuario.
const USUARIO_ACTUAL = 'Ing. Fran';

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState<string | null>(null);
  const [errorSync, setErrorSync] = useState<string | null>(null);
  const limpiarErrorSync = () => setErrorSync(null);

  // Persiste en segundo plano contra Supabase: la UI ya actualizó su estado
  // local de forma optimista, esto solo confirma que quedó guardado. Si falla,
  // se avisa con un banner en vez de fallar silenciosamente.
  const sync = (promesa: Promise<unknown>, contexto: string) => {
    promesa.catch((err) => {
      console.error(`Error guardando "${contexto}" en la base de datos:`, err);
      setErrorSync(
        `No se pudo guardar "${contexto}" en el servidor (${
          err instanceof Error ? err.message : 'error desconocido'
        }). El cambio quedó solo en esta pantalla; recargar la página lo perdería.`
      );
    });
  };

  const [aeropuertosTodos, setAeropuertos] = useState<Aeropuerto[]>([]);
  const aeropuertos = useMemo(
    () => aeropuertosTodos.filter((a) => !a.eliminadoAt),
    [aeropuertosTodos]
  );

  const [modelosTodos, setModelosTodos] = useState<ModeloEquipo[]>([]);
  const modelos = useMemo(() => modelosTodos.filter((m) => !m.eliminadoAt), [modelosTodos]);

  const [equipos, setEquipos] = useState<EquipoInstalado[]>([]);
  const [nomina, setNomina] = useState<Tecnico[]>([]);

  const [comisionesTodas, setComisiones] = useState<ComisionServicio[]>([]);
  const comisiones = useMemo(
    () => comisionesTodas.filter((c) => !c.eliminadaAt),
    [comisionesTodas]
  );
  const comisionesEliminadas = useMemo(
    () => comisionesTodas.filter((c) => !!c.eliminadaAt),
    [comisionesTodas]
  );

  const [intervenciones, setIntervenciones] = useState<IntervencionMantenimiento[]>([]);
  const [auditoria, setAuditoria] = useState<RegistroAuditoria[]>([]);

  // Carga inicial: todo viene de Supabase (radioayudas-dev), no de localStorage.
  useEffect(() => {
    let cancelado = false;
    Promise.all([
      repo.fetchAeropuertos(),
      repo.fetchModelos(),
      repo.fetchEquipos(),
      repo.fetchTecnicos(),
      repo.fetchComisiones(),
      repo.fetchIntervenciones(),
      repo.fetchAuditoria(),
    ])
      .then(([aero, mod, eq, tec, com, interv, audit]) => {
        if (cancelado) return;
        setAeropuertos(aero);
        setModelosTodos(mod);
        setEquipos(eq);
        setNomina(tec);
        setComisiones(com);
        setIntervenciones(interv);
        setAuditoria(audit);
      })
      .catch((err) => {
        if (cancelado) return;
        setErrorCarga(
          err instanceof Error ? err.message : 'No se pudo conectar con la base de datos.'
        );
      })
      .finally(() => {
        if (!cancelado) setCargando(false);
      });
    return () => {
      cancelado = true;
    };
  }, []);

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
    sync(repo.insertarAuditoriaDB(registro), `auditoría de ${entidadEtiqueta}`);
  };

  // Regla de Negocio:
  // Toda comisión en estado de 'Planificada' pasa a estar 'En Curso' cuando la fecha está dentro del rango de fechas de la comisión.
  // Una vez finalizada no vuelve a cambiar.
  useEffect(() => {
    if (cargando) return;
    const hoyStr = getHoyLocalStr();
    setComisiones((prev) => {
      let cambio = false;
      const actualizadas = prev.map((com) => {
        if (com.estado === 'Planificada' && !com.eliminadaAt) {
          const evaluado = evaluarEstadoComisionSegunFecha(com, hoyStr);
          if (evaluado !== com.estado) {
            cambio = true;
            const actualizada = { ...com, estado: evaluado };
            sync(repo.actualizarComisionDB(actualizada), `estado de ${com.codigo}`);
            return actualizada;
          }
        }
        return com;
      });
      return cambio ? actualizadas : prev;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cargando]);

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
    sync(repo.insertarComisionDB(nuevaComision), `la comisión ${codigo}`);
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
    sync(repo.actualizarComisionDB(objetoFinal), `la comisión ${objetoFinal.codigo}`);
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
    sync(repo.actualizarComisionDB(comisionCancelada), `la cancelación de ${comision.codigo}`);
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
    const comisionEliminada = { ...comision, eliminadaAt: new Date().toISOString() };
    setComisiones((prev) =>
      prev.map((c) => (c.id === comisionId ? comisionEliminada : c))
    );
    sync(repo.actualizarComisionDB(comisionEliminada), `la eliminación de ${comision.codigo}`);
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
    let equiposParaSincronizar: EquipoInstalado[] = [];
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

      // Solo hace falta persistir los equipos que efectivamente cambiaron
      // (los intervenidos y sus asociados sincronizados).
      equiposParaSincronizar = actualizados.filter((eq, i) => eq !== prevEquipos[i]);
      return actualizados;
    });
    if (equiposParaSincronizar.length > 0) {
      sync(
        repo.actualizarEquiposMasivoDB(equiposParaSincronizar),
        `los equipos intervenidos en ${comisionActual.codigo}`
      );
    }

    // 4. Agregar intervenciones al estado
    if (nuevasIntervenciones.length > 0) {
      setIntervenciones((prev) => [...prev, ...nuevasIntervenciones]);
      sync(
        repo.insertarIntervencionesDB(nuevasIntervenciones),
        `las tareas realizadas en ${comisionActual.codigo}`
      );
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
    sync(repo.actualizarComisionDB(comisionFinalizada), `el cierre de ${comisionActual.codigo}`);
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
    sync(repo.guardarEquipoDB(equipo), `la radioayuda ${equipo.identificador}`);
  };

  const eliminarEquipo = (equipoId: string) => {
    setEquipos((prev) => prev.filter((e) => e.id !== equipoId));
    sync(repo.eliminarEquipoDB(equipoId), 'la eliminación de la radioayuda');
  };

  const guardarTecnico = (tecnico: Tecnico) => {
    setNomina((prev) => {
      const existe = prev.some((t) => t.id === tecnico.id);
      if (existe) {
        return prev.map((t) => (t.id === tecnico.id ? tecnico : t));
      }
      return [...prev, tecnico];
    });
    sync(repo.guardarTecnicoDB(tecnico), `el técnico ${tecnico.apellido}, ${tecnico.nombre}`);
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
    const bajaAt = new Date().toISOString();
    setNomina((prev) => prev.map((t) => (t.id === id ? { ...t, bajaAt } : t)));
    sync(repo.darDeBajaTecnicoDB(id, bajaAt), 'la baja del técnico');
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
    const nuevo: Aeropuerto = { codigoIATA: codigo, nombreOficial: nombre, region: datos.region };
    setAeropuertos((prev) => [...prev, nuevo]);
    sync(repo.insertarAeropuerto(nuevo), `el aeropuerto ${codigo}`);
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
    sync(
      repo.actualizarAeropuertoDB(codigoIATA, { nombreOficial: nombre, region: datos.region }),
      `el aeropuerto ${codigoIATA}`
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
    const eliminadoAt = new Date().toISOString();
    setAeropuertos((prev) =>
      prev.map((a) => (a.codigoIATA === codigoIATA ? { ...a, eliminadoAt } : a))
    );
    sync(repo.darDeBajaAeropuertoDB(codigoIATA, eliminadoAt), `la baja de ${codigoIATA}`);
  };

  const crearModelo = (
    datos: Pick<ModeloEquipo, 'sistema' | 'denominacion' | 'fabricante'>
  ) => {
    const denominacion = datos.denominacion.trim();
    const fabricante = datos.fabricante.trim();
    if (!denominacion) {
      throw new Error('La denominación del modelo es obligatoria.');
    }
    // Se compara contra todos (incluidos los dados de baja) para no duplicar.
    if (
      modelosTodos.some(
        (m) =>
          !m.eliminadoAt &&
          m.sistema === datos.sistema &&
          m.denominacion.toLowerCase() === denominacion.toLowerCase()
      )
    ) {
      throw new Error(`Ya existe un modelo ${datos.sistema} con esa denominación.`);
    }
    const nuevo: ModeloEquipo = { id: generarId('MOD'), sistema: datos.sistema, denominacion, fabricante };
    setModelosTodos((prev) => [...prev, nuevo]);
    sync(repo.insertarModelo(nuevo), `el modelo ${denominacion}`);
  };

  const actualizarModelo = (
    id: string,
    datos: Pick<ModeloEquipo, 'sistema' | 'denominacion' | 'fabricante'>
  ) => {
    if (!modelos.some((m) => m.id === id)) {
      throw new Error('El modelo indicado no existe.');
    }
    const denominacion = datos.denominacion.trim();
    const fabricante = datos.fabricante.trim();
    if (!denominacion) {
      throw new Error('La denominación del modelo es obligatoria.');
    }
    setModelosTodos((prev) =>
      prev.map((m) =>
        m.id === id ? { ...m, sistema: datos.sistema, denominacion, fabricante } : m
      )
    );
    sync(
      repo.actualizarModeloDB(id, { sistema: datos.sistema, denominacion, fabricante }),
      `el modelo ${denominacion}`
    );
  };

  // Baja lógica. Se bloquea si el modelo todavía tiene equipos instalados que lo referencian.
  const eliminarModelo = (id: string) => {
    if (!modelos.some((m) => m.id === id)) {
      throw new Error('El modelo indicado no existe.');
    }
    const cantEquipos = equipos.filter((e) => e.modeloId === id).length;
    if (cantEquipos > 0) {
      throw new Error(
        `No se puede eliminar: tiene ${cantEquipos} radioayuda(s) instalada(s) con este modelo.`
      );
    }
    const eliminadoAt = new Date().toISOString();
    setModelosTodos((prev) => prev.map((m) => (m.id === id ? { ...m, eliminadoAt } : m)));
    sync(repo.darDeBajaModeloDB(id, eliminadoAt), 'la baja del modelo');
  };

  return (
    <AppContext.Provider
      value={{
        cargando,
        errorCarga,
        errorSync,
        limpiarErrorSync,
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
        crearModelo,
        actualizarModelo,
        eliminarModelo,
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
