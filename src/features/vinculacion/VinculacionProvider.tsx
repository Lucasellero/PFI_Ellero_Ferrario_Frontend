/**
 * Estado compartido entre los pasos de la vinculación (ver README de esta carpeta):
 *
 *   1. Vincular el kit   — escanear el QR o tipear el código → `POST /kits/vincular`
 *   2. Residente         — nombre y teléfono (se guarda como borrador)
 *   3. Cámaras           — ubicación de cada una; "Terminar" guarda cámaras + residente
 *
 * El residente se guarda AL FINAL a propósito: que el hogar tenga residente es lo que marca la
 * configuración como terminada (ver `CuentaProvider`), y en ese momento la app pasa sola a las
 * pestañas. Si se guardara en el paso 2, el paso 3 nunca se vería.
 */
import { router } from 'expo-router';
import { createContext, use, useState, type ReactNode } from 'react';

import { api, ApiError } from '@/api/client';
import type { DatosResidente } from '@/api/types';
import { useCuenta } from '@/features/cuenta/CuentaProvider';

export const TOTAL_PASOS = 3;

interface VinculacionContextValue {
  /** Datos del residente cargados en el paso 2, todavía no enviados. */
  borradorResidente: DatosResidente | null;
  guardarBorradorResidente(datos: DatosResidente): void;
  /**
   * Vincula el kit con el código (ya validado) y pasa al paso 2. Devuelve un mensaje de error
   * para mostrar, o null si salió bien.
   */
  vincular(codigo: string): Promise<string | null>;
}

const VinculacionContext = createContext<VinculacionContextValue | null>(null);

/** Mensajes para el familiar según la respuesta del backend (contrato en docs/vinculacion-kit.md). */
function mensajeVinculacion(e: unknown): string {
  if (e instanceof ApiError) {
    if ([404, 409, 429].includes(e.status)) return e.message;
    if (e.status === 501) return 'La vinculación todavía no está disponible en el servidor.';
  }
  return 'No pudimos vincular el kit. Revisá tu conexión y probá de nuevo.';
}

export function VinculacionProvider({ children }: { children: ReactNode }) {
  const { recargarPerfil } = useCuenta();
  const [borradorResidente, setBorradorResidente] = useState<DatosResidente | null>(null);

  const value: VinculacionContextValue = {
    borradorResidente,
    guardarBorradorResidente: setBorradorResidente,
    async vincular(codigo) {
      try {
        await api.vincularKit(codigo);
      } catch (e) {
        return mensajeVinculacion(e);
      }
      // `GET /me` ahora trae el hogar nuevo (sin residente) → etapa "configurando".
      await recargarPerfil();
      router.replace('/vinculacion/residente');
      return null;
    },
  };

  return <VinculacionContext value={value}>{children}</VinculacionContext>;
}

export function useVinculacion(): VinculacionContextValue {
  const ctx = use(VinculacionContext);
  if (!ctx) throw new Error('useVinculacion tiene que usarse dentro de <VinculacionProvider>');
  return ctx;
}
