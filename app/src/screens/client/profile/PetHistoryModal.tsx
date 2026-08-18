import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Modal, ScrollView, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, fonts, fontSizes, spacing, borderRadius } from '../../../config/theme';
import { Pet } from '../../../types';
import { getPetsByOwner } from '../../../services/dataService';
import { useAuthStore } from '../../../store/authStore';
import { PetEditModal } from './PetEditModal';

interface PetHistoryModalProps {
  visible: boolean;
  onClose: () => void;
}

export const PetHistoryModal: React.FC<PetHistoryModalProps> = ({ visible, onClose }) => {
  const { user } = useAuthStore();
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPet, setSelectedPet] = useState<Pet | null>(null);

  useEffect(() => {
    if (visible && user) {
      loadPets();
    }
  }, [visible, user]);

  const loadPets = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const userPets = await getPetsByOwner(user.id);
      setPets(userPets);
    } catch (e) {
      console.log('Error loading pets for history', e);
    }
    setLoading(false);
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Mis Mascotas</Text>
          <MaterialCommunityIcons name="close" size={24} color={colors.textDark} onPress={onClose} />
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.subtitle}>Seleccioná una mascota para editar su información o cambiar su foto.</Text>
          
          {loading ? (
            <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: spacing.xl }} />
          ) : pets.length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="paw-off" size={64} color={colors.border} />
              <Text style={styles.emptyText}>No tenés mascotas registradas aún.</Text>
            </View>
          ) : (
            pets.map((pet) => (
              <TouchableOpacity key={pet.id} style={styles.petCard} onPress={() => setSelectedPet(pet)}>
                {pet.avatarUrl ? (
                  <Image source={{ uri: pet.avatarUrl }} style={styles.petAvatar} />
                ) : (
                  <View style={[styles.petAvatar, { backgroundColor: colors.bgOverlay, justifyContent: 'center', alignItems: 'center' }]}>
                    <MaterialCommunityIcons name={pet.species === 'dog' ? 'dog' : 'cat'} size={32} color={colors.primary} />
                  </View>
                )}
                <View style={styles.petInfo}>
                  <Text style={styles.petName}>{pet.name}</Text>
                  <Text style={styles.petBreed}>
                    {pet.breed} • {pet.ageYears ? `${pet.ageYears} años` : pet.ageMonths ? `${pet.ageMonths} meses` : ''}
                  </Text>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={24} color={colors.textLight} />
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      </View>

      <PetEditModal
        visible={!!selectedPet}
        pet={selectedPet}
        onClose={() => setSelectedPet(null)}
        onPetUpdated={() => {
          setSelectedPet(null);
          loadPets();
        }}
      />
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgMain },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.border },
  title: { fontFamily: fonts.quicksand.bold, fontSize: fontSizes.xl, color: colors.textDark },
  content: { padding: spacing.lg },
  subtitle: { fontFamily: fonts.nunito.regular, fontSize: fontSizes.sm, color: colors.textMuted, marginBottom: spacing.lg },
  emptyState: { alignItems: 'center', paddingVertical: spacing['3xl'] },
  emptyText: { fontFamily: fonts.nunito.semiBold, fontSize: fontSizes.md, color: colors.textMuted, marginTop: spacing.md },
  petCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.bgCard, padding: spacing.md, borderRadius: borderRadius.md, marginBottom: spacing.md, borderWidth: 1, borderColor: colors.border },
  petAvatar: { width: 50, height: 50, borderRadius: 25, marginRight: spacing.md },
  petInfo: { flex: 1 },
  petName: { fontFamily: fonts.nunito.bold, fontSize: fontSizes.md, color: colors.textDark },
  petBreed: { fontFamily: fonts.nunito.regular, fontSize: fontSizes.sm, color: colors.textMuted },
});
