import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, ActivityIndicator, useWindowDimensions } from 'react-native';
import Theme from '../../../core/theme/theme';
import { Heading, Subheading, BodyText, Caption } from '../../../core/components/Typography';
import { Card } from '../../../core/components/Card';
import { Button } from '../../../core/components/Button';
import contractionApi from '../api/contractionApi';
import {
  formatDurationSeconds,
  formatInterval,
  formatSessionDate,
  formatClockTime,
  formatSessionLength,
  formatShortChartDate,
} from '../../../core/utils/timeFormat';

export const HomeDashboardScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { width } = useWindowDimensions();
  const isTablet = width > 768;
  const [loading, setLoading] = useState(true);
  const [latestStats, setLatestStats] = useState<{
    totalContractions: number;
    averageDuration: number;
    averageInterval: number;
    peakIntensity: number;
    sessionDurationMinutes: number;
    date: string;
  } | null>(null);

  useEffect(() => {
    const fetchLatestSession = async () => {
      try {
        const data = await contractionApi.getSessions({ limit: 1 });
        const sessions = data.sessions || [];

        if (sessions.length > 0) {
          const latest = sessions[0];
          setLatestStats({
            ...latest.stats,
            date: formatSessionDate(latest.session.startTime),
          });
        }
      } catch (err) {
        console.error('Error fetching monitoring data:', err);
      } finally {
        setLoading(false);
      }
    };

    const unsubscribe = navigation.addListener('focus', () => {
      fetchLatestSession();
    });

    return unsubscribe;
  }, [navigation]);

  return (
    <View style={styles.container}>
      <View style={styles.headerSection}>
        <Heading style={styles.title}>Smart Belt Monitoring</Heading>
        <BodyText style={styles.subtitle}>
          Connect your belt via Bluetooth, calibrate, and track contraction patterns.
        </BodyText>
      </View>

      <ScrollView contentContainerStyle={[styles.scroll, isTablet && styles.scrollTablet]}>
        <Card style={styles.launchCard}>
          <Subheading style={styles.sectionTitle}>Start a Session</Subheading>
          <BodyText style={styles.launchDescription}>
            Pair your Smart Maternal Belt, run calibration, then begin live telemetry tracking.
          </BodyText>

          <Button
            title="Connect Belt via Bluetooth"
            onPress={() => navigation.navigate('DeviceConnection')}
            style={styles.actionBtn}
          />

          <Button
            title="Manual Contraction Tracker"
            variant="outline"
            onPress={() => navigation.navigate('ManualRecording')}
            style={styles.manualBtn}
          />
        </Card>

        <Card style={styles.summaryCard}>
          <Subheading style={styles.sectionTitle}>Latest Session</Subheading>
          {loading ? (
            <ActivityIndicator size="small" color={Theme.colors.primary} />
          ) : latestStats ? (
            <View>
              <Caption style={styles.dateLabel}>Recorded on {latestStats.date}</Caption>

              <View style={styles.grid}>
                <View style={styles.gridItem}>
                  <Caption>Contractions</Caption>
                  <Subheading style={styles.metricVal}>{latestStats.totalContractions}</Subheading>
                </View>
                <View style={styles.gridItem}>
                  <Caption>Avg Duration</Caption>
                  <Subheading style={styles.metricVal}>{formatDurationSeconds(latestStats.averageDuration)}</Subheading>
                </View>
                <View style={styles.gridItem}>
                  <Caption>Avg Interval</Caption>
                  <Subheading style={styles.metricVal}>{formatInterval(latestStats.averageInterval)}</Subheading>
                </View>
                <View style={styles.gridItem}>
                  <Caption>Peak Tension</Caption>
                  <Subheading style={styles.metricVal}>{Math.round(latestStats.peakIntensity)}%</Subheading>
                </View>
              </View>

              <Button
                title="View Session History"
                variant="outline"
                size="small"
                onPress={() => navigation.navigate('SessionHistory')}
                style={styles.historyShortcutBtn}
              />
            </View>
          ) : (
            <View style={styles.emptyBox}>
              <Caption>No sessions yet. Connect your belt to get started.</Caption>
            </View>
          )}
        </Card>

        <View style={styles.shortcutsRow}>
          <Card onPress={() => navigation.navigate('Analytics')} style={styles.shortcutCard}>
            <Subheading style={styles.shortcutTitle}>Trends</Subheading>
            <Caption>Analytics curves</Caption>
          </Card>

          <Card onPress={() => navigation.navigate('Settings')} style={styles.shortcutCard}>
            <Subheading style={styles.shortcutTitle}>Settings</Subheading>
            <Caption>Bluetooth & thresholds</Caption>
          </Card>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.colors.background },
  headerSection: {
    paddingHorizontal: Theme.spacing.xl,
    paddingTop: Theme.spacing.xxl,
    paddingBottom: Theme.spacing.md,
    backgroundColor: Theme.colors.cardBackground,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.divider,
  },
  title: { color: Theme.colors.primaryDark },
  subtitle: { color: Theme.colors.textSecondary, marginTop: 4, lineHeight: 18 },
  scroll: { padding: Theme.spacing.xl, paddingBottom: 80 },
  scrollTablet: { alignSelf: 'center', width: '100%', maxWidth: 800 },
  launchCard: { padding: Theme.spacing.lg, marginBottom: Theme.spacing.md },
  sectionTitle: { color: Theme.colors.text, marginBottom: Theme.spacing.sm },
  launchDescription: {
    fontSize: Theme.typography.sizes.sm,
    color: Theme.colors.textSecondary,
    marginBottom: Theme.spacing.lg,
    lineHeight: 18,
  },
  actionBtn: { width: '100%' },
  manualBtn: { width: '100%', marginTop: Theme.spacing.sm },
  summaryCard: { padding: Theme.spacing.lg, marginBottom: Theme.spacing.md },
  dateLabel: { marginBottom: Theme.spacing.md },
  grid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Theme.spacing.md },
  gridItem: { flex: 1, alignItems: 'center' },
  metricVal: { color: Theme.colors.primary, marginTop: 4 },
  historyShortcutBtn: { marginTop: Theme.spacing.sm },
  emptyBox: { alignItems: 'center', paddingVertical: Theme.spacing.lg },
  shortcutsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  shortcutCard: { width: '48%', padding: Theme.spacing.md },
  shortcutTitle: { fontSize: Theme.typography.sizes.base, color: Theme.colors.text, marginBottom: 4 },
});

export default HomeDashboardScreen;
