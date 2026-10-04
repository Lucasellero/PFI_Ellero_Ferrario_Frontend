/**
 * Tipos de la API cloud (repo Backend, `cloud/app/schemas.py`). Mantener sincronizado a mano
 * con el backend: si cambia `EventoOut` allá, cambia acá.
 *
 * Los campos/tipos marcados "PENDIENTE BACKEND" todavía no existen en `cloud/` — hoy solo los
 * sirve el mock (`src/api/mock.ts`). Ver la tabla de endpoints en src/api/README.md.
 */

/** `events/schema.py::EventType` del backend. */
export type EventType = 'fall' | 'immobility' | 'activity' | 'routine_deviation';

/** Categorías de actividad que emite `vlm/` (`vlm/src/clip_classifier.py::CATEGORY_DESCRIPTIONS`). */
export type ActivityLabel =
  | 'Cooking'
  | 'EatingDrinkingMedication'
  | 'Resting'
  | 'ReadingScreen'
  | 'Moving'
  | 'Phone'
  | 'Background';

/**
 * `metadata` según el tipo de evento. El backend lo manda como `dict` libre; estos son los
 * campos que hoy escriben `vision/`, `runner/` y `cloud/app/baseline_runner.py`. Todos
 * opcionales: la app tiene que tolerar que falte cualquiera.
 */
/**
 * `metadata.severity` la usan dos tipos de evento: `fall` ("sospecha", evidencia parcial) e
 * `immobility` ("alta": inmóvil en el piso / posible post-caída; "baja": sedentarismo sentado).
 */
export type SeverityBackend = 'sospecha' | 'alta' | 'baja';

export interface FallMetadata {
  evidence?: 'full' | 'partial';
  /** false = caída "sospecha" (evidencia parcial o clasificador indeciso). */
  confirmed?: boolean;
  severity?: SeverityBackend;
  fall_temporal_score?: number;
  clip_confirmation_margin?: number;
}

export interface ImmobilityMetadata {
  duration_s?: number;
  posture?: 'sentado' | 'acostado' | 'parado';
  severity?: SeverityBackend;
  trigger?: 'post_fall_sospecha';
}

export interface ActivityMetadata {
  activity_label?: ActivityLabel;
  confidence?: number;
  confirmed?: boolean;
  /** true = heartbeat de una actividad que continúa (no es un cambio de actividad). */
  ongoing?: boolean;
}

/** Desvíos que genera `cloud/app/baseline_runner.py` (4 detectores). */
export interface RoutineDeviationMetadata {
  detector?: 'multivariado' | 'clase' | 'timing' | 'tendencia';
  clave?: string;
  fecha?: string;
  /** Clase de `baseline/`, ej. "cam_cocina", "cam_comida", "cam_descanso_sofa". */
  clase?: string;
  // detector "clase"
  tipo?: 'ausencia' | 'ausencia_sostenida' | 'exceso' | 'deficit';
  valor_hoy?: number;
  mediana_historica?: number;
  // detector "timing"
  minuto_del_dia?: number;
  horario_habitual_min?: number;
  desvio_min?: number;
  // detector "tendencia"
  direccion?: 'sube' | 'baja';
}

export type EventoMetadata = FallMetadata &
  ImmobilityMetadata &
  ActivityMetadata &
  RoutineDeviationMetadata &
  Record<string, unknown>;

/** `cloud/app/schemas.py::EventoOut`. */
export interface Evento {
  id: number;
  camara_id: number | null;
  event_type: EventType;
  /** ISO 8601 con zona horaria. */
  occurred_at: string;
  es_alerta: boolean;
  metadata: EventoMetadata;
  /** PENDIENTE BACKEND: ubicación de la cámara (`Camara.ubicacion`), ej. "Living". */
  ubicacion?: string | null;
  /** PENDIENTE BACKEND: estado de atención de la alerta (no existe en el modelo `Evento`). */
  resuelta?: boolean;
}

/** PENDIENTE BACKEND (`GET /me`): quién es el familiar logueado y a qué hogares accede. */
export interface Perfil {
  familiar: { id: number; nombre: string; email: string };
  hogares: HogarResumen[];
}

export interface HogarResumen {
  id: number;
  nombre: string;
  rol: string;
  residente: { id: number; nombre: string; telefono: string | null };
}

export type Periodo = 'hoy' | 'semana' | 'mes';

/** PENDIENTE BACKEND: indicadores de rutina vs. línea base del residente (pantalla Reportes). */
export interface IndicadorRutina {
  clave: string;
  titulo: string;
  /** Ej. "Hoy 7:35" o "3 h sin moverse". */
  valor: string;
  /** Ej. "habitual 7:00–7:45". */
  habitual: string;
  estado: 'ok' | 'desvio';
}

export interface ResumenRutina {
  periodo: Periodo;
  indicadores: IndicadorRutina[];
}
