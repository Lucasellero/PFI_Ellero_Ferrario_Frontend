# Lares — App móvil · PFI Ellero/Ferrario

App móvil para el **responsable a cargo** (el familiar) del sistema de monitoreo no invasivo de
adultos mayores del Proyecto Final de Ingeniería (UADE, 2026). Recibe las alertas (caídas,
inmovilidad prolongada, desvíos de rutina), muestra el estado del día y los reportes de rutina
del residente.

| Repo | Qué tiene |
|---|---|
| [`PFI_Ellero_Ferrario_Backend`](https://github.com/Lucasellero/PFI_Ellero_Ferrario_Backend) | Pipeline de visión en la Raspberry Pi (`vision/`, `vlm/`, `fusion/`, `runner/`), línea base (`baseline/`) y **API cloud para esta app (`cloud/`)** |
| `PFI_Ellero_Ferrario_Frontend` (este) | App móvil |
| Informe (LaTeX) | Requerimientos (cap. 3: RF1–RF13, RNF), mockups (cap. 3, "Mockups"), marca (cap. 3, "Branding"), decisiones de stack (cap. 4) |

> **Para quien llega nuevo:** leé este README entero (5 min), después la sección
> [Bitácora](#bitácora) para saber en qué estado quedó todo, y recién después el README de la
> carpeta en la que vayas a trabajar.

---

## Estado actual

| Pieza | Estado |
|---|---|
| Pantallas de los mockups (Login, Notificaciones, Detalle de alerta, Reportes, Día en orden) + Perfil | ✅ Hechas, con datos de prueba |
| Capa de API (mock ↔ backend real con una variable de entorno) | ✅ Hecha |
| Login real con Firebase Authentication | ✅ Hecho (2026-10-07), detrás de `EXPO_PUBLIC_AUTH_MODE=firebase` · sin probar en un celular |
| Notificaciones push (Firebase Cloud Messaging) | ✅ **Probado en un Android real** contra AWS (2026-10-17, solo Android, `expo-notifications`, *development build*): llega la de caída. Falta probar desvíos de rutina y desplegar la rama del backend con los ids y el borrado del token. Pasos en [`src/features/push/README.md`](src/features/push/README.md) |
| Conexión al backend real | ✅ Los 12 métodos de `Api` implementados en `http.ts`, filtros RF13 conectados en Reportes (2026-10-07) — ver [`src/api/README.md`](src/api/README.md) |
| Identidad de marca (nombre, logo, paleta, ícono y splash) | ✅ Hecha, según la sección "Branding" del informe |
| Modo claro y oscuro (sigue al celular o se elige en Perfil) | ✅ Hecho |
| Crear cuenta + vinculación del kit por QR + configuración inicial (residente, cámaras) | ✅ Hecho en la app (mock y backend real) ([`docs/vinculacion-kit.md`](docs/vinculacion-kit.md)) |
| Editar residente/cámaras y gestión de familiares (RF12) desde Perfil | ✅ Hecho (2026-10-07) — ver [`src/features/perfil/README.md`](src/features/perfil/README.md) |
| Validación de formularios (mail, contraseña, nombre, teléfono, código del kit) | ✅ Hecha ([`src/lib/README.md`](src/lib/README.md)) |

---

## Marca

Definida en el informe (cap. 3, sección "Branding"). Lo que usa la app:

- **Nombre:** Lares ("casa, hogar"; en Roma, los dioses protectores de la casa). En el
  ecosistema del kit, la controladora se llama **Lar** y cada cámara **Vela**; la app es
  **Lares**.
- **Frase:** *"La distancia deja de ser un problema."* (Login).
- **Logo:** casa formada por dos piezas que se inclinan una hacia la otra, con una persona
  debajo. En la app: `assets/images/logo-simbolo.png` (Login y splash) e `icon.png` (ícono).
- **Paleta:** dos grupos que no se mezclan, colores de marca y semáforo de alertas. Tabla
  completa en [`src/theme/README.md`](src/theme/README.md).

---

## Stack

| Qué | Elección | Por qué |
|---|---|---|
| Framework | **React Native** vía **Expo** (SDK 57) | El informe define React Native (cap. 4). Expo es la forma recomendada de usarlo: no hace falta Android Studio/Xcode para desarrollar, se prueba en el celular con Expo Go. |
| Lenguaje | **TypeScript** | Los tipos de la API (`src/api/types.ts`) calcan los del backend, así el editor marca cualquier campo mal escrito antes de correr la app. |
| Navegación | **Expo Router** (rutas por archivos en `src/app/`) | Lo estándar en Expo hoy. |
| Login | **Firebase Authentication** (email + contraseña) | Definido en el informe (cap. 4). Hoy mockeado. |
| Push | **Firebase Cloud Messaging**, recibidas con `expo-notifications` | Definido en el informe (RF8). Solo Android por ahora (ver [`src/features/push/README.md`](src/features/push/README.md)). |
| Íconos | `@expo/vector-icons` (set Feather) | Incluido en Expo Go; el estilo de línea coincide con los mockups. |

**Expo Go vs. development build:** todo corre en **Expo Go** menos las push (FCM), que
necesitan un *development build* (un "Expo Go propio" de la app, se instala una vez en el
celular y después se trabaja igual). En Expo Go la app anda igual, solo que no registra token
ni recibe push. Cómo armarlo: [`src/features/push/README.md`](src/features/push/README.md).

---

## Cómo correrlo

Requisitos: **Node 22 LTS** (mínimo 20.19.4 — lo exige React Native 0.86; con versiones
anteriores Expo avisa "Node.js is outdated" y puede fallar), la app **Expo Go** en el celular
(Play Store / App Store), y PC y celular en la **misma red wifi**.

```bash
npm install
npx expo start
```

Escanear el QR con Expo Go (Android) o con la cámara (iOS). Para probar las push hace falta el
*development build* en vez de Expo Go: ver [`src/features/push/README.md`](src/features/push/README.md).

**Probar en modo demo:**
- **Cuenta con datos:** `ana.gomez@mail.com` con cualquier contraseña de 6 o más caracteres →
  entra directo con alertas y reportes de prueba.
- **Cuenta nueva (vinculación del kit):** "Creá tu cuenta" en el Login con cualquier otro mail →
  escanear el QR o ingresar el código `7K3P-9QXM` (más códigos de prueba en
  [`src/api/README.md`](src/api/README.md)).

La sesión y las cuentas creadas no se guardan: al recargar la app hay que volver a entrar.

### Modo mock vs. backend real

Por defecto la app usa datos de prueba en memoria (`src/api/mock.ts`) — no hace falta backend
ni Firebase. Para apuntar al backend real:

```bash
cp .env.example .env.local   # y editar EXPO_PUBLIC_API_MODE=http + EXPO_PUBLIC_API_URL
```

Detalle y limitaciones en [`src/api/README.md`](src/api/README.md).

### Antes de commitear

```bash
npm run typecheck   # TypeScript
npm run lint        # ESLint (incluye las reglas de React Compiler)
```

Los dos tienen que pasar sin errores.

---

## Estructura

```
src/
├── app/                  Rutas (Expo Router). Archivos FINOS: solo importan una pantalla de features/.
│   ├── _layout.tsx       Raíz: tema + sesión + cuenta; rutas protegidas según la etapa de la cuenta
│   ├── login.tsx, registro.tsx
│   ├── vinculacion/      Vincular el kit por QR + configuración inicial (3 pasos)
│   └── (tabs)/           Pestañas: index (Notificaciones), reportes, perfil
├── features/             Una carpeta por funcionalidad, cada una con su README
│   ├── auth/             Sesión, Login y Crear cuenta
│   ├── cuenta/           Perfil (GET /me) y etapa de la cuenta: sin hogar / configurando / lista
│   ├── vinculacion/      Escanear el QR, código a mano, residente, cámaras
│   ├── hogar/            Estado compartido de las pestañas: eventos del hogar
│   ├── eventos/          Lógica común de eventos: severidad, textos, formato, tarjeta, detalle
│   ├── notificaciones/   Home: estado del día, filtros, feed
│   ├── reportes/         Rutina vs. lo habitual + eventos del período
│   ├── perfil/           Datos de la cuenta, cerrar sesión
│   └── push/             Notificaciones push (RF8): token de FCM, canal, tocar una notificación
├── components/           Componentes visuales genéricos (Botón, Chip, CampoTexto, BarraSuperior...)
├── lib/                  Utilidades sin interfaz (validaciones de formularios)
├── api/                  Acceso a datos: tipos, cliente HTTP, mock
├── theme/                Colores (claro y oscuro), espaciados, tipografía
└── config/               Variables de entorno
docs/                     Diseños que cruzan app y backend (ej. vinculacion-kit.md)
├── mockups/              Mockups en HTML (estilo del informe), claros y oscuros, y sus PNG
└── informe/              Material listo para el informe: imágenes con nombre final + índice
```

**Regla de dependencias:** `app/` → `features/` → `components/`, `lib/`, `api/`, `theme/`. Una
feature puede usar `auth/`, `cuenta/`, `eventos/`, `hogar/` y `push/` (son compartidas); el resto de las
features no se importan entre sí. Ninguna pantalla llama a `fetch` directo: todo pasa por `src/api`.

---

## Metodología de trabajo

1. **Este README** es la puerta de entrada: estado general, cómo correr, estructura y la
   **bitácora** con el paso a paso de lo que se fue haciendo.
2. **Cada carpeta de `src/features/`, más `src/api/`, `src/components/` y `src/theme/`, tiene su
   propio README** con: qué hace, qué requerimientos del informe cubre, decisiones tomadas y qué
   falta. Si cambiás algo de un módulo, actualizá su README en el mismo commit.
3. **Cada vez que se termina algo**, se agrega una entrada a la [Bitácora](#bitácora): fecha,
   qué se hizo, qué se decidió y por qué, y qué quedó pendiente. Breve — el detalle va en el
   README del módulo.
4. **Pendientes del backend:** cualquier cosa que la app necesite y el backend no tenga se marca
   como `PENDIENTE BACKEND` en el código y se lista en [`src/api/README.md`](src/api/README.md).
5. **Idioma:** código, comentarios y documentación en español (igual que el backend); los nombres
   que vienen del backend (`event_type`, `occurred_at`...) se dejan tal cual.

---

## Bitácora

### 2026-10-04 — Arranque del proyecto

**Qué se hizo**
- Proyecto creado con `create-expo-app` (template default: Expo SDK 57, TypeScript, Expo
  Router). Se borró el contenido de ejemplo del template y sus dependencias sin uso.
- Implementadas las 5 pantallas de los mockups del informe más Perfil, con datos de prueba:
  - **Login** (mockup 01).
  - **Notificaciones** (02): estado del día, filtros por severidad, alertas fijadas hasta ser
    atendidas, eventos de hoy y de días anteriores, tirar para actualizar.
  - **Detalle de alerta** (03): hoja inferior con "Llamar a…" y "Marcar como resuelta".
  - **Día en orden** (05): mismo home, cuando no hay alertas pendientes.
  - **Reportes** (04): rutina vs. lo habitual por período (hoy/semana/mes) y eventos del
    período.
  - **Perfil**: no tiene mockup; muestra hogar, residente, rol y cerrar sesión.
- Capa de API con dos implementaciones intercambiables: mock y HTTP contra `cloud/`.
- Verificado: `typecheck`, `lint`, `expo-doctor` (18/18) y bundle de Android compilando.
  Todavía **no se probó en un celular** con Expo Go.
- La PC de Lucas tiene Node 20.17.0, por debajo del mínimo de React Native 0.86 (20.19.4):
  compila con un aviso, pero hay que actualizar a Node 22 LTS.

**Decisiones**
- **Expo + TypeScript.** El informe solo dice React Native; Expo y TypeScript son la forma de
  usarlo, no una alternativa. Se arranca en Expo Go; el *development build* recién cuando haga
  falta para las push.
- **Mock primero.** El backend todavía no tiene Firebase ni varios endpoints que la app
  necesita, así que se hizo toda la interfaz contra un mock con exactamente la misma forma de
  datos que emite el backend (`event_type` y claves de `metadata` sacadas del código de
  `vision/`, `runner/` y `cloud/`).
- **Severidad (semáforo).** Caída confirmada o inmovilidad en el piso → rojo. Sedentarismo,
  caída sin confirmar o desvío de rutina → amarillo. Actividad → verde. La regla está en un solo
  lugar: [`src/features/eventos/severidad.ts`](src/features/eventos/severidad.ts).
- **Textos sin género.** La app no sabe el género del residente, así que los textos evitan
  "sentado/a" ("3 h sin movimiento en el living").

**Pendiente** → ver [Próximos pasos](#próximos-pasos).

### 2026-10-04 — Identidad de marca de Lares

**Qué se hizo**
- Se aplicó la sección **"Branding"** del informe (cap. 3), tomada de la última versión del
  repo del informe (commits del 2026-10-01 en `origin/main`).
- **Paleta oficial** en [`src/theme/paletas.ts`](src/theme/paletas.ts): verde principal `#1F5D4B`,
  verde secundario `#AFC9BC`, fondo `#F8F7F2`, neutro `#D8D4C8`, y semáforo alta `#D96863`,
  media `#E4C26B`, baja `#6DA88A`.
- **Login** como el mockup 01 actualizado: símbolo del logo en un cuadrado blanco, "LARES" en
  verde principal y la frase *"La distancia deja de ser un problema."*.
- **Ícono, ícono adaptativo de Android (con versión monocromática), splash y favicon** generados
  a partir del `icono_app.png` del informe. Se quitaron el ícono de iOS y el fondo de Android
  que traía el template.
- `app.json`: nombre `Lares`, slug y scheme `lares`.
- Verificado: `typecheck`, `lint`, `expo-doctor` (18/18) y bundle de Android (incluye el logo).

**Decisiones**
- **Variante `XTexto` por color del semáforo.** Los tres colores oficiales son pasteles; como
  ícono o texto sobre fondo claro (sobre todo el amarillo) no se leen. Se usan tal cual para
  bordes, puntos, chips y el botón "Llamar", y en un tono más oscuro de la misma familia para
  íconos y textos, como hacen los mockups. Detalle en [`src/theme/README.md`](src/theme/README.md).
- **"Todo en orden hoy" en verde "baja"**, no en verde de marca, igual que el mockup 05: el
  informe reserva el semáforo para el estado de los eventos y la marca para todo lo demás.
- **Fuente del sistema.** El informe pide una sans geométrica y redondeada sin nombrar una
  fuente; se mantiene la del sistema (ver próximos pasos).
- **"Rutina de sueño alterada"** aparece en el mockup de Reportes, pero no se muestra porque
  `baseline/` no tiene hoy una clase que detecte el sueño; los desvíos se muestran con los tipos
  que sí emite el backend.

### 2026-10-04 — Modo claro y oscuro

**Qué se hizo**
- Tema con **dos paletas de mismas claves** (`paletaClara` / `paletaOscura` en
  [`src/theme/paletas.ts`](src/theme/paletas.ts)) y un `TemaProvider` que expone el tema activo
  (`useTema()`, `useEstilos()`). Todas las pantallas piden colores al tema; ninguna los define
  sueltos.
- **Selector de apariencia en Perfil:** Sistema / Claro / Oscuro. La preferencia se guarda en
  AsyncStorage y se aplica con `Appearance.setColorScheme`, así alertas y teclado nativos quedan
  en el mismo modo.
- **Splash oscuro** (`splash-icon-dark.png`, fondo `#111815`) y `userInterfaceStyle: automatic`
  en `app.json`.

**Decisiones**
- **No es invertir la clara:** fondo verde casi negro (no negro puro) para que siga siendo
  Lares; verde de marca en dos roles (`primario` como relleno, `acento` como texto) porque en
  oscuro el texto necesita un verde más claro; semáforo con los colores oficiales y `XSuave` /
  `XTexto` ajustados.
- **El logo va siempre sobre crema:** la persona verde oscura del símbolo no se ve sobre fondo
  oscuro.
- Detalle y criterios en [`src/theme/README.md`](src/theme/README.md).

### 2026-10-04 — Accesibilidad de alertas, detalle desde Reportes y actualización automática

**Qué se hizo**
- **Lectores de pantalla:** la tarjeta de evento ahora dice en palabras la severidad y si está
  sin atender o atendida ("Alerta urgente. Sin atender. Posible caída detectada…"). Antes eso
  solo se veía por color, y una persona que usa VoiceOver o TalkBack no se enteraba de que era
  urgente.
- **Detalle desde Reportes:** las tarjetas de "Eventos del período" se pueden tocar y abren el
  mismo detalle que en Notificaciones. `DetalleAlertaSheet` se movió de `notificaciones/` a
  `eventos/` (compartida) para respetar la regla de que las features no se importan entre sí.
- **Actualización automática:** la lista de eventos se pide sola cada 30 s con la app abierta
  y apenas vuelve a primer plano (`HogarProvider`). Así una caída aparece sin tener que tirar
  para actualizar, y los "hace N minutos" se mantienen al día.
- Verificado: `typecheck` y `lint`.

**Decisiones**
- **Consultar cada 30 s es provisorio**, hasta que estén las push (RF8). En segundo plano no
  consulta. 30 s es un equilibrio entre enterarse rápido y no gastar batería ni datos.
- **Actualización silenciosa:** sin spinner y, si falla, queda la lista anterior; el error solo
  se muestra cuando lo pide el usuario (tirar para actualizar).
- **Una alerta resuelta no vuelve a aparecer** por una respuesta vieja que llega tarde
  (`fusionarEventos`).

### 2026-10-04 — Arreglo: spinner trabado arriba del home en iOS

**Qué pasaba:** probando en un iPhone, el spinner de "tirar para actualizar" quedaba fijo
arriba de Notificaciones aunque no se estuviera cargando nada.

**Causa:** el estado `refrescando` vivía en `HogarProvider` y lo compartían las dos pestañas.
Tirar para actualizar en una pestaña prendía por código el spinner de la otra (montada pero
oculta), y iOS no lo limpia bien en una lista que no se ve.

**Arreglo:** cada pantalla tiene su propio spinner (`useRecargaManual` en
[`src/features/hogar/HogarProvider.tsx`](src/features/hogar/HogarProvider.tsx)), con una
duración mínima de 600 ms para que la respuesta no llegue en medio de la animación de entrada.
Verificado `typecheck`, `lint` y probado en un iPhone con Expo Go: el spinner ya no queda trabado.

### 2026-10-04 — Crear cuenta, vinculación del kit por QR y validaciones

**Qué se hizo**
- **Crear cuenta** desde el Login (nombre, mail, contraseña y confirmación).
- **Vinculación del kit** en 3 pasos: (1) escanear el QR de la controladora con la cámara
  (`expo-camera`) o tipear el código, (2) nombre y teléfono del residente, (3) ubicación de cada
  cámara. Al terminar, la app pasa sola a las pestañas.
- **`CuentaProvider`** (`features/cuenta/`): pide `GET /me` apenas hay sesión y define la etapa de
  la cuenta (sin hogar / configurando / lista); el layout raíz muestra login, vinculación o
  pestañas según eso. El perfil se movió de `HogarProvider` acá.
- **Validaciones** en `src/lib/validaciones.ts` (mail, contraseña, nombre, teléfono argentino a
  E.164, texto corto) y del código del kit en `features/vinculacion/codigoKit.ts`. Errores por
  campo con `CampoTexto`. Probadas con 31 casos.
- **API:** `crearPerfil`, `vincularKit`, `listarCamaras`, `actualizarCamara`, `guardarResidente`
  (todos `PENDIENTE BACKEND`), funcionando en el mock con cuentas, kits de prueba y errores
  404/409/429.
- **[`docs/vinculacion-kit.md`](docs/vinculacion-kit.md):** flujo, formato del QR, contrato con el
  backend, seguridad y **los cambios al diagrama de base de datos** (entidad nueva KIT, campos
  nuevos en RESIDENTE, EVENTO y FAMILIAR), con el diagrama completo en
  Mermaid para rehacer la Figura 3.8.
- Perfil muestra el kit vinculado y el teléfono formateado; Reportes explica que "Lares está
  aprendiendo la rutina" cuando el hogar es nuevo.
- Verificado: `typecheck`, `lint`, `expo-doctor` (18/18) y bundle de Android. **No probado
  todavía en un celular** (el escáner necesita uno de verdad).

**Decisiones**
- **El QR se escanea desde la app**, después de crear la cuenta (como Google Nest o Ring), y no
  desde el panel local de la Raspberry: un solo lugar para crear cuentas, no hace falta estar en
  el wifi de la casa, y el panel local queda como opcional (familia y soporte presencial).
- **KIT como entidad aparte de HOGAR:** la credencial es del aparato; si se reemplaza la
  controladora, el hogar conserva su historial.
- **El residente se guarda al final:** "hogar con residente" es la señal de configuración
  terminada, sin campos extra en el backend.
- **El plan del kit fija las cámaras:** cada kit sale de fábrica con 1 a 3 cámaras (lo que se
  compró, Sección 3.9.2.1 del informe) y la app solo deja ubicar esas. En la base de datos,
  `KIT.cantidad_camaras` y CAMARA ligada al KIT desde fábrica.
- **Instalación sin configurar nada:** la controladora sale a internet por cable al router
  (el cable no está incluido en el kit, lo pone el familiar), sin monitor; las cámaras usan una red privada de la controladora sin
  salida a internet. Detalle en `docs/vinculacion-kit.md`, sección 2.
- **Teléfono solo de Argentina**, guardado en formato internacional; celular o fijo según el 9 o
  el 15.
- **Login:** mismo mensaje para mail inexistente y contraseña incorrecta (no revela qué mails
  tienen cuenta). Las reglas de contraseña fuerte son solo para crearla.

**Pendiente:** endpoints y tablas en el backend; editar residente y cámaras desde Perfil;
invitar familiares (RF12).

### 2026-10-05 — Mockups nuevos y decisiones cerradas en el informe

**Qué se hizo**
- **Mockups** de las pantallas 06 a 12 y de todas en modo oscuro, con el estilo del informe
  (`docs/mockups/`), y las imágenes listas para el informe en `docs/informe/imagenes/`.
- Al pasar la vinculación al informe se cerraron decisiones, aplicadas acá:
  - **Sin verificación de mail.** Al crear la cuenta solo se aceptan proveedores conocidos
    (`validarEmailRegistro` y `DOMINIOS_PERMITIDOS` en `src/lib/validaciones.ts`); el login sigue
    aceptando cualquier dominio. Ayuda del campo: "Gmail, Hotmail, Outlook, Yahoo o iCloud."
  - **Base de datos:** `push_token` en FAMILIAR (sin tabla de dispositivos), sin INVITACION,
    `HOGAR.direccion` opcional. Diagrama Mermaid actualizado en `docs/vinculacion-kit.md`.
  - **Hardware:** el wifi de la Raspberry sostiene las 3 cámaras, sin adaptador USB.
  - **Panel local:** opcional para la familia; soporte técnico solo presencial.
  - **Requerimientos:** RF10 = el familiar ubica las cámaras desde la app; RF14 nuevo =
    vinculación por QR. Cámara adicional: USD 19 con IVA.
- `docs/cambios-informe-vinculacion.md` marcado como aplicado.
- Verificado: `typecheck` y `lint`.

### 2026-10-07 — Conexión al backend real (KIT) y login con Firebase

**Qué se hizo**
- **`src/api/types.ts`:** `Camara.local_id` → `identificador_local` (el backend lo renombró en
  la migración `a3f9c2d17b40`, ver `cloud/README.md`). Mismo cambio en `mock.ts` y
  `docs/vinculacion-kit.md`. Se sacaron los `PENDIENTE BACKEND` de `Perfil`, `HogarApi.kit` y
  `Residente.telefono`: ya existen en `cloud/`.
- **`src/api/http.ts`:** `obtenerPerfil`, `crearPerfil`, `vincularKit`, `listarCamaras`,
  `actualizarCamara` y `guardarResidente` dejan de ser `pendiente(...)` (501) y pegan contra los
  endpoints reales de `cloud/app/routers/`. `marcarResuelta` y `obtenerResumenRutina` siguen
  pendientes (el backend no los tiene).
- **Login con Firebase Authentication real:** `AuthProvider` suma una segunda implementación,
  elegida por la variable nueva `EXPO_PUBLIC_AUTH_MODE` (`mock` default | `firebase`) — detalle
  completo en [`src/features/auth/README.md`](src/features/auth/README.md). Nuevo
  `src/features/auth/firebase.ts` (inicialización perezosa del SDK web). `firebase` sumado a
  `package.json` (`npx expo install firebase`, SDK 57 → `firebase@12.19.0`).
- Verificado: `npm run typecheck` y `npm run lint` sin errores. **No probado en un celular**
  (ni el login con Firebase real ni los endpoints nuevos contra un backend corriendo en la red).

**Decisiones**
- **`AUTH_MODE` separado de `API_MODE`.** El plan original de este README decía "reemplazar el
  cuerpo de `AuthProvider`" sin condición, pero eso rompía el modo demo completo (`mock.ts`
  identifica al familiar con el token `mock:<email>` que arma el `AuthProvider` mock; un ID
  token real de Firebase no matchea nada ahí). Con una variable de entorno más, igual que
  `API_MODE`, se puede seguir probando la app sin ninguna cuenta ni red (default) y además
  probar el login real cuando haga falta, sin que se pisen.
- **Un solo componente `AuthProvider`, no dos hooks elegidos por `if`.** Llamar
  `useAuthMock()` o `useAuthFirebase()` según una condición viola las reglas de hooks de React en
  el linter (aunque `AUTH_MODE` no cambie en tiempo de ejecución). Se mantuvieron los mismos
  `useState`/`useEffect` siempre y cada método bifurca por dentro.
- **`getReactNativePersistence` con `@ts-expect-error` documentado.** Bug conocido de
  `firebase-js-sdk` v12 sin fix ([#9316](https://github.com/firebase/firebase-js-sdk/issues/9316)):
  existe en runtime (Metro resuelve el build de React Native de `@firebase/auth`) pero falta en
  los tipos que reexporta `firebase/auth`. Se verificó contra el código fuente del paquete
  instalado antes de aplicar el workaround, no se adivinó.

**Pendiente:** push tokens (ver `src/api/README.md` y `cloud/README.md` del Backend). El flujo
completo (login Firebase + vinculación + eventos + resumen de rutina) ya se probó en un celular
real — ver "Prueba end-to-end en celular real" más abajo.

### 2026-10-07 — Resolver alertas, ubicación en eventos y filtros RF13

**Qué se hizo**
- **Backend (`cloud/`):** `POST /hogares/{id}/eventos/{evento_id}/resolver` ("Marcar como
  resuelta", mockup 03), campo `ubicacion` en `EventoOut` (join con `Camara.ubicacion`) y
  filtros opcionales `tipo`/`desde`/`hasta` en `GET /hogares/{id}/eventos` (RF13). Probado con
  un smoke test contra SQLite (dependency override de Firebase) — resolver es idempotente, 404
  si el evento no es de ese hogar, `ubicacion` null para eventos sin cámara.
- **`src/api/http.ts`:** `marcarResuelta` deja de ser `pendiente(...)`.
- **`src/api/types.ts`:** `Evento.ubicacion` y `Evento.resuelta` dejan de ser opcionales ni
  `PENDIENTE BACKEND` — el backend siempre los manda ahora.
- Verificado: `npm run typecheck` y `npm run lint` sin errores.

**Pendiente:** push tokens siguen sin implementar en el backend. ~~la app todavía no manda los
filtros `tipo`/`desde`/`hasta`~~ — `tipo` conectado 2026-10-08, ver esa fecha más abajo; `hasta`
sigue sin usarse.

### 2026-10-07 — Resumen de rutina real (`GET /hogares/{id}/rutina`)

**Qué se hizo**
- **Backend (`cloud/app/rutina.py`, nuevo):** calcula el resumen de rutina al vuelo sobre
  `Evento` (sin leer `LineaBaseComportamiento`, que sigue sin escribirse) con mediana + MAD —
  misma convención estadística que `baseline/src/class_deviations.py`. Solo dos indicadores:
  `comida` (horario de la primera comida/toma del día, clase `cam_comida`) y `sedentarismo`
  (minutos/día sentado, `cam_descanso_sofa` + `cam_ocio_sentado`). Ventanas rolling (`hoy`,
  últimos 7 u últimos 30 días), igual al criterio que ya usa `ReportesScreen.tsx`.
- **`http.ts`:** `obtenerResumenRutina` deja de ser `pendiente(...)` — ya no queda ningún método
  de `Api` sin implementar contra el backend real.
- Probado con un smoke test (eventos sintéticos, 20+ días de historial, contra SQLite) — sin
  probar contra Postgres ni con datos de cámara reales.
- Verificado: `npm run typecheck` y `npm run lint` sin errores.

**Decisiones**
- **Sin `"despertar"`.** El mock lo mostraba, pero no hay clase de cámara que detecte
  despertarse (sin sensor de cama, ver `camera_events.py::CAMERA_ACTIVITY_MAP`) —
  `features/reportes/README.md` ya lo marcaba como pendiente de definir con el backend antes de
  esta sesión. Mostrarlo habría sido un dato inventado (`CLAUDE.md`: "no inventar campos,
  verificar en el backend").
- **No se reusó `timing_deviations.score_timing_deviations`.** Ese módulo es un detector: solo
  devuelve filas para eventos que ya se salen de lo habitual, no "el valor de hoy + el rango
  habitual" para mostrar siempre. Para una sola clase sin ocurrencias cerca de medianoche, un
  cálculo directo (sin el clustering circular completo) es más simple y más fácil de auditar.
- **Umbrales sin calibrar con datos reales de cámara** (no existen aún, mismo disclaimer que el
  resto de `baseline/`): punto de partida razonable, no un resultado medido.

**Pendiente:** push tokens (backend); calibrar el resumen de rutina con datos de cámara reales
(hoy sigue probado solo con sintético/CASAS, ver "Prueba end-to-end en celular real" más abajo).

### 2026-10-07 — Push tokens y alertas agudas en el backend (RF8)

**Qué se hizo** (todo del lado del Backend, `cloud/` — nada cambia en este repo todavía):
`POST /me/push-token` (body `{token}`, 204), `baseline_runner.py` manda los desvíos de rutina a
los tokens reales de cada familiar (ya no una lista vacía), y `POST /devices/events` ahora
también dispara push en el momento para `fall`/`immobility` con `es_alerta=True` — decisión
tomada explícitamente (RF8 lo sugería, el README del Backend lo dejaba como punto a discutir):
sí avisa de inmediato por caídas/inmovilidad, no solo al otro día con el resumen de rutina.
Probado con smoke tests (Firebase capturado en vez de real).

**Por qué no cambia nada acá todavía:** registrar el token de FCM y recibir la notificación
necesita el SDK nativo de Firebase Messaging, que no corre en Expo Go — requiere
*development build* (ver "Próximos pasos"). Mientras tanto no hay nada que la app pueda llamar
de forma útil (sin token real que mandar), así que queda documentado en
[`src/api/README.md`](src/api/README.md) para cuando se pase a development build.

### 2026-10-07 — Filtros RF13 conectados en Reportes

**Qué se hizo**
- `Api.listarEventos` acepta `tipo`/`desde`/`hasta` además de `limit` (`client.ts`, `http.ts`
  manda los que vengan como querystring, `mock.ts` los aplica también para que el modo mock se
  comporte igual).
- `ReportesScreen.tsx` pide los eventos del período con `desde` directo al backend
  (`api.listarEventos(hogarId, { desde, limit: 500 })`) en vez de filtrar del lado del cliente
  la lista general de `useHogar()` (capada a los últimos 200) — un hogar con mucha actividad
  podía perder eventos viejos del mes en esa lista. La lista general (home, badge, "última
  actividad" en el detalle) sigue sin filtro, como corresponde a un feed reciente.
- Verificado: `npm run typecheck` y `npm run lint` sin errores.

**Pendiente:** ~~nadie manda `tipo`/`hasta` todavía~~ — `tipo` conectado 2026-10-08 con chips
Todos/Caídas/Inmovilidad/Rutina en Reportes (ver esa fecha más abajo); `hasta` sigue sin usarse.

### 2026-10-07 — Editar residente/cámaras y gestión de familiares desde Perfil (RF12)

**Qué se hizo**
- `Api` suma `listarFamiliares`/`invitarFamiliar`/`cambiarRolFamiliar`/`quitarFamiliar`
  (`client.ts`, `http.ts` contra el CRUD de `cloud/` del mismo día, `mock.ts` con la misma
  lógica de "último `responsable_principal`" que el backend). Nuevo tipo `FamiliarVinculado`.
  Nueva cuenta de prueba `EMAIL_FAMILIAR_DEMO` (`carlos.gomez@mail.com`) para poder probar
  "invitar" en modo mock.
- Tres pantallas nuevas en `features/perfil/` (`EditarResidenteScreen`, `EditarCamarasScreen`,
  `FamiliaresScreen`) y sus rutas (`/editar-residente`, `/editar-camaras`, `/familiares`,
  archivos finos en `src/app/` como el resto). `PerfilScreen` enlaza a las tres — las dos
  primeras solo para `responsable_principal`.
- `validarUbicaciones` (la regla de "sin repetirse entre cámaras del hogar") se movió de
  `UbicacionCamarasScreen.tsx` a `src/lib/validaciones.ts`: la necesitan tanto la configuración
  inicial como editar cámaras después, un solo lugar.
- Verificado: `npm run typecheck`, `npm run lint` y `npx expo export` (Android y web) sin
  errores — esto último confirma que las rutas nuevas bundlean y registran bien, más allá de lo
  que ya cubre el typecheck. No se pudo probar interactuando con las pantallas (no hay celular
  ni simulador en este entorno).

**Decisiones:** ver `features/perfil/README.md` ("Decisiones (2026-10-07)") — en particular,
desvincularse del único hogar llama `recargarPerfil()` en vez de `cerrarSesion()`, para que el
layout raíz pase solo a la vinculación con el perfil ya actualizado.

**Pendiente:** preferencias de notificación; selector de hogar (si un familiar llega a tener más
de uno). Las tres pantallas ya se probaron en un celular real — ver "Prueba end-to-end en
celular real" más abajo.

### 2026-10-07 — Actualizar Node

**Qué se hizo:** `winget install OpenJS.NodeJS.LTS` → Node `v24.19.0` (antes `20.17.0`, por
debajo del mínimo de React Native 0.86). Ya no sale el aviso "Node.js is outdated and
unsupported" al correr `typecheck`/`lint`/`expo export`. No hizo falta reinstalar
`node_modules` ni cambió nada de comportamiento — verificado `npm run typecheck` y
`npm run lint` sin errores con la versión nueva.

### 2026-10-08 — Prueba end-to-end en celular real

**Qué se hizo:** primera prueba completa de la app contra el backend real, no contra mocks ni
smoke tests. `.env.local` apuntado al deploy de AWS (`EXPO_PUBLIC_API_MODE=http`,
`EXPO_PUBLIC_AUTH_MODE=firebase`, ver `cloud/README.md` "Desplegar a AWS"). Desde un celular con
Expo Go, conectado al bundler de esta PC:

- Cuenta real creada con Firebase Authentication (`lucasellero2004@gmail.com`).
- Vinculación de un kit real contra la base de AWS — el kit de prueba (`LR-000001`) se creó con
  `alta_kit.py` corriendo contra RDS (acceso público habilitado un momento para esto, revertido
  enseguida; ver "Desplegar a AWS" en `cloud/README.md`).
- Residente configurado, sesión completa hasta el Home.
- 151 eventos sintéticos (21 días de rutina + una caída confirmada + inmovilidad de severidad
  alta) mandados directo a `POST /devices/events` con la API key del kit, para tener algo real
  que ver en el feed y suficiente historial para el resumen de rutina.
- Confirmado desde el celular: feed con la caída/inmovilidad, "Marcar como resuelta", resumen de
  rutina en Reportes (con desvío de sedentarismo marcado a propósito), filtros por período, y las
  tres pantallas de Perfil (editar residente, editar cámaras, familiares) — todo funcionando.

**No cubierto por esta prueba:** push notifications (sigue bloqueado por *development build*,
ver "Próximos pasos" → punto 2) y HTTPS (decisión tomada de no hacerlo para esta etapa, ver
`cloud/README.md`).

### 2026-10-08 (2) — Filtro por tipo, gráfico de evolución y 2 indicadores nuevos en Reportes

**Qué se hizo** (detalle completo en `src/features/reportes/README.md`):
- **RF13, `tipo`:** chips Todos/Caídas/Inmovilidad/Rutina en Reportes, conectados a
  `api.listarEventos(hogarId, { tipo })` — ya no trae todos los tipos mezclados.
- **Gráfico de evolución**: nuevo `GraficoIndicador.tsx` (línea con `react-native-svg`, recién
  agregado a `package.json`) — un punto por día, línea de lo habitual y marca los días de desvío.
  Un chip por indicador para elegir cuál graficar (solo uno a la vez). Pide `GET
  /hogares/{id}/rutina/serie`, endpoint nuevo del lado del backend (`cloud/app/rutina.py`, ver
  `cloud/README.md`). Dos vueltas de diseño: la primera (pestañas superpuestas tipo separador de
  cuaderno, a pedido del usuario) no se vio bien en un celular real — texto cortado, hueco con la
  tarjeta de abajo —, se simplificó a los mismos chips que ya usan Período/Tipo.
- **2 indicadores nuevos**: `cocina` y `movilidad` (antes solo `comida`/`sedentarismo`), mismo
  patrón backend. `ClaveIndicadorRutina` en `src/api/types.ts` ahora tiene 4 valores.
- **Ícono de cerrar sesión** (`EncabezadoPantalla`, nuevo prop `accion`): en Perfil pasó de ser un
  botón al final de la pantalla a un ícono (`log-out` de Feather) arriba a la derecha del
  encabezado, a pedido del usuario.
- Verificado: `npm run typecheck`, `npm run lint` y `npx expo export --platform android` sin
  errores. Probado en el celular real contra el backend ya desplegado (`cloud/README.md`, deploys
  `v3`/`v4`).

**Pendiente:** ninguno nuevo — los indicadores `cocina`/`movilidad` comparten las mismas
limitaciones ya documentadas (sin calibrar con cámara real, texto "0 min" si los eventos de
prueba no tienen heartbeats).

### 2026-10-15 — Notificaciones push en la app (RF8, solo Android)

**Qué se hizo** (detalle y pasos de configuración en
[`src/features/push/README.md`](src/features/push/README.md)):
- Nuevo `features/push/`: crea el canal `alertas`, pide permiso, obtiene el token de FCM y lo
  manda a `POST /me/push-token` (nuevo `api.registrarPushToken`, también en el mock) apenas
  hay perfil; lo reenvía si FCM lo rota. Tocar una notificación abre el feed. Con la app
  abierta la notificación se muestra igual y `HogarProvider` actualiza el feed en el momento.
- `app.json`: `android.package`/`ios.bundleIdentifier` = `ar.edu.uade.lares`,
  `android.googleServicesFile` y el plugin de `expo-notifications` (ícono monocromo, verde de
  marca, canal por defecto `alertas`). Nuevo `eas.json` con perfiles `development` y `preview`
  (APK, distribución interna).
- Dependencias nuevas: `expo-notifications` y `expo-dev-client`. De paso, `npx expo install
  --fix` subió 4 paquetes que estaban algunas versiones de parche atrás (`expo`,
  `expo-linking`, `expo-router`, `expo-splash-screen`) para hacer el primer build alineado;
  `expo-doctor` 21/21.
- Verificado: `npm run typecheck`, `npm run lint` y `npx expo export --platform android` sin
  errores. **No probado en un celular.**

**Decisiones:**
- **Solo Android por ahora**, decidido por el equipo. Por eso `expo-notifications` y no
  `@react-native-firebase/messaging`: en Android ya da el token de FCM que espera el backend, es
  el módulo de Expo y resuelve permisos, canal y toques sin otra librería. En iOS ese token es
  de APNs y no sirve para `firebase-admin`; sumar iOS implica cambiar a RN Firebase o tocar el
  backend, además de la cuenta paga de Apple Developer.
- **Identificador `ar.edu.uade.lares`:** el equipo no tenía uno; se eligió este. Cambiarlo
  antes de registrar la app Android en Firebase, después ya no se puede.
- **`google-services.json` se commitea** (no es secreto, EAS Build lo necesita en el repo).
- **Los 30 s de actualización del feed se mantienen** hasta probar las push.

**Pendiente:** registrar la app Android en Firebase y commitear `google-services.json`;
`eas init` + primer `eas build --profile development --platform android`; probar en un celular
(pasos en el README del módulo). Dos **PENDIENTE BACKEND** nuevos en
[`src/api/README.md`](src/api/README.md): `evento_id`/`hogar_id` en la push (para abrir la
alerta exacta) y borrar el token al cerrar sesión.

### 2026-10-15 (2) — Borrar el token al cerrar sesión y abrir la alerta tocada (RF8)

**Qué se hizo:** los dos `PENDIENTE BACKEND` que había dejado la entrada anterior, de punta a
punta.
- **Backend** (rama `push-token-evento-2026-10-15` del repo Backend, **sin merge ni deploy**):
  `DELETE /me/push-token?token=` (borra solo si es el token guardado) y `evento_id`/`hogar_id`
  en la `data` de cada push, de caídas/inmovilidad y de desvíos de rutina. 8 pruebas nuevas,
  135/135 pasando. Detalle en `cloud/README.md` → "Cómo seguir" → 3.
- **App:** `cerrarSesion` llama a `DELETE /me/push-token` antes de salir (nuevo
  `api.borrarPushToken`, espera máxima de 3 s), y tocar una notificación abre el detalle de
  esa alerta en el feed (`?alerta=&hogar=` en la ruta, lo lee `NotificacionesScreen`).
- Verificado: `npm run typecheck`, `npm run lint` y `npx expo export --platform android` sin
  errores. No probado en un celular (sigue faltando el development build).

**Decisiones:**
- **El `DELETE` borra solo si el token coincide** con el guardado. Con un token por familiar,
  si inició sesión en otro celular, cerrar sesión en el viejo no le corta las push al nuevo.
  El token va como query param porque un `DELETE` con body no lo soportan bien todos los
  clientes.
- **El detalle de la alerta tocada sale de la ruta**, no de un estado: funciona igual con la app
  cerrada, cuando el feed todavía está cargando.
- **Compatible con el backend desplegado hoy:** sin el deploy, el `DELETE` da 405 y se ignora, y
  una push sin ids abre solo el feed.

**Pendiente:** merge y deploy del backend (Lucas); lo demás sigue igual que en la entrada
anterior (Firebase, `eas init`, development build, prueba en celular).

### 2026-10-16 — App Android registrada en Firebase

**Qué se hizo:** se registró la app Android `ar.edu.uade.lares` en el proyecto
`pfi-ellero-ferrario` (junto a la app web `pfi-test` del login) y se commiteó el
`google-services.json` en la raíz, que es a donde apunta `android.googleServicesFile` de
`app.json`. Verificado que el archivo es de ese proyecto y de ese paquete.

**Decisiones:** sin certificado SHA-1 (solo lo piden el login con Google o con teléfono; acá es
email y contraseña). El archivo va en el repo: no es secreto y EAS Build lo necesita.

**Pendiente:** `eas init` + primer development build y la prueba en un celular Android.

### 2026-10-16/17 — Development build, kit de prueba y primera push real

**Qué se hizo:**
- **EAS:** `eas init` creó el proyecto `@totossjgod/lares` (cuenta personal de Lorenzo;
  `owner` y `projectId` en `app.json`). Primer development build de Android
  (`c4420bb6-8f03-48fe-851a-30e151bba020`, el link del APK vence el 2026-10-30).
- **`.env.local`** contra el backend de AWS y Firebase real (no está en git; los valores están
  en Elastic Beanstalk y en la consola de Firebase).
- **Kit de prueba `LR-000003`** (1 cámara) dado de alta en la base de producción con
  `alta_kit.py`: RDS abierto un rato solo a la IP de la PC y cerrado enseguida (verificado).
  Vinculado desde la app a una cuenta nueva de Lorenzo. Código y API key fuera del repo.
- **Primera push real del proyecto:** una caída mandada a `POST /devices/events` con la API key
  del kit llegó al Android como "Posible caída detectada". Confirma de punta a punta token,
  credenciales de Firebase del backend y canal de la app. Inmovilidad alta mandada, sin
  confirmar todavía.
- Detalle, pasos para repetirlo y tabla de qué evento avisa qué: `src/features/push/README.md`
  ("Configurar para desarrollo", "Cómo probarlo", "Kit de prueba en producción", "Prueba real
  del 2026-10-17").

**Decisiones y aprendizajes:**
- **AWS desde la consola web, no con claves de la CLI** en la PC: era una sola vez y no vale la
  pena dejar credenciales de la cuenta guardadas.
- **El development build necesita la PC** (`npx expo start`): trae solo la parte nativa. Una
  app que ande sola (`preview`) queda para más adelante: pide cargar las variables en EAS y
  permitir `http` (el backend no tiene HTTPS).
- **La cuenta demo (`ana.gomez@mail.com`) solo existe en modo mock**: con el backend real hace
  falta una cuenta real.
- **No hay push de "resumen"**: el resumen de rutina se ve en Reportes. Los desvíos de rutina
  sí avisan, pero los emite el proceso diario de las 03:00, no un evento.

**Pendiente:** confirmar la de inmovilidad y probar el resto de la tabla; probar los desvíos de
rutina; merge y deploy de la rama del backend (Lucas); invitar a Lucas al proyecto de Expo si
va a hacer builds.

---

## Próximos pasos

En orden sugerido:

1. ~~Actualizar Node~~ ✅ (2026-10-07, `v24.19.0` vía `winget install OpenJS.NodeJS.LTS` — ya
   no hace falta exactamente "22", alcanza con cualquier LTS ≥20.19.4). ~~Probar la app en los
   celulares con Expo Go contra el backend real~~ ✅ (2026-10-08, ver "Prueba end-to-end en
   celular real" más abajo).
2. **Push (RF8):** ✅ funcionando en Android (2026-10-17). Falta: probar el resto de los
   casos y los desvíos de rutina ([`src/features/push/README.md`](src/features/push/README.md)
   → "Cómo probarlo"), mergear y desplegar la rama `push-token-evento-2026-10-15` del backend,
   y después decidir si se suma iOS y si se hace el build `preview` (sin PC).
3. **Opcional:** cargar una fuente propia (p. ej. Poppins con `expo-font`) para acercarse más a
   los mockups ([`src/theme/README.md`](src/theme/README.md)).
