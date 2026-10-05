/**
 * Perfil del familiar logueado (`GET /me`) y en qué etapa está su cuenta. El layout raíz lo usa
 * para decidir qué rutas existen (ver src/app/_layout.tsx):
 *
 *   sin hogares                    → vinculación (escanear el QR del kit)
 *   hogar con `residente: null`    → vinculación, paso de configuración inicial
 *   hogar con residente            → pestañas
 *
 * Ver src/features/cuenta/README.md.
 */
import { createContext, use, useEffect, useState, type ReactNode } from 'react';

import { api } from '@/api/client';
import type { HogarApi, HogarResumen, Perfil } from '@/api/types';
import { useAuth } from '@/features/auth/AuthProvider';

export type EtapaCuenta = 'sin-sesion' | 'cargando' | 'error' | 'sin-hogar' | 'configurando' | 'lista';

interface CuentaContextValue {
  etapa: EtapaCuenta;
  perfil: Perfil | null;
  error: string | null;
  /** Hogar listo para usar (las pestañas). Hoy siempre el primero: no hay selector de hogar. */
  hogarActivo: HogarResumen | null;
  /** Hogar con el kit vinculado pero sin terminar la configuración inicial. */
  hogarPendiente: HogarApi | null;
  /** Vuelve a pedir `GET /me` (ej. después de vincular un kit o de cargar el residente). */
  recargarPerfil(): Promise<void>;
}

const CuentaContext = createContext<CuentaContextValue | null>(null);

type Resultado = { uid: string; perfil?: Perfil; error?: string };

const mensaje = (e: unknown) => (e instanceof Error ? e.message : 'No pudimos cargar tu cuenta.');

export function CuentaProvider({ children }: { children: ReactNode }) {
  const { usuario } = useAuth();
  // El resultado se guarda junto con el uid que lo pidió: si no coincide con el usuario actual
  // (recién logueado, o cambió de cuenta), todavía está cargando. Así no hace falta "resetear"
  // estado dentro de un effect.
  const [resultado, setResultado] = useState<Resultado>();

  const uid = usuario?.uid;
  useEffect(() => {
    if (!uid) return;
    let vigente = true;
    api
      .obtenerPerfil()
      .then((perfil) => vigente && setResultado({ uid, perfil }))
      .catch((e) => vigente && setResultado({ uid, error: mensaje(e) }));
    return () => {
      vigente = false;
    };
  }, [uid]);

  const actual = uid && resultado?.uid === uid ? resultado : undefined;
  const perfil = actual?.perfil ?? null;
  const hogarActivo = (perfil?.hogares.find((h) => h.residente != null) as HogarResumen | undefined) ?? null;
  const hogarPendiente = perfil?.hogares.find((h) => h.residente == null) ?? null;

  let etapa: EtapaCuenta;
  if (!uid) etapa = 'sin-sesion';
  else if (!actual) etapa = 'cargando';
  else if (actual.error) etapa = 'error';
  else if (hogarActivo) etapa = 'lista';
  else if (hogarPendiente) etapa = 'configurando';
  else etapa = 'sin-hogar';

  const value: CuentaContextValue = {
    etapa,
    perfil,
    error: actual?.error ?? null,
    hogarActivo,
    hogarPendiente,
    async recargarPerfil() {
      if (!uid) return;
      try {
        setResultado({ uid, perfil: await api.obtenerPerfil() });
      } catch (e) {
        setResultado({ uid, error: mensaje(e) });
      }
    },
  };

  return <CuentaContext value={value}>{children}</CuentaContext>;
}

export function useCuenta(): CuentaContextValue {
  const ctx = use(CuentaContext);
  if (!ctx) throw new Error('useCuenta tiene que usarse dentro de <CuentaProvider>');
  return ctx;
}
