# `features/perfil/` — Perfil

Pestaña Perfil. **No tiene mockup en el informe**; sigue el mismo lenguaje visual que el resto.

| Archivo | Qué es |
|---|---|
| `PerfilScreen.tsx` | Nombre y correo del familiar, hogar, residente, teléfono (formateado, ej. "+54 9 11 2345-6789"), kit vinculado (número de serie), rol, apariencia (Sistema / Claro / Oscuro), aviso de privacidad y "Cerrar sesión". En modo mock muestra "Modo demo · datos de prueba". |

## Pendiente

- **Editar el residente y la ubicación de las cámaras** después de la configuración inicial
  (hoy solo se cargan en la vinculación; los endpoints son los mismos, ver
  `docs/vinculacion-kit.md`).
- **Gestión de familiares (RF12)**: listar, invitar por email, cambiar rol y desvincular. Depende
  de los endpoints de `cloud/README.md` → "Cómo seguir" punto 4. Solo el `responsable_principal`
  puede administrar.
- **Preferencias de notificación** (cuando existan las push).
- **Selector de hogar** si un familiar accede a más de uno (ver `features/hogar/README.md`).
