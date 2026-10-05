/**
 * Layout raíz. Monta el tema (claro/oscuro), la sesión y la cuenta, y decide qué rutas existen
 * según la etapa de la cuenta (Stack.Protected; ver features/cuenta/CuentaProvider.tsx):
 *
 *   sin sesión                → /login, /registro
 *   con sesión, sin hogar     → /vinculacion (escanear el QR del kit)
 *   hogar a medio configurar  → /vinculacion (retoma en el paso 2)
 *   hogar listo               → pestañas
 *
 * Mientras se carga el perfil (o si falla), se muestra una capa encima del Stack en vez de
 * reemplazarlo: el navegador raíz tiene que estar siempre montado.
 */
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { EstadoCarga } from '@/components/EstadoCarga';
import { AuthProvider, useAuth } from '@/features/auth/AuthProvider';
import { CuentaProvider, useCuenta } from '@/features/cuenta/CuentaProvider';
import { spacing, TemaProvider, useTema } from '@/theme';

export default function RootLayout() {
  return (
    <TemaProvider>
      <AuthProvider>
        <CuentaProvider>
          <Navegacion />
        </CuentaProvider>
      </AuthProvider>
    </TemaProvider>
  );
}

function Navegacion() {
  const { cerrarSesion } = useAuth();
  const { etapa, error, recargarPerfil } = useCuenta();
  const { colors, esquema } = useTema();

  const enVinculacion = etapa === 'sin-hogar' || etapa === 'configurando';
  // Mientras carga el perfil (o falló) sigue disponible el login, tapado por la capa de abajo.
  const sinCuentaLista = etapa === 'sin-sesion' || etapa === 'cargando' || etapa === 'error';

  return (
    <>
      <StatusBar style={esquema === 'oscuro' ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.fondo } }}>
        <Stack.Protected guard={etapa === 'lista'}>
          <Stack.Screen name="(tabs)" />
        </Stack.Protected>
        <Stack.Protected guard={enVinculacion}>
          <Stack.Screen name="vinculacion" />
        </Stack.Protected>
        <Stack.Protected guard={sinCuentaLista}>
          <Stack.Screen name="login" />
          <Stack.Screen name="registro" />
        </Stack.Protected>
      </Stack>

      {(etapa === 'cargando' || etapa === 'error') && (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.fondo }]}>
          <EstadoCarga cargando={etapa === 'cargando'} error={error} onReintentar={recargarPerfil} />
          {etapa === 'error' && (
            <Pressable onPress={cerrarSesion} accessibilityRole="button" style={estilos.salir}>
              <Text style={{ color: colors.acento, fontSize: 15, fontWeight: '600' }}>Cerrar sesión</Text>
            </Pressable>
          )}
        </View>
      )}
    </>
  );
}

const estilos = StyleSheet.create({
  salir: {
    alignSelf: 'center',
    padding: spacing.md,
    marginBottom: spacing.xxl * 2,
  },
});
