// ============================================================
// Veterinaria La Plata — Vet Schedule Screen (Calendario & Agenda)
// ============================================================
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { colors, fonts, fontSizes, spacing } from '../../config/theme';
import { CalendarView } from '../../components/ui/CalendarView';
import { Appointment } from '../../types';
import { getAllAppointments } from '../../services/dataService';

export const VetScheduleScreen: React.FC = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const apps = await getAllAppointments();
        setAppointments(apps);
      } catch (error) {
        console.log('VetSchedule load error:', error);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Agenda Médica</Text>
        <Text style={styles.subtitle}>Turnos y consultas de todos los profesionales</Text>
      </View>

      {loading ? (
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <CalendarView appointments={appointments} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgMain },
  header: { padding: spacing.xl, paddingBottom: spacing.sm, paddingTop: spacing['2xl'] },
  title: { fontFamily: fonts.quicksand.bold, fontSize: fontSizes.xl, color: colors.textDark },
  subtitle: { fontFamily: fonts.nunito.regular, fontSize: fontSizes.sm, color: colors.textMuted, marginTop: spacing.xs },
  centerState: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});

export default VetScheduleScreen;
