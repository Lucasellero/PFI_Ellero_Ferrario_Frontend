/**
 * Implementación real contra el backend cloud (FastAPI, repo Backend `cloud/`).
 * Auth: `Authorization: Bearer <firebase_id_token>` (ver `cloud/app/auth.py`).
 */
import { API_URL } from '@/config';

import type { Api } from './client';
import { ApiError } from './errors';
import type {
  Camara, Evento, FamiliarVinculado, KitVinculado, Perfil, ResumenRutina, SerieRutina,
} from './types';

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

  return {
    obtenerPerfil: () => request<Perfil>('/me'),
    crearPerfil: (datos) => request<Perfil>('/me', { method: 'POST', body: JSON.stringify(datos) }),
    listarEventos: (hogarId, { limit = 200, tipo, desde, hasta } = {}) => {
      const params = new URLSearchParams({ limit: String(limit) });
      if (tipo) params.set('tipo', tipo);
      if (desde) params.set('desde', desde);
      if (hasta) params.set('hasta', hasta);
      return request<Evento[]>(`/hogares/${hogarId}/eventos?${params.toString()}`);
    },
    marcarResuelta: (hogarId, eventoId) =>
      request<void>(`/hogares/${hogarId}/eventos/${eventoId}/resolver`, { method: 'POST' }),
    obtenerResumenRutina: (hogarId, periodo) =>
      request<ResumenRutina>(`/hogares/${hogarId}/rutina?periodo=${periodo}`),
    obtenerSerieRutina: (hogarId, indicador, periodo) =>
      request<SerieRutina>(`/hogares/${hogarId}/rutina/serie?indicador=${indicador}&periodo=${periodo}`),
    // Vinculación del kit: contrato en docs/vinculacion-kit.md.
    vincularKit: (codigo) =>
      request<KitVinculado>('/kits/vincular', { method: 'POST', body: JSON.stringify({ codigo }) }),
    listarCamaras: (hogarId) => request<Camara[]>(`/hogares/${hogarId}/camaras`),
    actualizarCamara: (hogarId, camaraId, cambios) =>
      request<Camara>(`/hogares/${hogarId}/camaras/${camaraId}`, {
        method: 'PATCH',
        body: JSON.stringify(cambios),
      }),
    guardarResidente: (hogarId, datos) =>
      request<void>(`/hogares/${hogarId}/residente`, { method: 'PUT', body: JSON.stringify(datos) }),
    listarFamiliares: (hogarId) => request<FamiliarVinculado[]>(`/hogares/${hogarId}/familiares`),
    invitarFamiliar: (hogarId, datos) =>
      request<FamiliarVinculado>(`/hogares/${hogarId}/familiares`, {
        method: 'POST',
        body: JSON.stringify(datos),
      }),
    cambiarRolFamiliar: (hogarId, familiarId, datos) =>
      request<FamiliarVinculado>(`/hogares/${hogarId}/familiares/${familiarId}`, {
        method: 'PATCH',
        body: JSON.stringify(datos),
      }),
    quitarFamiliar: (hogarId, familiarId) =>
      request<void>(`/hogares/${hogarId}/familiares/${familiarId}`, { method: 'DELETE' }),
  };
}
