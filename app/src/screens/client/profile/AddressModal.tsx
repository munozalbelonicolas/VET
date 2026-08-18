import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TextInput, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, fonts, fontSizes, spacing, borderRadius } from '../../../config/theme';
import { Button } from '../../../components/ui';
import { updateUserProfile } from '../../../services/userService';
import { useAuthStore } from '../../../store/authStore';

interface AddressModalProps {
  visible: boolean;
  onClose: () => void;
}

const emptyAddress = {
  street: '',
  number: '',
  floor: '',
  apartment: '',
  city: 'La Plata',
  province: 'Buenos Aires',
  zipCode: '1900',
  notes: '',
};

export const AddressModal: React.FC<AddressModalProps> = ({ visible, onClose }) => {
  const { user } = useAuthStore();
  const address = user?.address || emptyAddress;

  const [street, setStreet] = useState(address.street);
  const [number, setNumber] = useState(address.number);
  const [floor, setFloor] = useState(address.floor || '');
  const [apartment, setApartment] = useState(address.apartment || '');
  const [city, setCity] = useState(address.city || 'La Plata');
  const [province, setProvince] = useState(address.province || 'Buenos Aires');
  const [zipCode, setZipCode] = useState(address.zipCode || '1900');
  const [notes, setNotes] = useState(address.notes || '');
  const [isSaving, setIsSaving] = useState(false);

  // Sincroniza el formulario cada vez que se abre el modal
  useEffect(() => {
    if (visible) {
      setStreet(address.street);
      setNumber(address.number);
      setFloor(address.floor || '');
      setApartment(address.apartment || '');
      setCity(address.city || 'La Plata');
      setProvince(address.province || 'Buenos Aires');
      setZipCode(address.zipCode || '1900');
      setNotes(address.notes || '');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const handleSave = async () => {
    if (!user) return;
    if (!street.trim() || !number.trim()) {
      Alert.alert('Error', 'Ingresá calle y número');
      return;
    }
    setIsSaving(true);
    try {
      await updateUserProfile(user.id, {
        address: {
          street: street.trim(),
          number: number.trim(),
          floor: floor.trim(),
          apartment: apartment.trim(),
          city: city.trim() || 'La Plata',
          province: province.trim() || 'Buenos Aires',
          zipCode: zipCode.trim() || '1900',
          notes: notes.trim(),
        },
      });
      onClose();
    } catch (error) {
      console.log('Error saving address', error);
      Alert.alert('Error', 'No se pudo guardar la dirección. Intentá de nuevo.');
    } finally {
      setIsSaving(false);
    }
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
              <TextInput style={styles.input} value={number} onChangeText={setNumber} placeholder="Ej. 1234" keyboardType="number-pad" />
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

          <Text style={styles.label}>Ciudad</Text>
          <TextInput style={styles.input} value={city} onChangeText={setCity} placeholder="Ej. La Plata" />

          <View style={styles.row}>
            <View style={{ flex: 2, marginRight: spacing.sm }}>
              <Text style={styles.label}>Provincia</Text>
              <TextInput style={styles.input} value={province} onChangeText={setProvince} placeholder="Ej. Buenos Aires" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Código Postal</Text>
              <TextInput style={styles.input} value={zipCode} onChangeText={setZipCode} placeholder="Ej. 1900" keyboardType="number-pad" />
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
            <Text style={styles.infoText}>Los envíos se coordinan según la zona de entrega.</Text>
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
