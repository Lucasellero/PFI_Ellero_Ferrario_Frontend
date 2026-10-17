/**
 * API de prueba en memoria — permite desarrollar toda la interfaz sin backend ni Firebase.
 *
 * Los eventos imitan exactamente lo que hoy emiten `vision/`, `runner/` y
 * `cloud/app/baseline_runner.py` (mismos `event_type` y claves de `metadata`), y se generan
 * relativos a "ahora" para que siempre haya datos de hoy.
 *
 * También simula cuentas, kits y hogares para probar la vinculación por QR:
 * - `ana.gomez@mail.com` es la cuenta demo, con un hogar ya configurado y eventos.
 * - Cualquier cuenta creada desde "Crear cuenta" arranca sin hogar → vinculación.
 * - Kits libres para probar: ver `KITS_DEMO` (los códigos están en src/api/README.md).
 * Todo el estado se pierde al recargar la app.
 */
import type { Api } from './client';
import { ApiError } from './errors';
import type {
  Camara,
  ClaveIndicadorRutina,
  Evento,
  EventoMetadata,
  EventType,
  HogarApi,
  KitResumen,
  Perfil,
  Periodo,
  PuntoSerieRutina,
  Residente,
  ResumenRutina,
  SerieRutina,
} from './types';

const LATENCIA_MS = 400;
const esperar = () => new Promise((r) => setTimeout(r, LATENCIA_MS));

export const EMAIL_DEMO = 'ana.gomez@mail.com';
/** Cuenta de prueba con perfil pero sin hogar — para probar "invitar familiar" (RF12): existe
 * en la app (ya hizo `POST /me`), pero no está vinculada a ningún hogar todavía. */
export const EMAIL_FAMILIAR_DEMO = 'carlos.gomez@mail.com';

/**
 * Kits "de fábrica". `hogarId` null = todavía no vinculado. El LR-000101 es el de la cuenta demo
 * (sirve para probar el error "kit ya vinculado").
 */
export const KITS_DEMO = [
  { serie: 'LR-000101', codigo: 'Q9TB6XJV', cantidadCamaras: 3 },
  { serie: 'LR-000123', codigo: '7K3P9QXM', cantidadCamaras: 3 },
  { serie: 'LR-000124', codigo: '4HDW8R2N', cantidadCamaras: 1 },
  { serie: 'LR-000125', codigo: 'M2VC5ZKA', cantidadCamaras: 2 },
] as const;

const CAMARAS: Record<number, string> = { 1: 'Living', 2: 'Cocina', 3: 'Dormitorio' };

/** Hoy menos `diasAtras` días (≥ 1), a la hora `hh:mm`. */
function momento(diasAtras: number, hh: number, mm: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - diasAtras);
  d.setHours(hh, mm, 0, 0);
  return d;
}

/** Hoy, `minutos` antes de ahora (para que los eventos de hoy nunca queden en el futuro). */
function haceMinutos(minutos: number): Date {
  return new Date(Date.now() - minutos * 60_000);
}

let siguienteId = 1;
function evento(
  cuando: Date,
  event_type: EventType,
  camara_id: number | null,
  metadata: EventoMetadata,
  es_alerta = false,
): Evento {
  return {
    id: siguienteId++,
    camara_id,
    event_type,
    occurred_at: cuando.toISOString(),
    es_alerta,
    metadata,
    ubicacion: camara_id ? CAMARAS[camara_id] : null,
    resuelta: false,
  };
}

function actividad(cuando: Date, camara: number, label: Evento['metadata']['activity_label']) {
  return evento(cuando, 'activity', camara, {
    activity_label: label,
    confidence: 0.82,
    confirmed: true,
    ongoing: false,
  });
}

function generarEventos(): Evento[] {
  const eventos: Evento[] = [
    // ── Hoy ───────────────────────────────────────────────────────────────
    evento(haceMinutos(20), 'fall', 1, {
      evidence: 'full',
      confirmed: true,
      fall_temporal_score: 0.92,
    }, true),
    actividad(haceMinutos(45), 1, 'Moving'),
    actividad(haceMinutos(70), 2, 'EatingDrinkingMedication'),
    evento(haceMinutos(200), 'immobility', 1, {
      duration_s: 3 * 3600,
      posture: 'sentado',
      severity: 'baja',
    }),
    actividad(haceMinutos(380), 1, 'Resting'),
    actividad(haceMinutos(420), 2, 'Cooking'),
    // heartbeat de actividad en curso: la app lo filtra del feed (no es un cambio de actividad)
    evento(haceMinutos(425), 'activity', 2, { activity_label: 'Cooking', ongoing: true }),
    actividad(haceMinutos(480), 3, 'Moving'),

    // ── Días anteriores ──────────────────────────────────────────────────
    evento(momento(1, 6, 0), 'routine_deviation', null, {
      detector: 'timing',
      clave: 'cam_comida:horario',
      clase: 'cam_comida',
      minuto_del_dia: 14 * 60 + 30,
      horario_habitual_min: 12 * 60 + 15,
      desvio_min: 135,
    }, true),
    actividad(momento(1, 14, 30), 2, 'EatingDrinkingMedication'),
    actividad(momento(1, 10, 15), 1, 'ReadingScreen'),
    evento(momento(2, 16, 10), 'immobility', 1, {
      duration_s: 2 * 3600 + 40 * 60,
      posture: 'sentado',
      severity: 'baja',
    }),
    actividad(momento(2, 9, 5), 1, 'Phone'),
    evento(momento(3, 6, 0), 'routine_deviation', null, {
      detector: 'clase',
      clave: 'cam_moverse:deficit',
      clase: 'cam_moverse',
      tipo: 'deficit',
      valor_hoy: 0.6,
      mediana_historica: 1.8,
    }, true),
    evento(momento(5, 11, 40), 'fall', 3, {
      evidence: 'partial',
      confirmed: false,
      severity: 'sospecha',
    }),
    evento(momento(9, 6, 0), 'routine_deviation', null, {
      detector: 'tendencia',
      clave: 'cam_descanso_sofa:sube',
      clase: 'cam_descanso_sofa',
      direccion: 'sube',
      mediana_base: 2.1,
      mediana_reciente: 3.4,
    }, true),
  ];
  // Las alertas viejas ya fueron atendidas; solo quedan pendientes las de hoy.
  for (const e of eventos) {
    const dias = (Date.now() - new Date(e.occurred_at).getTime()) / 86_400_000;
    if (dias > 1) e.resuelta = true;
  }
  return eventos;
}

// "despertar" no se incluye: el backend real nunca lo manda (sin detección de cama/sueño con una
// sola cámara, ver docstring de cloud/app/rutina.py) — el mock tiene que reflejar lo que la app
// puede recibir de verdad, no lo que mostraba el mockup original.
const RESUMENES: Record<Periodo, ResumenRutina> = {
  hoy: {
    periodo: 'hoy',
    indicadores: [
      { clave: 'comida', titulo: 'Primera comida', valor: 'Hoy 9:10', habitual: 'habitual 8:00–9:30', estado: 'ok' },
      { clave: 'sedentarismo', titulo: 'Sedentarismo', valor: '3 h sin moverse', habitual: 'habitual 1 h por día', estado: 'desvio' },
      { clave: 'cocina', titulo: 'Cocina', valor: '20 min cocinando', habitual: 'habitual 35 min por día', estado: 'ok' },
      { clave: 'movilidad', titulo: 'Movilidad', valor: '10 min en movimiento', habitual: 'habitual 40 min por día', estado: 'desvio' },
    ],
  },
  semana: {
    periodo: 'semana',
    indicadores: [
      { clave: 'comida', titulo: 'Primera comida', valor: 'Promedio 9:00', habitual: 'habitual 8:00–9:30', estado: 'ok' },
      { clave: 'sedentarismo', titulo: 'Sedentarismo', valor: '2 h 10 min por día', habitual: 'habitual 1 h por día', estado: 'desvio' },
      { clave: 'cocina', titulo: 'Cocina', valor: '28 min por día', habitual: 'habitual 35 min por día', estado: 'ok' },
      { clave: 'movilidad', titulo: 'Movilidad', valor: '22 min por día', habitual: 'habitual 40 min por día', estado: 'desvio' },
    ],
  },
  mes: {
    periodo: 'mes',
    indicadores: [
      { clave: 'comida', titulo: 'Primera comida', valor: 'Promedio 8:50', habitual: 'habitual 8:00–9:30', estado: 'ok' },
      { clave: 'sedentarismo', titulo: 'Sedentarismo', valor: '1 h 20 min por día', habitual: 'habitual 1 h por día', estado: 'ok' },
      { clave: 'cocina', titulo: 'Cocina', valor: '33 min por día', habitual: 'habitual 35 min por día', estado: 'ok' },
      { clave: 'movilidad', titulo: 'Movilidad', valor: '34 min por día', habitual: 'habitual 40 min por día', estado: 'ok' },
    ],
  },
};

const DIAS_PERIODO: Record<Periodo, number> = { hoy: 1, semana: 7, mes: 30 };

function fechaIsoHaceNDias(dias: number): string {
  const d = new Date();
  d.setDate(d.getDate() - dias);
  return d.toISOString().slice(0, 10);
}

/** Serie día por día para el gráfico de Reportes — mismos valores "habituales" que `RESUMENES`,
 * con una tendencia que empeora acercándose a hoy (para que el gráfico cuente algo con sentido
 * en el modo demo, no puntos al azar). */
function serieRutinaMock(clave: ClaveIndicadorRutina, periodo: Periodo): SerieRutina {
  const dias = DIAS_PERIODO[periodo];
  if (clave === 'comida') {
    const habitual = 8 * 60 + 45; // 08:45
    const limite_inferior = 8 * 60;
    const limite_superior = 9 * 60 + 30;
    const puntos: PuntoSerieRutina[] = Array.from({ length: dias }, (_, idx) => {
      const i = dias - 1 - idx; // i=0 es hoy
      const valor = habitual + Math.round(20 * Math.sin(i * 0.9));
      const estado = valor < limite_inferior || valor > limite_superior ? 'desvio' : 'ok';
      return { fecha: fechaIsoHaceNDias(i), valor, estado };
    });
    return { clave, periodo, unidad: 'hora', habitual, limite_inferior, limite_superior, puntos };
  }
  // `sedentarismo`: empeora con el tiempo (más sentado = desvío, exceso); `cocina`/`movilidad`:
  // mismo criterio pero el desvío es quedarse por DEBAJO de lo habitual (déficit).
  const PARAMS: Record<'sedentarismo' | 'cocina' | 'movilidad', { habitual: number; valorHoy: number; direccion: 'exceso' | 'deficit' }> = {
    sedentarismo: { habitual: 60, valorHoy: 180, direccion: 'exceso' },
    cocina: { habitual: 35, valorHoy: 10, direccion: 'deficit' },
    movilidad: { habitual: 40, valorHoy: 10, direccion: 'deficit' },
  };
  const { habitual, valorHoy, direccion } = PARAMS[clave];
  const limite = direccion === 'exceso' ? habitual + 30 : Math.max(habitual - 30, 0);
  const puntos: PuntoSerieRutina[] = Array.from({ length: dias }, (_, idx) => {
    const i = dias - 1 - idx;
    const progreso = dias === 1 ? 1 : (dias - 1 - i) / (dias - 1); // 0 (más viejo) -> 1 (hoy)
    const valor = Math.round(habitual + progreso * (valorHoy - habitual));
    const estado = (direccion === 'exceso' ? valor > limite : valor < limite) ? 'desvio' : 'ok';
    return { fecha: fechaIsoHaceNDias(i), valor, estado };
  });
  return {
    clave, periodo, unidad: 'minutos', habitual,
    limite_inferior: direccion === 'deficit' ? limite : null,
    limite_superior: direccion === 'exceso' ? limite : null,
    puntos,
  };
}

/** Lo que el backend guardaría por hogar (tablas HOGAR, RESIDENTE, CAMARA, EVENTO). */
interface HogarMock {
  id: number;
  nombre: string;
  residente: Residente | null;
  kit: KitResumen;
  camaras: Camara[];
  eventos: Evento[];
  /** Solo la cuenta demo tiene línea base armada (Reportes). */
  conLineaBase: boolean;
}

interface FamiliarMock {
  id: number;
  nombre: string;
  email: string;
  /** `Familiar.push_token`: solo se guarda, el mock no manda push. */
  pushToken?: string;
  /** Tabla HOGAR_FAMILIAR. */
  hogares: { hogarId: number; rol: string }[];
}

/** Intentos fallidos de vinculación antes de bloquear (el backend debería limitar igual). */
const MAX_INTENTOS = 5;

export function crearMockApi(obtenerToken: () => Promise<string | null>): Api {
  const hogares = new Map<number, HogarMock>();
  const familiares = new Map<string, FamiliarMock>();
  const kits = KITS_DEMO.map((k) => ({ ...k, hogarId: null as number | null }));
  let siguienteHogar = 1;
  let siguienteFamiliar = 1;
  let siguienteCamara = 1;
  let intentosFallidos = 0;

  // ── Cuenta demo: hogar ya configurado, con eventos ─────────────────────────
  const demo: HogarMock = {
    id: siguienteHogar++,
    nombre: 'Casa de Rosa',
    residente: { id: 1, nombre: 'Rosa Méndez', telefono: '+5491100000000' },
    kit: { numero_serie: KITS_DEMO[0].serie, cantidad_camaras: KITS_DEMO[0].cantidadCamaras },
    camaras: Object.entries(CAMARAS).map(([id, ubicacion]) => ({
      id: Number(id),
      identificador_local: `cam${id}`,
      ubicacion,
      activa: true,
    })),
    eventos: generarEventos(),
    conLineaBase: true,
  };
  siguienteCamara = demo.camaras.length + 1;
  hogares.set(demo.id, demo);
  kits[0].hogarId = demo.id;
  familiares.set(EMAIL_DEMO, {
    id: siguienteFamiliar++,
    nombre: 'Ana Gómez',
    email: EMAIL_DEMO,
    hogares: [{ hogarId: demo.id, rol: 'responsable_principal' }],
  });
  familiares.set(EMAIL_FAMILIAR_DEMO, {
    id: siguienteFamiliar++,
    nombre: 'Carlos Gómez',
    email: EMAIL_FAMILIAR_DEMO,
    hogares: [],
  });

  // ── Helpers ────────────────────────────────────────────────────────────────

  /** En el mock el "token" es `mock:<email>` (lo arma AuthProvider). */
  async function familiarActual(): Promise<FamiliarMock> {
    const token = await obtenerToken();
    const email = token?.startsWith('mock:') ? token.slice(5) : null;
    if (!email) throw new ApiError(401, 'No hay sesión iniciada.');
    const f = familiares.get(email);
    if (!f) throw new ApiError(404, 'Tu cuenta todavía no tiene perfil.');
    return f;
  }

  /** Como `_hogar_autorizado` del backend: 403 si el familiar no pertenece al hogar. */
  async function hogarAutorizado(hogarId: number): Promise<HogarMock> {
    const f = await familiarActual();
    const h = hogares.get(hogarId);
    if (!h || !f.hogares.some((v) => v.hogarId === hogarId)) {
      throw new ApiError(403, 'No tenés acceso a este hogar.');
    }
    return h;
  }

  /** Como `hogar_autorizado(..., solo_responsable=True)` del backend (RF12). */
  async function exigirResponsable(hogarId: number): Promise<FamiliarMock> {
    const f = await familiarActual();
    const v = f.hogares.find((x) => x.hogarId === hogarId);
    if (!v) throw new ApiError(403, 'No tenés acceso a este hogar.');
    if (v.rol !== 'responsable_principal') {
      throw new ApiError(403, 'Solo el responsable principal del hogar puede cambiar esto.');
    }
    return f;
  }

  function buscarVinculo(hogarId: number, familiarId: number) {
    const f = Array.from(familiares.values()).find((x) => x.id === familiarId);
    const v = f?.hogares.find((x) => x.hogarId === hogarId);
    if (!f || !v) throw new ApiError(404, 'Ese familiar no está vinculado a este hogar.');
    return { f, v };
  }

  function esUnicoResponsable(hogarId: number, familiarId: number): boolean {
    return !Array.from(familiares.values()).some(
      (x) => x.id !== familiarId && x.hogares.some((v) => v.hogarId === hogarId && v.rol === 'responsable_principal'),
    );
  }

  function perfilDe(f: FamiliarMock): Perfil {
    return {
      familiar: { id: f.id, nombre: f.nombre, email: f.email },
      hogares: f.hogares.map(({ hogarId, rol }): HogarApi => {
        const h = hogares.get(hogarId)!;
        return {
          id: h.id,
          nombre: h.nombre,
          rol,
          residente: h.residente && { ...h.residente },
          kit: { ...h.kit },
        };
      }),
    };
  }

  return {
    async obtenerPerfil() {
      await esperar();
      return perfilDe(await familiarActual());
    },

    async crearPerfil({ nombre }) {
      await esperar();
      const token = await obtenerToken();
      const email = token?.startsWith('mock:') ? token.slice(5) : null;
      if (!email) throw new ApiError(401, 'No hay sesión iniciada.');
      const existente = familiares.get(email);
      if (existente) return perfilDe(existente);
      const nuevo: FamiliarMock = { id: siguienteFamiliar++, nombre, email, hogares: [] };
      familiares.set(email, nuevo);
      return perfilDe(nuevo);
    },

    async registrarPushToken(token) {
      await esperar();
      (await familiarActual()).pushToken = token;
    },

    async borrarPushToken(token) {
      await esperar();
      const familiar = await familiarActual();
      if (familiar.pushToken === token) familiar.pushToken = undefined;
    },

    async listarEventos(hogarId, { limit = 200, tipo, desde, hasta } = {}) {
      await esperar();
      const h = await hogarAutorizado(hogarId);
      return h.eventos
        .filter((e) => !tipo || e.event_type === tipo)
        .filter((e) => !desde || e.occurred_at >= desde)
        .filter((e) => !hasta || e.occurred_at <= hasta)
        .sort((a, b) => b.occurred_at.localeCompare(a.occurred_at))
        .slice(0, limit)
        .map((e) => ({ ...e }));
    },

    async marcarResuelta(hogarId, eventoId) {
      await esperar();
      const h = await hogarAutorizado(hogarId);
      const e = h.eventos.find((x) => x.id === eventoId);
      if (e) e.resuelta = true;
    },

    async obtenerResumenRutina(hogarId, periodo) {
      await esperar();
      const h = await hogarAutorizado(hogarId);
      // Un hogar recién vinculado todavía no tiene línea base: los primeros días no hay rangos.
      return h.conLineaBase ? RESUMENES[periodo] : { periodo, indicadores: [] };
    },

    async obtenerSerieRutina(hogarId, indicador, periodo) {
      await esperar();
      const h = await hogarAutorizado(hogarId);
      return h.conLineaBase
        ? serieRutinaMock(indicador, periodo)
        : { clave: indicador, periodo, unidad: indicador === 'comida' ? 'hora' : 'minutos',
            habitual: null, limite_inferior: null, limite_superior: null, puntos: [] };
    },

    async vincularKit(codigo) {
      await esperar();
      const f = await familiarActual();
      if (intentosFallidos >= MAX_INTENTOS) {
        throw new ApiError(429, 'Demasiados intentos. Esperá unos minutos y probá de nuevo.');
      }
      const kit = kits.find((k) => k.codigo === codigo);
      if (!kit) {
        intentosFallidos++;
        throw new ApiError(404, 'Ese código no corresponde a ningún kit. Revisalo en la etiqueta.');
      }
      if (kit.hogarId != null) {
        const h = hogares.get(kit.hogarId)!;
        // Reintento del mismo familiar (ej. se cortó la conexión después de vincular): idempotente.
        if (f.hogares.some((v) => v.hogarId === h.id)) {
          return { hogar_id: h.id, ...h.kit, camaras: h.camaras.map((c) => ({ ...c })) };
        }
        throw new ApiError(
          409,
          'Este kit ya está vinculado a otro hogar. Pedile a quien lo configuró que te invite desde su app.',
        );
      }

      intentosFallidos = 0;
      const nuevo: HogarMock = {
        id: siguienteHogar++,
        nombre: 'Mi hogar',
        residente: null,
        kit: { numero_serie: kit.serie, cantidad_camaras: kit.cantidadCamaras },
        // Las cámaras del plan se crean en fábrica junto con el kit (tantas como compró el
        // cliente); al vincular pasan al hogar y solo falta la ubicación.
        camaras: Array.from({ length: kit.cantidadCamaras }, (_, i) => ({
          id: siguienteCamara++,
          identificador_local: `cam${i + 1}`,
          ubicacion: null,
          activa: true,
        })),
        eventos: [],
        conLineaBase: false,
      };
      hogares.set(nuevo.id, nuevo);
      kit.hogarId = nuevo.id;
      f.hogares.push({ hogarId: nuevo.id, rol: 'responsable_principal' });
      return { hogar_id: nuevo.id, ...nuevo.kit, camaras: nuevo.camaras.map((c) => ({ ...c })) };
    },

    async listarCamaras(hogarId) {
      await esperar();
      const h = await hogarAutorizado(hogarId);
      return h.camaras.map((c) => ({ ...c }));
    },

    async actualizarCamara(hogarId, camaraId, { ubicacion }) {
      await esperar();
      const h = await hogarAutorizado(hogarId);
      const c = h.camaras.find((x) => x.id === camaraId);
      if (!c) throw new ApiError(404, 'Esa cámara no es de este hogar.');
      c.ubicacion = ubicacion;
      return { ...c };
    },

    async guardarResidente(hogarId, { nombre, telefono }) {
      await esperar();
      const h = await hogarAutorizado(hogarId);
      h.residente = { id: h.residente?.id ?? h.id, nombre, telefono };
      // El nombre del hogar sale del residente ("Casa de Rosa"); se puede cambiar después.
      if (h.nombre === 'Mi hogar') h.nombre = `Casa de ${nombre.split(' ')[0]}`;
    },

    async listarFamiliares(hogarId) {
      await esperar();
      await hogarAutorizado(hogarId);
      return Array.from(familiares.values())
        .map((f) => ({ f, v: f.hogares.find((x) => x.hogarId === hogarId) }))
        .filter((x): x is { f: FamiliarMock; v: { hogarId: number; rol: string } } => x.v != null)
        .map(({ f, v }) => ({ id: f.id, nombre: f.nombre, email: f.email, rol: v.rol }));
    },

    async invitarFamiliar(hogarId, { email, rol }) {
      await esperar();
      await exigirResponsable(hogarId);
      const f = familiares.get(email);
      if (!f) {
        throw new ApiError(404, 'Esa persona todavía no tiene una cuenta en la app. Pedile que se registre primero.');
      }
      const existente = f.hogares.find((v) => v.hogarId === hogarId);
      if (existente) return { id: f.id, nombre: f.nombre, email: f.email, rol: existente.rol };
      f.hogares.push({ hogarId, rol });
      return { id: f.id, nombre: f.nombre, email: f.email, rol };
    },

    async cambiarRolFamiliar(hogarId, familiarId, { rol }) {
      await esperar();
      await exigirResponsable(hogarId);
      const { f, v } = buscarVinculo(hogarId, familiarId);
      if (v.rol === 'responsable_principal' && rol !== 'responsable_principal' && esUnicoResponsable(hogarId, familiarId)) {
        throw new ApiError(
          409,
          'Es el único responsable principal del hogar — asigná otro responsable antes de cambiarle el rol.',
        );
      }
      v.rol = rol;
      return { id: f.id, nombre: f.nombre, email: f.email, rol };
    },

    async quitarFamiliar(hogarId, familiarId) {
      await esperar();
      const actual = await familiarActual();
      const vinculoPropio = actual.hogares.find((v) => v.hogarId === hogarId);
      if (!vinculoPropio) throw new ApiError(403, 'No tenés acceso a este hogar.');
      const esSelf = actual.id === familiarId;
      if (!esSelf && vinculoPropio.rol !== 'responsable_principal') {
        throw new ApiError(403, 'Solo el responsable principal puede desvincular a otro familiar.');
      }
      const { f, v } = buscarVinculo(hogarId, familiarId);
      if (v.rol === 'responsable_principal' && esUnicoResponsable(hogarId, familiarId)) {
        throw new ApiError(
          409,
          'Es el único responsable principal del hogar — asigná otro responsable antes de desvincularlo.',
        );
      }
      f.hogares = f.hogares.filter((x) => x.hogarId !== hogarId);
    },
  };
}
