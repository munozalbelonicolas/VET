// ============================================================
// Veterinaria La Plata — Vet Clinical Management Screen (Fase 4)
// ============================================================
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Alert,
  Image,
  ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, fonts, fontSizes, spacing, borderRadius, shadows } from '../../config/theme';
import { Card, Badge, Button, Input } from '../../components/ui';
import { Pet, MedicalRecord, MedicalRecordType } from '../../types';
import { getAllPets } from '../../services/dataService';
import { getMedicalRecordsByPet, addMedicalRecord } from '../../services/staffService';
import { uploadImageBase64 } from '../../services/storageService';
import { QueueItem, getQueue, updateQueueStatus } from '../../services/waitingRoomService';
import { useAuthStore } from '../../store/authStore';

export const VetClinicalScreen: React.FC = () => {
  const { user } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [pets, setPets] = useState<Pet[]>([]);
  const [selectedPet, setSelectedPet] = useState<Pet | null>(null);
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [queueItems, setQueueItems] = useState<QueueItem[]>([]);
  const [modalVisible, setModalVisible] = useState(false);

  // Form state
  const [recordType, setRecordType] = useState<MedicalRecordType>('consultation');
  const [diagnosis, setDiagnosis] = useState('');
  const [treatment, setTreatment] = useState('');
  const [medication, setMedication] = useState('');
  const [observations, setObservations] = useState('');
  const [attachedBase64s, setAttachedBase64s] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadPetsAndQueue();
  }, []);

  const loadPetsAndQueue = async () => {
    const list = await getAllPets();
    const enrichedList = list.map(p => ({ ...p, ownerName: p.ownerName || 'Nicolas' }));
    setPets(enrichedList);
    if (enrichedList.length > 0) {
      setSelectedPet(enrichedList[0]);
      loadRecords(enrichedList[0].id);
    }

    const q = await getQueue();
    setQueueItems(q);
  };

  const handlePickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.6,
        base64: true,
      });

      if (!result.canceled && result.assets[0].base64) {
        setAttachedBase64s([...attachedBase64s, result.assets[0].base64]);
      }
    } catch (e) {
      Alert.alert('Error', 'No se pudo adjuntar la imagen.');
    }
  };

  const loadRecords = async (petId: string) => {
    const recs = await getMedicalRecordsByPet(petId);
    setRecords(recs);
  };

  const handleSelectPet = (pet: Pet) => {
    setSelectedPet(pet);
    loadRecords(pet.id);
  };

  const handleSaveRecord = async () => {
    if (!selectedPet) return;
    if (!diagnosis.trim() && recordType === 'consultation') {
      Alert.alert('Error', 'Ingresá el diagnóstico de la consulta');
      return;
    }

    setSaving(true);
    try {
      // Upload image attachments
      const uploadedUrls: string[] = [];
      for (const b64 of attachedBase64s) {
        const url = await uploadImageBase64(b64, `medical/${selectedPet.id}/${Date.now()}.jpg`);
        uploadedUrls.push(url);
      }

      const newRec = await addMedicalRecord({
        petId: selectedPet.id,
        petName: selectedPet.name,
        vetId: user?.id || 'vet-001',
        vetName: user?.name || 'Dr. Veterinario',
        type: recordType,
        date: new Date(),
        diagnosis,
        treatment,
        medication,
        observations,
        attachments: uploadedUrls,
      });

      setRecords([newRec, ...records]);
      setModalVisible(false);
      setDiagnosis('');
      setTreatment('');
      setMedication('');
      setObservations('');
      setAttachedBase64s([]);
      Alert.alert('¡Registro Guardado! 🩺', 'La consulta fue guardada en la historia clínica.');
    } catch (error) {
      Alert.alert('Error', 'No se pudo guardar la historia clínica.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Historias Clínicas 🩺</Text>
        <Button
          title="+ Cargar Consulta"
          onPress={() => setModalVisible(true)}
          variant="primary"
          size="sm"
        />
      </View>

      {/* Search Input for Pet / Owner Name */}
      <View style={{ paddingHorizontal: spacing.lg, marginBottom: spacing.sm }}>
        <Input
          placeholder="🔍 Buscar por mascota (ej: Felipe) o dueño..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* RECEPTIONIST WAITING ROOM QUEUE SECTION */}
      <View style={{ paddingHorizontal: spacing.lg, marginBottom: spacing.md }}>
        <Text style={styles.recordsTitle}>🎟️ Pacientes en Sala de Espera (Orden de Llegada)</Text>
        {queueItems.length === 0 ? (
          <Card variant="outlined" style={{ padding: spacing.sm, alignItems: 'center' }}>
            <Text style={styles.emptyText}>No hay pacientes esperando en recepción.</Text>
          </Card>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {queueItems.map((q) => (
              <Card key={q.id} variant="elevated" style={styles.queueCardVet}>
                <View style={styles.qHeaderVet}>
                  <Badge label={q.ticketNumber} variant="primary" size="sm" />
                  <Badge
                    label={q.status === 'calling' ? 'Llamando' : 'En Espera'}
                    variant={q.status === 'calling' ? 'warning' : 'info'}
                    size="sm"
                  />
                </View>
                <Text style={styles.qPetVet}>{q.petName} 🐾</Text>
                <Text style={styles.qOwnerVet}>Dueño: {q.ownerName}</Text>
                <Text style={styles.qReasonVet} numberOfLines={1}>Motivo: {q.reason}</Text>

                <Button
                  title="🩺 Atender & Crear Ficha"
                  size="sm"
                  variant="accent"
                  style={{ marginTop: spacing.xs }}
                  onPress={async () => {
                    await updateQueueStatus(q.id, 'in_consultation');
                    // Find pet by name
                    const matchedPet = pets.find(
                      p => p.name.toLowerCase() === q.petName.toLowerCase()
                    );
                    if (matchedPet) {
                      setSelectedPet(matchedPet);
                      loadRecords(matchedPet.id);
                    }
                    setDiagnosis(q.reason);
                    setModalVisible(true);
                  }}
                />
              </Card>
            ))}
          </ScrollView>
        )}
      </View>

      {/* Patient Selector horizontal */}
      <Text style={styles.sectionSub}>Seleccionar Paciente</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.petScroll}>
        {pets
          .filter(p => 
            p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (p.ownerName && p.ownerName.toLowerCase().includes(searchQuery.toLowerCase()))
          )
          .map((p) => (
          <TouchableOpacity
            key={p.id}
            style={[styles.petSelectCard, selectedPet?.id === p.id && styles.petSelectCardActive]}
            onPress={() => handleSelectPet(p)}
          >
            <MaterialCommunityIcons
              name={p.species === 'dog' ? 'dog' : 'cat'}
              size={24}
              color={selectedPet?.id === p.id ? colors.primaryDark : colors.textMuted}
            />
            <View style={{ marginLeft: spacing.xs }}>
              <Text style={[styles.petSelectName, selectedPet?.id === p.id && styles.petSelectNameActive]}>
                {p.name}
              </Text>
              <Text style={styles.petSelectBreed}>{p.breed}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Selected Pet Overview */}
      {selectedPet && (
        <Card variant="elevated" style={styles.petInfoCard}>
          <View style={styles.petInfoRow}>
            <View>
              <Text style={styles.infoPetName}>{selectedPet.name}</Text>
              <Text style={styles.infoOwner}>
                Dueño: {selectedPet.ownerName || 'Nicolas'} • Raza: {selectedPet.breed}
              </Text>
            </View>
            <Badge label={`${selectedPet.currentWeight} kg`} variant="primary" size="md" />
          </View>
        </Card>
      )}

      {/* Medical Records List */}
      <ScrollView contentContainerStyle={styles.recordsList}>
        <Text style={styles.recordsTitle}>Historial Clínico Cronológico</Text>

        {records.length === 0 ? (
          <Card variant="outlined" style={styles.emptyRecords}>
            <Text style={styles.emptyText}>Sin registros médicos guardados para esta mascota.</Text>
          </Card>
        ) : (
          records.map((rec) => (
            <Card key={rec.id} variant="elevated" style={styles.recCard}>
              <View style={styles.recHeader}>
                <Badge
                  label={
                    rec.type === 'vaccination' ? 'Vacuna' :
                    rec.type === 'surgery' ? 'Cirugía' :
                    rec.type === 'study' ? 'Estudio' : 'Consulta'
                  }
                  variant={rec.type === 'vaccination' ? 'success' : 'primary'}
                />
                <Text style={styles.recDate}>{new Date(rec.date).toLocaleDateString('es-AR')}</Text>
              </View>

              {rec.diagnosis ? (
                <Text style={styles.recDiagnosis}>Diagnosis: {rec.diagnosis}</Text>
              ) : null}

              {rec.treatment ? (
                <Text style={styles.recDetail}>Tratamiento: {rec.treatment}</Text>
              ) : null}

              {rec.medication ? (
                <Text style={styles.recDetail}>Medicación: {rec.medication}</Text>
              ) : null}

              {/* Attachments Gallery */}
              {rec.attachments && rec.attachments.length > 0 && (
                <View style={styles.attachmentGallery}>
                  <Text style={styles.attachTitle}>📷 Archivos / Fotos Adjuntas:</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {rec.attachments.map((imgUrl, i) => (
                      <Image key={i} source={{ uri: imgUrl }} style={styles.attachImage} />
                    ))}
                  </ScrollView>
                </View>
              )}

              <Text style={styles.recVet}>Atendido por: {rec.vetName}</Text>
            </Card>
          ))
        )}
      </ScrollView>

      {/* Modal Add Medical Record */}
      <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Cargar Registro Médico 🩺</Text>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <MaterialCommunityIcons name="close" size={24} color={colors.textDark} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.modalContent}>
            <Text style={styles.label}>Tipo de Registro</Text>
            <View style={styles.typeGrid}>
              {[
                { id: 'consultation', label: '🩺 Consulta' },
                { id: 'vaccination', label: '💉 Vacuna' },
                { id: 'study', label: '🔬 Estudio' },
                { id: 'surgery', label: '🏥 Cirugía' },
              ].map((t) => (
                <TouchableOpacity
                  key={t.id}
                  style={[styles.typeOption, recordType === t.id && styles.typeOptionActive]}
                  onPress={() => setRecordType(t.id as MedicalRecordType)}
                >
                  <Text style={[styles.typeOptionText, recordType === t.id && styles.typeOptionTextActive]}>
                    {t.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Input
              label="Diagnóstico / Motivo"
              placeholder="Ej: Otitis externa, Control de rutina..."
              value={diagnosis}
              onChangeText={setDiagnosis}
              multiline
            />

            <Input
              label="Tratamiento Aplicado"
              placeholder="Ej: Limpieza de oídos, curación..."
              value={treatment}
              onChangeText={setTreatment}
              multiline
            />

            <Input
              label="Receta / Medicación"
              placeholder="Ej: Otisint Gotas 5 gotas c/12hs..."
              value={medication}
              onChangeText={setMedication}
              multiline
            />

            <Input
              label="Observaciones adicionales"
              placeholder="Ej: Control evolutivo en 7 días..."
              value={observations}
              onChangeText={setObservations}
              multiline
            />

            {/* Image Attachments */}
            <Text style={styles.label}>Fotos / Estudios Adjuntos</Text>
            <TouchableOpacity style={styles.pickImgBtn} onPress={handlePickImage}>
              <MaterialCommunityIcons name="camera-plus" size={24} color={colors.primary} />
              <Text style={styles.pickImgBtnText}>+ Adjuntar Foto / Estudio</Text>
            </TouchableOpacity>

            {attachedBase64s.length > 0 && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: spacing.sm }}>
                {attachedBase64s.map((b64, idx) => (
                  <Image
                    key={idx}
                    source={{ uri: `data:image/jpeg;base64,${b64}` }}
                    style={styles.previewThumb}
                  />
                ))}
              </ScrollView>
            )}

            <Button
              title="Guardar en Historia Clínica"
              onPress={handleSaveRecord}
              loading={saving}
              variant="accent"
              size="lg"
              fullWidth
              style={{ marginTop: spacing.md }}
            />
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgMain },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.lg, paddingTop: spacing['2xl'], paddingBottom: spacing.sm },
  title: { fontFamily: fonts.quicksand.bold, fontSize: fontSizes.xl, color: colors.textDark },
  sectionSub: { fontFamily: fonts.nunito.semiBold, fontSize: fontSizes.xs, color: colors.textMuted, paddingHorizontal: spacing.lg, marginBottom: spacing.xs },
  petScroll: { flexGrow: 0, paddingLeft: spacing.lg, marginBottom: spacing.md },
  petSelectCard: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: 12, borderWidth: 1, borderColor: colors.border, marginRight: spacing.sm, backgroundColor: colors.bgCard },
  petSelectCardActive: { backgroundColor: colors.primarySoft, borderColor: colors.primary },
  petSelectName: { fontFamily: fonts.nunito.bold, fontSize: fontSizes.sm, color: colors.textDark },
  petSelectNameActive: { color: colors.primaryDark },
  petSelectBreed: { fontFamily: fonts.nunito.regular, fontSize: fontSizes.xs, color: colors.textMuted },
  petInfoCard: { marginHorizontal: spacing.lg, padding: spacing.md, marginBottom: spacing.md, backgroundColor: colors.primarySoft },
  petInfoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  infoPetName: { fontFamily: fonts.quicksand.bold, fontSize: fontSizes.lg, color: colors.textDark },
  infoOwner: { fontFamily: fonts.nunito.regular, fontSize: fontSizes.xs, color: colors.textMuted, marginTop: 2 },
  recordsList: { paddingHorizontal: spacing.lg, paddingBottom: spacing['3xl'] },
  recordsTitle: { fontFamily: fonts.quicksand.bold, fontSize: fontSizes.md, color: colors.textDark, marginBottom: spacing.sm },
  emptyRecords: { padding: spacing.lg, alignItems: 'center' },
  emptyText: { fontFamily: fonts.nunito.regular, color: colors.textMuted, fontSize: fontSizes.sm },
  recCard: { padding: spacing.lg, marginBottom: spacing.md },
  recHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xs },
  recDate: { fontFamily: fonts.nunito.regular, fontSize: fontSizes.xs, color: colors.textMuted },
  recDiagnosis: { fontFamily: fonts.quicksand.bold, fontSize: fontSizes.md, color: colors.textDark, marginBottom: 4 },
  recDetail: { fontFamily: fonts.nunito.regular, fontSize: fontSizes.sm, color: colors.textMuted, marginBottom: 2 },
  recVet: { fontFamily: fonts.nunito.semiBold, fontSize: fontSizes.xs, color: colors.primaryDark, marginTop: spacing.xs },
  modalContainer: { flex: 1, backgroundColor: colors.bgMain, paddingTop: spacing.xl },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.xl, paddingBottom: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  modalTitle: { fontFamily: fonts.quicksand.bold, fontSize: fontSizes.xl, color: colors.textDark },
  modalContent: { padding: spacing.xl },
  label: { fontFamily: fonts.nunito.semiBold, fontSize: fontSizes.sm, color: colors.textDark, marginBottom: spacing.xs },
  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md },
  typeOption: { width: '48%', paddingVertical: spacing.md, alignItems: 'center', borderRadius: 12, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.bgCard },
  typeOptionActive: { backgroundColor: colors.primarySoft, borderColor: colors.primary },
  typeOptionText: { fontFamily: fonts.nunito.bold, fontSize: fontSizes.sm, color: colors.textDark },
  typeOptionTextActive: { color: colors.primaryDark },
  attachmentGallery: { marginTop: spacing.xs, marginBottom: spacing.xs },
  attachTitle: { fontFamily: fonts.nunito.bold, fontSize: fontSizes.xs, color: colors.textDark, marginBottom: 4 },
  attachImage: { width: 80, height: 80, borderRadius: 8, marginRight: spacing.xs, borderWidth: 1, borderColor: colors.border },
  pickImgBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.xs, padding: spacing.md, borderRadius: 12, borderWidth: 1, borderColor: colors.primary, borderStyle: 'dashed', backgroundColor: colors.primarySoft, marginBottom: spacing.md },
  pickImgBtnText: { fontFamily: fonts.nunito.bold, fontSize: fontSizes.sm, color: colors.primaryDark },
  previewThumb: { width: 70, height: 70, borderRadius: 8, marginRight: spacing.xs, borderWidth: 1, borderColor: colors.border },
  queueCardVet: { padding: spacing.sm, marginRight: spacing.sm, width: 170, backgroundColor: colors.primarySoft },
  qHeaderVet: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 },
  qPetVet: { fontFamily: fonts.quicksand.bold, fontSize: fontSizes.sm, color: colors.textDark, marginTop: 2 },
  qOwnerVet: { fontFamily: fonts.nunito.regular, fontSize: 10, color: colors.textMuted },
  qReasonVet: { fontFamily: fonts.nunito.bold, fontSize: 10, color: colors.primaryDark, marginTop: 2 },
});

export default VetClinicalScreen;
