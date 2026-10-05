import { Link } from 'expo-router';
import { useRef, useState } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  type TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Boton } from '@/components/Boton';
import { CampoTexto } from '@/components/CampoTexto';
import { validarEmail } from '@/lib/validaciones';
import { spacing, useEstilos, type Tema } from '@/theme';

import { AuthError, useAuth } from './AuthProvider';

/**
 * Mockup 01 · Login: logo y frase de la marca (informe, sección "Branding"), un solo objetivo
 * (iniciar sesión) y la promesa de privacidad al pie (RNF1). Abajo, el acceso a "Crear cuenta"
 * para quien recibió un kit nuevo.
 *
 * Validación: cada campo se revisa al salir de él y todos al tocar "Iniciar sesión". En el
 * login solo se controla el formato del mail y que haya contraseña; las reglas de contraseña
 * fuerte son del registro (una cuenta vieja podría no cumplirlas).
 */
export function LoginScreen() {
  const { iniciarSesion, recuperarContrasena } = useAuth();
  const styles = useEstilos(crearEstilos);
  const refContrasena = useRef<TextInput>(null);
  const [email, setEmail] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [tocados, setTocados] = useState({ email: false, contrasena: false });
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const vEmail = validarEmail(email);
  const errorEmail = tocados.email && !vEmail.ok ? vEmail.error : null;
  const errorContrasena = tocados.contrasena && !contrasena ? 'Ingresá tu contraseña.' : null;

  async function onIngresar() {
    setTocados({ email: true, contrasena: true });
    setError(null);
    if (!vEmail.ok || !contrasena) return;
    setCargando(true);
    try {
      await iniciarSesion(email, contrasena);
    } catch (e) {
      setError(e instanceof AuthError ? e.message : 'No pudimos iniciar sesión. Probá de nuevo.');
      setCargando(false);
    }
  }

  async function onOlvide() {
    setError(null);
    try {
      await recuperarContrasena(email);
      Alert.alert('Revisá tu correo', `Si hay una cuenta con ${email.trim()}, te mandamos un enlace para cambiar la contraseña.`);
    } catch (e) {
      setError(e instanceof AuthError ? e.message : 'No pudimos enviar el correo.');
    }
  }

  return (
    <SafeAreaView style={styles.pantalla}>
      <KeyboardAvoidingView
        style={styles.pantalla}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.contenido} keyboardShouldPersistTaps="handled">
          <View style={styles.marca}>
            <View style={styles.logo}>
              <Image
                source={require('@/assets/images/logo-simbolo.png')}
                style={styles.logoImagen}
                resizeMode="contain"
                accessibilityIgnoresInvertColors
              />
            </View>
            <Text style={styles.nombre} accessibilityRole="header">
              LARES
            </Text>
            <Text style={styles.lema}>La distancia deja de ser{'\n'}un problema.</Text>
          </View>

          <View style={styles.form}>
            <CampoTexto
              label="Correo electrónico"
              icono="mail"
              value={email}
              onChangeText={setEmail}
              onBlur={() => setTocados((t) => ({ ...t, email: true }))}
              error={errorEmail}
              placeholder="nombre@mail.com"
              keyboardType="email-address"
              autoComplete="email"
              textContentType="emailAddress"
              returnKeyType="next"
              onSubmitEditing={() => refContrasena.current?.focus()}
            />
            <CampoTexto
              ref={refContrasena}
              label="Contraseña"
              icono="lock"
              value={contrasena}
              onChangeText={setContrasena}
              onBlur={() => setTocados((t) => ({ ...t, contrasena: true }))}
              error={errorContrasena}
              placeholder="••••••••"
              secureTextEntry
              autoComplete="password"
              textContentType="password"
              returnKeyType="go"
              onSubmitEditing={onIngresar}
            />
            {error && (
              <Text style={styles.error} accessibilityLiveRegion="polite">
                {error}
              </Text>
            )}

            <Boton label="Iniciar sesión" onPress={onIngresar} cargando={cargando} style={styles.boton} />
            <Pressable onPress={onOlvide} accessibilityRole="link" style={styles.link}>
              <Text style={styles.linkTexto}>Olvidé mi contraseña</Text>
            </Pressable>
          </View>

          <View style={styles.pie}>
            <Link href="/registro" asChild>
              <Pressable accessibilityRole="link" style={styles.link}>
                <Text style={styles.registro}>
                  ¿Te llegó un kit Lares? <Text style={styles.linkTexto}>Creá tu cuenta</Text>
                </Text>
              </Pressable>
            </Link>
            <Text style={styles.privacidad}>Monitoreo no invasivo · El video nunca sale de tu hogar</Text>
          </View>
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
      padding: spacing.xxl,
      justifyContent: 'space-between',
      gap: spacing.xxl,
    },
    marca: {
      alignItems: 'center',
      marginTop: spacing.xxl * 2,
      gap: spacing.md,
    },
    logo: {
      width: 96,
      height: 96,
      borderRadius: 24,
      backgroundColor: colors.fondoLogo,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.sm,
      // Sombra suave como en el mockup 01
      shadowColor: colors.sombra,
      shadowOpacity: 0.08,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 4 },
      elevation: 3,
    },
    logoImagen: {
      width: 60,
      height: 54,
    },
    nombre: {
      fontSize: 34,
      fontWeight: '800',
      letterSpacing: 3,
      color: colors.acento,
    },
    lema: {
      ...typography.cuerpo,
      color: colors.textoSecundario,
      textAlign: 'center',
      lineHeight: 24,
    },
    form: {
      gap: spacing.lg,
    },
    error: {
      color: colors.urgenteTexto,
      fontSize: 14,
    },
    boton: {
      marginTop: spacing.sm,
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
    pie: {
      gap: spacing.md,
    },
    registro: {
      ...typography.secundario,
      fontSize: 15,
      textAlign: 'center',
    },
    privacidad: {
      ...typography.pequeno,
      textAlign: 'center',
    },
  });
