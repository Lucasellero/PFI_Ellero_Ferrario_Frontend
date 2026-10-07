# `lib/` — Utilidades sin interfaz

Funciones puras (sin React, sin red) que usan varias features.

| Archivo | Qué es |
|---|---|
| `validaciones.ts` | Validación de formularios: mail, contraseña nueva y confirmación, nombres, teléfono argentino y texto corto. |

## `validaciones.ts`

Cada función recibe lo que escribió el usuario y devuelve `{ ok: true, valor }` con el dato
**limpio** (lo que se manda al backend) o `{ ok: false, error }` con un mensaje en español para
mostrar debajo del campo.

```ts
const tel = validarTelefonoAR('11 15 2345-6789');
// → { ok: true, valor: '+5491123456789' }
```

| Función | Regla |
|---|---|
| `validarEmail` | `algo@algo.dominio`, sin espacios, hasta 254 caracteres. Devuelve en minúsculas y sin espacios alrededor. Login y recuperar contraseña. |
| `validarEmailRegistro` | `validarEmail` + dominio en `DOMINIOS_PERMITIDOS` (Gmail, Hotmail, Outlook, Live, Yahoo, iCloud y sus `.com.ar`; `mail.com` por la demo). Solo al crear cuenta: reemplaza la verificación por mail, que el informe descartó. |
| `validarContrasenaNueva` / `reglasContrasena` | 8+ caracteres, al menos una letra y un número. `reglasContrasena` da la lista para mostrarla en vivo. Solo para **crear** contraseña: en el login no se exige (una cuenta vieja podría no cumplirla). |
| `validarConfirmacion` | Igual a la contraseña. |
| `validarNombre` | 2 a 60 caracteres; letras con tildes, espacios, apóstrofo, punto y guion. Colapsa espacios repetidos. |
| `validarTelefonoAR` | Teléfono de Argentina escrito como sea (con/sin +54, 9, 0, 15, espacios, guiones). Código de área + número = 10 dígitos. Devuelve **E.164**: `+549…` si es celular (tenía 9 o 15), `+54…` si es fijo. |
| `formatearTelefonoAR` | E.164 → "+54 9 11 2345-6789" para mostrar. |
| `validarTextoCorto` | Obligatorio, 2 a `max` caracteres (ej. ubicación de una cámara). |
| `validarUbicaciones` | `validarTextoCorto` sobre un mapa `{ camaraId: texto }` + que no se repita entre cámaras del mismo hogar (RF10). Usada por la configuración inicial y por editar cámaras desde Perfil — una sola regla. |

### Decisiones

- **Teléfono solo argentino.** El público del informe es local. Un número de otro país da error
  ("Por ahora solo se aceptan teléfonos de Argentina").
- **Celular vs. fijo por el 9 o el 15.** Sin ellos no hay forma de saberlo, y un celular
  guardado sin el 9 no se puede llamar desde el exterior del área. Por eso la ayuda del campo
  pide "si es celular, con el 15".
- **Las pantallas validan al salir de cada campo y al enviar**, no en cada tecla (salvo las
  reglas de la contraseña, que se ven en vivo). Así no aparece "mail inválido" mientras se está
  escribiendo.
- **El backend tiene que validar de nuevo**: estas validaciones son para ayudar al usuario, no
  una barrera de seguridad.

Probadas con 31 casos (teléfonos de AMBA y del interior, fijos y celulares, mails, códigos de
kit y QR ajenos) compilando los archivos sueltos; no hay todavía un framework de tests en el
repo.
