// ============================================================
// Role-specific dashboard screens (Fases 4-5)
// Integrated with Clinical, Grooming, and Admin Screens
// ============================================================
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, fonts, fontSizes, spacing, shadows } from '../../config/theme';
import { Card, Button } from '../../components/ui';
import { useAuthStore } from '../../store/authStore';
import VetClinicalScreen from './VetClinicalScreen';
import MarketingScreen from './MarketingScreen';
import VetScheduleScreen from './VetScheduleScreen';
import GroomingHubScreen from './GroomingHubScreen';
import ReceptionistHubScreen from './ReceptionistHubScreen';
import AdminHubScreen from './AdminHubScreen';

// --- Vet Dashboard ---
export const VetDashboardScreen: React.FC = () => {
  const { user, logout } = useAuthStore();
  const [currentView, setCurrentView] = useState<'dashboard' | 'clinical' | 'schedule'>('dashboard');

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

  const stats = [
    { label: 'Turnos hoy', value: '8', icon: 'calendar-today', color: colors.primary },
    { label: 'Completados', value: '3', icon: 'check-circle', color: colors.success },
    { label: 'Pendientes', value: '5', icon: 'clock-outline', color: colors.warning },
    { label: 'Pacientes', value: '124', icon: 'paw', color: colors.accent },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.greeting}>Hola, Dr. {user?.name?.split(' ').pop()} 🩺</Text>
      <Text style={styles.date}>{new Date().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}</Text>

      <View style={styles.statsGrid}>
        {stats.map((stat, i) => (
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
          <Text style={styles.menuText}>Mi Agenda Médica</Text>
          <MaterialCommunityIcons name="chevron-right" size={24} color={colors.textLight} />
        </View>
      </Card>

      <Button title="Cerrar sesión" onPress={logout} variant="ghost" style={{ marginTop: spacing.xl }} />
    </ScrollView>
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

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.greeting}>Hola, {user?.name?.split(' ')[0]} ✂️</Text>
      <Text style={styles.date}>{new Date().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}</Text>

      <View style={styles.statsGrid}>
        {[
          { label: 'Turnos hoy', value: '6', icon: 'scissors-cutting', color: colors.primary },
          { label: 'Completados', value: '2', icon: 'check-circle', color: colors.success },
        ].map((stat, i) => (
          <Card key={i} variant="elevated" style={styles.statCard}>
            <MaterialCommunityIcons name={stat.icon as any} size={28} color={stat.color} />
            <Text style={styles.statValue}>{stat.value}</Text>
            <Text style={styles.statLabel}>{stat.label}</Text>
          </Card>
        ))}
      </View>

      <Card variant="elevated" style={styles.menuCard} onPress={() => setCurrentView('hub')}>
        <View style={styles.menuRow}>
          <MaterialCommunityIcons name="content-cut" size={24} color={colors.primary} />
          <Text style={styles.menuText}>Ir al Panel de Peluquería</Text>
          <MaterialCommunityIcons name="chevron-right" size={24} color={colors.textLight} />
        </View>
      </Card>

      <Button title="Cerrar sesión" onPress={logout} variant="ghost" style={{ marginTop: spacing.xl }} />
    </ScrollView>
  );
};

// --- Receptionist Dashboard ---
export const ReceptionistDashboardScreen: React.FC = () => {
  return <ReceptionistHubScreen />;
};

// --- Admin Dashboard ---
export const AdminDashboardScreen: React.FC = () => {
  const { user, logout } = useAuthStore();
  const [currentView, setCurrentView] = useState<'dashboard' | 'marketing' | 'calendar' | 'products' | 'orders' | 'employees'>('dashboard');

  if (currentView === 'marketing') {
    return (
      <View style={{ flex: 1 }}>
        <TouchableOpacity style={styles.topBackBar} onPress={() => setCurrentView('dashboard')}>
          <MaterialCommunityIcons name="arrow-left" size={20} color={colors.textDark} />
          <Text style={styles.topBackText}>Volver al Panel Principal</Text>
        </TouchableOpacity>
        <MarketingScreen />
      </View>
    );
  }

  if (currentView === 'calendar' || currentView === 'products' || currentView === 'orders' || currentView === 'employees') {
    return (
      <View style={{ flex: 1 }}>
        <TouchableOpacity style={styles.topBackBar} onPress={() => setCurrentView('dashboard')}>
          <MaterialCommunityIcons name="arrow-left" size={20} color={colors.textDark} />
          <Text style={styles.topBackText}>Volver al Panel Principal</Text>
        </TouchableOpacity>
        <AdminHubScreen initialTab={currentView} />
      </View>
    );
  }

  const kpis = [
    { label: 'Ingresos mes', value: '$452.000', icon: 'cash', color: colors.success },
    { label: 'Turnos hoy', value: '14', icon: 'calendar-today', color: colors.primary },
    { label: 'Pacientes nuevos', value: '12', icon: 'account-plus', color: colors.accent },
    { label: 'Ventas Petshop', value: '38', icon: 'cart', color: colors.warning },
  ];

  const mainModules = [
    { id: 'calendar', label: '📅 Agenda y Turnos Clínicos', icon: 'calendar-month', color: colors.primary },
    { id: 'products', label: '🏷️ Catálogo de Productos & Stock', icon: 'storefront', color: colors.accent },
    { id: 'orders', label: '🚚 Pedidos y Envíos E-Commerce', icon: 'truck-delivery', color: colors.success },
    { id: 'employees', label: '👥 Personal y Empleados', icon: 'account-group', color: colors.warning },
    { id: 'marketing', label: '📢 Marketing & Campañas Push', icon: 'bullhorn', color: colors.secondary },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.greeting}>Panel Administrador 🏥</Text>
      <Text style={styles.subGreeting}>Bienvenido, {user?.name?.split(' ')[0]}</Text>

      <View style={styles.statsGrid}>
        {kpis.map((kpi, i) => (
          <Card key={i} variant="elevated" style={styles.statCard}>
            <MaterialCommunityIcons name={kpi.icon as any} size={28} color={kpi.color} />
            <Text style={styles.statValue}>{kpi.value}</Text>
            <Text style={styles.statLabel}>{kpi.label}</Text>
          </Card>
        ))}
      </View>

      <Text style={{ fontFamily: fonts.quicksand.bold, fontSize: fontSizes.md, color: colors.textDark, marginBottom: spacing.sm }}>
        Gestión Principal
      </Text>

      {mainModules.map((mod) => (
        <Card
          key={mod.id}
          variant="elevated"
          style={styles.menuCard}
          onPress={() => setCurrentView(mod.id as any)}
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
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgMain },
  content: { paddingHorizontal: spacing.lg, paddingTop: spacing['2xl'], paddingBottom: spacing['3xl'] },
  topBackBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg, paddingTop: spacing['2xl'], paddingBottom: spacing.xs, backgroundColor: colors.bgMain },
  topBackText: { fontFamily: fonts.nunito.bold, fontSize: fontSizes.sm, color: colors.textDark, marginLeft: spacing.xs },
  greeting: { fontFamily: fonts.quicksand.bold, fontSize: fontSizes['2xl'], color: colors.textDark },
  subGreeting: { fontFamily: fonts.nunito.regular, fontSize: fontSizes.md, color: colors.textMuted, marginTop: spacing.xs },
  date: { fontFamily: fonts.nunito.regular, fontSize: fontSizes.md, color: colors.textMuted, marginTop: spacing.xs, marginBottom: spacing.xl, textTransform: 'capitalize' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: spacing.lg },
  statCard: { width: '48%', alignItems: 'center', paddingVertical: spacing.lg, marginBottom: spacing.md },
  statValue: { fontFamily: fonts.quicksand.bold, fontSize: fontSizes.lg, color: colors.textDark, marginTop: spacing.sm },
  statLabel: { fontFamily: fonts.nunito.regular, fontSize: fontSizes.xs, color: colors.textMuted, marginTop: spacing.xs },
  menuCard: { marginBottom: spacing.sm, padding: spacing.lg },
  menuRow: { flexDirection: 'row', alignItems: 'center' },
  menuText: { flex: 1, fontFamily: fonts.nunito.semiBold, fontSize: fontSizes.md, color: colors.textDark, marginLeft: spacing.md },
});
