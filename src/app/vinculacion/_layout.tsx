/**
 * Vinculación del kit + configuración inicial (cuenta sin hogar, o con el hogar a medio
 * configurar). El estado compartido entre pasos vive en `VinculacionProvider`.
 * Flujo y contrato con el backend: docs/vinculacion-kit.md.
 */
import { Stack } from 'expo-router';

import { VinculacionProvider } from '@/features/vinculacion/VinculacionProvider';
import { useTema } from '@/theme';

export default function VinculacionLayout() {
  const { colors } = useTema();
  return (
    <VinculacionProvider>
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.fondo } }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="escanear" />
        <Stack.Screen name="codigo" />
        {/* Desde el paso 2 no se vuelve al escaneo con el gesto: el kit ya quedó vinculado. */}
        <Stack.Screen name="residente" options={{ gestureEnabled: false }} />
        <Stack.Screen name="camaras" />
      </Stack>
    </VinculacionProvider>
  );
}
