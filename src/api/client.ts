/**
 * Punto único de acceso a datos. Las pantallas importan `api` de acá y nunca saben si del otro
 * lado hay un mock o el backend real — se elige con EXPO_PUBLIC_API_MODE (ver src/config).
 */
import { API_MODE } from '@/config';

import { crearHttpApi } from './http';
import { crearMockApi } from './mock';
import type { Evento, Perfil, Periodo, ResumenRutina } from './types';

/** Devuelve el ID token de Firebase del usuario logueado (o null en modo mock). */
export type TokenProvider = () => Promise<string | null>;

export interface Api {
  /** PENDIENTE BACKEND: `GET /me`. */
  obtenerPerfil(): Promise<Perfil>;
  /** `GET /hogares/{id}/eventos?limit=` (existe). */
  listarEventos(hogarId: number, opciones?: { limit?: number }): Promise<Evento[]>;
  /** PENDIENTE BACKEND: marcar una alerta como atendida. */
  marcarResuelta(hogarId: number, eventoId: number): Promise<void>;
  /** PENDIENTE BACKEND: indicadores de rutina vs. línea base. */
  obtenerResumenRutina(hogarId: number, periodo: Periodo): Promise<ResumenRutina>;
}

let tokenProvider: TokenProvider = async () => null;

/** Lo llama `AuthProvider` al iniciar sesión, para que cada request lleve el token vigente. */
export function configurarTokenProvider(provider: TokenProvider) {
  tokenProvider = provider;
}

export const api: Api =
  API_MODE === 'http' ? crearHttpApi(() => tokenProvider()) : crearMockApi();

export { ApiError } from './errors';
