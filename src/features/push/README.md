# `features/push/` — Notificaciones push (RF8)

El celular del familiar recibe las alertas aunque tenga la app cerrada: caídas e inmovilidad al
momento (`POST /devices/events`) y desvíos de rutina con la corrida diaria
(`baseline_runner.py`). Las manda el backend por **Firebase Cloud Messaging**
(`cloud/app/notifications.py`, con `firebase-admin`). Esta carpeta hace la parte de la app:
consigue el token de FCM del celular, lo manda a `POST /me/push-token`, lo borra al cerrar
sesión y abre la alerta que el familiar toca.

**Estado (2026-10-15):** código hecho, typecheck/lint/export sin errores. **Todavía no se probó
en un celular**: falta el `google-services.json` y el primer development build (pasos de abajo).

| Archivo | Qué es |
|---|---|
| `push.ts` | Lógica sin React: si este build puede recibir push (`PUSH_DISPONIBLE`), canal de Android, permiso y token, cómo se muestran con la app abierta, y `dejarDeRecibirPush` (al cerrar sesión). |
| `usePush.ts` | Hook que usa el layout raíz (`src/app/_layout.tsx`): registra el token cuando hay perfil, lo vuelve a mandar si FCM lo rota, y al tocar una notificación lleva al feed con esa alerta abierta. |

Fuera de esta carpeta:
- `features/hogar/HogarProvider.tsx` pide los eventos apenas llega una push con la app abierta
  (sin esperar la vuelta de 30 s).
- `features/notificaciones/NotificacionesScreen.tsx` abre el detalle de la alerta que llega en
  los parámetros `alerta`/`hogar` de la ruta.
- `features/auth/AuthProvider.tsx` → `cerrarSesion` llama a `dejarDeRecibirPush` antes de
  salir.

## Cómo funciona

1. El familiar inicia sesión y `GET /me` responde → `usePush` crea el canal `alertas`, pide
   permiso (Android 13+ muestra el cartel) y obtiene el token de FCM con
   `getDevicePushTokenAsync()`.
2. Lo manda a `POST /me/push-token`. El backend guarda **un token por familiar**: si inicia
   sesión en otro celular, las push pasan a llegar a ese.
3. Si FCM rota el token con la app abierta (`addPushTokenListener`), se vuelve a mandar. Si
   rota con la app cerrada, se manda en el próximo inicio de la app (el effect corre de nuevo).
4. Llega una push:
   - **App cerrada o en segundo plano:** Android la muestra en el canal `alertas`. Al tocarla,
     la app abre en el feed (pestaña Notificaciones) con el detalle de esa alerta encima
     (`evento_id`/`hogar_id` de la `data`). El feed se actualiza solo al volver a primer plano y
     el detalle aparece apenas el evento está en la lista.
   - **App abierta:** se muestra igual (banner + sonido, `configurarPresentacion`) y el feed
     se actualiza en el momento. Tocarla abre el detalle igual que arriba.
5. Cierra sesión → `DELETE /me/push-token?token=<el de este celular>` y recién después sale.
   El backend lo borra solo si coincide con el guardado: si el familiar ya entró desde otro
   celular, no le corta las push a ese.

## Configurar para desarrollo (una vez por máquina / por proyecto)

Las push **no andan en Expo Go**: hace falta un *development build*, una versión de la app con
los módulos nativos de este proyecto que se instala una vez en el celular. Después se trabaja
igual que con Expo Go (`npx expo start` y el celular se conecta al bundler).

1. **Firebase — registrar la app Android** (una sola vez para todo el equipo). En la consola
   del proyecto `pfi-ellero-ferrario` → Project settings → General → "Add app" → Android →
   package name **`ar.edu.uade.lares`** (tiene que ser igual a `android.package` de
   `app.json`). Bajar el `google-services.json` y ponerlo en la raíz de este repo. Se commitea:
   no es secreto (identifica el proyecto, igual que la config web de `.env.example`), y EAS
   Build lo necesita en el repo.
2. **Backend — credenciales de Firebase.** Para que el backend mande push tiene que tener
   `GOOGLE_APPLICATION_CREDENTIALS` apuntando a la clave de la cuenta de servicio (ver
   `cloud/README.md` → "Cómo seguir" → 2). Sin eso, `enviar_push_alerta` solo deja un warning
   en el log. El deploy de AWS ya lo tiene (es el mismo Firebase del login).
3. **EAS** (cuenta gratis en expo.dev):
   ```bash
   npx eas-cli@latest login
   npx eas-cli@latest init      # crea el proyecto en expo.dev y agrega extra.eas.projectId a app.json
   npx eas-cli@latest build --profile development --platform android
   ```
   El build tarda unos minutos en la nube y al final da un link/QR para instalar el `.apk` en
   el celular. El perfil `development` está en `eas.json` (APK, distribución interna).
   Alternativa local, si hay Android Studio: `npx expo run:android`.
4. **Trabajar:** `npx expo start` y abrir el proyecto desde la app instalada (no desde Expo
   Go). Hay que rehacer el build solo cuando cambia algo nativo (`app.json`, una librería con
   código nativo); para cambios de JS/TS, no.

## Cómo probarlo

1. Con `EXPO_PUBLIC_API_MODE=http` y `EXPO_PUBLIC_AUTH_MODE=firebase`, iniciar sesión en el
   celular con el development build y aceptar el permiso de notificaciones.
2. Verificar que el token llegó: en la base, `familiar.push_token` de esa cuenta deja de ser
   `null`.
3. Mandar un evento de caída a `POST /devices/events` con la API key del kit (como en la
   "Prueba end-to-end en celular real" del README raíz). Debería llegar "Posible caída
   detectada" con la app cerrada, abierta y en segundo plano.
4. Tocar la notificación → la app abre en Notificaciones con el detalle de la caída encima
   (con el backend nuevo desplegado; si no, solo el feed).
5. Cerrar sesión → `familiar.push_token` vuelve a `null` (también con el backend nuevo).

## Decisiones

- **`expo-notifications`, no `@react-native-firebase/messaging` (2026-10-15).** Por ahora solo
  se apunta a **Android**, y ahí `getDevicePushTokenAsync()` ya da el token de FCM que espera
  el backend. Es el módulo recomendado por Expo, tiene config plugin y resuelve también
  permisos, canal, mostrar la notificación con la app abierta y saber cuál se tocó, cosas que
  con RN Firebase requieren otra librería más (p. ej. Notifee). El login sigue con el SDK web
  de Firebase (no cambia nada en `features/auth`).
- **Sin iOS por ahora.** En iOS `getDevicePushTokenAsync()` da un token de **APNs**, que
  `firebase-admin` no acepta como token de FCM; además hace falta cuenta paga de Apple
  Developer y subir una clave APNs a Firebase. Si se suma iOS: o se cambia a
  `@react-native-firebase/messaging` (token FCM en las dos plataformas, sin tocar el backend),
  o el backend manda a iOS por APNs directo. `PUSH_DISPONIBLE` ya deja afuera a iOS, así que la
  app no se rompe ahí: solo no registra token.
- **Identificador `ar.edu.uade.lares`** (package de Android y bundle id de iOS). Una vez
  registrado en Firebase y en Play Store no se puede cambiar sin "crear otra app": si se
  quiere otro, cambiarlo **antes** del paso 1 de arriba.
- **Canal `alertas` con importancia máxima** (aparece arriba de la pantalla, con sonido). El
  backend no manda `channel_id`, así que FCM usa el canal por defecto del manifest, que
  configura `defaultChannel` del plugin en `app.json`: los dos tienen que llamarse igual.
  Android no deja cambiar la importancia de un canal ya creado: para cambiarla, usar otro id.
- **Ícono de la notificación:** `android-icon-monochrome.png` (blanco sobre transparente, lo
  que pide Android) con el verde de marca `#1F5D4B`.
- **El permiso se pide al tener perfil**, no en una pantalla aparte: la app existe para
  recibir estas alertas, así que el cartel tiene sentido apenas entra. Si el familiar lo
  rechaza no se insiste (Android no deja volver a mostrar el cartel); falta avisarle (ver
  Pendiente).
- **El token se registra antes de vincular el kit** (etapas `sin-hogar`/`configurando`): solo
  hace falta que exista el `Familiar` en el backend.
- **Los errores de registro no se muestran en pantalla:** solo `console.warn`. La app funciona
  igual sin push (el feed se actualiza cada 30 s) y se reintenta en el próximo inicio.
- **El detalle de la alerta tocada sale de la ruta, no de un estado:** `usePush` navega a `/`
  con `?alerta=<evento_id>&hogar=<hogar_id>` y la pantalla muestra ese evento si está en la
  lista y el hogar es el activo (con otro hogar, solo el feed). Así funciona igual con la app
  cerrada (el feed todavía está cargando cuando llega la navegación) y no hace falta un effect.
  Al cerrar el detalle se limpian los parámetros.
- **Cerrar sesión espera al `DELETE` como máximo 3 s** (`ESPERA_MAXIMA_BORRADO_MS`). Si falla o
  no hay red, sale igual: el token queda hasta que otro inicio de sesión lo pise. Mientras
  espera no se muestra nada en pantalla (normalmente son décimas de segundo).
- **Se mantiene la actualización cada 30 s** del feed (`HogarProvider`): sigue haciendo falta
  en Expo Go/iOS, y el backend no manda push de todo (no hay push de actividad normal). Se
  puede espaciar una vez probadas las push.

## Pendiente

- **Desplegar el backend nuevo.** `DELETE /me/push-token` y los ids en la push están en la
  rama `push-token-evento-2026-10-15` del Backend (2026-10-15, con pruebas), todavía sin merge
  ni deploy a AWS. Mientras tanto la app anda igual: el `DELETE` da 405 y se ignora (el token
  sigue quedando al cerrar sesión), y tocar una push abre solo el feed.
- **Permiso rechazado:** mostrar en Perfil que las notificaciones están apagadas, con un botón
  a los ajustes del sistema (`Linking.openSettings()`). Va junto con las "Preferencias de
  notificación" de `features/perfil`.
- **Probar en un celular real** (pasos de arriba) y anotar el resultado en la Bitácora.
- **iOS** (ver Decisiones).
