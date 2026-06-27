import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Text,
  Animated,
  TouchableOpacity,
} from 'react-native';
import Theme from '../../../core/theme/theme';
import { Heading, Subheading, BodyText, Caption } from '../../../core/components/Typography';
import { Card } from '../../../core/components/Card';
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

// Generate demo HR data
const generateHRData = (count: number): number[] =>
  Array.from({ length: count }, () => Math.floor(65 + Math.random() * 20));

const HeartRateDetailScreen: React.FC<{ navigation: any; route?: any }> = ({ navigation, route }) => {
  const [currentBPM] = useState(78);
  const [status] = useState<HealthStatus>('normal');
  const [selectedRange, setSelectedRange] = useState<TimeRange>('1h');
  const [hrData] = useState<number[]>(generateHRData(20));
  const [alerts] = useState<{ time: string; message: string; severity: HealthStatus }[]>([]);

  // Pulsing animation
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.12,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ]),
    );
    pulse.start();
    return () => pulse.stop();
  }, [pulseAnim]);

  const min = Math.min(...hrData);
  const max = Math.max(...hrData);
  const avg = Math.round(hrData.reduce((a, b) => a + b, 0) / hrData.length);

  const timeLabels: Record<TimeRange, string[]> = {
    '1h': ['Now', '-30m', '-1h'],
    '6h': ['Now', '-3h', '-6h'],
    '24h': ['Now', '-12h', '-24h'],
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

      {/* Hero Section */}
      <View style={styles.heroSection}>
        <Animated.View style={[styles.heroCircle, { transform: [{ scale: pulseAnim }] }]}>
          <Text style={styles.heroEmoji}>❤️</Text>
          <Text style={[styles.heroValue, { color: statusColor(status) }]}>{currentBPM}</Text>
          <Caption style={styles.heroUnit}>bpm</Caption>
        </Animated.View>

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
          data={hrData}
          labels={timeLabels[selectedRange]}
          height={200}
          color={Theme.colors.danger}
          title="Heart Rate Trend"
          unit=" bpm"
          minVal={55}
          maxVal={95}
        />
      </Card>

      {/* Stats Row */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Caption style={styles.statLabel}>Min</Caption>
          <Subheading style={[styles.statValue, { color: Theme.colors.info }]}>
            {min}
          </Subheading>
          <Caption style={styles.statUnit}>bpm</Caption>
        </View>
        <View style={[styles.statItem, styles.statDivider]}>
          <Caption style={styles.statLabel}>Average</Caption>
          <Subheading style={[styles.statValue, { color: Theme.colors.primary }]}>
            {avg}
          </Subheading>
          <Caption style={styles.statUnit}>bpm</Caption>
        </View>
        <View style={styles.statItem}>
          <Caption style={styles.statLabel}>Max</Caption>
          <Subheading style={[styles.statValue, { color: Theme.colors.warning }]}>
            {max}
          </Subheading>
          <Caption style={styles.statUnit}>bpm</Caption>
        </View>
      </View>

      {/* Recent Alerts */}
      <Card style={styles.alertsCard} shadow="light">
        <Subheading style={styles.sectionTitle}>Recent Alerts</Subheading>
        {alerts.length === 0 ? (
          <View style={styles.emptyAlerts}>
            <Text style={styles.emptyEmoji}>✅</Text>
            <BodyText style={styles.emptyText}>No alerts — heart rate is stable</BodyText>
          </View>
        ) : (
          alerts.map((alert, index) => (
            <View key={index} style={styles.alertItem}>
              <View style={[styles.alertDot, { backgroundColor: statusColor(alert.severity) }]} />
              <View style={styles.alertContent}>
                <BodyText>{alert.message}</BodyText>
                <Caption>{alert.time}</Caption>
              </View>
            </View>
          ))
        )}
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
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: Theme.colors.cardBackground,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: Theme.colors.danger + '30',
    ...Theme.shadows.heavy,
    marginBottom: Theme.spacing.lg,
  },
  heroEmoji: {
    fontSize: 28,
    marginBottom: Theme.spacing.xs,
  },
  heroValue: {
    fontSize: Theme.typography.sizes.jumbo,
    fontWeight: Theme.typography.weights.bold,
  },
  heroUnit: {
    fontSize: Theme.typography.sizes.sm,
    color: Theme.colors.textMuted,
    marginTop: -2,
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
  alertsCard: {
    marginBottom: Theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: Theme.typography.sizes.md,
    color: Theme.colors.text,
    marginBottom: Theme.spacing.md,
  },
  emptyAlerts: {
    alignItems: 'center',
    paddingVertical: Theme.spacing.xl,
    gap: Theme.spacing.sm,
  },
  emptyEmoji: {
    fontSize: 28,
  },
  emptyText: {
    color: Theme.colors.textMuted,
    textAlign: 'center',
  },
  alertItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: Theme.spacing.sm,
    borderBottomWidth: Theme.borders.width.thin,
    borderBottomColor: Theme.colors.divider,
    gap: Theme.spacing.md,
  },
  alertDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 5,
  },
  alertContent: {
    flex: 1,
    gap: 2,
  },
});

export default HeartRateDetailScreen;
