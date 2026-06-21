import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';
import Theme from '../theme/theme';

import MainHomeScreen from '../../features/dashboard/screens/MainHomeScreen';
import HealthScreen from '../../features/health/screens/HealthScreen';
import ProfileScreen from '../../features/profile/screens/ProfileScreen';
import ContractionMonitoringNavigator from './ContractionMonitoringNavigator';

export type MainTabParamList = {
  Home: undefined;
  Health: undefined;
  Monitoring: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

const TabIcon: React.FC<{ label: string; focused: boolean }> = ({ label, focused }) => (
  <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.5 }}>{label}</Text>
);

export const MainTabNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Theme.colors.primary,
        tabBarInactiveTintColor: Theme.colors.textMuted,
        tabBarStyle: {
          backgroundColor: Theme.colors.cardBackground,
          borderTopColor: Theme.colors.divider,
          paddingBottom: 4,
          height: 58,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={MainHomeScreen}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ focused }) => <TabIcon label="🏠" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Health"
        component={HealthScreen}
        options={{
          tabBarLabel: 'Health',
          tabBarIcon: ({ focused }) => <TabIcon label="🩺" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Monitoring"
        component={ContractionMonitoringNavigator}
        options={{
          tabBarLabel: 'Monitor',
          tabBarIcon: ({ focused }) => <TabIcon label="📡" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ focused }) => <TabIcon label="👤" focused={focused} />,
        }}
      />
    </Tab.Navigator>
  );
};

export default MainTabNavigator;
