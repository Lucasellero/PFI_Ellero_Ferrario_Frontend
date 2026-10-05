/**
 * Sesión del familiar. HOY ES UN MOCK: las cuentas viven en memoria (se pierden al recargar la
 * app) y la cuenta demo `ana.gomez@mail.com` entra con cualquier contraseña.
 *
 * La interfaz (`useAuth`) es la que va a tener la versión con Firebase Authentication, así las
 * pantallas no cambian cuando se conecte. Plan de migración en src/features/auth/README.md.
 */
import { createContext, use, useState, type ReactNode } from 'react';

import { api, configurarTokenProvider } from '@/api/client';
import { EMAIL_DEMO } from '@/api/mock';
import {
  validarConfirmacion,
  validarContrasenaNueva,
  validarEmail,
  validarEmailRegistro,
  validarNombre,
} from '@/lib/validaciones';

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

/** Cuentas creadas en esta sesión de la app (solo mock). email → contraseña. */
const cuentasMock = new Map<string, string>();

const simularRed = (ms: number) => new Promise((r) => setTimeout(r, ms));

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);

  // Con Firebase: el ID token sale de `user.getIdToken()` (se renueva solo). En el mock, la API
  // de prueba identifica al familiar con este token falso.
  const usarToken = (email: string) => configurarTokenProvider(async () => `mock:${email}`);

  function abrirSesion(email: string) {
    usarToken(email);
    setUsuario({ uid: `mock-${email}`, email });
  }

  const value: AuthContextValue = {
    usuario,

    async iniciarSesion(email, contrasena) {
      const mail = validarEmail(email);
      if (!mail.ok) throw new AuthError(mail.error);
      if (!contrasena) throw new AuthError('Ingresá tu contraseña.');
      await simularRed(600);
      const guardada = cuentasMock.get(mail.valor);
      const esDemo = mail.valor === EMAIL_DEMO && contrasena.length >= 6;
      // Mismo mensaje para "no existe" y "contraseña incorrecta" (como Firebase con
      // `auth/invalid-credential`): no revela qué mails tienen cuenta.
      if (!esDemo && guardada !== contrasena) throw new AuthError('El correo o la contraseña no son correctos.');
      abrirSesion(mail.valor);
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

      await simularRed(700);
      if (m.valor === EMAIL_DEMO || cuentasMock.has(m.valor)) {
        throw new AuthError('Ya hay una cuenta con ese correo. Iniciá sesión o recuperá la contraseña.');
      }
      // El perfil se crea ANTES de marcar la sesión como iniciada: apenas hay `usuario`, la app
      // pide `GET /me` para decidir si mostrar la vinculación.
      usarToken(m.valor);
      try {
        await api.crearPerfil({ nombre: n.valor });
      } catch {
        configurarTokenProvider(async () => null);
        throw new AuthError('No pudimos terminar de crear la cuenta. Revisá tu conexión y probá de nuevo.');
      }
      cuentasMock.set(m.valor, contrasena);
      abrirSesion(m.valor);
    },

    async cerrarSesion() {
      configurarTokenProvider(async () => null);
      setUsuario(null);
    },

    async recuperarContrasena(email) {
      const mail = validarEmail(email);
      if (!mail.ok) throw new AuthError('Escribí tu correo arriba y tocá de nuevo "Olvidé mi contraseña".');
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
