# `features/eventos/` — Lógica común de eventos

Todo lo que transforma un `Evento` crudo del backend en lo que ve el familiar. Lo usan
Notificaciones y Reportes; **no armar textos ni colores de eventos en las pantallas**.

| Archivo | Qué hace |
|---|---|
| `severidad.ts` | Evento → `urgente` / `moderada` / `rutina`, y si `requiereAtencion` (fijado arriba hasta ser atendido). |
| `presentacion.ts` | Evento → título, descripción e ícono en español. `esVisibleEnFeed` filtra los eventos que no tienen sentido mostrar. |
| `formato.ts` | Fechas y duraciones en español ("Jueves 13 de agosto", "2 h 40 min", "hace 8 minutos"). |
| `EventoCard.tsx` | Tarjeta del mockup: borde de color, ícono, hora + residente, título, descripción, punto de no atendida. |
| `DetalleAlertaSheet.tsx` | Detalle de un evento (mockup 03): hoja inferior con datos, "Llamar a…" y "Marcar como resuelta". Lo abren Notificaciones y Reportes; decisiones de diseño en `features/notificaciones/README.md`. |

## Accesibilidad

Todo lo que la tarjeta comunica con color también se dice en palabras para VoiceOver (iOS) y
TalkBack (Android). La etiqueta accesible de `EventoCard` es *severidad · estado · título ·
descripción · cuándo*, por ejemplo: "Alerta urgente. Sin atender. Posible caída detectada.
Baño. 10:42". Los nombres de severidad salen de `ETIQUETA_SEVERIDAD` (`severidad.ts`), los
mismos que muestra la etiqueta del detalle.

## Regla de severidad (semáforo del informe)

| Evento del backend | Severidad | Ejemplo de texto |
|---|---|---|
| `fall` (confirmada) | 🔴 urgente | Posible caída detectada |
| `fall` con `confirmed: false` (evidencia parcial) | 🟡 moderada | Posible caída sin confirmar |
| `immobility` con `severity: "alta"` (inmóvil en el piso, RF4) | 🔴 urgente | Sin movimiento en el piso |
| `immobility` con `severity: "baja"` (sedentarismo, RF3) | 🟡 moderada | Inactividad prolongada |
| `routine_deviation` (RF7) | 🟡 moderada | Horario fuera de lo habitual / Cambio en la rutina / Tendencia de varias semanas |
| `activity` (RF2) | 🟢 rutina | Comió, bebió o tomó la medicación |

Notas:
- Colores: `coloresSeveridad` devuelve `fuerte` (color oficial de la paleta, para el borde de la
  tarjeta y el punto), `suave` (fondo del ícono) y `texto` (ícono y texto, un tono más oscuro
  para que se lea). Detalle en `src/theme/README.md`.
- El backend también calcula `es_alerta` (`cloud/app/alertas.py`); la app no lo usa para el
  color porque una caída sin confirmar tiene `es_alerta: false` pero igual merece aparecer
  fijada en amarillo.
- Los desvíos de rutina se traducen según `metadata.detector` (`timing`, `clase`, `tendencia`,
  `multivariado`) y `metadata.clase` (`cam_cocina`, `cam_comida`...), que son los que emite
  `cloud/app/baseline_runner.py`.

## Qué se oculta del feed

- **Heartbeats de actividad** (`activity` con `ongoing: true`): el runner los emite cada ~60 s
  mientras la actividad sigue, para que la línea base reconstruya duraciones. Para el familiar
  serían ruido.
- **`Background`**: no hay persona en cuadro.

## Criterios de redacción

- Lenguaje simple, sin jerga ni números técnicos en la tarjeta (RNF8). La confianza del modelo
  solo aparece en el detalle.
- **Neutro en género**: la app no sabe el género del residente ("3 h sin movimiento", no
  "sentada").
- Formateo de fechas a mano (no `Intl`) porque el soporte de locales en Hermes varía por
  plataforma.
