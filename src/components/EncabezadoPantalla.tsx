import Feather from '@expo/vector-icons/Feather';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { spacing, useEstilos, useTema, type Tema } from '@/theme';

interface Props {
  /** Línea chica gris de arriba ("Jueves 13 de agosto", "Rosa Méndez"). */
  sobretitulo: string;
  titulo: string;
  /** Nombre del residente: su inicial va en el círculo de la derecha. */
  residente?: string;
  /** Icono tocable a la derecha (ej. cerrar sesión en Perfil), en vez del avatar. */
  accion?: {
    icono: keyof typeof Feather.glyphMap;
    onPress: () => void;
    accessibilityLabel: string;
  };
}

/** Encabezado común a las pestañas: sobretítulo + título + avatar del residente o un ícono de acción. */
export function EncabezadoPantalla({ sobretitulo, titulo, residente, accion }: Props) {
  const { colors } = useTema();
  const styles = useEstilos(crearEstilos);
  return (
    <View style={styles.fila}>
      <View style={styles.textos}>
        <Text style={styles.sobretitulo}>{sobretitulo}</Text>
        <Text style={styles.titulo}>{titulo}</Text>
      </View>
      {residente && (
        <View style={styles.avatar} accessibilityLabel={`Residente: ${residente}`}>
          <Text style={styles.inicial}>{residente.charAt(0).toUpperCase()}</Text>
        </View>
      )}
      {accion && (
        <Pressable
          onPress={accion.onPress}
          accessibilityRole="button"
          accessibilityLabel={accion.accessibilityLabel}
          style={styles.accion}
          hitSlop={8}
        >
          <Feather name={accion.icono} size={22} color={colors.textoSecundario} />
        </Pressable>
      )}
    </View>
  );
}

const crearEstilos = ({ colors, typography }: Tema) =>
  StyleSheet.create({
    fila: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.md,
    },
    textos: {
      flex: 1,
      gap: 2,
    },
    sobretitulo: {
      ...typography.secundario,
      fontSize: 15,
    },
    titulo: typography.titulo,
    avatar: {
      width: 46,
      height: 46,
      borderRadius: 23,
      backgroundColor: colors.primarioSuave,
      alignItems: 'center',
      justifyContent: 'center',
    },
    inicial: {
      fontSize: 17,
      fontWeight: '700',
      color: colors.acento,
    },
    accion: {
      padding: spacing.sm,
    },
  });
