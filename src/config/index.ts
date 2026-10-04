/**
 * Configuración de entorno. Expo inyecta en tiempo de build las variables que empiezan con
 * `EXPO_PUBLIC_` (ver `.env.example`). No poner secretos acá: todo esto termina dentro de la app.
 */

/** "mock": datos de prueba en memoria (default). "http": pega contra el backend cloud real. */
export const API_MODE: 'mock' | 'http' =
  process.env.EXPO_PUBLIC_API_MODE === 'http' ? 'http' : 'mock';

/** URL base del backend cloud (`uvicorn main:app` en el repo Backend, carpeta `cloud/`). */
export const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8000';
