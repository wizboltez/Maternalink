import React, { useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
} from 'react-native';
import Theme from '../../../core/theme/theme';
import { Heading, Subheading, BodyText, Caption } from '../../../core/components/Typography';
import { Card } from '../../../core/components/Card';
import CustomLineChart from '../../../core/components/CustomLineChart';

interface ContractionEvent {
  time: string;
  duration: string;
  intensity: 'low' | 'medium' | 'high';
  interval: string;
}

const intensityColor = (intensity: 'low' | 'medium' | 'high'): string => {
  switch (intensity) {
    case 'low':
      return Theme.colors.success;
    case 'medium':
      return Theme.colors.warning;
    case 'high':
      return Theme.colors.danger;
  }
};

const intensityPercent = (intensity: 'low' | 'medium' | 'high'): number => {
  switch (intensity) {
    case 'low':
      return 30;
    case 'medium':
      return 60;
    case 'high':
      return 90;
  }
};

// Generate demo flex sensor data
const generateFlexData = (count: number): number[] =>
  Array.from({ length: count }, () => Math.floor(400 + Math.random() * 200));

const ContractionDetailScreen: React.FC<{ navigation: any; route?: any }> = ({ navigation, route }) => {
  const [isActive] = useState(false);
  const [currentDuration] = useState('0:00');
  const [currentIntensity] = useState<'low' | 'medium' | 'high'>('low');
  const [phase] = useState<'latent' | 'active' | 'transition' | 'none'>('none');
  const [frequency] = useState(2); // per hour
  const [avgDuration] = useState('42s');
  const [avgInterval] = useState('28 min');
  const [flexData] = useState<number[]>(generateFlexData(20));

  // Demo contraction history
  const [history] = useState<ContractionEvent[]>([
    { time: '13:45', duration: '38s', intensity: 'low', interval: '32 min' },
    { time: '13:13', duration: '45s', intensity: 'medium', interval: '26 min' },
    { time: '12:47', duration: '40s', intensity: 'low', interval: '30 min' },
    { time: '12:17', duration: '52s', intensity: 'medium', interval: '25 min' },
    { time: '11:52', duration: '35s', intensity: 'low', interval: '28 min' },
    { time: '11:24', duration: '48s', intensity: 'high', interval: '22 min' },
    { time: '11:02', duration: '42s', intensity: 'medium', interval: '30 min' },
    { time: '10:32', duration: '36s', intensity: 'low', interval: '35 min' },
    { time: '09:57', duration: '44s', intensity: 'medium', interval: '27 min' },
    { time: '09:30', duration: '39s', intensity: 'low', interval: '—' },
  ]);

  const phaseLabel = (p: string): string => {
    const labels: Record<string, string> = {
      latent: 'Latent Phase',
      active: 'Active Phase',
      transition: 'Transition Phase',
      none: 'No Active Phase',
    };
    return labels[p] || 'Unknown';
  };

  const phaseColor = (p: string): string => {
    const colors: Record<string, string> = {
      latent: Theme.colors.info,
      active: Theme.colors.warning,
      transition: Theme.colors.danger,
      none: Theme.colors.textMuted,
    };
    return colors[p] || Theme.colors.textMuted;
  };

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

      {/* Hero Status */}
      <View style={styles.heroSection}>
        <View
          style={[
            styles.heroCircle,
            {
              borderColor: isActive
                ? Theme.colors.warning + '50'
                : Theme.colors.success + '30',
            },
          ]}
        >
          <Text style={styles.heroEmoji}>🤰</Text>
          <Text
            style={[
              styles.heroStatus,
              { color: isActive ? Theme.colors.warning : Theme.colors.success },
            ]}
          >
            {isActive ? 'Active' : 'None'}
          </Text>
          {isActive && (
            <Text style={styles.heroDuration}>{currentDuration}</Text>
          )}
        </View>

        {/* Phase Badge */}
        <View style={[styles.phaseBadge, { backgroundColor: phaseColor(phase) + '20' }]}>
          <View style={[styles.phaseDot, { backgroundColor: phaseColor(phase) }]} />
          <BodyText style={[styles.phaseText, { color: phaseColor(phase) }]}>
            {phaseLabel(phase)}
          </BodyText>
        </View>
      </View>

      {/* Active Contraction Details */}
      {isActive && (
        <Card style={styles.activeCard} shadow="medium">
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionEmoji}>⚡</Text>
            <Subheading style={styles.sectionTitle}>Current Contraction</Subheading>
          </View>

          {/* Intensity Bar */}
          <View style={styles.intensitySection}>
            <View style={styles.intensityLabelRow}>
              <Caption style={styles.intensityLabel}>Intensity</Caption>
              <Caption
                style={[styles.intensityValue, { color: intensityColor(currentIntensity) }]}
              >
                {currentIntensity.charAt(0).toUpperCase() + currentIntensity.slice(1)}
              </Caption>
            </View>
            <View style={styles.intensityTrack}>
              <View
                style={[
                  styles.intensityFill,
                  {
                    width: `${intensityPercent(currentIntensity)}%`,
                    backgroundColor: intensityColor(currentIntensity),
                  },
                ]}
              />
            </View>
          </View>

          {/* Duration Display */}
          <View style={styles.durationRow}>
            <BodyText style={styles.durationLabel}>Duration:</BodyText>
            <Text style={styles.durationValue}>{currentDuration}</Text>
          </View>
        </Card>
      )}

      {/* Stats Row */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Caption style={styles.statLabel}>Frequency</Caption>
          <Subheading style={[styles.statValue, { color: Theme.colors.primary }]}>
            {frequency}
          </Subheading>
          <Caption style={styles.statUnit}>per hour</Caption>
        </View>
        <View style={[styles.statItem, styles.statDivider]}>
          <Caption style={styles.statLabel}>Avg Duration</Caption>
          <Subheading style={[styles.statValue, { color: Theme.colors.accent }]}>
            {avgDuration}
          </Subheading>
          <Caption style={styles.statUnit}>seconds</Caption>
        </View>
        <View style={styles.statItem}>
          <Caption style={styles.statLabel}>Avg Interval</Caption>
          <Subheading style={[styles.statValue, { color: Theme.colors.info }]}>
            {avgInterval}
          </Subheading>
          <Caption style={styles.statUnit}>between</Caption>
        </View>
      </View>

      {/* Flex Sensor Chart */}
      <Card style={styles.chartCard} shadow="medium">
        <CustomLineChart
          data={flexData}
          height={200}
          color={Theme.colors.primary}
          title="Flex Sensor Trend"
          unit=""
          minVal={350}
          maxVal={650}
        />
      </Card>

      {/* Contraction History */}
      <Card style={styles.historyCard} shadow="light">
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionEmoji}>📋</Text>
          <Subheading style={styles.sectionTitle}>Contraction History (Last 10)</Subheading>
        </View>

        {/* Header row */}
        <View style={styles.historyHeader}>
          <Caption style={[styles.historyCol, styles.historyColTime]}>Time</Caption>
          <Caption style={[styles.historyCol, styles.historyColDur]}>Duration</Caption>
          <Caption style={[styles.historyCol, styles.historyColInt]}>Intensity</Caption>
          <Caption style={[styles.historyCol, styles.historyColIv]}>Interval</Caption>
        </View>

        {history.map((event, index) => (
          <View
            key={index}
            style={[
              styles.historyRow,
              index % 2 === 0 && styles.historyRowAlt,
            ]}
          >
            <BodyText style={[styles.historyCol, styles.historyColTime]}>
              {event.time}
            </BodyText>
            <BodyText style={[styles.historyCol, styles.historyColDur]}>
              {event.duration}
            </BodyText>
            <View style={[styles.historyCol, styles.historyColInt]}>
              <View
                style={[
                  styles.intensityDot,
                  { backgroundColor: intensityColor(event.intensity) },
                ]}
              />
              <Caption style={{ color: intensityColor(event.intensity) }}>
                {event.intensity.charAt(0).toUpperCase() + event.intensity.slice(1)}
              </Caption>
            </View>
            <BodyText style={[styles.historyCol, styles.historyColIv]}>
              {event.interval}
            </BodyText>
          </View>
        ))}
      </Card>
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
  heroCircle: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: Theme.colors.cardBackground,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    ...Theme.shadows.heavy,
    marginBottom: Theme.spacing.lg,
  },
  heroEmoji: {
    fontSize: 32,
    marginBottom: Theme.spacing.xs,
  },
  heroStatus: {
    fontSize: Theme.typography.sizes.xl,
    fontWeight: Theme.typography.weights.bold,
  },
  heroDuration: {
    fontSize: Theme.typography.sizes.md,
    color: Theme.colors.textSecondary,
    fontWeight: Theme.typography.weights.semibold,
    marginTop: 2,
  },
  phaseBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Theme.spacing.lg,
    paddingVertical: Theme.spacing.sm,
    borderRadius: Theme.borders.radius.round,
    gap: Theme.spacing.sm,
  },
  phaseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  phaseText: {
    fontWeight: Theme.typography.weights.semibold,
    fontSize: Theme.typography.sizes.base,
  },
  activeCard: {
    marginBottom: Theme.spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.sm,
    marginBottom: Theme.spacing.md,
  },
  sectionEmoji: {
    fontSize: 18,
  },
  sectionTitle: {
    fontSize: Theme.typography.sizes.md,
    color: Theme.colors.text,
  },
  intensitySection: {
    marginBottom: Theme.spacing.md,
  },
  intensityLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Theme.spacing.sm,
  },
  intensityLabel: {
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  intensityValue: {
    fontWeight: Theme.typography.weights.semibold,
  },
  intensityTrack: {
    height: 8,
    backgroundColor: Theme.colors.divider,
    borderRadius: Theme.borders.radius.round,
    overflow: 'hidden',
  },
  intensityFill: {
    height: '100%',
    borderRadius: Theme.borders.radius.round,
  },
  durationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.sm,
  },
  durationLabel: {
    color: Theme.colors.textSecondary,
  },
  durationValue: {
    fontSize: Theme.typography.sizes.lg,
    fontWeight: Theme.typography.weights.bold,
    color: Theme.colors.text,
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
    fontSize: Theme.typography.sizes.lg,
    fontWeight: Theme.typography.weights.bold,
  },
  statUnit: {
    fontSize: Theme.typography.sizes.xs,
    color: Theme.colors.textMuted,
    marginTop: 2,
  },
  chartCard: {
    marginBottom: Theme.spacing.lg,
    padding: Theme.spacing.md,
  },
  historyCard: {
    marginBottom: Theme.spacing.lg,
  },
  historyHeader: {
    flexDirection: 'row',
    paddingVertical: Theme.spacing.sm,
    borderBottomWidth: Theme.borders.width.medium,
    borderBottomColor: Theme.colors.divider,
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Theme.spacing.sm,
    borderBottomWidth: Theme.borders.width.thin,
    borderBottomColor: Theme.colors.divider,
  },
  historyRowAlt: {
    backgroundColor: Theme.colors.background,
    borderRadius: Theme.borders.radius.xs,
  },
  historyCol: {
    flex: 1,
    fontSize: Theme.typography.sizes.sm,
  },
  historyColTime: {
    flex: 0.8,
  },
  historyColDur: {
    flex: 0.9,
  },
  historyColInt: {
    flex: 1.1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.xs,
  },
  historyColIv: {
    flex: 1,
  },
  intensityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});

export default ContractionDetailScreen;
