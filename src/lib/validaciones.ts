/**
 * Validaciones de formularios. Cada función recibe lo que escribió el usuario y devuelve
 * `{ ok: true, valor }` con el dato limpio/normalizado (lo que se manda al backend) o
 * `{ ok: false, error }` con un mensaje en español listo para mostrar debajo del campo.
 *
 * Son funciones puras (sin React): se pueden probar sueltas y reusar en cualquier pantalla.
 * Ver src/lib/README.md.
 */

export type Resultado<T = string> = { ok: true; valor: T } | { ok: false; error: string };

const ok = <T>(valor: T): Resultado<T> => ({ ok: true, valor });
const error = <T = string>(mensaje: string): Resultado<T> => ({ ok: false, error: mensaje });

// ── Mail ──────────────────────────────────────────────────────────────────────

/** Algo@algo.dominio, sin espacios; el dominio final con al menos 2 letras. */
const EMAIL = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;

export function validarEmail(texto: string): Resultado {
  const limpio = texto.trim().toLowerCase();
  if (!limpio) return error('Ingresá tu correo electrónico.');
  if (limpio.length > 254 || !EMAIL.test(limpio)) return error('Revisá el correo: tiene que ser como nombre@mail.com.');
  return ok(limpio);
}

/**
 * Proveedores de correo aceptados al CREAR una cuenta. Reemplaza la verificación por mail (el
 * informe la descartó): un proveedor conocido reduce las cuentas con mails mal tipeados o
 * descartables. `mail.com` está por la cuenta demo (`ana.gomez@mail.com`).
 */
export const DOMINIOS_PERMITIDOS = [
  'gmail.com',
  'googlemail.com',
  'hotmail.com',
  'hotmail.com.ar',
  'outlook.com',
  'outlook.com.ar',
  'live.com',
  'live.com.ar',
  'yahoo.com',
  'yahoo.com.ar',
  'icloud.com',
  'me.com',
  'mail.com',
] as const;

/** Como `validarEmail`, y además exige un proveedor de `DOMINIOS_PERMITIDOS`. Solo para el registro. */
export function validarEmailRegistro(texto: string): Resultado {
  const v = validarEmail(texto);
  if (!v.ok) return v;
  const dominio = v.valor.split('@')[1];
  if (!(DOMINIOS_PERMITIDOS as readonly string[]).includes(dominio)) {
    return error('Usá un correo de Gmail, Hotmail, Outlook, Yahoo o iCloud.');
  }
  return v;
}

// ── Contraseña ────────────────────────────────────────────────────────────────

export const CONTRASENA_MIN = 8;

/** Reglas para crear una contraseña (registro). Se muestran como lista mientras se escribe. */
export function reglasContrasena(texto: string) {
  return [
    { texto: `Al menos ${CONTRASENA_MIN} caracteres`, cumple: texto.length >= CONTRASENA_MIN },
    { texto: 'Al menos una letra', cumple: /[a-záéíóúñü]/i.test(texto) },
    { texto: 'Al menos un número', cumple: /\d/.test(texto) },
  ];
}

export function validarContrasenaNueva(texto: string): Resultado {
  if (!texto) return error('Elegí una contraseña.');
  const falta = reglasContrasena(texto).find((r) => !r.cumple);
  return falta ? error(`La contraseña necesita: ${falta.texto.toLowerCase()}.`) : ok(texto);
}

export function validarConfirmacion(contrasena: string, confirmacion: string): Resultado {
  if (!confirmacion) return error('Repetí la contraseña.');
  return confirmacion === contrasena ? ok(confirmacion) : error('Las contraseñas no coinciden.');
}

// ── Nombres ───────────────────────────────────────────────────────────────────

/** Letras (con tildes), espacios, apóstrofo, punto y guion. Ej. "María José", "O'Connor". */
const NOMBRE = /^[a-záéíóúñüàèìòùâêîôûäëïöç' .-]+$/i;

export function validarNombre(texto: string, campo = 'el nombre'): Resultado {
  const limpio = texto.trim().replace(/\s+/g, ' ');
  if (!limpio) return error(`Ingresá ${campo}.`);
  if (limpio.length < 2) return error(`Revisá ${campo}: es muy corto.`);
  if (limpio.length > 60) return error(`Revisá ${campo}: máximo 60 caracteres.`);
  if (!NOMBRE.test(limpio)) return error(`Revisá ${campo}: solo letras y espacios.`);
  return ok(limpio);
}

// ── Teléfono argentino ────────────────────────────────────────────────────────

/**
 * Valida un teléfono de Argentina escrito "como sea" y lo devuelve en formato internacional
 * (E.164), que es el que sirve para llamar con `tel:` desde cualquier celular:
 * - Celular → +54 9 + código de área + número (ej. "11 15 2345-6789" → "+5491123456789").
 * - Fijo    → +54 + código de área + número  (ej. "011 4567-8901"   → "+541145678901").
 *
 * Acepta con o sin +54, el 9 de celular, el 0 de larga distancia y el 15 local. Código de
 * área + número siempre suman 10 dígitos en Argentina; eso es lo que se controla.
 * Un celular se reconoce por el 9 (después del +54) o por el 15 (después del código de área).
 */
export function validarTelefonoAR(texto: string): Resultado {
  const crudo = texto.trim();
  if (!crudo) return error('Ingresá un teléfono.');
  if (/[^\d\s()+.-]/.test(crudo)) return error('Revisá el teléfono: solo números, espacios y guiones.');

  let digitos = crudo.replace(/\D/g, '');
  let celular = false;

  if (crudo.startsWith('+') || digitos.startsWith('54')) {
    if (!digitos.startsWith('54')) return error('Por ahora solo se aceptan teléfonos de Argentina (+54).');
    digitos = digitos.slice(2);
    if (digitos.startsWith('9')) {
      celular = true;
      digitos = digitos.slice(1);
    }
  }
  if (digitos.startsWith('0')) digitos = digitos.slice(1); // 0 de larga distancia

  // "15" local de celular: va después del código de área (2, 3 o 4 dígitos).
  if (digitos.length === 12) {
    for (const largoArea of [2, 3, 4]) {
      if (digitos.slice(largoArea, largoArea + 2) === '15') {
        digitos = digitos.slice(0, largoArea) + digitos.slice(largoArea + 2);
        celular = true;
        break;
      }
    }
  }

  if (digitos.length !== 10) {
    return error('Revisá el teléfono: con el código de área tienen que ser 10 números (ej. 11 2345-6789).');
  }
  return ok(`+54${celular ? '9' : ''}${digitos}`);
}

/** "+5491123456789" → "+54 9 11 2345-6789" (para mostrar; asume código de área 11 si no sabe). */
export function formatearTelefonoAR(e164: string): string {
  const m = /^\+54(9?)(\d{10})$/.exec(e164);
  if (!m) return e164;
  const [, nueve, nacional] = m;
  // Sin la tabla de códigos de área no se puede cortar exacto: se usa 2 dígitos para AMBA (11)
  // y 3 para el resto, que es lo más común.
  const largoArea = nacional.startsWith('11') ? 2 : 3;
  const area = nacional.slice(0, largoArea);
  const numero = nacional.slice(largoArea);
  const corte = numero.length - 4;
  return `+54 ${nueve ? '9 ' : ''}${area} ${numero.slice(0, corte)}-${numero.slice(corte)}`;
}

// ── Texto libre corto (ej. ubicación de una cámara) ──────────────────────────

export function validarTextoCorto(texto: string, campo: string, max = 40): Resultado {
  const limpio = texto.trim().replace(/\s+/g, ' ');
  if (!limpio) return error(`Ingresá ${campo}.`);
  if (limpio.length < 2) return error(`Revisá ${campo}: es muy corto.`);
  if (limpio.length > max) return error(`Revisá ${campo}: máximo ${max} caracteres.`);
  return ok(limpio);
}

/**
 * Ubicación de cada cámara de un hogar: obligatoria, corta y sin repetirse entre cámaras
 * (RF10). La usan tanto la configuración inicial (`features/vinculacion/`) como editarlas
 * después desde Perfil (`features/perfil/`) — misma regla, un solo lugar.
 */
export function validarUbicaciones(ubicaciones: Record<number, string>): Record<number, Resultado> {
  const resultado: Record<number, Resultado> = {};
  const vistas = new Map<string, number>();
  for (const [id, texto] of Object.entries(ubicaciones)) {
    const v = validarTextoCorto(texto, 'dónde está la cámara');
    if (v.ok) {
      const clave = v.valor.toLowerCase();
      if (vistas.has(clave)) {
        resultado[Number(id)] = {
          ok: false,
          error: `"${v.valor}" ya es otra cámara. Sumale un detalle (ej. "${v.valor} 2").`,
        };
        continue;
      }
      vistas.set(clave, Number(id));
    }
    resultado[Number(id)] = v;
  }
  return resultado;
}
