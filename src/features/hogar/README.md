# `features/hogar/` — Estado compartido del hogar

`HogarProvider` carga una vez el **perfil** del familiar (quién es, a qué hogar accede, quién es
el residente) y los **eventos** de ese hogar, y los comparte con todas las pestañas vía
`useHogar()`.

```ts
const { perfil, hogar, eventos, cargando, error, recargar, marcarResuelta } = useHogar();
const { refrescando, onRefrescar } = useRecargaManual(); // "tirar para actualizar" de una pantalla
```

## Por qué existe

- Notificaciones, el badge de la pestaña y Reportes usan **la misma lista** de eventos: se pide
  una vez y no se desincronizan (si marcás una alerta como resuelta, el badge baja al instante).
- Se monta en `src/app/(tabs)/_layout.tsx`, o sea **solo con sesión iniciada**: al cerrar sesión
  se descarta y no quedan datos de otra cuenta en memoria.

## Decisiones

- **Un solo hogar activo** (`perfil.hogares[0]`). El modelo del backend permite que un familiar
  esté en varios hogares (N:M), pero no hay caso de uso todavía; cuando lo haya, sumar un
  selector en Perfil y guardar el hogar elegido acá.
- **`marcarResuelta` es optimista:** se marca en pantalla al instante y se revierte si el backend
  falla.
- **Sin librería de datos** (React Query, etc.). Con 3 pantallas y una sola lista alcanza un
  contexto; si aparecen paginación o caché por pantalla, reevaluar.

- **Actualización automática (provisoria hasta las push):** con la app en primer plano pide los
  eventos cada 30 s (`INTERVALO_ACTUALIZACION_MS`) y una vez apenas vuelve a primer plano
  (`AppState`). En segundo plano no consulta. Es silenciosa: sin spinner y, si falla, queda la
  lista anterior. De paso, los "hace 5 min" se recalculan en cada vuelta.
- **Las alertas resueltas no se "desresuelven":** si una consulta salió antes de marcar una
  alerta y vuelve después, `fusionarEventos` conserva el `resuelta: true` local para que la
  alerta no reaparezca fijada unos segundos.
- **El spinner de "tirar para actualizar" es de cada pantalla** (`useRecargaManual`), no del
  contexto. Las pestañas quedan montadas aunque no se vean: con un `refreshing` compartido,
  tirar en Reportes prendía también el spinner de Notificaciones, y en iOS quedaba trabado
  arriba de la pantalla. Además el spinner dura al menos 600 ms, porque si la respuesta llega
  antes de que termine la animación de entrada, iOS también lo puede dejar colgado.

## Pendiente

- Refrescar al recibir una push (RF8); con eso, el intervalo de 30 s puede espaciarse o quitarse.
- Paginación / filtros por fecha cuando el backend los soporte (RF13); hoy trae los últimos 200.
