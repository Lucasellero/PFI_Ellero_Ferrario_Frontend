import Feather from '@expo/vector-icons/Feather';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { spacing, useEstilos, useTema, type Tema } from '@/theme';

interface Props {
  /** "Paso 2 de 3" a la derecha (flujos de varios pasos). */
  paso?: { actual: number; total: number };
  /** Si no se pasa, vuelve a la pantalla anterior. */
  onVolver?: () => void;
  /** Texto del botón de la izquierda; por defecto "Volver". */
  textoVolver?: string;
  ocultarVolver?: boolean;
}

/** Barra de arriba de las pantallas fuera de las pestañas (registro, vinculación). */
export function BarraSuperior({ paso, onVolver, textoVolver = 'Volver', ocultarVolver }: Props) {
  const { colors } = useTema();
  const styles = useEstilos(crearEstilos);
  const volver = onVolver ?? (() => router.back());
  return (
    <View style={styles.barra}>
      {ocultarVolver ? (
        <View />
      ) : (
        <Pressable onPress={volver} accessibilityRole="button" style={styles.volver} hitSlop={8}>
          <Feather name="chevron-left" size={22} color={colors.acento} />
          <Text style={styles.volverTexto}>{textoVolver}</Text>
        </Pressable>
      )}
      {paso && (
        <View
          style={styles.paso}
          accessibilityLabel={`Paso ${paso.actual} de ${paso.total}`}
          accessibilityRole="progressbar">
          {Array.from({ length: paso.total }, (_, i) => (
            <View key={i} style={[styles.punto, i < paso.actual && styles.puntoActivo]} />
          ))}
          <Text style={styles.pasoTexto}>
            Paso {paso.actual} de {paso.total}
          </Text>
        </View>
      )}
    </View>
  );
}

const crearEstilos = ({ colors, typography }: Tema) =>
  StyleSheet.create({
    barra: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      minHeight: 44,
    },
    volver: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 2,
      paddingVertical: spacing.sm,
      paddingRight: spacing.sm,
    },
    volverTexto: {
      color: colors.acento,
      fontSize: 16,
      fontWeight: '600',
    },
    paso: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    punto: {
      width: 18,
      height: 4,
      borderRadius: 2,
      backgroundColor: colors.borde,
    },
    puntoActivo: {
      backgroundColor: colors.primario,
    },
    pasoTexto: {
      ...typography.pequeno,
      marginLeft: spacing.xs,
    },
  });
