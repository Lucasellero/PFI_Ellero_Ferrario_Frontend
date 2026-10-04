import Feather from '@expo/vector-icons/Feather';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { Evento } from '@/api/types';
import { radius, spacing, useEstilos, useTema, type Tema } from '@/theme';

import { cuandoCorto } from './formato';
import { presentar } from './presentacion';
import { coloresSeveridad, ETIQUETA_SEVERIDAD, requiereAtencion, severidadDe } from './severidad';

interface Props {
  evento: Evento;
  /** Primer nombre del residente, para la etiqueta gris ("Rosa"). */
  residente: string;
  onPress?: (evento: Evento) => void;
}

/**
 * Tarjeta de evento del mockup: borde de color a la izquierda, ícono, hora + residente,
 * título, descripción y punto de "no atendida". Mismo componente en Notificaciones y Reportes
 * para que el lenguaje visual sea uno solo.
 */
export function EventoCard({ evento, residente, onPress }: Props) {
  const { colors } = useTema();
  const styles = useEstilos(crearEstilos);
  const severidad = severidadDe(evento);
  const { fuerte, suave, texto } = coloresSeveridad(severidad, colors);
  const { titulo, descripcion, icono } = presentar(evento);
  const pendiente = requiereAtencion(evento);
  const atenuada = severidad === 'rutina' || evento.resuelta;
  const cuando = cuandoCorto(new Date(evento.occurred_at));

  // Lo que la tarjeta dice con color (severidad, punto de pendiente) también tiene que llegar
  // en palabras al lector de pantalla (VoiceOver / TalkBack).
  const estado = pendiente ? 'Sin atender' : evento.resuelta && severidad !== 'rutina' ? 'Atendida' : '';
  const etiquetaAccesible = [ETIQUETA_SEVERIDAD[severidad], estado, titulo, descripcion, cuando]
    .filter(Boolean)
    .join('. ');

  return (
    <Pressable
      onPress={onPress ? () => onPress(evento) : undefined}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={etiquetaAccesible}
      accessibilityHint={onPress ? 'Abre el detalle del evento' : undefined}
      style={({ pressed }) => [
        styles.card,
        { borderLeftColor: fuerte },
        atenuada && styles.atenuada,
        pressed && styles.presionada,
      ]}>
      <View style={[styles.icono, { backgroundColor: suave }]}>
        <Feather name={icono} size={20} color={texto} />
      </View>

      <View style={styles.cuerpo}>
        <View style={styles.meta}>
          <Text style={styles.hora}>{cuando}</Text>
          <Text style={styles.residente}>{residente}</Text>
          {evento.resuelta && severidad !== 'rutina' && <Text style={styles.resuelta}>Atendida</Text>}
        </View>
        <Text style={styles.titulo}>{titulo}</Text>
        {!!descripcion && <Text style={styles.descripcion}>{descripcion}</Text>}
      </View>

      {pendiente && <View style={[styles.punto, { backgroundColor: fuerte }]} />}
    </Pressable>
  );
}

const crearEstilos = ({ colors, typography }: Tema) => StyleSheet.create({
  card: {
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.lg,
    backgroundColor: colors.superficie,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borde,
    borderLeftWidth: 4,
  },
  atenuada: {
    backgroundColor: colors.superficieAtenuada,
  },
  presionada: {
    opacity: 0.7,
  },
  icono: {
    width: 40,
    height: 40,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cuerpo: {
    flex: 1,
    gap: 2,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  hora: {
    ...typography.pequeno,
  },
  residente: {
    ...typography.pequeno,
    color: colors.texto,
    backgroundColor: colors.fondo,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
    overflow: 'hidden',
  },
  resuelta: {
    ...typography.pequeno,
    color: colors.rutinaTexto,
  },
  titulo: {
    ...typography.cuerpoFuerte,
  },
  descripcion: {
    ...typography.secundario,
  },
  punto: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 4,
  },
});
