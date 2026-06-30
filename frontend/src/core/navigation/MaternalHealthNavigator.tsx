import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import Theme from '../theme/theme';
import { SosButton } from '../components/SosButton';

import HealthDashboardScreen from '../../features/maternal-health/screens/HealthDashboardScreen';
import HeartRateDetailScreen from '../../features/maternal-health/screens/HeartRateDetailScreen';
import TemperatureDetailScreen from '../../features/maternal-health/screens/TemperatureDetailScreen';
import StressDetailScreen from '../../features/maternal-health/screens/StressDetailScreen';
import ActivityDetailScreen from '../../features/maternal-health/screens/ActivityDetailScreen';
import ContractionDetailScreen from '../../features/maternal-health/screens/ContractionDetailScreen';
import SyncStatusScreen from '../../features/maternal-health/screens/SyncStatusScreen';
import SpO2DetailScreen from '../../features/maternal-health/screens/SpO2DetailScreen';

// In a real app we would define the param list type.
const Stack = createStackNavigator();

export const MaternalHealthNavigator = () => {
  return (
    <Stack.Navigator
      initialRouteName="HealthDashboard"
      screenOptions={{
        headerStyle: {
          backgroundColor: Theme.colors.background,
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 1,
          borderBottomColor: Theme.colors.divider,
        },
        headerTintColor: Theme.colors.text,
        headerTitleStyle: {
          fontWeight: Theme.typography.weights.semibold as any,
          fontSize: Theme.typography.sizes.lg,
        },
        headerBackTitleVisible: false,
        cardStyle: { backgroundColor: Theme.colors.background },
        headerRight: () => <SosButton />,
      }}
    >
      <Stack.Screen 
        name="HealthDashboard" 
        component={HealthDashboardScreen} 
        options={{ title: 'Maternal Health', headerLeft: () => null }} 
      />
      <Stack.Screen 
        name="HeartRateDetail" 
        component={HeartRateDetailScreen} 
        options={{ title: 'Heart Rate' }} 
      />
      <Stack.Screen 
        name="TemperatureDetail" 
        component={TemperatureDetailScreen} 
        options={{ title: 'Body Temperature' }} 
      />
      <Stack.Screen 
        name="StressDetail" 
        component={StressDetailScreen} 
        options={{ title: 'Stress Level' }} 
      />
      <Stack.Screen 
        name="ActivityDetail" 
        component={ActivityDetailScreen} 
        options={{ title: 'Activity & Sleep' }} 
      />
      <Stack.Screen 
        name="ContractionDetail" 
        component={ContractionDetailScreen} 
        options={{ title: 'Contractions' }} 
      />
      <Stack.Screen 
        name="SyncStatus" 
        component={SyncStatusScreen} 
        options={{ title: 'Cloud Sync Status' }} 
      />
      <Stack.Screen 
        name="SpO2Detail" 
        component={SpO2DetailScreen} 
        options={{ title: 'Blood Oxygen' }} 
      />
    </Stack.Navigator>
  );
};

export default MaternalHealthNavigator;
