import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, ActivityIndicator, Alert } from 'react-native';
import Theme from '../../../core/theme/theme';
import { Heading, Subheading, BodyText, Caption } from '../../../core/components/Typography';
import { Card } from '../../../core/components/Card';
import { CustomLineChart } from '../../../core/components/CustomLineChart';
import contractionApi from '../api/contractionApi';

export const AnalyticsScreen: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [sessionDates, setSessionDates] = useState<string[]>([]);
  const [countsData, setCountsData] = useState<number[]>([]);
  const [durationsData, setDurationsData] = useState<number[]>([]);
  const [intervalsData, setIntervalsData] = useState<number[]>([]);

  const [overallStats, setOverallStats] = useState({
    avgContractions: 0,
    avgDuration: 0,
    avgInterval: 0,
  });

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const data = await contractionApi.getSessions({ limit: 7 });
        const list = data.sessions || [];

        if (list.length === 0) {
          setLoading(false);
          return;
        }

        // Map session metrics in chronological order
        const chronological = [...list].reverse();
        
        const dates = chronological.map((s: any) =>
          new Date(s.session.startTime).toLocaleDateString([], { month: 'short', day: 'numeric' })
        );
        const counts = chronological.map((s: any) => s.stats.totalContractions);
        const durations = chronological.map((s: any) => s.stats.averageDuration);
        const intervals = chronological.map((s: any) => Math.round(s.stats.averageInterval / 60));

        setSessionDates(dates);
        setCountsData(counts);
        setDurationsData(durations);
        setIntervalsData(intervals);

        // Compute overall averages
        const totalCountsSum = counts.reduce((a, b) => a + b, 0);
        const totalDurationsSum = durations.reduce((a, b) => a + b, 0);
        const totalIntervalsSum = intervals.filter(v => v > 0).reduce((a, b) => a + b, 0);
        const validIntervalsCount = intervals.filter(v => v > 0).length || 1;

        setOverallStats({
          avgContractions: parseFloat((totalCountsSum / list.length).toFixed(1)),
          avgDuration: Math.round(totalDurationsSum / list.length),
          avgInterval: Math.round(totalIntervalsSum / validIntervalsCount),
        });

      } catch (err) {
        console.error('❌ Error fetching analytics data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={Theme.colors.primary} />
        <Caption style={styles.loadingText}>Compiling analytics trends...</Caption>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Heading style={styles.title}>Maternal Analytics</Heading>
        <BodyText style={styles.subtitle}>
          Pattern summaries mapped across your last 7 monitoring sessions.
        </BodyText>
      </View>

      {countsData.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Caption>Complete monitoring sessions to generate historical charts.</Caption>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll}>
          {/* Key overall averages card */}
          <Card style={styles.summaryCard}>
            <Subheading style={styles.summaryTitle}>7-Session Averages</Subheading>
            <View style={styles.grid}>
              <View style={styles.gridItem}>
                <Caption>Avg Contractions</Caption>
                <Subheading style={styles.summaryVal}>{overallStats.avgContractions}</Subheading>
              </View>
              <View style={styles.gridItem}>
                <Caption>Avg Duration</Caption>
                <Subheading style={styles.summaryVal}>{overallStats.avgDuration}s</Subheading>
              </View>
              <View style={styles.gridItem}>
                <Caption>Avg Interval</Caption>
                <Subheading style={styles.summaryVal}>
                  {overallStats.avgInterval > 0 ? `${overallStats.avgInterval}m` : 'N/A'}
                </Subheading>
              </View>
            </View>
          </Card>

          {/* SVG Trend Graphs */}
          <Card style={styles.chartCard}>
            <CustomLineChart
              data={countsData}
              labels={sessionDates}
              title="Contraction Counts Trend"
              color={Theme.colors.primary}
              unit=" times"
            />
          </Card>

          <Card style={styles.chartCard}>
            <CustomLineChart
              data={durationsData}
              labels={sessionDates}
              title="Average Duration Trend"
              color={Theme.colors.accent}
              unit="s"
            />
          </Card>

          <Card style={styles.chartCard}>
            <CustomLineChart
              data={intervalsData}
              labels={sessionDates}
              title="Average Interval Trend"
              color={Theme.colors.info}
              unit="m"
            />
          </Card>
        </ScrollView>
      )}
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
    paddingBottom: 100,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Theme.spacing.xxl,
  },
  summaryCard: {
    padding: Theme.spacing.lg,
  },
  summaryTitle: {
    color: Theme.colors.text,
    marginBottom: Theme.spacing.md,
  },
  grid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  gridItem: {
    flex: 1,
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: Theme.colors.divider,
  },
  summaryVal: {
    color: Theme.colors.primary,
    marginTop: Theme.spacing.xs,
  },
  chartCard: {
    padding: Theme.spacing.md,
  },
});
export default AnalyticsScreen;
