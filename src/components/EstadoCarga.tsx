import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { spacing, useEstilos, useTema, type Tema } from '@/theme';

import { Boton } from './Boton';

interface Props {
  cargando: boolean;
  error: string | null;
  onReintentar: () => void;
}

/** Pantalla completa de "cargando" o "error + reintentar". No renderiza nada si no aplica. */
export function EstadoCarga({ cargando, error, onReintentar }: Props) {
  const { colors, typography } = useTema();
  const styles = useEstilos(crearEstilos);
  if (cargando) {
    return (
      <View style={styles.centro}>
        <ActivityIndicator size="large" color={colors.acento} />
      </View>
    );
  }
  if (error) {
    return (
      <View style={styles.centro}>
        <Text style={typography.subtitulo}>No pudimos cargar los datos</Text>
        <Text style={[typography.secundario, styles.texto]}>{error}</Text>
        <Boton label="Reintentar" onPress={onReintentar} style={styles.boton} />
      </View>
    );
  }
  return null;
}

const crearEstilos = ({ colors }: Tema) =>
  StyleSheet.create({
    centro: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: spacing.xxl,
      gap: spacing.md,
      backgroundColor: colors.fondo,
    },
    texto: {
      textAlign: 'center',
    },
    boton: {
      alignSelf: 'stretch',
      marginTop: spacing.md,
    },
  });
