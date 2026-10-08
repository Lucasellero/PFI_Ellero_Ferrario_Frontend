# `features/reportes/` — Reportes de rutina

Pestaña Reportes. Cubre **RF9** (reportes periódicos del estado y la rutina) apoyado en **RF6**
(línea base), y **RF13** (eventos del período, filtrados por fecha del lado del backend).
Mockup **04 · Reportes**.

| Archivo | Qué es |
|---|---|
| `ReportesScreen.tsx` | Chips Hoy / Semana / Mes, tarjeta "Rutina de…" con indicadores, selector de indicador + gráfico de evolución, filtro por tipo y eventos del período. |
| `GraficoIndicador.tsx` | Gráfico de línea (día por día) de un indicador, con `react-native-svg` — ver "Gráfico de evolución" abajo. |

## Cómo funciona

- **Rutina del período**: indicadores tipo "Sedentarismo · 0 min por día · habitual 0 min por
  día", con ✓ verde si está dentro de lo habitual o ⚠ amarillo si se aparta. Vienen de
  `api.obtenerResumenRutina(hogarId, periodo)`. Lo "habitual" es la línea base **de ese
  residente** (no un umbral genérico), como pide el informe. Hoy son **4 indicadores** (ver
  "Estado" abajo), ya no solo 2.
- **Gráfico de evolución (2026-10-08)**: debajo de la tarjeta de indicadores, un chip por cada
  indicador que el resumen trajo (mismo componente `Chip` que Período/Tipo) para elegir cuál
  graficar — solo uno a la vez, no los 4 apilados. El gráfico (`GraficoIndicador`) pide
  `api.obtenerSerieRutina(hogarId, clave, periodo)`: un punto por día, línea punteada de "lo
  habitual" y una franja para el rango normal; puntos rojos marcan los días que el backend
  clasificó como desvío. Solo se muestra en Semana/Mes — un solo día no alcanza para graficar una
  línea. Primer diseño probado (pestañas superpuestas tipo separador de cuaderno) no se veía bien
  en un celular real (texto cortado, hueco raro con la tarjeta) — se simplificó a chips comunes,
  más robusto.
- **Eventos del período**: alertas y desvíos (no actividades de rutina) desde el inicio del
  período, con la misma `EventoCard` del home. Pedidos aparte con `api.listarEventos(hogarId,
  { desde, limit: 500, tipo })` (RF13) — no son los mismos "últimos 200" que usa el home para la
  lista general, así que un hogar con mucha actividad no pierde eventos viejos del mes. Chips
  Todos/Caídas/Inmovilidad/Rutina (2026-10-08) filtran por tipo, con scroll horizontal (igual que
  los chips del selector de indicador, para que no se corten en pantallas angostas). Si no hay
  resultados, una tarjeta verde "Sin alertas ni desvíos en el período". Tocar una tarjeta abre el
  mismo detalle que en Notificaciones (`features/eventos/DetalleAlertaSheet.tsx`, que sí usa la
  lista general del home para calcular la "última actividad normal"), desde donde también se
  puede marcar como resuelta.
- **Hogar recién vinculado**: si la línea base todavía no tiene datos (`indicadores: []`), en
  vez de la tarjeta vacía se explica que "Lares está aprendiendo la rutina" de los primeros días.

## Estado

- **Backend real conectado y probado en celular (2026-10-07/08):** `GET /hogares/{id}/rutina` y
  `GET /hogares/{id}/rutina/serie` existen (`cloud/app/rutina.py`) y devuelven **4 indicadores**
  — `comida` (horario de la primera comida/toma del día), `sedentarismo` (minutos/día sentado),
  `cocina` (minutos/día cocinando, desvío = menos de lo habitual) y `movilidad` (minutos/día
  moviéndose, ídem) — contra el historial real de `Evento` del propio residente (mediana + MAD,
  sin leer `LineaBaseComportamiento`, que sigue sin escribirse). **`"despertar"` se sacó**: no hay
  clase de cámara que detecte despertarse (sin sensor de cama), así que mostrarlo habría sido un
  dato inventado. Probado de punta a punta desde un celular real contra el backend desplegado en
  AWS (`cloud/README.md` → "Prueba end-to-end en celular real").
- **RF13 conectado (2026-10-07, `tipo` sumado 2026-10-08):** los eventos del período se piden con
  `desde`/`tipo` al backend (`api.listarEventos(hogarId, { desde, limit: 500, tipo })`), no
  filtrados de los últimos 200 de la lista general del home.

## Pendiente

- `hasta` del contrato RF13 todavía no lo usa ninguna pantalla — sin un selector de rango de
  fechas custom en la UI no hay mucho caso de uso real para esto todavía.
- Calibrar el resumen/serie de rutina con datos de cámara reales (hoy sigue probado solo con
  sintético/CASAS, ver disclaimer en `cloud/app/rutina.py`).
- Indicador de `cocina`/`movilidad` con texto "0 min" si los eventos de prueba no tienen
  heartbeats (duración reconstruida por gaps entre eventos, ver `baseline/src/camera_events.py`)
  — no es un bug, es una característica de cómo se generan eventos sintéticos de prueba.
