/**
 * Inicialización del SDK web de Firebase para Expo Go (sin development build). Carga perezosa:
 * solo se ejecuta si `AuthProvider` realmente usa Firebase (`AUTH_MODE === 'firebase'`), así el
 * modo mock no necesita `firebaseConfig` completo. Plan en `README.md`, sección
 * "Plan para conectar Firebase Authentication".
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { type FirebaseApp, getApps, initializeApp } from 'firebase/app';
// @ts-expect-error — `getReactNativePersistence` existe en runtime (Metro resuelve el build RN
// de @firebase/auth) pero falta en los tipos de `firebase/auth` en el SDK v12: bug conocido,
// https://github.com/firebase/firebase-js-sdk/issues/9316 (sin fix al momento de escribir esto).
import { type Auth, getReactNativePersistence, initializeAuth } from 'firebase/auth';

import { firebaseConfig } from '@/config';

let app: FirebaseApp | undefined;
let auth: Auth | undefined;

/** Idempotente: Expo Router puede volver a montar `AuthProvider` sin reinicializar Firebase. */
export function obtenerAuth(): Auth {
  if (auth) return auth;
  app = getApps()[0] ?? initializeApp(firebaseConfig);
  auth = initializeAuth(app, { persistence: getReactNativePersistence(AsyncStorage) });
  return auth;
}
