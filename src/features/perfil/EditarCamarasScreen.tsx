import Feather from '@expo/vector-icons/Feather';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { api } from '@/api/client';
import type { Camara } from '@/api/types';
import { BarraSuperior } from '@/components/BarraSuperior';
import { Boton } from '@/components/Boton';
import { CampoTexto } from '@/components/CampoTexto';
import { Chip } from '@/components/Chip';
import { useHogar } from '@/features/hogar/HogarProvider';
import { validarUbicaciones } from '@/lib/validaciones';
import { radius, spacing, useEstilos, useTema, type Tema } from '@/theme';

const SUGERENCIAS = ['Living', 'Cocina', 'Dormitorio', 'Pasillo', 'Puerta del baño', 'Entrada'];

/**
 * Editar la ubicación de las cámaras desde Perfil (RF10, después de la configuración inicial —
 * `UbicacionCamarasScreen` es la del paso 3 de la vinculación; mismo endpoint `PATCH
 * /hogares/{id}/camaras/{camara_id}`, misma validación (`validarUbicaciones`)). Solo
 * `responsable_principal`.
 */
export function EditarCamarasScreen() {
  const { hogar } = useHogar();
  const { colors, typography } = useTema();
  const styles = useEstilos(crearEstilos);

  const hogarId = hogar?.id;
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

  if (!hogar) return null;

  const actual = carga?.hogarId === hogarId ? carga : undefined;
  const camaras = actual?.camaras?.filter((c) => c.activa) ?? [];
  const validaciones = validarUbicaciones(Object.fromEntries(camaras.map((c) => [c.id, ubicaciones[c.id] ?? ''])));
  const errorDe = (id: number) => {
    const v = validaciones[id];
    return tocados[id] && v && !v.ok ? v.error : null;
  };

  async function onGuardar() {
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
            return api.actualizarCamara(hogarId!, c.id, { ubicacion: v.ok ? v.valor : '' });
          }),
      );
      router.back();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No pudimos guardar. Probá de nuevo.');
      setGuardando(false);
    }
  }

  return (
    <SafeAreaView style={styles.pantalla}>
      <KeyboardAvoidingView style={styles.pantalla} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.contenido} keyboardShouldPersistTaps="handled">
          <BarraSuperior />

          <Text style={typography.titulo} accessibilityRole="header">
            {camaras.length === 1 ? 'Ubicación de la cámara' : 'Ubicación de las cámaras'}
          </Text>

          {!actual && <ActivityIndicator color={colors.acento} />}
          {actual?.error && <Text style={styles.error}>{actual.error}</Text>}

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

          {actual?.camaras && camaras.length === 0 && (
            <View style={styles.consejo}>
              <Feather name="info" size={16} color={colors.acento} />
              <Text style={[typography.pequeno, styles.flex]}>No hay cámaras activas en este hogar.</Text>
            </View>
          )}

          {error && (
            <Text style={styles.error} accessibilityLiveRegion="assertive">
              {error}
            </Text>
          )}
          <Boton label="Guardar" onPress={onGuardar} cargando={guardando} deshabilitado={!actual?.camaras} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const crearEstilos = ({ colors }: Tema) =>
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
