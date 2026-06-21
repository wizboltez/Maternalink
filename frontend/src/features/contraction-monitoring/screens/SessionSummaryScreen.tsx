import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, ActivityIndicator, Alert, Linking } from 'react-native';
import Theme from '../../../core/theme/theme';
import { Heading, Subheading, BodyText, Caption } from '../../../core/components/Typography';
import { Card } from '../../../core/components/Card';
import { Button } from '../../../core/components/Button';
import contractionApi from '../api/contractionApi';

interface ContractionReadItem {
  timestamp: string;
  duration?: number;
  interval?: number;
  intensity?: number;
}

export const SessionSummaryScreen: React.FC<{ route: any; navigation: any }> = ({ route, navigation }) => {
  const sessionId = route.params?.sessionId || '6674681144f8dc05b2ee13c1';
  
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<{
    totalContractions: number;
    averageDuration: number;
    averageInterval: number;
    peakIntensity: number;
    sessionDurationMinutes: number;
  } | null>(null);
  
  const [contractions, setContractions] = useState<ContractionReadItem[]>([]);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const data = await contractionApi.getSessionDetails(sessionId);
        setStats(data.stats);
        
        // Filter out readings that are flagged as actual contractions
        const filtered = data.readings
          .filter((r: any) => r.isContraction)
          .map((r: any) => ({
            timestamp: new Date(r.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            duration: r.duration,
            interval: r.interval,
            intensity: r.intensity,
          }));
        
        setContractions(filtered);
      } catch (err: any) {
        Alert.alert('Load Error', 'Failed to retrieve session statistics details.');
      } finally {
        setLoading(false);
      }
    };

    fetchSummary();
  }, [sessionId]);

  const handleExportPdf = () => {
    const url = contractionApi.getPdfReportUrl(sessionId);
    Linking.openURL(url).catch(() => Alert.alert('Export Error', 'Cannot launch browser download.'));
  };

  const handleExportCsv = () => {
    const url = contractionApi.getCsvReportUrl(sessionId);
    Linking.openURL(url).catch(() => Alert.alert('Export Error', 'Cannot launch browser download.'));
  };

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={Theme.colors.primary} />
        <Caption style={styles.loadingText}>Compiling reports statistics...</Caption>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Heading style={styles.title}>Session Summary</Heading>
        <BodyText style={styles.subtitle}>
          Analysis summary and contraction metrics tables.
        </BodyText>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Main stats card grid */}
        {stats && (
          <Card style={styles.statsCard}>
            <Subheading style={styles.statsTitle}>Session Metrics</Subheading>

            <View style={styles.grid}>
              <View style={styles.gridItem}>
                <Caption>Total Contractions</Caption>
                <Heading style={styles.statVal}>{stats.totalContractions}</Heading>
              </View>
              <View style={styles.gridItem}>
                <Caption>Avg Duration</Caption>
                <Heading style={styles.statVal}>{stats.averageDuration}s</Heading>
              </View>
              <View style={styles.gridItem}>
                <Caption>Avg Interval</Caption>
                <Heading style={styles.statVal}>
                  {stats.averageInterval > 0 ? `${Math.round(stats.averageInterval / 60)}m` : 'N/A'}
                </Heading>
              </View>
              <View style={styles.gridItem}>
                <Caption>Peak Intensity</Caption>
                <Heading style={styles.statVal}>{Math.round(stats.peakIntensity)}%</Heading>
              </View>
            </View>
          </Card>
        )}

        {/* Detailed Timeline list */}
        <Card style={styles.timelineCard}>
          <Subheading style={styles.timelineHeader}>Contractions Log</Subheading>
          
          {contractions.length === 0 ? (
            <Caption style={styles.emptyText}>No contractions registered during this session.</Caption>
          ) : (
            contractions.map((c, idx) => (
              <View key={idx} style={styles.row}>
                <View>
                  <BodyText style={styles.timeLabel}>#{contractions.length - idx} at {c.timestamp}</BodyText>
                  {c.interval && (
                    <Caption style={styles.intervalText}>
                      Interval: {Math.round(c.interval / 60)} min {c.interval % 60} sec
                    </Caption>
                  )}
                </View>
                <View style={styles.durationCol}>
                  <BodyText style={styles.durationVal}>{c.duration}s</BodyText>
                  <Caption>Duration</Caption>
                </View>
              </View>
            ))
          )}
        </Card>

        {/* Medical disclaimer reminder */}
        <Card style={styles.disclaimerCard}>
          <Subheading style={styles.warnTitle}>⚠️ Safety Notice</Subheading>
          <BodyText style={styles.disclaimerText}>
            These contraction indicators are for support and pattern tracking only. They should never replace clinical judgment. If you feel unwell or suspect real labor, immediately contact your obstetric provider or emergency hospital.
          </BodyText>
        </Card>

        {/* Export buttons row */}
        <View style={styles.btnRow}>
          <Button
            title="Export CSV Data"
            variant="outline"
            onPress={handleExportCsv}
            style={styles.halfBtn}
          />
          <Button
            title="Export PDF Report"
            onPress={handleExportPdf}
            style={styles.halfBtn}
          />
        </View>

        <Button
          title="Return to Dashboard"
          variant="secondary"
          onPress={() => navigation.navigate('MonitoringHome')}
          style={styles.exitBtn}
        />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: Theme.spacing.md,
  },
  header: {
    paddingHorizontal: Theme.spacing.xl,
    paddingTop: Theme.spacing.xxl,
    paddingBottom: Theme.spacing.md,
  },
  title: {
    color: Theme.colors.primaryDark,
  },
  subtitle: {
    color: Theme.colors.textSecondary,
    marginTop: Theme.spacing.xs,
  },
  scroll: {
    padding: Theme.spacing.xl,
  },
  statsCard: {
    padding: Theme.spacing.lg,
  },
  statsTitle: {
    color: Theme.colors.text,
    marginBottom: Theme.spacing.md,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  gridItem: {
    width: '48%',
    padding: Theme.spacing.md,
    borderWidth: 1,
    borderColor: Theme.colors.divider,
    borderRadius: Theme.borders.radius.md,
    marginBottom: Theme.spacing.md,
    alignItems: 'center',
  },
  statVal: {
    color: Theme.colors.primary,
    marginTop: Theme.spacing.xs,
  },
  timelineCard: {
    padding: Theme.spacing.lg,
  },
  timelineHeader: {
    color: Theme.colors.text,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.divider,
    paddingBottom: Theme.spacing.sm,
    marginBottom: Theme.spacing.md,
  },
  emptyText: {
    textAlign: 'center',
    paddingVertical: Theme.spacing.md,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.divider,
  },
  timeLabel: {
    color: Theme.colors.text,
    fontWeight: Theme.typography.weights.medium,
  },
  intervalText: {
    marginTop: 2,
  },
  durationCol: {
    alignItems: 'flex-end',
  },
  durationVal: {
    color: Theme.colors.primary,
    fontWeight: Theme.typography.weights.semibold,
  },
  disclaimerCard: {
    borderColor: Theme.colors.danger,
    borderWidth: 1,
    backgroundColor: '#FFFFFF',
    padding: Theme.spacing.lg,
  },
  warnTitle: {
    color: Theme.colors.danger,
    marginBottom: Theme.spacing.sm,
  },
  disclaimerText: {
    fontSize: Theme.typography.sizes.sm,
    color: Theme.colors.textSecondary,
    lineHeight: 18,
  },
  btnRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: Theme.spacing.md,
  },
  halfBtn: {
    flex: 1,
    marginHorizontal: Theme.spacing.xs,
  },
  exitBtn: {
    marginTop: Theme.spacing.xs,
    marginBottom: Theme.spacing.xxl,
  },
});
export default SessionSummaryScreen;
