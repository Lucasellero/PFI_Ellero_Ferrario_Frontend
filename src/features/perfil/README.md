# `features/perfil/` — Perfil

Pestaña Perfil. **No tiene mockup en el informe**; sigue el mismo lenguaje visual que el resto.

| Archivo | Qué es |
|---|---|
| `PerfilScreen.tsx` | Nombre y correo del familiar, hogar, residente, teléfono, rol, aviso de privacidad y "Cerrar sesión". En modo mock muestra "Modo demo · datos de prueba". |

## Pendiente

- **Gestión de familiares (RF12)**: listar, invitar por email, cambiar rol y desvincular. Depende
  de los endpoints de `cloud/README.md` → "Cómo seguir" punto 4. Solo el `responsable_principal`
  puede administrar.
- **Preferencias de notificación** (cuando existan las push).
- **Selector de hogar** si un familiar accede a más de uno (ver `features/hogar/README.md`).
