// ============================================================
// Veterinaria La Plata — Main App Navigator
// Role-based routing with code splitting
// ============================================================
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuthStore } from '../store/authStore';
import { RootStackParamList } from '../types';
import { colors } from '../config/theme';

// Navigation stacks
import AuthStack from './AuthStack';
import ClientTabs from './ClientTabs';
import OnboardingScreen from '../screens/onboarding/OnboardingScreen';

// Staff dashboards
import {
  VetDashboardScreen,
  GroomerDashboardScreen,
  ReceptionistDashboardScreen,
  AdminDashboardScreen,
} from '../screens/staff/DashboardScreens';

const Stack = createNativeStackNavigator<RootStackParamList>();

const AppNavigator: React.FC = () => {
  const { isAuthenticated, user, hasSeenOnboarding, setHasSeenOnboarding } = useAuthStore();

  // Determine which screen to show
  const getInitialRoute = (): keyof RootStackParamList => {
    if (!hasSeenOnboarding) return 'Onboarding';
    if (!isAuthenticated) return 'Auth';

    switch (user?.role) {
      case 'client': return 'ClientApp';
      case 'vet': return 'VetApp';
      case 'groomer': return 'GroomerApp';
      case 'receptionist': return 'ReceptionistApp';
      case 'admin': return 'AdminApp';
      default: return 'Auth';
    }
  };

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.bgMain },
        animation: 'fade',
      }}
    >
      {!hasSeenOnboarding && (
        <Stack.Screen name="Onboarding">
          {() => (
            <OnboardingScreen
              onComplete={() => setHasSeenOnboarding(true)}
            />
          )}
        </Stack.Screen>
      )}

      {!isAuthenticated ? (
        <Stack.Screen name="Auth" component={AuthStack} />
      ) : (
        <>
          {user?.role === 'client' && (
            <Stack.Screen name="ClientApp" component={ClientTabs} />
          )}
          {user?.role === 'vet' && (
            <Stack.Screen name="VetApp" component={VetDashboardScreen} />
          )}
          {user?.role === 'groomer' && (
            <Stack.Screen name="GroomerApp" component={GroomerDashboardScreen} />
          )}
          {user?.role === 'receptionist' && (
            <Stack.Screen name="ReceptionistApp" component={ReceptionistDashboardScreen} />
          )}
          {user?.role === 'admin' && (
            <Stack.Screen name="AdminApp" component={AdminDashboardScreen} />
          )}
        </>
      )}
    </Stack.Navigator>
  );
};

export default AppNavigator;
