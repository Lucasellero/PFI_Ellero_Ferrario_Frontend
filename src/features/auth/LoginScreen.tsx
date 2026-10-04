import Feather from '@expo/vector-icons/Feather';
import { useState, type ComponentProps } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Boton } from '@/components/Boton';
import { radius, spacing, useEstilos, useTema, type Tema } from '@/theme';

import { AuthError, useAuth } from './AuthProvider';

/**
 * Mockup 01 · Login: logo y frase de la marca (informe, sección "Branding"), un solo objetivo
 * (iniciar sesión) y la promesa de privacidad al pie (RNF1).
 */
export function LoginScreen() {
  const { iniciarSesion, recuperarContrasena } = useAuth();
  const styles = useEstilos(crearEstilos);
  const [email, setEmail] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onIngresar() {
    setError(null);
    setCargando(true);
    try {
      await iniciarSesion(email, contrasena);
    } catch (e) {
      setError(e instanceof AuthError ? e.message : 'No pudimos iniciar sesión. Probá de nuevo.');
      setCargando(false);
    }
  }

  async function onOlvide() {
    try {
      await recuperarContrasena(email);
      Alert.alert('Revisá tu correo', `Te mandamos un enlace para cambiar la contraseña a ${email.trim()}.`);
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
            <Campo
              label="Correo electrónico"
              icono="mail"
              value={email}
              onChangeText={setEmail}
              placeholder="nombre@mail.com"
              keyboardType="email-address"
              autoComplete="email"
              textContentType="emailAddress"
            />
            <Campo
              label="Contraseña"
              icono="lock"
              value={contrasena}
              onChangeText={setContrasena}
              placeholder="••••••••"
              secureTextEntry
              autoComplete="password"
              textContentType="password"
              onSubmitEditing={onIngresar}
            />
            {error && <Text style={styles.error}>{error}</Text>}

            <Boton label="Iniciar sesión" onPress={onIngresar} cargando={cargando} style={styles.boton} />
            <Pressable onPress={onOlvide} accessibilityRole="link" style={styles.olvide}>
              <Text style={styles.olvideTexto}>Olvidé mi contraseña</Text>
            </Pressable>
          </View>

          <Text style={styles.pie}>Monitoreo no invasivo · El video nunca sale de tu hogar</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

type CampoProps = ComponentProps<typeof TextInput> & {
  label: string;
  icono: ComponentProps<typeof Feather>['name'];
};

function Campo({ label, icono, ...input }: CampoProps) {
  const { colors } = useTema();
  const styles = useEstilos(crearEstilos);
  return (
    <View style={styles.campo}>
      <Text style={styles.campoLabel}>{label}</Text>
      <View style={styles.input}>
        <Feather name={icono} size={18} color={colors.textoSecundario} />
        <TextInput
          style={styles.inputTexto}
          placeholderTextColor={colors.textoTenue}
          autoCapitalize="none"
          autoCorrect={false}
          accessibilityLabel={label}
          {...input}
        />
      </View>
    </View>
  );
}

const crearEstilos = ({ colors, typography }: Tema) => StyleSheet.create({
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
  campo: {
    gap: spacing.sm,
  },
  campoLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.texto,
  },
  input: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    minHeight: 56,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borde,
    backgroundColor: colors.superficie,
  },
  inputTexto: {
    flex: 1,
    fontSize: 16,
    color: colors.texto,
    paddingVertical: spacing.md,
  },
  error: {
    color: colors.urgenteTexto,
    fontSize: 14,
  },
  boton: {
    marginTop: spacing.sm,
  },
  olvide: {
    alignSelf: 'center',
    padding: spacing.sm,
  },
  olvideTexto: {
    color: colors.acento,
    fontSize: 15,
    fontWeight: '600',
  },
  pie: {
    ...typography.pequeno,
    textAlign: 'center',
  },
});
