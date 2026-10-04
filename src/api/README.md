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
- **`http`**: pega contra `EXPO_PUBLIC_API_URL`. Desde el celular con Expo Go, la URL tiene que
  ser la **IP de la PC en la red local** (no `localhost`), y el backend se levanta con
  `uvicorn main:app --host 0.0.0.0`. **Hoy no sirve todavía de punta a punta**: el backend no
  tiene Firebase configurado (responde `501`) y faltan los endpoints de abajo.

## Contrato con el backend

| Método `Api` | Endpoint | Estado en el backend |
|---|---|---|
| `listarEventos` | `GET /hogares/{id}/eventos?limit=` | ✅ Existe (`cloud/app/routers/mobile.py`) |
| — | `GET /hogares/{id}/alertas` | ✅ Existe, la app no lo usa: filtra severidad del lado del cliente (ver `features/eventos`) |
| `obtenerPerfil` | `GET /me` | ❌ **Falta.** Sin esto la app no sabe qué `hogar_id` consultar |
| `marcarResuelta` | `POST /hogares/{id}/eventos/{evento_id}/resolver` (propuesto) | ❌ **Falta.** Tampoco existe la columna en `Evento` |
| `obtenerResumenRutina` | `GET /hogares/{id}/rutina?periodo=hoy\|semana\|mes` (propuesto) | ❌ **Falta.** Necesita exponer la línea base de `baseline/` |
| — | campo `ubicacion` en `EventoOut` | ❌ **Falta.** Join con `Camara.ubicacion`; la app lo muestra si viene |
| — | filtros `tipo`, `desde`, `hasta` en `/eventos` (RF13) | ❌ **Falta.** Hoy la app pide los últimos 200 y filtra local |
| — | `POST /me/push-token` (RF8) | ❌ **Falta.** Diseño ya escrito en `cloud/README.md` → "Cómo seguir" punto 3 |

### Forma propuesta de lo que falta

```jsonc
// GET /me
{
  "familiar": { "id": 1, "nombre": "Ana Gómez", "email": "ana@mail.com" },
  "hogares": [{
    "id": 1, "nombre": "Casa de Rosa", "rol": "responsable_principal",
    "residente": { "id": 1, "nombre": "Rosa Méndez", "telefono": "+54911..." }
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

- Implementar `http.ts` para los endpoints que falten a medida que el backend los sume (hoy
  tiran `ApiError(501)` con un mensaje claro).
- Conectar el `TokenProvider` al ID token de Firebase (ver `features/auth/README.md`).
