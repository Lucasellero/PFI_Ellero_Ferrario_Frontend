import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Line, Polyline, Rect } from 'react-native-svg';

import type { SerieRutina } from '@/api/types';
import { duracion, horaDesdeMinutos } from '@/features/eventos/formato';
import { spacing, useEstilos, useTema, type Tema } from '@/theme';

const ALTO = 150;
const MARGEN = { arriba: 12, abajo: 22, izquierda: 42, derecha: 12 };
const MESES_CORTOS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

function etiquetaDia(fechaIso: string): string {
  const d = new Date(`${fechaIso}T00:00:00`);
  return `${d.getDate()} ${MESES_CORTOS[d.getMonth()]}`;
}

/** Mismo criterio de texto que el resto de la app: "hora" en HH:mm, "minutos" como duración. */
function etiquetaValor(valor: number, unidad: SerieRutina['unidad']): string {
  return unidad === 'hora' ? horaDesdeMinutos(valor) : duracion(valor * 60);
}

/**
 * Gráfico de línea del indicador día por día (eje X = fecha, eje Y = valor), con una franja para
 * "lo habitual" (entre `limite_inferior` y `limite_superior`, o hasta `limite_superior` si no hay
 * piso — ver `sedentarismo` en `cloud/app/rutina.py`) y los puntos en rojo cuando ese día se
 * marcó como desvío. Días `sin_dato` quedan como un corte en la línea, no se inventa un valor.
 */
export function GraficoIndicador({ serie, titulo }: { serie: SerieRutina; titulo: string }) {
  const { colors, typography } = useTema();
  const styles = useEstilos(crearEstilos);
  const [ancho, setAncho] = useState(0);

  const conDato = serie.puntos.filter((p) => p.valor != null) as { fecha: string; valor: number; estado: string }[];
  if (conDato.length < 2 || !ancho) {
    return (
      <View style={styles.contenedor} onLayout={(e) => setAncho(e.nativeEvent.layout.width)}>
        <Text style={typography.cuerpoFuerte}>{titulo}</Text>
        {ancho > 0 && (
          <Text style={[typography.secundario, styles.sinDatos]}>Todavía no hay suficientes días con datos.</Text>
        )}
      </View>
    );
  }

  const anchoUtil = ancho - MARGEN.izquierda - MARGEN.derecha;
  const altoUtil = ALTO - MARGEN.arriba - MARGEN.abajo;

  const valores = serie.puntos.map((p) => p.valor).filter((v): v is number => v != null);
  const candidatosMin = [...valores, serie.limite_inferior, serie.habitual].filter((v): v is number => v != null);
  const candidatosMax = [...valores, serie.limite_superior, serie.habitual].filter((v): v is number => v != null);
  const pisoDatos = Math.min(...candidatosMin);
  const techoDatos = Math.max(...candidatosMax);
  const colchon = Math.max((techoDatos - pisoDatos) * 0.15, 1);
  const minY = pisoDatos - colchon;
  const maxY = techoDatos + colchon;

  const n = serie.puntos.length;
  const x = (i: number) => MARGEN.izquierda + (n === 1 ? 0 : (i / (n - 1)) * anchoUtil);
  const y = (v: number) => MARGEN.arriba + altoUtil - ((v - minY) / (maxY - minY)) * altoUtil;

  // Franja de "lo habitual": entre límite inferior y superior, o desde el piso del gráfico hasta
  // el superior cuando no hay piso (sedentarismo: el desvío ahí es solo por exceso).
  const bandaTop = serie.limite_superior != null ? y(serie.limite_superior) : null;
  const bandaBottom = serie.limite_inferior != null ? y(serie.limite_inferior) : altoUtil + MARGEN.arriba;

  // Puntos consecutivos con dato forman un tramo de línea propio — un `sin_dato` en el medio
  // corta la línea en vez de interpolar sobre un día sin información real.
  const tramos: { fecha: string; valor: number; estado: string }[][] = [];
  let actual: typeof tramos[number] = [];
  serie.puntos.forEach((p) => {
    if (p.valor == null) {
      if (actual.length) tramos.push(actual);
      actual = [];
    } else {
      actual.push({ fecha: p.fecha, valor: p.valor, estado: p.estado });
    }
  });
  if (actual.length) tramos.push(actual);

  const colorPunto = (estado: string) => (estado === 'desvio' ? colors.moderada : colors.rutina);
  const primero = serie.puntos[0].fecha;
  const medio = serie.puntos[Math.floor(n / 2)].fecha;
  const ultimo = serie.puntos[n - 1].fecha;

  return (
    <View style={styles.contenedor} onLayout={(e) => setAncho(e.nativeEvent.layout.width)}>
      <View style={styles.encabezado}>
        <Text style={typography.cuerpoFuerte}>{titulo}</Text>
        <View style={styles.leyenda}>
          <View style={[styles.punto, { backgroundColor: colors.rutina }]} />
          <Text style={typography.pequeno}>Normal</Text>
          <View style={[styles.punto, { backgroundColor: colors.moderada }]} />
          <Text style={typography.pequeno}>Desvío</Text>
        </View>
      </View>

      <Svg width={ancho} height={ALTO}>
        {bandaTop != null && (
          <Rect
            x={MARGEN.izquierda}
            y={bandaTop}
            width={anchoUtil}
            height={Math.max(bandaBottom - bandaTop, 0)}
            fill={colors.rutinaSuave}
          />
        )}
        {serie.habitual != null && (
          <Line
            x1={MARGEN.izquierda}
            x2={ancho - MARGEN.derecha}
            y1={y(serie.habitual)}
            y2={y(serie.habitual)}
            stroke={colors.rutina}
            strokeWidth={1.5}
            strokeDasharray="4,3"
          />
        )}

        {tramos.map((tramo, idx) => (
          <Polyline
            key={idx}
            points={tramo.map((p) => `${x(serie.puntos.findIndex((q) => q.fecha === p.fecha))},${y(p.valor)}`).join(' ')}
            fill="none"
            stroke={colors.textoSecundario}
            strokeWidth={2}
          />
        ))}
        {serie.puntos.map((p, i) =>
          p.valor == null ? null : (
            <Circle key={p.fecha} cx={x(i)} cy={y(p.valor)} r={4} fill={colorPunto(p.estado)} />
          ),
        )}

        <Line
          x1={MARGEN.izquierda} x2={MARGEN.izquierda}
          y1={MARGEN.arriba} y2={ALTO - MARGEN.abajo}
          stroke={colors.borde} strokeWidth={1}
        />
        <Line
          x1={MARGEN.izquierda} x2={ancho - MARGEN.derecha}
          y1={ALTO - MARGEN.abajo} y2={ALTO - MARGEN.abajo}
          stroke={colors.borde} strokeWidth={1}
        />
      </Svg>

      <View style={styles.ejeX}>
        <Text style={typography.pequeno}>{etiquetaDia(primero)}</Text>
        {n > 2 && <Text style={typography.pequeno}>{etiquetaDia(medio)}</Text>}
        <Text style={typography.pequeno}>{etiquetaDia(ultimo)}</Text>
      </View>

      {serie.habitual != null && (
        <Text style={[typography.pequeno, styles.habitualTexto]}>
          Habitual: {etiquetaValor(serie.habitual, serie.unidad)}
          {serie.limite_superior != null &&
            ` · límite ${serie.limite_inferior != null ? `${etiquetaValor(serie.limite_inferior, serie.unidad)}–` : 'hasta '}${etiquetaValor(serie.limite_superior, serie.unidad)}`}
        </Text>
      )}
    </View>
  );
}

const crearEstilos = ({ colors }: Tema) =>
  StyleSheet.create({
    contenedor: {
      gap: spacing.sm,
    },
    sinDatos: {
      paddingVertical: spacing.lg,
    },
    encabezado: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    leyenda: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
    },
    punto: {
      width: 8,
      height: 8,
      borderRadius: 4,
      marginLeft: spacing.sm,
    },
    ejeX: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingLeft: MARGEN.izquierda,
      paddingRight: MARGEN.derecha,
    },
    habitualTexto: {
      color: colors.textoSecundario,
    },
  });
