/**
 * Tipos de la API cloud (repo Backend, `cloud/app/schemas.py`). Mantener sincronizado a mano
 * con el backend: si cambia `EventoOut` allá, cambia acá.
 *
 * Convención: un campo o tipo marcado "PENDIENTE BACKEND" todavía no existe en `cloud/` — hoy
 * solo lo sirve el mock (`src/api/mock.ts`). Al 2026-10-07 no queda ninguno (ver la tabla de
 * endpoints en src/api/README.md) — se deja la convención para la próxima vez que haga falta.
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
  /** Ubicación de la cámara (`Camara.ubicacion`), ej. "Living". Null si el evento no vino de una
   * cámara (ej. `routine_deviation`) o la cámara todavía no tiene ubicación cargada. */
  ubicacion: string | null;
  /** Si ya se tocó "Marcar como resuelta" (RF8, mockup 03). */
  resuelta: boolean;
}

/** `GET /me`: quién es el familiar logueado y a qué hogares accede. */
export interface Perfil {
  familiar: { id: number; nombre: string; email: string };
  /**
   * Vacío = cuenta recién creada, todavía sin kit vinculado → la app muestra la vinculación.
   * Un hogar con `residente: null` = kit vinculado pero sin terminar la configuración inicial.
   */
  hogares: HogarApi[];
}

export interface Residente {
  id: number;
  nombre: string;
  /** E.164, ej. "+5491123456789". */
  telefono: string | null;
}

/** Hogar tal como lo manda `GET /me`. */
export interface HogarApi {
  id: number;
  nombre: string;
  /** `HogarFamiliar.rol`: "responsable_principal" | "familiar". */
  rol: string;
  residente: Residente | null;
  /** El kit vinculado a este hogar (el último vinculado, ver `cloud/app/routers/me.py`). */
  kit: KitResumen | null;
}

/** `GET/POST/PATCH /hogares/{id}/familiares` (RF12). */
export interface FamiliarVinculado {
  id: number;
  nombre: string;
  email: string;
  /** "responsable_principal" | "familiar". */
  rol: string;
}

/**
 * Kit tal como viene de fábrica. `cantidad_camaras` es el plan que compró el cliente (1 a 3,
 * informe Sección 3.9.2.1: el kit trae 1 cámara y se pueden sumar hasta 3 por controladora).
 * Es el máximo de cámaras que el hogar puede configurar.
 */
export interface KitResumen {
  numero_serie: string;
  cantidad_camaras: number;
}

/** Hogar con la configuración inicial terminada: es el que usan las pestañas. */
export interface HogarResumen extends HogarApi {
  residente: Residente;
}

// ── Vinculación del kit (ver docs/vinculacion-kit.md) ─────────────────────────

/** `GET /hogares/{id}/camaras` y `PATCH /hogares/{id}/camaras/{camara_id}`. */
export interface Camara {
  id: number;
  /** Id de la cámara en `cameras.yaml` de la controladora (Lar), ej. "cam1". */
  identificador_local: string;
  /** "Living", "Cocina"... La carga el familiar en la configuración inicial. */
  ubicacion: string | null;
  activa: boolean;
}

/** Respuesta de `POST /kits/vincular`. */
export interface KitVinculado extends KitResumen {
  hogar_id: number;
  /** Las cámaras del plan, creadas en fábrica junto con el kit (`camaras.length === cantidad_camaras`). */
  camaras: Camara[];
}

/** Body de `PUT /hogares/{id}/residente`. */
export interface DatosResidente {
  nombre: string;
  telefono: string | null;
}

export type Periodo = 'hoy' | 'semana' | 'mes';

/** Indicador de rutina vs. historial del residente (pantalla Reportes, `GET /hogares/{id}/rutina`).
 * Solo dos claves hoy: `"comida"` y `"sedentarismo"` — son las únicas que `cloud/app/rutina.py`
 * puede calcular de verdad con lo que ve una sola cámara (sin sensor de cama, no hay
 * `"despertar"` como mostraba el mock). */
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
