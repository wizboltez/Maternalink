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

// Generate demo temperature data
const generateTempData = (count: number): number[] =>
  Array.from({ length: count }, () =>
    parseFloat((36.4 + Math.random() * 0.6).toFixed(1)),
  );

const TemperatureDetailScreen: React.FC<{ navigation: any; route?: any }> = ({ navigation, route }) => {
  const [currentTemp] = useState(36.8);
  const [status] = useState<HealthStatus>('normal');
  const [selectedRange, setSelectedRange] = useState<TimeRange>('1h');
  const [tempData] = useState<number[]>(generateTempData(20));

  const min = Math.min(...tempData);
  const max = Math.max(...tempData);
  const avg = parseFloat((tempData.reduce((a, b) => a + b, 0) / tempData.length).toFixed(1));

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
        <View style={styles.heroCircle}>
          <Text style={styles.heroEmoji}>🌡️</Text>
          <Text style={[styles.heroValue, { color: statusColor(status) }]}>
            {currentTemp.toFixed(1)}
          </Text>
          <Caption style={styles.heroUnit}>°C</Caption>
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
          data={tempData}
          labels={timeLabels[selectedRange]}
          height={200}
          color={Theme.colors.warning}
          title="Temperature Trend"
          unit="°C"
          minVal={35.5}
          maxVal={38.5}
        />
      </Card>

      {/* Stats Row */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Caption style={styles.statLabel}>Min</Caption>
          <Subheading style={[styles.statValue, { color: Theme.colors.info }]}>
            {min.toFixed(1)}
          </Subheading>
          <Caption style={styles.statUnit}>°C</Caption>
        </View>
        <View style={[styles.statItem, styles.statDivider]}>
          <Caption style={styles.statLabel}>Average</Caption>
          <Subheading style={[styles.statValue, { color: Theme.colors.primary }]}>
            {avg.toFixed(1)}
          </Subheading>
          <Caption style={styles.statUnit}>°C</Caption>
        </View>
        <View style={styles.statItem}>
          <Caption style={styles.statLabel}>Max</Caption>
          <Subheading style={[styles.statValue, { color: Theme.colors.warning }]}>
            {max.toFixed(1)}
          </Subheading>
          <Caption style={styles.statUnit}>°C</Caption>
        </View>
      </View>

      {/* Normal Range Indicator */}
      <Card style={styles.rangeCard} shadow="light">
        <View style={styles.rangeHeader}>
          <Text style={styles.rangeEmoji}>📊</Text>
          <Subheading style={styles.sectionTitle}>Normal Range</Subheading>
        </View>
        <View style={styles.rangeVisual}>
          <View style={styles.rangeBar}>
            <View style={styles.rangeBarNormal} />
            {/* Marker for current temp */}
            <View
              style={[
                styles.rangeMarker,
                {
                  left: `${Math.min(100, Math.max(0, ((currentTemp - 35.0) / (39.0 - 35.0)) * 100))}%`,
                },
              ]}
            />
          </View>
          <View style={styles.rangeLabels}>
            <Caption>35.0°C</Caption>
            <View style={styles.normalRangeLabel}>
              <Caption style={{ color: Theme.colors.success, fontWeight: Theme.typography.weights.semibold }}>
                36.1°C — 37.5°C
              </Caption>
            </View>
            <Caption>39.0°C</Caption>
          </View>
        </View>
        <BodyText style={styles.rangeNote}>
          Normal body temperature range: 36.1°C - 37.5°C
        </BodyText>
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
    borderColor: Theme.colors.warning + '30',
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
    fontSize: Theme.typography.sizes.md,
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
  rangeCard: {
    marginBottom: Theme.spacing.lg,
  },
  rangeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.sm,
    marginBottom: Theme.spacing.md,
  },
  rangeEmoji: {
    fontSize: 18,
  },
  sectionTitle: {
    fontSize: Theme.typography.sizes.md,
    color: Theme.colors.text,
  },
  rangeVisual: {
    marginBottom: Theme.spacing.md,
  },
  rangeBar: {
    height: 12,
    backgroundColor: Theme.colors.divider,
    borderRadius: Theme.borders.radius.round,
    overflow: 'visible',
    position: 'relative',
    marginBottom: Theme.spacing.sm,
  },
  rangeBarNormal: {
    position: 'absolute',
    left: '27.5%',
    right: '37.5%',
    height: '100%',
    backgroundColor: Theme.colors.success + '40',
    borderRadius: Theme.borders.radius.round,
  },
  rangeMarker: {
    position: 'absolute',
    top: -4,
    width: 16,
    height: 20,
    borderRadius: 8,
    backgroundColor: Theme.colors.primary,
    marginLeft: -8,
    borderWidth: 2,
    borderColor: Theme.colors.cardBackground,
  },
  rangeLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  normalRangeLabel: {
    alignItems: 'center',
  },
  rangeNote: {
    color: Theme.colors.textSecondary,
    fontSize: Theme.typography.sizes.sm,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default TemperatureDetailScreen;
