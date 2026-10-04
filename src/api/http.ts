/**
 * Implementación real contra el backend cloud (FastAPI, repo Backend `cloud/`).
 * Auth: `Authorization: Bearer <firebase_id_token>` (ver `cloud/app/auth.py`).
 */
import { API_URL } from '@/config';

import type { Api } from './client';
import { ApiError } from './errors';
import type { Evento } from './types';

export function crearHttpApi(obtenerToken: () => Promise<string | null>): Api {
  async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const token = await obtenerToken();
    const res = await fetch(`${API_URL}${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...init.headers,
      },
    });
    if (!res.ok) {
      // FastAPI devuelve {"detail": "..."}; 501 = el backend no tiene Firebase configurado.
      const body = await res.json().catch(() => null);
      throw new ApiError(res.status, body?.detail ?? `Error ${res.status}`);
    }
    return (res.status === 204 ? undefined : await res.json()) as T;
  }

  function pendiente(endpoint: string): never {
    throw new ApiError(501, `${endpoint} todavía no existe en el backend (ver src/api/README.md)`);
  }

  return {
    obtenerPerfil: async () => pendiente('GET /me'),
    listarEventos: (hogarId, { limit = 200 } = {}) =>
      request<Evento[]>(`/hogares/${hogarId}/eventos?limit=${limit}`),
    marcarResuelta: async () => pendiente('marcar alerta como resuelta'),
    obtenerResumenRutina: async () => pendiente('resumen de rutina'),
  };
}
