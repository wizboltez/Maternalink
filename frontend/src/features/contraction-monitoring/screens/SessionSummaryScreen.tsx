import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, ActivityIndicator, Alert } from 'react-native';
import Theme from '../../../core/theme/theme';
import { Heading, Subheading, BodyText, Caption } from '../../../core/components/Typography';
import { Card } from '../../../core/components/Card';
import { Button } from '../../../core/components/Button';
import contractionApi from '../api/contractionApi';
import { printSessionPdf } from '../../../core/services/pdfExportService';
import {
  formatDurationSeconds,
  formatInterval,
  formatSessionLength,
  formatClockTime,
} from '../../../core/utils/timeFormat';

export const SessionSummaryScreen: React.FC<{ route: any; navigation: any }> = ({ route, navigation }) => {
  const sessionId = route.params?.sessionId;

  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [stats, setStats] = useState<{
    totalContractions: number;
    averageDuration: number;
    averageInterval: number;
    peakIntensity: number;
    sessionDurationMinutes: number;
  } | null>(null);

  const [contractions, setContractions] = useState<
    { timestamp: string; duration?: number; interval?: number; intensity?: number }[]
  >([]);

  useEffect(() => {
    if (!sessionId) return;
    const fetchSummary = async () => {
      try {
        const data = await contractionApi.getSessionDetails(sessionId);
        setStats(data.stats);

        const filtered = data.readings
          .filter((r: any) => r.isContraction)
          .map((r: any) => ({
            timestamp: formatClockTime(r.timestamp),
            duration: r.duration,
            interval: r.interval,
            intensity: r.intensity,
          }));

        setContractions(filtered);
      } catch {
        Alert.alert('Load Error', 'Failed to retrieve session details.');
      } finally {
        setLoading(false);
      }
    };
    fetchSummary();
  }, [sessionId]);

  const handleExportPdf = async () => {
    if (!sessionId) return;
    setExporting(true);
    try {
      await printSessionPdf(sessionId);
    } finally {
      setExporting(false);
    }
  };

  if (!sessionId) {
    return (
      <View style={styles.loaderContainer}>
        <BodyText>Invalid session.</BodyText>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={Theme.colors.primary} />
        <Caption style={styles.loadingText}>Loading session summary...</Caption>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Heading style={styles.title}>Session Summary</Heading>
        <BodyText style={styles.subtitle}>Review metrics and export a PDF report for this session.</BodyText>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {stats && (
          <Card style={styles.statsCard}>
            <Subheading style={styles.statsTitle}>Session Metrics</Subheading>
            <View style={styles.grid}>
              <View style={styles.gridItem}>
                <Caption>Session Length</Caption>
                <Heading style={styles.statVal}>{formatSessionLength(stats.sessionDurationMinutes)}</Heading>
              </View>
              <View style={styles.gridItem}>
                <Caption>Contractions</Caption>
                <Heading style={styles.statVal}>{stats.totalContractions}</Heading>
              </View>
              <View style={styles.gridItem}>
                <Caption>Avg Duration</Caption>
                <Heading style={styles.statVal}>{formatDurationSeconds(stats.averageDuration)}</Heading>
              </View>
              <View style={styles.gridItem}>
                <Caption>Avg Interval</Caption>
                <Heading style={styles.statVal}>{formatInterval(stats.averageInterval)}</Heading>
              </View>
              <View style={[styles.gridItem, styles.fullWidthItem]}>
                <Caption>Peak Intensity</Caption>
                <Heading style={styles.statVal}>{Math.round(stats.peakIntensity)}%</Heading>
              </View>
            </View>
          </Card>
        )}

        <Card style={styles.timelineCard}>
          <Subheading style={styles.timelineHeader}>Contraction Timeline</Subheading>
          {contractions.length === 0 ? (
            <Caption style={styles.emptyText}>No contractions recorded in this session.</Caption>
          ) : (
            contractions.map((c, idx) => (
              <View key={idx} style={styles.row}>
                <View>
                  <BodyText style={styles.timeLabel}>
                    #{contractions.length - idx} at {c.timestamp}
                  </BodyText>
                  {c.interval != null && c.interval > 0 && (
                    <Caption style={styles.intervalText}>Interval: {formatInterval(c.interval)}</Caption>
                  )}
                </View>
                <View style={styles.durationCol}>
                  <BodyText style={styles.durationVal}>{formatDurationSeconds(c.duration)}</BodyText>
                  <Caption>Duration</Caption>
                </View>
              </View>
            ))
          )}
        </Card>

        <Button
          title={exporting ? 'Opening Print Dialog...' : 'Print / Export PDF Report'}
          onPress={handleExportPdf}
          loading={exporting}
          style={styles.exportBtn}
        />

        <Button
          title="Back to Monitoring"
          variant="outline"
          onPress={() => navigation.navigate('MonitoringHome')}
          style={styles.exitBtn}
        />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.colors.background },
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: Theme.spacing.md },
  header: { paddingHorizontal: Theme.spacing.xl, paddingTop: Theme.spacing.xxl, paddingBottom: Theme.spacing.md },
  title: { color: Theme.colors.primaryDark },
  subtitle: { color: Theme.colors.textSecondary, marginTop: Theme.spacing.xs },
  scroll: { padding: Theme.spacing.xl, paddingBottom: 80 },
  statsCard: { padding: Theme.spacing.lg, marginBottom: Theme.spacing.md },
  statsTitle: { color: Theme.colors.text, marginBottom: Theme.spacing.md },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  gridItem: {
    width: '48%',
    padding: Theme.spacing.md,
    borderWidth: 1,
    borderColor: Theme.colors.divider,
    borderRadius: Theme.borders.radius.md,
    marginBottom: Theme.spacing.md,
    alignItems: 'center',
  },
  fullWidthItem: { width: '100%' },
  statVal: { color: Theme.colors.primary, marginTop: Theme.spacing.xs, fontSize: Theme.typography.sizes.lg },
  timelineCard: { padding: Theme.spacing.lg, marginBottom: Theme.spacing.md },
  timelineHeader: {
    color: Theme.colors.text,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.divider,
    paddingBottom: Theme.spacing.sm,
    marginBottom: Theme.spacing.md,
  },
  emptyText: { textAlign: 'center', paddingVertical: Theme.spacing.md },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.divider,
  },
  timeLabel: { color: Theme.colors.text, fontWeight: Theme.typography.weights.medium },
  intervalText: { marginTop: 2 },
  durationCol: { alignItems: 'flex-end' },
  durationVal: { color: Theme.colors.primary, fontWeight: Theme.typography.weights.semibold },
  exportBtn: { marginBottom: Theme.spacing.sm },
  exitBtn: { marginBottom: Theme.spacing.xxl },
});

export default SessionSummaryScreen;
