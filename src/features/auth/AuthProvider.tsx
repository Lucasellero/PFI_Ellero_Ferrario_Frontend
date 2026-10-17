/**
 * Sesión del familiar. Dos implementaciones según `AUTH_MODE` (`src/config`):
 * - **mock** (default): cuentas en memoria, sin red — permite seguir probando la app sin
 *   depender de Firebase (ver README, "Estado: MOCK").
 * - **firebase**: Firebase Authentication real (SDK web, Expo Go) contra el proyecto
 *   `pfi-ellero-ferrario`. Plan en README.md, "Plan para conectar Firebase Authentication".
 *
 * Un solo componente (no dos hooks elegidos por `if`, para no llamar hooks condicionalmente):
 * `AUTH_MODE` se fija por build y no cambia en tiempo de ejecución, así que las ramas de abajo
 * son estables entre renders.
 */
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from 'firebase/auth';
import { createContext, use, useEffect, useState, type ReactNode } from 'react';

import { api, configurarTokenProvider } from '@/api/client';
import { EMAIL_DEMO } from '@/api/mock';
import { AUTH_MODE } from '@/config';
import { dejarDeRecibirPush } from '@/features/push/push';
import {
  validarConfirmacion,
  validarContrasenaNueva,
  validarEmail,
  validarEmailRegistro,
  validarNombre,
} from '@/lib/validaciones';

import { obtenerAuth } from './firebase';

export interface Usuario {
  uid: string;
  email: string;
}

export interface DatosRegistro {
  nombre: string;
  email: string;
  contrasena: string;
  confirmacion: string;
}

interface AuthContextValue {
  usuario: Usuario | null;
  iniciarSesion(email: string, contrasena: string): Promise<void>;
  /**
   * Crea la cuenta y deja la sesión iniciada. Con Firebase: `createUserWithEmailAndPassword` +
   * `POST /me` (crea el `Familiar` en el backend con el nombre). Sin mail de verificación: el
   * informe la descartó y en su lugar solo se aceptan proveedores conocidos (`validarEmailRegistro`).
   */
  registrarCuenta(datos: DatosRegistro): Promise<void>;
  cerrarSesion(): Promise<void>;
  recuperarContrasena(email: string): Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/** Mensajes en español para mostrar directo en pantalla. */
export class AuthError extends Error {}

/** Traduce los códigos de error de Firebase Auth (`error.code`, ej. "auth/invalid-credential")
 * a mensajes en español para la pantalla. No se tipa como `FirebaseError`: ese tipo no lo
 * reexporta `firebase/auth` en esta versión del SDK. */
function mensajeErrorFirebase(error: unknown): string {
  const codigo = error instanceof Object && 'code' in error ? (error as { code: string }).code : undefined;
  switch (codigo) {
    case 'auth/invalid-credential':
    case 'auth/invalid-email':
    case 'auth/user-not-found':
    case 'auth/wrong-password':
      return 'El correo o la contraseña no son correctos.';
    case 'auth/email-already-in-use':
      return 'Ya hay una cuenta con ese correo. Iniciá sesión o recuperá la contraseña.';
    case 'auth/weak-password':
      return 'La contraseña tiene que tener 8 o más caracteres, con una letra y un número.';
    case 'auth/too-many-requests':
      return 'Demasiados intentos. Esperá unos minutos y probá de nuevo.';
    case 'auth/network-request-failed':
      return 'No pudimos conectarnos. Revisá tu conexión y probá de nuevo.';
    default:
      return 'Algo salió mal. Probá de nuevo en un momento.';
  }
}

/** Cuentas creadas en esta sesión de la app (solo `AUTH_MODE=mock`). email → contraseña. */
const cuentasMock = new Map<string, string>();

const simularRed = (ms: number) => new Promise((r) => setTimeout(r, ms));

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  // Con Firebase: evita un parpadeo a "sin sesión" mientras se restaura la sesión guardada en
  // AsyncStorage al abrir la app. En mock no hay nada que restaurar, arranca listo.
  const [listo, setListo] = useState(AUTH_MODE !== 'firebase');

  useEffect(() => {
    if (AUTH_MODE !== 'firebase') return;
    const auth = obtenerAuth();
    configurarTokenProvider(() => auth.currentUser?.getIdToken() ?? Promise.resolve(null));
    return onAuthStateChanged(auth, (user) => {
      setUsuario(user ? { uid: user.uid, email: user.email ?? '' } : null);
      setListo(true);
    });
  }, []);

  // En el mock, la API de prueba identifica al familiar con este token falso.
  const usarTokenMock = (email: string) => configurarTokenProvider(async () => `mock:${email}`);

  function abrirSesionMock(email: string) {
    usarTokenMock(email);
    setUsuario({ uid: `mock-${email}`, email });
  }

  const value: AuthContextValue = {
    usuario: listo ? usuario : null,

    async iniciarSesion(email, contrasena) {
      const mail = validarEmail(email);
      if (!mail.ok) throw new AuthError(mail.error);
      if (!contrasena) throw new AuthError('Ingresá tu contraseña.');

      if (AUTH_MODE === 'firebase') {
        try {
          await signInWithEmailAndPassword(obtenerAuth(), mail.valor, contrasena);
        } catch (error) {
          throw new AuthError(mensajeErrorFirebase(error));
        }
        return;
      }

      await simularRed(600);
      const guardada = cuentasMock.get(mail.valor);
      const esDemo = mail.valor === EMAIL_DEMO && contrasena.length >= 6;
      // Mismo mensaje para "no existe" y "contraseña incorrecta" (como Firebase con
      // `auth/invalid-credential`): no revela qué mails tienen cuenta.
      if (!esDemo && guardada !== contrasena) throw new AuthError('El correo o la contraseña no son correctos.');
      abrirSesionMock(mail.valor);
    },

    async registrarCuenta({ nombre, email, contrasena, confirmacion }) {
      // Se revalida acá aunque la pantalla ya valide: es la última barrera antes de crear la
      // cuenta (y Firebase/backend validan de nuevo del otro lado).
      const n = validarNombre(nombre, 'tu nombre');
      const m = validarEmailRegistro(email);
      const c = validarContrasenaNueva(contrasena);
      const r = validarConfirmacion(contrasena, confirmacion);
      const primerError = [n, m, c, r].find((x) => !x.ok);
      if (primerError && !primerError.ok) throw new AuthError(primerError.error);
      if (!n.ok || !m.ok) return;

      if (AUTH_MODE === 'firebase') {
        const auth = obtenerAuth();
        let credencial;
        try {
          credencial = await createUserWithEmailAndPassword(auth, m.valor, contrasena);
          await updateProfile(credencial.user, { displayName: n.valor });
        } catch (error) {
          throw new AuthError(mensajeErrorFirebase(error));
        }
        // El perfil se crea ANTES de que `onAuthStateChanged` deje pasar a la app: apenas hay
        // `usuario`, `CuentaProvider` pide `GET /me` para decidir si mostrar la vinculación.
        try {
          await api.crearPerfil({ nombre: n.valor });
        } catch {
          await credencial.user.delete().catch(() => {});
          throw new AuthError('No pudimos terminar de crear la cuenta. Revisá tu conexión y probá de nuevo.');
        }
        return;
      }

      await simularRed(700);
      if (m.valor === EMAIL_DEMO || cuentasMock.has(m.valor)) {
        throw new AuthError('Ya hay una cuenta con ese correo. Iniciá sesión o recuperá la contraseña.');
      }
      // El perfil se crea ANTES de marcar la sesión como iniciada: apenas hay `usuario`, la app
      // pide `GET /me` para decidir si mostrar la vinculación.
      usarTokenMock(m.valor);
      try {
        await api.crearPerfil({ nombre: n.valor });
      } catch {
        configurarTokenProvider(async () => null);
        throw new AuthError('No pudimos terminar de crear la cuenta. Revisá tu conexión y probá de nuevo.');
      }
      cuentasMock.set(m.valor, contrasena);
      abrirSesionMock(m.valor);
    },

    async cerrarSesion() {
      // Antes de salir: sin esto, el celular seguiría recibiendo las alertas de la cuenta.
      await dejarDeRecibirPush();
      if (AUTH_MODE === 'firebase') {
        await signOut(obtenerAuth());
        return;
      }
      configurarTokenProvider(async () => null);
      setUsuario(null);
    },

    async recuperarContrasena(email) {
      const mail = validarEmail(email);
      if (!mail.ok) throw new AuthError('Escribí tu correo arriba y tocá de nuevo "Olvidé mi contraseña".');

      if (AUTH_MODE === 'firebase') {
        try {
          await sendPasswordResetEmail(obtenerAuth(), mail.valor);
        } catch (error) {
          throw new AuthError(mensajeErrorFirebase(error));
        }
        return;
      }
      await simularRed(400);
    },
  };

  return <AuthContext value={value}>{children}</AuthContext>;
}

export function useAuth(): AuthContextValue {
  const ctx = use(AuthContext);
  if (!ctx) throw new Error('useAuth tiene que usarse dentro de <AuthProvider>');
  return ctx;
}
