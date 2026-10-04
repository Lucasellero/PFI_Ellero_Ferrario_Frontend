/**
 * API de prueba en memoria — permite desarrollar toda la interfaz sin backend ni Firebase.
 *
 * Los eventos imitan exactamente lo que hoy emiten `vision/`, `runner/` y
 * `cloud/app/baseline_runner.py` (mismos `event_type` y claves de `metadata`), y se generan
 * relativos a "ahora" para que siempre haya datos de hoy. El estado (alertas resueltas) se
 * pierde al recargar la app.
 */
import type { Api } from './client';
import type { Evento, EventoMetadata, EventType, Perfil, Periodo, ResumenRutina } from './types';

const LATENCIA_MS = 400;
const esperar = () => new Promise((r) => setTimeout(r, LATENCIA_MS));

const PERFIL: Perfil = {
  familiar: { id: 1, nombre: 'Ana Gómez', email: 'ana.gomez@mail.com' },
  hogares: [
    {
      id: 1,
      nombre: 'Casa de Rosa',
      rol: 'responsable_principal',
      residente: { id: 1, nombre: 'Rosa Méndez', telefono: '+5491100000000' },
    },
  ],
};

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

const RESUMENES: Record<Periodo, ResumenRutina> = {
  hoy: {
    periodo: 'hoy',
    indicadores: [
      { clave: 'despertar', titulo: 'Despertar', valor: 'Hoy 7:35', habitual: 'habitual 7:00–7:45', estado: 'ok' },
      { clave: 'comida', titulo: 'Primera comida', valor: 'Hoy 9:10', habitual: 'habitual 8:00–9:30', estado: 'ok' },
      { clave: 'sedentarismo', titulo: 'Sedentarismo', valor: '3 h sin moverse', habitual: 'habitual 1 h por día', estado: 'desvio' },
    ],
  },
  semana: {
    periodo: 'semana',
    indicadores: [
      { clave: 'despertar', titulo: 'Despertar', valor: 'Promedio 7:30', habitual: 'habitual 7:00–7:45', estado: 'ok' },
      { clave: 'comida', titulo: 'Primera comida', valor: 'Promedio 9:00', habitual: 'habitual 8:00–9:30', estado: 'ok' },
      { clave: 'sedentarismo', titulo: 'Sedentarismo', valor: '2 h 10 min por día', habitual: 'habitual 1 h por día', estado: 'desvio' },
    ],
  },
  mes: {
    periodo: 'mes',
    indicadores: [
      { clave: 'despertar', titulo: 'Despertar', valor: 'Promedio 7:25', habitual: 'habitual 7:00–7:45', estado: 'ok' },
      { clave: 'comida', titulo: 'Primera comida', valor: 'Promedio 8:50', habitual: 'habitual 8:00–9:30', estado: 'ok' },
      { clave: 'sedentarismo', titulo: 'Sedentarismo', valor: '1 h 20 min por día', habitual: 'habitual 1 h por día', estado: 'ok' },
    ],
  },
};

export function crearMockApi(): Api {
  const eventos = generarEventos();

  return {
    async obtenerPerfil() {
      await esperar();
      return PERFIL;
    },
    async listarEventos(_hogarId, { limit = 200 } = {}) {
      await esperar();
      return [...eventos]
        .sort((a, b) => b.occurred_at.localeCompare(a.occurred_at))
        .slice(0, limit)
        .map((e) => ({ ...e }));
    },
    async marcarResuelta(_hogarId, eventoId) {
      await esperar();
      const e = eventos.find((x) => x.id === eventoId);
      if (e) e.resuelta = true;
    },
    async obtenerResumenRutina(_hogarId, periodo) {
      await esperar();
      return RESUMENES[periodo];
    },
  };
}
