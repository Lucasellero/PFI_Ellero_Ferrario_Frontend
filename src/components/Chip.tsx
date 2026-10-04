import { Pressable, StyleSheet, Text, View } from 'react-native';

import { radius, spacing, useEstilos, type Tema } from '@/theme';

interface Props {
  label: string;
  activo: boolean;
  onPress: () => void;
  /** Punto de color a la izquierda (ej. rojo para "Urgentes"). */
  colorPunto?: string;
}

/** Chip de filtro del mockup ("Todas", "Urgentes", "Semana"...). */
export function Chip({ label, activo, onPress, colorPunto }: Props) {
  const styles = useEstilos(crearEstilos);
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: activo }}
      style={[styles.chip, activo && styles.activo]}>
      {colorPunto && !activo && <View style={[styles.punto, { backgroundColor: colorPunto }]} />}
      <Text style={[styles.label, activo && styles.labelActivo]}>{label}</Text>
    </Pressable>
  );
}

const crearEstilos = ({ colors }: Tema) =>
  StyleSheet.create({
    chip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      paddingHorizontal: spacing.lg,
      paddingVertical: 10,
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: colors.borde,
      backgroundColor: colors.superficie,
    },
    activo: {
      backgroundColor: colors.primario,
      borderColor: colors.primario,
    },
    punto: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    label: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.texto,
    },
    labelActivo: {
      color: colors.primarioTexto,
    },
  });
