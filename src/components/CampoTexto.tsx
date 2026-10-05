import Feather from '@expo/vector-icons/Feather';
import { forwardRef, type ComponentProps } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import { radius, spacing, useEstilos, useTema, type Tema } from '@/theme';

type Props = ComponentProps<typeof TextInput> & {
  label: string;
  icono?: ComponentProps<typeof Feather>['name'];
  /** Mensaje de error debajo del campo; también pinta el borde. */
  error?: string | null;
  /** Texto de ayuda gris debajo del campo (se oculta si hay error). */
  ayuda?: string;
};

/**
 * Campo de formulario: label + input con ícono + error o ayuda debajo. El error se anuncia a
 * los lectores de pantalla (accessibilityLiveRegion / accessibilityHint).
 */
export const CampoTexto = forwardRef<TextInput, Props>(function CampoTexto(
  { label, icono, error, ayuda, style, ...input },
  ref,
) {
  const { colors } = useTema();
  const styles = useEstilos(crearEstilos);
  return (
    <View style={styles.campo}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.input, !!error && styles.inputError]}>
        {icono && <Feather name={icono} size={18} color={error ? colors.urgenteTexto : colors.textoSecundario} />}
        <TextInput
          ref={ref}
          style={[styles.texto, style]}
          placeholderTextColor={colors.textoTenue}
          autoCapitalize="none"
          autoCorrect={false}
          accessibilityLabel={label}
          accessibilityHint={error ?? ayuda}
          {...input}
        />
      </View>
      {error ? (
        <Text style={styles.error} accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : (
        !!ayuda && <Text style={styles.ayuda}>{ayuda}</Text>
      )}
    </View>
  );
});

const crearEstilos = ({ colors, typography }: Tema) =>
  StyleSheet.create({
    campo: {
      gap: spacing.sm,
    },
    label: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.texto,
    },
    input: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      paddingHorizontal: spacing.lg,
      minHeight: 56,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.borde,
      backgroundColor: colors.superficie,
    },
    inputError: {
      borderColor: colors.urgente,
    },
    texto: {
      flex: 1,
      fontSize: 16,
      color: colors.texto,
      paddingVertical: spacing.md,
    },
    error: {
      fontSize: 13,
      color: colors.urgenteTexto,
    },
    ayuda: {
      ...typography.pequeno,
    },
  });
