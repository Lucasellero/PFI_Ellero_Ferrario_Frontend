# `features/push/` — Notificaciones push (RF8)

El celular del familiar recibe las alertas aunque tenga la app cerrada: caídas e inmovilidad al
momento (`POST /devices/events`) y desvíos de rutina con la corrida diaria
(`baseline_runner.py`). Las manda el backend por **Firebase Cloud Messaging**
(`cloud/app/notifications.py`, con `firebase-admin`). Esta carpeta hace la parte de la app:
consigue el token de FCM del celular, lo manda a `POST /me/push-token`, lo borra al cerrar
sesión y abre la alerta que el familiar toca.

**Estado (2026-10-17):** ✅ **probado en un Android real contra el backend de AWS**: una
caída de prueba mandada como el kit `LR-000003` llegó como "Posible caída detectada" (ver
"Prueba real del 2026-10-17"). Faltan: probar los desvíos de rutina (salen a las 03:00), y
desplegar el backend nuevo para abrir la alerta tocada y borrar el token al cerrar sesión.

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

1. **Firebase — registrar la app Android** — ✅ hecho (2026-10-16, app id
   `1:3916100752:android:439fbe21a23041da351415`, sin SHA-1: solo hace falta para login con
   Google o teléfono). Para rehacerlo: En la consola
   del proyecto `pfi-ellero-ferrario` → Project settings → General → "Add app" → Android →
   package name **`ar.edu.uade.lares`** (tiene que ser igual a `android.package` de
   `app.json`). Bajar el `google-services.json` y ponerlo en la raíz de este repo. Se commitea:
   no es secreto (identifica el proyecto, igual que la config web de `.env.example`), y EAS
   Build lo necesita en el repo.
2. **Backend — credenciales de Firebase.** Para que el backend mande push tiene que tener
   `GOOGLE_APPLICATION_CREDENTIALS` apuntando a la clave de la cuenta de servicio (ver
   `cloud/README.md` → "Cómo seguir" → 2). Sin eso, `enviar_push_alerta` solo deja un warning
   en el log. El deploy de AWS ya lo tiene (es el mismo Firebase del login).
3. **EAS** (cuenta gratis en expo.dev). `eas init` ✅ hecho (2026-10-16): proyecto
   [`@totossjgod/lares`](https://expo.dev/accounts/totossjgod/projects/lares), en la cuenta
   personal de Lorenzo (`owner` y `extra.eas.projectId` en `app.json`). Para que otro del equipo
   haga builds, invitarlo desde expo.dev o pasar el proyecto a una organización. `eas init`
   también copia a `app.json` campos que ya resuelven los plugins (`android.permissions`,
   `extra.router`): se sacaron a mano.
   ```bash
   npx eas-cli@latest login
   npx eas-cli@latest init      # crea el proyecto en expo.dev y agrega extra.eas.projectId a app.json
   npx eas-cli@latest build --profile development --platform android
   ```
   El build tarda unos minutos en la nube y al final da un link/QR para instalar el `.apk` en
   el celular. El perfil `development` está en `eas.json` (APK, distribución interna).
   Alternativa local, si hay Android Studio: `npx expo run:android`.

   **Primer build ✅ (2026-10-16):** `c4420bb6-8f03-48fe-851a-30e151bba020`, APK de ~270 MB.
   El link de descarga **vence el 2026-10-30**; después, volver a correr el `build` de arriba
   (el APK ya instalado sigue andando). Para instalarlo usar el link directo al `.apk` que
   imprime el build (`https://expo.dev/artifacts/eas/....apk`), no la página del build: esa es
   privada y en un navegador sin sesión de Expo dice "build not found". Para no tipear la URL
   en el celular, armar un QR (`npx qrcode -o qr.png "<url>"`) o pasar el `.apk` por cable o
   Drive. Android pide permitir "instalar apps de origen desconocido".
4. **Trabajar:** `npx expo start` en la PC y abrir **Lares** en el celular (no Expo Go).
   - El development build trae solo la parte nativa: las pantallas y la lógica las pide en vivo
     a la PC. Sin `npx expo start` corriendo, la app no tiene qué mostrar.
   - La app lista los servidores que encuentra en la red; si no aparece, "Enter URL manually"
     con `http://<IP de la PC>:8081` (en Mac: `ipconfig getifaddr en0`, o `en5`/el que
     corresponda si la PC está por cable). Celular y PC en el **mismo router**.
   - Si no se ven (wifi de invitados, red de la facultad): `npx expo start --tunnel`.
   - La terminal tiene que decir "Using development build" (si dice Expo Go, apretar `s`).
   - Las variables salen del `.env.local` de la PC (ver `.env.example`), no de EAS.

   Hay que rehacer el build solo cuando cambia algo nativo (`app.json`, una librería con
   código nativo); para cambios de JS/TS, no.

**Cuenta demo:** `ana.gomez@mail.com` (cualquier contraseña de 6 o más caracteres) existe
**solo con `EXPO_PUBLIC_API_MODE=mock` y `EXPO_PUBLIC_AUTH_MODE=mock`**. Para probar push hace
falta el backend real, así que una cuenta real (Crear cuenta) y un kit real (ver abajo).

## Cómo probarlo

1. Con `EXPO_PUBLIC_API_MODE=http` y `EXPO_PUBLIC_AUTH_MODE=firebase`, iniciar sesión en el
   celular con el development build y aceptar el permiso de notificaciones.
2. Vincular un kit real (ver "Kit de prueba en producción") o pedir que te inviten como
   familiar a un hogar que ya tenga uno.
3. Simular el kit: mandar eventos a `POST /devices/events` con su API key. Cada tipo:

   | Evento | `metadata` | Push esperada |
   |---|---|---|
   | `fall` | `{"confirmed": true}` | "Posible caída detectada" |
   | `immobility` | `{"severity": "alta", "duration_s": 240}` | "Sin movimiento en el piso" |
   | `immobility` | `{"severity": "alta", "trigger": "post_fall_sospecha"}` | "Sin movimiento después de una posible caída" |
   | `fall` | `{"confirmed": false}` (caída parcial) | Ninguna: queda como sospecha |
   | `immobility` | `{"severity": "baja"}` | Ninguna |
   | `activity` | `{"activity_label": "Cooking"}` | Ninguna (nunca avisa) |

   ```bash
   curl -X POST "$URL_BACKEND/devices/events" \
     -H "Content-Type: application/json" -H "X-API-Key: $API_KEY_DEL_KIT" \
     -d "[{\"video_id\":\"cam1\",\"event_type\":\"fall\",\"video_timestamp_s\":0,
           \"wall_clock_ts\":$(date +%s),\"event_id\":\"prueba-$(date +%s)\",
           \"metadata\":{\"confirmed\":true}}]"
   ```
   Respuesta esperada: `201 {"insertados":1,"duplicados":0}`. `video_id` es el
   `identificador_local` de una cámara del kit; `event_id` distinto en cada prueba (si se
   repite, el backend lo toma como reenvío y no avisa de nuevo). El evento queda guardado en el
   hogar: después se puede marcar como resuelto desde la app.
4. Probar con la app abierta, en segundo plano y cerrada.
5. Tocar la notificación → la app abre en Notificaciones con el detalle de la caída encima
   (con el backend nuevo desplegado; si no, solo el feed).
6. Cerrar sesión y volver a mandar una caída → no debería llegar (también con el backend nuevo).

Los **desvíos de rutina** no se pueden disparar con un evento: los emite el proceso diario de
las 03:00 (hora de Argentina) comparando el día anterior con el historial del residente (ver
`cloud/README.md`, "Correr la línea base"). Para probarlos en un hogar de prueba,
`cloud/simular_historial.py` del Backend le carga 60 días de rutina terminando en `--hoy`, ese
día sin comidas; a las 03:00 siguientes llegan "Cambio en la rutina: Hoy no se registró comer
o beber" y "Día distinto a lo habitual". No hay push de "resumen": el resumen de rutina se ve
en Reportes (con ese historial también se puede probar esa pantalla).

## Kit de prueba en producción

**`LR-000003`** (1 cámara, `cam1`), creado el 2026-10-17 con `cloud/alta_kit.py` contra la
base de AWS y vinculado desde la app a la cuenta de prueba de Lorenzo. El código de
vinculación y la API key **no están en el repo** (en la base solo quedan los hashes): los
tiene Lorenzo. Cómo se creó, por si hace falta otro: la base (RDS `pfi-lares-db`) no es
accesible desde internet, así que se habilitó un rato "Publicly accessible" con una regla de
entrada al 5432 **solo para la IP de la PC**, se corrió
`DATABASE_URL=<la de Elastic Beanstalk> python alta_kit.py --camaras 1` desde `cloud/`, y se
cerró enseguida (regla borrada, "Not publicly accessible"; verificado que el puerto ya no
responde). Mismo procedimiento que la migración de v8 en `cloud/README.md`.

## Prueba real del 2026-10-17

Android real (development build `c4420bb6`), backend de AWS (v8, sin la rama
`push-token-evento-2026-10-15`), cuenta de prueba de Lorenzo con el kit `LR-000003`:
- **Caída confirmada:** ✅ llegó "Posible caída detectada". Primer push real del proyecto:
  confirma de punta a punta el registro del token, las credenciales de Firebase del backend,
  la API de Cloud Messaging y el canal `alertas` de la app.
- **Inmovilidad alta:** ✅ llegó "Sin movimiento en el piso".
- **Samsung Galaxy A12: solo llegaban con la app abierta.** El ahorro de batería de Samsung
  tenía a Lares "en suspensión" y bloqueaba las notificaciones en segundo plano. Con Ajustes
  → Aplicaciones → Lares → Batería → **Sin restricciones** (y fuera de "Aplicaciones en
  suspensión"), la caída llegó con la app en segundo plano. Le va a pasar a cualquier
  familiar con Samsung (y probablemente Xiaomi/Huawei): ver Pendiente.
- **Backend `v9` desplegado (17:13 UTC):** `DELETE /me/push-token` y `evento_id`/`hogar_id`
  en la push, en producción. Inmovilidad post-caída mandada después del deploy.
- **Desvíos de rutina, en curso:** `simular_historial.py --hoy 2026-10-17` cargó 14.502 eventos
  (60 días, del 2026-08-19 a hoy, hoy sin comidas). La corrida a mano del mediodía (la que tiró
  la API) llegó a registrar "Día distinto a lo habitual" y mandó la push, que no llegó porque el
  Samsung todavía bloqueaba la app; no alcanzó a registrar el de comidas. Se espera "Cambio en
  la rutina: Hoy no se registró comer o beber" a las 03:00 del 2026-10-18 (el proceso no
  repite el multivariado). Resultado: pendiente de anotar.
- **Push de desvío forzada:** ✅ llegó "Cambio en la rutina: Hoy no se registró comer o
  beber", mandada desde el contenedor con `alertas.texto_desvio` + `enviar_push_alerta` para
  los tokens del hogar 3 (sin correr el proceso diario ni registrar nada). Confirma el texto y
  el envío; el cálculo de la línea base se prueba a las 03:00. Para entrar al contenedor del
  entorno nuevo hubo que abrir el 22 del security group de Beanstalk **solo** para la lista de
  prefijos de EC2 Instance Connect (`pl-03915406641cb1f53`).
- Sin probar todavía: tocar la notificación con la `v9` (debería abrir el detalle), app
  cerrada del todo, los casos que no deben avisar y cerrar sesión.

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
- **Build `preview` (sin PC) pendiente a propósito.** Para una app que ande sola hacen falta dos
  cosas que el development build no pide: cargar las variables `EXPO_PUBLIC_*` en EAS (el
  `.env.local` no viaja al build, git lo ignora) y permitir tráfico `http` (el backend no tiene
  HTTPS y Android lo bloquea fuera de desarrollo; `expo-build-properties` con
  `usesCleartextTraffic`, o HTTPS en el backend). Para probar push alcanza el development build.
- **Se mantiene la actualización cada 30 s** del feed (`HogarProvider`): sigue haciendo falta
  en Expo Go/iOS, y el backend no manda push de todo (no hay push de actividad normal). Se
  puede espaciar una vez probadas las push.

## Pendiente

- ~~Desplegar el backend nuevo~~ ✅ (`v9`, 2026-10-17).
- **Ahorro de batería (Samsung y otros):** si el sistema tiene a Lares restringida, las alertas
  no llegan con la app cerrada. Avisarle al familiar en la app (junto con el permiso
  rechazado) con un botón a los ajustes de batería; y en el backend mandar las alertas con
  `android.priority = high` y `channel_id = "alertas"` (`messaging.AndroidConfig`), para que
  Android las entregue al instante aunque el celular esté en reposo.
- **Permiso rechazado:** mostrar en Perfil que las notificaciones están apagadas, con un botón
  a los ajustes del sistema (`Linking.openSettings()`). Va junto con las "Preferencias de
  notificación" de `features/perfil`.
- ~~Probar en un celular real~~ ✅ (2026-10-17, ver "Prueba real del 2026-10-17"). Falta
  completar la tabla de "Cómo probarlo" y anotar el resultado de los desvíos de rutina.
- **Separar canales** si los desvíos de rutina (llegan a las 03:00) molestan: hoy suenan igual
  que una caída porque van al mismo canal. Sería `alertas` (urgente) y `rutina` (silencioso),
  con `android.channel_id` desde el backend.
- **Build `preview`** para usar la app sin PC (ver Decisiones).
- **iOS** (ver Decisiones).
