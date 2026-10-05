import Feather from '@expo/vector-icons/Feather';
import { Link, Redirect, router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BarraSuperior } from '@/components/BarraSuperior';
import { Boton } from '@/components/Boton';
import { useAuth } from '@/features/auth/AuthProvider';
import { useCuenta } from '@/features/cuenta/CuentaProvider';
import { primerNombre } from '@/features/eventos/formato';
import { radius, spacing, useEstilos, useTema, type Tema } from '@/theme';

import { TOTAL_PASOS } from './VinculacionProvider';

const INSTRUCCIONES = [
  { icono: 'power', texto: 'Enchufá la controladora Lar y conectala al wifi de la casa.' },
  { icono: 'maximize', texto: 'Buscá la etiqueta con el código QR en la base de la controladora.' },
  { icono: 'smartphone', texto: 'Escaneala desde acá. Si no podés, tipeá el código que está debajo.' },
] as const;

/** Paso 1 · Vincular el kit: qué hacer y cómo (QR o código a mano). */
export function InicioVinculacionScreen() {
  const { cerrarSesion } = useAuth();
  const { perfil, hogarPendiente } = useCuenta();
  const { colors, typography } = useTema();
  const styles = useEstilos(crearEstilos);

  // El kit ya quedó vinculado pero falta la configuración inicial (ej. se cerró la app a mitad
  // de camino): se retoma desde el paso 2.
  if (hogarPendiente) return <Redirect href="/vinculacion/residente" />;

  const nombre = perfil ? primerNombre(perfil.familiar.nombre) : '';

  return (
    <SafeAreaView style={styles.pantalla}>
      <ScrollView contentContainerStyle={styles.contenido}>
        <BarraSuperior textoVolver="Cerrar sesión" onVolver={cerrarSesion} paso={{ actual: 1, total: TOTAL_PASOS }} />

        <View style={styles.encabezado}>
          <View style={styles.icono}>
            <Feather name="home" size={34} color={colors.acento} />
          </View>
          <Text style={typography.titulo} accessibilityRole="header">
            {nombre ? `¡Hola, ${nombre}!` : '¡Hola!'}
          </Text>
          <Text style={styles.subtitulo}>
            Vinculemos tu kit Lares con tu cuenta. Así vas a recibir las alertas de tu familiar en este
            celular.
          </Text>
        </View>

        <View style={styles.card}>
          {INSTRUCCIONES.map((p, i) => (
            <View key={p.texto} style={styles.instruccion}>
              <View style={styles.numero}>
                <Text style={styles.numeroTexto}>{i + 1}</Text>
              </View>
              <Text style={[typography.cuerpo, styles.flex]}>{p.texto}</Text>
              <Feather name={p.icono} size={18} color={colors.textoSecundario} />
            </View>
          ))}
        </View>

        <View style={styles.acciones}>
          <Boton label="Escanear el código QR" onPress={() => router.push('/vinculacion/escanear')} />
          <Link href="/vinculacion/codigo" asChild>
            <Pressable accessibilityRole="button" style={styles.link}>
              <Text style={styles.linkTexto}>Ingresar el código a mano</Text>
            </Pressable>
          </Link>
        </View>

        <View style={styles.privacidad}>
          <Feather name="shield" size={16} color={colors.acento} />
          <Text style={[typography.pequeno, styles.flex]}>
            El código solo vincula el kit con tu cuenta. El video se procesa en la controladora y nunca
            sale del hogar.
          </Text>
        </View>
      </ScrollView>
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
      marginTop: spacing.md,
    },
    icono: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: colors.primarioSuave,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.sm,
    },
    subtitulo: {
      ...typography.secundario,
      fontSize: 15,
      lineHeight: 21,
    },
    card: {
      backgroundColor: colors.superficie,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.borde,
      padding: spacing.lg,
      gap: spacing.lg,
    },
    instruccion: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
    },
    numero: {
      width: 26,
      height: 26,
      borderRadius: 13,
      backgroundColor: colors.primarioSuave,
      alignItems: 'center',
      justifyContent: 'center',
    },
    numeroTexto: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.acento,
    },
    flex: {
      flex: 1,
    },
    acciones: {
      gap: spacing.sm,
    },
    link: {
      alignSelf: 'center',
      padding: spacing.md,
    },
    linkTexto: {
      color: colors.acento,
      fontSize: 15,
      fontWeight: '600',
    },
    privacidad: {
      flexDirection: 'row',
      gap: spacing.sm,
      padding: spacing.lg,
      backgroundColor: colors.primarioSuave,
      borderRadius: radius.md,
    },
  });
