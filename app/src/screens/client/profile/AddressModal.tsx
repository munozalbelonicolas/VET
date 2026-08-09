import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TextInput, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, fonts, fontSizes, spacing, borderRadius } from '../../../config/theme';
import { Button } from '../../../components/ui';
import { updateUserProfile } from '../../../services/userService';
import { useAuthStore } from '../../../store/authStore';

interface AddressModalProps {
  visible: boolean;
  onClose: () => void;
}

export const AddressModal: React.FC<AddressModalProps> = ({ visible, onClose }) => {
  const { user } = useAuthStore();
  const address = user?.address || { street: '', number: '', floor: '', apartment: '', city: 'La Plata', province: 'Buenos Aires', zipCode: '1900' };

  const [street, setStreet] = useState(address.street);
  const [number, setNumber] = useState(address.number);
  const [floor, setFloor] = useState(address.floor || '');
  const [apartment, setApartment] = useState(address.apartment || '');
  const [notes, setNotes] = useState(address.notes || '');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!user) return;
    setIsSaving(true);
    await updateUserProfile(user.id, {
      address: {
        street,
        number,
        floor,
        apartment,
        city: 'La Plata', // Fixed for this app
        province: 'Buenos Aires',
        zipCode: '1900',
        notes,
      },
    });
    setIsSaving(false);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.header}>
          <Text style={styles.title}>Dirección de Entrega</Text>
          <MaterialCommunityIcons name="close" size={24} color={colors.textDark} onPress={onClose} />
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.row}>
            <View style={{ flex: 2, marginRight: spacing.sm }}>
              <Text style={styles.label}>Calle</Text>
              <TextInput style={styles.input} value={street} onChangeText={setStreet} placeholder="Ej. Calle 7" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Número</Text>
              <TextInput style={styles.input} value={number} onChangeText={setNumber} placeholder="Ej. 1234" keyboardType="numeric" />
            </View>
          </View>

          <View style={styles.row}>
            <View style={{ flex: 1, marginRight: spacing.sm }}>
              <Text style={styles.label}>Piso (Opcional)</Text>
              <TextInput style={styles.input} value={floor} onChangeText={setFloor} placeholder="Ej. 2" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Depto (Opcional)</Text>
              <TextInput style={styles.input} value={apartment} onChangeText={setApartment} placeholder="Ej. B" />
            </View>
          </View>

          <Text style={styles.label}>Aclaraciones adicionales</Text>
          <TextInput
            style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
            value={notes}
            onChangeText={setNotes}
            placeholder="Ej. Tocar timbre rojo, dejar en portería..."
            multiline
          />

          <View style={styles.infoBox}>
            <MaterialCommunityIcons name="information-outline" size={20} color={colors.primaryDark} />
            <Text style={styles.infoText}>Actualmente solo realizamos envíos dentro del casco urbano de La Plata.</Text>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <Button title="Guardar Dirección" onPress={handleSave} loading={isSaving} fullWidth />
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgMain },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.border },
  title: { fontFamily: fonts.quicksand.bold, fontSize: fontSizes.xl, color: colors.textDark },
  content: { padding: spacing.lg },
  row: { flexDirection: 'row' },
  label: { fontFamily: fonts.nunito.semiBold, fontSize: fontSizes.sm, color: colors.textDark, marginBottom: spacing.xs },
  input: { backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border, borderRadius: borderRadius.md, padding: spacing.md, fontFamily: fonts.nunito.regular, fontSize: fontSizes.md, color: colors.textDark, marginBottom: spacing.md },
  infoBox: { flexDirection: 'row', backgroundColor: colors.primarySoft, padding: spacing.md, borderRadius: borderRadius.md, marginTop: spacing.md, alignItems: 'center' },
  infoText: { flex: 1, marginLeft: spacing.sm, fontFamily: fonts.nunito.semiBold, fontSize: fontSizes.sm, color: colors.primaryDark },
  footer: { padding: spacing.lg, borderTopWidth: 1, borderTopColor: colors.border },
});
