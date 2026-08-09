import React from 'react';
import { View, Text, StyleSheet, Modal, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, fonts, fontSizes, spacing, borderRadius } from '../../../config/theme';
import { Button } from '../../../components/ui';

interface HelpCenterModalProps {
  visible: boolean;
  onClose: () => void;
}

export const HelpCenterModal: React.FC<HelpCenterModalProps> = ({ visible, onClose }) => {
  const faqs = [
    { q: '¿Cómo pido un turno?', a: 'Podés pedir turnos para clínica, vacunación o peluquería directamente desde la sección "Turnos" en el menú inferior.' },
    { q: '¿Hacen envíos a domicilio?', a: 'Sí, realizamos envíos a todo el casco urbano de La Plata en compras superiores a $15.000 de manera gratuita.' },
    { q: '¿Tienen guardería o internación?', a: 'Actualmente no contamos con servicio de internación 24hs ni guardería.' },
  ];

  const handleWhatsApp = () => {
    Linking.openURL('https://wa.me/5492215551234?text=Hola,%20necesito%20ayuda%20con%20la%20App%20de%20Veterinaria%20La%20Plata');
  };

  const handleCall = () => {
    Linking.openURL('tel:+5492215551234');
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
              style={{ flex: 1, marginRight: spacing.sm }}
            />
            <Button
              title="Llamar"
              variant="outline"
              onPress={handleCall}
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
