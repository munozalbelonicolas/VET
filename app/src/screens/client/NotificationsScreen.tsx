// ============================================================
// Veterinaria La Plata — Notifications Screen
// ============================================================
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, fonts, fontSizes, spacing, borderRadius, shadows } from '../../config/theme';
import { Card, Badge, Button } from '../../components/ui';
import { sendSystemNotification } from '../../services/notificationService';

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  date: string;
  type: 'vaccine' | 'appointment' | 'promo' | 'order';
  read: boolean;
}

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: '1',
    title: '💉 Recordatorio de Vacunación',
    message: 'A Luna le toca la vacuna Sextuple en 5 días. Podés agendar tu turno ahora.',
    date: 'Hoy, 10:30 hs',
    type: 'vaccine',
    read: false,
  },
  {
    id: '2',
    title: '📅 Turno Confirmado',
    message: 'Tu turno para Consulta General ha sido confirmado para mañana a las 10:00 hs.',
    date: 'Ayer',
    type: 'appointment',
    read: true,
  },
  {
    id: '3',
    title: '🎁 ¡20% OFF en Alimentos Premium!',
    message: 'Aprovechá 20% de descuento en alimentos marca Royal Canin y Pro Plan.',
    date: 'Hace 3 días',
    type: 'promo',
    read: true,
  },
];

export const NotificationsScreen: React.FC = () => {
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);

  const markAsRead = (id: string) => {
    setNotifications(
      notifications.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const getIcon = (type: NotificationItem['type']) => {
    switch (type) {
      case 'vaccine':
        return 'syringe';
      case 'appointment':
        return 'calendar-clock';
      case 'promo':
        return 'tag';
      case 'order':
        return 'truck-delivery';
      default:
        return 'bell';
    }
  };

  const handleTestNotification = async () => {
    try {
      await sendSystemNotification({
        title: '🐾 Veterinaria La Plata',
        body: '¡Hola! Esta es una notificación nativa de prueba con sonido y banner del sistema.',
        data: { test: true },
      });
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Notificaciones 🔔</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Button
          title="Probar Notificación Nativa 🔔"
          onPress={handleTestNotification}
          variant="primary"
          style={styles.testBtn}
        />
        {notifications.map((n) => (
          <TouchableOpacity key={n.id} onPress={() => markAsRead(n.id)} activeOpacity={0.8}>
            <Card
              variant="elevated"
              style={[styles.card, !n.read && styles.unreadCard]}
            >
              <View style={styles.cardRow}>
                <View style={[styles.iconBg, !n.read && styles.unreadIconBg]}>
                  <MaterialCommunityIcons
                    name={getIcon(n.type)}
                    size={24}
                    color={!n.read ? colors.primaryDark : colors.textMuted}
                  />
                </View>
                <View style={styles.textContainer}>
                  <View style={styles.titleRow}>
                    <Text style={styles.cardTitle}>{n.title}</Text>
                    {!n.read && <View style={styles.unreadDot} />}
                  </View>
                  <Text style={styles.cardMessage}>{n.message}</Text>
                  <Text style={styles.cardDate}>{n.date}</Text>
                </View>
              </View>
            </Card>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgMain },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing['2xl'],
    paddingBottom: spacing.md,
  },
  title: { fontFamily: fonts.quicksand.bold, fontSize: fontSizes['2xl'], color: colors.textDark },
  content: { paddingHorizontal: spacing.lg, paddingBottom: spacing['3xl'] },
  card: { marginBottom: spacing.sm, padding: spacing.md },
  unreadCard: { borderLeftWidth: 4, borderLeftColor: colors.primary, backgroundColor: colors.primarySoft + '33' },
  cardRow: { flexDirection: 'row', alignItems: 'flex-start' },
  iconBg: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.bgCard, justifyContent: 'center', alignItems: 'center', marginRight: spacing.md },
  unreadIconBg: { backgroundColor: colors.primarySoft },
  textContainer: { flex: 1 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { fontFamily: fonts.quicksand.bold, fontSize: fontSizes.md, color: colors.textDark, flex: 1 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary },
  cardMessage: { fontFamily: fonts.nunito.regular, fontSize: fontSizes.sm, color: colors.textMuted, marginTop: 2 },
  cardDate: { fontFamily: fonts.nunito.regular, fontSize: 10, color: colors.textLight, marginTop: spacing.xs },
  testBtn: { marginBottom: spacing.md },
});

export default NotificationsScreen;
