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
| Login real con Firebase Authentication | ⏳ Pendiente — falta crear el proyecto de Firebase |
| Notificaciones push (Firebase Cloud Messaging) | ⏳ Pendiente — requiere *development build* (no anda en Expo Go) |
| Conexión al backend real | ⏳ Parcial — solo existe `GET /hogares/{id}/eventos`; el resto de endpoints falta en el backend (ver [`src/api/README.md`](src/api/README.md)) |
| Identidad de marca (nombre, logo, paleta, ícono y splash) | ✅ Hecha, según la sección "Branding" del informe |
| Modo claro y oscuro (sigue al celular o se elige en Perfil) | ✅ Hecho |
| Crear cuenta + vinculación del kit por QR + configuración inicial (residente, cámaras) | ✅ Hecho en la app con el mock · ⏳ endpoints y tablas pendientes en el backend ([`docs/vinculacion-kit.md`](docs/vinculacion-kit.md)) |
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
| Push | **Firebase Cloud Messaging** | Definido en el informe (RF8). Hoy pendiente. |
| Íconos | `@expo/vector-icons` (set Feather) | Incluido en Expo Go; el estilo de línea coincide con los mockups. |

**Expo Go vs. development build:** todo lo que hay hoy corre en **Expo Go**. Cuando se sumen
las push (FCM) va a hacer falta un *development build* (un "Expo Go propio" de la app, se
instala una vez en el celular y después se trabaja igual). Está anotado en
[Próximos pasos](#próximos-pasos).

---

## Cómo correrlo

Requisitos: **Node 22 LTS** (mínimo 20.19.4 — lo exige React Native 0.86; con versiones
anteriores Expo avisa "Node.js is outdated" y puede fallar), la app **Expo Go** en el celular
(Play Store / App Store), y PC y celular en la **misma red wifi**.

```bash
npm install
npx expo start
```

Escanear el QR con Expo Go (Android) o con la cámara (iOS).

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
│   └── perfil/           Datos de la cuenta, cerrar sesión
├── components/           Componentes visuales genéricos (Botón, Chip, CampoTexto, BarraSuperior...)
├── lib/                  Utilidades sin interfaz (validaciones de formularios)
├── api/                  Acceso a datos: tipos, cliente HTTP, mock
├── theme/                Colores (claro y oscuro), espaciados, tipografía
└── config/               Variables de entorno
docs/                     Diseños que cruzan app y backend (ej. vinculacion-kit.md)
```

**Regla de dependencias:** `app/` → `features/` → `components/`, `lib/`, `api/`, `theme/`. Una
feature puede usar `auth/`, `cuenta/`, `eventos/` y `hogar/` (son compartidas); el resto de las
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
  nuevos en RESIDENTE y EVENTO, tablas de push e invitaciones), con el diagrama completo en
  Mermaid para rehacer la Figura 3.8.
- Perfil muestra el kit vinculado y el teléfono formateado; Reportes explica que "Lares está
  aprendiendo la rutina" cuando el hogar es nuevo.
- Verificado: `typecheck`, `lint`, `expo-doctor` (18/18) y bundle de Android. **No probado
  todavía en un celular** (el escáner necesita uno de verdad).

**Decisiones**
- **El QR se escanea desde la app**, después de crear la cuenta (como Google Nest o Ring), y no
  desde el panel local de la Raspberry: un solo lugar para crear cuentas, no hace falta estar en
  el wifi de la casa, y el panel local queda como herramienta técnica.
- **KIT como entidad aparte de HOGAR:** la credencial es del aparato; si se reemplaza la
  controladora, el hogar conserva su historial.
- **El residente se guarda al final:** "hogar con residente" es la señal de configuración
  terminada, sin campos extra en el backend.
- **El plan del kit fija las cámaras:** cada kit sale de fábrica con 1 a 3 cámaras (lo que se
  compró, Sección 3.9.2.1 del informe) y la app solo deja ubicar esas. En la base de datos,
  `KIT.cantidad_camaras` y CAMARA ligada al KIT desde fábrica.
- **Instalación sin configurar nada:** la controladora sale a internet por cable al router
  (viene en la caja), sin monitor; las cámaras usan una red privada de la controladora sin
  salida a internet. Detalle en `docs/vinculacion-kit.md`, sección 2.
- **Teléfono solo de Argentina**, guardado en formato internacional; celular o fijo según el 9 o
  el 15.
- **Login:** mismo mensaje para mail inexistente y contraseña incorrecta (no revela qué mails
  tienen cuenta). Las reglas de contraseña fuerte son solo para crearla.

**Pendiente:** endpoints y tablas en el backend; verificación del mail (Firebase); editar
residente y cámaras desde Perfil; invitar familiares (RF12).

---

## Próximos pasos

En orden sugerido:

1. **Actualizar Node a 22 LTS** y **probar la app en los celulares** de los dos con Expo Go;
   ajustar detalles visuales contra los mockups.
2. **Backend: vinculación del kit** — actualizar el diagrama de base de datos (Figura 3.8) y el
   modelo con los cambios de [`docs/vinculacion-kit.md`](docs/vinculacion-kit.md) (KIT,
   `Residente.telefono`, resolución de eventos), y sumar `GET/POST /me`, `POST /kits/vincular`,
   cámaras y residente.
3. **Backend: el resto de los endpoints** (lista y forma propuesta en
   [`src/api/README.md`](src/api/README.md)): marcar alerta como resuelta, `ubicacion` en el
   evento, resumen de rutina, filtros por tipo/fecha (RF13).
4. **Firebase:** crear el proyecto (runbook en `cloud/README.md` del Backend, "Cómo seguir" →
   punto 2) y conectar el login real ([`src/features/auth/README.md`](src/features/auth/README.md)).
5. **Push (RF8):** pasar a *development build*, registrar el token del celular en el backend
   (`cloud/README.md` → punto 3) y abrir el detalle de la alerta al tocar la notificación.
6. **App:** editar residente y cámaras desde Perfil, invitar familiares (RF12) y pantalla de
   verificación del mail.
7. **Opcional:** cargar una fuente propia (p. ej. Poppins con `expo-font`) para acercarse más a
   los mockups ([`src/theme/README.md`](src/theme/README.md)).
