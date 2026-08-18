// ============================================================
// Veterinaria La Plata — Client Tab Navigator
// Tab bar premium: píldora flotante con indicador activo
// ============================================================
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import ClientHomeScreen from '../screens/client/HomeScreen';
import AppointmentsScreen from '../screens/client/AppointmentsScreen';
import ShopScreen from '../screens/client/ShopScreen';
import NotificationsScreen from '../screens/client/NotificationsScreen';
import ProfileScreen from '../screens/client/ProfileScreen';
import { ClientTabParamList } from '../types';
import { colors, fonts, fontSizes, spacing, borderRadius, shadows } from '../config/theme';

const Tab = createBottomTabNavigator<ClientTabParamList>();

const tabIcons: Record<string, { active: string; inactive: string }> = {
  Home: { active: 'home', inactive: 'home-outline' },
  Appointments: { active: 'calendar-check', inactive: 'calendar-outline' },
  Shop: { active: 'shopping', inactive: 'shopping-outline' },
  Notifications: { active: 'bell', inactive: 'bell-outline' },
  Profile: { active: 'account-circle', inactive: 'account-circle-outline' },
};

const tabLabels: Record<string, string> = {
  Home: 'Inicio',
  Appointments: 'Turnos',
  Shop: 'Tienda',
  Notifications: 'Avisos',
  Profile: 'Perfil',
};

const ClientTabs: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color }) => {
          const iconName = focused
            ? tabIcons[route.name]?.active
            : tabIcons[route.name]?.inactive;

          return (
            <View style={focused ? styles.activeIconContainer : undefined}>
              <MaterialCommunityIcons
                name={iconName as any}
                size={focused ? 24 : 23}
                color={color}
              />
            </View>
          );
        },
        tabBarLabel: tabLabels[route.name],
        tabBarActiveTintColor: colors.primaryDark,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: {
          fontFamily: fonts.nunito.semiBold,
          fontSize: fontSizes.xs,
          marginTop: 1,
        },
        tabBarStyle: {
          position: 'absolute',
          bottom: spacing.md,
          left: spacing.lg,
          right: spacing.lg,
          height: 68,
          paddingTop: spacing.xs,
          paddingBottom: spacing.sm,
          backgroundColor: colors.bgCard,
          borderTopWidth: 0,
          borderRadius: borderRadius.xl,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: colors.hairline,
          ...shadows.lg,
        },
        tabBarItemStyle: {
          borderRadius: borderRadius.full,
        },
        tabBarActiveBackgroundColor: colors.primarySoft,
      })}
    >
      <Tab.Screen name="Home" component={ClientHomeScreen} />
      <Tab.Screen name="Appointments" component={AppointmentsScreen} />
      <Tab.Screen name="Shop" component={ShopScreen} />
      <Tab.Screen name="Notifications" component={NotificationsScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  activeIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default ClientTabs;
