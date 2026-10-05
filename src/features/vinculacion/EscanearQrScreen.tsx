import Feather from '@expo/vector-icons/Feather';
import { CameraView, useCameraPermissions, type BarcodeScanningResult } from 'expo-camera';
import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BarraSuperior } from '@/components/BarraSuperior';
import { Boton } from '@/components/Boton';
import { radius, spacing, useEstilos, useTema, type Tema } from '@/theme';

import { formatearCodigo, leerQrKit } from './codigoKit';
import { TOTAL_PASOS, useVinculacion } from './VinculacionProvider';

type Estado = { tipo: 'escaneando' } | { tipo: 'vinculando'; codigo: string } | { tipo: 'error'; mensaje: string };

/** Paso 1 · Escanear el QR de la etiqueta de la controladora (expo-camera). */
export function EscanearQrScreen() {
  const [permiso, pedirPermiso] = useCameraPermissions();
  const { vincular } = useVinculacion();
  const { colors, typography } = useTema();
  const styles = useEstilos(crearEstilos);
  const [estado, setEstado] = useState<Estado>({ tipo: 'escaneando' });

  async function onEscaneado({ data }: BarcodeScanningResult) {
    // Mientras no esté "escaneando" el callback se desactiva (ver `onBarcodeScanned` abajo),
    // así el mismo QR no dispara dos vinculaciones.
    const lectura = leerQrKit(data);
    if (!lectura.ok) {
      setEstado({ tipo: 'error', mensaje: lectura.error });
      return;
    }
    setEstado({ tipo: 'vinculando', codigo: lectura.valor.codigo });
    const error = await vincular(lectura.valor.codigo);
    if (error) setEstado({ tipo: 'error', mensaje: error });
  }

  const irACodigo = () => router.replace('/vinculacion/codigo');

  // ── Permiso de cámara ──────────────────────────────────────────────────────
  if (!permiso) {
    return (
      <View style={[styles.pantalla, styles.centro]}>
        <ActivityIndicator color={colors.acento} />
      </View>
    );
  }
  if (!permiso.granted) {
    return (
      <SafeAreaView style={styles.pantalla}>
        <View style={styles.contenidoPermiso}>
          <BarraSuperior paso={{ actual: 1, total: TOTAL_PASOS }} />
          <View style={styles.permiso}>
            <Feather name="camera" size={40} color={colors.acento} />
            <Text style={[typography.subtitulo, styles.centrado]}>Necesitamos la cámara</Text>
            <Text style={[typography.secundario, styles.centrado]}>
              Solo para leer el código QR del kit. No se guarda ni se envía ninguna imagen.
            </Text>
            {permiso.canAskAgain ? (
              <Boton label="Permitir la cámara" onPress={pedirPermiso} style={styles.botonAncho} />
            ) : (
              <Boton label="Abrir Ajustes" onPress={() => Linking.openSettings()} style={styles.botonAncho} />
            )}
            <Pressable onPress={irACodigo} accessibilityRole="button" style={styles.link}>
              <Text style={styles.linkTexto}>Prefiero ingresar el código a mano</Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // ── Cámara ─────────────────────────────────────────────────────────────────
  return (
    <View style={styles.camaraFondo}>
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        onBarcodeScanned={estado.tipo === 'escaneando' ? onEscaneado : undefined}
      />
      <SafeAreaView style={styles.capa} edges={['top', 'bottom']}>
        <View style={styles.barra}>
          <BarraSuperior paso={{ actual: 1, total: TOTAL_PASOS }} />
        </View>

        <View style={styles.centro}>
          <View style={styles.marco} accessibilityLabel="Encuadrá el código QR dentro del recuadro" />
          <Text style={styles.indicacion}>Encuadrá el QR de la etiqueta de la controladora</Text>
        </View>

        <View style={styles.panel}>
          {estado.tipo === 'escaneando' && (
            <Pressable onPress={irACodigo} accessibilityRole="button" style={styles.link}>
              <Text style={styles.linkTexto}>Ingresar el código a mano</Text>
            </Pressable>
          )}
          {estado.tipo === 'vinculando' && (
            <View style={styles.fila} accessibilityLiveRegion="polite">
              <ActivityIndicator color={colors.acento} />
              <Text style={typography.cuerpoFuerte}>Vinculando el kit {formatearCodigo(estado.codigo)}…</Text>
            </View>
          )}
          {estado.tipo === 'error' && (
            <View style={styles.error} accessibilityLiveRegion="assertive">
              <View style={styles.fila}>
                <Feather name="alert-circle" size={18} color={colors.urgenteTexto} />
                <Text style={[typography.cuerpo, styles.flex]}>{estado.mensaje}</Text>
              </View>
              <Boton label="Escanear de nuevo" onPress={() => setEstado({ tipo: 'escaneando' })} />
              <Pressable onPress={irACodigo} accessibilityRole="button" style={styles.link}>
                <Text style={styles.linkTexto}>Ingresar el código a mano</Text>
              </Pressable>
            </View>
          )}
        </View>
      </SafeAreaView>
    </View>
  );
}

const crearEstilos = ({ colors }: Tema) =>
  StyleSheet.create({
    pantalla: {
      flex: 1,
      backgroundColor: colors.fondo,
    },
    contenidoPermiso: {
      flex: 1,
      paddingHorizontal: spacing.xxl,
      paddingTop: spacing.sm,
    },
    permiso: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.md,
    },
    centrado: {
      textAlign: 'center',
    },
    botonAncho: {
      alignSelf: 'stretch',
      marginTop: spacing.md,
    },
    camaraFondo: {
      flex: 1,
      backgroundColor: colors.fondoCamara,
    },
    capa: {
      flex: 1,
      justifyContent: 'space-between',
    },
    barra: {
      marginHorizontal: spacing.lg,
      paddingHorizontal: spacing.md,
      borderRadius: radius.md,
      backgroundColor: colors.superficie,
    },
    centro: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.lg,
    },
    marco: {
      width: 240,
      height: 240,
      borderRadius: radius.lg,
      borderWidth: 3,
      borderColor: colors.sobreCamara,
    },
    indicacion: {
      color: colors.sobreCamara,
      fontSize: 15,
      fontWeight: '600',
      textAlign: 'center',
      paddingHorizontal: spacing.xxl,
      textShadowColor: 'rgba(0, 0, 0, 0.6)',
      textShadowRadius: 4,
    },
    panel: {
      margin: spacing.lg,
      padding: spacing.lg,
      borderRadius: radius.lg,
      backgroundColor: colors.superficie,
      gap: spacing.sm,
    },
    fila: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
    },
    flex: {
      flex: 1,
    },
    error: {
      gap: spacing.md,
    },
    link: {
      alignSelf: 'center',
      padding: spacing.sm,
    },
    linkTexto: {
      color: colors.acento,
      fontSize: 15,
      fontWeight: '600',
    },
  });
