// ============================================================
// Veterinaria La Plata — Pet Detail Screen (Fase 2)
// ============================================================
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, fonts, fontSizes, spacing, borderRadius, shadows } from '../../config/theme';
import { Card, Badge, Button } from '../../components/ui';
import { Pet } from '../../types';

interface PetDetailScreenProps {
  pet: Pet;
  onBack: () => void;
  onBookAppointment: () => void;
}

export const PetDetailScreen: React.FC<PetDetailScreenProps> = ({
  pet,
  onBack,
  onBookAppointment,
}) => {
  const [activeTab, setActiveTab] = useState<'clinical' | 'calendar' | 'grooming'>('clinical');

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bgMain }}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Header Back */}
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
          {pet.ageYears !== undefined ? (
            <Badge label={`${pet.ageYears} años ${pet.ageMonths ? `${pet.ageMonths}m` : ''}`} variant="accent" size="md" />
          ) : null}
          <Badge label={`${pet.currentWeight} kg`} variant="primary" size="md" />
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
        <TouchableOpacity
          style={[styles.tab, activeTab === 'clinical' && styles.tabActive]}
          onPress={() => setActiveTab('clinical')}
        >
          <Text style={[styles.tabText, activeTab === 'clinical' && styles.tabTextActive]}>
            Historial Médico
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'calendar' && styles.tabActive]}
          onPress={() => setActiveTab('calendar')}
        >
          <Text style={[styles.tabText, activeTab === 'calendar' && styles.tabTextActive]}>
            Próximos Controles
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'grooming' && styles.tabActive]}
          onPress={() => setActiveTab('grooming')}
        >
          <Text style={[styles.tabText, activeTab === 'grooming' && styles.tabTextActive]}>
            Peluquería
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tab Content */}
      {activeTab === 'clinical' && (
        <View style={styles.tabContent}>
          <Card variant="outlined" style={styles.historyCard}>
            <View style={styles.historyHeader}>
              <Badge label="Vacunación" variant="primary" />
              <Text style={styles.historyDate}>15 May 2024</Text>
            </View>
            <Text style={styles.historyTitle}>Vacuna Quíntuple Anual</Text>
            <Text style={styles.historyDoctor}>Atendido por Dr. Alejandro Fernández</Text>
            <Text style={styles.historyNotes}>Aplicación exitosa sin reacciones adversas.</Text>
          </Card>

          <Card variant="outlined" style={styles.historyCard}>
            <View style={styles.historyHeader}>
              <Badge label="Consulta General" variant="success" />
              <Text style={styles.historyDate}>10 Feb 2024</Text>
            </View>
            <Text style={styles.historyTitle}>Control de Rutina y Desparasitación</Text>
            <Text style={styles.historyDoctor}>Atendido por Dr. Alejandro Fernández</Text>
            <Text style={styles.historyNotes}>Estado de salud general excelente. Peso adecuado.</Text>
          </Card>
        </View>
      )}

      {activeTab === 'calendar' && (
        <View style={styles.tabContent}>
          <Card variant="elevated" style={styles.eventCard}>
            <MaterialCommunityIcons name="needle" size={24} color={colors.primary} />
            <View style={{ flex: 1, marginLeft: spacing.md }}>
              <Text style={styles.eventTitle}>Próxima Vacuna Rabia</Text>
              <Text style={styles.eventDate}>Estimado: Noviembre 2026</Text>
            </View>
          </Card>
        </View>
      )}

      {activeTab === 'grooming' && (
        <View style={styles.tabContent}>
          <Card variant="outlined" style={styles.historyCard}>
            <View style={styles.historyHeader}>
              <Badge label="Baño + Corte" variant="accent" />
              <Text style={styles.historyDate}>01 Jun 2024</Text>
            </View>
            <Text style={styles.historyTitle}>Corte higiénico y deslanado</Text>
            <Text style={styles.historyDoctor}>Atendido por Laura Estética</Text>
          </Card>
        </View>
      )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgMain },
  content: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing['3xl'] },
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
  historyCard: { padding: spacing.lg },
  historyHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xs },
  historyDate: { fontFamily: fonts.nunito.regular, fontSize: fontSizes.xs, color: colors.textMuted },
  historyTitle: { fontFamily: fonts.quicksand.bold, fontSize: fontSizes.lg, color: colors.textDark },
  historyDoctor: { fontFamily: fonts.nunito.semiBold, fontSize: fontSizes.sm, color: colors.primaryDark, marginVertical: spacing.xs },
  historyNotes: { fontFamily: fonts.nunito.regular, fontSize: fontSizes.sm, color: colors.textMuted },
  eventCard: { flexDirection: 'row', alignItems: 'center', padding: spacing.lg },
  eventTitle: { fontFamily: fonts.nunito.bold, fontSize: fontSizes.md, color: colors.textDark },
  eventDate: { fontFamily: fonts.nunito.regular, fontSize: fontSizes.sm, color: colors.textMuted, marginTop: 2 },
});

export default PetDetailScreen;
