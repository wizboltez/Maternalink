import React from 'react';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';
import Theme from '../theme/theme';
import { useAuth } from '../context/AuthContext';

import MainTabNavigator from './MainTabNavigator';
import LoginScreen from '../../features/auth/screens/LoginScreen';
import RegisterScreen from '../../features/auth/screens/RegisterScreen';

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

const AuthStack = createStackNavigator<AuthStackParamList>();

export const AppNavigator: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={Theme.colors.primary} />
      </View>
    );
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

  return <MainTabNavigator />;
};

const styles = StyleSheet.create({
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Theme.colors.background,
  },
});

export default AppNavigator;
