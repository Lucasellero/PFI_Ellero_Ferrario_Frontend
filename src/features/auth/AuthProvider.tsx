/**
 * Sesión del familiar. HOY ES UN MOCK: acepta cualquier email válido con contraseña de 6+
 * caracteres y no persiste la sesión (al recargar la app hay que volver a loguearse).
 *
 * La interfaz (`useAuth`) es la que va a tener la versión con Firebase Authentication, así las
 * pantallas no cambian cuando se conecte. Plan de migración en src/features/auth/README.md.
 */
import { createContext, use, useState, type ReactNode } from 'react';

import { configurarTokenProvider } from '@/api/client';

export interface Usuario {
  uid: string;
  email: string;
}

interface AuthContextValue {
  usuario: Usuario | null;
  iniciarSesion(email: string, contrasena: string): Promise<void>;
  cerrarSesion(): Promise<void>;
  recuperarContrasena(email: string): Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const EMAIL_VALIDO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Mensajes en español para mostrar directo en pantalla. */
export class AuthError extends Error {}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);

  const value: AuthContextValue = {
    usuario,
    async iniciarSesion(email, contrasena) {
      const limpio = email.trim().toLowerCase();
      if (!EMAIL_VALIDO.test(limpio)) throw new AuthError('Revisá el correo electrónico.');
      if (contrasena.length < 6) throw new AuthError('La contraseña tiene al menos 6 caracteres.');
      await new Promise((r) => setTimeout(r, 600));
      // Con Firebase: el ID token sale de `user.getIdToken()` (se renueva solo).
      configurarTokenProvider(async () => null);
      setUsuario({ uid: 'mock-uid', email: limpio });
    },
    async cerrarSesion() {
      configurarTokenProvider(async () => null);
      setUsuario(null);
    },
    async recuperarContrasena(email) {
      if (!EMAIL_VALIDO.test(email.trim())) throw new AuthError('Ingresá tu correo primero.');
      await new Promise((r) => setTimeout(r, 400));
    },
  };

  return <AuthContext value={value}>{children}</AuthContext>;
}

export function useAuth(): AuthContextValue {
  const ctx = use(AuthContext);
  if (!ctx) throw new Error('useAuth tiene que usarse dentro de <AuthProvider>');
  return ctx;
}
