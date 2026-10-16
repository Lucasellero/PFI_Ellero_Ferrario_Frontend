import Feather from '@expo/vector-icons/Feather';
import { router, useLocalSearchParams } from 'expo-router';
import { useState, type ReactNode } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { Evento } from '@/api/types';
import { Chip } from '@/components/Chip';
import { EncabezadoPantalla } from '@/components/EncabezadoPantalla';
import { EstadoCarga } from '@/components/EstadoCarga';
import { DetalleAlertaSheet } from '@/features/eventos/DetalleAlertaSheet';
import { EventoCard } from '@/features/eventos/EventoCard';
import { fechaLarga, mismoDia, primerNombre } from '@/features/eventos/formato';
import { esVisibleEnFeed } from '@/features/eventos/presentacion';
import { coloresSeveridad, requiereAtencion, severidadDe, type Severidad } from '@/features/eventos/severidad';
import { useHogar, useRecargaManual } from '@/features/hogar/HogarProvider';
import { spacing, useEstilos, useTema, type Tema } from '@/theme';

import { EstadoDelDia } from './EstadoDelDia';

type Filtro = 'todas' | Severidad;

const FILTROS: { valor: Filtro; label: string }[] = [
  { valor: 'todas', label: 'Todas' },
  { valor: 'urgente', label: 'Urgentes' },
  { valor: 'moderada', label: 'Moderadas' },
  { valor: 'rutina', label: 'Rutina' },
];

/** Cuántos eventos de días anteriores mostrar en el home (el historial completo va en Reportes). */
const MAX_ANTERIORES = 15;

/** Mockups 02 (con alertas) y 05 (día en orden) · Home de la app. */
export function NotificacionesScreen() {
  const { perfil, hogar, eventos, cargando, error, recargar, marcarResuelta } = useHogar();
  const { refrescando, onRefrescar } = useRecargaManual();
  const [filtro, setFiltro] = useState<Filtro>('todas');
  const [seleccionado, setSeleccionado] = useState<Evento | null>(null);
  // Alerta que tocó en una notificación push (`features/push/usePush.ts`). Se muestra apenas el
  // evento está en la lista: si la app recién abre, al terminar de cargar.
  const { alerta, hogar: hogarDeLaPush } = useLocalSearchParams<{ alerta?: string; hogar?: string }>();
  const { colors } = useTema();
  const styles = useEstilos(crearEstilos);

  if (cargando || (error && !hogar) || !perfil || !hogar) {
    return <EstadoCarga cargando={cargando} error={error ?? 'Tu cuenta no tiene un hogar asociado.'} onReintentar={recargar} />;
  }

  const ahora = new Date();
  const residente = primerNombre(hogar.residente.nombre);
  const visibles = eventos.filter(esVisibleEnFeed);
  const pasaFiltro = (e: Evento) => filtro === 'todas' || severidadDe(e) === filtro;

  const pendientes = visibles.filter(requiereAtencion);
  const fijadas = pendientes.filter(pasaFiltro);
  const resto = visibles.filter((e) => !requiereAtencion(e) && pasaFiltro(e));
  const deHoy = resto.filter((e) => mismoDia(new Date(e.occurred_at), ahora));
  const anteriores = resto.filter((e) => !mismoDia(new Date(e.occurred_at), ahora)).slice(0, MAX_ANTERIORES);
  const ultimaSenal = eventos[0] ? new Date(eventos[0].occurred_at) : null;

  const deLaPush = alerta && hogarDeLaPush === String(hogar.id)
    ? eventos.find((e) => String(e.id) === alerta) ?? null
    : null;
  const cerrarDetalle = () => {
    setSeleccionado(null);
    if (alerta) router.setParams({ alerta: undefined, hogar: undefined });
  };

  const tarjeta = (e: Evento) => (
    <EventoCard key={e.id} evento={e} residente={residente} onPress={setSeleccionado} />
  );

  return (
    <SafeAreaView style={styles.pantalla} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.contenido}
        refreshControl={
          <RefreshControl refreshing={refrescando} onRefresh={onRefrescar} tintColor={colors.acento} />
        }>
        <EncabezadoPantalla
          sobretitulo={fechaLarga(ahora)}
          titulo={`Hola, ${primerNombre(perfil.familiar.nombre)}`}
          residente={hogar.residente.nombre}
        />

        <EstadoDelDia pendientes={pendientes.length} residente={residente} ultimaSenal={ultimaSenal} />

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          {FILTROS.map((f) => (
            <Chip
              key={f.valor}
              label={f.label}
              colorPunto={f.valor === 'todas' ? undefined : coloresSeveridad(f.valor, colors).fuerte}
              activo={filtro === f.valor}
              onPress={() => setFiltro(f.valor)}
            />
          ))}
        </ScrollView>

        {fijadas.length > 0 ? (
          <Seccion titulo="Fijado hasta ser atendido" icono="map-pin" color={colors.urgenteTexto}>
            {fijadas.map(tarjeta)}
          </Seccion>
        ) : (
          filtro !== 'rutina' && <SinAlertas residente={residente} />
        )}

        {deHoy.length > 0 && <Seccion titulo={filtro === 'rutina' ? 'Hoy · rutina' : 'Hoy'}>{deHoy.map(tarjeta)}</Seccion>}
        {anteriores.length > 0 && <Seccion titulo="Días anteriores">{anteriores.map(tarjeta)}</Seccion>}
      </ScrollView>

      <DetalleAlertaSheet
        evento={seleccionado ?? deLaPush}
        eventos={eventos}
        hogar={hogar}
        onCerrar={cerrarDetalle}
        onResolver={(e) => marcarResuelta(e.id)}
      />
    </SafeAreaView>
  );
}

function Seccion({
  titulo,
  icono,
  color,
  children,
}: {
  titulo: string;
  icono?: 'map-pin';
  color?: string;
  children: ReactNode;
}) {
  const { typography } = useTema();
  const styles = useEstilos(crearEstilos);
  return (
    <View style={styles.seccion}>
      <View style={styles.seccionTitulo}>
        {icono && <Feather name={icono} size={12} color={color} />}
        <Text style={[typography.seccion, color ? { color } : null]}>{titulo}</Text>
      </View>
      {children}
    </View>
  );
}

/** Estado sin alertas del mockup 05: calma, no vacío. */
function SinAlertas({ residente }: { residente: string }) {
  const { colors, typography } = useTema();
  const styles = useEstilos(crearEstilos);
  return (
    <View style={styles.sinAlertas}>
      <View style={styles.corazon}>
        <Feather name="heart" size={40} color={colors.acento} />
      </View>
      <Text style={typography.subtitulo}>Sin alertas por ahora</Text>
      <Text style={[typography.secundario, styles.centrado]}>
        {residente} está siguiendo su rutina de siempre.{'\n'}Te avisamos en el momento en que algo cambie.
      </Text>
    </View>
  );
}

const crearEstilos = ({ colors }: Tema) => StyleSheet.create({
  pantalla: {
    flex: 1,
    backgroundColor: colors.fondo,
  },
  contenido: {
    padding: spacing.xl,
    gap: spacing.xl,
  },
  chips: {
    gap: spacing.sm,
  },
  seccion: {
    gap: spacing.md,
  },
  seccionTitulo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  sinAlertas: {
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.xl,
  },
  corazon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.primarioSuave,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  centrado: {
    textAlign: 'center',
    lineHeight: 22,
  },
});
