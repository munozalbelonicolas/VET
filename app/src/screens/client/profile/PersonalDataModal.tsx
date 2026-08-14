import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TextInput, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, fonts, fontSizes, spacing, borderRadius } from '../../../config/theme';
import { Button } from '../../../components/ui';
import { User } from '../../../types';
import { updateUserProfile } from '../../../services/dataService';
import { uploadImageBase64, uploadImage } from '../../../services/storageService';
import { useAuthStore } from '../../../store/authStore';

interface PersonalDataModalProps {
  visible: boolean;
  onClose: () => void;
}

export const PersonalDataModal: React.FC<PersonalDataModalProps> = ({ visible, onClose }) => {
  const { user } = useAuthStore();
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

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
      console.log('Error picking image', error);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    setIsSaving(true);
    let newAvatarUrl = user.avatarUrl;

    if (imageBase64) {
      const fileName = `user-${user.id}-${Date.now()}.jpg`;
      newAvatarUrl = await uploadImageBase64(imageBase64, `avatars/${user.id}/${fileName}`);
    } else if (imageUri) {
      const fileName = `user-${user.id}-${Date.now()}.jpg`;
      newAvatarUrl = await uploadImage(imageUri, `avatars/${user.id}/${fileName}`);
    }

    await updateUserProfile(user.id, { name, phone, avatarUrl: newAvatarUrl });
    setIsSaving(false);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView 
        style={styles.container} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Datos Personales</Text>
          <MaterialCommunityIcons name="close" size={24} color={colors.textDark} onPress={onClose} />
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.avatarContainer}>
            <TouchableOpacity onPress={pickImage} style={styles.avatarWrapper}>
              {imageUri || user?.avatarUrl ? (
                <Image source={{ uri: imageUri || user?.avatarUrl }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <MaterialCommunityIcons name="camera" size={32} color={colors.primary} />
                </View>
              )}
              <View style={styles.editBadge}>
                <MaterialCommunityIcons name="pencil" size={14} color="#FFF" />
              </View>
            </TouchableOpacity>
            <Text style={styles.avatarHint}>Cambiar foto de perfil</Text>
          </View>

          <Text style={styles.label}>Correo Electrónico (No editable)</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.bgOverlay, color: colors.textMuted }]}
            value={user?.email || ''}
            editable={false}
          />

          <Text style={styles.label}>Nombre Completo</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Ej. Juan Pérez"
          />

          <Text style={styles.label}>Teléfono</Text>
          <TextInput
            style={styles.input}
            value={phone}
            onChangeText={setPhone}
            placeholder="Ej. +54 221 555 1234"
            keyboardType="phone-pad"
          />
        </ScrollView>

        <View style={styles.footer}>
          <Button title="Guardar Cambios" onPress={handleSave} loading={isSaving} fullWidth />
        </View>
      </KeyboardAvoidingView>
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
  label: { fontFamily: fonts.nunito.semiBold, fontSize: fontSizes.sm, color: colors.textDark, marginBottom: spacing.xs },
  input: {
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontFamily: fonts.nunito.regular,
    fontSize: fontSizes.md,
    color: colors.textDark,
    marginBottom: spacing.md,
  },
  footer: { padding: spacing.lg, borderTopWidth: 1, borderTopColor: colors.border },
  avatarContainer: { alignItems: 'center', marginBottom: spacing.xl },
  avatarWrapper: { position: 'relative' },
  avatar: { width: 100, height: 100, borderRadius: 50, backgroundColor: colors.bgOverlay },
  avatarPlaceholder: { width: 100, height: 100, borderRadius: 50, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  editBadge: { position: 'absolute', bottom: 0, right: 0, backgroundColor: colors.primary, width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: colors.bgMain },
  avatarHint: { fontFamily: fonts.nunito.semiBold, fontSize: fontSizes.sm, color: colors.primaryDark, marginTop: spacing.sm },
});
