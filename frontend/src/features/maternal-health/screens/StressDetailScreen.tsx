import React, { useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
} from 'react-native';
import Svg, { Circle as SvgCircle, Text as SvgText } from 'react-native-svg';
import Theme from '../../../core/theme/theme';
import { Heading, Subheading, BodyText, Caption } from '../../../core/components/Typography';
import { Card } from '../../../core/components/Card';
import { Button } from '../../../core/components/Button';
import CustomLineChart from '../../../core/components/CustomLineChart';

type HealthStatus = 'normal' | 'attention' | 'urgent';
type TimeRange = '1h' | '6h' | '24h';

const statusColor = (status: HealthStatus): string => {
  switch (status) {
    case 'normal':
      return Theme.colors.success;
    case 'attention':
      return Theme.colors.warning;
    case 'urgent':
      return Theme.colors.danger;
  }
};

const statusLabel = (status: HealthStatus): string => {
  switch (status) {
    case 'normal':
      return 'Normal';
    case 'attention':
      return 'Attention';
    case 'urgent':
      return 'Urgent';
  }
};

const stressLevelText = (score: number): string => {
  if (score < 25) return 'Low';
  if (score < 50) return 'Moderate';
  if (score < 75) return 'High';
  return 'Very High';
};

// Generate demo stress data
const generateStressData = (count: number): number[] =>
  Array.from({ length: count }, () => Math.floor(15 + Math.random() * 30));

const StressDetailScreen: React.FC<{ navigation: any; route?: any }> = ({ navigation, route }) => {
  const [stressScore] = useState(32);
  const [status] = useState<HealthStatus>('normal');
  const [selectedRange, setSelectedRange] = useState<TimeRange>('1h');
  const [stressData] = useState<number[]>(generateStressData(20));

  const min = Math.min(...stressData);
  const max = Math.max(...stressData);
  const avg = Math.round(stressData.reduce((a, b) => a + b, 0) / stressData.length);

  const timeLabels: Record<TimeRange, string[]> = {
    '1h': ['Now', '-30m', '-1h'],
    '6h': ['Now', '-3h', '-6h'],
    '24h': ['Now', '-12h', '-24h'],
  };

  // Circular gauge params
  const gaugeSize = 160;
  const strokeWidth = 12;
  const radius = (gaugeSize - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(stressScore / 100, 1);
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Back button */}
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
        <Text style={styles.backArrow}>‹</Text>
        <BodyText style={styles.backText}>Dashboard</BodyText>
      </TouchableOpacity>

      {/* Hero Section - Circular Gauge */}
      <View style={styles.heroSection}>
        <View style={styles.gaugeWrapper}>
          <Svg width={gaugeSize} height={gaugeSize}>
            {/* Background circle */}
            <SvgCircle
              cx={gaugeSize / 2}
              cy={gaugeSize / 2}
              r={radius}
              stroke={Theme.colors.divider}
              strokeWidth={strokeWidth}
              fill="none"
            />
            {/* Progress circle */}
            <SvgCircle
              cx={gaugeSize / 2}
              cy={gaugeSize / 2}
              r={radius}
              stroke={statusColor(status)}
              strokeWidth={strokeWidth}
              fill="none"
              strokeDasharray={`${circumference}`}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              rotation="-90"
              origin={`${gaugeSize / 2}, ${gaugeSize / 2}`}
            />
          </Svg>
          {/* Center content */}
          <View style={styles.gaugeCenter}>
            <Text style={styles.gaugeEmoji}>🧠</Text>
            <Text style={[styles.gaugeValue, { color: statusColor(status) }]}>
              {stressScore}
            </Text>
            <Caption style={styles.gaugeLabel}>{stressLevelText(stressScore)}</Caption>
          </View>
        </View>

        {/* Status Badge */}
        <View style={[styles.statusBadge, { backgroundColor: statusColor(status) + '20' }]}>
          <View style={[styles.statusDot, { backgroundColor: statusColor(status) }]} />
          <BodyText style={[styles.statusText, { color: statusColor(status) }]}>
            {statusLabel(status)}
          </BodyText>
        </View>
      </View>

      {/* Time Range Toggle */}
      <View style={styles.rangeToggle}>
        {(['1h', '6h', '24h'] as TimeRange[]).map((range) => (
          <TouchableOpacity
            key={range}
            onPress={() => setSelectedRange(range)}
            style={[
              styles.rangeButton,
              selectedRange === range && styles.rangeButtonActive,
            ]}
          >
            <BodyText
              style={[
                styles.rangeButtonText,
                selectedRange === range && styles.rangeButtonTextActive,
              ]}
            >
              {range}
            </BodyText>
          </TouchableOpacity>
        ))}
      </View>

      {/* Chart */}
      <Card style={styles.chartCard} shadow="medium">
        <CustomLineChart
          data={stressData}
          labels={timeLabels[selectedRange]}
          height={200}
          color={Theme.colors.accent}
          title="Stress Trend"
          unit=""
          minVal={0}
          maxVal={100}
        />
      </Card>

      {/* Stats Row */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Caption style={styles.statLabel}>Min</Caption>
          <Subheading style={[styles.statValue, { color: Theme.colors.success }]}>
            {min}
          </Subheading>
          <Caption style={styles.statUnit}>/ 100</Caption>
        </View>
        <View style={[styles.statItem, styles.statDivider]}>
          <Caption style={styles.statLabel}>Average</Caption>
          <Subheading style={[styles.statValue, { color: Theme.colors.primary }]}>
            {avg}
          </Subheading>
          <Caption style={styles.statUnit}>/ 100</Caption>
        </View>
        <View style={styles.statItem}>
          <Caption style={styles.statLabel}>Max</Caption>
          <Subheading style={[styles.statValue, { color: Theme.colors.warning }]}>
            {max}
          </Subheading>
          <Caption style={styles.statUnit}>/ 100</Caption>
        </View>
      </View>

      {/* Breathing Exercise Suggestion */}
      {stressScore > 40 && (
        <Card style={styles.breathingCard} shadow="light">
          <View style={styles.breathingHeader}>
            <Text style={styles.breathingEmoji}>🌬️</Text>
            <Subheading style={styles.sectionTitle}>Breathing Exercise</Subheading>
          </View>
          <BodyText style={styles.breathingText}>
            Your stress level is elevated. Try a calming breathing exercise to help reduce
            tension and promote relaxation.
          </BodyText>
          <View style={styles.breathingSteps}>
            <View style={styles.breathingStep}>
              <View style={[styles.stepCircle, { backgroundColor: Theme.colors.accent + '20' }]}>
                <BodyText style={{ color: Theme.colors.accent, fontWeight: Theme.typography.weights.bold }}>1</BodyText>
              </View>
              <Caption>Breathe in for 4 seconds</Caption>
            </View>
            <View style={styles.breathingStep}>
              <View style={[styles.stepCircle, { backgroundColor: Theme.colors.primary + '20' }]}>
                <BodyText style={{ color: Theme.colors.primary, fontWeight: Theme.typography.weights.bold }}>2</BodyText>
              </View>
              <Caption>Hold for 7 seconds</Caption>
            </View>
            <View style={styles.breathingStep}>
              <View style={[styles.stepCircle, { backgroundColor: Theme.colors.info + '20' }]}>
                <BodyText style={{ color: Theme.colors.info, fontWeight: Theme.typography.weights.bold }}>3</BodyText>
              </View>
              <Caption>Exhale for 8 seconds</Caption>
            </View>
          </View>
          <Caption style={styles.breathingNote}>
            Repeat 4 times for best results
          </Caption>
        </Card>
      )}

      {/* Info note when stress is low */}
      {stressScore <= 40 && (
        <Card style={styles.infoCard} shadow="light">
          <View style={styles.infoRow}>
            <Text style={styles.infoEmoji}>😌</Text>
            <View style={styles.infoContent}>
              <Subheading style={styles.sectionTitle}>Looking Good!</Subheading>
              <BodyText style={styles.infoText}>
                Your stress levels are within a healthy range. Keep up the good work with
                rest and relaxation.
              </BodyText>
            </View>
          </View>
        </Card>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  scrollContent: {
    paddingHorizontal: Theme.spacing.xl,
    paddingTop: Theme.spacing.xl,
    paddingBottom: Theme.spacing.xxxl,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Theme.spacing.lg,
    gap: Theme.spacing.xs,
  },
  backArrow: {
    fontSize: 28,
    color: Theme.colors.primary,
    fontWeight: Theme.typography.weights.bold,
    marginTop: -2,
  },
  backText: {
    color: Theme.colors.primary,
    fontWeight: Theme.typography.weights.semibold,
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: Theme.spacing.xl,
  },
  gaugeWrapper: {
    width: 160,
    height: 160,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Theme.spacing.lg,
  },
  gaugeCenter: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gaugeEmoji: {
    fontSize: 22,
    marginBottom: 2,
  },
  gaugeValue: {
    fontSize: Theme.typography.sizes.xxl,
    fontWeight: Theme.typography.weights.bold,
  },
  gaugeLabel: {
    fontSize: Theme.typography.sizes.xs,
    color: Theme.colors.textMuted,
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Theme.spacing.lg,
    paddingVertical: Theme.spacing.sm,
    borderRadius: Theme.borders.radius.round,
    gap: Theme.spacing.sm,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontWeight: Theme.typography.weights.semibold,
    fontSize: Theme.typography.sizes.base,
  },
  rangeToggle: {
    flexDirection: 'row',
    backgroundColor: Theme.colors.cardBackground,
    borderRadius: Theme.borders.radius.md,
    padding: Theme.spacing.xs,
    marginBottom: Theme.spacing.lg,
    borderWidth: Theme.borders.width.thin,
    borderColor: Theme.colors.divider,
  },
  rangeButton: {
    flex: 1,
    paddingVertical: Theme.spacing.sm,
    alignItems: 'center',
    borderRadius: Theme.borders.radius.sm,
  },
  rangeButtonActive: {
    backgroundColor: Theme.colors.primary,
  },
  rangeButtonText: {
    fontSize: Theme.typography.sizes.sm,
    color: Theme.colors.textSecondary,
    fontWeight: Theme.typography.weights.medium,
  },
  rangeButtonTextActive: {
    color: Theme.colors.textOnPrimary,
    fontWeight: Theme.typography.weights.bold,
  },
  chartCard: {
    marginBottom: Theme.spacing.lg,
    padding: Theme.spacing.md,
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: Theme.colors.cardBackground,
    borderRadius: Theme.borders.radius.lg,
    padding: Theme.spacing.lg,
    marginBottom: Theme.spacing.lg,
    borderWidth: Theme.borders.width.thin,
    borderColor: Theme.colors.divider,
    ...Theme.shadows.light,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    borderLeftWidth: Theme.borders.width.thin,
    borderRightWidth: Theme.borders.width.thin,
    borderColor: Theme.colors.divider,
  },
  statLabel: {
    fontSize: Theme.typography.sizes.xs,
    color: Theme.colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: Theme.spacing.xs,
  },
  statValue: {
    fontSize: Theme.typography.sizes.xl,
    fontWeight: Theme.typography.weights.bold,
  },
  statUnit: {
    fontSize: Theme.typography.sizes.xs,
    color: Theme.colors.textMuted,
    marginTop: 2,
  },
  breathingCard: {
    marginBottom: Theme.spacing.lg,
  },
  breathingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.sm,
    marginBottom: Theme.spacing.md,
  },
  breathingEmoji: {
    fontSize: 22,
  },
  sectionTitle: {
    fontSize: Theme.typography.sizes.md,
    color: Theme.colors.text,
  },
  breathingText: {
    color: Theme.colors.textSecondary,
    fontSize: Theme.typography.sizes.sm,
    marginBottom: Theme.spacing.lg,
    lineHeight: 20,
  },
  breathingSteps: {
    gap: Theme.spacing.md,
    marginBottom: Theme.spacing.md,
  },
  breathingStep: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.md,
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  breathingNote: {
    textAlign: 'center',
    color: Theme.colors.textMuted,
    fontStyle: 'italic',
  },
  infoCard: {
    marginBottom: Theme.spacing.lg,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Theme.spacing.md,
  },
  infoEmoji: {
    fontSize: 28,
    marginTop: 2,
  },
  infoContent: {
    flex: 1,
    gap: Theme.spacing.sm,
  },
  infoText: {
    color: Theme.colors.textSecondary,
    fontSize: Theme.typography.sizes.sm,
    lineHeight: 20,
  },
});

export default StressDetailScreen;
