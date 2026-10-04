# `features/auth/` — Sesión y Login

Cubre **RNF10** (inicio de sesión) y la parte de app de **RF12** (solo familiares autorizados
ven las alertas del hogar). Mockup **01 · Login**.

| Archivo | Qué es |
|---|---|
| `AuthProvider.tsx` | Contexto de sesión: `useAuth()` → `usuario`, `iniciarSesion`, `cerrarSesion`, `recuperarContrasena`. |
| `LoginScreen.tsx` | Pantalla de login: logo y frase de la marca, correo, contraseña, "Olvidé mi contraseña", pie de privacidad. |

**Marca en el Login** (informe, cap. 3, "Branding"): el símbolo del logo
(`assets/images/logo-simbolo.png`) dentro de un cuadrado blanco redondeado, "LARES" en el verde
principal y la frase *"La distancia deja de ser un problema."*. El nombre se escribe como texto
(no como imagen) para que lo lean los lectores de pantalla.

La ruta raíz (`src/app/_layout.tsx`) usa `usuario` para decidir qué se puede ver: sin sesión
solo `/login`; con sesión, las pestañas (`Stack.Protected`).

## Estado: MOCK

- Acepta cualquier correo válido + contraseña de 6+ caracteres.
- No persiste la sesión (al recargar la app hay que volver a entrar).
- "Olvidé mi contraseña" muestra el aviso pero no manda nada.

## Plan para conectar Firebase Authentication

Prerequisito: proyecto de Firebase creado con "Email/Password" habilitado (runbook en
`cloud/README.md` del Backend → "Cómo seguir" → punto 2).

1. **Ahora, en Expo Go:** SDK web de Firebase (`npx expo install firebase
   @react-native-async-storage/async-storage`), con `initializeAuth` +
   `getReactNativePersistence(AsyncStorage)` para que la sesión sobreviva al reinicio.
   Reemplazar el cuerpo de `AuthProvider`:
   - `iniciarSesion` → `signInWithEmailAndPassword`.
   - `cerrarSesion` → `signOut`.
   - `recuperarContrasena` → `sendPasswordResetEmail`.
   - `usuario` ← `onAuthStateChanged`.
   - `configurarTokenProvider(() => auth.currentUser?.getIdToken() ?? null)` — el backend
     verifica ese token (`cloud/app/auth.py`).
   - Traducir los códigos de error de Firebase (`auth/invalid-credential`, etc.) a `AuthError`
     con mensaje en español.
2. **Cuando se pase a development build (por las push):** evaluar migrar a
   `@react-native-firebase/auth` + `messaging`, un solo SDK nativo para login y push, que es lo
   que describe literalmente el informe (cap. 4). Gracias a `useAuth()` las pantallas no cambian.

## Decisiones abiertas

- **Verificación de email.** El informe dice que el acceso queda condicionado a confirmar el
  correo. Con Firebase: si `user.emailVerified` es `false`, no dejar entrar y ofrecer reenviar el
  mail.
- **Alta de cuentas.** Los mockups no tienen pantalla de registro. Depende de cómo se resuelva
  RF12 en el backend (invitación por email desde el responsable principal, ver `cloud/README.md`
  punto 4): puede ser "Crear cuenta" en el login o un link de invitación.
