import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, type TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { api } from '@/api/client';
import { BarraSuperior } from '@/components/BarraSuperior';
import { Boton } from '@/components/Boton';
import { CampoTexto } from '@/components/CampoTexto';
import { useCuenta } from '@/features/cuenta/CuentaProvider';
import { useHogar } from '@/features/hogar/HogarProvider';
import { formatearTelefonoAR, validarNombre, validarTelefonoAR } from '@/lib/validaciones';
import { spacing, useEstilos, useTema, type Tema } from '@/theme';

/**
 * Editar nombre y teléfono del residente desde Perfil (después de la configuración inicial,
 * que usa `DatosResidenteScreen` — mismo endpoint `PUT /hogares/{id}/residente`, pantalla
 * separada porque no hay "paso siguiente": acá se guarda y se vuelve). Solo
 * `responsable_principal` (el backend lo exige igual; `PerfilScreen` ya oculta la entrada).
 */
export function EditarResidenteScreen() {
  const { hogar } = useHogar();
  const { recargarPerfil } = useCuenta();
  const { typography } = useTema();
  const styles = useEstilos(crearEstilos);
  const refTelefono = useRef<TextInput>(null);

  const [nombre, setNombre] = useState(hogar?.residente.nombre ?? '');
  const [telefono, setTelefono] = useState(
    hogar?.residente.telefono ? formatearTelefonoAR(hogar.residente.telefono) : '',
  );
  const [tocados, setTocados] = useState({ nombre: false, telefono: false });
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!hogar) return null;

  const vNombre = validarNombre(nombre, 'el nombre');
  const vTelefono = telefono.trim() ? validarTelefonoAR(telefono) : null;
  const errorNombre = tocados.nombre && !vNombre.ok ? vNombre.error : null;
  const errorTelefono = tocados.telefono && vTelefono && !vTelefono.ok ? vTelefono.error : null;
  const ayudaTelefono =
    vTelefono?.ok
      ? `Se va a guardar como ${formatearTelefonoAR(vTelefono.valor)}`
      : 'Opcional. Con código de área; si es celular, con el 15 (ej. 11 15 2345-6789).';

  async function onGuardar() {
    setTocados({ nombre: true, telefono: true });
    setError(null);
    if (!vNombre.ok || (vTelefono && !vTelefono.ok)) return;
    setGuardando(true);
    try {
      await api.guardarResidente(hogar!.id, { nombre: vNombre.valor, telefono: vTelefono?.ok ? vTelefono.valor : null });
      await recargarPerfil();
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
            Datos del residente
          </Text>

          <CampoTexto
            label="Nombre y apellido"
            icono="user"
            value={nombre}
            onChangeText={setNombre}
            onBlur={() => setTocados((t) => ({ ...t, nombre: true }))}
            error={errorNombre}
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
            onSubmitEditing={onGuardar}
          />

          {error && (
            <Text style={styles.error} accessibilityLiveRegion="assertive">
              {error}
            </Text>
          )}
          <Boton label="Guardar" onPress={onGuardar} cargando={guardando} style={styles.boton} />
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
    boton: {
      marginTop: spacing.sm,
    },
    error: {
      color: colors.urgenteTexto,
      fontSize: 14,
    },
  });
