// ============================================================
// Veterinaria La Plata — PetRecordScreen (Expediente GIS)
// Timeline consolidado, evolución de peso, recetas y seguimiento
// ============================================================
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Modal,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, fonts, fontSizes, spacing, borderRadius, letterSpacing } from '../../config/theme';
import { Card, Badge, Button } from '../../components/ui';
import { WeightChart, WeightPoint } from '../../components/ui/WeightChart';
import MedicalRecordForm, { MedicalRecordFormPayload } from '../../components/clinic/MedicalRecordForm';
import PrescriptionView from '../../components/clinic/PrescriptionView';
import AttachmentLightbox from '../../components/clinic/AttachmentLightbox';
import {
  Pet,
  MedicalRecord,
  Prescription,
  FollowUp,
  TimelineEvent,
  Attachment,
} from '../../types';
import {
  getPetTimeline,
  addMedicalRecord,
  createPrescription,
  createFollowUp,
  getPrescriptionsByPet,
  getFollowUpsByVet,
  completeFollowUp,
} from '../../services/staffService';
import { useAuthStore } from '../../store/authStore';
import { createInAppNotification } from '../../services/notificationService';
import AsyncStorage from '@react-native-async-storage/async-storage';

const RECORD_CACHE_KEY = (petId: string) => `vet-record-cache-${petId}`;

const medicalLabel: Record<string, string> = {
  consultation: '🩺 Consulta',
  vaccination: '💉 Vacunación',
  study: '🔬 Estudio',
  surgery: '🏥 Cirugía',
  deworming: '🪱 Desparasitación',
};

interface PetRecordScreenProps {
  pet: Pet;
  onBack: () => void;
  prefillDiagnosis?: string;
}

export const PetRecordScreen: React.FC<PetRecordScreenProps> = ({ pet, onBack, prefillDiagnosis }) => {
  const { user } = useAuthStore();
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [viewingPrescription, setViewingPrescription] = useState<Prescription | null>(null);
  const [lightbox, setLightbox] = useState<{ visible: boolean; attachments: Attachment[]; index: number }>({
    visible: false,
    attachments: [],
    index: 0,
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [tl, rx] = await Promise.all([getPetTimeline(pet.id), getPrescriptionsByPet(pet.id)]);
      setTimeline(tl);
      setPrescriptions(rx);
      if (user?.id) {
        const fu = await getFollowUpsByVet(user.id);
        setFollowUps(fu.filter((f) => f.petId === pet.id));
      }
      // Cache offline
      try {
        await AsyncStorage.setItem(
          RECORD_CACHE_KEY(pet.id),
          JSON.stringify({ tl, rx, ts: Date.now() })
        );
      } catch (e) {
        console.log('cache write error:', e);
      }
    } catch (error) {
      console.log('PetRecord load error:', error);
      // Offline: intentar con cache
      try {
        const cached = await AsyncStorage.getItem(RECORD_CACHE_KEY(pet.id));
        if (cached) {
          const { tl, rx } = JSON.parse(cached);
          setTimeline(tl.map((e: any) => ({ ...e, date: new Date(e.date) })));
          setPrescriptions(rx.map((p: any) => ({ ...p, issuedAt: new Date(p.issuedAt), createdAt: new Date(p.createdAt) })));
        }
      } catch (e) {
        console.log('cache read error:', e);
      }
    } finally {
      setLoading(false);
    }
  }, [pet.id, user?.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Serie de peso desde vitales de registros médicos
  const weightPoints: WeightPoint[] = timeline
    .filter((e) => e.kind === 'medical' && (e.data as MedicalRecord).vitals?.weightKg)
    .map((e) => {
      const rec = e.data as MedicalRecord;
      return { date: rec.date, weightKg: rec.vitals!.weightKg! };
    });

  const handleSubmitRecord = async (payload: MedicalRecordFormPayload) => {
    if (!user?.id) {
      Alert.alert('Error', 'Sesión inválida.');
      return;
    }
    setSaving(true);
    try {
      const newRec = await addMedicalRecord({
        petId: pet.id,
        petName: pet.name,
        vetId: user.id,
        vetName: user.name,
        type: payload.type,
        date: new Date(),
        diagnosis: payload.diagnosis,
        treatment: payload.treatment,
        vitals: payload.vitals,
        medicationDoses: payload.medicationDoses,
        medication: payload.medicationDoses.length ? payload.medicationDoses.map((m) => `${m.name} ${m.dose}`).join(', ') : undefined,
        observations: payload.observations,
        nextDoseDate: payload.nextDoseDate,
        attachments: payload.attachments,
        createdBy: user.id,
        updatedBy: user.id,
      });

      // Receta estructurada
      if (payload.createPrescription && payload.medicationDoses.length > 0) {
        try {
          await createPrescription({
            petId: pet.id,
            petName: pet.name,
            medicalRecordId: newRec.id,
            vetId: user.id,
            vetName: user.name,
            medications: payload.medicationDoses,
            indications: payload.treatment,
            issuedAt: new Date(),
            status: 'active',
          });
        } catch (e) {
          console.log('prescription error:', e);
        }
      }

      // Seguimiento
      if (payload.createFollowUp || payload.nextDoseDate) {
        try {
          await createFollowUp({
            petId: pet.id,
            petName: pet.name,
            ownerId: pet.ownerId,
            vetId: user.id,
            title: payload.nextDoseDate ? `Próxima dosis / control de ${pet.name}` : `Seguimiento de ${pet.name}`,
            description: payload.diagnosis,
            dueDate: payload.nextDoseDate || new Date(Date.now() + 7 * 86400000),
            relatedRecordId: newRec.id,
          });
        } catch (e) {
          console.log('followup error:', e);
        }
      }

      // Notificación al cliente
      try {
        await createInAppNotification({
          userId: pet.ownerId,
          type: 'vet_message',
          title: 'Actualización de tu mascota 🐾',
          body: `${user.name} registró un ${medicalLabel[payload.type]?.toLowerCase() || 'registro'} para ${pet.name}.`,
          data: { petId: pet.id },
        });
      } catch (e) {
        console.log('notif error:', e);
      }

      setModalVisible(false);
      await loadData();
      Alert.alert('¡Registro Guardado! 🩺', `La historia clínica de ${pet.name} fue actualizada.`);
    } catch (error) {
      console.log('save record error:', error);
      Alert.alert('Error', 'No se pudo guardar el registro clínico.');
    } finally {
      setSaving(false);
    }
  };

  const handleCompleteFollowUp = async (f: FollowUp) => {
    try {
      await completeFollowUp(f.id);
      setFollowUps((current) => current.map((x) => (x.id === f.id ? { ...x, status: 'done' } : x)));
    } catch (error) {
      console.log('complete followup error:', error);
    }
  };

  return (
    <View style={styles.container}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.textDark} />
        </TouchableOpacity>
        <Text style={styles.topTitle}>Expediente Clínico</Text>
        <Button title="Nueva consulta" size="sm" variant="primary" onPress={() => setModalVisible(true)} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Header paciente */}
        <Card variant="elevated" style={styles.petCard}>
          <View style={styles.petRow}>
            <View style={styles.petAvatar}>
              {pet.avatarUrl ? (
                <Image source={{ uri: pet.avatarUrl }} style={{ width: 64, height: 64, borderRadius: 32 }} />
              ) : (
                <MaterialCommunityIcons name={pet.species === 'dog' ? 'dog' : 'cat'} size={36} color={colors.primary} />
              )}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.petName}>{pet.name}</Text>
              <Text style={styles.petMeta}>
                {pet.breed || pet.species} • {pet.sex === 'female' ? 'Hembra' : 'Macho'}
                {pet.ageYears ? ` • ${pet.ageYears} años` : ''}
              </Text>
            </View>
            <Badge
              label={pet.healthStatus === 'green' ? 'Saludable' : 'Atención'}
              variant={pet.healthStatus === 'green' ? 'success' : 'warning'}
              size="md"
            />
          </View>
          <View style={styles.quickStats}>
            <View style={styles.quickStat}>
              <Text style={styles.quickStatValue}>{pet.currentWeight} kg</Text>
              <Text style={styles.quickStatLabel}>Peso actual</Text>
            </View>
            <View style={styles.quickStat}>
              <Text style={styles.quickStatValue}>{timeline.filter((e) => e.kind === 'medical').length}</Text>
              <Text style={styles.quickStatLabel}>Registros médicos</Text>
            </View>
            <View style={styles.quickStat}>
              <Text style={styles.quickStatValue}>{prescriptions.length}</Text>
              <Text style={styles.quickStatLabel}>Recetas</Text>
            </View>
          </View>
        </Card>

        {/* Evolución de peso */}
        <Text style={styles.sectionTitle}>Evolución de peso</Text>
        <Card variant="elevated" style={styles.sectionCard}>
          {weightPoints.length >= 2 ? (
            <WeightChart points={weightPoints} />
          ) : (
            <Text style={styles.emptyInline}>
              Se registran los pesos de cada consulta. Aún no hay suficientes mediciones.
            </Text>
          )}
        </Card>

        {/* Recetas */}
        <Text style={styles.sectionTitle}>Recetas</Text>
        {prescriptions.length === 0 ? (
          <Card variant="outlined" style={styles.emptyInlineCard}>
            <Text style={styles.emptyInline}>No hay recetas emitidas para esta mascota.</Text>
          </Card>
        ) : (
          prescriptions.map((rx) => (
            <TouchableOpacity key={rx.id} activeOpacity={0.8} onPress={() => setViewingPrescription(rx)}>
              <Card variant="outlined" style={styles.prescriptionCard}>
                <View style={styles.prescriptionRow}>
                  <View style={styles.prescriptionIcon}>
                    <MaterialCommunityIcons name="file-document-outline" size={24} color={colors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.prescriptionTitle}>
                      {rx.medications.map((m) => m.name).join(', ')}
                    </Text>
                    <Text style={styles.prescriptionDate}>
                      Emitida {new Date(rx.issuedAt).toLocaleDateString('es-AR')} • {rx.medications.length} medicamento{rx.medications.length !== 1 ? 's' : ''}
                    </Text>
                  </View>
                  <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textLight} />
                </View>
              </Card>
            </TouchableOpacity>
          ))
        )}

        {/* Seguimientos */}
        {followUps.filter((f) => f.status !== 'done').length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Seguimientos pendientes</Text>
            {followUps
              .filter((f) => f.status !== 'done')
              .map((f) => (
                <Card key={f.id} variant="highlight" style={styles.followUpCard}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.followUpTitle}>{f.title}</Text>
                    <Text style={styles.followUpDate}>
                      Vence: {new Date(f.dueDate).toLocaleDateString('es-AR')}
                    </Text>
                  </View>
                  <Button
                    title="✓ Completar"
                    size="sm"
                    variant="outline"
                    onPress={() => handleCompleteFollowUp(f)}
                  />
                </Card>
              ))}
          </>
        )}

        {/* Timeline */}
        <Text style={styles.sectionTitle}>Historial clínico</Text>

        {loading ? (
          <View style={styles.centerState}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : timeline.length === 0 ? (
          <Card variant="outlined" style={styles.emptyCard}>
            <MaterialCommunityIcons name="clipboard-text-outline" size={40} color={colors.textLight} />
            <Text style={styles.emptyText}>Sin eventos registrados todavía.</Text>
          </Card>
        ) : (
          timeline.map((event) => {
            if (event.kind === 'medical') {
              const rec = event.data as MedicalRecord;
              return (
                <Card key={event.id} variant="outlined" style={styles.timelineCard}>
                  <View style={styles.timelineHeader}>
                    <Badge label={event.title} variant="primary" size="sm" />
                    <Text style={styles.timelineDate}>
                      {new Date(event.date).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </Text>
                  </View>
                  <Text style={styles.timelineVet}>Atendido por {rec.vetName}</Text>
                  {rec.diagnosis ? <Text style={styles.timelineText}>🔎 {rec.diagnosis}</Text> : null}
                  {rec.treatment ? <Text style={styles.timelineText}>💊 {rec.treatment}</Text> : null}
                  {rec.vitals && (
                    <Text style={styles.timelineVitals}>
                      T° {rec.vitals.temperatureC ? `${rec.vitals.temperatureC}°C` : '—'} • FC {rec.vitals.heartRate ?? '—'} • Peso {rec.vitals.weightKg ? `${rec.vitals.weightKg} kg` : '—'}
                    </Text>
                  )}
                  {rec.medicationDoses && rec.medicationDoses.length > 0 && (
                    <View style={styles.doseList}>
                      {rec.medicationDoses.map((m, i) => (
                        <Text key={i} style={styles.doseItem}>
                          • {m.name} — {m.dose} {m.via ? `(${m.via})` : ''} {m.frequency ? `cada ${m.frequency}` : ''}
                        </Text>
                      ))}
                    </View>
                  )}
                  {rec.attachments.length > 0 && (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0, marginTop: spacing.xs }}>
                      {rec.attachments.map((a, i) => (
                        <TouchableOpacity
                          key={i}
                          onPress={() => setLightbox({ visible: true, attachments: rec.attachments, index: i })}
                        >
                          <Image source={{ uri: a.url }} style={styles.attachThumb} />
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  )}
                </Card>
              );
            }
            if (event.kind === 'grooming') {
              return (
                <Card key={event.id} variant="outlined" style={styles.timelineCard}>
                  <View style={styles.timelineHeader}>
                    <Badge label={event.title} variant="accent" size="sm" />
                    <Text style={styles.timelineDate}>
                      {new Date(event.date).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </Text>
                  </View>
                  {event.subtitle ? <Text style={styles.timelineText}>{event.subtitle}</Text> : null}
                </Card>
              );
            }
            return (
              <Card key={event.id} variant="flat" style={styles.timelineCard}>
                <View style={styles.timelineHeader}>
                  <Badge label={event.title} variant="muted" size="sm" />
                  <Text style={styles.timelineDate}>
                    {new Date(event.date).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </Text>
                </View>
                {event.subtitle ? <Text style={styles.timelineText}>{event.subtitle}</Text> : null}
              </Card>
            );
          })
        )}
      </ScrollView>

      {/* Modal alta de registro */}
      <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Nuevo registro — {pet.name} 🩺</Text>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <MaterialCommunityIcons name="close" size={24} color={colors.textDark} />
            </TouchableOpacity>
          </View>
          <MedicalRecordForm
            submitLabel="Guardar en historia clínica"
            submitting={saving}
            initialPayload={{ diagnosis: prefillDiagnosis }}
            onSubmit={handleSubmitRecord}
            onCancel={() => setModalVisible(false)}
          />
        </View>
      </Modal>

      {/* Receta modal */}
      <Modal visible={!!viewingPrescription} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setViewingPrescription(null)}>
        {viewingPrescription && (
          <PrescriptionView
            prescription={viewingPrescription}
            vetName={viewingPrescription.vetName}
            petBreed={pet.breed}
            petOwnerName={pet.ownerName}
            onClose={() => setViewingPrescription(null)}
          />
        )}
      </Modal>

      {/* Visor de adjuntos */}
      <AttachmentLightbox
        visible={lightbox.visible}
        attachments={lightbox.attachments}
        initialIndex={lightbox.index}
        onClose={() => setLightbox((c) => ({ ...c, visible: false }))}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgMain },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing['2xl'],
    paddingBottom: spacing.sm,
  },
  backBtn: { padding: spacing.xs },
  topTitle: { fontFamily: fonts.quicksand.bold, fontSize: fontSizes.lg, color: colors.textDark, letterSpacing: letterSpacing.display, flex: 1, marginLeft: spacing.sm },
  content: { paddingHorizontal: spacing.lg, paddingBottom: 120 },
  petCard: { padding: spacing.lg, marginBottom: spacing.lg },
  petRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  petAvatar: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  petName: { fontFamily: fonts.quicksand.bold, fontSize: fontSizes.xl, color: colors.textDark },
  petMeta: { fontFamily: fonts.nunito.regular, fontSize: fontSizes.sm, color: colors.textMuted, marginTop: 2 },
  quickStats: { flexDirection: 'row', justifyContent: 'space-around', marginTop: spacing.lg, paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.hairline },
  quickStat: { alignItems: 'center' },
  quickStatValue: { fontFamily: fonts.quicksand.bold, fontSize: fontSizes.lg, color: colors.primaryDark },
  quickStatLabel: { fontFamily: fonts.nunito.regular, fontSize: fontSizes.xs, color: colors.textMuted, marginTop: 2 },
  sectionTitle: { fontFamily: fonts.quicksand.bold, fontSize: fontSizes.lg, color: colors.textDark, marginBottom: spacing.sm, marginTop: spacing.md, letterSpacing: letterSpacing.display },
  sectionCard: { padding: spacing.lg, marginBottom: spacing.md },
  emptyInline: { fontFamily: fonts.nunito.regular, fontSize: fontSizes.sm, color: colors.textMuted, textAlign: 'center', paddingVertical: spacing.md },
  emptyInlineCard: { alignItems: 'center', padding: spacing.md, marginBottom: spacing.md },
  prescriptionCard: { padding: spacing.md, marginBottom: spacing.sm },
  prescriptionRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  prescriptionIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  prescriptionTitle: { fontFamily: fonts.quicksand.bold, fontSize: fontSizes.md, color: colors.textDark },
  prescriptionDate: { fontFamily: fonts.nunito.regular, fontSize: fontSizes.xs, color: colors.textMuted, marginTop: 2 },
  centerState: { alignItems: 'center', justifyContent: 'center', paddingVertical: spacing['3xl'] },
  emptyCard: { alignItems: 'center', padding: spacing.xl, gap: spacing.sm },
  emptyText: { fontFamily: fonts.nunito.regular, fontSize: fontSizes.sm, color: colors.textMuted, textAlign: 'center' },
  followUpCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing.lg, marginBottom: spacing.sm },
  followUpTitle: { fontFamily: fonts.nunito.bold, fontSize: fontSizes.md, color: colors.textDark },
  followUpDate: { fontFamily: fonts.nunito.regular, fontSize: fontSizes.xs, color: colors.textMuted, marginTop: 2 },
  timelineCard: { padding: spacing.lg, marginBottom: spacing.md },
  timelineHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xs },
  timelineDate: { fontFamily: fonts.nunito.regular, fontSize: fontSizes.xs, color: colors.textMuted },
  timelineVet: { fontFamily: fonts.nunito.semiBold, fontSize: fontSizes.xs, color: colors.primaryDark, marginBottom: 2 },
  timelineText: { fontFamily: fonts.nunito.regular, fontSize: fontSizes.sm, color: colors.textDark, marginTop: 2 },
  timelineVitals: { fontFamily: fonts.nunito.regular, fontSize: fontSizes.xs, color: colors.textMuted, marginTop: spacing.xs, backgroundColor: colors.surfaceMuted, padding: spacing.xs, borderRadius: borderRadius.sm, overflow: 'hidden' },
  doseList: { marginTop: spacing.xs },
  doseItem: { fontFamily: fonts.nunito.regular, fontSize: fontSizes.xs, color: colors.textMuted },
  attachThumb: { width: 70, height: 70, borderRadius: 8, marginRight: spacing.xs, borderWidth: 1, borderColor: colors.border },
  modalContainer: { flex: 1, backgroundColor: colors.bgMain, paddingTop: spacing.xl },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.xl, paddingBottom: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  modalTitle: { fontFamily: fonts.quicksand.bold, fontSize: fontSizes.xl, color: colors.textDark, flex: 1 },
});

export default PetRecordScreen;
