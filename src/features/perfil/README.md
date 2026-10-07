# `features/perfil/` — Perfil

Pestaña Perfil. **No tiene mockup en el informe**; sigue el mismo lenguaje visual que el resto.

| Archivo | Qué es |
|---|---|
| `PerfilScreen.tsx` | Nombre y correo del familiar, hogar, residente, teléfono (formateado, ej. "+54 9 11 2345-6789"), kit vinculado (número de serie), rol, apariencia (Sistema / Claro / Oscuro), aviso de privacidad y "Cerrar sesión". Para `responsable_principal`: enlaces a editar residente y cámaras. Para cualquiera: enlace a Familiares. En modo mock muestra "Modo demo · datos de prueba". |
| `EditarResidenteScreen.tsx` | Editar nombre/teléfono del residente después de la configuración inicial (`PUT /hogares/{id}/residente`, el mismo endpoint que usa `features/vinculacion/DatosResidenteScreen.tsx` — pantalla separada porque acá no hay "paso siguiente": se guarda y se vuelve). Solo `responsable_principal`. |
| `EditarCamarasScreen.tsx` | Editar la ubicación de las cámaras (RF10) después de la configuración inicial (`PATCH /hogares/{id}/camaras/{camara_id}`, misma validación que `features/vinculacion/UbicacionCamarasScreen.tsx` — `validarUbicaciones` en `src/lib/validaciones.ts`). Solo `responsable_principal`. |
| `FamiliaresScreen.tsx` | Gestión de familiares (RF12): listar, invitar por email, cambiar rol y desvincular. Cualquier familiar ve la lista; solo `responsable_principal` invita/cambia roles/desvincula a otros. Uno mismo siempre se puede desvincular ("Salir del hogar"). |

Rutas (fuera de las pestañas, ver `src/app/`): `/editar-residente`, `/editar-camaras`,
`/familiares` — archivos finos que solo re-exportan la pantalla, como el resto de `src/app/`.

## Decisiones (2026-10-07)

- **Invitar es "a quien ya tiene cuenta".** Igual que decidió el backend
  (`cloud/README.md` → "Cómo seguir" punto 4): sin invitación pendiente por mail. Si el email no
  tiene cuenta en la app, el error (404) se muestra con `Alert.alert` tal cual lo manda el
  backend. **Para quien invitan:** si recién se registra y lo invitan después, no se entera solo
  — ver "¿Ya te invitó un familiar? Actualizar" en `features/vinculacion/README.md` (mismo día,
  bug encontrado probando en un celular real).
- **"Salir del hogar" en vez de pedir confirmación aparte por pantalla.** Se usa `Alert.alert`
  (nativo), igual que "marcar como resuelta" en `DetalleAlertaSheet` — no hay un componente de
  diálogo propio en la app todavía.
- **Si uno se desvincula de su único hogar**, se llama `recargarPerfil()` (no `cerrarSesion()`):
  `CuentaProvider` recalcula la etapa con el perfil actualizado y el layout raíz pasa solo a la
  vinculación — no hace falta navegar a mano ni cerrar la sesión.
- **Cambiar de rol es un toggle**, no un selector: con solo dos roles posibles
  (`responsable_principal`/`familiar`), tocar el chip del rol actual alterna al otro.

## Pendiente

- **Preferencias de notificación** (cuando existan las push).
- **Selector de hogar** si un familiar accede a más de uno (ver `features/hogar/README.md`).
- Probar las pantallas nuevas desde la app en un celular (verificado con `expo export` que
  compilan y las rutas registran bien; no probado interactuando con ellas).
