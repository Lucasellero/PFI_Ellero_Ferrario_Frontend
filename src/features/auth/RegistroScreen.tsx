import Feather from '@expo/vector-icons/Feather';
import { useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, type TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BarraSuperior } from '@/components/BarraSuperior';
import { Boton } from '@/components/Boton';
import { CampoTexto } from '@/components/CampoTexto';
import {
  reglasContrasena,
  validarConfirmacion,
  validarContrasenaNueva,
  validarEmail,
  validarNombre,
} from '@/lib/validaciones';
import { spacing, useEstilos, useTema, type Tema } from '@/theme';

import { AuthError, useAuth } from './AuthProvider';

type CampoId = 'nombre' | 'email' | 'contrasena' | 'confirmacion';

/**
 * Crear cuenta (no tiene mockup en el informe; sigue el lenguaje del Login). Es el primer paso
 * de la vinculación por QR: el familiar que recibe el kit se registra acá y después escanea el
 * QR desde la app (ver docs/vinculacion-kit.md).
 *
 * Validación: cada campo se marca al salir de él; las reglas de la contraseña se ven en vivo
 * mientras se escribe; al tocar "Crear cuenta" se marcan todos.
 */
export function RegistroScreen() {
  const { registrarCuenta } = useAuth();
  const { colors } = useTema();
  const styles = useEstilos(crearEstilos);
  const refEmail = useRef<TextInput>(null);
  const refContrasena = useRef<TextInput>(null);
  const refConfirmacion = useRef<TextInput>(null);

  const [datos, setDatos] = useState({ nombre: '', email: '', contrasena: '', confirmacion: '' });
  const [tocados, setTocados] = useState<Record<CampoId, boolean>>({
    nombre: false,
    email: false,
    contrasena: false,
    confirmacion: false,
  });
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validaciones = {
    nombre: validarNombre(datos.nombre, 'tu nombre'),
    email: validarEmail(datos.email),
    contrasena: validarContrasenaNueva(datos.contrasena),
    confirmacion: validarConfirmacion(datos.contrasena, datos.confirmacion),
  };
  const errorDe = (c: CampoId) => {
    const v = validaciones[c];
    return tocados[c] && !v.ok ? v.error : null;
  };
  const cambiar = (c: CampoId) => (texto: string) => setDatos((d) => ({ ...d, [c]: texto }));
  const tocar = (c: CampoId) => () => setTocados((t) => ({ ...t, [c]: true }));

  async function onCrear() {
    setTocados({ nombre: true, email: true, contrasena: true, confirmacion: true });
    setError(null);
    if (Object.values(validaciones).some((v) => !v.ok)) return;
    setCargando(true);
    try {
      await registrarCuenta(datos);
      // Con la sesión iniciada, el layout raíz lleva solo a la vinculación del kit.
    } catch (e) {
      setError(e instanceof AuthError ? e.message : 'No pudimos crear la cuenta. Probá de nuevo.');
      setCargando(false);
    }
  }

  return (
    <SafeAreaView style={styles.pantalla}>
      <KeyboardAvoidingView style={styles.pantalla} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.contenido} keyboardShouldPersistTaps="handled">
          <BarraSuperior />

          <View style={styles.encabezado}>
            <Text style={styles.titulo} accessibilityRole="header">
              Creá tu cuenta
            </Text>
            <Text style={styles.subtitulo}>
              Después vas a escanear el QR de tu kit para vincularlo con esta cuenta.
            </Text>
          </View>

          <View style={styles.form}>
            <CampoTexto
              label="Tu nombre"
              icono="user"
              value={datos.nombre}
              onChangeText={cambiar('nombre')}
              onBlur={tocar('nombre')}
              error={errorDe('nombre')}
              placeholder="Ana Gómez"
              autoCapitalize="words"
              autoComplete="name"
              textContentType="name"
              returnKeyType="next"
              onSubmitEditing={() => refEmail.current?.focus()}
            />
            <CampoTexto
              ref={refEmail}
              label="Correo electrónico"
              icono="mail"
              value={datos.email}
              onChangeText={cambiar('email')}
              onBlur={tocar('email')}
              error={errorDe('email')}
              ayuda="Te vamos a mandar un mail para confirmarlo."
              placeholder="nombre@mail.com"
              keyboardType="email-address"
              autoComplete="email"
              textContentType="emailAddress"
              returnKeyType="next"
              onSubmitEditing={() => refContrasena.current?.focus()}
            />
            <View style={styles.grupo}>
              <CampoTexto
                ref={refContrasena}
                label="Contraseña"
                icono="lock"
                value={datos.contrasena}
                onChangeText={cambiar('contrasena')}
                onBlur={tocar('contrasena')}
                error={errorDe('contrasena')}
                placeholder="••••••••"
                secureTextEntry
                autoComplete="new-password"
                textContentType="newPassword"
                returnKeyType="next"
                onSubmitEditing={() => refConfirmacion.current?.focus()}
              />
              <View style={styles.reglas} accessibilityLabel="Requisitos de la contraseña">
                {reglasContrasena(datos.contrasena).map((r) => (
                  <View key={r.texto} style={styles.regla}>
                    <Feather
                      name={r.cumple ? 'check-circle' : 'circle'}
                      size={14}
                      color={r.cumple ? colors.rutinaTexto : colors.textoTenue}
                    />
                    <Text style={[styles.reglaTexto, r.cumple && styles.reglaCumple]}>{r.texto}</Text>
                  </View>
                ))}
              </View>
            </View>
            <CampoTexto
              ref={refConfirmacion}
              label="Repetí la contraseña"
              icono="lock"
              value={datos.confirmacion}
              onChangeText={cambiar('confirmacion')}
              onBlur={tocar('confirmacion')}
              error={errorDe('confirmacion')}
              placeholder="••••••••"
              secureTextEntry
              autoComplete="new-password"
              textContentType="newPassword"
              returnKeyType="go"
              onSubmitEditing={onCrear}
            />

            {error && (
              <Text style={styles.error} accessibilityLiveRegion="polite">
                {error}
              </Text>
            )}
            <Boton label="Crear cuenta" onPress={onCrear} cargando={cargando} style={styles.boton} />
          </View>

          <Text style={styles.pie}>Tus datos se usan solo para avisarte lo que pasa en el hogar.</Text>
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
    titulo: typography.titulo,
    subtitulo: {
      ...typography.secundario,
      fontSize: 15,
      lineHeight: 21,
    },
    form: {
      gap: spacing.lg,
    },
    grupo: {
      gap: spacing.sm,
    },
    reglas: {
      gap: 4,
      paddingLeft: spacing.xs,
    },
    regla: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    reglaTexto: {
      ...typography.pequeno,
    },
    reglaCumple: {
      color: colors.rutinaTexto,
    },
    error: {
      color: colors.urgenteTexto,
      fontSize: 14,
    },
    boton: {
      marginTop: spacing.sm,
    },
    pie: {
      ...typography.pequeno,
      textAlign: 'center',
    },
  });
