/**
 * Estado compartido del hogar que mira el familiar: perfil, residente y eventos. Vive arriba de
 * las pestañas para que Notificaciones (y el badge de la pestaña) y Reportes lean la misma lista
 * sin pedirla dos veces. Ver src/features/hogar/README.md.
 */
import * as Notifications from 'expo-notifications';
import { createContext, use, useEffect, useState, type ReactNode } from 'react';
import { AppState } from 'react-native';

import { api } from '@/api/client';
import type { Evento, HogarResumen, Perfil } from '@/api/types';
import { useCuenta } from '@/features/cuenta/CuentaProvider';
import { PUSH_DISPONIBLE } from '@/features/push/push';

/**
 * Cada cuánto se piden los eventos con la app abierta. Era el reemplazo provisorio de las push
 * (RF8); ahora que llegan (solo Android, development build), sigue por Expo Go/iOS y porque el
 * backend no manda push de todos los tipos de evento. Se puede espaciar una vez probadas.
 */
const INTERVALO_ACTUALIZACION_MS = 30_000;

/**
 * Aplica una lista nueva sin "desresolver" alertas: si una consulta salió antes de que el
 * familiar marcara una alerta como resuelta, su respuesta trae `resuelta: false` y la alerta
 * volvería a aparecer fijada por unos segundos.
 */
function fusionarEventos(previos: Evento[], nuevos: Evento[]): Evento[] {
  const resueltas = new Set(previos.filter((e) => e.resuelta).map((e) => e.id));
  return nuevos.map((e) => (resueltas.has(e.id) && !e.resuelta ? { ...e, resuelta: true } : e));
}

interface HogarContextValue {
  perfil: Perfil | null;
  /** Hogar activo. Hoy siempre el primero (la app no tiene selector de hogar todavía). */
  hogar: HogarResumen | null;
  eventos: Evento[];
  cargando: boolean;
  error: string | null;
  recargar(): Promise<void>;
  marcarResuelta(eventoId: number): Promise<void>;
}

const HogarContext = createContext<HogarContextValue | null>(null);

const mensajeDeError = (e: unknown) => (e instanceof Error ? e.message : 'Error desconocido');

/** Eventos de un hogar. No toca estado de React: devuelve el resultado o el error. */
async function pedirEventos(hogarId: number): Promise<{ eventos: Evento[] } | { error: string }> {
  try {
    return { eventos: await api.listarEventos(hogarId) };
  } catch (e) {
    return { error: mensajeDeError(e) };
  }
}

export function HogarProvider({ children }: { children: ReactNode }) {
  // El perfil y el hogar los carga `CuentaProvider` (hacen falta antes, para decidir si mostrar
  // la vinculación o las pestañas). Acá solo viven los eventos.
  const { perfil, hogarActivo: hogar, recargarPerfil } = useCuenta();
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  function aplicarResultado(r: { eventos: Evento[] } | { error: string }) {
    if ('error' in r) {
      setError(r.error);
    } else {
      setEventos(r.eventos);
      setError(null);
    }
    setCargando(false);
  }

  // Carga inicial. `cargando` ya arranca en true; el estado se actualiza recién cuando
  // llega la respuesta (setState sincrónico dentro de un effect es un antipatrón).
  const idInicial = hogar?.id;
  useEffect(() => {
    if (idInicial == null) return;
    let vigente = true;
    pedirEventos(idInicial).then((r) => vigente && aplicarResultado(r));
    return () => {
      vigente = false;
    };
  }, [idInicial]);

  // Actualización automática: cada 30 s con la app en primer plano, apenas vuelve a primer
  // plano (el familiar abre la app después de un rato, o tocó una push) y al llegar una push. En segundo plano no consulta: iOS y
  // Android pausan los timers igual, y así no gasta batería ni datos.
  // Es silenciosa: no muestra el spinner de "tirar para actualizar" y, si falla, deja la lista
  // que ya había (el próximo intento la corrige).
  const hogarId = hogar?.id;
  useEffect(() => {
    if (hogarId == null) return;
    let vigente = true;
    const actualizar = () => {
      api
        .listarEventos(hogarId)
        .then((nuevos) => vigente && setEventos((previos) => fusionarEventos(previos, nuevos)))
        .catch(() => {});
    };

    let intervalo = setInterval(actualizar, INTERVALO_ACTUALIZACION_MS);
    const suscripcion = AppState.addEventListener('change', (estado) => {
      clearInterval(intervalo);
      if (estado === 'active') {
        actualizar();
        intervalo = setInterval(actualizar, INTERVALO_ACTUALIZACION_MS);
      }
    });
    // Llegó una push con la app abierta: el evento ya está en el backend, traerlo sin esperar
    // la próxima vuelta del intervalo.
    const push = PUSH_DISPONIBLE ? Notifications.addNotificationReceivedListener(actualizar) : null;
    return () => {
      vigente = false;
      clearInterval(intervalo);
      suscripcion.remove();
      push?.remove();
    };
  }, [hogarId]);

  const value: HogarContextValue = {
    perfil,
    hogar,
    eventos,
    cargando,
    error,
    async recargar() {
      if (!hogar) return recargarPerfil();
      try {
        const nuevos = await api.listarEventos(hogar.id);
        setEventos((previos) => fusionarEventos(previos, nuevos));
        setError(null);
      } catch (e) {
        setError(mensajeDeError(e));
      }
    },
    async marcarResuelta(eventoId) {
      if (!hogar) return;
      // Optimista: se marca ya en pantalla y se revierte si el backend falla.
      const marcar = (resuelta: boolean) =>
        setEventos((prev) => prev.map((e) => (e.id === eventoId ? { ...e, resuelta } : e)));
      marcar(true);
      try {
        await api.marcarResuelta(hogar.id, eventoId);
      } catch (e) {
        marcar(false);
        throw e;
      }
    },
  };

  return <HogarContext value={value}>{children}</HogarContext>;
}

export function useHogar(): HogarContextValue {
  const ctx = use(HogarContext);
  if (!ctx) throw new Error('useHogar tiene que usarse dentro de <HogarProvider>');
  return ctx;
}

/** Tiempo mínimo que se ve el spinner, aunque la respuesta llegue antes. */
const DURACION_MINIMA_SPINNER_MS = 600;

/**
 * "Tirar para actualizar" de UNA pantalla: cada pantalla con `RefreshControl` usa su propio
 * hook, así el spinner solo aparece en la lista que el familiar tiró.
 *
 * Por qué no vive en el contexto: las pestañas quedan montadas aunque no se vean, y si el
 * `refreshing` fuera compartido, tirar en Reportes activaría también el spinner de
 * Notificaciones (oculta). En iOS ese spinner arrancado por código en una lista que no se ve
 * quedaba trabado arriba de la pantalla. Lo mismo si la respuesta vuelve antes de que termine
 * la animación de entrada: por eso la duración mínima.
 */
export function useRecargaManual() {
  const { recargar } = useHogar();
  const [refrescando, setRefrescando] = useState(false);

  async function onRefrescar() {
    setRefrescando(true);
    await Promise.all([recargar(), new Promise((r) => setTimeout(r, DURACION_MINIMA_SPINNER_MS))]);
    setRefrescando(false);
  }

  return { refrescando, onRefrescar };
}
