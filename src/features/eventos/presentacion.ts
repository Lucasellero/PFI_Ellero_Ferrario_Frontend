/**
 * Traduce un `Evento` crudo del backend a lo que ve el familiar: título, descripción e ícono.
 * Todos los textos de eventos de la app salen de acá (no armar textos de eventos en pantallas).
 *
 * Criterio de redacción (RNF8 — simple, clara, sin jerga): nada de "z-score", "cam_cocina" ni
 * porcentajes técnicos en la tarjeta. Lenguaje neutro en género (no "sentada"/"sentado"),
 * porque la app no sabe el género del residente.
 */
import type Feather from '@expo/vector-icons/Feather';
import type { ComponentProps } from 'react';

import type { ActivityLabel, Evento } from '@/api/types';

import { duracion, horaDesdeMinutos } from './formato';

export type NombreIcono = ComponentProps<typeof Feather>['name'];

export interface PresentacionEvento {
  titulo: string;
  descripcion: string;
  icono: NombreIcono;
}

const ACTIVIDADES: Record<ActivityLabel, { titulo: string; icono: NombreIcono }> = {
  Cooking: { titulo: 'Cocinó', icono: 'coffee' },
  EatingDrinkingMedication: { titulo: 'Comió, bebió o tomó la medicación', icono: 'check' },
  Resting: { titulo: 'Descansó', icono: 'moon' },
  ReadingScreen: { titulo: 'Leyó o usó una pantalla', icono: 'book-open' },
  Moving: { titulo: 'Se movió por la casa', icono: 'activity' },
  Phone: { titulo: 'Habló por teléfono', icono: 'phone' },
  LeaveHome: { titulo: 'Salió de casa', icono: 'log-out' },
  EnterHome: { titulo: 'Entró a casa', icono: 'log-in' },
  Background: { titulo: 'Sin actividad visible', icono: 'eye-off' },
};

/** Clases de `baseline/` (`baseline/src/camera_events.py::CAMERA_ACTIVITY_MAP`). */
const CLASES_RUTINA: Record<string, string> = {
  cam_cocina: 'cocinar',
  cam_comida: 'comer o beber',
  cam_descanso_sofa: 'descansar',
  cam_ocio_sentado: 'estar sin moverse (leer, TV, teléfono)',
  cam_moverse: 'moverse por la casa',
  cam_salir_casa: 'salir de casa',
  cam_entrar_casa: 'entrar a casa',
};

/** Entradas y salidas son eventos puntuales: se cuentan veces, no tiempo. */
const CLASES_PUNTUALES = new Set(['cam_salir_casa', 'cam_entrar_casa']);

/**
 * Un solo día sin salir o sin entrar (`tipo: "ausencia"`, que el backend emite para estas dos
 * clases desde el 2026-10-13). Texto propio: "Hoy no se registró salir de casa" no se entiende.
 */
const SIN_EVENTOS_HOY: Record<string, string> = {
  cam_salir_casa: 'Hoy no se registró ninguna salida de casa',
  cam_entrar_casa: 'Hoy no se registró ninguna entrada a casa',
};

const enLugar = (e: Evento) => (e.ubicacion ? ` en ${e.ubicacion.toLowerCase()}` : '');

function desvioDeRutina(e: Evento): PresentacionEvento {
  const m = e.metadata;
  const actividad = (m.clase && CLASES_RUTINA[m.clase]) ?? 'su rutina';
  switch (m.detector) {
    case 'timing': {
      const real = m.minuto_del_dia != null ? horaDesdeMinutos(m.minuto_del_dia) : null;
      const habitual = m.horario_habitual_min != null ? horaDesdeMinutos(m.horario_habitual_min) : null;
      return {
        titulo: 'Horario fuera de lo habitual',
        descripcion:
          real && habitual
            ? `Momento de ${actividad}: ${real} · habitual ${habitual}`
            : `Cambió el horario de ${actividad}`,
        icono: 'clock',
      };
    }
    case 'clase': {
      const puntual = m.clase != null && CLASES_PUNTUALES.has(m.clase);
      const textos: Record<string, string> = {
        ausencia: (m.clase && SIN_EVENTOS_HOY[m.clase]) ?? `Hoy no se registró ${actividad}`,
        ausencia_sostenida: `Varios días sin ${actividad}`,
        exceso: puntual ? `Más veces de lo habitual: ${actividad}` : `Más tiempo de lo habitual en ${actividad}`,
        deficit: puntual ? `Menos veces de lo habitual: ${actividad}` : `Menos tiempo de lo habitual en ${actividad}`,
      };
      return {
        titulo: 'Cambio en la rutina',
        descripcion: (m.tipo && textos[m.tipo]) ?? `Cambio en ${actividad}`,
        icono: 'bar-chart-2',
      };
    }
    case 'tendencia':
      return {
        titulo: 'Tendencia de varias semanas',
        descripcion:
          m.direccion === 'sube'
            ? `Cada vez más tiempo en ${actividad}`
            : `Cada vez menos tiempo en ${actividad}`,
        icono: 'trending-up',
      };
    default:
      return {
        titulo: 'Día distinto a lo habitual',
        descripcion: 'La forma general del día se apartó de su rutina',
        icono: 'calendar',
      };
  }
}

export function presentar(e: Evento): PresentacionEvento {
  const m = e.metadata;
  switch (e.event_type) {
    case 'fall':
      return m.confirmed === false
        ? {
            titulo: 'Posible caída sin confirmar',
            descripcion: `Se vio solo una parte del cuerpo${enLugar(e)} · seguimos observando`,
            icono: 'alert-triangle',
          }
        : {
            titulo: 'Posible caída detectada',
            descripcion: e.ubicacion ? `${e.ubicacion}` : 'Revisá cómo está',
            icono: 'alert-triangle',
          };
    case 'immobility': {
      const tiempo = m.duration_s != null ? duracion(m.duration_s) : 'Un rato largo';
      if (m.severity === 'alta') {
        return {
          titulo:
            m.trigger === 'post_fall_sospecha'
              ? 'Sin movimiento después de una posible caída'
              : 'Sin movimiento en el piso',
          descripcion: `${tiempo} sin moverse${enLugar(e)}`,
          icono: 'alert-octagon',
        };
      }
      return {
        titulo: 'Inactividad prolongada',
        descripcion: `${tiempo} sin movimiento${enLugar(e)}`,
        icono: 'clock',
      };
    }
    case 'routine_deviation':
      return desvioDeRutina(e);
    case 'activity': {
      const a = ACTIVIDADES[m.activity_label ?? 'Background'] ?? ACTIVIDADES.Background;
      return { titulo: a.titulo, descripcion: e.ubicacion ?? '', icono: a.icono };
    }
  }
}

/**
 * Eventos que no tiene sentido mostrar en el feed: los heartbeats de actividad en curso
 * (`ongoing: true`, el runner los emite cada ~60s para reconstruir duraciones) y "Background"
 * (no hay persona en cuadro).
 */
export function esVisibleEnFeed(e: Evento): boolean {
  if (e.event_type !== 'activity') return true;
  return !e.metadata.ongoing && e.metadata.activity_label !== 'Background';
}
