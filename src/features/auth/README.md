# `features/auth/` — Sesión, Login y Crear cuenta

Cubre **RNF10** (inicio de sesión) y la parte de app de **RF12** (solo familiares autorizados
ven las alertas del hogar). Mockup **01 · Login**; "Crear cuenta" no tiene mockup y sigue el
mismo lenguaje.

| Archivo | Qué es |
|---|---|
| `AuthProvider.tsx` | Contexto de sesión: `useAuth()` → `usuario`, `iniciarSesion`, `registrarCuenta`, `cerrarSesion`, `recuperarContrasena`. Dos ramas internas según `AUTH_MODE` (`src/config`), ver "Estado" abajo. |
| `firebase.ts` | Inicialización perezosa del SDK web de Firebase (`initializeAuth` + `getReactNativePersistence(AsyncStorage)`), solo se ejecuta si `AUTH_MODE=firebase`. |
| `LoginScreen.tsx` | Login: logo y frase de la marca, correo, contraseña, "Olvidé mi contraseña", "¿Te llegó un kit Lares? Creá tu cuenta", pie de privacidad. |
| `RegistroScreen.tsx` | Crear cuenta: nombre, correo, contraseña (con requisitos en vivo) y confirmación. Es el primer paso de la vinculación del kit (`docs/vinculacion-kit.md`). |

**Marca en el Login** (informe, cap. 3, "Branding"): el símbolo del logo
(`assets/images/logo-simbolo.png`) dentro de un cuadrado redondeado, "LARES" en el verde
principal y la frase *"La distancia deja de ser un problema."*. El nombre se escribe como texto
(no como imagen) para que lo lean los lectores de pantalla.

Qué pantallas se ven según la sesión y la cuenta lo decide `src/app/_layout.tsx` con
`features/cuenta/` (sin sesión: `/login` y `/registro`).

## Validaciones

Con `src/lib/validaciones.ts`. Cada campo se marca al salir de él y todos al tocar el botón;
el error aparece debajo del campo (`CampoTexto`) y se anuncia al lector de pantalla.

| Pantalla | Campo | Regla |
|---|---|---|
| Login | Correo | Formato de mail |
| Login | Contraseña | Que no esté vacía (las reglas de contraseña fuerte son solo para crearla) |
| Crear cuenta | Nombre | 2 a 60 letras |
| Crear cuenta | Correo | Formato de mail **y proveedor conocido** (Gmail, Hotmail, Outlook, Live, Yahoo, iCloud; `DOMINIOS_PERMITIDOS`) |
| Crear cuenta | Contraseña | 8+ caracteres, una letra y un número (lista en vivo) |
| Crear cuenta | Repetir contraseña | Igual a la anterior |

`AuthProvider` revalida antes de crear la cuenta: es la última barrera del lado de la app
(Firebase y el backend validan de nuevo).

- **Sin verificación de mail** (decisión del informe): en su lugar, al crear la cuenta solo se
  aceptan proveedores conocidos (`validarEmailRegistro`). El login y "Olvidé mi contraseña"
  siguen con `validarEmail` (cualquier dominio). `mail.com` está permitido por la cuenta demo.
- **Login fallido:** el mismo mensaje para "no existe" y "contraseña incorrecta" ("El correo o
  la contraseña no son correctos"), como hace Firebase: no revela qué mails tienen cuenta.

## Estado: dos modos, según `EXPO_PUBLIC_AUTH_MODE` (`.env.local`)

**`mock`** (default — no necesita nada):
- Cuenta demo **`ana.gomez@mail.com`** con cualquier contraseña de 6+ caracteres: entra directo
  a las pestañas con datos de prueba.
- **Crear cuenta** con otro mail de un proveedor permitido: la cuenta vive en memoria (se pierde al recargar la
  app) y entra a la vinculación del kit.
- No persiste la sesión (al recargar la app hay que volver a entrar).
- "Olvidé mi contraseña" muestra el aviso pero no manda nada.

**`firebase`** (2026-10-07 — real, SDK web de Firebase en Expo Go, sin development build):
- Proyecto `pfi-ellero-ferrario`, Email/Password (runbook en `cloud/README.md` del Backend →
  "Cómo seguir" → punto 2, ✅ hecho). Config pública en `.env.local`
  (`EXPO_PUBLIC_FIREBASE_*`, ver `.env.example`).
- `iniciarSesion` → `signInWithEmailAndPassword`; `registrarCuenta` →
  `createUserWithEmailAndPassword` + `updateProfile({ displayName })` y después
  `api.crearPerfil({ nombre })` (`POST /me`) **antes** de dejar pasar a la app (si falla, se
  borra el usuario de Firebase recién creado para no dejar una cuenta sin `Familiar`);
  `cerrarSesion` → `signOut`; `recuperarContrasena` → `sendPasswordResetEmail`; `usuario` ←
  `onAuthStateChanged` (con un flag `listo` para no mostrar "sin sesión" mientras Firebase
  restaura la sesión guardada en AsyncStorage al abrir la app).
- `configurarTokenProvider(() => auth.currentUser?.getIdToken() ?? null)` — el backend verifica
  ese token (`cloud/app/auth.py`).
- Códigos de error de Firebase (`auth/invalid-credential`, `auth/email-already-in-use`,
  `auth/weak-password`...) traducidos a `AuthError` con mensaje en español
  (`mensajeErrorFirebase` en `AuthProvider.tsx`).
- Requiere además `EXPO_PUBLIC_API_MODE=http` apuntando al backend real para que
  `api.crearPerfil`/`GET /me` funcionen — los dos modos son independientes pero `firebase` sin
  `http` deja a la cuenta sin `Familiar` en el backend.
- **Sin probar todavía desde la app en un celular** (sí probado el flujo completo del lado del
  backend con un ID token real de Firebase, ver `cloud/README.md`).
- Bug de tipos conocido y sin fix de `firebase-js-sdk` v12
  ([#9316](https://github.com/firebase/firebase-js-sdk/issues/9316)): `getReactNativePersistence`
  no está en los tipos de `firebase/auth` aunque sí existe en runtime — `firebase.ts` lo
  silencia con `@ts-expect-error` documentado.

**Un solo componente, no dos hooks elegidos por `if`:** `AuthProvider` llama siempre los mismos
`useState`/`useEffect` (`AUTH_MODE` se fija por build, no cambia en tiempo de ejecución) y cada
método (`iniciarSesion`, etc.) bifurca internamente — así no se violan las reglas de hooks de
React por un hook condicional.

## Development build (por las push)

Las push se hicieron con `expo-notifications` (2026-10-15, solo Android; ver
`features/push/README.md`), así que **el login no cambia**: sigue con el SDK web de Firebase,
que anda igual en Expo Go y en el development build. Si más adelante se suma iOS con
`@react-native-firebase/messaging`, se puede evaluar pasar también el login a
`@react-native-firebase/auth` (un solo SDK nativo, como describe el informe en el cap. 4);
gracias a `useAuth()` las pantallas no cambiarían.

**Cerrar sesión borra primero el token de push** de este celular (`dejarDeRecibirPush`, de
`features/push/`, 2026-10-15): espera como máximo 3 s y sale igual si falla.

## Decisiones tomadas

- **Sin verificación de email** (2026-10-05): reemplazada por la lista de proveedores
  permitidos al crear la cuenta.
- **Invitaciones (RF12):** solo a familiares que ya tienen cuenta (sin invitaciones pendientes);
  ver `docs/vinculacion-kit.md` → "Decisiones".
