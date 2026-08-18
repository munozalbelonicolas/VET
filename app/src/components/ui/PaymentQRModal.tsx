// ============================================================
// Veterinaria La Plata — Mercado Pago QR Payment Modal
// ============================================================
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Image,
  Alert,
  ScrollView,
  Linking,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, fonts, fontSizes, spacing, borderRadius, shadows } from '../../config/theme';
import { Card, Button, Input, Badge } from './index';
import { DEMO_MODE } from '../../config/firebase';

interface PaymentQRModalProps {
  visible: boolean;
  onClose: () => void;
  initialAmount?: number;
  initialConcept?: string;
  onPaymentSuccess?: (amount: number, concept: string) => void;
}

export const PaymentQRModal: React.FC<PaymentQRModalProps> = ({
  visible,
  onClose,
  initialAmount = 15000,
  initialConcept = 'Consulta Veterinaria & Servicios',
  onPaymentSuccess,
}) => {
  const [amount, setAmount] = useState(initialAmount.toString());
  const [concept, setConcept] = useState(initialConcept);
  const [qrGenerated, setQrGenerated] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'success'>('pending');

  const parsedAmount = parseFloat(amount) || 0;
  const mpPaymentPayload = `https://link.mercadopago.com.ar/pay?amount=${parsedAmount}&description=${encodeURIComponent(concept)}`;
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(mpPaymentPayload)}&size=300x300&color=000000&bgcolor=ffffff`;

  const handleGenerateQR = () => {
    if (parsedAmount <= 0) {
      Alert.alert('Error', 'Ingresá un monto válido');
      return;
    }
    setQrGenerated(true);
    setPaymentStatus('pending');
  };

  const handleSimulatePaymentSuccess = () => {
    setPaymentStatus('success');
    if (onPaymentSuccess) {
      onPaymentSuccess(parsedAmount, concept);
    }
  };

  const handleSendReceiptWhatsApp = () => {
    const text = encodeURIComponent(
      `🧾 *Comprobante de Pago — Veterinaria La Plata*\n\n` +
      `• *Concepto:* ${concept}\n` +
      `• *Monto Cobrado:* $${parsedAmount.toLocaleString('es-AR')}\n` +
      `• *Medio de Pago:* Mercado Pago QR ✓\n` +
      `• *Estado:* Aprobado\n\n` +
      `¡Muchas gracias por confiar en nosotros! 🐾`
    );
    Linking.openURL(`https://wa.me/?text=${text}`);
  };

  const handleReset = () => {
    setQrGenerated(false);
    setPaymentStatus('pending');
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={styles.container}>
        {/* Mercado Pago Header */}
        <View style={styles.mpHeader}>
          <View style={styles.mpLogoRow}>
            <MaterialCommunityIcons name="qrcode-scan" size={28} color="#FFF" />
            <Text style={styles.mpHeaderTitle}>Cobro con Mercado Pago QR</Text>
          </View>
          <TouchableOpacity onPress={handleReset}>
            <MaterialCommunityIcons name="close" size={26} color="#FFF" />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          {!qrGenerated ? (
            <Card variant="elevated" style={styles.formCard}>
              <Text style={styles.sectionTitle}>💳 Configurar Cobro en Mostrador</Text>
              <Text style={styles.sectionSub}>Ingresá el monto y el concepto del servicio para generar el código QR.</Text>

              <Input
                label="Monto a Cobrar ($ ARS)"
                placeholder="Ej: 15000"
                keyboardType="numeric"
                value={amount}
                onChangeText={setAmount}
              />

              <Input
                label="Concepto / Detalle del Pago"
                placeholder="Ej: Consulta Veterinaria + Vacuna Luna"
                value={concept}
                onChangeText={setConcept}
              />

              {/* Quick Amount Buttons */}
              <Text style={styles.quickLabel}>Montos Rápido:</Text>
              <View style={styles.quickRow}>
                {[5000, 15000, 22000, 35000, 50000].map((val) => (
                  <TouchableOpacity
                    key={val}
                    style={styles.quickChip}
                    onPress={() => setAmount(val.toString())}
                  >
                    <Text style={styles.quickChipText}>${val.toLocaleString('es-AR')}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Button
                title="⚡ Generar Código QR Mercado Pago"
                onPress={handleGenerateQR}
                variant="primary"
                size="lg"
                fullWidth
                style={{ marginTop: spacing.lg, backgroundColor: '#009EE3' }}
              />
            </Card>
          ) : (
            <Card variant="elevated" style={styles.qrCard}>
              <View style={styles.mpBadgeBox}>
                <Text style={styles.mpBadgeText}>MERCADO PAGO</Text>
              </View>

              <Text style={styles.amountDisplay}>
                ${parsedAmount.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
              </Text>
              <Text style={styles.conceptText}>{concept}</Text>

              {/* QR Image Box */}
              <View style={styles.qrContainer}>
                <Image source={{ uri: qrImageUrl }} style={styles.qrImage} />
              </View>

              {paymentStatus === 'pending' ? (
                <View style={styles.statusBoxPending}>
                  <MaterialCommunityIcons name="loading" size={20} color="#009EE3" />
                  <Text style={styles.statusTextPending}>Esperando pago del cliente en mostrador...</Text>
                </View>
              ) : (
                <View style={styles.statusBoxSuccess}>
                  <MaterialCommunityIcons name="check-circle" size={24} color={colors.success} />
                  <Text style={styles.statusTextSuccess}>¡Pago Acreditado Exitosamente!</Text>
                </View>
              )}

              {paymentStatus === 'pending' ? (
                <View style={styles.actionButtons}>
                  {DEMO_MODE && (
                    <Button
                      title="✓ Simular Pago Aprobado (demo)"
                      onPress={handleSimulatePaymentSuccess}
                      variant="accent"
                      size="md"
                      fullWidth
                    />
                  )}
                  <Button
                    title="Cambiar Monto"
                    onPress={() => setQrGenerated(false)}
                    variant="outline"
                    size="sm"
                    fullWidth
                    style={{ marginTop: spacing.sm }}
                  />
                </View>
              ) : (
                <View style={styles.actionButtons}>
                  <Button
                    title="📲 Enviar Comprobante por WhatsApp"
                    onPress={handleSendReceiptWhatsApp}
                    variant="primary"
                    size="md"
                    fullWidth
                    style={{ backgroundColor: '#25D366' }}
                  />
                  <Button
                    title="Nuevo Cobro"
                    onPress={handleReset}
                    variant="outline"
                    size="md"
                    fullWidth
                    style={{ marginTop: spacing.sm }}
                  />
                </View>
              )}
            </Card>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgMain },
  mpHeader: {
    backgroundColor: '#009EE3',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  mpLogoRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  mpHeaderTitle: { fontFamily: fonts.quicksand.bold, fontSize: fontSizes.lg, color: '#FFF' },
  content: { padding: spacing.xl },
  formCard: { padding: spacing.xl },
  sectionTitle: { fontFamily: fonts.quicksand.bold, fontSize: fontSizes.xl, color: colors.textDark },
  sectionSub: { fontFamily: fonts.nunito.regular, fontSize: fontSizes.sm, color: colors.textMuted, marginTop: 4, marginBottom: spacing.lg },
  quickLabel: { fontFamily: fonts.nunito.bold, fontSize: fontSizes.xs, color: colors.textDark, marginTop: spacing.sm, marginBottom: spacing.xs },
  quickRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  quickChip: { paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: borderRadius.full, backgroundColor: colors.primarySoft, borderWidth: 1, borderColor: colors.primary },
  quickChipText: { fontFamily: fonts.nunito.bold, fontSize: fontSizes.xs, color: colors.primaryDark },
  qrCard: { padding: spacing.xl, alignItems: 'center' },
  mpBadgeBox: { backgroundColor: '#009EE3', paddingHorizontal: spacing.md, paddingVertical: 4, borderRadius: borderRadius.sm, marginBottom: spacing.sm },
  mpBadgeText: { fontFamily: fonts.quicksand.bold, fontSize: 11, color: '#FFF', letterSpacing: 1 },
  amountDisplay: { fontFamily: fonts.quicksand.bold, fontSize: 32, color: colors.textDark, marginTop: spacing.xs },
  conceptText: { fontFamily: fonts.nunito.semiBold, fontSize: fontSizes.md, color: colors.textMuted, textAlign: 'center', marginTop: 2, marginBottom: spacing.lg },
  qrContainer: {
    padding: spacing.md,
    backgroundColor: '#FFF',
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    borderColor: '#009EE3',
    ...shadows.md,
    marginBottom: spacing.lg,
  },
  qrImage: { width: 220, height: 220 },
  statusBoxPending: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, padding: spacing.md, backgroundColor: '#E5F5FD', borderRadius: borderRadius.md, width: '100%', justifyContent: 'center', marginBottom: spacing.lg },
  statusTextPending: { fontFamily: fonts.nunito.bold, fontSize: fontSizes.sm, color: '#0074A6' },
  statusBoxSuccess: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, padding: spacing.md, backgroundColor: '#E8F8F0', borderRadius: borderRadius.md, width: '100%', justifyContent: 'center', marginBottom: spacing.lg },
  statusTextSuccess: { fontFamily: fonts.quicksand.bold, fontSize: fontSizes.md, color: colors.success },
  actionButtons: { width: '100%' },
});
