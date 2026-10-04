import Feather from '@expo/vector-icons/Feather';
import { useEffect, useState } from 'react';
import { Alert, Animated, Linking, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { Evento, HogarResumen } from '@/api/types';
import { Boton } from '@/components/Boton';
import { cuandoConDia, duracion, haceCuanto, hora, primerNombre } from '@/features/eventos/formato';
import { presentar } from '@/features/eventos/presentacion';
import { coloresSeveridad, requiereAtencion, severidadDe, type Severidad } from '@/features/eventos/severidad';
import { radius, spacing, useEstilos, useTema, type Tema } from '@/theme';

interface Props {
  evento: Evento | null;
  /** Todos los eventos del hogar — para calcular la "última actividad normal". */
  eventos: Evento[];
  hogar: HogarResumen;
  onCerrar: () => void;
  onResolver: (evento: Evento) => Promise<void>;
}

const ETIQUETA: Record<Severidad, string> = {
  urgente: 'Alerta urgente',
  moderada: 'Alerta moderada',
  rutina: 'Rutina',
};

/**
 * Mockup 03 · Detalle de alerta: hoja inferior que oscurece pero no reemplaza el feed.
 * Jerarquía de botones deliberada: "Llamar" primario rojo, "Marcar como resuelta" secundario.
 */
export function DetalleAlertaSheet({ evento, eventos, hogar, onCerrar, onResolver }: Props) {
  const insets = useSafeAreaInsets();
  const { colors, typography } = useTema();
  const styles = useEstilos(crearEstilos);
  const [desplazamiento] = useState(() => new Animated.Value(400));
  const [resolviendo, setResolviendo] = useState(false);
  const visible = evento != null;

  useEffect(() => {
    if (visible) {
      desplazamiento.setValue(400);
      Animated.spring(desplazamiento, { toValue: 0, useNativeDriver: true, bounciness: 0 }).start();
    }
  }, [visible, desplazamiento]);

  if (!evento) return null;

  const severidad = severidadDe(evento);
  const { suave, texto } = coloresSeveridad(severidad, colors);
  const { titulo } = presentar(evento);
  const residente = hogar.residente;
  const nombre = primerNombre(residente.nombre);
  const fecha = new Date(evento.occurred_at);
  const filas = filasDeDetalle(evento, eventos);

  async function onResolverPress() {
    setResolviendo(true);
    try {
      await onResolver(evento!);
      onCerrar();
    } catch {
      Alert.alert('No se pudo marcar como resuelta', 'Probá de nuevo en un momento.');
    } finally {
      setResolviendo(false);
    }
  }

  function onLlamar() {
    if (residente.telefono) Linking.openURL(`tel:${residente.telefono}`);
  }

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onCerrar} statusBarTranslucent>
      <Pressable style={styles.fondo} onPress={onCerrar} accessibilityLabel="Cerrar detalle" />
      <Animated.View
        style={[
          styles.hoja,
          { paddingBottom: insets.bottom + spacing.lg, transform: [{ translateY: desplazamiento }] },
        ]}>
        <View style={styles.agarre} />

        <View style={[styles.etiqueta, { backgroundColor: suave }]}>
          <Feather name="alert-triangle" size={14} color={texto} />
          <Text style={[styles.etiquetaTexto, { color: texto }]}>{ETIQUETA[severidad]}</Text>
        </View>

        <Text style={typography.titulo}>{titulo}</Text>
        <Text style={typography.secundario}>
          {[cuandoConDia(fecha), evento.ubicacion, residente.nombre]
            .filter(Boolean)
            .join(' · ')}
        </Text>

        <View style={styles.privacidad}>
          <Feather name="shield" size={14} color={colors.textoSecundario} />
          <Text style={styles.privacidadTexto}>
            El video se procesa en tu hogar · nunca se envía a la nube
          </Text>
        </View>

        <View>
          {filas.map(([k, v]) => (
            <View key={k} style={styles.fila}>
              <Text style={typography.cuerpo}>{k}</Text>
              <Text style={typography.cuerpoFuerte}>{v}</Text>
            </View>
          ))}
        </View>

        {severidad !== 'rutina' && (
          <View style={styles.botones}>
            {residente.telefono && (
              <Boton label={`Llamar a ${nombre}`} variante="peligro" onPress={onLlamar} style={styles.boton} />
            )}
            {requiereAtencion(evento) && (
              <Boton
                label="Marcar como resuelta"
                variante="secundario"
                onPress={onResolverPress}
                cargando={resolviendo}
                style={styles.boton}
              />
            )}
          </View>
        )}
      </Animated.View>
    </Modal>
  );
}

/** Filas "clave · valor" del detalle, según lo que traiga la metadata del evento. */
function filasDeDetalle(evento: Evento, eventos: Evento[]): [string, string][] {
  const m = evento.metadata;
  const filas: [string, string][] = [];
  const fecha = new Date(evento.occurred_at);

  const confianza = m.fall_temporal_score ?? (evento.event_type === 'activity' ? m.confidence : undefined);
  if (typeof confianza === 'number') filas.push(['Confianza del modelo', `${Math.round(confianza * 100)} %`]);

  if (evento.event_type === 'immobility' && typeof m.duration_s === 'number') {
    filas.push(['Tiempo sin movimiento', duracion(m.duration_s)]);
  }
  if (evento.event_type !== 'activity') filas.push(['Detectado', haceCuanto(fecha)]);

  const ultimaActividad = eventos.find(
    (e) =>
      e.event_type === 'activity' &&
      e.metadata.activity_label !== 'Background' &&
      new Date(e.occurred_at) < fecha,
  );
  if (ultimaActividad && evento.event_type !== 'activity') {
    const lugar = ultimaActividad.ubicacion ? ` · ${ultimaActividad.ubicacion.toLowerCase()}` : '';
    filas.push(['Última actividad normal', `${hora(new Date(ultimaActividad.occurred_at))}${lugar}`]);
  }
  return filas;
}

const crearEstilos = ({ colors, typography }: Tema) => StyleSheet.create({
  fondo: {
    ...StyleSheet.absoluteFill,
    backgroundColor: colors.overlay,
  },
  hoja: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.superficie,
    borderTopLeftRadius: radius.lg + 8,
    borderTopRightRadius: radius.lg + 8,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    gap: spacing.md,
  },
  agarre: {
    alignSelf: 'center',
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.borde,
    marginBottom: spacing.sm,
  },
  etiqueta: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.sm,
  },
  etiquetaTexto: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  privacidad: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  privacidadTexto: {
    ...typography.pequeno,
    flex: 1,
  },
  fila: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borde,
  },
  botones: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  boton: {
    flex: 1,
  },
});
