// ============================================================
// Veterinaria La Plata — Notifications Screen (in-app, Firestore)
// ============================================================
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { colors, fonts, fontSizes, spacing, borderRadius } from '../../config/theme';
import { Card, Button } from '../../components/ui';
import { AppNotification, ClientTabParamList } from '../../types';
import { getNotificationsByUser, markNotificationAsRead, markAllNotificationsAsRead } from '../../services/notificationService';
import { validateCoupon, discountFor } from '../../services/couponService';
import { useCartStore } from '../../store/cartStore';
import { useAuthStore } from '../../store/authStore';

const getIcon = (type: AppNotification['type']): string => {
  switch (type) {
    case 'appointment_confirmation':
    case 'appointment_reminder': return 'calendar-clock';
    case 'vaccine_reminder': return 'syringe';
    case 'order_status': return 'truck-delivery';
    case 'promotion':
    case 'marketing': return 'tag';
    case 'vet_message': return 'stethoscope';
    default: return 'bell';
  }
};

const formatDate = (date: Date): string => {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(hours / 24);
  if (hours < 1) return 'Hace un momento';
  if (hours < 24) return `Hace ${hours} hs`;
  if (days === 1) return 'Ayer';
  if (days < 7) return `Hace ${days} días`;
  return date.toLocaleDateString('es-AR');
};

export const NotificationsScreen: React.FC = () => {
  const { user } = useAuthStore();
  const navigation = useNavigation<BottomTabNavigationProp<ClientTabParamList>>();
  const setCoupon = useCartStore((s) => s.setCoupon);
  const getSubtotal = useCartStore((s) => s.getSubtotal);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [applyingCoupon, setApplyingCoupon] = useState<string | null>(null);

  const handleUseDiscount = async (n: AppNotification) => {
    const code = n.data?.couponCode;
    if (!code) return;
    setApplyingCoupon(n.id);
    try {
      const result = await validateCoupon(code);
      if (!result.valid || !result.coupon) {
        Alert.alert('Descuento no disponible', result.message);
        setApplyingCoupon(null);
        return;
      }
      setCoupon(code, {
        discountType: result.coupon.discountType,
        discountValue: result.coupon.discountValue,
        minPurchase: result.coupon.minPurchase,
      });
      await markNotificationAsRead(n.id);
      setNotifications((current) => current.map((x) => (x.id === n.id ? { ...x, read: true } : x)));
      setApplyingCoupon(null);
      Alert.alert('¡Descuento aplicado! 🎉', `El código ${code} está listo en tu carrito.`);
      navigation.navigate('Shop');
    } catch (error) {
      console.log('use discount error:', error);
      setApplyingCoupon(null);
      Alert.alert('Error', 'No se pudo aplicar el descuento. Intentá de nuevo.');
    }
  };

  const loadNotifications = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const items = await getNotificationsByUser(user.id);
      setNotifications(items);
    } catch (error) {
      console.log('loadNotifications error:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const markAsRead = async (n: AppNotification) => {
    if (n.read) return;
    setNotifications((current) =>
      current.map((item) => (item.id === n.id ? { ...item, read: true } : item))
    );
    try {
      await markNotificationAsRead(n.id);
    } catch (error) {
      console.log('markAsRead error:', error);
    }
  };

  const markAllRead = async () => {
    if (!user?.id || notifications.every((n) => n.read)) return;
    try {
      await markAllNotificationsAsRead(user.id);
      setNotifications((current) => current.map((n) => ({ ...n, read: true })));
    } catch (error) {
      console.log('markAllRead error:', error);
      Alert.alert('Error', 'No se pudieron actualizar las notificaciones.');
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  const renderNotification = ({ item }: { item: AppNotification }) => (
    <TouchableOpacity onPress={() => markAsRead(item)} activeOpacity={0.8}>
      <Card variant="elevated" style={[styles.card, !item.read && styles.unreadCard]}>
        <View style={styles.cardRow}>
          <View style={[styles.iconBg, !item.read && styles.unreadIconBg]}>
            <MaterialCommunityIcons
              name={getIcon(item.type) as any}
              size={24}
              color={!item.read ? colors.primaryDark : colors.textMuted}
            />
          </View>
          <View style={styles.textContainer}>
            <View style={styles.titleRow}>
              <Text style={styles.cardTitle}>{item.title}</Text>
              {!item.read && <View style={styles.unreadDot} />}
            </View>
            <Text style={styles.cardMessage}>{item.body}</Text>
            <Text style={styles.cardDate}>{formatDate(item.createdAt)}</Text>
            {item.type === 'promotion' && item.data?.couponCode ? (
              <View style={{ marginTop: spacing.sm }}>
                <Button
                  title={applyingCoupon === item.id ? 'Aplicando...' : `Usar descuento ${item.data.couponCode}`}
                  onPress={() => handleUseDiscount(item)}
                  variant="accent"
                  size="sm"
                  loading={applyingCoupon === item.id}
                />
              </View>
            ) : null}
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Notificaciones</Text>
        {unreadCount > 0 && (
          <TouchableOpacity onPress={markAllRead}>
            <Text style={styles.markAllText}>Marcar todas como leídas</Text>
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          renderItem={renderNotification}
          contentContainerStyle={styles.content}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="bell-outline" size={56} color={colors.textLight} />
              <Text style={styles.emptyTitle}>No tenés notificaciones</Text>
              <Text style={styles.emptyDesc}>
                Acá vas a ver confirmaciones de turnos, recordatorios de vacunas y novedades.
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgMain },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing['2xl'],
    paddingBottom: spacing.md,
  },
  title: { fontFamily: fonts.quicksand.bold, fontSize: fontSizes['2xl'], color: colors.textDark, letterSpacing: 0.4 },
  markAllText: { fontFamily: fonts.nunito.bold, fontSize: fontSizes.xs, color: colors.primaryDark },
  content: { paddingHorizontal: spacing.lg, paddingBottom: 120, flexGrow: 1 },
  centerState: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing['2xl'] },
  emptyTitle: { fontFamily: fonts.quicksand.bold, fontSize: fontSizes.lg, color: colors.textDark, marginTop: spacing.md },
  emptyDesc: { fontFamily: fonts.nunito.regular, fontSize: fontSizes.sm, color: colors.textMuted, textAlign: 'center', marginTop: spacing.xs },
  card: { marginBottom: spacing.sm, padding: spacing.md },
  unreadCard: { borderLeftWidth: 4, borderLeftColor: colors.primary, backgroundColor: colors.primarySoft },
  cardRow: { flexDirection: 'row', alignItems: 'flex-start' },
  iconBg: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.bgCard, justifyContent: 'center', alignItems: 'center', marginRight: spacing.md },
  unreadIconBg: { backgroundColor: colors.primarySoft },
  textContainer: { flex: 1 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { fontFamily: fonts.quicksand.bold, fontSize: fontSizes.md, color: colors.textDark, flex: 1 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary },
  cardMessage: { fontFamily: fonts.nunito.regular, fontSize: fontSizes.sm, color: colors.textMuted, marginTop: 2 },
  cardDate: { fontFamily: fonts.nunito.regular, fontSize: 10, color: colors.textLight, marginTop: spacing.xs },
});

export default NotificationsScreen;
