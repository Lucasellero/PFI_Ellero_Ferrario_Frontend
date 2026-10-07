import Feather from '@expo/vector-icons/Feather';
import { Link, Redirect, router } from 'expo-router';
import { useState } from 'react';
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
  { icono: 'power', texto: 'Enchufá la controladora Lar y conectala al router de tu casa con un cable de red.' },
  { icono: 'maximize', texto: 'Buscá la etiqueta con el código QR en la base de la controladora.' },
  { icono: 'smartphone', texto: 'Escaneala desde acá. Si no podés, tipeá el código que está debajo.' },
] as const;

type Modo = 'elegir' | 'kit' | 'invitado';

/**
 * Paso 1 · Arranque: antes de pedir el QR, pregunta primero **para qué** se creó la cuenta
 * (2026-10-07, segunda vuelta — la primera versión escondía esto como un link chiquito al pie
 * de la pantalla de escanear, muy poco visible). "Tengo un kit" y "me invitó un familiar" pesan
 * lo mismo en pantalla, ninguno es la opción "secundaria".
 */
export function InicioVinculacionScreen() {
  const { cerrarSesion } = useAuth();
  const { perfil, hogarPendiente } = useCuenta();
  const [modo, setModo] = useState<Modo>('elegir');

  // El kit ya quedó vinculado pero falta la configuración inicial (ej. se cerró la app a mitad
  // de camino): se retoma desde el paso 2.
  if (hogarPendiente) return <Redirect href="/vinculacion/residente" />;

  const nombre = perfil ? primerNombre(perfil.familiar.nombre) : '';
  const email = perfil?.familiar.email ?? '';

  if (modo === 'elegir') {
    return <ElegirCamino nombre={nombre} onCerrarSesion={cerrarSesion} onElegir={setModo} />;
  }
  if (modo === 'invitado') {
    return <EsperandoInvitacion email={email} onVolver={() => setModo('elegir')} />;
  }
  return <VincularKit onVolver={() => setModo('elegir')} />;
}

function ElegirCamino({
  nombre,
  onCerrarSesion,
  onElegir,
}: {
  nombre: string;
  onCerrarSesion: () => void;
  onElegir: (modo: Modo) => void;
}) {
  const { colors, typography } = useTema();
  const styles = useEstilos(crearEstilos);
  return (
    <SafeAreaView style={styles.pantalla}>
      <ScrollView contentContainerStyle={styles.contenido}>
        <BarraSuperior textoVolver="Cerrar sesión" onVolver={onCerrarSesion} />

        <View style={styles.encabezado}>
          <View style={styles.icono}>
            <Feather name="home" size={34} color={colors.acento} />
          </View>
          <Text style={typography.titulo} accessibilityRole="header">
            {nombre ? `¡Hola, ${nombre}!` : '¡Hola!'}
          </Text>
          <Text style={styles.subtitulo}>¿Cómo vas a usar Lares?</Text>
        </View>

        <Pressable
          onPress={() => onElegir('kit')}
          accessibilityRole="button"
          style={({ pressed }) => [styles.opcion, pressed && styles.opcionPresionada]}>
          <View style={styles.opcionIcono}>
            <Feather name="package" size={22} color={colors.acento} />
          </View>
          <View style={styles.flex}>
            <Text style={typography.cuerpoFuerte}>Tengo un kit para vincular</Text>
            <Text style={typography.secundario}>Llegó una controladora Lar a tu casa.</Text>
          </View>
          <Feather name="chevron-right" size={20} color={colors.textoTenue} />
        </Pressable>

        <Pressable
          onPress={() => onElegir('invitado')}
          accessibilityRole="button"
          style={({ pressed }) => [styles.opcion, pressed && styles.opcionPresionada]}>
          <View style={styles.opcionIcono}>
            <Feather name="users" size={22} color={colors.acento} />
          </View>
          <View style={styles.flex}>
            <Text style={typography.cuerpoFuerte}>Un familiar ya usa Lares</Text>
            <Text style={typography.secundario}>Alguien tiene que invitarte a su hogar.</Text>
          </View>
          <Feather name="chevron-right" size={20} color={colors.textoTenue} />
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function EsperandoInvitacion({ email, onVolver }: { email: string; onVolver: () => void }) {
  const { recargarPerfil } = useCuenta();
  const { colors, typography } = useTema();
  const styles = useEstilos(crearEstilos);
  const [actualizando, setActualizando] = useState(false);

  async function onActualizar() {
    setActualizando(true);
    await recargarPerfil();
    setActualizando(false);
  }

  return (
    <SafeAreaView style={styles.pantalla}>
      <ScrollView contentContainerStyle={styles.contenido}>
        <BarraSuperior onVolver={onVolver} />

        <View style={styles.encabezado}>
          <View style={styles.icono}>
            <Feather name="users" size={34} color={colors.acento} />
          </View>
          <Text style={typography.titulo} accessibilityRole="header">
            Esperando que te inviten
          </Text>
          <Text style={styles.subtitulo}>
            Pedile a quien ya usa Lares que entre a <Text style={styles.negrita}>Perfil → Familiares</Text> y te
            invite con tu correo:
          </Text>
        </View>

        <View style={styles.card}>
          <View style={styles.correo}>
            <Feather name="mail" size={18} color={colors.acento} />
            <Text style={[typography.cuerpoFuerte, styles.flex]}>{email}</Text>
          </View>
        </View>

        <Boton label="Actualizar" onPress={onActualizar} cargando={actualizando} />

        <Text style={[typography.pequeno, styles.centrado]}>
          Apenas te inviten, tocá &quot;Actualizar&quot; — no hace falta cerrar sesión.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function VincularKit({ onVolver }: { onVolver: () => void }) {
  const { colors, typography } = useTema();
  const styles = useEstilos(crearEstilos);
  return (
    <SafeAreaView style={styles.pantalla}>
      <ScrollView contentContainerStyle={styles.contenido}>
        <BarraSuperior onVolver={onVolver} paso={{ actual: 1, total: TOTAL_PASOS }} />

        <View style={styles.encabezado}>
          <View style={styles.icono}>
            <Feather name="home" size={34} color={colors.acento} />
          </View>
          <Text style={typography.titulo} accessibilityRole="header">
            Vinculemos tu kit
          </Text>
          <Text style={styles.subtitulo}>
            Así vas a recibir las alertas de tu familiar en este celular.
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
    negrita: {
      fontWeight: '700',
      color: colors.texto,
    },
    opcion: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      padding: spacing.lg,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.borde,
      backgroundColor: colors.superficie,
    },
    opcionPresionada: {
      opacity: 0.7,
    },
    opcionIcono: {
      width: 44,
      height: 44,
      borderRadius: radius.sm,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primarioSuave,
    },
    correo: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
    },
    centrado: {
      textAlign: 'center',
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
