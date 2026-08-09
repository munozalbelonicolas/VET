// ============================================================
// Veterinaria La Plata — Marketing Push Campaigns Screen (Fase 5)
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
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, fonts, fontSizes, spacing, borderRadius, shadows } from '../../config/theme';
import { Card, Badge, Button, Input } from '../../components/ui';
import { Campaign, CampaignSegment } from '../../types';
import { getCampaigns, createCampaign } from '../../services/staffService';
import { useAuthStore } from '../../store/authStore';

export const MarketingScreen: React.FC = () => {
  const { user } = useAuthStore();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [modalVisible, setModalVisible] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [segment, setSegment] = useState<CampaignSegment>('all');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    loadCampaigns();
  }, []);

  const loadCampaigns = async () => {
    const list = await getCampaigns();
    setCampaigns(list);
  };

  const handleSendCampaign = async () => {
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
      const newCamp = await createCampaign({
        title,
        message,
        type: 'seasonal',
        segment,
        createdBy: user?.id || 'admin-001',
      });

      setCampaigns([newCamp, ...campaigns]);
      setModalVisible(false);
      setTitle('');
      setMessage('');
      Alert.alert('¡Campaña Enviada! 🚀', `Notificación push enviada a los usuarios segmentados.`);
    } catch (error) {
      Alert.alert('Error', 'No se pudo enviar la campaña.');
    } finally {
      setSending(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Campañas Marketing 📢</Text>
        <Button
          title="+ Nueva Campaña"
          onPress={() => setModalVisible(true)}
          variant="accent"
          size="sm"
        />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.sectionTitle}>Historial de Notificaciones Push</Text>

        {campaigns.map((camp) => (
          <Card key={camp.id} variant="elevated" style={styles.campCard}>
            <View style={styles.campHeader}>
              <Badge label={camp.segment.toUpperCase()} variant="primary" />
              <Text style={styles.campDate}>
                {camp.sentAt ? new Date(camp.sentAt).toLocaleDateString('es-AR') : 'Programada'}
              </Text>
            </View>

            <Text style={styles.campTitle}>{camp.title}</Text>
            <Text style={styles.campMessage}>{camp.message}</Text>

            {/* Metrics */}
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
        ))}
      </ScrollView>

      {/* New Campaign Modal */}
      <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Nueva Campaña Push 🚀</Text>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <MaterialCommunityIcons name="close" size={24} color={colors.textDark} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.modalContent}>
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
                { id: 'inactive_clients', label: '💤 Inactivos (+3 meses)' },
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

            <Button
              title="Enviar Notificación Ahora 🚀"
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
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.lg, paddingTop: spacing['2xl'], paddingBottom: spacing.sm },
  title: { fontFamily: fonts.quicksand.bold, fontSize: fontSizes.xl, color: colors.textDark },
  content: { paddingHorizontal: spacing.lg, paddingBottom: spacing['3xl'] },
  sectionTitle: { fontFamily: fonts.quicksand.bold, fontSize: fontSizes.md, color: colors.textDark, marginBottom: spacing.md },
  campCard: { padding: spacing.lg, marginBottom: spacing.md },
  campHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xs },
  campDate: { fontFamily: fonts.nunito.regular, fontSize: fontSizes.xs, color: colors.textMuted },
  campTitle: { fontFamily: fonts.quicksand.bold, fontSize: fontSizes.md, color: colors.textDark, marginTop: spacing.xs },
  campMessage: { fontFamily: fonts.nunito.regular, fontSize: fontSizes.sm, color: colors.textMuted, marginTop: 2, marginBottom: spacing.md },
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
});

export default MarketingScreen;
