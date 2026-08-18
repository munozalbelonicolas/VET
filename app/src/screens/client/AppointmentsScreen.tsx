// ============================================================
// Veterinaria La Plata — Appointments Booking & List Screen
// ============================================================
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  Platform,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, fonts, fontSizes, spacing, borderRadius } from '../../config/theme';
import { Card, Badge, Button, Input } from '../../components/ui';
import { CalendarView } from '../../components/ui/CalendarView';
import { Appointment, AppointmentType, TimeSlot, Pet } from '../../types';
import { getAppointmentsByOwner, createAppointment, getPetsByOwner } from '../../services/dataService';
import { sendSystemNotification, createInAppNotification } from '../../services/notificationService';
import { useAuthStore } from '../../store/authStore';

const SERVICE_OPTIONS: { id: AppointmentType; label: string }[] = [
  { id: 'general', label: '🩺 General' },
  { id: 'vaccination', label: '💉 Vacuna' },
  { id: 'grooming', label: '✂️ Peluquería' },
  { id: 'emergency', label: '🚨 Urgencia' },
  { id: 'castration', label: '🏥 Castración' },
];

const typeLabel = (type: AppointmentType): string => {
  switch (type) {
    case 'vaccination': return '💉 Vacunación';
    case 'grooming': return '✂️ Peluquería';
    case 'emergency': return '🚨 Urgencia';
    case 'castration': return '🏥 Castración';
    default: return '🩺 Consulta General';
  }
};

export const AppointmentsScreen: React.FC = () => {
  const { user } = useAuthStore();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');

  // New appointment form state
  const [selectedPet, setSelectedPet] = useState<Pet | null>(null);
  const [type, setType] = useState<AppointmentType>('general');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date(Date.now() + 86400000));
  const [showDatePicker, setShowDatePicker] = useState(Platform.OS === 'ios');
  const [timeSlot, setTimeSlot] = useState<TimeSlot>('morning');
  const [notes, setNotes] = useState('');
  const [bookingLoading, setBookingLoading] = useState(false);

  const loadData = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [apps, userPets] = await Promise.all([
        getAppointmentsByOwner(user.id),
        getPetsByOwner(user.id),
      ]);
      setAppointments(apps);
      setPets(userPets);
      if (userPets.length > 0) {
        setSelectedPet((current) => current ?? userPets[0]);
      }
    } catch (error) {
      console.log('loadData error:', error);
      Alert.alert('Error', 'No se pudieron cargar tus turnos. Verificá tu conexión.');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleBookAppointment = async () => {
    if (!user?.id) {
      Alert.alert('Error', 'Debés iniciar sesión para reservar un turno');
      return;
    }
    if (!selectedPet) {
      Alert.alert('Error', 'Debés seleccionar o registrar una mascota');
      return;
    }

    setBookingLoading(true);
    try {
      const newApp = await createAppointment({
        petId: selectedPet.id,
        petName: selectedPet.name,
        ownerId: user.id,
        ownerName: user.name,
        type,
        date: selectedDate,
        timeSlot,
        status: 'pending',
        notes,
      });

      setAppointments((current) => [newApp, ...current]);
      setModalVisible(false);

      // Notificaciones no bloqueantes: no deben fallar el booking si no hay permisos
      try {
        await Promise.all([
          sendSystemNotification({
            title: '📅 ¡Turno Solicitado!',
            body: `Tu turno para ${selectedPet.name} fue solicitado. Te confirmamos a la brevedad.`,
            data: { appointmentId: newApp.id },
          }),
          createInAppNotification({
            userId: user.id,
            type: 'appointment_confirmation',
            title: 'Turno solicitado',
            body: `Solicitaste un turno para ${selectedPet.name} el ${selectedDate.toLocaleDateString('es-AR')}.`,
            data: { appointmentId: newApp.id },
          }),
        ]);
      } catch (notifError) {
        console.log('Notification error (non blocking):', notifError);
      }

      Alert.alert('¡Turno Solicitado! ❤️', `Recibimos tu solicitud para ${selectedPet.name}. Te confirmaremos el turno por avisos.`);
    } catch (error) {
      Alert.alert('Error', 'No se pudo reservar el turno. Intentá de nuevo.');
    } finally {
      setBookingLoading(false);
    }
  };

  const renderAppointment = ({ item }: { item: Appointment }) => (
    <Card variant="elevated" style={styles.appCard}>
      <View style={styles.cardHeader}>
        <View style={styles.petBadge}>
          <MaterialCommunityIcons name="paw" size={16} color={colors.primaryDark} />
          <Text style={styles.petBadgeText}>{item.petName}</Text>
        </View>
        <Badge
          label={
            item.status === 'confirmed' ? 'Confirmado ✓' :
            item.status === 'completed' ? 'Completado' :
            item.status === 'cancelled' ? 'Cancelado' : 'Pendiente'
          }
          variant={
            item.status === 'confirmed' ? 'success' :
            item.status === 'completed' ? 'info' :
            item.status === 'cancelled' ? 'danger' : 'warning'
          }
        />
      </View>

      <Text style={styles.serviceType}>{typeLabel(item.type)}</Text>

      <View style={styles.infoRow}>
        <MaterialCommunityIcons name="clock-outline" size={18} color={colors.textMuted} />
        <Text style={styles.infoText}>
          {new Date(item.date).toLocaleDateString('es-AR')} • {item.timeSlot === 'morning' ? 'Mañana (09:00 - 12:00)' : 'Tarde (16:00 - 19:00)'}
        </Text>
      </View>

      {item.notes ? (
        <Text style={styles.notes}>Nota: {item.notes}</Text>
      ) : null}
    </Card>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title} numberOfLines={1}>Mis Turnos</Text>
        <Button
          title="Nuevo turno"
          onPress={() => setModalVisible(true)}
          variant="accent"
          size="sm"
          icon={<MaterialCommunityIcons name="plus" size={16} color="#FFF" />}
        />
      </View>

      {/* View Mode Selector Tabs */}
      <View style={styles.viewTabs}>
        <TouchableOpacity
          style={[styles.viewTab, viewMode === 'calendar' && styles.viewTabActive]}
          onPress={() => setViewMode('calendar')}
        >
          <MaterialCommunityIcons
            name="calendar-month"
            size={18}
            color={viewMode === 'calendar' ? colors.primaryDark : colors.textMuted}
          />
          <Text style={[styles.viewTabText, viewMode === 'calendar' && styles.viewTabTextActive]}>
            Calendario & Salud
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.viewTab, viewMode === 'list' && styles.viewTabActive]}
          onPress={() => setViewMode('list')}
        >
          <MaterialCommunityIcons
            name="format-list-bulleted"
            size={18}
            color={viewMode === 'list' ? colors.primaryDark : colors.textMuted}
          />
          <Text style={[styles.viewTabText, viewMode === 'list' && styles.viewTabTextActive]}>
            Historial ({appointments.length})
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : viewMode === 'calendar' ? (
        <CalendarView
          appointments={appointments}
          onNewAppointment={() => setModalVisible(true)}
        />
      ) : (
        <FlatList
          data={appointments}
          keyExtractor={(item) => item.id}
          renderItem={renderAppointment}
          contentContainerStyle={styles.content}
          ListEmptyComponent={
            <Card variant="elevated" style={styles.emptyCard}>
              <MaterialCommunityIcons name="calendar-blank" size={60} color={colors.primary} />
              <Text style={styles.emptyTitle}>No tenés turnos agendados</Text>
              <Text style={styles.emptyDesc}>Agendá una consulta médica, vacunación o peluquería para tu mascota.</Text>
              <Button
                title="Pedir mi primer turno"
                onPress={() => setModalVisible(true)}
                variant="primary"
                size="md"
                style={{ marginTop: spacing.lg }}
              />
            </Card>
          }
        />
      )}

      {/* Booking Modal */}
      <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Agendar Turno</Text>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <MaterialCommunityIcons name="close" size={24} color={colors.textDark} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.modalContent}>
            {/* Pet selector */}
            <Text style={styles.label}>Seleccionar Mascota</Text>
            {pets.length === 0 ? (
              <Text style={styles.noPetsText}>
                No tenés mascotas registradas. Agregalas desde Inicio.
              </Text>
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.petScroll}>
                {pets.map((p) => (
                  <TouchableOpacity
                    key={p.id}
                    style={[styles.petCardSelect, selectedPet?.id === p.id && styles.petCardSelectActive]}
                    onPress={() => setSelectedPet(p)}
                  >
                    <MaterialCommunityIcons name={p.species === 'dog' ? 'dog' : 'cat'} size={24} color={selectedPet?.id === p.id ? colors.primaryDark : colors.textMuted} />
                    <Text style={[styles.petSelectName, selectedPet?.id === p.id && styles.petSelectNameActive]}>{p.name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}

            {/* Service Type */}
            <Text style={styles.label}>Tipo de Servicio</Text>
            <View style={styles.servicesGrid}>
              {SERVICE_OPTIONS.map((s) => (
                <TouchableOpacity
                  key={s.id}
                  style={[styles.serviceOption, type === s.id && styles.serviceOptionActive]}
                  onPress={() => setType(s.id)}
                >
                  <Text style={[styles.serviceOptionText, type === s.id && styles.serviceOptionTextActive]}>{s.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Date Selector */}
            <Text style={styles.label}>Seleccionar Fecha del Turno</Text>
            {Platform.OS === 'android' && (
              <Button
                title={selectedDate.toLocaleDateString('es-AR')}
                onPress={() => setShowDatePicker(true)}
                variant="outline"
                style={{ marginBottom: spacing.md }}
                icon={<MaterialCommunityIcons name="calendar" size={18} color={colors.primary} />}
              />
            )}
            {showDatePicker && (
              <View style={Platform.OS === 'ios' ? styles.iosDatePickerContainer : {}}>
                <DateTimePicker
                  value={selectedDate}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'inline' : 'default'}
                  minimumDate={new Date()}
                  onChange={(event, date) => {
                    if (Platform.OS === 'android') {
                      setShowDatePicker(false);
                    }
                    if (date) setSelectedDate(date);
                  }}
                  themeVariant="light"
                />
              </View>
            )}

            {/* Time Slot */}
            <Text style={styles.label}>Horario de Preferencia</Text>
            <View style={styles.slotRow}>
              <TouchableOpacity
                style={[styles.slotCard, timeSlot === 'morning' && styles.slotCardActive]}
                onPress={() => setTimeSlot('morning')}
              >
                <Text style={[styles.slotText, timeSlot === 'morning' && styles.slotTextActive]}>Mañana (09 - 12 hs)</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.slotCard, timeSlot === 'afternoon' && styles.slotCardActive]}
                onPress={() => setTimeSlot('afternoon')}
              >
                <Text style={[styles.slotText, timeSlot === 'afternoon' && styles.slotTextActive]}>Tarde (16 - 19 hs)</Text>
              </TouchableOpacity>
            </View>

            <Input
              label="Motivo o síntomas (Opcional)"
              placeholder="Ej: Control de rutina, estornudos..."
              value={notes}
              onChangeText={setNotes}
              multiline
            />

            <Button
              title="Confirmar Turno ❤️"
              onPress={handleBookAppointment}
              loading={bookingLoading}
              variant="accent"
              size="lg"
              fullWidth
              style={{ marginTop: spacing.md }}
            />
          </ScrollView>
        </View>
      </Modal>
      {/* Floating Action Button for New Appointment */}
      <TouchableOpacity
        style={styles.fabNewAppointment}
        onPress={() => setModalVisible(true)}
        activeOpacity={0.85}
      >
        <MaterialCommunityIcons name="plus-circle" size={22} color="#FFF" />
        <Text style={styles.fabText}>Nuevo turno</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgMain },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  title: { flex: 1, marginRight: spacing.sm, fontFamily: fonts.quicksand.bold, fontSize: fontSizes['2xl'], color: colors.textDark, letterSpacing: 0.4 },
  fabNewAppointment: {
    position: 'absolute',
    bottom: 24,
    right: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.accent,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 2,
    borderRadius: 30,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    zIndex: 999,
  },
  fabText: {
    color: '#FFF',
    fontFamily: fonts.nunito.bold,
    fontSize: fontSizes.sm,
    marginLeft: 6,
  },
  content: { paddingHorizontal: spacing.lg, paddingBottom: 120, flexGrow: 1 },
  centerState: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyCard: { alignItems: 'center', padding: spacing['2xl'], marginTop: spacing.xl },
  emptyTitle: { fontFamily: fonts.quicksand.bold, fontSize: fontSizes.xl, color: colors.textDark, marginTop: spacing.md },
  emptyDesc: { fontFamily: fonts.nunito.regular, fontSize: fontSizes.md, color: colors.textMuted, textAlign: 'center', marginTop: spacing.xs },
  appCard: { marginBottom: spacing.md, padding: spacing.lg },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  petBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.primarySoft, paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: 12 },
  petBadgeText: { fontFamily: fonts.nunito.bold, fontSize: fontSizes.xs, color: colors.primaryDark, marginLeft: 4 },
  serviceType: { fontFamily: fonts.quicksand.bold, fontSize: fontSizes.lg, color: colors.textDark, marginVertical: spacing.sm },
  infoRow: { flexDirection: 'row', alignItems: 'center' },
  infoText: { fontFamily: fonts.nunito.regular, fontSize: fontSizes.sm, color: colors.textMuted, marginLeft: spacing.xs },
  notes: { fontFamily: fonts.nunito.regular, fontSize: fontSizes.xs, color: colors.textMuted, marginTop: spacing.xs, fontStyle: 'italic' },
  noPetsText: { fontFamily: fonts.nunito.regular, fontSize: fontSizes.sm, color: colors.textMuted, marginBottom: spacing.md },
  modalContainer: { flex: 1, backgroundColor: colors.bgMain, paddingTop: spacing.xl },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.xl, paddingBottom: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  modalTitle: { fontFamily: fonts.quicksand.bold, fontSize: fontSizes.xl, color: colors.textDark },
  modalContent: { padding: spacing.xl },
  label: { fontFamily: fonts.nunito.semiBold, fontSize: fontSizes.sm, color: colors.textDark, marginBottom: spacing.xs, marginTop: spacing.sm },
  petScroll: { flexGrow: 0, marginBottom: spacing.md },
  petCardSelect: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: 12, borderWidth: 1, borderColor: colors.border, marginRight: spacing.sm, backgroundColor: colors.bgCard },
  petCardSelectActive: { backgroundColor: colors.primarySoft, borderColor: colors.primary },
  petSelectName: { fontFamily: fonts.nunito.bold, fontSize: fontSizes.sm, color: colors.textMuted, marginLeft: spacing.xs },
  petSelectNameActive: { color: colors.primaryDark },
  servicesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md },
  serviceOption: { width: '48%', paddingVertical: spacing.md, alignItems: 'center', borderRadius: 12, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.bgCard },
  serviceOptionActive: { backgroundColor: colors.accentSoft, borderColor: colors.accent },
  serviceOptionText: { fontFamily: fonts.nunito.bold, fontSize: fontSizes.sm, color: colors.textDark },
  serviceOptionTextActive: { color: colors.accentDark },
  iosDatePickerContainer: { backgroundColor: '#FFF', borderRadius: 12, padding: spacing.sm, marginBottom: spacing.lg, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  slotRow: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.lg },
  slotCard: { flex: 1, paddingVertical: spacing.md, alignItems: 'center', borderRadius: 12, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.bgCard },
  slotCardActive: { backgroundColor: colors.primarySoft, borderColor: colors.primary },
  slotText: { fontFamily: fonts.nunito.semiBold, fontSize: fontSizes.xs, color: colors.textMuted },
  slotTextActive: { color: colors.primaryDark, fontFamily: fonts.nunito.bold },
  viewTabs: { flexDirection: 'row', paddingHorizontal: spacing.lg, marginBottom: spacing.sm, gap: spacing.sm },
  viewTab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.xs, paddingVertical: spacing.xs, paddingHorizontal: spacing.sm, borderRadius: borderRadius.full, backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border },
  viewTabActive: { backgroundColor: colors.primarySoft, borderColor: colors.primary },
  viewTabText: { fontFamily: fonts.nunito.semiBold, fontSize: fontSizes.xs, color: colors.textMuted },
  viewTabTextActive: { fontFamily: fonts.nunito.bold, color: colors.primaryDark },
});

export default AppointmentsScreen;
