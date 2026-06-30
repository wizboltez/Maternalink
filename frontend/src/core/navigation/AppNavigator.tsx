import React, { useState, useEffect } from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import Theme from '../theme/theme';
import { useAuth } from '../context/AuthContext';
import { bluetoothService } from '../services/bluetoothService';

import MainTabNavigator from './MainTabNavigator';
import LoginScreen from '../../features/auth/screens/LoginScreen';
import RegisterScreen from '../../features/auth/screens/RegisterScreen';
import PregnancyProfileScreen from '../../features/profile/screens/PregnancyProfileScreen';
import SplashScreen from '../../features/auth/screens/SplashScreen';
import EmergencyContactsScreen from '../../features/emergency/screens/EmergencyContactsScreen';
import EmergencySettingsScreen from '../../features/emergency/screens/EmergencySettingsScreen';
import EmergencyAlertHistoryScreen from '../../features/emergency/screens/EmergencyAlertHistoryScreen';
import HealthScreen from '../../features/health/screens/HealthScreen';

export type AppStackParamList = {
  Main: undefined;
  PregnancyProfile: { isEdit: boolean } | undefined;
  EmergencyContacts: undefined;
  EmergencySettings: undefined;
  EmergencyAlertHistory: undefined;
  Health: undefined;
};

const Stack = createStackNavigator<AppStackParamList>();

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

const AuthStack = createStackNavigator<AuthStackParamList>();

export const AppNavigator: React.FC = () => {
  const { isAuthenticated, isLoading, profile } = useAuth();
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    if (!showSplash) {
      // Request all permissions right when the app opens
      bluetoothService.requestPermissions().catch(console.warn);
    }
  }, [showSplash]);

  if (isLoading || showSplash) {
    return <SplashScreen onAnimationComplete={() => setShowSplash(false)} />;
  }

  if (!isAuthenticated) {
    return (
      <AuthStack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: Theme.colors.cardBackground },
          headerTintColor: Theme.colors.primaryDark,
          cardStyle: { backgroundColor: Theme.colors.background },
        }}
      >
        <AuthStack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
        <AuthStack.Screen name="Register" component={RegisterScreen} options={{ title: 'Create Account' }} />
      </AuthStack.Navigator>
    );
  }

  // Force profile setup if it does not exist yet
  if (!profile) {
    return (
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="PregnancyProfile" component={PregnancyProfileScreen} />
      </Stack.Navigator>
    );
  }

  // Show primary tab navigators and register emergency/health stack screens
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: Theme.colors.cardBackground,
          elevation: 2,
          shadowColor: '#1A0C22',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.05,
          shadowRadius: 5,
        },
        headerTintColor: Theme.colors.primaryDark,
        headerTitleStyle: {
          fontWeight: Theme.typography.weights.semibold,
          fontSize: Theme.typography.sizes.md,
          fontFamily: Theme.typography.fontFamily,
        },
        cardStyle: { backgroundColor: Theme.colors.background },
      }}
    >
      <Stack.Screen name="Main" component={MainTabNavigator} options={{ headerShown: false }} />
      <Stack.Screen name="PregnancyProfile" component={PregnancyProfileScreen} options={{ headerShown: false }} />
      <Stack.Screen name="EmergencyContacts" component={EmergencyContactsScreen} options={{ title: 'Emergency Contacts' }} />
      <Stack.Screen name="EmergencySettings" component={EmergencySettingsScreen} options={{ title: 'Alert Settings' }} />
      <Stack.Screen name="EmergencyAlertHistory" component={EmergencyAlertHistoryScreen} options={{ title: 'Incident logs' }} />
      <Stack.Screen name="Health" component={HealthScreen} options={{ title: 'Health Hub' }} />
    </Stack.Navigator>
  );
};

export default AppNavigator;
