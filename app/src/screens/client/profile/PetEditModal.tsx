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
  Modal,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, fonts, fontSizes, spacing, borderRadius } from '../../../config/theme';
import { Button, Input } from '../../../components/ui';
import { Pet, PetSpecies, PetSex } from '../../../types';
import { updatePet } from '../../../services/dataService';
import { uploadImageBase64, uploadImage } from '../../../services/storageService';
import { useAuthStore } from '../../../store/authStore';

interface PetEditModalProps {
  visible: boolean;
  pet: Pet | null;
  onClose: () => void;
  onPetUpdated: () => void;
}

export const PetEditModal: React.FC<PetEditModalProps> = ({ visible, pet, onClose, onPetUpdated }) => {
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

  // Sync state when pet changes
  React.useEffect(() => {
    if (pet) {
      setName(pet.name);
      setSpecies(pet.species);
      setBreed(pet.breed);
      setAgeYears(pet.ageYears?.toString() || '');
      setAgeMonths(pet.ageMonths?.toString() || '');
      setSex(pet.sex);
      setWeight(pet.currentWeight.toString());
      setNotes(pet.notes || '');
      setImageUri(null); // Reset local image pick
      setImageBase64(null);
    }
  }, [pet]);

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
    if (!pet || !user) return;
    if (!name.trim()) {
      Alert.alert('Error', 'Ingresá el nombre de la mascota');
      return;
    }
    if (!breed.trim()) {
      Alert.alert('Error', 'Ingresá la raza o cruza');
      return;
    }

    const yrs = Math.max(0, parseInt(ageYears, 10) || 0);
    const mths = Math.max(0, parseInt(ageMonths, 10) || 0);

    if (yrs === 0 && mths === 0) {
      Alert.alert('Error', 'Ingresá la edad de la mascota');
      return;
    }

    // Recalculamos birthDate aproximado a partir de la edad
    const calculatedBirthDate = new Date();
    calculatedBirthDate.setFullYear(calculatedBirthDate.getFullYear() - yrs);
    calculatedBirthDate.setMonth(calculatedBirthDate.getMonth() - mths);

    setLoading(true);
    try {
      let avatarUrl: string | undefined = pet.avatarUrl;

      if (imageBase64 || imageUri) {
        setUploadingImage(true);
        try {
          const fileName = `pet-${user.id}-${Date.now()}.jpg`;
          if (imageBase64) {
            avatarUrl = await uploadImageBase64(imageBase64, `pets/avatars/${fileName}`);
          } else if (imageUri) {
            avatarUrl = await uploadImage(imageUri, `pets/avatars/${fileName}`);
          }
        } finally {
          setUploadingImage(false);
        }
      }

      const petUpdateData: Partial<Pet> = {
        name: name.trim(),
        species,
        breed: breed.trim(),
        birthDate: calculatedBirthDate,
        ageYears: yrs,
        ageMonths: mths,
        sex,
        currentWeight: Math.max(0, parseFloat(weight) || 0),
        notes,
      };

      if (avatarUrl !== undefined) {
        petUpdateData.avatarUrl = avatarUrl;
      }

      await updatePet(pet.id, petUpdateData);

      onPetUpdated();
      onClose();
    } catch (error) {
      console.log('Error updating pet', error);
      Alert.alert('Error', 'Hubo un problema al actualizar los datos');
    } finally {
      setLoading(false);
    }
  };

  if (!pet) return null;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Editar a {pet.name}</Text>
          <TouchableOpacity onPress={onClose} disabled={loading}>
            <MaterialCommunityIcons name="close" size={24} color={colors.textDark} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          {/* Avatar Upload */}
          <View style={styles.avatarContainer}>
            <TouchableOpacity onPress={pickImage} style={styles.avatarWrapper}>
              {imageUri || pet.avatarUrl ? (
                <Image source={{ uri: imageUri || pet.avatarUrl }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <MaterialCommunityIcons name="camera" size={32} color={colors.primary} />
                </View>
              )}
              <View style={styles.editBadge}>
                <MaterialCommunityIcons name="pencil" size={14} color="#FFF" />
              </View>
            </TouchableOpacity>
            <Text style={styles.avatarHint}>Cambiar foto de {pet.name}</Text>
          </View>

          {/* Form */}
          <Text style={styles.label}>Nombre de la mascota</Text>
          <Input placeholder="Ej: Luna" value={name} onChangeText={setName} />

          <Text style={styles.label}>Especie</Text>
          <View style={styles.row}>
            <TouchableOpacity
              style={[styles.selectorBtn, species === 'dog' && styles.selectorBtnActive]}
              onPress={() => setSpecies('dog')}
            >
              <MaterialCommunityIcons name="dog" size={20} color={species === 'dog' ? colors.primaryDark : colors.textMuted} />
              <Text style={[styles.selectorText, species === 'dog' && styles.selectorTextActive]}>Perro</Text>
            </TouchableOpacity>
            <View style={{ width: spacing.md }} />
            <TouchableOpacity
              style={[styles.selectorBtn, species === 'cat' && styles.selectorBtnActive]}
              onPress={() => setSpecies('cat')}
            >
              <MaterialCommunityIcons name="cat" size={20} color={species === 'cat' ? colors.primaryDark : colors.textMuted} />
              <Text style={[styles.selectorText, species === 'cat' && styles.selectorTextActive]}>Gato</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>Raza o Cruza</Text>
          <Input placeholder="Ej: Mestizo, Caniche, Siamés..." value={breed} onChangeText={setBreed} />

          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Años</Text>
              <Input placeholder="Ej: 3" value={ageYears} onChangeText={setAgeYears} keyboardType="numeric" />
            </View>
            <View style={{ width: spacing.md }} />
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Meses</Text>
              <Input placeholder="Ej: 5" value={ageMonths} onChangeText={setAgeMonths} keyboardType="numeric" />
            </View>
          </View>

          <Text style={styles.label}>Sexo</Text>
          <View style={styles.row}>
            <TouchableOpacity
              style={[styles.selectorBtn, sex === 'male' && styles.selectorBtnActive]}
              onPress={() => setSex('male')}
            >
              <MaterialCommunityIcons name="gender-male" size={20} color={sex === 'male' ? colors.primaryDark : colors.textMuted} />
              <Text style={[styles.selectorText, sex === 'male' && styles.selectorTextActive]}>Macho</Text>
            </TouchableOpacity>
            <View style={{ width: spacing.md }} />
            <TouchableOpacity
              style={[styles.selectorBtn, sex === 'female' && styles.selectorBtnActive]}
              onPress={() => setSex('female')}
            >
              <MaterialCommunityIcons name="gender-female" size={20} color={sex === 'female' ? colors.primaryDark : colors.textMuted} />
              <Text style={[styles.selectorText, sex === 'female' && styles.selectorTextActive]}>Hembra</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>Peso actual (Kg)</Text>
          <Input placeholder="Ej: 12.5" value={weight} onChangeText={setWeight} keyboardType="numeric" />

          <Text style={styles.label}>Notas o condiciones (Opcional)</Text>
          <Input
            placeholder="Ej: Alérgico al pollo, tiene miedo a los truenos..."
            value={notes}
            onChangeText={setNotes}
            multiline
            style={{ height: 80 }}
          />

        </ScrollView>

        <View style={styles.footer}>
          <Button
            title={uploadingImage ? 'Subiendo imagen...' : 'Guardar Cambios'}
            onPress={handleSubmit}
            loading={loading}
            fullWidth
            disabled={uploadingImage}
          />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgMain },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: { fontFamily: fonts.quicksand.bold, fontSize: fontSizes.xl, color: colors.textDark },
  content: { padding: spacing.lg },
  label: { fontFamily: fonts.nunito.semiBold, fontSize: fontSizes.sm, color: colors.textDark, marginBottom: spacing.xs, marginTop: spacing.md },
  row: { flexDirection: 'row' },
  selectorBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bgCard,
  },
  selectorBtnActive: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  selectorText: { fontFamily: fonts.nunito.semiBold, fontSize: fontSizes.sm, color: colors.textMuted, marginLeft: spacing.xs },
  selectorTextActive: { color: colors.primaryDark },
  footer: { padding: spacing.lg, borderTopWidth: 1, borderTopColor: colors.border },
  avatarContainer: { alignItems: 'center', marginBottom: spacing.xl },
  avatarWrapper: { position: 'relative' },
  avatar: { width: 100, height: 100, borderRadius: 50, backgroundColor: colors.bgOverlay },
  avatarPlaceholder: { width: 100, height: 100, borderRadius: 50, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  editBadge: { position: 'absolute', bottom: 0, right: 0, backgroundColor: colors.primary, width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: colors.bgMain },
  avatarHint: { fontFamily: fonts.nunito.semiBold, fontSize: fontSizes.sm, color: colors.primaryDark, marginTop: spacing.sm },
});
