/**
 * Tema activo (claro / oscuro). Por defecto sigue al celular; desde Perfil se puede forzar uno.
 * La preferencia se guarda en AsyncStorage y se aplica con `Appearance.setColorScheme`, así
 * también los elementos nativos (alertas, teclado) quedan en el mismo modo que la app.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, use, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Appearance, useColorScheme } from 'react-native';

import { crearTipografia, paletaClara, paletaOscura, type Colores, type Tipografia } from './paletas';

export type PreferenciaTema = 'sistema' | 'claro' | 'oscuro';

export interface Tema {
  esquema: 'claro' | 'oscuro';
  colors: Colores;
  typography: Tipografia;
  preferencia: PreferenciaTema;
  cambiarPreferencia(p: PreferenciaTema): void;
}

const CLAVE = 'lares.preferenciaTema';
const TemaContext = createContext<Tema | null>(null);

const TIPOGRAFIA_CLARA = crearTipografia(paletaClara);
const TIPOGRAFIA_OSCURA = crearTipografia(paletaOscura);

function aplicar(p: PreferenciaTema) {
  Appearance.setColorScheme(p === 'sistema' ? 'unspecified' : p === 'oscuro' ? 'dark' : 'light');
}

export function TemaProvider({ children }: { children: ReactNode }) {
  const [preferencia, setPreferencia] = useState<PreferenciaTema>('sistema');
  // Con la preferencia aplicada vía Appearance, este hook ya devuelve el modo efectivo.
  const sistema = useColorScheme();
  const esquema = sistema === 'dark' ? 'oscuro' : 'claro';

  useEffect(() => {
    AsyncStorage.getItem(CLAVE)
      .then((guardada) => {
        if (guardada === 'claro' || guardada === 'oscuro') {
          setPreferencia(guardada);
          aplicar(guardada);
        }
      })
      .catch(() => {
        // Sin almacenamiento disponible: se queda en "sistema".
      });
  }, []);

  const value = useMemo<Tema>(
    () => ({
      esquema,
      colors: esquema === 'oscuro' ? paletaOscura : paletaClara,
      typography: esquema === 'oscuro' ? TIPOGRAFIA_OSCURA : TIPOGRAFIA_CLARA,
      preferencia,
      cambiarPreferencia(p) {
        setPreferencia(p);
        aplicar(p);
        AsyncStorage.setItem(CLAVE, p).catch(() => {});
      },
    }),
    [esquema, preferencia],
  );

  return <TemaContext value={value}>{children}</TemaContext>;
}

export function useTema(): Tema {
  const ctx = use(TemaContext);
  if (!ctx) throw new Error('useTema tiene que usarse dentro de <TemaProvider>');
  return ctx;
}

/**
 * Estilos que dependen del tema. `fabrica` tiene que estar definida a nivel de módulo (fuera del
 * componente) para que se recalcule solo al cambiar de modo:
 *
 *   const crearEstilos = ({ colors }: Tema) => StyleSheet.create({ ... });
 *   const styles = useEstilos(crearEstilos);
 */
export function useEstilos<T>(fabrica: (tema: Tema) => T): T {
  const tema = useTema();
  return useMemo(() => fabrica(tema), [fabrica, tema]);
}
