# `theme/` — Tokens visuales

Colores, espaciados, radios y tipografía de Lares. La **paleta** sale de la sección
**"Branding"** del informe (cap. 3, `paleta.png`); las medidas y la composición, de los mockups
(`Imagenes/Mockup_Mobile_Flujo1.png` y `Flujo2.png`).

**Regla:** ninguna pantalla define colores sueltos (`'#D96863'`); siempre `colors.urgente` del
tema activo (`useTema()`). Así
el semáforo significa lo mismo en toda la app, que es una decisión de diseño explícita del
informe (cap. 3, "Mockups" y "Branding").

## Paleta (modo claro, la oficial del informe)

El informe separa dos grupos que **no se mezclan**: los colores de marca nunca indican
severidad, y los del semáforo se usan solo para el estado de los eventos.

| Grupo | Token | Hex | Uso |
|---|---|---|---|
| Marca | `colors.primario` | `#1F5D4B` | "Verde principal": botón principal, chip activo, pestaña activa, nombre en el Login |
| Marca | `colors.secundario` | `#AFC9BC` | "Verde secundario" (también está en el logo) |
| Marca | `colors.primarioSuave` | `#E3ECE7` | Verde secundario aclarado: avatar, fondos suaves de marca |
| Marca | `colors.fondo` | `#F8F7F2` | "Fondo": crema de todas las pantallas y del splash |
| Marca | `colors.neutro` | `#D8D4C8` | "Neutro" cálido |
| Semáforo | `colors.urgente` | `#D96863` | "Alta": caídas, inmovilidad en el piso |
| Semáforo | `colors.moderada` | `#E4C26B` | "Media": sedentarismo, desvíos de rutina, caída sin confirmar |
| Semáforo | `colors.rutina` | `#6DA88A` | "Baja": actividades normales, "Todo en orden hoy" |

Cada color del semáforo tiene además:
- **`XSuave`**: fondo del cuadrado del ícono, de etiquetas y de la tarjeta de estado.
- **`XTexto`**: el mismo tono, más oscuro, para **íconos y texto** encima de `XSuave` o del
  fondo. Los tres colores oficiales son pasteles (sobre todo el amarillo) y no alcanzan contraste
  como texto; los mockups también usan un tono más oscuro en los íconos.

Regla práctica: borde de la tarjeta, punto de no leído, chip y botón "Llamar" → color oficial;
ícono o texto → `XTexto`. `coloresSeveridad` (`features/eventos/severidad.ts`) ya devuelve los
tres (`fuerte`, `suave`, `texto`).

El verde de marca y el de "baja" son de la misma familia; el informe los distingue por tono (el
de marca es mucho más oscuro) y por contexto (el de "baja" solo aparece en eventos normales).

## Modo claro y oscuro

| Archivo | Qué es |
|---|---|
| `paletas.ts` | `paletaClara` y `paletaOscura` (mismas claves), `spacing`, `radius`, `crearTipografia`. |
| `TemaProvider.tsx` | Tema activo + preferencia del usuario (Sistema / Claro / Oscuro, se elige en Perfil y se guarda en AsyncStorage). |

Cómo se usa en una pantalla:

```tsx
const crearEstilos = ({ colors, typography }: Tema) => StyleSheet.create({ ... }); // a nivel de módulo
const styles = useEstilos(crearEstilos);   // estilos del tema activo
const { colors } = useTema();              // para colores sueltos (íconos, tints)
```

Criterios de la paleta oscura (no es invertir la clara):
- **Fondo verde casi negro** (`#111815`), no negro puro, para que siga siendo "Lares" (como la
  variante del logo sobre verde oscuro del informe).
- **Verde de marca en dos roles:** `primario` es el relleno (botón, chip activo) y `acento` el
  verde como texto o ícono (pestaña activa, links, "LARES"). En claro son el mismo color; en
  oscuro el texto necesita un verde más claro para leerse.
- **Semáforo:** los colores oficiales se mantienen iguales (sobre fondo oscuro se leen bien); se
  oscurecen los `XSuave` y se aclaran los `XTexto`.
- **El logo va siempre sobre crema** (`fondoLogo`): la persona verde oscura del símbolo no se ve
  sobre fondo oscuro. Lo mismo el splash oscuro (`splash-icon-dark.png`).

## Decisiones
- **Fuente del sistema.** El informe pide una sans geométrica y redondeada, sin nombrar una
  fuente; la del sistema (San Francisco / Roboto) cumple con la lectura. Cargar una propia
  (p. ej. Poppins con `expo-font`) obligaría a definir `fontFamily` por peso en todos los
  estilos. Queda como mejora opcional.
