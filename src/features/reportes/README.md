# `features/reportes/` — Reportes de rutina

Pestaña Reportes. Cubre **RF9** (reportes periódicos del estado y la rutina) apoyado en **RF6**
(línea base), y **RF13** parcial (eventos del período). Mockup **04 · Reportes**.

| Archivo | Qué es |
|---|---|
| `ReportesScreen.tsx` | Chips Hoy / Semana / Mes, tarjeta "Rutina de…" con indicadores, y eventos del período. |

## Cómo funciona

- **Rutina del período**: indicadores tipo "Despertar · Hoy 7:35 · habitual 7:00–7:45", con ✓
  verde si está dentro de lo habitual o ⚠ amarillo si se aparta. Vienen de
  `api.obtenerResumenRutina(hogarId, periodo)`. Lo "habitual" es la línea base **de ese
  residente** (no un umbral genérico), como pide el informe.
- **Eventos del período**: alertas y desvíos (no actividades de rutina) desde el inicio del
  período, con la misma `EventoCard` del home. Si no hay, una tarjeta verde "Sin alertas ni
  desvíos en el período". Tocar una tarjeta abre el mismo detalle que en Notificaciones
  (`features/eventos/DetalleAlertaSheet.tsx`), desde donde también se puede marcar como resuelta.
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
- Los eventos del período siguen saliendo de la misma lista que el home (últimos 200) — el
  backend ya tiene filtros `tipo`/`desde`/`hasta` (RF13) pero esta pantalla todavía no los manda.

## Pendiente

- Mandar `desde`/`hasta` del período elegido al pedir eventos (RF13) en vez de filtrar los
  últimos 200 del lado del cliente.
- Probar el resumen de rutina con datos de cámara reales (no calibrado todavía, ver disclaimer
  en `cloud/app/rutina.py`) y desde la app en un celular.
