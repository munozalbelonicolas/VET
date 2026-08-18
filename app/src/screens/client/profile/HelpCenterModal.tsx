import React from 'react';
import { View, Text, StyleSheet, Modal, ScrollView, TouchableOpacity, Linking, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, fonts, fontSizes, spacing, borderRadius } from '../../../config/theme';
import { Button } from '../../../components/ui';

interface HelpCenterModalProps {
  visible: boolean;
  onClose: () => void;
}

const VET_WHATSAPP = process.env.EXPO_PUBLIC_VET_WHATSAPP || '';
const VET_PHONE = process.env.EXPO_PUBLIC_VET_PHONE || '';

export const HelpCenterModal: React.FC<HelpCenterModalProps> = ({ visible, onClose }) => {
  const faqs = [
    { q: '¿Cómo pido un turno?', a: 'Podés pedir turnos para clínica, vacunación o peluquería directamente desde la sección "Turnos" en el menú inferior.' },
    { q: '¿Hacen envíos a domicilio?', a: 'Sí, realizamos envíos al casco urbano de La Plata. El costo y la disponibilidad se informan al confirmar tu compra.' },
    { q: '¿Tienen guardería o internación?', a: 'Consultá por disponibilidad de internación y servicios adicionales directamente con la veterinaria.' },
  ];

  const openUrl = async (url: string) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (!supported) {
        Alert.alert('Error', 'No se pudo abrir este enlace en tu dispositivo.');
        return;
      }
      await Linking.openURL(url);
    } catch (error) {
      console.log('Linking error', error);
      Alert.alert('Error', 'No se pudo abrir este enlace en tu dispositivo.');
    }
  };

  const handleWhatsApp = () => {
    if (!VET_WHATSAPP) {
      Alert.alert('Información', 'WhatsApp no está configurado aún.');
      return;
    }
    openUrl(`https://wa.me/${VET_WHATSAPP}?text=${encodeURIComponent('Hola, necesito ayuda con la App de Veterinaria La Plata')}`);
  };

  const handleCall = () => {
    if (!VET_PHONE) {
      Alert.alert('Información', 'El teléfono no está configurado aún.');
      return;
    }
    openUrl(`tel:${VET_PHONE}`);
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Centro de Ayuda</Text>
          <MaterialCommunityIcons name="close" size={24} color={colors.textDark} onPress={onClose} />
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.sectionTitle}>Contacto Directo</Text>
          <View style={styles.contactButtons}>
            <Button
              title="WhatsApp"
              variant="primary"
              onPress={handleWhatsApp}
              disabled={!VET_WHATSAPP}
              style={{ flex: 1, marginRight: spacing.sm }}
            />
            <Button
              title="Llamar"
              variant="outline"
              onPress={handleCall}
              disabled={!VET_PHONE}
              style={{ flex: 1 }}
            />
          </View>

          <Text style={styles.sectionTitle}>Preguntas Frecuentes</Text>
          {faqs.map((faq, index) => (
            <View key={index} style={styles.faqCard}>
              <Text style={styles.faqQuestion}>{faq.q}</Text>
              <Text style={styles.faqAnswer}>{faq.a}</Text>
            </View>
          ))}
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgMain },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.border },
  title: { fontFamily: fonts.quicksand.bold, fontSize: fontSizes.xl, color: colors.textDark },
  content: { padding: spacing.lg },
  sectionTitle: { fontFamily: fonts.quicksand.bold, fontSize: fontSizes.lg, color: colors.textDark, marginBottom: spacing.md, marginTop: spacing.lg },
  contactButtons: { flexDirection: 'row', marginBottom: spacing.xl },
  faqCard: { backgroundColor: colors.bgCard, padding: spacing.md, borderRadius: borderRadius.md, marginBottom: spacing.md, borderWidth: 1, borderColor: colors.border },
  faqQuestion: { fontFamily: fonts.nunito.bold, fontSize: fontSizes.md, color: colors.textDark, marginBottom: spacing.xs },
  faqAnswer: { fontFamily: fonts.nunito.regular, fontSize: fontSizes.sm, color: colors.textMuted, lineHeight: 20 },
});
