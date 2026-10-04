@AGENTS.md

# Instrucciones del proyecto (Lares — app móvil del PFI)

- **Antes de trabajar:** leer `README.md` (estado, estructura, bitácora) y el README de la
  carpeta que se va a tocar.
- **Metodología de documentación (obligatoria):**
  - Cambio en un módulo → actualizar el README de ese módulo en el mismo cambio.
  - Al terminar una tarea → agregar una entrada a la "Bitácora" del `README.md` raíz (fecha
    absoluta, qué se hizo, decisiones y por qué, pendientes) y actualizar "Estado actual" y
    "Próximos pasos".
  - Algo que la app necesita y el backend no tiene → marcarlo `PENDIENTE BACKEND` en el código y
    sumarlo a la tabla de `src/api/README.md`.
- **Idioma:** código, comentarios y docs en español; los campos que vienen del backend se dejan
  como están (`event_type`, `occurred_at`...).
- **Contexto del backend:** el repo `PFI_Ellero_Ferrario_Backend` (API en `cloud/`). Los tipos de
  `src/api/types.ts` calcan `cloud/app/schemas.py`; la forma de `metadata` sale de `vision/`,
  `runner/camera_worker.py` y `cloud/app/baseline_runner.py`. No inventar campos: verificar ahí.
- **Antes de dar algo por terminado:** `npm run typecheck` y `npm run lint` sin errores.
