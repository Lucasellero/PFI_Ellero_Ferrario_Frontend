/**
 * Punto único de acceso a datos. Las pantallas importan `api` de acá y nunca saben si del otro
 * lado hay un mock o el backend real — se elige con EXPO_PUBLIC_API_MODE (ver src/config).
 */
import { API_MODE } from '@/config';

import { crearHttpApi } from './http';
import { crearMockApi } from './mock';
import type {
  Camara, DatosResidente, Evento, EventType, FamiliarVinculado, KitVinculado, Perfil, Periodo,
  ResumenRutina,
} from './types';

/** Devuelve el ID token de Firebase del usuario logueado (en modo mock, un token de prueba). */
export type TokenProvider = () => Promise<string | null>;

export interface Api {
  /** `GET /me`. */
  obtenerPerfil(): Promise<Perfil>;
  /**
   * `POST /me` — crea el `Familiar` de la cuenta recién registrada en Firebase (el backend saca
   * `firebase_uid` y `email` del token; la app manda el nombre).
   */
  crearPerfil(datos: { nombre: string }): Promise<Perfil>;
  /** `GET /hogares/{id}/eventos?limit=&tipo=&desde=&hasta=` (RF13: `desde`/`hasta` ISO 8601,
   * acotan por `occurred_at`; sin ellos, los últimos `limit`). */
  listarEventos(
    hogarId: number,
    opciones?: { limit?: number; tipo?: EventType; desde?: string; hasta?: string },
  ): Promise<Evento[]>;
  /** `POST /hogares/{id}/eventos/{evento_id}/resolver`. */
  marcarResuelta(hogarId: number, eventoId: number): Promise<void>;
  /** `GET /hogares/{id}/rutina?periodo=`: indicadores de rutina vs. historial del residente.
   * Lista vacía si todavía no hay suficiente historial (ver `cloud/app/rutina.py`). */
  obtenerResumenRutina(hogarId: number, periodo: Periodo): Promise<ResumenRutina>;

  // ── Vinculación del kit (ver docs/vinculacion-kit.md) ──────────────────────────
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

  // ── Familiares/roles (RF12) ─────────────────────────────────────────────────────
  /** `GET /hogares/{id}/familiares`. Cualquier familiar vinculado. */
  listarFamiliares(hogarId: number): Promise<FamiliarVinculado[]>;
  /**
   * `POST /hogares/{id}/familiares` con `{ email, rol }`. Solo `responsable_principal`. 404 si
   * esa persona todavía no tiene cuenta en la app (sin invitación pendiente, tiene que
   * registrarse primero). Idempotente: invitar a alguien ya vinculado devuelve su vínculo tal
   * cual, sin pisarle el rol.
   */
  invitarFamiliar(hogarId: number, datos: { email: string; rol: string }): Promise<FamiliarVinculado>;
  /** `PATCH /hogares/{id}/familiares/{familiar_id}` con `{ rol }`. Solo `responsable_principal`.
   * 409 si es el único `responsable_principal` del hogar y se le intenta bajar el rol. */
  cambiarRolFamiliar(hogarId: number, familiarId: number, datos: { rol: string }): Promise<FamiliarVinculado>;
  /** `DELETE /hogares/{id}/familiares/{familiar_id}`. Uno mismo siempre puede desvincularse; a
   * otro familiar, solo `responsable_principal`. 409 si es el único `responsable_principal`. */
  quitarFamiliar(hogarId: number, familiarId: number): Promise<void>;
}

let tokenProvider: TokenProvider = async () => null;

/** Lo llama `AuthProvider` al iniciar sesión, para que cada request lleve el token vigente. */
export function configurarTokenProvider(provider: TokenProvider) {
  tokenProvider = provider;
}

const obtenerToken = () => tokenProvider();

export const api: Api = API_MODE === 'http' ? crearHttpApi(obtenerToken) : crearMockApi(obtenerToken);

export { ApiError } from './errors';
