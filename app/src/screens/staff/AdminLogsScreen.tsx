// ============================================================
// Veterinaria La Plata — AdminLogsScreen
// Registro de auditoría de acciones del admin
// ============================================================
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, fonts, fontSizes, spacing } from '../../config/theme';
import { Card } from '../../components/ui';
import { AdminLog } from '../../types';
import { getAdminLogs } from '../../services/adminService';

const actionLabels: Record<string, string> = {
  product_create: 'Creó producto',
  product_update: 'Editó producto',
  product_delete: 'Eliminó producto',
  stock_update: 'Actualizó stock',
  order_status: 'Cambió estado de pedido',
  tracking_update: 'Asignó tracking',
  employee_toggle: 'Cambió estado de empleado',
  coupon_create: 'Creó cupón',
  coupon_update: 'Editó cupón',
  coupon_delete: 'Eliminó cupón',
  coupon_toggle: 'Cambió estado de cupón',
  clinic_settings_update: 'Actualizó configuración clínica',
  campaign_create: 'Creó campaña',
  campaign_send: 'Envió campaña push',
  followup_complete: 'Completó seguimiento',
  appointment_confirm: 'Confirmó turno',
  appointment_assign: 'Asignó profesional a turno',
};

const getIcon = (action: string): string => {
  if (action.includes('product')) return 'package-variant';
  if (action.includes('coupon')) return 'ticket-percent-outline';
  if (action.includes('campaign')) return 'bullhorn';
  if (action.includes('order') || action.includes('tracking')) return 'truck-delivery-outline';
  if (action.includes('employee')) return 'account-group';
  if (action.includes('appointment')) return 'calendar-check';
  return 'shield-account-outline';
};

const formatDate = (d: Date): string =>
  d.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' }) + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

export const AdminLogsScreen: React.FC = () => {
  const [logs, setLogs] = useState<AdminLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const list = await getAdminLogs(50);
      setLogs(list);
      setLoading(false);
    })();
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Registro de Auditoría</Text>
        <Text style={styles.subtitle}>Últimas acciones administrativas</Text>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={logs}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <Card variant="elevated" style={styles.logCard}>
              <View style={styles.iconWrap}>
                <MaterialCommunityIcons name={getIcon(item.action) as any} size={20} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.action}>{actionLabels[item.action] || item.action}</Text>
                {item.target ? <Text style={styles.target}>{item.target}</Text> : null}
                {item.details ? <Text style={styles.details}>{item.details}</Text> : null}
                <Text style={styles.meta}>
                  {item.adminName || 'Admin'} • {formatDate(item.createdAt)}
                </Text>
              </View>
            </Card>
          )}
          ListEmptyComponent={
            <View style={styles.center}>
              <MaterialCommunityIcons name="shield-check-outline" size={40} color={colors.textLight} />
              <Text style={styles.emptyText}>Todavía no hay acciones registradas.</Text>
            </View>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgMain },
  header: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.sm },
  title: { fontFamily: fonts.quicksand.bold, fontSize: fontSizes.xl, color: colors.textDark },
  subtitle: { fontFamily: fonts.nunito.regular, fontSize: fontSizes.sm, color: colors.textMuted, marginTop: 2 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: spacing['3xl'] },
  list: { paddingHorizontal: spacing.lg, paddingBottom: 40 },
  logCard: { flexDirection: 'row', alignItems: 'flex-start', padding: spacing.md, marginBottom: spacing.sm },
  iconWrap: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
  action: { fontFamily: fonts.nunito.bold, fontSize: fontSizes.sm, color: colors.textDark },
  target: { fontFamily: fonts.nunito.regular, fontSize: fontSizes.xs, color: colors.primaryDark, marginTop: 2 },
  details: { fontFamily: fonts.nunito.regular, fontSize: fontSizes.xs, color: colors.textMuted, marginTop: 1 },
  meta: { fontFamily: fonts.nunito.regular, fontSize: 10, color: colors.textLight, marginTop: 4 },
  emptyText: { fontFamily: fonts.nunito.regular, fontSize: fontSizes.sm, color: colors.textMuted, marginTop: spacing.md },
});

export default AdminLogsScreen;
