import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, Switch } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, fonts, fontSizes, spacing } from '../../../config/theme';
import { Button } from '../../../components/ui';
import { updateUserProfile } from '../../../services/userService';
import { useAuthStore } from '../../../store/authStore';

interface NotificationPrefsModalProps {
  visible: boolean;
  onClose: () => void;
}

export const NotificationPrefsModal: React.FC<NotificationPrefsModalProps> = ({ visible, onClose }) => {
  const { user } = useAuthStore();
  const defaultPrefs = { appointments: true, vaccines: true, promotions: false, orderUpdates: true, vetMessages: true };
  const prefs = user?.notificationPrefs || defaultPrefs;

  const [appointments, setAppointments] = useState(prefs.appointments);
  const [vaccines, setVaccines] = useState(prefs.vaccines);
  const [promotions, setPromotions] = useState(prefs.promotions);
  const [orderUpdates, setOrderUpdates] = useState(prefs.orderUpdates);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!user) return;
    setIsSaving(true);
    await updateUserProfile(user.id, {
      notificationPrefs: {
        appointments,
        vaccines,
        promotions,
        orderUpdates,
        vetMessages: true, // Always true for critical messages
      },
    });
    setIsSaving(false);
    onClose();
  };

  const renderSwitch = (title: string, desc: string, value: boolean, onValueChange: (val: boolean) => void) => (
    <View style={styles.switchRow}>
      <View style={{ flex: 1, paddingRight: spacing.md }}>
        <Text style={styles.switchTitle}>{title}</Text>
        <Text style={styles.switchDesc}>{desc}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: colors.border, true: colors.primary }}
        thumbColor={Platform.OS === 'ios' ? '#FFFFFF' : value ? colors.primaryDark : '#f4f3f4'}
      />
    </View>
  );

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Notificaciones</Text>
          <MaterialCommunityIcons name="close" size={24} color={colors.textDark} onPress={onClose} />
        </View>

        <View style={styles.content}>
          <Text style={styles.sectionDesc}>
            Elegí qué tipo de alertas querés recibir en tu celular. Los mensajes importantes de tu veterinario no se pueden desactivar.
          </Text>

          {renderSwitch('Turnos', 'Recordatorios 24hs antes de tu cita', appointments, setAppointments)}
          {renderSwitch('Vacunas y Desparasitación', 'Avisos cuando toque renovar dosis', vaccines, setVaccines)}
          {renderSwitch('Actualizaciones de Pedidos', 'Estado del envío de tus compras en tienda', orderUpdates, setOrderUpdates)}
          {renderSwitch('Promociones y Descuentos', 'Ofertas exclusivas en alimentos y accesorios', promotions, setPromotions)}
        </View>

        <View style={styles.footer}>
          <Button title="Guardar Preferencias" onPress={handleSave} loading={isSaving} fullWidth />
        </View>
      </View>
    </Modal>
  );
};

import { Platform } from 'react-native';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgMain },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.border },
  title: { fontFamily: fonts.quicksand.bold, fontSize: fontSizes.xl, color: colors.textDark },
  content: { padding: spacing.lg, flex: 1 },
  sectionDesc: { fontFamily: fonts.nunito.regular, fontSize: fontSizes.md, color: colors.textMuted, marginBottom: spacing.xl },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.lg },
  switchTitle: { fontFamily: fonts.nunito.bold, fontSize: fontSizes.md, color: colors.textDark, marginBottom: 2 },
  switchDesc: { fontFamily: fonts.nunito.regular, fontSize: fontSizes.sm, color: colors.textMuted },
  footer: { padding: spacing.lg, borderTopWidth: 1, borderTopColor: colors.border },
});
