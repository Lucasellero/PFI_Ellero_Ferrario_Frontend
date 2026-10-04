/**
 * Estado compartido del hogar que mira el familiar: perfil, residente y eventos. Vive arriba de
 * las pestañas para que Notificaciones (y el badge de la pestaña) y Reportes lean la misma lista
 * sin pedirla dos veces. Ver src/features/hogar/README.md.
 */
import { createContext, use, useEffect, useState, type ReactNode } from 'react';

import { api } from '@/api/client';
import type { Evento, HogarResumen, Perfil } from '@/api/types';

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
        setEventos(await api.listarEventos(hogar.id));
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
