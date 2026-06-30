import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import Theme from '../theme/theme';
import { SosButton } from '../components/SosButton';

import HomeDashboardScreen from '../../features/contraction-monitoring/screens/HomeDashboardScreen';
import DeviceConnectionScreen from '../../features/contraction-monitoring/screens/DeviceConnectionScreen';
import CalibrationWizardScreen from '../../features/contraction-monitoring/screens/CalibrationWizardScreen';
import LiveMonitoringScreen from '../../features/contraction-monitoring/screens/LiveMonitoringScreen';
import ManualRecordingScreen from '../../features/contraction-monitoring/screens/ManualRecordingScreen';
import SessionSummaryScreen from '../../features/contraction-monitoring/screens/SessionSummaryScreen';
import SessionHistoryScreen from '../../features/contraction-monitoring/screens/SessionHistoryScreen';
import AnalyticsScreen from '../../features/contraction-monitoring/screens/AnalyticsScreen';
import SettingsScreen from '../../features/contraction-monitoring/screens/SettingsScreen';

export type ContractionStackParamList = {
  MonitoringHome: undefined;
  DeviceConnection: undefined;
  CalibrationWizard: { deviceId: string };
  LiveMonitoring: { sessionId: string; deviceId: string; calibrationConfidence: number };
  ManualRecording: undefined;
  SessionSummary: { sessionId: string };
  SessionHistory: undefined;
  Analytics: undefined;
  Settings: undefined;
};

const Stack = createStackNavigator<ContractionStackParamList>();

const screenOptions = {
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
  cardStyle: {
    backgroundColor: Theme.colors.background,
  },
  headerRight: () => <SosButton />,
};

export const ContractionMonitoringNavigator: React.FC = () => {
  return (
    <Stack.Navigator initialRouteName="MonitoringHome" screenOptions={screenOptions}>
      <Stack.Screen
        name="MonitoringHome"
        component={HomeDashboardScreen}
        options={{ title: 'Contraction Monitoring' }}
      />
      <Stack.Screen
        name="DeviceConnection"
        component={DeviceConnectionScreen}
        options={{ title: 'Belt Connection' }}
      />
      <Stack.Screen
        name="CalibrationWizard"
        component={CalibrationWizardScreen}
        options={{ title: 'Calibration Wizard' }}
      />
      <Stack.Screen
        name="LiveMonitoring"
        component={LiveMonitoringScreen}
        options={{ title: 'Live Tracking' }}
      />
      <Stack.Screen
        name="ManualRecording"
        component={ManualRecordingScreen}
        options={{ title: 'Manual Recording' }}
      />
      <Stack.Screen
        name="SessionSummary"
        component={SessionSummaryScreen}
        options={{ title: 'Session Summary' }}
      />
      <Stack.Screen
        name="SessionHistory"
        component={SessionHistoryScreen}
        options={{ title: 'History Logs' }}
      />
      <Stack.Screen
        name="Analytics"
        component={AnalyticsScreen}
        options={{ title: 'Analytics' }}
      />
      <Stack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ title: 'Monitoring Settings' }}
      />
    </Stack.Navigator>
  );
};

export default ContractionMonitoringNavigator;
