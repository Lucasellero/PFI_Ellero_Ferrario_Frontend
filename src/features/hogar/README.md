# `features/hogar/` — Estado compartido del hogar

`HogarProvider` carga una vez el **perfil** del familiar (quién es, a qué hogar accede, quién es
el residente) y los **eventos** de ese hogar, y los comparte con todas las pestañas vía
`useHogar()`.

```ts
const { perfil, hogar, eventos, cargando, refrescando, error, recargar, marcarResuelta } = useHogar();
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

## Pendiente

- Refrescar automáticamente al recibir una push (RF8) y al volver la app a primer plano.
- Paginación / filtros por fecha cuando el backend los soporte (RF13); hoy trae los últimos 200.
