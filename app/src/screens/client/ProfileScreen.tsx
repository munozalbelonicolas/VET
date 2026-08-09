// ============================================================
// Veterinaria La Plata — Profile Screen
// ============================================================
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, fonts, fontSizes, spacing, borderRadius, shadows } from '../../config/theme';
import { Button, Card } from '../../components/ui';
import { useAuthStore } from '../../store/authStore';
import { logOut } from '../../services/authService';
import { PersonalDataModal } from './profile/PersonalDataModal';
import { AddressModal } from './profile/AddressModal';
import { NotificationPrefsModal } from './profile/NotificationPrefsModal';
import { PaymentMethodsModal } from './profile/PaymentMethodsModal';
import { HelpCenterModal } from './profile/HelpCenterModal';
import { PetHistoryModal } from './profile/PetHistoryModal';

export const ProfileScreen: React.FC = () => {
  const { user, logout } = useAuthStore();
  const [activeModal, setActiveModal] = React.useState<string | null>(null);

  const handleAction = (label: string) => {
    setActiveModal(label);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bgMain }}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.header}>
        <Text style={styles.title}>Mi Perfil 👤</Text>
      </View>

      {/* User Info Card */}
      <Card variant="elevated" style={styles.userCard}>
        <View style={styles.avatar}>
          {user?.avatarUrl ? (
            <Image source={{ uri: user.avatarUrl }} style={{ width: 80, height: 80, borderRadius: 40 }} />
          ) : (
            <MaterialCommunityIcons name="account" size={44} color={colors.primaryDark} />
          )}
        </View>
        <Text style={styles.userName}>{user?.name || 'Cliente Veterinaria'}</Text>
        <Text style={styles.userEmail}>{user?.email || 'cliente@mascota.com'}</Text>
        <View style={styles.roleBadge}>
          <Text style={styles.roleText}>CLIENTE VERIFICADO</Text>
        </View>
      </Card>

      {/* Menu Options */}
      <View style={styles.menuSection}>
        {[
          { icon: 'account-edit-outline', label: 'Datos personales y contacto' },
          { icon: 'map-marker-outline', label: 'Direcciones de entrega (La Plata)' },
          { icon: 'paw', label: 'Historial de mis mascotas' },
          { icon: 'bell-outline', label: 'Preferencias de notificaciones' },
          { icon: 'credit-card-outline', label: 'Métodos de pago guardados' },
          { icon: 'help-circle-outline', label: 'Centro de Ayuda y Contacto' },
        ].map((item, index) => (
          <TouchableOpacity
            key={index}
            style={styles.menuItem}
            onPress={() => handleAction(item.label)}
          >
            <View style={styles.menuIconBg}>
              <MaterialCommunityIcons name={item.icon as any} size={22} color={colors.primaryDark} />
            </View>
            <Text style={styles.menuLabel}>{item.label}</Text>
            <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textLight} />
          </TouchableOpacity>
        ))}
      </View>

      <Button
        title="Cerrar sesión"
        onPress={async () => {
          await logOut();
          logout();
        }}
        variant="outline"
        fullWidth
        style={styles.logoutBtn}
      />

      <PersonalDataModal visible={activeModal === 'Datos personales y contacto'} onClose={() => setActiveModal(null)} />
      <AddressModal visible={activeModal === 'Direcciones de entrega (La Plata)'} onClose={() => setActiveModal(null)} />
      <PetHistoryModal visible={activeModal === 'Historial de mis mascotas'} onClose={() => setActiveModal(null)} />
      <NotificationPrefsModal visible={activeModal === 'Preferencias de notificaciones'} onClose={() => setActiveModal(null)} />
      <PaymentMethodsModal visible={activeModal === 'Métodos de pago guardados'} onClose={() => setActiveModal(null)} />
      <HelpCenterModal visible={activeModal === 'Centro de Ayuda y Contacto'} onClose={() => setActiveModal(null)} />

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgMain },
  content: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing['3xl'] },
  header: { marginBottom: spacing.md },
  title: { fontFamily: fonts.quicksand.bold, fontSize: fontSizes['2xl'], color: colors.textDark },
  userCard: { alignItems: 'center', padding: spacing.xl, marginBottom: spacing.lg },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primarySoft,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  userName: { fontFamily: fonts.quicksand.bold, fontSize: fontSizes.xl, color: colors.textDark },
  userEmail: { fontFamily: fonts.nunito.regular, fontSize: fontSizes.sm, color: colors.textMuted, marginTop: 2 },
  roleBadge: {
    marginTop: spacing.sm,
    backgroundColor: colors.primarySoft,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: 12,
  },
  roleText: { fontFamily: fonts.nunito.bold, fontSize: fontSizes.xs, color: colors.primaryDark, letterSpacing: 0.5 },
  menuSection: { gap: spacing.xs, marginBottom: spacing.xl },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgCard,
    padding: spacing.md,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  menuIconBg: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primarySoft,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  menuLabel: { flex: 1, fontFamily: fonts.nunito.semiBold, fontSize: fontSizes.sm, color: colors.textDark },
  logoutBtn: { marginTop: spacing.md },
});

export default ProfileScreen;
