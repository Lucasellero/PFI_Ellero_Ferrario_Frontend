# `api/` — Acceso a datos

Único lugar de la app que sabe de dónde vienen los datos. Las pantallas usan `api` (de
`client.ts`) y no saben si del otro lado hay un mock o el backend real.

| Archivo | Qué es |
|---|---|
| `types.ts` | Tipos de la API, calcados de `cloud/app/schemas.py` del Backend. **Sincronizar a mano** si cambia el backend. |
| `client.ts` | Interfaz `Api` + elige mock o HTTP según `EXPO_PUBLIC_API_MODE`. |
| `http.ts` | Implementación real con `fetch`. Manda `Authorization: Bearer <firebase_id_token>`. |
| `mock.ts` | Datos de prueba en memoria, con la misma forma que manda el backend. |
| `errors.ts` | `ApiError` (status HTTP + mensaje de FastAPI `detail`). |

## Modos

- **`mock`** (default): no necesita nada. Los eventos se generan relativos a la hora actual
  (siempre hay datos de "hoy"); marcar alertas como resueltas dura hasta recargar la app.
  Simula también cuentas, kits y hogares para probar la vinculación por QR (ver abajo). El
  familiar se identifica por el token falso `mock:<email>` que arma `AuthProvider`.
- **`http`**: pega contra `EXPO_PUBLIC_API_URL`. Desde el celular con Expo Go, la URL tiene que
  ser la **IP de la PC en la red local** (no `localhost`), y el backend se levanta con
  `uvicorn main:app --host 0.0.0.0`. Requiere además `EXPO_PUBLIC_AUTH_MODE=firebase` (ver
  `features/auth/README.md`): con `AUTH_MODE=mock` el token es `mock:<email>`, que el backend
  real rechaza. Probado de punta a punta (2026-10-07) con `fastapi.testclient` + un ID token real
  de Firebase y Postgres: `GET`/`POST /me`, `POST /kits/vincular`, `PATCH` ubicación,
  `PUT residente`, eventos del hogar. Sin probar todavía desde la app en un celular.

## Contrato con el backend

| Método `Api` | Endpoint | Estado en el backend |
|---|---|---|
| `listarEventos` | `GET /hogares/{id}/eventos?limit=` | ✅ Existe (`cloud/app/routers/mobile.py`) |
| — | `GET /hogares/{id}/alertas` | ✅ Existe, la app no lo usa: filtra severidad del lado del cliente (ver `features/eventos`) |
| `obtenerPerfil` | `GET /me` | ✅ Existe e implementado en `http.ts` (2026-10-07) |
| `crearPerfil` | `POST /me` | ✅ Existe e implementado en `http.ts` (2026-10-07) |
| `vincularKit` | `POST /kits/vincular` | ✅ Existe e implementado en `http.ts` (2026-10-07) |
| `listarCamaras` | `GET /hogares/{id}/camaras` | ✅ Existe e implementado en `http.ts` (2026-10-07) |
| `actualizarCamara` | `PATCH /hogares/{id}/camaras/{camara_id}` | ✅ Existe e implementado en `http.ts` (2026-10-07) |
| `guardarResidente` | `PUT /hogares/{id}/residente` | ✅ Existe e implementado en `http.ts` (2026-10-07) |
| `marcarResuelta` | `POST /hogares/{id}/eventos/{evento_id}/resolver` | ✅ Existe e implementado en `http.ts` (2026-10-07). Cualquier familiar vinculado, idempotente |
| — | campo `ubicacion` en `EventoOut` | ✅ Existe (2026-10-07). Join con `Camara.ubicacion`, `null` si no vino de una cámara o no se cargó |
| — | filtros `tipo`, `desde`, `hasta` en `/eventos` (RF13) | ✅ Existe en el backend (2026-10-07). **La app todavía no los usa** — sigue pidiendo los últimos 200 y filtrando local |
| `obtenerResumenRutina` | `GET /hogares/{id}/rutina?periodo=hoy\|semana\|mes` (propuesto) | ❌ **Falta.** Necesita exponer la línea base de `baseline/` — `LineaBaseComportamiento` existe en el modelo pero `baseline_runner.py` todavía no la escribe |
| — | `POST /me/push-token` (RF8) | ❌ **Falta.** Diseño en `cloud/README.md` → "Cómo seguir" punto 3; decidido: columna `push_token` (null) en `Familiar` (ver `docs/vinculacion-kit.md`) |

**Vinculación del kit:** contrato completo (bodies, respuestas, errores 404/409/429, qué hace
cada endpoint y seguridad) y cambios a la base de datos en
[`docs/vinculacion-kit.md`](../../docs/vinculacion-kit.md). `GET /me` además tiene que traer
`residente: null` mientras falta la configuración inicial, y
`kit: { numero_serie, cantidad_camaras }` (plan de 1 a 3 cámaras que viene de fábrica).

### Datos de prueba de la vinculación (mock)

| Serie | Código | Para probar |
|---|---|---|
| LR-000124 | `4HDW-8R2N` | Plan de 1 cámara: el paso 3 pide una sola ubicación |
| LR-000125 | `M2VC-5ZKA` | Plan de 2 cámaras |
| LR-000123 | `7K3P-9QXM` | Plan de 3 cámaras (el máximo) |
| LR-000101 | `Q9TB-6XJV` | Ya vinculado a la cuenta demo → error "ya vinculado" |

Después de 5 códigos inexistentes seguidos el mock responde 429 (demasiados intentos), como
debería hacer el backend.

### Forma propuesta de lo que falta

```jsonc
// GET /me
{
  "familiar": { "id": 1, "nombre": "Ana Gómez", "email": "ana@mail.com" },
  "hogares": [{
    "id": 1, "nombre": "Casa de Rosa", "rol": "responsable_principal",
    "residente": { "id": 1, "nombre": "Rosa Méndez", "telefono": "+54911..." },  // null = sin configurar
    "kit": { "numero_serie": "LR-000101" }
  }]
}
// Implica sumar `telefono` (nullable) a `Residente` en el backend — lo usa "Llamar a Rosa".

// EventoOut: sumar
{ "ubicacion": "Living", "resuelta": false }

// GET /hogares/{id}/rutina?periodo=semana
{
  "periodo": "semana",
  "indicadores": [
    { "clave": "sedentarismo", "titulo": "Sedentarismo", "valor": "2 h 10 min por día",
      "habitual": "habitual 1 h por día", "estado": "desvio" }
  ]
}
```

Los textos de los indicadores de rutina (`valor`, `habitual`) se proponen armados del lado del
backend porque es el que conoce la línea base; si se prefiere mandar números crudos, cambiar
`IndicadorRutina` en `types.ts` y armar los textos en `features/reportes`.

## Pendiente

- `obtenerResumenRutina` en `http.ts`: sigue en `pendiente(...)` (`ApiError` 501) hasta que el
  backend escriba la línea base.
- Pasar `listarEventos` a mandar los filtros `tipo`/`desde`/`hasta` que ya acepta el backend
  (RF13) en vez de pedir los últimos 200 y filtrar del lado del cliente.
- Probar el modo `http` desde la app en un celular (hoy solo probado con `TestClient` del lado
  del backend).
