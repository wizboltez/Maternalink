import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useNavigation, useNavigationState } from '@react-navigation/native';
import Theme from '../theme/theme';

import MainHomeScreen from '../../features/dashboard/screens/MainHomeScreen';
import GuidanceNavigator from './GuidanceNavigator';
import ProfileScreen from '../../features/profile/screens/ProfileScreen';
import ContractionMonitoringNavigator from './ContractionMonitoringNavigator';
import MaternalHealthNavigator from './MaternalHealthNavigator';

export type MainTabParamList = {
  Home: undefined;
  Guidance: undefined;
  Monitoring: undefined;
  Vitals: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

const TabIcon: React.FC<{ label: string; focused: boolean }> = ({ label, focused }) => (
  <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.5 }}>{label}</Text>
);

function getActiveRouteName(state: { routes: { name: string; state?: unknown }[]; index: number } | undefined): string {
  if (!state) return '';
  const route = state.routes[state.index];
  if (route.state) {
    return getActiveRouteName(route.state as typeof state);
  }
  return route.name;
}

const FloatingChatButton: React.FC = () => {
  const navigation = useNavigation<any>();
  const activeRoute = useNavigationState((state) => getActiveRouteName(state));

  if (activeRoute === 'Chatbot') return null;

  return (
    <TouchableOpacity
      style={styles.fab}
      activeOpacity={0.85}
      onPress={() => navigation.getParent()?.navigate('Chatbot')}
      accessibilityLabel="Open AI Chat"
    >
      <Text style={styles.fabIcon}>💬</Text>
    </TouchableOpacity>
  );
};

export const MainTabNavigator: React.FC = () => {
  return (
    <View style={styles.container}>
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
          name="Guidance"
          component={GuidanceNavigator}
          options={{
            tabBarLabel: 'Guidance',
            tabBarIcon: ({ focused }) => <TabIcon label="📋" focused={focused} />,
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
          name="Vitals"
          component={MaternalHealthNavigator}
          options={{
            tabBarLabel: 'Vitals',
            tabBarIcon: ({ focused }) => <TabIcon label="❤️" focused={focused} />,
          }}
        />
        <Tab.Screen
          name="Profile"
          component={ProfileScreen}
          options={{
            tabBarLabel: 'Settings',
            tabBarIcon: ({ focused }) => <TabIcon label="⚙️" focused={focused} />,
          }}
        />
      </Tab.Navigator>
      <FloatingChatButton />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 72,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#1A0C22',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
  },
  fabIcon: {
    fontSize: 24,
  },
});

export default MainTabNavigator;
