/**
 * Formateo de fechas/duraciones en español. A mano y no con `Intl` a propósito: el soporte de
 * locales de `Intl` en Hermes (el motor JS de React Native) varía según plataforma/versión.
 */

const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
const DIAS_CORTOS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const MESES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];

const mayuscula = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** "Jueves 13 de agosto" */
export function fechaLarga(d: Date): string {
  return `${mayuscula(DIAS[d.getDay()])} ${d.getDate()} de ${MESES[d.getMonth()]}`;
}

/** "14:20" */
export function hora(d: Date): string {
  return `${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
}

/** Minuto del día (0–1439) -> "14:30". */
export function horaDesdeMinutos(minutoDelDia: number): string {
  const h = Math.floor(minutoDelDia / 60);
  const m = Math.round(minutoDelDia % 60);
  return `${h}:${String(m).padStart(2, '0')}`;
}

export function mismoDia(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
  );
}

/** "14:20" si es hoy, "Ayer · 14:20", o "Mar · 14:20". */
export function cuandoCorto(d: Date, ahora = new Date()): string {
  if (mismoDia(d, ahora)) return hora(d);
  const ayer = new Date(ahora);
  ayer.setDate(ahora.getDate() - 1);
  if (mismoDia(d, ayer)) return `Ayer · ${hora(d)}`;
  return `${DIAS_CORTOS[d.getDay()]} ${d.getDate()} · ${hora(d)}`;
}

/** Como `cuandoCorto` pero explicitando "Hoy": "Hoy 14:20". */
export function cuandoConDia(d: Date, ahora = new Date()): string {
  return mismoDia(d, ahora) ? `Hoy ${hora(d)}` : cuandoCorto(d, ahora);
}

/** Segundos ->"3 min", "2 h 40 min", "3 h". */
export function duracion(segundos: number): string {
  const totalMin = Math.round(segundos / 60);
  if (totalMin < 60) return `${totalMin} min`;
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return m === 0 ? `${h} h` : `${h} h ${m} min`;
}

/** "hace 8 minutos", "hace 2 h". */
export function haceCuanto(d: Date, ahora = new Date()): string {
  const min = Math.max(0, Math.round((ahora.getTime() - d.getTime()) / 60_000));
  if (min < 1) return 'recién';
  if (min < 60) return `hace ${min} ${min === 1 ? 'minuto' : 'minutos'}`;
  const h = Math.floor(min / 60);
  if (h < 24) return `hace ${h} h`;
  const dias = Math.floor(h / 24);
  return `hace ${dias} ${dias === 1 ? 'día' : 'días'}`;
}

/** Primer nombre: "Rosa Méndez" -> "Rosa". */
export function primerNombre(nombre: string): string {
  return nombre.trim().split(/\s+/)[0] ?? nombre;
}
