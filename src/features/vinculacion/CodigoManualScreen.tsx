import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BarraSuperior } from '@/components/BarraSuperior';
import { Boton } from '@/components/Boton';
import { CampoTexto } from '@/components/CampoTexto';
import { spacing, useEstilos, useTema, type Tema } from '@/theme';

import { formatearCodigo, LARGO_CODIGO, normalizarCodigo, validarCodigoKit } from './codigoKit';
import { TOTAL_PASOS, useVinculacion } from './VinculacionProvider';

/**
 * Paso 1 · Código a mano, para cuando la cámara no lee el QR o no se dio el permiso. El código
 * se formatea mientras se escribe ("7K3P-9QXM") y acepta minúsculas, espacios y O/I/L
 * confundidas con 0/1 (ver `codigoKit.ts`).
 */
export function CodigoManualScreen() {
  const { vincular } = useVinculacion();
  const { typography } = useTema();
  const styles = useEstilos(crearEstilos);
  const [codigo, setCodigo] = useState('');
  const [tocado, setTocado] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validacion = validarCodigoKit(codigo);
  // Mientras escribe no se marca como error que "faltan caracteres"; sí al salir o al enviar.
  const completo = normalizarCodigo(codigo).length >= LARGO_CODIGO;
  const errorCampo = (tocado || completo) && !validacion.ok ? validacion.error : null;

  async function onVincular() {
    setTocado(true);
    setError(null);
    if (!validacion.ok) return;
    setCargando(true);
    const mensaje = await vincular(validacion.valor.codigo);
    if (mensaje) {
      setError(mensaje);
      setCargando(false);
    }
  }

  return (
    <SafeAreaView style={styles.pantalla}>
      <KeyboardAvoidingView style={styles.pantalla} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.contenido} keyboardShouldPersistTaps="handled">
          <BarraSuperior paso={{ actual: 1, total: TOTAL_PASOS }} />

          <View style={styles.encabezado}>
            <Text style={typography.titulo} accessibilityRole="header">
              Código del kit
            </Text>
            <Text style={styles.subtitulo}>
              Está impreso debajo del QR, en la etiqueta de la controladora. Son 8 letras y números.
            </Text>
          </View>

          <CampoTexto
            label="Código de vinculación"
            icono="key"
            value={formatearCodigo(codigo)}
            onChangeText={(t) => setCodigo(normalizarCodigo(t).slice(0, LARGO_CODIGO))}
            onBlur={() => setTocado(true)}
            error={errorCampo}
            placeholder="7K3P-9QXM"
            autoCapitalize="characters"
            maxLength={LARGO_CODIGO + 1}
            style={styles.codigo}
            returnKeyType="go"
            onSubmitEditing={onVincular}
          />

          {error && (
            <Text style={styles.error} accessibilityLiveRegion="assertive">
              {error}
            </Text>
          )}
          <Boton label="Vincular kit" onPress={onVincular} cargando={cargando} />
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
    codigo: {
      fontSize: 22,
      fontWeight: '700',
      letterSpacing: 3,
    },
    error: {
      color: colors.urgenteTexto,
      fontSize: 14,
    },
  });
