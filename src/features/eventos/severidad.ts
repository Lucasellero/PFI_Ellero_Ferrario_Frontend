/**
 * Regla única evento -> severidad visual (semáforo del informe, Sección "Mockups"):
 * rojo = urgente, amarillo = moderada, verde = rutina. Ver README de esta carpeta.
 */
import type { Evento } from '@/api/types';
import type { Colores } from '@/theme';

export type Severidad = 'urgente' | 'moderada' | 'rutina';

export function severidadDe(evento: Evento): Severidad {
  const m = evento.metadata;
  switch (evento.event_type) {
    case 'fall':
      // confirmed=false: caída de evidencia parcial / clasificador indeciso — el backend no la
      // marca como alerta dura (cloud/app/alertas.py), pero sí merece atención.
      return m.confirmed === false ? 'moderada' : 'urgente';
    case 'immobility':
      // "alta" = inmóvil en el piso (RF4). "baja" = sedentarismo sentado (RF3).
      return m.severity === 'alta' ? 'urgente' : 'moderada';
    case 'routine_deviation':
      return 'moderada';
    case 'activity':
      return 'rutina';
  }
}

/**
 * Nombre de la severidad en palabras: etiqueta del detalle y texto para lectores de pantalla
 * (el color solo no alcanza para quien no lo ve).
 */
export const ETIQUETA_SEVERIDAD: Record<Severidad, string> = {
  urgente: 'Alerta urgente',
  moderada: 'Alerta moderada',
  rutina: 'Rutina',
};

/** Urgentes y moderadas quedan fijadas arriba del feed hasta ser atendidas. */
export function requiereAtencion(evento: Evento): boolean {
  return severidadDe(evento) !== 'rutina' && !evento.resuelta;
}

/**
 * Colores de una severidad en el tema activo (`colors` sale de `useTema()`).
 * `fuerte`: color oficial del semáforo (borde de la tarjeta, punto de no leído).
 * `suave`: fondo del ícono o la etiqueta. `texto`: ícono y texto encima de `suave`.
 */
export function coloresSeveridad(
  severidad: Severidad,
  colors: Colores,
): { fuerte: string; suave: string; texto: string } {
  switch (severidad) {
    case 'urgente':
      return { fuerte: colors.urgente, suave: colors.urgenteSuave, texto: colors.urgenteTexto };
    case 'moderada':
      return { fuerte: colors.moderada, suave: colors.moderadaSuave, texto: colors.moderadaTexto };
    case 'rutina':
      return { fuerte: colors.rutina, suave: colors.rutinaSuave, texto: colors.rutinaTexto };
  }
}
