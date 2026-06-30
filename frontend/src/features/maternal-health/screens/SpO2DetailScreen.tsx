import React, { useState } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import Theme from '../../../core/theme/theme';
import { Heading, Subheading, BodyText, Caption } from '../../../core/components/Typography';
import { Card } from '../../../core/components/Card';
import { Button } from '../../../core/components/Button';
import CustomLineChart from '../../../core/components/CustomLineChart';

const SpO2DetailScreen: React.FC<{ navigation: any; route?: any }> = ({ navigation, route }) => {
  // Demo state values
  const [currentSpO2] = useState(97);
  const [status] = useState<'normal' | 'attention' | 'urgent'>('normal');
  const [timeRange, setTimeRange] = useState<'1h' | '6h' | '24h'>('1h');

  // Generate demo data
  const chartData = Array.from({ length: 20 }, () => Math.floor(Math.random() * (100 - 92 + 1)) + 92);
  const chartLabels = ['1h ago', '45m ago', '30m ago', '15m ago', 'Now'];

  const statusColor = {
    normal: Theme.colors.success,
    attention: Theme.colors.warning,
    urgent: Theme.colors.danger,
  }[status];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* Top Current Value */}
      <View style={styles.header}>
        <Text style={styles.emoji}>🫁</Text>
        <Heading style={[styles.mainValue, { color: statusColor }]}>{currentSpO2}%</Heading>
        <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
          <Caption style={styles.statusText}>{status.toUpperCase()}</Caption>
        </View>
      </View>

      {/* Time Range Selector */}
      <View style={styles.timeToggle}>
        {(['1h', '6h', '24h'] as const).map(range => (
          <Button
            key={range}
            title={range.toUpperCase()}
            variant={timeRange === range ? 'primary' : 'outline'}
            size="small"
            onPress={() => setTimeRange(range)}
            style={styles.timeButton}
          />
        ))}
      </View>

      {/* Chart */}
      <Card style={styles.chartCard}>
        <CustomLineChart
          data={chartData}
          labels={chartLabels}
          height={200}
          color={Theme.colors.info}
          minVal={90}
          maxVal={100}
          title="Blood Oxygen Trend"
          unit="%"
        />
      </Card>

      {/* Stats Row */}
      <View style={styles.statsRow}>
        <Card style={styles.statCard}>
          <Caption style={styles.statLabel}>Min</Caption>
          <Subheading>94%</Subheading>
        </Card>
        <Card style={styles.statCard}>
          <Caption style={styles.statLabel}>Max</Caption>
          <Subheading>99%</Subheading>
        </Card>
        <Card style={styles.statCard}>
          <Caption style={styles.statLabel}>Avg</Caption>
          <Subheading>97%</Subheading>
        </Card>
      </View>

      {/* Normal Range Info */}
      <Card style={styles.infoCard}>
        <Subheading style={styles.infoTitle}>About SpO₂</Subheading>
        <BodyText style={styles.infoText}>
          Blood oxygen level (SpO₂) indicates the percentage of oxygen in your blood. Normal readings are typically 95% to 100%.
        </BodyText>
      </Card>
    </ScrollView>
  );
};

// React Native 'Text' was omitted in imports, fixing that below
import { Text } from 'react-native';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  scrollContent: {
    padding: Theme.spacing.xl,
  },
  header: {
    alignItems: 'center',
    marginBottom: Theme.spacing.xl,
  },
  emoji: {
    fontSize: 48,
    marginBottom: Theme.spacing.sm,
  },
  mainValue: {
    fontSize: 56,
    fontWeight: Theme.typography.weights.bold as any,
    marginBottom: Theme.spacing.sm,
  },
  statusBadge: {
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.xs,
    borderRadius: Theme.borders.radius.round,
  },
  statusText: {
    color: '#FFFFFF',
    fontWeight: Theme.typography.weights.bold as any,
  },
  timeToggle: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Theme.spacing.sm,
    marginBottom: Theme.spacing.xl,
  },
  timeButton: {
    minWidth: 70,
  },
  chartCard: {
    marginBottom: Theme.spacing.xl,
    padding: 0,
    overflow: 'hidden',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Theme.spacing.xl,
    gap: Theme.spacing.md,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    padding: Theme.spacing.md,
  },
  statLabel: {
    color: Theme.colors.textMuted,
    marginBottom: Theme.spacing.xs,
  },
  infoCard: {
    backgroundColor: Theme.colors.cardBackground,
    borderLeftWidth: 4,
    borderLeftColor: Theme.colors.info,
  },
  infoTitle: {
    marginBottom: Theme.spacing.sm,
  },
  infoText: {
    color: Theme.colors.textSecondary,
    lineHeight: 20,
  },
});

export default SpO2DetailScreen;
