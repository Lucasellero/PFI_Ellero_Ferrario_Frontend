import Feather from '@expo/vector-icons/Feather';
import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { api } from '@/api/client';
import type { Camara } from '@/api/types';
import { BarraSuperior } from '@/components/BarraSuperior';
import { Boton } from '@/components/Boton';
import { CampoTexto } from '@/components/CampoTexto';
import { Chip } from '@/components/Chip';
import { useCuenta } from '@/features/cuenta/CuentaProvider';
import { validarUbicaciones } from '@/lib/validaciones';
import { radius, spacing, useEstilos, useTema, type Tema } from '@/theme';

import { TOTAL_PASOS, useVinculacion } from './VinculacionProvider';

const SUGERENCIAS = ['Living', 'Cocina', 'Dormitorio', 'Pasillo', 'Puerta del baño', 'Entrada'];

/**
 * Paso 3 · Cámaras: dónde está cada una (RF10 desde la app; el informe, Sección 3.8, prevé que
 * la ubicación se asigne desde la aplicación móvil). "Terminar" guarda las ubicaciones y el
 * residente del paso 2; con eso la cuenta queda "lista" y el layout raíz muestra las pestañas.
 */
export function UbicacionCamarasScreen() {
  const { hogarPendiente, recargarPerfil } = useCuenta();
  const { borradorResidente } = useVinculacion();
  const { colors, typography } = useTema();
  const styles = useEstilos(crearEstilos);

  const hogarId = hogarPendiente?.id;
  const [carga, setCarga] = useState<{ hogarId: number; camaras?: Camara[]; error?: string }>();
  const [ubicaciones, setUbicaciones] = useState<Record<number, string>>({});
  const [tocados, setTocados] = useState<Record<number, boolean>>({});
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (hogarId == null) return;
    let vigente = true;
    api
      .listarCamaras(hogarId)
      .then((camaras) => {
        if (!vigente) return;
        setCarga({ hogarId, camaras });
        setUbicaciones(Object.fromEntries(camaras.map((c) => [c.id, c.ubicacion ?? ''])));
      })
      .catch((e: Error) => vigente && setCarga({ hogarId, error: e.message }));
    return () => {
      vigente = false;
    };
  }, [hogarId]);

  // Se llegó acá sin pasar por el paso 2 (ej. la app se recargó): volver a cargar el residente.
  if (!borradorResidente) return <Redirect href="/vinculacion/residente" />;

  const actual = carga?.hogarId === hogarId ? carga : undefined;
  // El plan del kit manda: se configuran como máximo las cámaras que se compraron. El backend no
  // debería devolver más, pero si la controladora registrara una de más, acá no aparece.
  const plan = hogarPendiente?.kit?.cantidad_camaras ?? null;
  const activas = actual?.camaras?.filter((c) => c.activa) ?? [];
  const camaras = plan == null ? activas : activas.slice(0, plan);
  const validaciones = validarUbicaciones(Object.fromEntries(camaras.map((c) => [c.id, ubicaciones[c.id] ?? ''])));
  const errorDe = (id: number) => {
    const v = validaciones[id];
    return tocados[id] && v && !v.ok ? v.error : null;
  };

  async function onTerminar() {
    if (hogarId == null || !borradorResidente) return;
    setTocados(Object.fromEntries(camaras.map((c) => [c.id, true])));
    setError(null);
    if (Object.values(validaciones).some((v) => !v.ok)) return;
    setGuardando(true);
    try {
      await Promise.all(
        camaras
          .filter((c) => {
            const v = validaciones[c.id];
            return v.ok && v.valor !== c.ubicacion;
          })
          .map((c) => {
            const v = validaciones[c.id];
            return api.actualizarCamara(hogarId, c.id, { ubicacion: v.ok ? v.valor : '' });
          }),
      );
      // El residente va último: con él la configuración queda completa (ver VinculacionProvider).
      await api.guardarResidente(hogarId, borradorResidente);
      await recargarPerfil();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No pudimos guardar. Probá de nuevo.');
      setGuardando(false);
    }
  }

  return (
    <SafeAreaView style={styles.pantalla}>
      <KeyboardAvoidingView style={styles.pantalla} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.contenido} keyboardShouldPersistTaps="handled">
          <BarraSuperior paso={{ actual: 3, total: TOTAL_PASOS }} />

          <View style={styles.encabezado}>
            <Text style={typography.titulo} accessibilityRole="header">
              {plan === 1 ? '¿Dónde está tu cámara?' : '¿Dónde está cada cámara?'}
            </Text>
            <Text style={styles.subtitulo}>
              Así las alertas te dicen dónde pasó algo: &quot;Posible caída · Living&quot;.
            </Text>
          </View>

          {plan != null && (
            <View style={styles.plan}>
              <Feather name="video" size={16} color={colors.acento} />
              <Text style={[typography.cuerpoFuerte, styles.flex]}>
                Tu kit incluye {plan} {plan === 1 ? 'cámara' : 'cámaras'}
              </Text>
            </View>
          )}

          {!actual && <ActivityIndicator color={colors.acento} />}
          {actual?.error && <Text style={styles.error}>{actual.error}</Text>}
          {actual?.camaras && camaras.length === 0 && (
            <Text style={typography.secundario}>
              Todavía no hay cámaras conectadas a la controladora. Podés seguir y ubicarlas después.
            </Text>
          )}

          {camaras.map((c, i) => (
            <View key={c.id} style={styles.camara}>
              <CampoTexto
                label={camaras.length === 1 ? 'Tu cámara' : `Cámara ${i + 1} de ${camaras.length}`}
                icono="video"
                value={ubicaciones[c.id] ?? ''}
                onChangeText={(t) => setUbicaciones((u) => ({ ...u, [c.id]: t }))}
                onBlur={() => setTocados((t) => ({ ...t, [c.id]: true }))}
                error={errorDe(c.id)}
                placeholder="Ej. Living"
                autoCapitalize="sentences"
                maxLength={40}
              />
              <View style={styles.sugerencias}>
                {SUGERENCIAS.map((s) => (
                  <Chip
                    key={s}
                    label={s}
                    activo={(ubicaciones[c.id] ?? '').trim().toLowerCase() === s.toLowerCase()}
                    onPress={() => {
                      setUbicaciones((u) => ({ ...u, [c.id]: s }));
                      setTocados((t) => ({ ...t, [c.id]: true }));
                    }}
                  />
                ))}
              </View>
            </View>
          ))}

          <View style={styles.consejo}>
            <Feather name="info" size={16} color={colors.acento} />
            <Text style={[typography.pequeno, styles.flex]}>
              ¿Una cámara cerca del baño? Apuntala a la puerta, no al interior: si tarda mucho en salir,
              Lares te avisa igual. El video nunca sale de la controladora.
            </Text>
          </View>

          {error && (
            <Text style={styles.error} accessibilityLiveRegion="assertive">
              {error}
            </Text>
          )}
          <Boton label="Terminar" onPress={onTerminar} cargando={guardando} deshabilitado={!actual?.camaras} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const crearEstilos = ({ colors, typography }: Tema) =>
  StyleSheet.create({
    pantalla: {
      flex: 1,
      backgroundColor: colors.fondo,
    },
    contenido: {
      flexGrow: 1,
      paddingHorizontal: spacing.xxl,
      paddingBottom: spacing.xxl,
      paddingTop: spacing.sm,
      gap: spacing.xl,
    },
    encabezado: {
      gap: spacing.sm,
    },
    subtitulo: {
      ...typography.secundario,
      fontSize: 15,
      lineHeight: 21,
    },
    plan: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.lg,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.borde,
      backgroundColor: colors.superficie,
    },
    camara: {
      gap: spacing.md,
    },
    sugerencias: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
    },
    consejo: {
      flexDirection: 'row',
      gap: spacing.sm,
      padding: spacing.lg,
      backgroundColor: colors.primarioSuave,
      borderRadius: radius.md,
    },
    flex: {
      flex: 1,
    },
    error: {
      color: colors.urgenteTexto,
      fontSize: 14,
    },
  });
