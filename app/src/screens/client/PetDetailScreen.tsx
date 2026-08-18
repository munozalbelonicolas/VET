// ============================================================
// Veterinaria La Plata — Pet Detail Screen
// Muestra historial médico, próximos controles y peluquería reales
// ============================================================
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, fonts, fontSizes, spacing } from '../../config/theme';
import { Card, Badge, Button } from '../../components/ui';
import { Pet, MedicalRecord, GroomingRecord, TimelineEvent, Prescription } from '../../types';
import { getPetTimeline, getPrescriptionsByPet } from '../../services/staffService';
import PrescriptionView from '../../components/clinic/PrescriptionView';

interface PetDetailScreenProps {
  pet: Pet;
  onBack: () => void;
  onBookAppointment: () => void;
}

const medicalTypeLabel: Record<string, string> = {
  consultation: '🩺 Consulta General',
  vaccination: '💉 Vacunación',
  study: '🔬 Estudio',
  surgery: '🏥 Cirugía',
  deworming: '🪱 Desparasitación',
};

const groomingTypeLabel: Record<string, string> = {
  bath: '🛁 Baño',
  haircut: '✂️ Corte',
  bath_and_haircut: '🛁✂️ Baño + Corte',
  detangling: '🔗 Deslanado',
  skin_treatment: '🧴 Tratamiento de piel',
  nail_trim: '💅 Corte de uñas',
  ear_cleaning: '👂 Limpieza de oídos',
};

export const PetDetailScreen: React.FC<PetDetailScreenProps> = ({
  pet,
  onBack,
  onBookAppointment,
}) => {
  const [activeTab, setActiveTab] = useState<'clinical' | 'calendar' | 'grooming' | 'recipes'>('clinical');
  const [medicalRecords, setMedicalRecords] = useState<MedicalRecord[]>([]);
  const [groomingRecords, setGroomingRecords] = useState<GroomingRecord[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [viewingPrescription, setViewingPrescription] = useState<Prescription | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const [timeline, rx] = await Promise.all([getPetTimeline(pet.id, 40), getPrescriptionsByPet(pet.id)]);
        if (mounted) {
          setMedicalRecords(timeline.filter((e) => e.kind === 'medical').map((e) => e.data as MedicalRecord));
          setGroomingRecords(timeline.filter((e) => e.kind === 'grooming').map((e) => e.data as GroomingRecord));
          setPrescriptions(rx);
        }
      } catch (error) {
        console.log('Error loading pet records:', error);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [pet.id]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bgMain }}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.textDark} />
          <Text style={styles.backText}>Volver a mis mascotas</Text>
        </TouchableOpacity>

        {/* Pet Header Card */}
        <Card variant="elevated" style={styles.headerCard}>
          <View style={styles.petAvatar}>
            {pet.avatarUrl ? (
              <Image source={{ uri: pet.avatarUrl }} style={{ width: 80, height: 80, borderRadius: 40 }} />
            ) : (
              <MaterialCommunityIcons
                name={pet.species === 'dog' ? 'dog' : 'cat'}
                size={48}
                color={pet.species === 'dog' ? colors.primary : colors.accent}
              />
            )}
          </View>
          <Text style={styles.petName}>{pet.name}</Text>
          <Text style={styles.petBreed}>
            {pet.breed} • {pet.sex === 'female' ? 'Hembra ♀' : 'Macho ♂'}
            {pet.ageYears !== undefined || pet.ageMonths !== undefined
              ? ` • ${pet.ageYears ? `${pet.ageYears} a` : ''} ${pet.ageMonths ? `${pet.ageMonths} m` : ''}`.trim()
              : ''}
          </Text>

          <View style={styles.badgeRow}>
            <Badge
              label={pet.healthStatus === 'green' ? 'Saludable ✓' : 'Atención ⚠️'}
              variant={pet.healthStatus === 'green' ? 'success' : 'warning'}
              size="md"
            />
            <Badge label={`${pet.currentWeight ?? 0} kg`} variant="primary" size="md" />
          </View>
        </Card>

        {/* Quick Action Book Appointment */}
        <Button
          title={`Pedir turno para ${pet.name}`}
          onPress={onBookAppointment}
          variant="accent"
          size="lg"
          fullWidth
          icon={<MaterialCommunityIcons name="calendar-plus" size={20} color="#FFF" />}
          style={{ marginBottom: spacing.xl }}
        />

        {/* Navigation Tabs */}
        <View style={styles.tabsContainer}>
          {(['clinical', 'calendar', 'grooming', 'recipes'] as const).map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, activeTab === tab && styles.tabActive]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                {tab === 'clinical' ? 'Historial' : tab === 'calendar' ? 'Controles' : tab === 'grooming' ? 'Peluquería' : 'Recetas'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Tab Content */}
        {loading ? (
          <View style={styles.loadingState}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : activeTab === 'clinical' ? (
          <View style={styles.tabContent}>
            {medicalRecords.length === 0 ? (
              <Card variant="outlined" style={styles.emptyCard}>
                <MaterialCommunityIcons name="clipboard-text-outline" size={40} color={colors.textLight} />
                <Text style={styles.emptyText}>Sin registros médicos todavía.</Text>
              </Card>
            ) : (
              medicalRecords.map((r) => (
                <Card key={r.id} variant="outlined" style={styles.historyCard}>
                  <View style={styles.historyHeader}>
                    <Badge label={medicalTypeLabel[r.type] || r.type} variant="primary" />
                    <Text style={styles.historyDate}>
                      {new Date(r.date).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </Text>
                  </View>
                  <Text style={styles.historyDoctor}>Atendido por {r.vetName}</Text>
                  {r.diagnosis ? <Text style={styles.historyNotes}>🔎 {r.diagnosis}</Text> : null}
                  {r.treatment ? <Text style={styles.historyNotes}>💊 {r.treatment}</Text> : null}
                  {r.observations ? <Text style={styles.historyNotes}>{r.observations}</Text> : null}
                </Card>
              ))
            )}
          </View>
        ) : activeTab === 'calendar' ? (
          <View style={styles.tabContent}>
            {medicalRecords.filter((r) => r.nextDoseDate).length === 0 ? (
              <Card variant="outlined" style={styles.emptyCard}>
                <MaterialCommunityIcons name="calendar-blank" size={40} color={colors.textLight} />
                <Text style={styles.emptyText}>No hay próximos controles registrados.</Text>
              </Card>
            ) : (
              medicalRecords
                .filter((r) => r.nextDoseDate)
                .map((r) => (
                  <Card key={r.id} variant="elevated" style={styles.eventCard}>
                    <MaterialCommunityIcons name="needle" size={24} color={colors.primary} />
                    <View style={{ flex: 1, marginLeft: spacing.md }}>
                      <Text style={styles.eventTitle}>{r.treatment || 'Próximo control'}</Text>
                      <Text style={styles.eventDate}>
                        Fecha estimada: {new Date(r.nextDoseDate!).toLocaleDateString('es-AR')}
                      </Text>
                    </View>
                  </Card>
                ))
            )}
          </View>
        ) : activeTab === 'recipes' ? (
          <View style={styles.tabContent}>
            {prescriptions.length === 0 ? (
              <Card variant="outlined" style={styles.emptyCard}>
                <MaterialCommunityIcons name="file-document-outline" size={40} color={colors.textLight} />
                <Text style={styles.emptyText}>No tenés recetas emitidas todavía.</Text>
              </Card>
            ) : (
              prescriptions.map((rx) => (
                <TouchableOpacity key={rx.id} activeOpacity={0.8} onPress={() => setViewingPrescription(rx)}>
                  <Card variant="outlined" style={styles.historyCard}>
                    <View style={styles.historyHeader}>
                      <Badge label="Receta clínica" variant="primary" />
                      <Text style={styles.historyDate}>
                        {new Date(rx.issuedAt).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </Text>
                    </View>
                    <Text style={styles.historyNotes}>
                      {rx.medications.map((m) => `${m.name} — ${m.dose} (${m.frequency})`).join('\n')}
                    </Text>
                    <Text style={styles.historyDoctor}>Emitida por {rx.vetName}</Text>
                  </Card>
                </TouchableOpacity>
              ))
            )}
          </View>
        ) : (
          <View style={styles.tabContent}>
            {groomingRecords.length === 0 ? (
              <Card variant="outlined" style={styles.emptyCard}>
                <MaterialCommunityIcons name="content-cut" size={40} color={colors.textLight} />
                <Text style={styles.emptyText}>Sin registros de peluquería todavía.</Text>
              </Card>
            ) : (
              groomingRecords.map((r) => (
                <Card key={r.id} variant="outlined" style={styles.historyCard}>
                  <View style={styles.historyHeader}>
                    <Badge label={groomingTypeLabel[r.serviceType] || r.serviceType} variant="accent" />
                    <Text style={styles.historyDate}>
                      {new Date(r.date).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </Text>
                  </View>
                  <Text style={styles.historyDoctor}>Atendido por {r.groomerName}</Text>
                  {r.observations ? <Text style={styles.historyNotes}>{r.observations}</Text> : null}
                </Card>
              ))
            )}
          </View>
        )}

        {/* Receta modal */}
        <Modal visible={!!viewingPrescription} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setViewingPrescription(null)}>
          {viewingPrescription && (
            <PrescriptionView
              prescription={viewingPrescription}
              petBreed={pet.breed}
              onClose={() => setViewingPrescription(null)}
            />
          )}
        </Modal>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgMain },
  content: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: 120 },
  backBtn: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.lg },
  backText: { fontFamily: fonts.nunito.semiBold, fontSize: fontSizes.md, color: colors.textDark, marginLeft: spacing.xs },
  headerCard: { alignItems: 'center', paddingVertical: spacing.xl, marginBottom: spacing.lg },
  petAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  petName: { fontFamily: fonts.quicksand.bold, fontSize: fontSizes['2xl'], color: colors.textDark },
  petBreed: { fontFamily: fonts.nunito.regular, fontSize: fontSizes.md, color: colors.textMuted, marginTop: 2, marginBottom: spacing.md },
  badgeRow: { flexDirection: 'row', gap: spacing.md },
  tabsContainer: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: colors.border, marginBottom: spacing.lg },
  tab: { flex: 1, paddingVertical: spacing.md, alignItems: 'center' },
  tabActive: { borderBottomWidth: 3, borderBottomColor: colors.primary },
  tabText: { fontFamily: fonts.nunito.semiBold, fontSize: fontSizes.xs, color: colors.textMuted },
  tabTextActive: { color: colors.primaryDark, fontFamily: fonts.nunito.bold },
  tabContent: { gap: spacing.md },
  loadingState: { alignItems: 'center', justifyContent: 'center', paddingVertical: spacing['3xl'] },
  emptyCard: { alignItems: 'center', padding: spacing['2xl'], gap: spacing.sm },
  emptyText: { fontFamily: fonts.nunito.regular, fontSize: fontSizes.sm, color: colors.textMuted, textAlign: 'center' },
  historyCard: { padding: spacing.lg },
  historyHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xs },
  historyDate: { fontFamily: fonts.nunito.regular, fontSize: fontSizes.xs, color: colors.textMuted },
  historyTitle: { fontFamily: fonts.quicksand.bold, fontSize: fontSizes.lg, color: colors.textDark },
  historyDoctor: { fontFamily: fonts.nunito.semiBold, fontSize: fontSizes.sm, color: colors.primaryDark, marginVertical: spacing.xs },
  historyNotes: { fontFamily: fonts.nunito.regular, fontSize: fontSizes.sm, color: colors.textMuted, marginTop: 2 },
  eventCard: { flexDirection: 'row', alignItems: 'center', padding: spacing.lg },
  eventTitle: { fontFamily: fonts.nunito.bold, fontSize: fontSizes.md, color: colors.textDark },
  eventDate: { fontFamily: fonts.nunito.regular, fontSize: fontSizes.sm, color: colors.textMuted, marginTop: 2 },
});

export default PetDetailScreen;
