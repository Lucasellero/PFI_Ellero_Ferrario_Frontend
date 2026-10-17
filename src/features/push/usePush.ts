/**
 * Cableado de las push con la sesión. Lo usa el layout raíz (src/app/_layout.tsx), una sola vez.
 * Ver src/features/push/README.md.
 */
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { useEffect, useRef } from 'react';

import { api } from '@/api/client';

import { configurarPresentacion, obtenerTokenPush, PUSH_DISPONIBLE } from './push';

configurarPresentacion();

interface Opciones {
  /** Usuario logueado; al cambiar de cuenta se vuelve a registrar el token para la nueva. */
  uid: string | undefined;
  /**
   * Si el familiar ya tiene perfil en el backend (`GET /me` respondió). Antes de eso
   * `POST /me/push-token` da 404 ("todavía no tiene perfil").
   */
  conPerfil: boolean;
  /** Si ya están las pestañas: recién ahí se puede navegar al feed al tocar una notificación. */
  enPestanas: boolean;
}

export function usePush({ uid, conPerfil, enPestanas }: Opciones) {
  // Registrar el token apenas hay perfil, y de nuevo si FCM lo rota con la app abierta. Si algo
  // falla no se avisa en pantalla: la app sigue andando igual (el feed se actualiza solo), y en
  // el próximo inicio de sesión se reintenta.
  useEffect(() => {
    if (!PUSH_DISPONIBLE || !uid || !conPerfil) return;
    let vigente = true;
    const registrar = (token: string) =>
      api.registrarPushToken(token).catch((e) => console.warn('No se pudo registrar el token de push', e));

    obtenerTokenPush()
      .then((token) => {
        if (vigente && token) registrar(token);
      })
      .catch((e) => console.warn('No se pudo obtener el token de push', e));

    const suscripcion = Notifications.addPushTokenListener(({ data }) => {
      if (typeof data === 'string') registrar(data);
    });
    return () => {
      vigente = false;
      suscripcion.remove();
    };
  }, [uid, conPerfil]);

  // Al tocar una notificación (con la app cerrada, en segundo plano o abierta): ir al feed con el
  // detalle de esa alerta abierto. El backend manda `evento_id`/`hogar_id` en la `data` (como
  // strings: FCM no acepta otra cosa); el feed abre el detalle apenas el evento está en la lista,
  // que se actualiza sola al volver a primer plano (HogarProvider). Una push sin ids (de antes
  // del 2026-10-15) abre solo el feed.
  const respuesta = Notifications.useLastNotificationResponse();
  const atendida = useRef<string | null>(null);
  useEffect(() => {
    if (!enPestanas || !respuesta) return;
    const id = respuesta.notification.request.identifier;
    if (atendida.current === id) return;
    atendida.current = id;
    const { evento_id, hogar_id } = respuesta.notification.request.content.data ?? {};
    const params = typeof evento_id === 'string' && typeof hogar_id === 'string'
      ? { alerta: evento_id, hogar: hogar_id }
      : {};
    router.navigate({ pathname: '/', params });
    Notifications.clearLastNotificationResponseAsync().catch(() => {});
  }, [enPestanas, respuesta]);
}
