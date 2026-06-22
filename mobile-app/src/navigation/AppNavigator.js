import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

// Screens
import LoginScreen from '../screens/LoginScreen';
import DashboardScreen from '../screens/DashboardScreen';
import DailySummaryScreen from '../screens/DailySummaryScreen';
import WeeklyTrendsScreen from '../screens/WeeklyTrendsScreen';
import InsightsScreen from '../screens/InsightsScreen';
import EmergencyScreen from '../screens/EmergencyScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function DashboardTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === 'Dashboard') {
            iconName = focused ? 'dashboard' : 'dashboard';
          } else if (route.name === 'Daily') {
            iconName = focused ? 'today' : 'today';
          } else if (route.name === 'Weekly') {
            iconName = focused ? 'show-chart' : 'show-chart';
          } else if (route.name === 'Insights') {
            iconName = focused ? 'insights' : 'insights';
          } else if (route.name === 'Emergency') {
            iconName = focused ? 'sos' : 'warning';
          }
          return <MaterialIcons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#FF6B6B',
        tabBarInactiveTintColor: '#999',
      })}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{ title: 'Real-Time' }}
      />
      <Tab.Screen
        name="Daily"
        component={DailySummaryScreen}
        options={{ title: 'Daily Summary' }}
      />
      <Tab.Screen
        name="Weekly"
        component={WeeklyTrendsScreen}
        options={{ title: 'Weekly Trends' }}
      />
      <Tab.Screen
        name="Insights"
        component={InsightsScreen}
        options={{ title: 'Insights' }}
      />
      <Tab.Screen
        name="Emergency"
        component={EmergencyScreen}
        options={{ title: 'Emergency' }}
      />
    </Tab.Navigator>
  );
}

export default function AppNavigator({ userToken }) {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        {userToken == null ? (
          <Stack.Screen
            name="Login"
            component={LoginScreen}
            options={{ headerShown: false }}
          />
        ) : (
          <Stack.Screen
            name="Main"
            component={DashboardTabs}
            options={{ headerShown: false }}
          />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
