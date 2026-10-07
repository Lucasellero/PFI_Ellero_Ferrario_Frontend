import Feather from '@expo/vector-icons/Feather';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Boton } from '@/components/Boton';
import { Chip } from '@/components/Chip';
import { EncabezadoPantalla } from '@/components/EncabezadoPantalla';
import { useAuth } from '@/features/auth/AuthProvider';
import { useHogar } from '@/features/hogar/HogarProvider';
import { API_MODE } from '@/config';
import { formatearTelefonoAR } from '@/lib/validaciones';
import { radius, spacing, useEstilos, useTema, type PreferenciaTema, type Tema } from '@/theme';

const ROLES: Record<string, string> = {
  responsable_principal: 'Responsable principal',
  responsable: 'Responsable',
  familiar: 'Familiar',
};

const APARIENCIAS: { valor: PreferenciaTema; label: string }[] = [
  { valor: 'sistema', label: 'Sistema' },
  { valor: 'claro', label: 'Claro' },
  { valor: 'oscuro', label: 'Oscuro' },
];

/**
 * Perfil: datos del familiar y del hogar, apariencia (claro/oscuro) y cerrar sesión. No tiene
 * mockup en el informe; sigue el mismo lenguaje visual. Acá van a vivir más adelante la gestión
 * de familiares (RF12) y las preferencias de notificación.
 */
export function PerfilScreen() {
  const { cerrarSesion } = useAuth();
  const { perfil, hogar } = useHogar();
  const { colors, typography, preferencia, cambiarPreferencia } = useTema();
  const styles = useEstilos(crearEstilos);

  return (
    <SafeAreaView style={styles.pantalla} edges={['top']}>
      <ScrollView contentContainerStyle={styles.contenido}>
        <EncabezadoPantalla sobretitulo={perfil?.familiar.email ?? ''} titulo={perfil?.familiar.nombre ?? 'Perfil'} />

        {hogar && (
          <View style={styles.card}>
            <Fila icono="home" titulo="Hogar" valor={hogar.nombre} />
            <Fila icono="user" titulo="Residente" valor={hogar.residente.nombre} />
            <Fila
              icono="phone"
              titulo="Teléfono del residente"
              valor={hogar.residente.telefono ? formatearTelefonoAR(hogar.residente.telefono) : 'Sin cargar'}
            />
            {hogar.kit && (
              <Fila
                icono="cpu"
                titulo="Kit vinculado"
                valor={`${hogar.kit.numero_serie} · ${hogar.kit.cantidad_camaras} ${hogar.kit.cantidad_camaras === 1 ? 'cámara' : 'cámaras'}`}
              />
            )}
            <Fila icono="shield" titulo="Tu rol" valor={ROLES[hogar.rol] ?? hogar.rol} ultima />
          </View>
        )}

        {hogar && (
          <View style={styles.seccion}>
            <Text style={typography.seccion}>Hogar</Text>
            {hogar.rol === 'responsable_principal' && (
              <>
                <EnlaceFila
                  icono="user"
                  label="Editar residente"
                  onPress={() => router.push('/editar-residente')}
                />
                <EnlaceFila
                  icono="video"
                  label="Ubicación de las cámaras"
                  onPress={() => router.push('/editar-camaras')}
                />
              </>
            )}
            <EnlaceFila icono="users" label="Familiares" onPress={() => router.push('/familiares')} />
          </View>
        )}

        <View style={styles.seccion}>
          <Text style={typography.seccion}>Apariencia</Text>
          <View style={styles.chips}>
            {APARIENCIAS.map((a) => (
              <Chip
                key={a.valor}
                label={a.label}
                activo={preferencia === a.valor}
                onPress={() => cambiarPreferencia(a.valor)}
              />
            ))}
          </View>
          {preferencia === 'sistema' && (
            <Text style={typography.pequeno}>Sigue el modo claro u oscuro de tu celular.</Text>
          )}
        </View>

        <View style={styles.privacidad}>
          <Feather name="shield" size={18} color={colors.acento} />
          <Text style={[typography.secundario, styles.flex]}>
            El video se procesa dentro del hogar y nunca se envía a la nube. A la app solo llegan los
            eventos detectados.
          </Text>
        </View>

        <Boton label="Cerrar sesión" variante="secundario" onPress={cerrarSesion} />

        {API_MODE === 'mock' && (
          <Text style={[typography.pequeno, styles.centrado]}>Modo demo · datos de prueba</Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function Fila({
  icono,
  titulo,
  valor,
  ultima,
}: {
  icono: 'home' | 'user' | 'phone' | 'shield' | 'cpu';
  titulo: string;
  valor: string;
  ultima?: boolean;
}) {
  const { colors, typography } = useTema();
  const styles = useEstilos(crearEstilos);
  return (
    <View style={[styles.fila, !ultima && styles.filaBorde]}>
      <Feather name={icono} size={18} color={colors.textoSecundario} />
      <View style={styles.flex}>
        <Text style={typography.pequeno}>{titulo}</Text>
        <Text style={typography.cuerpoFuerte}>{valor}</Text>
      </View>
    </View>
  );
}

/** Fila tocable que navega a otra pantalla (editar residente/cámaras, familiares). */
function EnlaceFila({
  icono,
  label,
  onPress,
}: {
  icono: 'user' | 'video' | 'users';
  label: string;
  onPress: () => void;
}) {
  const { colors, typography } = useTema();
  const styles = useEstilos(crearEstilos);
  return (
    <Pressable onPress={onPress} accessibilityRole="button" style={styles.enlace}>
      <Feather name={icono} size={18} color={colors.acento} />
      <Text style={[typography.cuerpoFuerte, styles.enlaceTexto]}>{label}</Text>
      <Feather name="chevron-right" size={18} color={colors.textoTenue} />
    </Pressable>
  );
}

const crearEstilos = ({ colors }: Tema) =>
  StyleSheet.create({
    pantalla: {
      flex: 1,
      backgroundColor: colors.fondo,
    },
    contenido: {
      padding: spacing.xl,
      gap: spacing.xl,
    },
    card: {
      backgroundColor: colors.superficie,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.borde,
      paddingHorizontal: spacing.lg,
    },
    fila: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.lg,
      paddingVertical: spacing.lg,
    },
    filaBorde: {
      borderBottomWidth: 1,
      borderBottomColor: colors.borde,
    },
    enlace: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      padding: spacing.lg,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.borde,
      backgroundColor: colors.superficie,
    },
    enlaceTexto: {
      flex: 1,
    },
    seccion: {
      gap: spacing.md,
    },
    chips: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    privacidad: {
      flexDirection: 'row',
      gap: spacing.md,
      padding: spacing.lg,
      backgroundColor: colors.primarioSuave,
      borderRadius: radius.md,
    },
    flex: {
      flex: 1,
    },
    centrado: {
      textAlign: 'center',
    },
  });
