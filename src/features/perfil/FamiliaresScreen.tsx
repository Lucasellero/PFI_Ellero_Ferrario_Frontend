import Feather from '@expo/vector-icons/Feather';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ApiError, api } from '@/api/client';
import type { FamiliarVinculado } from '@/api/types';
import { BarraSuperior } from '@/components/BarraSuperior';
import { Boton } from '@/components/Boton';
import { CampoTexto } from '@/components/CampoTexto';
import { Chip } from '@/components/Chip';
import { useCuenta } from '@/features/cuenta/CuentaProvider';
import { useHogar } from '@/features/hogar/HogarProvider';
import { validarEmail } from '@/lib/validaciones';
import { radius, spacing, useEstilos, useTema, type Tema } from '@/theme';

const ROL_LABEL: Record<string, string> = {
  responsable_principal: 'Responsable principal',
  familiar: 'Familiar',
};

/**
 * Gestión de familiares (RF12): listar, invitar por email, cambiar rol y desvincular. Cualquier
 * familiar vinculado ve la lista; solo `responsable_principal` invita, cambia roles y
 * desvincula a otros — uno mismo siempre se puede desvincular ("Salir del hogar").
 */
export function FamiliaresScreen() {
  const { recargarPerfil } = useCuenta();
  const { hogar, perfil } = useHogar();
  const { colors, typography } = useTema();
  const styles = useEstilos(crearEstilos);

  const hogarId = hogar?.id;
  const [carga, setCarga] = useState<{ hogarId: number; familiares?: FamiliarVinculado[]; error?: string }>();
  const [email, setEmail] = useState('');
  const [rolNuevo, setRolNuevo] = useState<'familiar' | 'responsable_principal'>('familiar');
  const [tocadoEmail, setTocadoEmail] = useState(false);
  const [invitando, setInvitando] = useState(false);
  const [ocupado, setOcupado] = useState<number | null>(null); // familiarId con una acción en curso

  function recargar() {
    if (hogarId == null) return;
    api
      .listarFamiliares(hogarId)
      .then((familiares) => setCarga({ hogarId, familiares }))
      .catch((e: Error) => setCarga({ hogarId, error: e.message }));
  }

  useEffect(recargar, [hogarId]);

  if (!hogar || !perfil) return null;

  const actual = carga?.hogarId === hogarId ? carga : undefined;
  const familiares = actual?.familiares ?? [];
  const soyResponsable = hogar.rol === 'responsable_principal';
  const miId = perfil.familiar.id;

  const vEmail = validarEmail(email);
  const errorEmail = tocadoEmail && !vEmail.ok ? vEmail.error : null;

  async function onInvitar() {
    setTocadoEmail(true);
    if (!vEmail.ok) return;
    setInvitando(true);
    try {
      await api.invitarFamiliar(hogarId!, { email: vEmail.valor, rol: rolNuevo });
      setEmail('');
      setTocadoEmail(false);
      setRolNuevo('familiar');
      recargar();
    } catch (e) {
      Alert.alert('No pudimos invitar', mensajeError(e));
    } finally {
      setInvitando(false);
    }
  }

  async function onCambiarRol(f: FamiliarVinculado, rol: string) {
    setOcupado(f.id);
    try {
      await api.cambiarRolFamiliar(hogarId!, f.id, { rol });
      recargar();
    } catch (e) {
      Alert.alert('No pudimos cambiar el rol', mensajeError(e));
    } finally {
      setOcupado(null);
    }
  }

  function onQuitar(f: FamiliarVinculado) {
    const esSelf = f.id === miId;
    Alert.alert(
      esSelf ? 'Salir del hogar' : `Desvincular a ${f.nombre}`,
      esSelf
        ? 'Vas a dejar de ver las alertas y los reportes de este hogar.'
        : `${f.nombre} va a dejar de ver las alertas y los reportes de este hogar.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: esSelf ? 'Salir' : 'Desvincular',
          style: 'destructive',
          onPress: async () => {
            setOcupado(f.id);
            try {
              await api.quitarFamiliar(hogarId!, f.id);
              // Si era el único hogar, el layout raíz pasa sola a la vinculación (CuentaProvider
              // recalcula la etapa con el perfil actualizado — no hace falta navegar a mano).
              if (esSelf) {
                await recargarPerfil();
              } else {
                recargar();
              }
            } catch (e) {
              Alert.alert(esSelf ? 'No pudimos sacarte del hogar' : 'No pudimos desvincularlo', mensajeError(e));
              setOcupado(null);
            }
          },
        },
      ],
    );
  }

  return (
    <SafeAreaView style={styles.pantalla}>
      <ScrollView contentContainerStyle={styles.contenido}>
        <BarraSuperior />
        <Text style={typography.titulo} accessibilityRole="header">
          Familiares
        </Text>
        <Text style={typography.secundario}>Quién puede ver las alertas y los reportes de {hogar.nombre}.</Text>

        {!actual && <ActivityIndicator color={colors.acento} style={styles.cargando} />}
        {actual?.error && <Text style={styles.error}>{actual.error}</Text>}

        <View style={styles.lista}>
          {familiares.map((f, i) => (
            <View key={f.id} style={[styles.fila, i < familiares.length - 1 && styles.filaBorde]}>
              <View style={styles.filaTextos}>
                <Text style={typography.cuerpoFuerte}>
                  {f.nombre}
                  {f.id === miId ? ' (vos)' : ''}
                </Text>
                <Text style={typography.secundario}>{f.email}</Text>
              </View>

              {soyResponsable && f.id !== miId ? (
                <Pressable
                  onPress={() =>
                    onCambiarRol(f, f.rol === 'responsable_principal' ? 'familiar' : 'responsable_principal')
                  }
                  disabled={ocupado === f.id}
                  accessibilityRole="button"
                  style={styles.rolBoton}>
                  {ocupado === f.id ? (
                    <ActivityIndicator color={colors.acento} />
                  ) : (
                    <Text style={styles.rolBotonTexto}>{ROL_LABEL[f.rol] ?? f.rol}</Text>
                  )}
                </Pressable>
              ) : (
                <Text style={typography.pequeno}>{ROL_LABEL[f.rol] ?? f.rol}</Text>
              )}

              {(soyResponsable || f.id === miId) && (
                <Pressable
                  onPress={() => onQuitar(f)}
                  disabled={ocupado === f.id}
                  accessibilityRole="button"
                  accessibilityLabel={f.id === miId ? 'Salir del hogar' : `Desvincular a ${f.nombre}`}
                  hitSlop={8}
                  style={styles.quitar}>
                  <Feather name={f.id === miId ? 'log-out' : 'x'} size={18} color={colors.urgenteTexto} />
                </Pressable>
              )}
            </View>
          ))}
        </View>

        {soyResponsable && (
          <View style={styles.invitar}>
            <Text style={typography.seccion}>Invitar a alguien</Text>
            <Text style={typography.pequeno}>
              Tiene que haber creado su cuenta en Lares antes — todavía no hay invitación por mail.
            </Text>
            <CampoTexto
              label="Correo"
              icono="mail"
              value={email}
              onChangeText={setEmail}
              onBlur={() => setTocadoEmail(true)}
              error={errorEmail}
              placeholder="nombre@mail.com"
              keyboardType="email-address"
              autoComplete="email"
              textContentType="emailAddress"
              returnKeyType="done"
            />
            <View style={styles.chips}>
              <Chip label="Familiar" activo={rolNuevo === 'familiar'} onPress={() => setRolNuevo('familiar')} />
              <Chip
                label="Responsable principal"
                activo={rolNuevo === 'responsable_principal'}
                onPress={() => setRolNuevo('responsable_principal')}
              />
            </View>
            <Boton label="Invitar" onPress={onInvitar} cargando={invitando} />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function mensajeError(e: unknown): string {
  if (e instanceof ApiError && (e.status === 404 || e.status === 409 || e.status === 403)) return e.message;
  return 'Revisá tu conexión y probá de nuevo.';
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
    cargando: {
      marginVertical: spacing.xl,
    },
    error: {
      color: colors.urgenteTexto,
      fontSize: 14,
    },
    lista: {
      backgroundColor: colors.superficie,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.borde,
    },
    fila: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      padding: spacing.lg,
    },
    filaBorde: {
      borderBottomWidth: 1,
      borderBottomColor: colors.borde,
    },
    filaTextos: {
      flex: 1,
      gap: 2,
    },
    rolBoton: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: colors.borde,
    },
    rolBotonTexto: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.acento,
    },
    quitar: {
      padding: spacing.sm,
    },
    invitar: {
      gap: spacing.md,
    },
    chips: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
  });
