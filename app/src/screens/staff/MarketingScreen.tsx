// ============================================================
// Veterinaria La Plata — Marketing Push Campaigns Screen
// Campañas con cupón de descuento + envío push a clientes
// ============================================================
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, fonts, fontSizes, spacing, borderRadius } from '../../config/theme';
import { Card, Badge, Button, Input } from '../../components/ui';
import { Campaign, CampaignSegment } from '../../types';
import { getCampaigns, createCampaign, updateCampaign } from '../../services/staffService';
import { createCoupon, generateCouponCode } from '../../services/couponService';
import { sendCampaignPush, logAdminAction } from '../../services/adminService';
import { useAuthStore } from '../../store/authStore';

export const MarketingScreen: React.FC = () => {
  const { user } = useAuthStore();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [segment, setSegment] = useState<CampaignSegment>('all');
  const [withCoupon, setWithCoupon] = useState(false);
  const [discountValue, setDiscountValue] = useState('20');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (user?.role !== 'admin') return;
    loadCampaigns();
  }, [user?.role]);

  const loadCampaigns = async () => {
    setLoading(true);
    try {
      const list = await getCampaigns();
      setCampaigns(list);
    } catch (error) {
      console.log('loadCampaigns error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendCampaign = async () => {
    if (!user?.id) {
      Alert.alert('Error', 'Sesión inválida. Volvé a iniciar sesión.');
      return;
    }
    if (!title.trim()) {
      Alert.alert('Error', 'Ingresá el título de la campaña');
      return;
    }
    if (!message.trim()) {
      Alert.alert('Error', 'Ingresá el mensaje de la notificación push');
      return;
    }

    setSending(true);
    try {
      let couponCode: string | undefined;

      // Crear cupón de descuento vinculado a la campaña
      if (withCoupon) {
        const value = parseFloat(discountValue);
        if (!value || value <= 0 || value > 100) {
          Alert.alert('Error', 'Ingresá un porcentaje de descuento válido (1-100).');
          setSending(false);
          return;
        }
        couponCode = generateCouponCode('VET');
        await createCoupon({
          code: couponCode,
          discountType: 'percentage',
          discountValue: value,
          minPurchase: undefined,
          usageLimit: 100,
          validFrom: new Date(),
          validTo: new Date(Date.now() + 30 * 86400000),
        });
        await logAdminAction({ id: user.id, name: user.name }, 'coupon_create', couponCode, `campaña: ${title}`);
      }

      const newCamp = await createCampaign({
        title: title.trim(),
        message: message.trim(),
        type: 'discount',
        segment,
        couponCode,
        createdBy: user.id,
      });

      // Enviar notificaciones push a los clientes del segmento
      const { sent } = await sendCampaignPush({
        id: newCamp.id,
        title: newCamp.title,
        message: newCamp.message,
        segment: newCamp.segment,
        couponCode: newCamp.couponCode,
      });

      await updateCampaign(newCamp.id, {
        status: 'sent',
        sentAt: new Date(),
        stats: { sent, opened: 0, clicked: 0 },
      });
      await logAdminAction({ id: user.id, name: user.name }, 'campaign_send', newCamp.title, `destinatarios=${sent}`);

      setCampaigns([{ ...newCamp, status: 'sent', sentAt: new Date(), stats: { sent, opened: 0, clicked: 0 } }, ...campaigns]);
      setModalVisible(false);
      setTitle('');
      setMessage('');
      setWithCoupon(false);
      setDiscountValue('20');
      Alert.alert('¡Campaña Enviada! 🚀', `Notificación enviada a ${sent} clientes.${couponCode ? ` Cupón ${couponCode} generado.` : ''}`);
    } catch (error) {
      console.log('send campaign error:', error);
      Alert.alert('Error', 'No se pudo crear la campaña.');
    } finally {
      setSending(false);
    }
  };

  if (user?.role !== 'admin') {
    return (
      <View style={[styles.container, { alignItems: 'center', justifyContent: 'center' }]}>
        <MaterialCommunityIcons name="shield-lock-outline" size={48} color={colors.danger} />
        <Text style={{ fontFamily: fonts.nunito.semiBold, fontSize: fontSizes.md, color: colors.textMuted, marginTop: spacing.md }}>
          No tenés permisos de administrador.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Campañas Marketing</Text>
        <Button title="+ Nueva Campaña" onPress={() => setModalVisible(true)} variant="accent" size="sm" />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.sectionTitle}>Historial de Campañas</Text>

        {loading ? (
          <Card variant="outlined" style={{ padding: spacing.xl, alignItems: 'center' }}>
            <ActivityIndicator color={colors.primary} />
          </Card>
        ) : campaigns.length === 0 ? (
          <Card variant="outlined" style={{ padding: spacing.xl, alignItems: 'center' }}>
            <MaterialCommunityIcons name="bullhorn-outline" size={40} color={colors.textLight} />
            <Text style={{ fontFamily: fonts.nunito.regular, fontSize: fontSizes.sm, color: colors.textMuted, marginTop: spacing.sm }}>
              Todavía no creaste campañas.
            </Text>
          </Card>
        ) : (
          campaigns.map((camp) => (
            <Card key={camp.id} variant="elevated" style={styles.campCard}>
              <View style={styles.campHeader}>
                <Badge label={camp.segment.toUpperCase()} variant="primary" />
                <Text style={styles.campDate}>
                  {camp.sentAt ? new Date(camp.sentAt).toLocaleDateString('es-AR') : 'Programada'}
                </Text>
              </View>

              <Text style={styles.campTitle}>{camp.title}</Text>
              <Text style={styles.campMessage}>{camp.message}</Text>

              {camp.couponCode ? (
                <View style={styles.couponCodeBox}>
                  <MaterialCommunityIcons name="ticket-percent-outline" size={18} color={colors.success} />
                  <Text style={styles.couponCodeText}>Cupón: {camp.couponCode}</Text>
                </View>
              ) : null}

              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Text style={styles.statVal}>{camp.stats.sent}</Text>
                  <Text style={styles.statLbl}>Enviados</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statVal}>{camp.stats.opened}</Text>
                  <Text style={styles.statLbl}>Abiertos</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statVal}>{camp.stats.clicked}</Text>
                  <Text style={styles.statLbl}>Clicks</Text>
                </View>
              </View>
            </Card>
          ))
        )}
      </ScrollView>

      {/* New Campaign Modal */}
      <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Nueva Campaña Push 🚀</Text>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <MaterialCommunityIcons name="close" size={24} color={colors.textDark} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.modalContent} keyboardShouldPersistTaps="handled">
            <Input
              label="Título de la Notificación"
              placeholder="Ej: 20% OFF en Alimentos por 48hs 🎉"
              value={title}
              onChangeText={setTitle}
            />

            <Input
              label="Mensaje Push"
              placeholder="Ej: Aprovechá el descuento exclusivo comprando desde la app..."
              value={message}
              onChangeText={setMessage}
              multiline
            />

            <Text style={styles.label}>Segmento de Usuarios</Text>
            <View style={styles.segmentGrid}>
              {[
                { id: 'all', label: '👥 Todos los Clientes' },
                { id: 'dog_owners', label: '🐶 Dueños de Perros' },
                { id: 'cat_owners', label: '🐱 Dueños de Gatos' },
              ].map((s) => (
                <TouchableOpacity
                  key={s.id}
                  style={[styles.segOption, segment === s.id && styles.segOptionActive]}
                  onPress={() => setSegment(s.id as CampaignSegment)}
                >
                  <Text style={[styles.segOptionText, segment === s.id && styles.segOptionTextActive]}>
                    {s.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Cupón de descuento */}
            <TouchableOpacity style={styles.couponToggle} onPress={() => setWithCoupon(!withCoupon)}>
              <MaterialCommunityIcons
                name={withCoupon ? 'checkbox-marked-circle' : 'checkbox-blank-circle-outline'}
                size={24}
                color={withCoupon ? colors.success : colors.textMuted}
              />
              <View style={{ flex: 1, marginLeft: spacing.sm }}>
                <Text style={styles.couponToggleTitle}>Incluir cupón de descuento 🎟️</Text>
                <Text style={styles.couponToggleDesc}>
                  Genera un código automático que los clientes podrán aplicar en la tienda.
                </Text>
              </View>
            </TouchableOpacity>

            {withCoupon && (
              <Input
                label="Porcentaje de descuento (%)"
                placeholder="Ej: 20"
                value={discountValue}
                onChangeText={setDiscountValue}
                keyboardType="numeric"
              />
            )}

            <Button
              title="Enviar Campaña Ahora 🚀"
              onPress={handleSendCampaign}
              loading={sending}
              variant="accent"
              size="lg"
              fullWidth
              style={{ marginTop: spacing.lg }}
            />
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgMain },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.sm },
  title: { fontFamily: fonts.quicksand.bold, fontSize: fontSizes.xl, color: colors.textDark },
  content: { paddingHorizontal: spacing.lg, paddingBottom: spacing['3xl'] },
  sectionTitle: { fontFamily: fonts.quicksand.bold, fontSize: fontSizes.md, color: colors.textDark, marginBottom: spacing.md },
  campCard: { padding: spacing.lg, marginBottom: spacing.md },
  campHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xs },
  campDate: { fontFamily: fonts.nunito.regular, fontSize: fontSizes.xs, color: colors.textMuted },
  campTitle: { fontFamily: fonts.quicksand.bold, fontSize: fontSizes.md, color: colors.textDark, marginTop: spacing.xs },
  campMessage: { fontFamily: fonts.nunito.regular, fontSize: fontSizes.sm, color: colors.textMuted, marginTop: 2, marginBottom: spacing.md },
  couponCodeBox: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, backgroundColor: colors.successSoft, padding: spacing.sm, borderRadius: borderRadius.sm, marginBottom: spacing.md },
  couponCodeText: { fontFamily: fonts.nunito.bold, fontSize: fontSizes.sm, color: colors.successDark },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around', backgroundColor: colors.primarySoft, padding: spacing.sm, borderRadius: 12 },
  statItem: { alignItems: 'center' },
  statVal: { fontFamily: fonts.quicksand.bold, fontSize: fontSizes.md, color: colors.primaryDark },
  statLbl: { fontFamily: fonts.nunito.regular, fontSize: fontSizes.xs, color: colors.textMuted },
  modalContainer: { flex: 1, backgroundColor: colors.bgMain, paddingTop: spacing.xl },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.xl, paddingBottom: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  modalTitle: { fontFamily: fonts.quicksand.bold, fontSize: fontSizes.xl, color: colors.textDark },
  modalContent: { padding: spacing.xl },
  label: { fontFamily: fonts.nunito.semiBold, fontSize: fontSizes.sm, color: colors.textDark, marginBottom: spacing.xs, marginTop: spacing.sm },
  segmentGrid: { gap: spacing.sm, marginBottom: spacing.md },
  segOption: { paddingVertical: spacing.md, paddingHorizontal: spacing.md, borderRadius: 12, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.bgCard },
  segOptionActive: { backgroundColor: colors.accentSoft, borderColor: colors.accent },
  segOptionText: { fontFamily: fonts.nunito.bold, fontSize: fontSizes.sm, color: colors.textDark },
  segOptionTextActive: { color: colors.accentDark },
  couponToggle: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, borderRadius: 12, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.bgCard, marginBottom: spacing.md },
  couponToggleTitle: { fontFamily: fonts.nunito.bold, fontSize: fontSizes.sm, color: colors.textDark },
  couponToggleDesc: { fontFamily: fonts.nunito.regular, fontSize: fontSizes.xs, color: colors.textMuted, marginTop: 2 },
});

export default MarketingScreen;
