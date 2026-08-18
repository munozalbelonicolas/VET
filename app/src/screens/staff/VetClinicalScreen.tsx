// ============================================================
// Veterinaria La Plata — Vet Clinical Management Screen (GIS)
// Búsqueda server-side, lista de pacientes y expediente integrado
// ============================================================
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, fonts, fontSizes, spacing, borderRadius, letterSpacing } from '../../config/theme';
import { Card, Badge, Button, Input } from '../../components/ui';
import { Pet } from '../../types';
import { searchPets, markFollowUpsOverdue } from '../../services/staffService';
import { QueueItem, subscribeToQueue, updateQueueStatus } from '../../services/waitingRoomService';
import { PetRecordScreen } from './PetRecordScreen';
import { useAuthStore } from '../../store/authStore';

export const VetClinicalScreen: React.FC = () => {
  const { user } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [pets, setPets] = useState<Pet[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedPet, setSelectedPet] = useState<Pet | null>(null);
  const [pendingDiagnosis, setPendingDiagnosis] = useState<string | undefined>(undefined);
  const [queueItems, setQueueItems] = useState<QueueItem[]>([]);

  const runSearch = useCallback(async (text: string) => {
    setSearching(true);
    try {
      const results = await searchPets(text, 30);
      setPets(results);
    } catch (error) {
      console.log('search error:', error);
      setPets([]);
    } finally {
      setSearching(false);
    }
  }, []);

  // Debounce de búsqueda
  useEffect(() => {
    const timer = setTimeout(() => runSearch(searchQuery), searchQuery.trim() ? 300 : 0);
    return () => clearTimeout(timer);
  }, [searchQuery, runSearch]);

  // Cola en tiempo real
  useEffect(() => {
    const unsubscribe = subscribeToQueue((items) => setQueueItems(items));
    markFollowUpsOverdue();
    return () => unsubscribe();
  }, []);

  const handleAttendQueueItem = async (item: QueueItem) => {
    try {
      await updateQueueStatus(item.id, 'in_consultation');
    } catch (error) {
      console.log('queue status error:', error);
    }

    const openWith = (pet: Pet) => {
      setPendingDiagnosis(item.reason || undefined);
      setSelectedPet(pet);
    };

    if (item.petId) {
      // Vincular por petId confiable
      try {
        const found = pets.find((p) => p.id === item.petId);
        if (found) {
          openWith(found);
          return;
        }
      } catch (error) {
        console.log('pet lookup error:', error);
      }
    }

    // Fallback por nombre
    const matched = pets.find((p) => p.name.toLowerCase() === item.petName.toLowerCase());
    if (matched) {
      openWith(matched);
      return;
    }

    Alert.alert(
      'Paciente no encontrado',
      'No hay una ficha de este paciente. Registrá la mascota para poder cargar su historia clínica.'
    );
  };

  // Vista de expediente
  if (selectedPet) {
    return <PetRecordScreen pet={selectedPet} onBack={() => { setSelectedPet(null); setPendingDiagnosis(undefined); }} prefillDiagnosis={pendingDiagnosis} />;
  }

  const renderPetItem = ({ item }: { item: Pet }) => (
    <TouchableOpacity onPress={() => setSelectedPet(item)} activeOpacity={0.8}>
      <Card variant="elevated" style={styles.petRowCard}>
        <View style={styles.petAvatar}>
          <MaterialCommunityIcons
            name={item.species === 'dog' ? 'dog' : 'cat'}
            size={26}
            color={colors.primary}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.petName}>{item.name}</Text>
          <Text style={styles.petMeta}>
            {item.breed || item.species} • {item.currentWeight} kg
          </Text>
        </View>
        <Badge
          label={item.healthStatus === 'green' ? 'OK' : 'Atención'}
          variant={item.healthStatus === 'green' ? 'success' : 'warning'}
          size="sm"
        />
        <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textLight} />
      </Card>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Historias Clínicas 🩺</Text>
          <Text style={styles.subtitle}>Buscá pacientes y abrí su expediente</Text>
        </View>
      </View>

      {/* Search */}
      <View style={{ paddingHorizontal: spacing.lg, marginBottom: spacing.md }}>
        <Input
          placeholder="🔍 Buscar por mascota, raza o dueño..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          leftIcon="magnify"
        />
      </View>

      {/* Cola de espera */}
      {queueItems.filter((q) => q.status !== 'completed').length > 0 && (
        <View style={{ marginBottom: spacing.md }}>
          <Text style={styles.sectionLabel}>🎟️ En sala de espera</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: spacing.lg }}>
            {queueItems
              .filter((q) => q.status !== 'completed')
              .map((q) => (
                <Card key={q.id} variant="elevated" style={styles.queueCard}>
                  <View style={styles.queueHeader}>
                    <Badge label={q.ticketNumber} variant="primary" size="sm" />
                    <Badge
                      label={q.status === 'calling' ? 'Llamando' : q.status === 'in_consultation' ? 'En atención' : 'Esperando'}
                      variant={q.status === 'calling' ? 'warning' : q.status === 'in_consultation' ? 'info' : 'muted'}
                      size="sm"
                    />
                  </View>
                  <Text style={styles.queuePet}>{q.petName} 🐾</Text>
                  <Text style={styles.queueOwner} numberOfLines={1}>Dueño: {q.ownerName}</Text>
                  <Text style={styles.queueReason} numberOfLines={1}>{q.reason}</Text>
                  <Button
                    title="🩺 Abrir expediente"
                    size="sm"
                    variant="accent"
                    style={{ marginTop: spacing.sm }}
                    onPress={() => handleAttendQueueItem(q)}
                  />
                </Card>
              ))}
          </ScrollView>
        </View>
      )}

      {/* Lista de pacientes */}
      <Text style={styles.sectionLabel}>
        {searchQuery.trim() ? `Resultados (${pets.length})` : 'Pacientes recientes'}
      </Text>

      {searching ? (
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={pets}
          keyExtractor={(item) => item.id}
          renderItem={renderPetItem}
          contentContainerStyle={styles.list}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={
            <Card variant="outlined" style={styles.emptyCard}>
              <MaterialCommunityIcons name="paw-off-outline" size={40} color={colors.textLight} />
              <Text style={styles.emptyText}>
                {searchQuery.trim()
                  ? 'No se encontraron pacientes con esa búsqueda.'
                  : 'No hay pacientes cargados todavía.'}
              </Text>
            </Card>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgMain },
  header: { paddingHorizontal: spacing.lg, paddingTop: spacing['2xl'], paddingBottom: spacing.md },
  title: { fontFamily: fonts.quicksand.bold, fontSize: fontSizes.xl, color: colors.textDark, letterSpacing: letterSpacing.display },
  subtitle: { fontFamily: fonts.nunito.regular, fontSize: fontSizes.sm, color: colors.textMuted, marginTop: 2 },
  sectionLabel: { fontFamily: fonts.nunito.bold, fontSize: fontSizes.sm, color: colors.textDark, paddingHorizontal: spacing.lg, marginBottom: spacing.sm, marginTop: spacing.xs },
  list: { paddingHorizontal: spacing.lg, paddingBottom: 120, flexGrow: 1 },
  centerState: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyCard: { alignItems: 'center', padding: spacing.xl, gap: spacing.sm },
  emptyText: { fontFamily: fonts.nunito.regular, fontSize: fontSizes.sm, color: colors.textMuted, textAlign: 'center' },
  petRowCard: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, marginBottom: spacing.sm, gap: spacing.md },
  petAvatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  petName: { fontFamily: fonts.quicksand.bold, fontSize: fontSizes.md, color: colors.textDark },
  petMeta: { fontFamily: fonts.nunito.regular, fontSize: fontSizes.xs, color: colors.textMuted, marginTop: 2 },
  queueCard: { padding: spacing.md, marginRight: spacing.sm, width: 190, backgroundColor: colors.bgCard },
  queueHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 },
  queuePet: { fontFamily: fonts.quicksand.bold, fontSize: fontSizes.sm, color: colors.textDark, marginTop: 4 },
  queueOwner: { fontFamily: fonts.nunito.regular, fontSize: 10, color: colors.textMuted },
  queueReason: { fontFamily: fonts.nunito.bold, fontSize: 10, color: colors.primaryDark, marginTop: 2 },
});

export default VetClinicalScreen;
