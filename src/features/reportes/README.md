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

## Estado

- Los indicadores son **datos de prueba**: el backend todavía no expone la línea base (ver
  `src/api/README.md`, `GET /hogares/{id}/rutina`). Los indicadores del mock (despertar, primera
  comida, sedentarismo) son los de ejemplo del mockup; el informe aclara que se pueden sumar
  otros a medida que la línea base se enriquezca.
- Los eventos salen de la misma lista que el home (últimos 200), así que "Mes" puede quedar
  incompleto en un hogar con mucha actividad hasta que el backend tenga filtros por fecha.

## Pendiente

- Definir con el backend qué indicadores puede calcular hoy `baseline/` con las 5 clases de
  cámara que existen (`cam_cocina`, `cam_comida`, `cam_descanso_sofa`, `cam_ocio_sentado`,
  `cam_moverse`). "Despertar" no tiene todavía una clase de cámara que lo detecte.
- Filtro por tipo de evento (RF13).
