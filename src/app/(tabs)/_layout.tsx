/**
 * Pestañas de la app logueada (Notificaciones / Reportes / Perfil). `HogarProvider` vive acá:
 * se monta al iniciar sesión y se descarta al cerrarla, así no quedan datos de otra cuenta.
 */
import Feather from '@expo/vector-icons/Feather';
import { Tabs } from 'expo-router';

import { esVisibleEnFeed } from '@/features/eventos/presentacion';
import { requiereAtencion } from '@/features/eventos/severidad';
import { HogarProvider, useHogar } from '@/features/hogar/HogarProvider';
import { useTema } from '@/theme';

export default function TabsLayout() {
  return (
    <HogarProvider>
      <Pestanas />
    </HogarProvider>
  );
}

function Pestanas() {
  const { eventos } = useHogar();
  const { colors } = useTema();
  const pendientes = eventos.filter((e) => esVisibleEnFeed(e) && requiereAtencion(e)).length;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: colors.fondo },
        tabBarActiveTintColor: colors.acento,
        tabBarInactiveTintColor: colors.textoSecundario,
        tabBarStyle: { backgroundColor: colors.superficie, borderTopColor: colors.borde },
        tabBarLabelStyle: { fontSize: 12, fontWeight: '600' },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Notificaciones',
          tabBarIcon: ({ color, size }) => <Feather name="bell" color={color} size={size} />,
          tabBarBadge: pendientes > 0 ? pendientes : undefined,
          tabBarBadgeStyle: { backgroundColor: colors.urgente },
        }}
      />
      <Tabs.Screen
        name="reportes"
        options={{
          title: 'Reportes',
          tabBarIcon: ({ color, size }) => <Feather name="bar-chart-2" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="perfil"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color, size }) => <Feather name="user" color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}
