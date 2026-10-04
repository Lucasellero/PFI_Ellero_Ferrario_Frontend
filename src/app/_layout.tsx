/**
 * Layout raíz. Monta el tema (claro/oscuro) y la sesión, y decide qué rutas existen según haya
 * sesión o no (Stack.Protected): sin sesión solo se puede ver /login; con sesión, las pestañas.
 */
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { AuthProvider, useAuth } from '@/features/auth/AuthProvider';
import { TemaProvider, useTema } from '@/theme';

export default function RootLayout() {
  return (
    <TemaProvider>
      <AuthProvider>
        <Navegacion />
      </AuthProvider>
    </TemaProvider>
  );
}

function Navegacion() {
  const { usuario } = useAuth();
  const { colors, esquema } = useTema();
  return (
    <>
      <StatusBar style={esquema === 'oscuro' ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.fondo } }}>
        <Stack.Protected guard={usuario != null}>
          <Stack.Screen name="(tabs)" />
        </Stack.Protected>
        <Stack.Protected guard={usuario == null}>
          <Stack.Screen name="login" />
        </Stack.Protected>
      </Stack>
    </>
  );
}
