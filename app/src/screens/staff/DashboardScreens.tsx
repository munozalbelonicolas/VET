// ============================================================
// Role-specific dashboard screens (Fases 4-5)
// Integrated with Clinical, Grooming, and Admin Screens
// ============================================================
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, fonts, fontSizes, spacing, shadows, borderRadius } from '../../config/theme';
import { Card, Button } from '../../components/ui';
import { useAuthStore } from '../../store/authStore';
import VetClinicalScreen from './VetClinicalScreen';
import MarketingScreen from './MarketingScreen';
import VetScheduleScreen from './VetScheduleScreen';
import GroomingHubScreen from './GroomingHubScreen';
import ReceptionistHubScreen from './ReceptionistHubScreen';
import AdminHubScreen, { AdminHubScreenTab } from './AdminHubScreen';
import { getAllAppointments, getAllPets } from '../../services/dataService';
import { getOrders, getProducts } from '../../services/shopService';
import { getAllFollowUps } from '../../services/adminService';
import { MetricsChart, BarDatum } from '../../components/ui/MetricsChart';

const todayRange = (): { start: Date; end: Date } => {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  return { start, end };
};

// --- Vet Dashboard ---
export const VetDashboardScreen: React.FC = () => {
  const { user, logout } = useAuthStore();
  const [currentView, setCurrentView] = useState<'dashboard' | 'clinical' | 'schedule'>('dashboard');
  const [stats, setStats] = useState({ today: 0, completed: 0, pending: 0, patients: 0 });

  useEffect(() => {
    if (user?.role !== 'vet') return;
    (async () => {
      try {
        const [apps, pets] = await Promise.all([getAllAppointments(), getAllPets()]);
        const { start, end } = todayRange();
        const today = apps.filter((a) => a.date >= start && a.date <= end);
        setStats({
          today: today.length,
          completed: today.filter((a) => a.status === 'completed').length,
          pending: today.filter((a) => a.status === 'pending' || a.status === 'confirmed').length,
          patients: pets.length,
        });
      } catch (error) {
        console.log('Vet stats error:', error);
      }
    })();
  }, [user?.role]);

  if (currentView === 'clinical') {
    return (
      <View style={{ flex: 1 }}>
        <TouchableOpacity style={styles.topBackBar} onPress={() => setCurrentView('dashboard')}>
          <MaterialCommunityIcons name="arrow-left" size={20} color={colors.textDark} />
          <Text style={styles.topBackText}>Volver al Dashboard</Text>
        </TouchableOpacity>
        <VetClinicalScreen />
      </View>
    );
  }

  if (currentView === 'schedule') {
    return (
      <View style={{ flex: 1 }}>
        <TouchableOpacity style={styles.topBackBar} onPress={() => setCurrentView('dashboard')}>
          <MaterialCommunityIcons name="arrow-left" size={20} color={colors.textDark} />
          <Text style={styles.topBackText}>Volver al Dashboard</Text>
        </TouchableOpacity>
        <VetScheduleScreen />
      </View>
    );
  }

  if (user?.role !== 'vet') {
    return (
      <View style={styles.noAccess}>
        <MaterialCommunityIcons name="shield-lock-outline" size={48} color={colors.danger} />
        <Text style={styles.noAccessText}>No tenés permisos de veterinario.</Text>
      </View>
    );
  }

  const statCards = [
    { label: 'Turnos hoy', value: String(stats.today), icon: 'calendar-today', color: colors.primary },
    { label: 'Completados', value: String(stats.completed), icon: 'check-circle', color: colors.success },
    { label: 'Pendientes', value: String(stats.pending), icon: 'clock-outline', color: colors.warning },
    { label: 'Pacientes', value: String(stats.patients), icon: 'paw', color: colors.accent },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bgMain }} edges={['top', 'left', 'right']}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.greeting}>Hola, {user?.name?.split(' ').pop() || 'Doctor'}</Text>
      <Text style={styles.date}>{new Date().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}</Text>

      <View style={styles.statsGrid}>
        {statCards.map((stat, i) => (
          <Card key={i} variant="elevated" style={styles.statCard}>
            <MaterialCommunityIcons name={stat.icon as any} size={28} color={stat.color} />
            <Text style={styles.statValue}>{stat.value}</Text>
            <Text style={styles.statLabel}>{stat.label}</Text>
          </Card>
        ))}
      </View>

      <Card variant="elevated" style={styles.menuCard} onPress={() => setCurrentView('clinical')}>
        <View style={styles.menuRow}>
          <MaterialCommunityIcons name="clipboard-text" size={24} color={colors.primary} />
          <Text style={styles.menuText}>Historias Clínicas & Consultas</Text>
          <MaterialCommunityIcons name="chevron-right" size={24} color={colors.textLight} />
        </View>
      </Card>

      <Card variant="elevated" style={styles.menuCard} onPress={() => setCurrentView('schedule')}>
        <View style={styles.menuRow}>
          <MaterialCommunityIcons name="calendar" size={24} color={colors.primary} />
          <Text style={styles.menuText}>Agenda Médica</Text>
          <MaterialCommunityIcons name="chevron-right" size={24} color={colors.textLight} />
        </View>
      </Card>

      <Button title="Cerrar sesión" onPress={logout} variant="ghost" style={{ marginTop: spacing.xl }} />
      </ScrollView>
    </SafeAreaView>
  );
};

// --- Groomer Dashboard ---
export const GroomerDashboardScreen: React.FC = () => {
  const { user, logout } = useAuthStore();

  const [currentView, setCurrentView] = useState<'dashboard' | 'hub'>('dashboard');

  if (currentView === 'hub') {
    return (
      <View style={{ flex: 1 }}>
        <TouchableOpacity style={styles.topBackBar} onPress={() => setCurrentView('dashboard')}>
          <MaterialCommunityIcons name="arrow-left" size={20} color={colors.textDark} />
          <Text style={styles.topBackText}>Volver al Dashboard</Text>
        </TouchableOpacity>
        <GroomingHubScreen />
      </View>
    );
  }

  if (user?.role !== 'groomer') {
    return (
      <View style={styles.noAccess}>
        <MaterialCommunityIcons name="shield-lock-outline" size={48} color={colors.danger} />
        <Text style={styles.noAccessText}>No tenés permisos de peluquero.</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bgMain }} edges={['top', 'left', 'right']}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.greeting}>Hola, {user?.name?.split(' ')[0] || ''}</Text>
      <Text style={styles.date}>{new Date().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}</Text>

      <Card variant="elevated" style={styles.menuCard} onPress={() => setCurrentView('hub')}>
        <View style={styles.menuRow}>
          <MaterialCommunityIcons name="content-cut" size={24} color={colors.primary} />
          <Text style={styles.menuText}>Ir al Panel de Peluquería</Text>
          <MaterialCommunityIcons name="chevron-right" size={24} color={colors.textLight} />
        </View>
      </Card>

      <Button title="Cerrar sesión" onPress={logout} variant="ghost" style={{ marginTop: spacing.xl }} />
      </ScrollView>
    </SafeAreaView>
  );
};

// --- Receptionist Dashboard ---
export const ReceptionistDashboardScreen: React.FC = () => {
  const { user } = useAuthStore();
  if (user?.role !== 'receptionist' && user?.role !== 'admin') {
    return (
      <View style={styles.noAccess}>
        <MaterialCommunityIcons name="shield-lock-outline" size={48} color={colors.danger} />
        <Text style={styles.noAccessText}>No tenés permisos de recepción.</Text>
      </View>
    );
  }
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bgMain }} edges={['top', 'left', 'right']}>
      <ReceptionistHubScreen />
    </SafeAreaView>
  );
};

// --- Admin Dashboard ---
type AdminView =
  | 'dashboard'
  | 'marketing'
  | 'calendar'
  | 'products'
  | 'orders'
  | 'employees'
  | 'coupons'
  | 'settings'
  | 'followups'
  | 'logs';

type RangeKey = 'today' | 'week' | 'month';

const rangeBounds = (key: RangeKey): { start: Date; end: Date } => {
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  const start = new Date();
  if (key === 'today') {
    start.setHours(0, 0, 0, 0);
  } else if (key === 'week') {
    start.setDate(start.getDate() - 7);
    start.setHours(0, 0, 0, 0);
  } else {
    start.setDate(1);
    start.setHours(0, 0, 0, 0);
  }
  return { start, end };
};

export const AdminDashboardScreen: React.FC = () => {
  const { user, logout } = useAuthStore();
  const [currentView, setCurrentView] = useState<AdminView>('dashboard');
  const [range, setRange] = useState<RangeKey>('today');
  const [metrics, setMetrics] = useState({
    revenue: 0,
    appointments: 0,
    clients: 0,
    pets: 0,
    orders: 0,
    products: 0,
    pendingOrders: 0,
    lowStock: [] as { name: string; stock: number }[],
    overdueFollowUps: 0,
    unconfirmedAppointments: 0,
    revenueByMonth: [] as BarDatum[],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.role !== 'admin') return;
    (async () => {
      setLoading(true);
      try {
        const [apps, pets, orders, products, followUps] = await Promise.all([
          getAllAppointments(),
          getAllPets(),
          getOrders(),
          getProducts(),
          getAllFollowUps(),
        ]);

        const { start, end } = rangeBounds(range);
        const inRange = (d: Date) => d >= start && d <= end;

        const approvedOrders = orders.filter((o) => o.paymentStatus === 'approved');
        const revenueInRange = approvedOrders
          .filter((o) => inRange(new Date(o.createdAt)))
          .reduce((sum, o) => sum + o.total, 0);

        // Ingresos por mes (últimos 6 meses)
        const monthMap = new Map<string, number>();
        approvedOrders.forEach((o) => {
          const d = new Date(o.createdAt);
          const key = `${d.getFullYear()}-${d.getMonth()}`;
          monthMap.set(key, (monthMap.get(key) || 0) + o.total);
        });
        const now = new Date();
        const revenueByMonth: BarDatum[] = [];
        for (let i = 5; i >= 0; i--) {
          const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
          const key = `${d.getFullYear()}-${d.getMonth()}`;
          revenueByMonth.push({
            label: d.toLocaleDateString('es-AR', { month: 'short' }),
            value: monthMap.get(key) || 0,
          });
        }

        const clients = new Set(pets.map((p) => p.ownerId)).size;
        const lowStock = products
          .filter((p) => p.stock <= 5)
          .map((p) => ({ name: p.name, stock: p.stock }))
          .slice(0, 8);
        const overdueFollowUps = followUps.filter((f) => f.status === 'overdue').length;
        const unconfirmedAppointments = apps.filter((a) => a.status === 'pending').length;

        setMetrics({
          revenue: revenueInRange,
          appointments: apps.filter((a) => inRange(new Date(a.date))).length,
          clients,
          pets: pets.length,
          orders: orders.length,
          products: products.length,
          pendingOrders: orders.filter((o) => o.shippingStatus === 'preparing' || o.shippingStatus === 'in_transit').length,
          lowStock,
          overdueFollowUps,
          unconfirmedAppointments,
          revenueByMonth,
        });
      } catch (error) {
        console.log('Admin KPIs error:', error);
      } finally {
        setLoading(false);
      }
    })();
  }, [user?.role, range]);

  if (user?.role !== 'admin') {
    return (
      <View style={styles.noAccess}>
        <MaterialCommunityIcons name="shield-lock-outline" size={48} color={colors.danger} />
        <Text style={styles.noAccessText}>No tenés permisos de administrador.</Text>
      </View>
    );
  }

  if (currentView !== 'dashboard') {
    const isHubTab =
      currentView === 'calendar' ||
      currentView === 'products' ||
      currentView === 'orders' ||
      currentView === 'employees' ||
      currentView === 'coupons' ||
      currentView === 'settings' ||
      currentView === 'followups' ||
      currentView === 'logs';
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bgMain }} edges={['top', 'left', 'right']}>
        <TouchableOpacity style={styles.topBackBar} onPress={() => setCurrentView('dashboard')}>
          <MaterialCommunityIcons name="arrow-left" size={20} color={colors.textDark} />
          <Text style={styles.topBackText}>Volver al Panel Principal</Text>
        </TouchableOpacity>
        {currentView === 'marketing' ? (
          <MarketingScreen />
        ) : isHubTab ? (
          <AdminHubScreen initialTab={currentView as AdminHubScreenTab} />
        ) : null}
      </SafeAreaView>
    );
  }

  const kpiCards = [
    { label: 'Ingresos', value: `$${metrics.revenue.toLocaleString('es-AR')}`, icon: 'cash', color: colors.success },
    { label: 'Turnos', value: String(metrics.appointments), icon: 'calendar-today', color: colors.primary },
    { label: 'Clientes', value: String(metrics.clients), icon: 'account-group', color: colors.accent },
    { label: 'Pedidos', value: String(metrics.orders), icon: 'cart', color: colors.warning },
  ];

  const alerts: { label: string; desc: string; icon: string; color: string; onPress: () => void }[] = [];
  if (metrics.lowStock.length > 0) {
    alerts.push({
      label: `${metrics.lowStock.length} producto(s) con stock bajo`,
      desc: metrics.lowStock.map((p) => `${p.name} (${p.stock})`).slice(0, 3).join(', '),
      icon: 'package-variant',
      color: colors.warning,
      onPress: () => setCurrentView('products'),
    });
  }
  if (metrics.pendingOrders > 0) {
    alerts.push({
      label: `${metrics.pendingOrders} pedido(s) pendientes de envío`,
      desc: 'Hay pedidos en preparación que necesitan gestión.',
      icon: 'truck-delivery-outline',
      color: colors.primary,
      onPress: () => setCurrentView('orders'),
    });
  }
  if (metrics.overdueFollowUps > 0) {
    alerts.push({
      label: `${metrics.overdueFollowUps} seguimiento(s) clínico(s) vencidos`,
      desc: 'Controles médicos que superaron su fecha límite.',
      icon: 'calendar-clock',
      color: colors.danger,
      onPress: () => setCurrentView('followups'),
    });
  }
  if (metrics.unconfirmedAppointments > 0) {
    alerts.push({
      label: `${metrics.unconfirmedAppointments} turno(s) sin confirmar`,
      desc: 'Turnos pendientes de confirmación por el staff.',
      icon: 'calendar-question',
      color: colors.accent,
      onPress: () => setCurrentView('calendar'),
    });
  }

  const mainModules = [
    { id: 'calendar', label: 'Agenda y Turnos', icon: 'calendar-month', color: colors.primary },
    { id: 'products', label: 'Catálogo & Stock', icon: 'storefront', color: colors.accent },
    { id: 'orders', label: 'Pedidos y Envíos', icon: 'truck-delivery', color: colors.success },
    { id: 'employees', label: 'Personal', icon: 'account-group', color: colors.warning },
    { id: 'marketing', label: 'Campañas Push', icon: 'bullhorn', color: colors.accent },
    { id: 'coupons', label: 'Cupones de Descuento', icon: 'ticket-percent-outline', color: colors.primary },
    { id: 'followups', label: 'Seguimientos Clínicos', icon: 'clipboard-pulse-outline', color: colors.danger },
    { id: 'settings', label: 'Configuración Clínica', icon: 'cog-outline', color: colors.textMuted },
    { id: 'logs', label: 'Registro de Auditoría', icon: 'shield-account-outline', color: colors.primaryDark },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bgMain }} edges={['top', 'left', 'right']}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.greeting}>Panel Administrador</Text>
      <Text style={styles.subGreeting}>Bienvenido, {user?.name?.split(' ')[0]}</Text>

      {/* Rango de tiempo */}
      <View style={styles.rangeRow}>
        {([
          { id: 'today', label: 'Hoy' },
          { id: 'week', label: '7 días' },
          { id: 'month', label: 'Este mes' },
        ] as { id: RangeKey; label: string }[]).map((r) => (
          <TouchableOpacity
            key={r.id}
            style={[styles.rangePill, range === r.id && styles.rangePillActive]}
            onPress={() => setRange(r.id)}
          >
            <Text style={[styles.rangePillText, range === r.id && styles.rangePillTextActive]}>{r.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={{ paddingVertical: spacing['3xl'] }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <>
          {/* KPIs */}
          <View style={styles.statsGrid}>
            {kpiCards.map((kpi, i) => (
              <Card key={i} variant="elevated" style={styles.statCard}>
                <MaterialCommunityIcons name={kpi.icon as any} size={28} color={kpi.color} />
                <Text style={styles.statValue}>{kpi.value}</Text>
                <Text style={styles.statLabel}>{kpi.label}</Text>
              </Card>
            ))}
          </View>

          {/* Ingresos por mes */}
          <Text style={styles.sectionHeaderText}>Ingresos por mes</Text>
          <Card variant="elevated" style={styles.chartCard}>
            <MetricsChart data={metrics.revenueByMonth} color={colors.success} />
          </Card>

          {/* Alertas */}
          {alerts.length > 0 && (
            <>
              <Text style={styles.sectionHeaderText}>Requieren atención</Text>
              {alerts.map((a, i) => (
                <TouchableOpacity key={i} onPress={a.onPress} activeOpacity={0.85}>
                  <Card variant="highlight" style={styles.alertCard}>
                    <View style={[styles.alertIcon, { backgroundColor: `${a.color}1A` }]}>
                      <MaterialCommunityIcons name={a.icon as any} size={22} color={a.color} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.alertLabel}>{a.label}</Text>
                      <Text style={styles.alertDesc}>{a.desc}</Text>
                    </View>
                    <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textLight} />
                  </Card>
                </TouchableOpacity>
              ))}
            </>
          )}
        </>
      )}

      <Text style={styles.sectionHeaderText}>Gestión Principal</Text>
      {mainModules.map((mod) => (
        <Card
          key={mod.id}
          variant="elevated"
          style={styles.menuCard}
          onPress={() => setCurrentView(mod.id as AdminView)}
        >
          <View style={styles.menuRow}>
            <MaterialCommunityIcons name={mod.icon as any} size={24} color={mod.color} />
            <Text style={styles.menuText}>{mod.label}</Text>
            <MaterialCommunityIcons name="chevron-right" size={24} color={colors.textLight} />
          </View>
        </Card>
      ))}

      <Button title="Cerrar sesión" onPress={logout} variant="ghost" style={{ marginTop: spacing.xl }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgMain },
  content: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing['3xl'] },
  noAccess: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bgMain },
  noAccessText: { fontFamily: fonts.nunito.semiBold, fontSize: fontSizes.md, color: colors.textMuted, marginTop: spacing.md },
  topBackBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.sm, backgroundColor: colors.bgMain, borderBottomWidth: 1, borderBottomColor: colors.border },
  topBackText: { fontFamily: fonts.nunito.bold, fontSize: fontSizes.sm, color: colors.textDark, marginLeft: spacing.xs },
  greeting: { fontFamily: fonts.quicksand.bold, fontSize: fontSizes['2xl'], color: colors.textDark },
  subGreeting: { fontFamily: fonts.nunito.regular, fontSize: fontSizes.md, color: colors.textMuted, marginTop: spacing.xs },
  date: { fontFamily: fonts.nunito.regular, fontSize: fontSizes.md, color: colors.textMuted, marginTop: spacing.xs, marginBottom: spacing.xl, textTransform: 'capitalize' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: spacing.lg },
  statCard: { width: '48%', alignItems: 'center', paddingVertical: spacing.lg, marginBottom: spacing.md },
  statValue: { fontFamily: fonts.quicksand.bold, fontSize: fontSizes.lg, color: colors.textDark, marginTop: spacing.sm },
  statLabel: { fontFamily: fonts.nunito.regular, fontSize: fontSizes.xs, color: colors.textMuted, marginTop: spacing.xs },
  rangeRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
  rangePill: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
  },
  rangePillActive: { backgroundColor: colors.primarySoft, borderColor: colors.primary },
  rangePillText: { fontFamily: fonts.nunito.semiBold, fontSize: fontSizes.sm, color: colors.textMuted },
  rangePillTextActive: { color: colors.primaryDark, fontFamily: fonts.nunito.bold },
  sectionHeaderText: { fontFamily: fonts.quicksand.bold, fontSize: fontSizes.md, color: colors.textDark, marginBottom: spacing.sm, marginTop: spacing.md },
  chartCard: { padding: spacing.lg, marginBottom: spacing.md },
  alertCard: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, marginBottom: spacing.sm },
  alertIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
  alertLabel: { fontFamily: fonts.nunito.bold, fontSize: fontSizes.sm, color: colors.textDark },
  alertDesc: { fontFamily: fonts.nunito.regular, fontSize: fontSizes.xs, color: colors.textMuted, marginTop: 2 },
  menuCard: { marginBottom: spacing.sm, padding: spacing.lg },
  menuRow: { flexDirection: 'row', alignItems: 'center' },
  menuText: { flex: 1, fontFamily: fonts.nunito.semiBold, fontSize: fontSizes.md, color: colors.textDark, marginLeft: spacing.md },
});
