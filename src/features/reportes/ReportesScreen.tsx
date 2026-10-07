import Feather from '@expo/vector-icons/Feather';
import { useEffect, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { api } from '@/api/client';
import type { Evento, Periodo, ResumenRutina } from '@/api/types';
import { Chip } from '@/components/Chip';
import { EncabezadoPantalla } from '@/components/EncabezadoPantalla';
import { EstadoCarga } from '@/components/EstadoCarga';
import { DetalleAlertaSheet } from '@/features/eventos/DetalleAlertaSheet';
import { EventoCard } from '@/features/eventos/EventoCard';
import { primerNombre } from '@/features/eventos/formato';
import { esVisibleEnFeed } from '@/features/eventos/presentacion';
import { severidadDe } from '@/features/eventos/severidad';
import { useHogar, useRecargaManual } from '@/features/hogar/HogarProvider';
import { radius, spacing, useEstilos, useTema, type Tema } from '@/theme';

const PERIODOS: { valor: Periodo; label: string; titulo: string; eventos: string }[] = [
  { valor: 'hoy', label: 'Hoy', titulo: 'Rutina de hoy', eventos: 'Eventos de hoy' },
  { valor: 'semana', label: 'Semana', titulo: 'Rutina de la semana', eventos: 'Eventos de la semana' },
  { valor: 'mes', label: 'Mes', titulo: 'Rutina del mes', eventos: 'Eventos del mes' },
];

/** Inicio del período: hoy 00:00, hace 7 días o hace 30 días. */
function desde(periodo: Periodo): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  if (periodo === 'semana') d.setDate(d.getDate() - 6);
  if (periodo === 'mes') d.setDate(d.getDate() - 29);
  return d;
}

/**
 * Mockup 04 · Reportes (RF9): no muestra toda la actividad, sino dónde el residente se aparta
 * de SU propia rutina (la línea base de `baseline/`, RF6) + los eventos relevantes del período.
 */
export function ReportesScreen() {
  const { hogar, eventos, cargando, error, recargar, marcarResuelta } = useHogar();
  const { refrescando, onRefrescar } = useRecargaManual();
  const [periodo, setPeriodo] = useState<Periodo>('semana');
  const [seleccionado, setSeleccionado] = useState<Evento | null>(null);
  const { colors, typography } = useTema();
  const styles = useEstilos(crearEstilos);
  // El resultado se guarda junto con el período que lo pidió: si no coincide con el período
  // elegido, todavía está cargando (así no hace falta "resetear" estado al cambiar de chip).
  const [resultado, setResultado] = useState<{ periodo: Periodo; resumen?: ResumenRutina; error?: string }>();
  // RF13: eventos del período pedidos con `desde` al backend, no filtrados de los últimos 200
  // del home — un hogar con mucha actividad podía perder eventos viejos del mes en esa lista.
  const [eventosPeriodo, setEventosPeriodo] = useState<{ periodo: Periodo; eventos: Evento[] }>();

  const hogarId = hogar?.id;
  useEffect(() => {
    if (hogarId == null) return;
    let vigente = true;
    api
      .obtenerResumenRutina(hogarId, periodo)
      .then((resumen) => vigente && setResultado({ periodo, resumen }))
      .catch((e: Error) => vigente && setResultado({ periodo, error: e.message }));
    api
      .listarEventos(hogarId, { limit: 500, desde: desde(periodo).toISOString() })
      .then((nuevos) => vigente && setEventosPeriodo({ periodo, eventos: nuevos }))
      .catch(() => {});
    return () => {
      vigente = false;
    };
  }, [hogarId, periodo]);

  const actual = resultado?.periodo === periodo ? resultado : undefined;
  const resumen = actual?.resumen ?? null;
  const errorResumen = actual?.error ?? null;

  if (cargando || !hogar) {
    return <EstadoCarga cargando={cargando} error={error ?? 'Tu cuenta no tiene un hogar asociado.'} onReintentar={recargar} />;
  }

  const config = PERIODOS.find((p) => p.valor === periodo)!;
  const residente = primerNombre(hogar.residente.nombre);
  const eventosDelPeriodo = eventosPeriodo?.periodo === periodo ? eventosPeriodo.eventos : [];
  const delPeriodo = eventosDelPeriodo.filter((e) => esVisibleEnFeed(e) && severidadDe(e) !== 'rutina');

  return (
    <SafeAreaView style={styles.pantalla} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.contenido}
        refreshControl={
          <RefreshControl refreshing={refrescando} onRefresh={onRefrescar} tintColor={colors.acento} />
        }>
        <EncabezadoPantalla sobretitulo={hogar.residente.nombre} titulo="Reportes" residente={hogar.residente.nombre} />

        <View style={styles.chips}>
          {PERIODOS.map((p) => (
            <Chip key={p.valor} label={p.label} activo={periodo === p.valor} onPress={() => setPeriodo(p.valor)} />
          ))}
        </View>

        <View style={styles.card}>
          <Text style={typography.subtitulo}>{config.titulo}</Text>
          <Text style={typography.secundario}>Comparado con lo habitual de {residente}</Text>
          {!resumen && !errorResumen && <ActivityIndicator color={colors.acento} style={styles.cargando} />}
          {errorResumen && <Text style={[typography.secundario, styles.aviso]}>{errorResumen}</Text>}
          {resumen && resumen.indicadores.length === 0 && (
            // Hogar recién vinculado: la línea base (RF6) necesita algunos días de datos.
            <Text style={[typography.secundario, styles.aprendiendo]}>
              Lares está aprendiendo la rutina de {residente}. En los primeros días vas a ver acá
              cuándo se levanta, come o descansa comparado con lo habitual.
            </Text>
          )}
          {resumen?.indicadores.map((ind) => {
            const ok = ind.estado === 'ok';
            return (
              <View key={ind.clave} style={styles.indicador}>
                <View style={[styles.icono, { backgroundColor: ok ? colors.rutinaSuave : colors.moderadaSuave }]}>
                  <Feather
                    name={ok ? 'check' : 'alert-triangle'}
                    size={20}
                    color={ok ? colors.rutinaTexto : colors.moderadaTexto}
                  />
                </View>
                <View style={styles.indicadorTextos}>
                  <Text style={typography.cuerpoFuerte}>{ind.titulo}</Text>
                  <Text style={typography.secundario}>
                    {ind.valor} · {ind.habitual}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>

        <View style={styles.seccion}>
          <Text style={typography.seccion}>{config.eventos}</Text>
          {delPeriodo.length > 0 ? (
            delPeriodo.map((e) => (
              <EventoCard key={e.id} evento={e} residente={residente} onPress={setSeleccionado} />
            ))
          ) : (
            <View style={styles.sinDesvios}>
              <Feather name="check" size={20} color={colors.rutinaTexto} />
              <Text style={typography.cuerpoFuerte}>Sin alertas ni desvíos en el período</Text>
            </View>
          )}
        </View>
      </ScrollView>

      <DetalleAlertaSheet
        evento={seleccionado}
        eventos={eventos}
        hogar={hogar}
        onCerrar={() => setSeleccionado(null)}
        onResolver={(e) => marcarResuelta(e.id)}
      />
    </SafeAreaView>
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
    flexDirection: 'row',
    gap: spacing.sm,
  },
  card: {
    backgroundColor: colors.superficie,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borde,
    padding: spacing.xl,
    gap: spacing.xs,
  },
  cargando: {
    marginVertical: spacing.xl,
  },
  aviso: {
    marginTop: spacing.md,
    color: colors.moderadaTexto,
  },
  aprendiendo: {
    marginTop: spacing.md,
    lineHeight: 20,
  },
  indicador: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    marginTop: spacing.lg,
  },
  icono: {
    width: 44,
    height: 44,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  indicadorTextos: {
    flex: 1,
    gap: 2,
  },
  seccion: {
    gap: spacing.md,
  },
  sinDesvios: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    backgroundColor: colors.superficie,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borde,
    borderLeftWidth: 4,
    borderLeftColor: colors.rutina,
  },
});
