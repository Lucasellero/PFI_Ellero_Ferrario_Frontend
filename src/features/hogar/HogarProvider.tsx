/**
 * Estado compartido del hogar que mira el familiar: perfil, residente y eventos. Vive arriba de
 * las pestañas para que Notificaciones (y el badge de la pestaña) y Reportes lean la misma lista
 * sin pedirla dos veces. Ver src/features/hogar/README.md.
 */
import { createContext, use, useEffect, useState, type ReactNode } from 'react';
import { AppState } from 'react-native';

import { api } from '@/api/client';
import type { Evento, HogarResumen, Perfil } from '@/api/types';

/**
 * Cada cuánto se piden los eventos con la app abierta. Es el reemplazo provisorio de las push
 * (RF8): con FCM el aviso llega solo y esto puede espaciarse o quitarse.
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
  /** true mientras corre un "tirar para actualizar" (la lista sigue visible). */
  refrescando: boolean;
  error: string | null;
  recargar(): Promise<void>;
  marcarResuelta(eventoId: number): Promise<void>;
}

const HogarContext = createContext<HogarContextValue | null>(null);

const mensajeDeError = (e: unknown) => (e instanceof Error ? e.message : 'Error desconocido');

/** Perfil + eventos del primer hogar. No toca estado de React: devuelve el resultado o el error. */
async function pedirPerfilYEventos(): Promise<{ perfil: Perfil; eventos: Evento[] } | { error: string }> {
  try {
    const perfil = await api.obtenerPerfil();
    const h = perfil.hogares[0];
    return { perfil, eventos: h ? await api.listarEventos(h.id) : [] };
  } catch (e) {
    return { error: mensajeDeError(e) };
  }
}

export function HogarProvider({ children }: { children: ReactNode }) {
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [cargando, setCargando] = useState(true);
  const [refrescando, setRefrescando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hogar = perfil?.hogares[0] ?? null;

  function aplicarResultado(r: { perfil: Perfil; eventos: Evento[] } | { error: string }) {
    if ('error' in r) {
      setError(r.error);
    } else {
      setPerfil(r.perfil);
      setEventos(r.eventos);
      setError(null);
    }
    setCargando(false);
  }

  async function cargarTodo() {
    setCargando(true);
    setError(null);
    aplicarResultado(await pedirPerfilYEventos());
  }

  // Carga inicial. `cargando` ya arranca en true; el estado se actualiza recién cuando
  // llega la respuesta (setState sincrónico dentro de un effect es un antipatrón).
  useEffect(() => {
    let vigente = true;
    pedirPerfilYEventos().then((r) => vigente && aplicarResultado(r));
    return () => {
      vigente = false;
    };
  }, []);

  // Actualización automática: cada 30 s con la app en primer plano, y apenas vuelve a primer
  // plano (el familiar abre la app después de un rato). En segundo plano no consulta: iOS y
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
    return () => {
      vigente = false;
      clearInterval(intervalo);
      suscripcion.remove();
    };
  }, [hogarId]);

  const value: HogarContextValue = {
    perfil,
    hogar,
    eventos,
    cargando,
    refrescando,
    error,
    async recargar() {
      if (!hogar) return cargarTodo();
      setRefrescando(true);
      try {
        const nuevos = await api.listarEventos(hogar.id);
        setEventos((previos) => fusionarEventos(previos, nuevos));
        setError(null);
      } catch (e) {
        setError(mensajeDeError(e));
      } finally {
        setRefrescando(false);
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
