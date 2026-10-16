# `features/notificaciones/` — Home de la app

Pestaña principal. Cubre **RF8** (ver las alertas; la push en sí está en `features/push/`),
**RF1/RF3/RF4/RF7** (cómo se muestra cada tipo de evento) y **RF13** parcial (historial
reciente). Mockups **02 · Notificaciones**, **03 · Detalle de alerta** y **05 · Día en orden**.

El detalle de alerta (mockup 03) vive en `features/eventos/DetalleAlertaSheet.tsx` porque
también lo abre Reportes; las decisiones de abajo sobre el detalle siguen valiendo.

| Archivo | Qué es |
|---|---|
| `NotificacionesScreen.tsx` | Pantalla: encabezado, estado del día, filtros, secciones del feed. |
| `EstadoDelDia.tsx` | Tarjeta de arriba: roja "N alertas requieren tu atención" o verde "Todo en orden hoy". |

## Cómo se arma el feed

1. **Fijado hasta ser atendido**: urgentes y moderadas sin resolver, de cualquier fecha.
2. Si no hay ninguna → bloque **"Sin alertas por ahora"** (mockup 05), con un corazón en tono
   calmo.
3. **Hoy**: el resto de los eventos de hoy (rutina + alertas ya atendidas).
4. **Días anteriores**: los últimos 15; el historial completo es para Reportes.

Los chips (Todas / Urgentes / Moderadas / Rutina) filtran las tres secciones. Tirar hacia abajo
recarga; además la lista se actualiza sola cada 30 s y al volver a la app (ver
`features/hogar/README.md`).

## Decisiones (de los mockups, cap. 3 del informe)

- **"Sin alertas" nunca es una pantalla vacía**: siempre se ve la **última señal** recibida, para
  que no se confunda con que el sistema dejó de funcionar.
- **"Todo en orden hoy" usa el verde del semáforo** ("baja", `colors.rutina`), no el verde de
  marca, igual que el mockup 05: es un estado de los eventos, no un elemento de marca.
- **Jerarquía de botones del detalle**: "Llamar a [residente]" es primario rojo (lo más
  importante ante una caída); "Marcar como resuelta" secundario. Llamar abre el marcador con
  `tel:` usando el teléfono del residente.
- **Privacidad visible**: el detalle repite "El video se procesa en tu hogar · nunca se envía a
  la nube" justo donde uno esperaría una foto.
- **"Última actividad normal"** del detalle se calcula del lado de la app: es la última
  `activity` anterior a la alerta.

## Pendiente

- Abrir este detalle directamente al tocar una notificación push. Hoy tocarla abre el feed
  (2026-10-15, `features/push/usePush.ts`); para abrir la alerta exacta falta que el backend
  mande `evento_id`/`hogar_id` en la push (PENDIENTE BACKEND, ver `features/push/README.md`).
