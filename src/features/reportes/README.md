# `features/reportes/` — Reportes de rutina

Pestaña Reportes. Cubre **RF9** (reportes periódicos del estado y la rutina) apoyado en **RF6**
(línea base), y **RF13** (eventos del período, filtrados por fecha del lado del backend).
Mockup **04 · Reportes**.

| Archivo | Qué es |
|---|---|
| `ReportesScreen.tsx` | Chips Hoy / Semana / Mes, tarjeta "Rutina de…" con indicadores, y eventos del período. |

## Cómo funciona

- **Rutina del período**: indicadores tipo "Despertar · Hoy 7:35 · habitual 7:00–7:45", con ✓
  verde si está dentro de lo habitual o ⚠ amarillo si se aparta. Vienen de
  `api.obtenerResumenRutina(hogarId, periodo)`. Lo "habitual" es la línea base **de ese
  residente** (no un umbral genérico), como pide el informe.
- **Eventos del período**: alertas y desvíos (no actividades de rutina) desde el inicio del
  período, con la misma `EventoCard` del home. Pedidos aparte con `api.listarEventos(hogarId,
  { desde, limit: 500 })` (RF13) — no son los mismos "últimos 200" que usa el home para la lista
  general, así que un hogar con mucha actividad no pierde eventos viejos del mes. Si no hay, una
  tarjeta verde "Sin alertas ni desvíos en el período". Tocar una tarjeta abre el mismo detalle
  que en Notificaciones (`features/eventos/DetalleAlertaSheet.tsx`, que sí usa la lista general
  del home para calcular la "última actividad normal"), desde donde también se puede marcar
  como resuelta.
- **Hogar recién vinculado**: si la línea base todavía no tiene datos (`indicadores: []`), en
  vez de la tarjeta vacía se explica que "Lares está aprendiendo la rutina" de los primeros días.

## Estado

- **Backend real conectado (2026-10-07):** `GET /hogares/{id}/rutina` existe (`cloud/app/rutina.py`)
  y devuelve solo **dos** indicadores — `comida` (horario de la primera comida/toma del día) y
  `sedentarismo` (minutos/día sentado sin actividad) — contra el historial real de `Evento` del
  propio residente (mediana + MAD, sin leer `LineaBaseComportamiento`, que sigue sin escribirse).
  **`"despertar"` se sacó**, como ya anticipaba el punto de "Pendiente" de abajo: no hay clase de
  cámara que detecte despertarse (sin sensor de cama), así que mostrarlo habría sido un dato
  inventado. Solo probado con un smoke test (eventos sintéticos contra SQLite) — sin probar con
  datos de cámara reales ni desde la app en un celular.
- **RF13 conectado (2026-10-07):** los eventos del período ya se piden con `desde` al backend
  (`api.listarEventos(hogarId, { desde, limit: 500 })`), no filtrados de los últimos 200 de la
  lista general del home.

## Pendiente

- Probar el resumen de rutina con datos de cámara reales (no calibrado todavía, ver disclaimer
  en `cloud/app/rutina.py`) y desde la app en un celular.
- `hasta`/`tipo` del contrato RF13 todavía no los usa ninguna pantalla (solo `desde`); evaluar si
  hace falta un filtro por tipo de evento en la UI.
