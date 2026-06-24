import React, { useState } from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import Theme from '../theme/theme';
import { useAuth } from '../context/AuthContext';

import MainTabNavigator from './MainTabNavigator';
import LoginScreen from '../../features/auth/screens/LoginScreen';
import RegisterScreen from '../../features/auth/screens/RegisterScreen';
import PregnancyProfileScreen from '../../features/profile/screens/PregnancyProfileScreen';
import SplashScreen from '../../features/auth/screens/SplashScreen';

export type AppStackParamList = {
  Main: undefined;
  PregnancyProfile: { isEdit: boolean } | undefined;
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

  // Show primary tab navigators and register the Profile screen on stack to navigate to
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Main" component={MainTabNavigator} />
      <Stack.Screen name="PregnancyProfile" component={PregnancyProfileScreen} />
    </Stack.Navigator>
  );
};

export default AppNavigator;
