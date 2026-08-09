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

          {/* Placeholder for future cards */}
          <View style={[styles.cardItem, { opacity: 0.5 }]}>
            <View style={styles.cardIcon}>
              <MaterialCommunityIcons name="credit-card-outline" size={24} color={colors.textDark} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardName}>Visa terminada en 4321</Text>
              <Text style={styles.cardDate}>Vence 12/28</Text>
            </View>
            <Text style={styles.mockBadge}>MOCK</Text>
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
  cardItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.bgCard, padding: spacing.md, borderRadius: borderRadius.md, borderWidth: 1, borderColor: colors.border, marginTop: spacing.xl },
  cardIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.bgOverlay, alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
  cardName: { fontFamily: fonts.nunito.bold, fontSize: fontSizes.md, color: colors.textDark },
  cardDate: { fontFamily: fonts.nunito.regular, fontSize: fontSizes.sm, color: colors.textMuted },
  mockBadge: { fontFamily: fonts.nunito.bold, fontSize: fontSizes.xs, color: colors.textLight, backgroundColor: colors.bgOverlay, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
});
