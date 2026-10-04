/**
 * Tokens visuales de Lares. La paleta sale de la sección "Branding" del informe (cap. 3,
 * paleta.png) y el resto de las medidas, de los mockups (Mockup_Mobile_Flujo1/2.png).
 * Hay dos paletas con las MISMAS claves (clara y oscura); las pantallas no eligen colores, piden
 * los del tema activo con `useTema()` / `useEstilos()` (ver TemaProvider.tsx y el README).
 *
 * Regla: ninguna pantalla define colores sueltos — todo sale de acá, para que el código de
 * severidad (rojo/amarillo/verde) signifique siempre lo mismo y no se mezcle con la marca.
 */
import type { TextStyle } from 'react-native';

export const paletaClara = {
  // Base
  fondo: '#F8F7F2', // "Fondo" de la paleta: crema de todas las pantallas
  superficie: '#FFFFFF', // tarjetas, inputs, tab bar
  superficieAtenuada: '#FBFAF7', // tarjetas de rutina o ya atendidas
  borde: '#E7E4DB',
  texto: '#1E2A25',
  textoSecundario: '#6B7770',
  textoTenue: '#9AA39D',

  // Marca (paleta "Colores de marca") — nunca se usan para indicar severidad
  primario: '#1F5D4B', // "Verde principal" como RELLENO: botón principal, chip activo
  primarioTexto: '#FFFFFF', // texto sobre `primario`
  acento: '#1F5D4B', // verde de marca como TEXTO o ÍCONO: pestaña activa, links, "LARES"
  primarioSuave: '#E3ECE7', // verde secundario aclarado: avatar, fondos suaves de marca
  secundario: '#AFC9BC', // "Verde secundario"
  neutro: '#D8D4C8', // "Neutro" cálido
  fondoLogo: '#FFFFFF', // cuadrado detrás del símbolo del logo (Login)

  // Severidad (paleta "Semáforo de alertas", reservada para alertas — ver
  // features/eventos/severidad.ts). `X` = color oficial (bordes, puntos, botones);
  // `XSuave` = fondo de íconos y etiquetas; `XTexto` = el mismo tono ajustado para íconos y
  // texto (los oficiales son pasteles y no se leen como texto); `XBorde` = borde de la tarjeta
  // de estado del día.
  urgente: '#D96863', // "Alta"
  urgenteSuave: '#FBE7E5',
  urgenteTexto: '#B8433E',
  urgenteBorde: '#F3CDCA',
  moderada: '#E4C26B', // "Media"
  moderadaSuave: '#FBF2DA',
  moderadaTexto: '#9A7414',
  rutina: '#6DA88A', // "Baja"
  rutinaSuave: '#E7F1EC',
  rutinaTexto: '#3E7A5D',
  rutinaBorde: '#CBE0D5',

  overlay: 'rgba(20, 28, 24, 0.45)', // fondo detrás del bottom sheet
  sombra: '#000000',
};

export type Colores = { [K in keyof typeof paletaClara]: string };

/**
 * Modo oscuro. No es "invertir" la clara: es la misma marca sobre un fondo verde casi negro
 * (como la variante del logo sobre verde oscuro del informe). Criterios en src/theme/README.md.
 */
export const paletaOscura: Colores = {
  fondo: '#111815',
  superficie: '#1A2420',
  superficieAtenuada: '#161F1B',
  borde: '#2B3833',
  texto: '#E8EEEA',
  textoSecundario: '#A2B0A9',
  textoTenue: '#6F7D76',

  primario: '#2E7A62', // el verde principal un poco más claro: #1F5D4B se pierde sobre el fondo
  primarioTexto: '#FFFFFF',
  acento: '#8CC5AE', // verde secundario reforzado para que se lea como texto
  primarioSuave: '#1F2E28',
  secundario: '#AFC9BC',
  neutro: '#D8D4C8',
  fondoLogo: '#F8F7F2', // el logo se mantiene sobre crema: la persona verde oscura no se ve sobre fondo oscuro

  urgente: '#D96863',
  urgenteSuave: '#3B2321',
  urgenteTexto: '#F2A19C',
  urgenteBorde: '#5A3330',
  moderada: '#E4C26B',
  moderadaSuave: '#3A3120',
  moderadaTexto: '#EDD08A',
  rutina: '#6DA88A',
  rutinaSuave: '#1C3128',
  rutinaTexto: '#93CBB0',
  rutinaBorde: '#2C4A3D',

  overlay: 'rgba(0, 0, 0, 0.6)',
  sombra: '#000000',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
} as const;

export const radius = {
  sm: 8,
  md: 14,
  lg: 20,
  pill: 999,
} as const;

/** Estilos de texto; dependen de la paleta porque llevan color. */
export function crearTipografia(c: Colores) {
  return {
    titulo: { fontSize: 28, fontWeight: '800', color: c.texto },
    subtitulo: { fontSize: 20, fontWeight: '700', color: c.texto },
    cuerpo: { fontSize: 16, color: c.texto },
    cuerpoFuerte: { fontSize: 16, fontWeight: '700', color: c.texto },
    secundario: { fontSize: 14, color: c.textoSecundario },
    pequeno: { fontSize: 13, color: c.textoSecundario },
    seccion: {
      fontSize: 12,
      fontWeight: '700',
      letterSpacing: 1.2,
      textTransform: 'uppercase',
      color: c.textoSecundario,
    },
  } satisfies Record<string, TextStyle>;
}

export type Tipografia = ReturnType<typeof crearTipografia>;
