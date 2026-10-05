/**
 * Punto único de acceso a datos. Las pantallas importan `api` de acá y nunca saben si del otro
 * lado hay un mock o el backend real — se elige con EXPO_PUBLIC_API_MODE (ver src/config).
 */
import { API_MODE } from '@/config';

import { crearHttpApi } from './http';
import { crearMockApi } from './mock';
import type { Camara, DatosResidente, Evento, KitVinculado, Perfil, Periodo, ResumenRutina } from './types';

/** Devuelve el ID token de Firebase del usuario logueado (en modo mock, un token de prueba). */
export type TokenProvider = () => Promise<string | null>;

export interface Api {
  /** PENDIENTE BACKEND: `GET /me`. */
  obtenerPerfil(): Promise<Perfil>;
  /**
   * PENDIENTE BACKEND: `POST /me` — crea el `Familiar` de la cuenta recién registrada en
   * Firebase (el backend saca `firebase_uid` y `email` del token; la app manda el nombre).
   */
  crearPerfil(datos: { nombre: string }): Promise<Perfil>;
  /** `GET /hogares/{id}/eventos?limit=` (existe). */
  listarEventos(hogarId: number, opciones?: { limit?: number }): Promise<Evento[]>;
  /** PENDIENTE BACKEND: marcar una alerta como atendida. */
  marcarResuelta(hogarId: number, eventoId: number): Promise<void>;
  /** PENDIENTE BACKEND: indicadores de rutina vs. línea base. */
  obtenerResumenRutina(hogarId: number, periodo: Periodo): Promise<ResumenRutina>;

  // ── Vinculación del kit (todo PENDIENTE BACKEND — ver docs/vinculacion-kit.md) ──
  /**
   * `POST /kits/vincular` con el código del QR. Crea el hogar (si el kit no tenía) y deja al
   * familiar como `responsable_principal`. Errores: 404 código inexistente, 409 kit ya
   * vinculado, 429 demasiados intentos.
   */
  vincularKit(codigo: string): Promise<KitVinculado>;
  /** `GET /hogares/{id}/camaras`. */
  listarCamaras(hogarId: number): Promise<Camara[]>;
  /** `PATCH /hogares/{id}/camaras/{camara_id}` con `{ ubicacion }`. */
  actualizarCamara(hogarId: number, camaraId: number, cambios: { ubicacion: string }): Promise<Camara>;
  /** `PUT /hogares/{id}/residente` — crea o actualiza el residente (1:1 con el hogar). */
  guardarResidente(hogarId: number, datos: DatosResidente): Promise<void>;
}

let tokenProvider: TokenProvider = async () => null;

/** Lo llama `AuthProvider` al iniciar sesión, para que cada request lleve el token vigente. */
export function configurarTokenProvider(provider: TokenProvider) {
  tokenProvider = provider;
}

const obtenerToken = () => tokenProvider();

export const api: Api = API_MODE === 'http' ? crearHttpApi(obtenerToken) : crearMockApi(obtenerToken);

export { ApiError } from './errors';
