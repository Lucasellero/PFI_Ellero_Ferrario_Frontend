import Feather from '@expo/vector-icons/Feather';
import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, type TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BarraSuperior } from '@/components/BarraSuperior';
import { Boton } from '@/components/Boton';
import { CampoTexto } from '@/components/CampoTexto';
import { useAuth } from '@/features/auth/AuthProvider';
import { useCuenta } from '@/features/cuenta/CuentaProvider';
import { formatearTelefonoAR, validarNombre, validarTelefonoAR } from '@/lib/validaciones';
import { radius, spacing, useEstilos, useTema, type Tema } from '@/theme';

import { TOTAL_PASOS, useVinculacion } from './VinculacionProvider';

/**
 * Paso 2 · Residente: nombre (obligatorio) y teléfono (opcional, lo usa "Llamar a…" en el
 * detalle de una alerta). Se guarda como borrador; se envía al terminar el paso 3.
 *
 * Sin "Volver": el kit ya quedó vinculado y volver a escanear no tiene sentido. Sí se puede
 * cerrar sesión; al volver a entrar, la configuración se retoma acá.
 */
export function DatosResidenteScreen() {
  const { cerrarSesion } = useAuth();
  const { hogarPendiente } = useCuenta();
  const { borradorResidente, guardarBorradorResidente } = useVinculacion();
  const { colors, typography } = useTema();
  const styles = useEstilos(crearEstilos);
  const refTelefono = useRef<TextInput>(null);

  const [nombre, setNombre] = useState(borradorResidente?.nombre ?? '');
  const [telefono, setTelefono] = useState(borradorResidente?.telefono ? formatearTelefonoAR(borradorResidente.telefono) : '');
  const [tocados, setTocados] = useState({ nombre: false, telefono: false });

  const vNombre = validarNombre(nombre, 'el nombre');
  const vTelefono = telefono.trim() ? validarTelefonoAR(telefono) : null;
  const errorNombre = tocados.nombre && !vNombre.ok ? vNombre.error : null;
  const errorTelefono = tocados.telefono && vTelefono && !vTelefono.ok ? vTelefono.error : null;
  const ayudaTelefono =
    vTelefono?.ok
      ? `Se va a guardar como ${formatearTelefonoAR(vTelefono.valor)}`
      : 'Opcional. Con código de área; si es celular, con el 15 (ej. 11 15 2345-6789).';

  function onSiguiente() {
    setTocados({ nombre: true, telefono: true });
    if (!vNombre.ok || (vTelefono && !vTelefono.ok)) return;
    guardarBorradorResidente({ nombre: vNombre.valor, telefono: vTelefono?.ok ? vTelefono.valor : null });
    router.push('/vinculacion/camaras');
  }

  return (
    <SafeAreaView style={styles.pantalla}>
      <KeyboardAvoidingView style={styles.pantalla} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.contenido} keyboardShouldPersistTaps="handled">
          <BarraSuperior textoVolver="Cerrar sesión" onVolver={cerrarSesion} paso={{ actual: 2, total: TOTAL_PASOS }} />

          {hogarPendiente?.kit && (
            <View style={styles.exito} accessibilityLiveRegion="polite">
              <Feather name="check-circle" size={18} color={colors.rutinaTexto} />
              <Text style={[typography.secundario, styles.exitoTexto]}>
                Kit {hogarPendiente.kit.numero_serie} vinculado a tu cuenta ·{' '}
                {hogarPendiente.kit.cantidad_camaras === 1
                  ? '1 cámara'
                  : `${hogarPendiente.kit.cantidad_camaras} cámaras`}
              </Text>
            </View>
          )}

          <View style={styles.encabezado}>
            <Text style={typography.titulo} accessibilityRole="header">
              ¿A quién vas a cuidar?
            </Text>
            <Text style={styles.subtitulo}>
              Es la persona que vive en el hogar. Su nombre aparece en las alertas y los reportes.
            </Text>
          </View>

          <CampoTexto
            label="Nombre y apellido"
            icono="user"
            value={nombre}
            onChangeText={setNombre}
            onBlur={() => setTocados((t) => ({ ...t, nombre: true }))}
            error={errorNombre}
            placeholder="Rosa Méndez"
            autoCapitalize="words"
            returnKeyType="next"
            onSubmitEditing={() => refTelefono.current?.focus()}
          />
          <CampoTexto
            ref={refTelefono}
            label="Teléfono"
            icono="phone"
            value={telefono}
            onChangeText={setTelefono}
            onBlur={() => setTocados((t) => ({ ...t, telefono: true }))}
            error={errorTelefono}
            ayuda={ayudaTelefono}
            placeholder="11 15 2345-6789"
            keyboardType="phone-pad"
            autoComplete="tel"
            textContentType="telephoneNumber"
            returnKeyType="done"
            onSubmitEditing={onSiguiente}
          />

          <Boton label="Siguiente" onPress={onSiguiente} style={styles.boton} />
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
    exito: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      padding: spacing.md,
      borderRadius: radius.md,
      backgroundColor: colors.rutinaSuave,
    },
    exitoTexto: {
      flex: 1,
      color: colors.texto,
    },
    encabezado: {
      gap: spacing.sm,
    },
    subtitulo: {
      ...typography.secundario,
      fontSize: 15,
      lineHeight: 21,
    },
    boton: {
      marginTop: spacing.sm,
    },
  });
