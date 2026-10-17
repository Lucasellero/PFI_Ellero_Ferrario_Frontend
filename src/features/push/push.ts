/**
 * Notificaciones push (RF8) con `expo-notifications`. Solo Android por ahora: el backend manda
 * por FCM con `firebase-admin` (`cloud/app/notifications.py`), y `getDevicePushTokenAsync()` da
 * un token de FCM solo en Android — en iOS da un token de APNs crudo, que FCM no acepta. Ver
 * src/features/push/README.md.
 */
import Constants, { ExecutionEnvironment } from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { api } from '@/api/client';

/**
 * Canal de Android de las alertas. Tiene que coincidir con `defaultChannel` del plugin de
 * `expo-notifications` en `app.json`: el backend no manda `channel_id`, así que FCM usa el canal
 * por defecto del manifest. Una vez creado, Android no deja cambiarle la importancia.
 */
export const CANAL_ALERTAS = 'alertas';

/**
 * Si este build puede recibir push. Expo Go no puede (en Android las sacaron en SDK 53) ni la
 * web; iOS queda afuera hasta que haya cuenta de Apple Developer y token de FCM (ver README).
 */
export const PUSH_DISPONIBLE =
  Platform.OS === 'android' && Constants.executionEnvironment !== ExecutionEnvironment.StoreClient;

/**
 * Con la app abierta, la notificación igual se muestra (por defecto `expo-notifications` no la
 * muestra en primer plano). Una caída tiene que verse aunque el familiar esté mirando Reportes.
 */
export function configurarPresentacion() {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

/**
 * Crea el canal, pide permiso y devuelve el token de FCM del celular, o `null` si no hay push en
 * este build o el familiar no dio permiso. El canal va antes del permiso: en Android 13+ el
 * cartel de permiso no aparece si no existe al menos un canal.
 */
export async function obtenerTokenPush(): Promise<string | null> {
  if (!PUSH_DISPONIBLE) return null;

  await Notifications.setNotificationChannelAsync(CANAL_ALERTAS, {
    name: 'Alertas',
    description: 'Caídas, inmovilidad y cambios en la rutina.',
    importance: Notifications.AndroidImportance.MAX,
  });

  const actual = await Notifications.getPermissionsAsync();
  const permiso = actual.granted ? actual : await Notifications.requestPermissionsAsync();
  if (!permiso.granted) return null;

  return tokenDelCelular();
}

async function tokenDelCelular(): Promise<string | null> {
  const { data } = await Notifications.getDevicePushTokenAsync();
  return typeof data === 'string' ? data : null;
}

/** Cuánto puede demorar cerrar sesión por borrar el token (sin red no tiene que trabarse). */
const ESPERA_MAXIMA_BORRADO_MS = 3000;

/**
 * Al cerrar sesión: le pide al backend que deje de mandar push a este celular. Se llama ANTES
 * de cerrar la sesión de Firebase (el `DELETE` necesita el token de la cuenta). Nunca falla ni
 * demora más de 3 s: si no llega, el familiar igual sale, y el token queda hasta que otro
 * inicio de sesión (en este celular o en otro) lo pise.
 */
export async function dejarDeRecibirPush(): Promise<void> {
  if (!PUSH_DISPONIBLE) return;
  const borrar = async () => {
    if (!(await Notifications.getPermissionsAsync()).granted) return; // nunca se registró
    const token = await tokenDelCelular();
    if (token) await api.borrarPushToken(token);
  };
  const espera = new Promise<void>((r) => setTimeout(r, ESPERA_MAXIMA_BORRADO_MS));
  await Promise.race([borrar().catch((e) => console.warn('No se pudo borrar el token de push', e)), espera]);
}
