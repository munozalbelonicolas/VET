// ============================================================
// Veterinaria La Plata — Client Tab Navigator
// Animated tab bar with paw icons
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
import { colors, fonts, fontSizes, spacing, shadows } from '../config/theme';

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
        tabBarIcon: ({ focused, color, size }) => {
          const iconName = focused
            ? tabIcons[route.name]?.active
            : tabIcons[route.name]?.inactive;

          return (
            <View style={focused ? styles.activeIconContainer : undefined}>
              <MaterialCommunityIcons
                name={iconName as any}
                size={focused ? 26 : 24}
                color={color}
              />
              {focused && <View style={styles.activeIndicator} />}
            </View>
          );
        },
        tabBarLabel: tabLabels[route.name],
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: {
          fontFamily: fonts.nunito.semiBold,
          fontSize: fontSizes.xs,
          marginTop: -2,
        },
        tabBarStyle: {
          backgroundColor: colors.bgCard,
          borderTopWidth: 0,
          height: 85,
          paddingTop: spacing.sm,
          paddingBottom: spacing.xl,
          ...shadows.lg,
        },
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
  },
  activeIndicator: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: colors.primary,
    marginTop: 3,
  },
});

export default ClientTabs;
