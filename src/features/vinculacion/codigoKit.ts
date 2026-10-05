/**
 * Formato del código de vinculación de un kit Lares (ver docs/vinculacion-kit.md).
 *
 * - Código: 8 caracteres del alfabeto Crockford base32 (sin I, L, O ni U, para que no se
 *   confundan con 1 y 0 al tipearlos). Se imprime y se muestra como "7K3P-9QXM".
 * - QR: una URL `lares://vincular?serie=LR-000123&codigo=7K3P9QXM`. La app la lee con su propio
 *   escáner; el esquema `lares://` además permite, en un build propio, que la cámara del
 *   celular abra la app directo en la vinculación.
 * - Número de serie: "LR-" + 6 dígitos. Es informativo (soporte, etiqueta de la caja); para
 *   vincular alcanza con el código.
 */
import type { Resultado } from '@/lib/validaciones';

export const LARGO_CODIGO = 8;
const ALFABETO = /^[0-9ABCDEFGHJKMNPQRSTVWXYZ]+$/;
const SERIE = /^LR-\d{6}$/;

export interface CodigoKit {
  /** Normalizado: 8 caracteres, mayúsculas, sin guion. Es lo que se manda al backend. */
  codigo: string;
  /** Solo si vino en el QR. */
  serie?: string;
}

/**
 * Normaliza lo que tipea el usuario: mayúsculas, sin espacios ni guiones, y corrige las letras
 * que Crockford reemplaza (O→0, I/L→1). Así "7k3p 9qxm" o "7K3P-9QXM" valen lo mismo.
 */
export function normalizarCodigo(texto: string): string {
  return texto
    .toUpperCase()
    .replace(/[\s-]/g, '')
    .replace(/O/g, '0')
    .replace(/[IL]/g, '1');
}

/** "7K3P9QXM" → "7K3P-9QXM" (también sirve mientras se escribe). */
export function formatearCodigo(codigo: string): string {
  const c = normalizarCodigo(codigo).slice(0, LARGO_CODIGO);
  return c.length > 4 ? `${c.slice(0, 4)}-${c.slice(4)}` : c;
}

export function validarCodigoKit(texto: string): Resultado<CodigoKit> {
  const codigo = normalizarCodigo(texto);
  if (!codigo) return { ok: false, error: 'Ingresá el código que está debajo del QR.' };
  if (!ALFABETO.test(codigo)) return { ok: false, error: 'El código tiene caracteres que no van. Revisalo en la etiqueta del kit.' };
  if (codigo.length !== LARGO_CODIGO) {
    return { ok: false, error: `El código tiene ${LARGO_CODIGO} caracteres (ej. 7K3P-9QXM).` };
  }
  return { ok: true, valor: { codigo } };
}

/**
 * Interpreta el contenido de un QR escaneado. Acepta la URL `lares://vincular?...` y, por
 * tolerancia, un código suelto. Cualquier otro QR (una web, un Wi-Fi) devuelve error.
 */
export function leerQrKit(data: string): Resultado<CodigoKit> {
  const texto = data.trim();
  const url = /^lares:\/\/vincular\?(.+)$/i.exec(texto);
  if (!url) {
    const suelto = validarCodigoKit(texto);
    return suelto.ok ? suelto : { ok: false, error: 'Ese QR no es de un kit Lares. Buscá la etiqueta en la controladora.' };
  }

  const params = new Map(
    url[1].split('&').map((par) => {
      const [k, v = ''] = par.split('=');
      return [k.toLowerCase(), decodeURIComponent(v)] as const;
    }),
  );
  const codigo = validarCodigoKit(params.get('codigo') ?? '');
  if (!codigo.ok) return { ok: false, error: 'El QR del kit está incompleto. Probá ingresando el código a mano.' };
  const serie = params.get('serie')?.toUpperCase();
  return { ok: true, valor: { codigo: codigo.valor.codigo, serie: serie && SERIE.test(serie) ? serie : undefined } };
}
