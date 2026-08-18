// ============================================================
// Veterinaria La Plata — MedicalRecordForm
// Formulario clínico reutilizable: tipo, plantillas, vitales,
// medicación estructurada, adjuntos y próxima dosis.
// ============================================================
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Platform,
  Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, fonts, fontSizes, spacing, borderRadius } from '../../config/theme';
import { Button, Input } from '../ui';
import {
  MedicalRecordType,
  MedicationDose,
  Vitals,
  Attachment,
  ClinicalTemplate,
} from '../../types';
import { getClinicalTemplates } from '../../services/staffService';
import { uploadImage, uploadPdf } from '../../services/storageService';

export interface MedicalRecordFormPayload {
  type: MedicalRecordType;
  diagnosis?: string;
  treatment?: string;
  vitals?: Vitals;
  medicationDoses: MedicationDose[];
  observations?: string;
  nextDoseDate?: Date;
  attachments: Attachment[];
  createPrescription: boolean;
  createFollowUp: boolean;
}

interface MedicalRecordFormProps {
  defaultType?: MedicalRecordType;
  initialPayload?: Partial<MedicalRecordFormPayload>;
  submitLabel: string;
  submitting?: boolean;
  onSubmit: (payload: MedicalRecordFormPayload) => void;
  onCancel?: () => void;
}

const TYPES: { id: MedicalRecordType; label: string; icon: string }[] = [
  { id: 'consultation', label: 'Consulta', icon: 'stethoscope' },
  { id: 'vaccination', label: 'Vacuna', icon: 'needle' },
  { id: 'study', label: 'Estudio', icon: 'microscope' },
  { id: 'surgery', label: 'Cirugía', icon: 'bandage' },
  { id: 'deworming', label: 'Desparasitación', icon: 'pill' },
];

const emptyDose = (): MedicationDose => ({ name: '', via: 'oral', dose: '', frequency: '' });

export const MedicalRecordForm: React.FC<MedicalRecordFormProps> = ({
  defaultType = 'consultation',
  initialPayload,
  submitLabel,
  submitting = false,
  onSubmit,
  onCancel,
}) => {
  const [type, setType] = useState<MedicalRecordType>(defaultType);
  const [templates, setTemplates] = useState<ClinicalTemplate[]>([]);
  const [diagnosis, setDiagnosis] = useState(initialPayload?.diagnosis || '');
  const [treatment, setTreatment] = useState(initialPayload?.treatment || '');
  const [observations, setObservations] = useState(initialPayload?.observations || '');

  // Vitals
  const [tempC, setTempC] = useState(initialPayload?.vitals?.temperatureC?.toString() || '');
  const [heartRate, setHeartRate] = useState(initialPayload?.vitals?.heartRate?.toString() || '');
  const [respRate, setRespRate] = useState(initialPayload?.vitals?.respiratoryRate?.toString() || '');
  const [weightKg, setWeightKg] = useState(initialPayload?.vitals?.weightKg?.toString() || '');

  // Medication
  const [doses, setDoses] = useState<MedicationDose[]>(
    initialPayload?.medicationDoses?.length
      ? initialPayload.medicationDoses
      : []
  );
  const [createPrescription, setCreatePrescription] = useState(false);
  const [createFollowUp, setCreateFollowUp] = useState(false);

  // Próxima dosis
  const [showNextDosePicker, setShowNextDosePicker] = useState(false);
  const [nextDoseDate, setNextDoseDate] = useState<Date | undefined>(initialPayload?.nextDoseDate);

  // Attachments
  const [attachments, setAttachments] = useState<Attachment[]>(initialPayload?.attachments || []);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingPdf, setUploadingPdf] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const list = await getClinicalTemplates(type);
        setTemplates(list);
      } catch (e) {
        setTemplates([]);
      }
    })();
  }, [type]);

  const applyTemplate = (tpl: ClinicalTemplate) => {
    if (tpl.diagnosis) setDiagnosis(tpl.diagnosis);
    if (tpl.treatment) setTreatment(tpl.treatment);
    if (tpl.observations) setObservations(tpl.observations);
    if (tpl.medications.length > 0) setDoses(tpl.medications.map((m) => ({ ...m })));
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.6,
      });
      if (!result.canceled) {
        setUploadingImage(true);
        try {
          const url = await uploadImage(result.assets[0].uri, `medical/${Date.now()}.jpg`);
          setAttachments((current) => [...current, { url, kind: 'image' }]);
        } finally {
          setUploadingImage(false);
        }
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo adjuntar la imagen.');
    }
  };

  const pickPdf = async () => {
    try {
      let DocumentPickerModule: typeof import('expo-document-picker');
      try {
        DocumentPickerModule = require('expo-document-picker');
      } catch (e) {
        Alert.alert('Módulo no disponible', 'Para seleccionar archivos PDF de estudios se requiere actualizar el binario nativo.');
        return;
      }
      const result = await DocumentPickerModule.getDocumentAsync({
        type: ['application/pdf'],
        copyToCacheDirectory: true,
        multiple: false,
      });
      if (result.canceled || result.assets.length === 0) return;

      setUploadingPdf(true);
      try {
        const url = await uploadPdf(result.assets[0].uri, `medical/studies/${Date.now()}.pdf`);
        if (!url) {
          Alert.alert('Aviso', 'No se pudo subir el PDF. Verificá la configuración de Cloudinary.');
          return;
        }
        setAttachments((current) => [
          ...current,
          { url, kind: 'pdf', caption: result.assets[0].name || 'Estudio' },
        ]);
      } finally {
        setUploadingPdf(false);
      }
    } catch (error) {
      console.log('pickPdf error:', error);
      Alert.alert('Error', 'No se pudo adjuntar el PDF.');
    }
  };

  const updateDose = (index: number, field: keyof MedicationDose, value: string) => {
    setDoses((current) =>
      current.map((d, i) => (i === index ? { ...d, [field]: value } : d))
    );
  };

  const handleSubmit = () => {
    const payload: MedicalRecordFormPayload = {
      type,
      diagnosis: diagnosis.trim() || undefined,
      treatment: treatment.trim() || undefined,
      observations: observations.trim() || undefined,
      medicationDoses: doses.filter((d) => d.name.trim()),
      attachments,
      createPrescription,
      createFollowUp,
    };

    if (tempC.trim() || heartRate.trim() || respRate.trim() || weightKg.trim()) {
      payload.vitals = {
        temperatureC: tempC.trim() ? parseFloat(tempC) : undefined,
        heartRate: heartRate.trim() ? parseInt(heartRate, 10) : undefined,
        respiratoryRate: respRate.trim() ? parseInt(respRate, 10) : undefined,
        weightKg: weightKg.trim() ? parseFloat(weightKg) : undefined,
      };
    }

    if (nextDoseDate) payload.nextDoseDate = nextDoseDate;

    onSubmit(payload);
  };

  const addDose = () => setDoses((current) => [...current, emptyDose()]);
  const removeDose = (index: number) =>
    setDoses((current) => current.filter((_, i) => i !== index));

  return (
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      {/* Tipo de registro */}
      <Text style={styles.label}>Tipo de Registro</Text>
      <View style={styles.typeGrid}>
        {TYPES.map((t) => (
          <TouchableOpacity
            key={t.id}
            style={[styles.typeOption, type === t.id && styles.typeOptionActive]}
            onPress={() => setType(t.id)}
          >
            <MaterialCommunityIcons
              name={t.icon as any}
              size={20}
              color={type === t.id ? colors.primaryDark : colors.textMuted}
            />
            <Text style={[styles.typeText, type === t.id && styles.typeTextActive]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Plantillas */}
      {templates.length > 0 && (
        <>
          <Text style={styles.label}>Plantillas rápidas</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0, marginBottom: spacing.md }}>
            {templates.map((tpl) => (
              <TouchableOpacity
                key={tpl.id}
                style={styles.templateChip}
                onPress={() => applyTemplate(tpl)}
              >
                <MaterialCommunityIcons name="auto-fix" size={16} color={colors.primary} />
                <Text style={styles.templateText}>{tpl.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </>
      )}

      <Input label="Diagnóstico / Motivo" placeholder="Ej: Otitis externa..." value={diagnosis} onChangeText={setDiagnosis} multiline />
      <Input label="Tratamiento aplicado" placeholder="Ej: Limpieza ótica, curación..." value={treatment} onChangeText={setTreatment} multiline />

      {/* Vitales */}
      <Text style={styles.label}>Signos vitales (opcional)</Text>
      <View style={styles.vitalsRow}>
        <View style={{ flex: 1, marginRight: spacing.xs }}>
          <Input label="T° (°C)" placeholder="38.6" value={tempC} onChangeText={setTempC} keyboardType="numeric" containerStyle={{ marginBottom: spacing.xs }} />
        </View>
        <View style={{ flex: 1, marginRight: spacing.xs }}>
          <Input label="FC (ppm)" placeholder="96" value={heartRate} onChangeText={setHeartRate} keyboardType="numeric" containerStyle={{ marginBottom: spacing.xs }} />
        </View>
        <View style={{ flex: 1 }}>
          <Input label="FR (rpm)" placeholder="24" value={respRate} onChangeText={setRespRate} keyboardType="numeric" containerStyle={{ marginBottom: spacing.xs }} />
        </View>
      </View>
      <Input label="Peso (kg)" placeholder="Ej: 12.5" value={weightKg} onChangeText={setWeightKg} keyboardType="numeric" />

      {/* Medicación estructurada */}
      <View style={styles.sectionHeader}>
        <Text style={styles.label}>Medicación</Text>
        <TouchableOpacity onPress={addDose} style={styles.addBtn}>
          <MaterialCommunityIcons name="plus" size={18} color={colors.primaryDark} />
          <Text style={styles.addBtnText}>Agregar medicamento</Text>
        </TouchableOpacity>
      </View>

      {doses.map((dose, index) => (
        <View key={index} style={styles.doseCard}>
          <View style={styles.doseHeader}>
            <Text style={styles.doseTitle}>Medicamento {index + 1}</Text>
            <TouchableOpacity onPress={() => removeDose(index)}>
              <MaterialCommunityIcons name="close" size={20} color={colors.danger} />
            </TouchableOpacity>
          </View>
          <Input label="Nombre" placeholder="Ej: Otisint Gotas" value={dose.name} onChangeText={(v) => updateDose(index, 'name', v)} containerStyle={{ marginBottom: spacing.xs }} />
          <View style={styles.vitalsRow}>
            <View style={{ flex: 1, marginRight: spacing.xs }}>
              <Input label="Vía" placeholder="oral" value={dose.via} onChangeText={(v) => updateDose(index, 'via', v)} containerStyle={{ marginBottom: spacing.xs }} />
            </View>
            <View style={{ flex: 1, marginRight: spacing.xs }}>
              <Input label="Dosis" placeholder="5 gotas" value={dose.dose} onChangeText={(v) => updateDose(index, 'dose', v)} containerStyle={{ marginBottom: spacing.xs }} />
            </View>
            <View style={{ flex: 1 }}>
              <Input label="Frecuencia" placeholder="c/12 hs" value={dose.frequency} onChangeText={(v) => updateDose(index, 'frequency', v)} containerStyle={{ marginBottom: spacing.xs }} />
            </View>
          </View>
          <Input label="Duración (opcional)" placeholder="7 días" value={dose.duration || ''} onChangeText={(v) => updateDose(index, 'duration', v)} />
        </View>
      ))}

      {/* Opciones: receta + seguimiento */}
      <View style={styles.toggleRow}>
        <TouchableOpacity style={styles.toggleOption} onPress={() => setCreatePrescription(!createPrescription)}>
          <MaterialCommunityIcons
            name={createPrescription ? 'checkbox-marked-circle' : 'checkbox-blank-circle-outline'}
            size={22}
            color={createPrescription ? colors.primary : colors.textMuted}
          />
          <Text style={styles.toggleText}>Generar receta clínica</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.toggleRow}>
        <TouchableOpacity style={styles.toggleOption} onPress={() => setCreateFollowUp(!createFollowUp)}>
          <MaterialCommunityIcons
            name={createFollowUp ? 'checkbox-marked-circle' : 'checkbox-blank-circle-outline'}
            size={22}
            color={createFollowUp ? colors.primary : colors.textMuted}
          />
          <Text style={styles.toggleText}>Crear seguimiento (próximo control)</Text>
        </TouchableOpacity>
      </View>

      {/* Próxima dosis */}
      <TouchableOpacity
        style={styles.nextDoseBtn}
        onPress={() => setShowNextDosePicker((v) => !v)}
      >
        <MaterialCommunityIcons name="calendar-clock" size={20} color={colors.primary} />
        <Text style={styles.nextDoseText}>
          {nextDoseDate
            ? `Próxima dosis: ${nextDoseDate.toLocaleDateString('es-AR')}`
            : 'Fecha de próxima dosis / vacuna (opcional)'}
        </Text>
      </TouchableOpacity>
      {showNextDosePicker && (
        <DateTimePicker
          value={nextDoseDate || new Date(Date.now() + 30 * 86400000)}
          mode="date"
          display={Platform.OS === 'ios' ? 'inline' : 'default'}
          minimumDate={new Date()}
          onChange={(event, date) => {
            if (Platform.OS === 'android') setShowNextDosePicker(false);
            if (date) setNextDoseDate(date);
          }}
        />
      )}

      <Input
        label="Observaciones adicionales"
        placeholder="Ej: Control evolutivo en 7 días..."
        value={observations}
        onChangeText={setObservations}
        multiline
      />

      {/* Adjuntos */}
      <Text style={styles.label}>Fotos / Estudios adjuntos</Text>
      <View style={styles.attachButtonsRow}>
        <TouchableOpacity style={[styles.pickImgBtn, { flex: 1, marginRight: spacing.xs }]} onPress={pickImage} disabled={uploadingImage || uploadingPdf}>
          <MaterialCommunityIcons name="camera-plus" size={24} color={colors.primary} />
          <Text style={styles.pickImgBtnText}>{uploadingImage ? 'Subiendo...' : 'Foto'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.pickImgBtn, { flex: 1 }]} onPress={pickPdf} disabled={uploadingImage || uploadingPdf}>
          <MaterialCommunityIcons name="file-pdf-box" size={24} color={colors.danger} />
          <Text style={[styles.pickImgBtnText, { color: colors.dangerDark }]}>{uploadingPdf ? 'Subiendo...' : 'PDF / Estudio'}</Text>
        </TouchableOpacity>
      </View>

      {attachments.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0, marginVertical: spacing.sm }}>
          {attachments.map((a, idx) => (
            <View key={idx} style={styles.attachmentThumbWrap}>
              {a.kind === 'pdf' ? (
                <View style={styles.pdfThumb}>
                  <MaterialCommunityIcons name="file-pdf-box" size={32} color={colors.danger} />
                  <Text style={styles.pdfThumbText} numberOfLines={2}>{a.caption || 'PDF'}</Text>
                </View>
              ) : (
                <Image source={{ uri: a.url }} style={styles.attachmentThumb} />
              )}
              <TouchableOpacity
                style={styles.attachmentRemove}
                onPress={() => setAttachments((current) => current.filter((_, i) => i !== idx))}
              >
                <MaterialCommunityIcons name="close-circle" size={20} color={colors.danger} />
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      )}

      <View style={styles.footer}>
        {onCancel && <Button title="Cancelar" onPress={onCancel} variant="outline" size="md" style={{ flex: 1, marginRight: spacing.sm }} />}
        <Button
          title={submitLabel}
          onPress={handleSubmit}
          loading={submitting}
          variant="accent"
          size="lg"
          fullWidth={!onCancel}
          style={onCancel ? { flex: 2 } : undefined}
        />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  content: { padding: spacing.xl, paddingBottom: spacing['3xl'] },
  label: { fontFamily: fonts.nunito.semiBold, fontSize: fontSizes.sm, color: colors.textDark, marginBottom: spacing.xs, marginTop: spacing.sm },
  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md },
  typeOption: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bgCard,
  },
  typeOptionActive: { backgroundColor: colors.primarySoft, borderColor: colors.primary },
  typeText: { fontFamily: fonts.nunito.bold, fontSize: fontSizes.sm, color: colors.textDark },
  typeTextActive: { color: colors.primaryDark },
  templateChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.accentSoft,
    marginRight: spacing.sm,
  },
  templateText: { fontFamily: fonts.nunito.bold, fontSize: fontSizes.xs, color: colors.accentDark },
  vitalsRow: { flexDirection: 'row' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.sm, marginBottom: spacing.xs },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  addBtnText: { fontFamily: fonts.nunito.bold, fontSize: fontSizes.xs, color: colors.primaryDark },
  doseCard: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.hairline,
  },
  doseHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xs },
  doseTitle: { fontFamily: fonts.nunito.bold, fontSize: fontSizes.sm, color: colors.textDark },
  toggleRow: { flexDirection: 'row', marginBottom: spacing.sm },
  toggleOption: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  toggleText: { fontFamily: fonts.nunito.semiBold, fontSize: fontSizes.sm, color: colors.textDark },
  nextDoseBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bgCard,
    marginBottom: spacing.md,
  },
  nextDoseText: { flex: 1, fontFamily: fonts.nunito.semiBold, fontSize: fontSizes.sm, color: colors.textDark },
  pickImgBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.primary,
    borderStyle: 'dashed',
    backgroundColor: colors.primarySoft,
  },
  pickImgBtnText: { fontFamily: fonts.nunito.bold, fontSize: fontSizes.sm, color: colors.primaryDark },
  attachButtonsRow: { flexDirection: 'row' },
  pdfThumb: { width: 80, height: 80, borderRadius: 8, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surfaceMuted, alignItems: 'center', justifyContent: 'center', padding: spacing.xs },
  pdfThumbText: { fontFamily: fonts.nunito.regular, fontSize: 9, color: colors.textMuted, textAlign: 'center' },
  attachmentThumbWrap: { position: 'relative', marginRight: spacing.sm },
  attachmentThumb: { width: 80, height: 80, borderRadius: 8, borderWidth: 1, borderColor: colors.border },
  attachmentRemove: { position: 'absolute', top: -6, right: -6 },
  footer: { flexDirection: 'row', marginTop: spacing.lg },
});

export default MedicalRecordForm;
