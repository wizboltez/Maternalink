import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Switch, ActivityIndicator, Alert } from 'react-native';
import Theme from '../../../core/theme/theme';
import { Heading, Subheading, BodyText, Caption } from '../../../core/components/Typography';
import { Card } from '../../../core/components/Card';
import { emergencyService, EmergencySettings } from '../services/emergencyService';

export const EmergencySettingsScreen: React.FC = () => {
  const [settings, setSettings] = useState<EmergencySettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setIsLoading(true);
    try {
      const data = await emergencyService.getSettings();
      setSettings(data);
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.error || 'Failed to load emergency settings.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggle = async (key: keyof Omit<EmergencySettings, '_id' | 'userId'>, value: boolean) => {
    if (!settings) return;
    
    // Optimistic UI update
    const previousSettings = { ...settings };
    const updatedSettings = { ...settings, [key]: value };
    setSettings(updatedSettings);
    
    setIsUpdating(true);
    try {
      const res = await emergencyService.updateSettings({ [key]: value });
      setSettings(res);
    } catch (error: any) {
      // Rollback on failure
      setSettings(previousSettings);
      Alert.alert('Error', error.response?.data?.error || 'Failed to update settings.');
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Theme.colors.primary} />
        <BodyText style={styles.loadingText}>Loading configurations...</BodyText>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Heading style={styles.title}>Emergency Settings</Heading>
        <BodyText style={styles.subtitle}>Configure notification channels and triggers</BodyText>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Subheading style={styles.sectionTitle}>Notification Channels</Subheading>
        
        <Card style={styles.settingCard}>
          <View style={styles.row}>
            <View style={styles.textContainer}>
              <Subheading style={styles.settingName}>WhatsApp Contacts Alert</Subheading>
              <Caption style={styles.settingDesc}>
                Send a detailed WhatsApp alert containing your location and biometrics to all your emergency contacts when an alert triggers.
              </Caption>
            </View>
            <Switch
              value={settings?.whatsappAlertsEnabled}
              onValueChange={(val) => handleToggle('whatsappAlertsEnabled', val)}
              trackColor={{ false: Theme.colors.divider, true: Theme.colors.primary + '80' }}
              thumbColor={settings?.whatsappAlertsEnabled ? Theme.colors.primary : Theme.colors.textMuted}
              disabled={isUpdating}
            />
          </View>
        </Card>

        <Card style={styles.settingCard}>
          <View style={styles.row}>
            <View style={styles.textContainer}>
              <Subheading style={styles.settingName}>Mobile Push Notifications</Subheading>
              <Caption style={styles.settingDesc}>
                Receive real-time push notifications on your phone confirming that an alert was registered and that contacts are notified.
              </Caption>
            </View>
            <Switch
              value={settings?.pushNotificationsEnabled}
              onValueChange={(val) => handleToggle('pushNotificationsEnabled', val)}
              trackColor={{ false: Theme.colors.divider, true: Theme.colors.primary + '80' }}
              thumbColor={settings?.pushNotificationsEnabled ? Theme.colors.primary : Theme.colors.textMuted}
              disabled={isUpdating}
            />
          </View>
        </Card>

        <Subheading style={styles.sectionTitle}>Alert Trigger Types</Subheading>

        <Card style={styles.settingCard}>
          <View style={styles.row}>
            <View style={styles.textContainer}>
              <Subheading style={styles.settingName}>Manual SOS Button</Subheading>
              <Caption style={styles.settingDesc}>
                Double-pressing the physical button on the Smart Maternal Belt will instantly broadcast a high-severity emergency alert.
              </Caption>
            </View>
            <Switch
              value={settings?.sosButtonEnabled}
              onValueChange={(val) => handleToggle('sosButtonEnabled', val)}
              trackColor={{ false: Theme.colors.divider, true: Theme.colors.primary + '80' }}
              thumbColor={settings?.sosButtonEnabled ? Theme.colors.primary : Theme.colors.textMuted}
              disabled={isUpdating}
            />
          </View>
        </Card>

        <Card style={styles.settingCard}>
          <View style={styles.row}>
            <View style={styles.textContainer}>
              <Subheading style={styles.settingName}>Automatic Sensor Alerts</Subheading>
              <Caption style={styles.settingDesc}>
                Enable background biometric monitoring. Alerts will trigger automatically if the belt detects falls, high stress, or fetal heartbeat abnormalities.
              </Caption>
            </View>
            <Switch
              value={settings?.autoAlertsEnabled}
              onValueChange={(val) => handleToggle('autoAlertsEnabled', val)}
              trackColor={{ false: Theme.colors.divider, true: Theme.colors.primary + '80' }}
              thumbColor={settings?.autoAlertsEnabled ? Theme.colors.primary : Theme.colors.textMuted}
              disabled={isUpdating}
            />
          </View>
        </Card>

        <Card style={styles.infoCard}>
          <Caption style={styles.infoText}>
            🛡️ Note: The Smart Maternal Belt runs vital checks locally. Keeping all options enabled is highly recommended for maximum patient coverage and quick response team alerts.
          </Caption>
        </Card>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.colors.background },
  header: { paddingHorizontal: Theme.spacing.xl, paddingTop: Theme.spacing.xxl, paddingBottom: Theme.spacing.md },
  title: { color: Theme.colors.primaryDark },
  subtitle: { color: Theme.colors.textSecondary, marginTop: Theme.spacing.xs },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: Theme.spacing.sm, color: Theme.colors.textSecondary },
  scroll: { padding: Theme.spacing.xl, paddingBottom: 100 },
  sectionTitle: { color: Theme.colors.primaryDark, marginTop: Theme.spacing.md, marginBottom: Theme.spacing.sm, fontWeight: '700' },
  settingCard: { padding: Theme.spacing.lg, marginBottom: Theme.spacing.md },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  textContainer: { flex: 1, marginRight: Theme.spacing.md },
  settingName: { color: Theme.colors.text, fontWeight: '600' },
  settingDesc: { color: Theme.colors.textSecondary, marginTop: Theme.spacing.xs, lineHeight: 18 },
  infoCard: { padding: Theme.spacing.md, backgroundColor: Theme.colors.primaryLight + '30', borderStyle: 'solid', borderWidth: 1, borderColor: Theme.colors.primary + '30', marginTop: Theme.spacing.lg },
  infoText: { fontStyle: 'italic', lineHeight: 16, color: Theme.colors.primaryDark },
});

export default EmergencySettingsScreen;
