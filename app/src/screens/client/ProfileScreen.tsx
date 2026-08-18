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
import { colors, fonts, fontSizes, spacing, letterSpacing } from '../../config/theme';
import { Button, Card } from '../../components/ui';
import { useAuthStore } from '../../store/authStore';
import { logOut } from '../../services/authService';
import { PersonalDataModal } from './profile/PersonalDataModal';
import { AddressModal } from './profile/AddressModal';
import { NotificationPrefsModal } from './profile/NotificationPrefsModal';
import { PaymentMethodsModal } from './profile/PaymentMethodsModal';
import { HelpCenterModal } from './profile/HelpCenterModal';
import { PetHistoryModal } from './profile/PetHistoryModal';

type ModalId =
  | 'personal'
  | 'address'
  | 'pets'
  | 'prefs'
  | 'payments'
  | 'help';

const MENU_ITEMS: { id: ModalId; icon: string; label: string }[] = [
  { id: 'personal', icon: 'account-edit-outline', label: 'Datos personales y contacto' },
  { id: 'address', icon: 'map-marker-outline', label: 'Direcciones de entrega' },
  { id: 'pets', icon: 'paw', label: 'Historial de mis mascotas' },
  { id: 'prefs', icon: 'bell-outline', label: 'Preferencias de notificaciones' },
  { id: 'payments', icon: 'credit-card-outline', label: 'Métodos de pago' },
  { id: 'help', icon: 'help-circle-outline', label: 'Centro de Ayuda y Contacto' },
];

const roleLabel: Record<string, string> = {
  client: 'CLIENTE',
  vet: 'VETERINARIO',
  groomer: 'PELUQUERO',
  receptionist: 'RECEPCIONISTA',
  admin: 'ADMINISTRADOR',
};

export const ProfileScreen: React.FC = () => {
  const { user, logout } = useAuthStore();
  const [activeModal, setActiveModal] = React.useState<ModalId | null>(null);

  const handleLogout = () => {
    Alert.alert('Cerrar sesión', '¿Seguro que querés cerrar tu sesión?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Cerrar sesión',
        style: 'destructive',
        onPress: async () => {
          try {
            await logOut();
          } catch (e) {
            console.log('Logout error (non blocking):', e);
          } finally {
            logout();
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bgMain }}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Mi Perfil</Text>
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
          <Text style={styles.userName}>{user?.name || 'Cliente'}</Text>
          {user?.email ? <Text style={styles.userEmail}>{user.email}</Text> : null}
          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>{roleLabel[user?.role || 'client']}</Text>
          </View>
        </Card>

        {/* Menu Options */}
        <View style={styles.menuSection}>
          {MENU_ITEMS.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.menuItem}
              onPress={() => setActiveModal(item.id)}
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
          onPress={handleLogout}
          variant="outline"
          fullWidth
          style={styles.logoutBtn}
        />

        <PersonalDataModal visible={activeModal === 'personal'} onClose={() => setActiveModal(null)} />
        <AddressModal visible={activeModal === 'address'} onClose={() => setActiveModal(null)} />
        <PetHistoryModal visible={activeModal === 'pets'} onClose={() => setActiveModal(null)} />
        <NotificationPrefsModal visible={activeModal === 'prefs'} onClose={() => setActiveModal(null)} />
        <PaymentMethodsModal visible={activeModal === 'payments'} onClose={() => setActiveModal(null)} />
        <HelpCenterModal visible={activeModal === 'help'} onClose={() => setActiveModal(null)} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgMain },
  content: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: 120 },
  header: { marginBottom: spacing.md },
  title: { fontFamily: fonts.quicksand.bold, fontSize: fontSizes['2xl'], color: colors.textDark, letterSpacing: letterSpacing.display },
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
