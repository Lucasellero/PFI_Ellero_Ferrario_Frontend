/**
 * Stack interno de la cuenta "lista": envuelve las pestañas y las pantallas que se empujan
 * desde Perfil (editar residente/cámaras, familiares) bajo el mismo `HogarProvider`, para que
 * `useHogar()` funcione en las tres.
 *
 * Antes `editar-residente`/`editar-camaras`/`familiares` vivían como rutas sueltas en la raíz
 * (hermanas de `(tabs)`), fuera del árbol donde se monta `HogarProvider` — al navegar ahí desde
 * Perfil, React las desmontaba de `(tabs)` y las montaba en la raíz sin el contexto, tirando
 * "useHogar tiene que usarse dentro de <HogarProvider>" (encontrado probando en un celular,
 * 2026-10-07). Anidarlas todas acá, bajo un solo `HogarProvider`, lo resuelve.
 */
import { Stack } from 'expo-router';

import { HogarProvider } from '@/features/hogar/HogarProvider';
import { useTema } from '@/theme';

export default function AppLayout() {
  const { colors } = useTema();
  return (
    <HogarProvider>
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.fondo } }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="editar-residente" />
        <Stack.Screen name="editar-camaras" />
        <Stack.Screen name="familiares" />
      </Stack>
    </HogarProvider>
  );
}
