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

**Login en modo demo:** cualquier correo válido + cualquier contraseña de 6 o más caracteres
(ej. `ana.gomez@mail.com` / `123456`). La sesión no se guarda: al recargar la app hay que volver
a entrar.

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
│   ├── _layout.tsx       Raíz: sesión + rutas protegidas (sin sesión → /login)
│   ├── login.tsx
│   └── (tabs)/           Pestañas: index (Notificaciones), reportes, perfil
├── features/             Una carpeta por funcionalidad, cada una con su README
│   ├── auth/             Sesión y pantalla de Login
│   ├── hogar/            Estado compartido: perfil, residente, eventos
│   ├── eventos/          Lógica común de eventos: severidad, textos, formato, tarjeta
│   ├── notificaciones/   Home: estado del día, filtros, feed, detalle de alerta
│   ├── reportes/         Rutina vs. lo habitual + eventos del período
│   └── perfil/           Datos de la cuenta, cerrar sesión
├── components/           Componentes visuales genéricos (Botón, Chip, Encabezado...)
├── api/                  Acceso a datos: tipos, cliente HTTP, mock
├── theme/                Colores, espaciados, tipografía
└── config/               Variables de entorno
```

**Regla de dependencias:** `app/` → `features/` → `components/`, `api/`, `theme/`. Una feature
puede usar `eventos/` y `hogar/` (son compartidas); el resto de las features no se importan entre
sí. Ninguna pantalla llama a `fetch` directo: todo pasa por `src/api`.

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
- **Paleta oficial** en [`src/theme/index.ts`](src/theme/index.ts): verde principal `#1F5D4B`,
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

---

## Próximos pasos

En orden sugerido:

1. **Actualizar Node a 22 LTS** y **probar la app en los celulares** de los dos con Expo Go;
   ajustar detalles visuales contra los mockups.
2. **Backend: endpoints que faltan** (lista y forma propuesta en
   [`src/api/README.md`](src/api/README.md)): `GET /me`, marcar alerta como resuelta, `ubicacion`
   en el evento, resumen de rutina, filtros por tipo/fecha (RF13).
3. **Firebase:** crear el proyecto (runbook en `cloud/README.md` del Backend, "Cómo seguir" →
   punto 2) y conectar el login real ([`src/features/auth/README.md`](src/features/auth/README.md)).
4. **Push (RF8):** pasar a *development build*, registrar el token del celular en el backend
   (`cloud/README.md` → punto 3) y abrir el detalle de la alerta al tocar la notificación.
5. **Opcional:** cargar una fuente propia (p. ej. Poppins con `expo-font`) para acercarse más a
   los mockups ([`src/theme/README.md`](src/theme/README.md)).
