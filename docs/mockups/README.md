# Mockups de la app (para el informe)

Mismo estilo que los mockups del informe (`Lares_Mobile.html`, Figuras 3.1 y 3.2), con las
pantallas que se sumaron a la app y todas en modo oscuro.

| Lámina | Pantallas | Imagen lista |
|---|---|---|
| `flujo3_vinculacion.html` | 06 Crear cuenta · 07 Vinculá tu kit · 08 Escanear el QR | `png/flujo3_vinculacion.png` |
| `flujo4_configuracion.html` | 09 Código a mano · 10 Residente · 11 Ubicación de la cámara · 12 Perfil | `png/flujo4_configuracion.png` |
| `oscuro1_principales.html` | 01 a 05 en modo oscuro | `png/oscuro1_principales.png` |
| `oscuro2_vinculacion.html` | 06 a 08 en modo oscuro | `png/oscuro2_vinculacion.png` |
| `oscuro3_configuracion.html` | 09 a 12 en modo oscuro | `png/oscuro3_configuracion.png` |

Los PNG están a doble resolución (aptos para imprimir). Las copias con el nombre final para el
informe (`Mockup_Mobile_Flujo3.png`...) están en [`../informe/imagenes/`](../informe/imagenes/):
si se regeneran, volver a copiarlas ahí.

## Cómo está armado

- `lares-mockup.css`: los estilos de `Lares_Mobile.html` pasados a variables, más el modo
  oscuro (clase `.dark`) con los mismos colores que la app (`src/theme/paletas.ts`).
- `pantallas.js`: cada pantalla escrita **una sola vez**. Las 01 a 05 son las del informe; las
  06 a 12 usan los textos reales de la app. Cada lámina llama a
  `dibujarLamina(['06', '07'], { oscuro: true })`.

Para cambiar una pantalla se edita `pantallas.js` y cambia en todas las láminas (clara y
oscura) a la vez.

## Regenerar los PNG

Abrir la lámina en el navegador para verla. Para exportar con la misma calidad, con Edge sin
ventana (PowerShell, una por lámina; el ancho es `cantidad de pantallas × 510 + 70`):

```powershell
& "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" --headless=new --hide-scrollbars `
  --force-device-scale-factor=2 --virtual-time-budget=6000 --window-size=1600,1180 `
  --screenshot="png\flujo3_vinculacion.png" "file:///D:/PFI_Ellero_Ferrario_Frontend/docs/mockups/flujo3_vinculacion.html"
```

Hace falta internet la primera vez (la tipografía Figtree viene de Google Fonts).

## Diferencias con los mockups originales

- **01 Login (versión oscura):** suma "¿Te llegó un kit Lares? Creá tu cuenta", como la app.
- **04 Reportes:** se mantiene "Rutina de sueño alterada" del mockup original, aunque la app no
  la muestra todavía (ver bitácora del README raíz).
