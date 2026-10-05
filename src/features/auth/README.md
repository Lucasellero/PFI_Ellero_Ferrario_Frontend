# `features/auth/` — Sesión, Login y Crear cuenta

Cubre **RNF10** (inicio de sesión) y la parte de app de **RF12** (solo familiares autorizados
ven las alertas del hogar). Mockup **01 · Login**; "Crear cuenta" no tiene mockup y sigue el
mismo lenguaje.

| Archivo | Qué es |
|---|---|
| `AuthProvider.tsx` | Contexto de sesión: `useAuth()` → `usuario`, `iniciarSesion`, `registrarCuenta`, `cerrarSesion`, `recuperarContrasena`. |
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
| Crear cuenta | Correo | Formato de mail |
| Crear cuenta | Contraseña | 8+ caracteres, una letra y un número (lista en vivo) |
| Crear cuenta | Repetir contraseña | Igual a la anterior |

`AuthProvider` revalida antes de crear la cuenta: es la última barrera del lado de la app
(Firebase y el backend validan de nuevo).

- **Login fallido:** el mismo mensaje para "no existe" y "contraseña incorrecta" ("El correo o
  la contraseña no son correctos"), como hace Firebase: no revela qué mails tienen cuenta.

## Estado: MOCK

- Cuenta demo **`ana.gomez@mail.com`** con cualquier contraseña de 6+ caracteres: entra directo
  a las pestañas con datos de prueba.
- **Crear cuenta** con cualquier otro mail: la cuenta vive en memoria (se pierde al recargar la
  app) y entra a la vinculación del kit.
- No persiste la sesión (al recargar la app hay que volver a entrar).
- "Olvidé mi contraseña" muestra el aviso pero no manda nada.

## Plan para conectar Firebase Authentication

Prerequisito: proyecto de Firebase creado con "Email/Password" habilitado (runbook en
`cloud/README.md` del Backend → "Cómo seguir" → punto 2).

1. **Ahora, en Expo Go:** SDK web de Firebase (`npx expo install firebase`; AsyncStorage ya
   está instalado), con `initializeAuth` + `getReactNativePersistence(AsyncStorage)` para que la
   sesión sobreviva al reinicio. Reemplazar el cuerpo de `AuthProvider`:
   - `iniciarSesion` → `signInWithEmailAndPassword`.
   - `registrarCuenta` → `createUserWithEmailAndPassword` + `updateProfile({ displayName })` +
     `sendEmailVerification`, y después `api.crearPerfil({ nombre })` (`POST /me`) **antes** de
     dar la sesión por iniciada (así `GET /me` ya encuentra al familiar).
   - `cerrarSesion` → `signOut`.
   - `recuperarContrasena` → `sendPasswordResetEmail`.
   - `usuario` ← `onAuthStateChanged`.
   - `configurarTokenProvider(() => auth.currentUser?.getIdToken() ?? null)` — el backend
     verifica ese token (`cloud/app/auth.py`).
   - Traducir los códigos de error de Firebase (`auth/invalid-credential`,
     `auth/email-already-in-use`, `auth/weak-password`...) a `AuthError` con mensaje en español.
2. **Cuando se pase a development build (por las push):** evaluar migrar a
   `@react-native-firebase/auth` + `messaging`, un solo SDK nativo para login y push, que es lo
   que describe literalmente el informe (cap. 4). Gracias a `useAuth()` las pantallas no cambian.

## Decisiones abiertas

- **Verificación de email.** El informe dice que el acceso queda condicionado a confirmar el
  correo. Con Firebase: decidir si con `user.emailVerified === false` se bloquea la vinculación
  del kit (pantalla "Revisá tu mail" con "Reenviar") o solo se avisa.
- **Invitaciones (RF12).** Los familiares que no tienen el kit entran por invitación del
  responsable principal; ver `docs/vinculacion-kit.md` → "Decisiones abiertas".
