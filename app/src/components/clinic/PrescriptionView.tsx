// ============================================================
// Veterinaria La Plata — PrescriptionView
// Receta clínica imprimible/compartible
// ============================================================
import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Share, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, fonts, fontSizes, spacing, borderRadius, letterSpacing } from '../../config/theme';
import { Button } from '../ui';
import { Prescription } from '../../types';

interface PrescriptionViewProps {
  prescription: Prescription;
  vetName?: string;
  petBreed?: string;
  petOwnerName?: string;
  onClose?: () => void;
  showActions?: boolean;
}

const formatDate = (date: Date): string =>
  date.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

export const buildPrescriptionText = (
  p: Prescription,
  opts?: { petBreed?: string; petOwnerName?: string }
): string => {
  const lines: string[] = [];
  lines.push('VETERINARIA LA PLATA');
  lines.push('Receta Clínica');
  lines.push('------------------------------------');
  lines.push(`Fecha: ${formatDate(p.issuedAt)}`);
  lines.push(`Paciente: ${p.petName}${opts?.petBreed ? ` (${opts.petBreed})` : ''}`);
  if (opts?.petOwnerName) lines.push(`Titular: ${opts.petOwnerName}`);
  lines.push(`Veterinario/a: ${p.vetName}`);
  lines.push('------------------------------------');
  p.medications.forEach((m, i) => {
    lines.push(`${i + 1}. ${m.name}`);
    lines.push(`   Vía: ${m.via} | Dosis: ${m.dose}`);
    lines.push(`   Frecuencia: ${m.frequency}${m.duration ? ` | Duración: ${m.duration}` : ''}`);
  });
  if (p.indications) {
    lines.push('------------------------------------');
    lines.push(`Indicaciones: ${p.indications}`);
  }
  lines.push('');
  lines.push('Firma: ___________________________');
  return lines.join('\n');
};

export const sharePrescription = async (
  p: Prescription,
  opts?: { petBreed?: string; petOwnerName?: string }
): Promise<void> => {
  const text = buildPrescriptionText(p, opts);
  try {
    await Share.share(
      { message: text, title: `Receta de ${p.petName}` },
      { subject: `Receta clínica de ${p.petName}` }
    );
  } catch (error) {
    console.log('share error:', error);
    Alert.alert('Error', 'No se pudo compartir la receta.');
  }
};

export const PrescriptionView: React.FC<PrescriptionViewProps> = ({
  prescription,
  vetName,
  petBreed,
  petOwnerName,
  onClose,
  showActions = true,
}) => {
  const displayVetName = vetName || prescription.vetName;

  return (
    <View style={styles.screen}>
      {onClose && (
        <View style={styles.topBar}>
          <TouchableOpacity onPress={onClose} style={styles.backBtn}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={colors.textDark} />
          </TouchableOpacity>
          <Text style={styles.topTitle}>Receta Clínica</Text>
          <View style={{ width: 24 }} />
        </View>
      )}

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.paper}>
          {/* Encabezado clínica */}
          <View style={styles.clinicHeader}>
            <View style={styles.clinicLogo}>
              <MaterialCommunityIcons name="hospital-building" size={26} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.clinicName}>VETERINARIA LA PLATA</Text>
              <Text style={styles.clinicTagline}>Atención integral para tu mascota</Text>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Título receta */}
          <Text style={styles.recipeTitle}>Receta Clínica</Text>
          <Text style={styles.recipeDate}>{formatDate(prescription.issuedAt)}</Text>

          {/* Datos del paciente */}
          <View style={styles.infoBlock}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Paciente</Text>
              <Text style={styles.infoValue}>{prescription.petName}</Text>
            </View>
            {petBreed ? (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Raza</Text>
                <Text style={styles.infoValue}>{petBreed}</Text>
              </View>
            ) : null}
            {petOwnerName ? (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Titular</Text>
                <Text style={styles.infoValue}>{petOwnerName}</Text>
              </View>
            ) : null}
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Veterinario/a</Text>
              <Text style={styles.infoValue}>{displayVetName}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Medicación */}
          <Text style={styles.sectionLabel}>MEDICACIÓN INDICADA</Text>
          {prescription.medications.map((m, i) => (
            <View key={i} style={styles.medRow}>
              <View style={styles.medNumber}>
                <Text style={styles.medNumberText}>{i + 1}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.medName}>{m.name}</Text>
                <Text style={styles.medDetails}>
                  {m.via} • {m.dose}
                </Text>
                <Text style={styles.medDetails}>
                  Frecuencia: {m.frequency}
                  {m.duration ? ` • Duración: ${m.duration}` : ''}
                </Text>
              </View>
            </View>
          ))}

          {prescription.indications ? (
            <>
              <View style={styles.divider} />
              <Text style={styles.sectionLabel}>INDICACIONES</Text>
              <Text style={styles.indications}>{prescription.indications}</Text>
            </>
          ) : null}

          {/* Firma */}
          <View style={styles.signatureArea}>
            <Text style={styles.signatureLine}>________________________________</Text>
            <Text style={styles.signatureName}>{displayVetName}</Text>
            <Text style={styles.signatureRole}>Médico/a Veterinario/a</Text>
          </View>

          {/* Sello */}
          <View style={styles.stamp}>
            <MaterialCommunityIcons name="check-decagram" size={34} color={colors.primary} />
            <Text style={styles.stampText}>CLÍNICA</Text>
          </View>
        </View>

        {showActions && (
          <View style={styles.actions}>
            <Button
              title="Compartir receta"
              onPress={() => sharePrescription(prescription, { petBreed, petOwnerName })}
              variant="primary"
              size="lg"
              fullWidth
              icon={<MaterialCommunityIcons name="share-variant" size={18} color="#FFF" />}
              style={{ marginTop: spacing.lg }}
            />
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surfaceMuted },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing['2xl'],
    paddingBottom: spacing.md,
    backgroundColor: colors.bgMain,
  },
  backBtn: { padding: spacing.xs },
  topTitle: { fontFamily: fonts.quicksand.bold, fontSize: fontSizes.lg, color: colors.textDark, letterSpacing: letterSpacing.display },
  scrollContent: { padding: spacing.lg, paddingBottom: spacing['3xl'] },
  paper: {
    backgroundColor: colors.bgCard,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.hairline,
  },
  clinicHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  clinicLogo: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clinicName: { fontFamily: fonts.quicksand.bold, fontSize: fontSizes.md, color: colors.primaryDark, letterSpacing: 0.4 },
  clinicTagline: { fontFamily: fonts.nunito.regular, fontSize: fontSizes.xs, color: colors.textMuted },
  divider: { height: 1, backgroundColor: colors.hairline, marginVertical: spacing.lg },
  recipeTitle: { fontFamily: fonts.quicksand.bold, fontSize: fontSizes['2xl'], color: colors.textDark, letterSpacing: letterSpacing.display },
  recipeDate: { fontFamily: fonts.nunito.regular, fontSize: fontSizes.sm, color: colors.textMuted, marginTop: 2, textTransform: 'capitalize' },
  infoBlock: { marginTop: spacing.lg, gap: spacing.xs },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between' },
  infoLabel: { fontFamily: fonts.nunito.regular, fontSize: fontSizes.sm, color: colors.textMuted },
  infoValue: { fontFamily: fonts.nunito.bold, fontSize: fontSizes.sm, color: colors.textDark, flex: 1, textAlign: 'right' },
  sectionLabel: { fontFamily: fonts.nunito.bold, fontSize: fontSizes.xs, color: colors.primaryDark, letterSpacing: letterSpacing.caption, marginBottom: spacing.sm },
  medRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: spacing.md },
  medNumber: { width: 26, height: 26, borderRadius: 13, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center', marginRight: spacing.md, marginTop: 2 },
  medNumberText: { fontFamily: fonts.nunito.bold, fontSize: fontSizes.sm, color: colors.primaryDark },
  medName: { fontFamily: fonts.quicksand.bold, fontSize: fontSizes.md, color: colors.textDark },
  medDetails: { fontFamily: fonts.nunito.regular, fontSize: fontSizes.sm, color: colors.textMuted, marginTop: 1 },
  indications: { fontFamily: fonts.nunito.regular, fontSize: fontSizes.sm, color: colors.textDark, lineHeight: 20 },
  signatureArea: { marginTop: spacing['3xl'], alignItems: 'center' },
  signatureLine: { color: colors.textLight },
  signatureName: { fontFamily: fonts.nunito.bold, fontSize: fontSizes.md, color: colors.textDark, marginTop: spacing.xs },
  signatureRole: { fontFamily: fonts.nunito.regular, fontSize: fontSizes.xs, color: colors.textMuted },
  stamp: {
    position: 'absolute',
    right: spacing.xl,
    bottom: spacing.xl,
    alignItems: 'center',
    opacity: 0.5,
    transform: [{ rotate: '-12deg' }],
  },
  stampText: { fontFamily: fonts.quicksand.bold, fontSize: fontSizes.xs, color: colors.primary, letterSpacing: 1 },
  actions: { paddingHorizontal: spacing.sm },
});

export default PrescriptionView;
