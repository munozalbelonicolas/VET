// ============================================================
// Veterinaria La Plata — Add Pet Modal/Screen
// ============================================================
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
  ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, fonts, fontSizes, spacing, shadows } from '../../config/theme';
import { Button, Input } from '../../components/ui';
import { Pet, PetSpecies, PetSex } from '../../types';
import { addPet } from '../../services/dataService';
import { uploadImageBase64 } from '../../services/storageService';
import { useAuthStore } from '../../store/authStore';

interface AddPetModalProps {
  onClose: () => void;
  onPetAdded: (pet: Pet) => void;
}

export const AddPetModal: React.FC<AddPetModalProps> = ({ onClose, onPetAdded }) => {
  const { user } = useAuthStore();
  const [name, setName] = useState('');
  const [species, setSpecies] = useState<PetSpecies>('dog');
  const [breed, setBreed] = useState('');
  const [ageYears, setAgeYears] = useState('');
  const [ageMonths, setAgeMonths] = useState('');
  const [sex, setSex] = useState<PetSex>('male');
  const [weight, setWeight] = useState('');
  const [notes, setNotes] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
        base64: true,
      });

      if (!result.canceled) {
        setImageUri(result.assets[0].uri);
        setImageBase64(result.assets[0].base64 || null);
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo abrir la galería');
    }
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Ingresá el nombre de la mascota');
      return;
    }
    if (!breed.trim()) {
      Alert.alert('Error', 'Ingresá la raza o cruza');
      return;
    }

    const yrs = parseInt(ageYears, 10) || 0;
    const mths = parseInt(ageMonths, 10) || 0;
    const calculatedBirthDate = new Date();
    calculatedBirthDate.setFullYear(calculatedBirthDate.getFullYear() - yrs);
    calculatedBirthDate.setMonth(calculatedBirthDate.getMonth() - mths);

    setLoading(true);
    try {
      let avatarUrl = '';
      if (imageBase64) {
        setUploadingImage(true);
        // Create a temporary ID or use timestamp for the new pet image
        const fileName = `pet-${user.id}-${Date.now()}.jpg`;
        avatarUrl = await uploadImageBase64(imageBase64, `pets/avatars/${fileName}`);
        setUploadingImage(false);
      } else if (imageUri) {
        setUploadingImage(true);
        const fileName = `pet-${user.id}-${Date.now()}.jpg`;
        avatarUrl = await uploadImage(imageUri, `pets/avatars/${fileName}`);
        setUploadingImage(false);
      }

      const newPet = await addPet({
        ownerId: user?.id || 'client-001',
        name,
        species,
        breed,
        birthDate: calculatedBirthDate,
        ageYears: yrs,
        ageMonths: mths,
        sex,
        currentWeight: parseFloat(weight) || 0,
        healthStatus: 'green',
        notes,
        avatarUrl,
      });

      Alert.alert('¡Éxito! 🐾', `${name} fue agregado correctamente.`);
      onPetAdded(newPet);
      onClose();
    } catch (error) {
      Alert.alert('Error', 'No se pudo guardar la mascota.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Agregar Mascota 🐾</Text>
        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
          <MaterialCommunityIcons name="close" size={24} color={colors.textDark} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Species selector */}
        <Text style={styles.label}>Especie</Text>
        <View style={styles.speciesContainer}>
          <TouchableOpacity
            style={[styles.speciesCard, species === 'dog' && styles.speciesCardActive]}
            onPress={() => setSpecies('dog')}
          >
            <MaterialCommunityIcons
              name="dog"
              size={36}
              color={species === 'dog' ? colors.primary : colors.textMuted}
            />
            <Text style={[styles.speciesText, species === 'dog' && styles.speciesTextActive]}>
              Perro
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.speciesCard, species === 'cat' && styles.speciesCardActive]}
            onPress={() => setSpecies('cat')}
          >
            <MaterialCommunityIcons
              name="cat"
              size={36}
              color={species === 'cat' ? colors.accent : colors.textMuted}
            />
            <Text style={[styles.speciesText, species === 'cat' && styles.speciesTextActive]}>
              Gato
            </Text>
          </TouchableOpacity>
        </View>

        {/* Avatar Upload */}
        <Text style={styles.label}>Foto de perfil (Opcional)</Text>
        <TouchableOpacity style={styles.avatarContainer} onPress={pickImage} disabled={uploadingImage}>
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.avatarImage} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <MaterialCommunityIcons name="camera-plus" size={32} color={colors.textMuted} />
              <Text style={styles.avatarPlaceholderText}>Subir foto</Text>
            </View>
          )}
          {uploadingImage && (
            <View style={styles.avatarOverlay}>
              <ActivityIndicator color="#FFF" />
            </View>
          )}
        </TouchableOpacity>

        {/* Inputs */}
        <Input
          label="Nombre de la mascota"
          placeholder="Ej: Luna, Firulais..."
          value={name}
          onChangeText={setName}
          leftIcon="paw"
        />

        <Input
          label="Raza"
          placeholder="Ej: Labradot, Siamés, Mestizo..."
          value={breed}
          onChangeText={setBreed}
          leftIcon="shape-outline"
        />

        {/* Age Inputs */}
        <Text style={styles.label}>Edad de la mascota</Text>
        <View style={styles.ageRow}>
          <View style={{ flex: 1 }}>
            <Input
              label="Años"
              placeholder="Ej: 3"
              value={ageYears}
              onChangeText={setAgeYears}
              keyboardType="numeric"
              leftIcon="calendar-text-outline"
            />
          </View>
          <View style={{ flex: 1 }}>
            <Input
              label="Meses"
              placeholder="Ej: 6"
              value={ageMonths}
              onChangeText={setAgeMonths}
              keyboardType="numeric"
              leftIcon="calendar-month-outline"
            />
          </View>
        </View>

        {/* Sex */}
        <Text style={styles.label}>Sexo</Text>
        <View style={styles.sexContainer}>
          <TouchableOpacity
            style={[styles.sexOption, sex === 'male' && styles.sexOptionActive]}
            onPress={() => setSex('male')}
          >
            <Text style={[styles.sexText, sex === 'male' && styles.sexTextActive]}>Macho ♂</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.sexOption, sex === 'female' && styles.sexOptionActive]}
            onPress={() => setSex('female')}
          >
            <Text style={[styles.sexText, sex === 'female' && styles.sexTextActive]}>Hembra ♀</Text>
          </TouchableOpacity>
        </View>

        <Input
          label="Peso actual (kg)"
          placeholder="Ej: 12.5"
          value={weight}
          onChangeText={setWeight}
          keyboardType="numeric"
          leftIcon="scale-bathroom"
        />

        <Input
          label="Observaciones o notas"
          placeholder="Ej: Alérgico a polen, temeroso..."
          value={notes}
          onChangeText={setNotes}
          leftIcon="text-box-outline"
          multiline
        />

        <Button
          title="Guardar Mascota"
          onPress={handleSubmit}
          loading={loading}
          variant="primary"
          size="lg"
          fullWidth
          style={{ marginTop: spacing.lg }}
        />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgMain, paddingTop: spacing.xl },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: { fontFamily: fonts.quicksand.bold, fontSize: fontSizes.xl, color: colors.textDark },
  closeBtn: { padding: spacing.xs },
  content: { padding: spacing.xl },
  label: { fontFamily: fonts.nunito.semiBold, fontSize: fontSizes.sm, color: colors.textDark, marginBottom: spacing.xs },
  speciesContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.lg },
  speciesCard: {
    flex: 0.48,
    backgroundColor: colors.bgCard,
    borderRadius: 16,
    padding: spacing.lg,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.border,
  },
  speciesCardActive: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  speciesText: { fontFamily: fonts.nunito.bold, fontSize: fontSizes.md, color: colors.textMuted, marginTop: spacing.xs },
  speciesTextActive: { color: colors.primaryDark },
  avatarContainer: { alignSelf: 'center', marginVertical: spacing.md, position: 'relative' },
  avatarImage: { width: 100, height: 100, borderRadius: 50 },
  avatarPlaceholder: { width: 100, height: 100, borderRadius: 50, backgroundColor: colors.bgCard, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: colors.border, borderStyle: 'dashed' },
  avatarPlaceholderText: { fontSize: fontSizes.xs, color: colors.textMuted, marginTop: spacing.xs, fontFamily: fonts.nunito.semiBold },
  avatarOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 50, alignItems: 'center', justifyContent: 'center' },
  sexContainer: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.lg },
  sexOption: {
    flex: 1,
    paddingVertical: spacing.md,
    backgroundColor: colors.bgCard,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  sexOptionActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  sexText: { fontFamily: fonts.nunito.bold, color: colors.textMuted },
  sexTextActive: { color: colors.textWhite },
  ageRow: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.xs },
});

export default AddPetModal;
