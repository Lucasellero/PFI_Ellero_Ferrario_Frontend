import Feather from '@expo/vector-icons/Feather';
import { StyleSheet, Text, View } from 'react-native';

import { haceCuanto, hora } from '@/features/eventos/formato';
import { radius, spacing, useEstilos, useTema, type Tema } from '@/theme';

interface Props {
  pendientes: number;
  residente: string;
  /** Momento del último evento recibido de cualquier tipo (prueba de que el sistema sigue vivo). */
  ultimaSenal: Date | null;
}

/**
 * Tarjeta superior del home: roja si hay alertas pendientes (mockup 02), verde "Todo en orden"
 * si no (mockup 05). Siempre muestra la última señal, para que "sin alertas" no se confunda con
 * "el sistema dejó de funcionar".
 */
export function EstadoDelDia({ pendientes, residente, ultimaSenal }: Props) {
  const { colors } = useTema();
  const styles = useEstilos(crearEstilos);
  const hayAlertas = pendientes > 0;
  const senal = ultimaSenal
    ? hayAlertas
      ? `última señal ${hora(ultimaSenal)}`
      : `última señal ${haceCuanto(ultimaSenal)}`
    : 'sin señales todavía';

  return (
    <View
      style={[styles.card, hayAlertas ? styles.cardAlerta : styles.cardOk]}
      accessibilityRole="summary">
      <View style={[styles.circulo, { backgroundColor: hayAlertas ? colors.urgente : colors.rutina }]}>
        <Feather name={hayAlertas ? 'alert-triangle' : 'check'} size={28} color={colors.primarioTexto} />
      </View>
      <View style={styles.textos}>
        <Text style={styles.titulo}>
          {hayAlertas
            ? `${pendientes} ${pendientes === 1 ? 'alerta requiere' : 'alertas requieren'} tu atención`
            : 'Todo en orden hoy'}
        </Text>
        <Text style={styles.subtitulo}>
          {residente} · {senal}
        </Text>
      </View>
    </View>
  );
}

const crearEstilos = ({ colors }: Tema) => StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    padding: spacing.xl,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  cardAlerta: {
    backgroundColor: colors.urgenteSuave,
    borderColor: colors.urgenteBorde,
  },
  cardOk: {
    backgroundColor: colors.rutinaSuave,
    borderColor: colors.rutinaBorde,
  },
  circulo: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textos: {
    flex: 1,
    gap: 4,
  },
  titulo: {
    fontSize: 21,
    fontWeight: '800',
    color: colors.texto,
  },
  subtitulo: {
    fontSize: 15,
    color: colors.textoSecundario,
  },
});
