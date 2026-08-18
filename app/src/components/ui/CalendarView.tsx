// ============================================================
// Veterinaria La Plata — Full Month Grid Calendar Component
// ============================================================
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, fonts, fontSizes, spacing, borderRadius, shadows } from '../../config/theme';
import { Card, Badge } from './index';
import { Appointment } from '../../types';

interface CalendarViewProps {
  appointments: Appointment[];
  onSelectAppointment?: (app: Appointment) => void;
  onNewAppointment?: () => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  appointments,
  onSelectAppointment,
  onNewAppointment,
}) => {
  const [currentMonthDate, setCurrentMonthDate] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const year = currentMonthDate.getFullYear();
  const month = currentMonthDate.getMonth();

  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];
  const dayHeaderNames = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

  // Calculate days for the month grid
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const totalDaysInMonth = lastDayOfMonth.getDate();

  // Get weekday of 1st day (0 = Sun, 1 = Mon... convert so Mon = 0)
  let startingDayOfWeek = firstDayOfMonth.getDay() - 1;
  if (startingDayOfWeek === -1) startingDayOfWeek = 6; // Sunday = 6

  // Generate grid matrix
  const gridCells: (Date | null)[] = [];
  for (let i = 0; i < startingDayOfWeek; i++) {
    gridCells.push(null); // Empty leading cells
  }
  for (let dayNum = 1; dayNum <= totalDaysInMonth; dayNum++) {
    gridCells.push(new Date(year, month, dayNum));
  }

  const isSameDay = (d1: Date, d2: Date) => {
    const date1 = new Date(d1);
    const date2 = new Date(d2);
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
    );
  };

  // Filter appointments for selected date
  const selectedDayAppointments = appointments.filter((app) =>
    isSameDay(app.date, selectedDate)
  );

  const prevMonth = () => {
    setCurrentMonthDate(new Date(year, month - 1, 1));
  };
  const nextMonth = () => {
    setCurrentMonthDate(new Date(year, month + 1, 1));
  };
  const goToday = () => {
    const today = new Date();
    setCurrentMonthDate(today);
    setSelectedDate(today);
  };

  return (
    <View style={styles.container}>
      {/* Month Navigation Header */}
      <View style={styles.header}>
        <Text style={styles.monthTitle}>
          {monthNames[month]} {year}
        </Text>
        <View style={styles.navControls}>
          <TouchableOpacity style={styles.navBtn} onPress={prevMonth}>
            <MaterialCommunityIcons name="chevron-left" size={24} color={colors.textDark} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.todayBtn} onPress={goToday}>
            <Text style={styles.todayText}>Hoy</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navBtn} onPress={nextMonth}>
            <MaterialCommunityIcons name="chevron-right" size={24} color={colors.textDark} />
          </TouchableOpacity>
        </View>
      </View>

      {/* FULL MONTH GRID CALENDAR */}
      <Card variant="elevated" style={styles.monthGridCard}>
        {/* Day Names Row Header */}
        <View style={styles.dayNamesRow}>
          {dayHeaderNames.map((d, i) => (
            <Text key={i} style={styles.dayHeaderCell}>
              {d}
            </Text>
          ))}
        </View>

        {/* Month Days Grid */}
        <View style={styles.gridContainer}>
          {gridCells.map((cellDate, idx) => {
            if (!cellDate) {
              return <View key={idx} style={styles.emptyGridCell} />;
            }

            const active = isSameDay(cellDate, selectedDate);
            const isToday = isSameDay(cellDate, new Date());
            const hasAppointments = appointments.some((a) => isSameDay(a.date, cellDate));

            return (
              <TouchableOpacity
                key={idx}
                style={[styles.gridCell, active && styles.gridCellActive]}
                onPress={() => setSelectedDate(cellDate)}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.cellNumText,
                    active && styles.cellNumTextActive,
                    isToday && styles.cellTodayNum,
                  ]}
                >
                  {cellDate.getDate()}
                </Text>

                {/* Event Dot Indicator */}
                {hasAppointments && (
                  <View style={[styles.eventDot, active && styles.eventDotActive]} />
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </Card>

      {/* Selected Day Schedule List */}
      <ScrollView contentContainerStyle={styles.scheduleList}>
        <View style={styles.listHeader}>
          <Text style={styles.listTitle}>
            Agenda del {selectedDate.getDate()} de {monthNames[selectedDate.getMonth()]} ({selectedDayAppointments.length})
          </Text>
          {onNewAppointment && (
            <TouchableOpacity onPress={onNewAppointment} style={styles.addBtn}>
              <MaterialCommunityIcons name="plus-circle" size={20} color={colors.primary} />
              <Text style={styles.addBtnText}>Nuevo Turno</Text>
            </TouchableOpacity>
          )}
        </View>

        {selectedDayAppointments.length === 0 ? (
          <Card variant="outlined" style={styles.emptyCard}>
            <MaterialCommunityIcons name="calendar-blank" size={36} color={colors.textLight} />
            <Text style={styles.emptyText}>No hay turnos agendados para esta fecha.</Text>
          </Card>
        ) : (
          selectedDayAppointments.map((app) => (
            <TouchableOpacity
              key={app.id}
              onPress={() => onSelectAppointment && onSelectAppointment(app)}
              activeOpacity={0.8}
            >
              <Card variant="elevated" style={styles.appCard}>
                <View style={styles.cardHeader}>
                  <View style={styles.timeBadge}>
                    <MaterialCommunityIcons name="clock-outline" size={16} color={colors.primaryDark} />
                    <Text style={styles.timeText}>{app.timeSlot}</Text>
                  </View>
                  <Badge
                    label={
                      app.status === 'confirmed'
                        ? 'Confirmado'
                        : app.status === 'completed'
                        ? 'Completado'
                        : 'Pendiente'
                    }
                    variant={
                      app.status === 'confirmed'
                        ? 'success'
                        : app.status === 'completed'
                        ? 'info'
                        : 'warning'
                    }
                  />
                </View>

                <View style={styles.detailsRow}>
                  <MaterialCommunityIcons name="paw" size={20} color={colors.primary} />
                  <Text style={styles.petName}>{app.petName}</Text>
                  {app.ownerName && (
                    <Text style={styles.ownerName} numberOfLines={1}>
                      • Dueño: {app.ownerName}
                    </Text>
                  )}
                </View>

                {app.notes ? (
                  <Text style={styles.notesText} numberOfLines={2}>
                    💬 {app.notes}
                  </Text>
                ) : null}
              </Card>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgMain },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  monthTitle: { fontFamily: fonts.quicksand.bold, fontSize: fontSizes.lg, color: colors.textDark },
  navControls: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  navBtn: { padding: spacing.xs, backgroundColor: colors.bgCard, borderRadius: borderRadius.sm },
  todayBtn: { paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, backgroundColor: colors.primarySoft, borderRadius: borderRadius.sm },
  todayText: { fontFamily: fonts.nunito.bold, fontSize: fontSizes.xs, color: colors.primaryDark },
  monthGridCard: { marginHorizontal: spacing.lg, padding: spacing.md, marginBottom: spacing.md },
  dayNamesRow: { flexDirection: 'row', justifyContent: 'space-around', paddingBottom: spacing.xs, borderBottomWidth: 1, borderBottomColor: colors.border },
  dayHeaderCell: { width: 38, textAlign: 'center', fontFamily: fonts.nunito.bold, fontSize: fontSizes.xs, color: colors.textMuted },
  gridContainer: { flexDirection: 'row', flexWrap: 'wrap', marginTop: spacing.xs },
  gridCell: {
    width: '14.28%',
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.md,
    marginVertical: 2,
  },
  emptyGridCell: { width: '14.28%', height: 42 },
  gridCellActive: { backgroundColor: colors.primary },
  cellNumText: { fontFamily: fonts.quicksand.bold, fontSize: fontSizes.sm, color: colors.textDark },
  cellNumTextActive: { color: colors.textWhite },
  cellTodayNum: { textDecorationLine: 'underline' },
  eventDot: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: colors.primary, marginTop: 2 },
  eventDotActive: { backgroundColor: colors.textWhite },
  scheduleList: { paddingHorizontal: spacing.lg, paddingBottom: spacing['3xl'] },
  listHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  listTitle: { fontFamily: fonts.quicksand.bold, fontSize: fontSizes.md, color: colors.textDark },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  addBtnText: { fontFamily: fonts.nunito.bold, fontSize: fontSizes.xs, color: colors.primary },
  emptyCard: { padding: spacing.lg, alignItems: 'center', justifyContent: 'center', gap: spacing.xs },
  emptyText: { fontFamily: fonts.nunito.regular, fontSize: fontSizes.sm, color: colors.textMuted, textAlign: 'center' },
  appCard: { marginBottom: spacing.sm, padding: spacing.md },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xs },
  timeBadge: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  timeText: { fontFamily: fonts.nunito.bold, fontSize: fontSizes.sm, color: colors.primaryDark },
  detailsRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginTop: spacing.xs },
  petName: { fontFamily: fonts.quicksand.bold, fontSize: fontSizes.md, color: colors.textDark },
  ownerName: { fontFamily: fonts.nunito.regular, fontSize: fontSizes.xs, color: colors.textMuted, flex: 1 },
  notesText: { fontFamily: fonts.nunito.regular, fontSize: fontSizes.xs, color: colors.textMuted, marginTop: spacing.xs },
});

export default CalendarView;
