// ============================================================
// Veterinaria La Plata — Vet Schedule Screen (Calendario & Agenda)
// ============================================================
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, fonts, fontSizes, spacing } from '../../config/theme';
import { CalendarView } from '../../components/ui/CalendarView';
import { Appointment } from '../../types';

const MOCK_FULL_AGENDA: Appointment[] = [
  {
    id: 'app-1',
    petId: 'pet-1',
    petName: 'Luna',
    ownerId: 'client-001',
    ownerName: 'María González',
    type: 'vaccination',
    date: new Date(),
    timeSlot: '09:00 - 09:30',
    status: 'confirmed',
    notes: 'Vacuna Sextuple de refuerzo anual',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'app-2',
    petId: 'pet-2',
    petName: 'Max',
    ownerId: 'client-002',
    ownerName: 'Carlos Pérez',
    type: 'consultation',
    date: new Date(),
    timeSlot: '11:00 - 11:30',
    status: 'pending',
    notes: 'Control general por tos estacional',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'app-3',
    petId: 'pet-3',
    petName: 'Bella',
    ownerId: 'client-003',
    ownerName: 'Ana López',
    type: 'surgery',
    date: new Date(),
    timeSlot: '16:00 - 17:00',
    status: 'confirmed',
    notes: 'Limpieza dental programada',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

export const VetScheduleScreen: React.FC = () => {
  const [appointments, setAppointments] = useState<Appointment[]>(MOCK_FULL_AGENDA);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Agenda Médica Diaria 📅</Text>
        <Text style={styles.subtitle}>Gestión de Turnos y Consultas</Text>
      </View>

      <CalendarView
        appointments={appointments}
        onSelectAppointment={(app) => {
          // Can navigate or view details
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgMain },
  header: { padding: spacing.xl, paddingBottom: spacing.sm, paddingTop: spacing['2xl'] },
  title: { fontFamily: fonts.quicksand.bold, fontSize: fontSizes.xl, color: colors.textDark },
  subtitle: { fontFamily: fonts.nunito.regular, fontSize: fontSizes.sm, color: colors.textMuted, marginTop: spacing.xs },
});

export default VetScheduleScreen;
