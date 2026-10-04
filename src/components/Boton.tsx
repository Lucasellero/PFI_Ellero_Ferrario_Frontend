import { ActivityIndicator, Pressable, StyleSheet, Text, type ViewStyle } from 'react-native';

import { radius, spacing, useEstilos, type Tema } from '@/theme';

type Variante = 'primario' | 'peligro' | 'secundario';

interface Props {
  label: string;
  onPress: () => void;
  variante?: Variante;
  cargando?: boolean;
  deshabilitado?: boolean;
  style?: ViewStyle;
}

/**
 * Botón de la app. `peligro` = acción primaria ante una alerta ("Llamar a Rosa", rojo sólido);
 * `secundario` = acción de menor jerarquía, solo con borde ("Marcar como resuelta").
 */
export function Boton({ label, onPress, variante = 'primario', cargando, deshabilitado, style }: Props) {
  const styles = useEstilos(crearEstilos);
  const inactivo = deshabilitado || cargando;
  const v = styles[variante];
  return (
    <Pressable
      onPress={onPress}
      disabled={inactivo}
      accessibilityRole="button"
      accessibilityState={{ disabled: inactivo, busy: cargando }}
      style={({ pressed }) => [
        styles.base,
        v.contenedor,
        (pressed || inactivo) && styles.atenuado,
        style,
      ]}>
      {cargando ? (
        <ActivityIndicator color={v.texto.color} />
      ) : (
        <Text style={[styles.texto, v.texto]}>{label}</Text>
      )}
    </Pressable>
  );
}

const crearEstilos = ({ colors }: Tema) => ({
  primario: StyleSheet.create({
    contenedor: { backgroundColor: colors.primario },
    texto: { color: colors.primarioTexto },
  }),
  peligro: StyleSheet.create({
    contenedor: { backgroundColor: colors.urgente },
    texto: { color: colors.primarioTexto },
  }),
  secundario: StyleSheet.create({
    contenedor: { backgroundColor: colors.superficie, borderWidth: 1, borderColor: colors.borde },
    texto: { color: colors.texto },
  }),
  ...StyleSheet.create({
    base: {
      minHeight: 54,
      paddingHorizontal: spacing.lg,
      borderRadius: radius.md,
      alignItems: 'center',
      justifyContent: 'center',
    },
    atenuado: {
      opacity: 0.7,
    },
    texto: {
      fontSize: 16,
      fontWeight: '700',
      textAlign: 'center',
    },
  }),
});
