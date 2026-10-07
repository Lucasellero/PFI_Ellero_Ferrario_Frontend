/**
 * Configuración de entorno. Expo inyecta en tiempo de build las variables que empiezan con
 * `EXPO_PUBLIC_` (ver `.env.example`). No poner secretos acá: todo esto termina dentro de la app.
 */

/** "mock": datos de prueba en memoria (default). "http": pega contra el backend cloud real. */
export const API_MODE: 'mock' | 'http' =
  process.env.EXPO_PUBLIC_API_MODE === 'http' ? 'http' : 'mock';

/** URL base del backend cloud (`uvicorn main:app` en el repo Backend, carpeta `cloud/`). */
export const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8000';

/**
 * "mock" (default): cuentas en memoria, sin red (ver `features/auth/README.md`, sección
 * "Estado: MOCK") — permite seguir probando la app sin depender de Firebase. "firebase": login
 * real contra el proyecto `pfi-ellero-ferrario` (Email/Password). Independiente de `API_MODE`:
 * se puede loguear con Firebase real y seguir viendo datos de prueba (`API_MODE=mock`), o
 * viceversa.
 */
export const AUTH_MODE: 'mock' | 'firebase' =
  process.env.EXPO_PUBLIC_AUTH_MODE === 'firebase' ? 'firebase' : 'mock';

/** `firebaseConfig` de la app web `pfi-test` del proyecto `pfi-ellero-ferrario` (pública, no es
 * secreta: identifica el proyecto, no autentica — ver `cloud/README.md` → "Cómo seguir" → 2). */
export const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};
