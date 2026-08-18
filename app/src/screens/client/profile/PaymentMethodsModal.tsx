import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, fonts, fontSizes, spacing, borderRadius } from '../../../config/theme';

interface PaymentMethodsModalProps {
  visible: boolean;
  onClose: () => void;
}

export const PaymentMethodsModal: React.FC<PaymentMethodsModalProps> = ({ visible, onClose }) => {
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Métodos de Pago</Text>
          <MaterialCommunityIcons name="close" size={24} color={colors.textDark} onPress={onClose} />
        </View>

        <View style={styles.content}>
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="credit-card-off-outline" size={64} color={colors.border} style={{ marginBottom: spacing.md }} />
            <Text style={styles.emptyTitle}>No tenés tarjetas guardadas</Text>
            <Text style={styles.emptyDesc}>
              Tus métodos de pago se guardarán automáticamente de forma segura al realizar tu primera compra en la tienda a través de Mercado Pago.
            </Text>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgMain },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.border },
  title: { fontFamily: fonts.quicksand.bold, fontSize: fontSizes.xl, color: colors.textDark },
  content: { padding: spacing.lg, flex: 1 },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: spacing['3xl'], paddingHorizontal: spacing.xl },
  emptyTitle: { fontFamily: fonts.quicksand.bold, fontSize: fontSizes.lg, color: colors.textDark, marginBottom: spacing.xs, textAlign: 'center' },
  emptyDesc: { fontFamily: fonts.nunito.regular, fontSize: fontSizes.md, color: colors.textMuted, textAlign: 'center', lineHeight: 22 },
});
