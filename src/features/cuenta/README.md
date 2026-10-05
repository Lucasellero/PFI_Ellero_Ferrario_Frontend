# `features/cuenta/` — Perfil y etapa de la cuenta

`CuentaProvider` pide el perfil del familiar (`GET /me`) apenas hay sesión y dice en qué
**etapa** está la cuenta. El layout raíz (`src/app/_layout.tsx`) usa la etapa para decidir qué
rutas existen:

| Etapa | Cuándo | Rutas |
|---|---|---|
| `sin-sesion` | No hay usuario | `/login`, `/registro` |
| `cargando` / `error` | Pidiendo `GET /me` (o falló) | Capa de carga encima, con "Reintentar" y "Cerrar sesión" |
| `sin-hogar` | `hogares: []` (cuenta nueva) | `/vinculacion` (escanear el QR) |
| `configurando` | Un hogar con `residente: null` | `/vinculacion` (retoma en el paso 2) |
| `lista` | Un hogar con residente | Pestañas |

```ts
const { etapa, perfil, hogarActivo, hogarPendiente, recargarPerfil } = useCuenta();
```

- `hogarActivo`: el hogar ya configurado que usan las pestañas (tipo `HogarResumen`, con
  residente siempre presente).
- `hogarPendiente`: el hogar con el kit vinculado pero sin terminar la configuración.
- `recargarPerfil()`: se llama después de vincular el kit y al terminar la configuración; con eso
  cambia la etapa y la navegación se acomoda sola.

## Decisiones

- **El perfil vive acá y no en `HogarProvider`.** Antes lo cargaba `HogarProvider`, pero ese solo
  existe dentro de las pestañas, y para saber si mostrar las pestañas o la vinculación hace falta
  el perfil antes. `HogarProvider` ahora toma `perfil` y `hogarActivo` de acá y se ocupa solo de
  los eventos.
- **"Configuración terminada" = el hogar tiene residente.** No hace falta un campo extra en el
  backend: `GET /me` ya trae `residente: null` hasta que se carga (ver
  `docs/vinculacion-kit.md`).
- **La carga se muestra como capa encima del Stack**, no reemplazándolo: Expo Router necesita el
  navegador raíz siempre montado.
