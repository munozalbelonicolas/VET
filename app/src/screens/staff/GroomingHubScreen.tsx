// ============================================================
// Veterinaria La Plata — Grooming Hub Screen
// Turnos de grooming reales + guardado de registros de peluquería
// ============================================================
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, fonts, fontSizes, spacing, borderRadius } from '../../config/theme';
import { Card, Badge, Button, Input } from '../../components/ui';
import { Appointment, GroomingServiceType } from '../../types';
import { getAllAppointments, updateAppointment } from '../../services/dataService';
import { addGroomingRecord } from '../../services/staffService';
import { useAuthStore } from '../../store/authStore';

interface GroomingApp extends Appointment {
  localTime: string;
}

const formatTime = (date: Date): string =>
  date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

export const GroomingHubScreen: React.FC = () => {
  const { user } = useAuthStore();
  const [appointments, setAppointments] = useState<GroomingApp[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const all = await getAllAppointments();
      const grooming = all
        .filter((a) => a.type === 'grooming' && a.status !== 'cancelled')
        .map((a) => ({ ...a, localTime: formatTime(a.date) }))
        .sort((a, b) => a.date.getTime() - b.date.getTime());
      setAppointments(grooming);
    } catch (error) {
      console.log('loadData grooming error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleComplete = async () => {
    if (!selectedApp) return;
    if (!user?.id) {
      Alert.alert('Error', 'Sesión inválida. Volvé a iniciar sesión.');
      return;
    }
    const app = appointments.find((a) => a.id === selectedApp);
    if (!app) return;

    setSaving(true);
    try {
      await addGroomingRecord({
        petId: app.petId,
        petName: app.petName,
        groomerId: user.id,
        groomerName: user.name,
        date: new Date(),
        serviceType: 'bath_and_haircut' as GroomingServiceType,
        productsUsed: [],
        observations: notes.trim() || undefined,
      });

      await updateAppointment(app.id, { status: 'completed' });
      setSelectedApp(null);
      setNotes('');
      await loadData();
      Alert.alert('¡Completado! ✂️', `El servicio de ${app.petName} fue registrado.`);
    } catch (error) {
      console.log('Complete error:', error);
      Alert.alert('Error', 'No se pudo completar el servicio. Intentá de nuevo.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Estética & Peluquería</Text>
        <Text style={styles.subtitle}>Turnos de grooming del sistema</Text>
      </View>

      {loading ? (
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.list}>
          {appointments.length === 0 ? (
            <Card variant="outlined" style={styles.emptyCard}>
              <MaterialCommunityIcons name="content-cut" size={40} color={colors.textLight} />
              <Text style={styles.emptyText}>No hay turnos de peluquería registrados.</Text>
            </Card>
          ) : (
            appointments.map((app) => (
              <Card key={app.id} variant="elevated" style={styles.appCard}>
                <View style={styles.appHeader}>
                  <View style={styles.timeBlock}>
                    <MaterialCommunityIcons name="clock-outline" size={16} color={colors.primary} />
                    <Text style={styles.timeText}>{app.localTime}</Text>
                  </View>
                  <Badge
                    label={app.status === 'pending' ? 'Pendiente' : app.status === 'confirmed' ? 'Confirmado' : 'Completado'}
                    variant={app.status === 'pending' ? 'warning' : app.status === 'confirmed' ? 'primary' : 'success'}
                  />
                </View>

                <View style={styles.petInfo}>
                  <MaterialCommunityIcons
                    name="paw"
                    size={24}
                    color={colors.accent}
                  />
                  <View style={{ marginLeft: spacing.sm }}>
                    <Text style={styles.petName}>{app.petName}</Text>
                    <Text style={styles.ownerName}>Dueño: {app.ownerName}</Text>
                  </View>
                </View>

                {app.notes ? <Text style={styles.serviceText}>Nota: {app.notes}</Text> : null}

                {selectedApp === app.id ? (
                  <View style={styles.notesSection}>
                    <Input
                      label="Observaciones del servicio"
                      placeholder="Ej: Se usó shampoo hipoalergénico..."
                      value={notes}
                      onChangeText={setNotes}
                      multiline
                    />
                    <View style={styles.actions}>
                      <Button title="Guardar & Completar" size="sm" variant="primary" style={{ flex: 1, marginRight: spacing.sm }} onPress={handleComplete} loading={saving} />
                      <Button title="Cancelar" size="sm" variant="ghost" style={{ flex: 1 }} onPress={() => { setSelectedApp(null); setNotes(''); }} />
                    </View>
                  </View>
                ) : (
                  <Button
                    title={app.status === 'completed' ? 'Ver registro' : 'Registrar Servicio'}
                    size="sm"
                    variant="outline"
                    style={{ marginTop: spacing.md }}
                    onPress={() => {
                      setSelectedApp(app.id);
                      setNotes('');
                    }}
                    disabled={app.status === 'completed'}
                  />
                )}
              </Card>
            ))
          )}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgMain },
  header: { padding: spacing.xl, paddingBottom: spacing.md },
  title: { fontFamily: fonts.quicksand.bold, fontSize: fontSizes.xl, color: colors.textDark },
  subtitle: { fontFamily: fonts.nunito.regular, fontSize: fontSizes.md, color: colors.textMuted, marginTop: spacing.xs },
  centerState: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl },
  emptyCard: { alignItems: 'center', padding: spacing.xl, gap: spacing.sm },
  emptyText: { fontFamily: fonts.nunito.regular, fontSize: fontSizes.sm, color: colors.textMuted, textAlign: 'center' },
  appCard: { padding: spacing.lg, marginBottom: spacing.md },
  appHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  timeBlock: { flexDirection: 'row', alignItems: 'center' },
  timeText: { fontFamily: fonts.nunito.bold, fontSize: fontSizes.sm, color: colors.textDark, marginLeft: 4 },
  petInfo: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md },
  petName: { fontFamily: fonts.quicksand.bold, fontSize: fontSizes.lg, color: colors.textDark },
  ownerName: { fontFamily: fonts.nunito.regular, fontSize: fontSizes.sm, color: colors.textMuted },
  serviceText: { fontFamily: fonts.nunito.semiBold, fontSize: fontSizes.sm, color: colors.primaryDark, backgroundColor: colors.primarySoft, padding: spacing.sm, borderRadius: borderRadius.md, overflow: 'hidden' },
  notesSection: { marginTop: spacing.lg, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: spacing.md },
  actions: { flexDirection: 'row', marginTop: spacing.sm },
});

export default GroomingHubScreen;
