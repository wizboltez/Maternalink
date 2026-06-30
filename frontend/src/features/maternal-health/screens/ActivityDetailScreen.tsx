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

interface ActivityEvent {
  type: 'sitting' | 'walking' | 'lying' | 'standing' | 'unknown';
  startTime: string;
  duration: string;
}

interface FallEvent {
  time: string;
  severity: 'minor' | 'major';
  confirmed: boolean;
}

const activityColors: Record<string, string> = {
  sitting: Theme.colors.info,
  walking: Theme.colors.success,
  lying: Theme.colors.primary,
  standing: Theme.colors.accent,
  unknown: Theme.colors.textMuted,
};

const activityEmojis: Record<string, string> = {
  sitting: '🪑',
  walking: '🚶',
  lying: '🛏️',
  standing: '🧍',
  unknown: '❓',
};

const activityLabels: Record<string, string> = {
  sitting: 'Sitting',
  walking: 'Walking',
  lying: 'Lying Down',
  standing: 'Standing',
  unknown: 'Unknown',
};

const ActivityDetailScreen: React.FC<{ navigation: any; route?: any }> = ({ navigation, route }) => {
  const [currentActivity] = useState('sitting');
  const [fallDetected] = useState(false);
  const [estimatedSleep] = useState(0); // minutes
  const [stepCount] = useState(1247);
  const [movementMinutes] = useState(34);

  // Demo activity timeline
  const [timeline] = useState<ActivityEvent[]>([
    { type: 'walking', startTime: '14:20', duration: '12 min' },
    { type: 'sitting', startTime: '14:08', duration: '12 min' },
    { type: 'standing', startTime: '13:55', duration: '13 min' },
    { type: 'walking', startTime: '13:40', duration: '15 min' },
    { type: 'sitting', startTime: '13:10', duration: '30 min' },
    { type: 'lying', startTime: '12:30', duration: '40 min' },
    { type: 'sitting', startTime: '12:00', duration: '30 min' },
  ]);

  // Demo fall events
  const [fallEvents] = useState<FallEvent[]>([]);

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

      {/* Current Activity Hero */}
      <View style={styles.heroSection}>
        <View style={styles.heroCircle}>
          <Text style={styles.heroEmoji}>{activityEmojis[currentActivity] || '❓'}</Text>
          <Subheading style={styles.heroLabel}>
            {activityLabels[currentActivity] || 'Unknown'}
          </Subheading>
        </View>
        <View
          style={[
            styles.statusBadge,
            {
              backgroundColor: fallDetected
                ? Theme.colors.danger + '20'
                : Theme.colors.success + '20',
            },
          ]}
        >
          <View
            style={[
              styles.statusDot,
              {
                backgroundColor: fallDetected
                  ? Theme.colors.danger
                  : Theme.colors.success,
              },
            ]}
          />
          <BodyText
            style={[
              styles.statusText,
              {
                color: fallDetected
                  ? Theme.colors.danger
                  : Theme.colors.success,
              },
            ]}
          >
            {fallDetected ? 'Fall Detected!' : 'Normal Activity'}
          </BodyText>
        </View>
      </View>

      {/* Movement Summary */}
      <View style={styles.summaryRow}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryEmoji}>👣</Text>
          <Subheading style={styles.summaryValue}>{stepCount.toLocaleString()}</Subheading>
          <Caption style={styles.summaryLabel}>Steps</Caption>
        </View>
        <View style={[styles.summaryItem, styles.summaryDivider]}>
          <Text style={styles.summaryEmoji}>⏱️</Text>
          <Subheading style={styles.summaryValue}>{movementMinutes}</Subheading>
          <Caption style={styles.summaryLabel}>Active Min</Caption>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryEmoji}>😴</Text>
          <Subheading style={styles.summaryValue}>
            {estimatedSleep > 0 ? `${estimatedSleep}` : '0'}
          </Subheading>
          <Caption style={styles.summaryLabel}>Sleep Min</Caption>
        </View>
      </View>

      {/* Activity Timeline */}
      <Card style={styles.timelineCard} shadow="medium">
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionEmoji}>📊</Text>
          <Subheading style={styles.sectionTitle}>Activity Timeline (Last 1h)</Subheading>
        </View>

        {/* Timeline visual bar */}
        <View style={styles.timelineBar}>
          {timeline.map((event, index) => (
            <View
              key={index}
              style={[
                styles.timelineBlock,
                {
                  backgroundColor: activityColors[event.type] || Theme.colors.textMuted,
                  flex: 1,
                },
              ]}
            />
          ))}
        </View>

        {/* Legend */}
        <View style={styles.legendRow}>
          {Object.entries(activityLabels).filter(([key]) => key !== 'unknown').map(([key, label]) => (
            <View key={key} style={styles.legendItem}>
              <View
                style={[
                  styles.legendDot,
                  { backgroundColor: activityColors[key] },
                ]}
              />
              <Caption style={styles.legendText}>{label}</Caption>
            </View>
          ))}
        </View>

        {/* Timeline list */}
        <View style={styles.timelineList}>
          {timeline.map((event, index) => (
            <View key={index} style={styles.timelineEntry}>
              <View
                style={[
                  styles.timelineDot,
                  { backgroundColor: activityColors[event.type] },
                ]}
              />
              {index < timeline.length - 1 && <View style={styles.timelineConnector} />}
              <View style={styles.timelineContent}>
                <View style={styles.timelineTop}>
                  <Text style={styles.timelineIcon}>
                    {activityEmojis[event.type]}
                  </Text>
                  <BodyText style={styles.timelineActivity}>
                    {activityLabels[event.type]}
                  </BodyText>
                </View>
                <View style={styles.timelineMeta}>
                  <Caption>{event.startTime}</Caption>
                  <Caption style={styles.timelineDuration}>• {event.duration}</Caption>
                </View>
              </View>
            </View>
          ))}
        </View>
      </Card>

      {/* Sleep Tracker */}
      <Card style={styles.sleepCard} shadow="light">
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionEmoji}>🌙</Text>
          <Subheading style={styles.sectionTitle}>Sleep Tracker</Subheading>
        </View>
        {estimatedSleep > 0 ? (
          <View style={styles.sleepInfo}>
            <BodyText>Estimated sleep: {estimatedSleep} minutes</BodyText>
            <Caption style={styles.sleepNote}>Based on accelerometer inactivity patterns</Caption>
          </View>
        ) : (
          <View style={styles.sleepEmpty}>
            <Text style={styles.sleepEmoji}>🌤️</Text>
            <BodyText style={styles.sleepEmptyText}>No sleep detected today</BodyText>
            <Caption style={styles.sleepNote}>
              Sleep is detected when prolonged lying inactivity is observed
            </Caption>
          </View>
        )}
      </Card>

      {/* Fall Detection Log */}
      <Card style={styles.fallCard} shadow="light">
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionEmoji}>🛡️</Text>
          <Subheading style={styles.sectionTitle}>Fall Detection Log</Subheading>
        </View>
        {fallEvents.length === 0 ? (
          <View style={styles.fallEmpty}>
            <Text style={styles.fallEmoji}>✅</Text>
            <BodyText style={styles.fallEmptyText}>No falls detected</BodyText>
            <Caption style={styles.sleepNote}>
              The accelerometer continuously monitors for sudden impact events
            </Caption>
          </View>
        ) : (
          fallEvents.map((event, index) => (
            <View key={index} style={styles.fallItem}>
              <View
                style={[
                  styles.fallSeverity,
                  {
                    backgroundColor:
                      event.severity === 'major'
                        ? Theme.colors.danger + '20'
                        : Theme.colors.warning + '20',
                  },
                ]}
              >
                <BodyText
                  style={{
                    color:
                      event.severity === 'major'
                        ? Theme.colors.danger
                        : Theme.colors.warning,
                    fontWeight: Theme.typography.weights.semibold,
                    fontSize: Theme.typography.sizes.sm,
                  }}
                >
                  {event.severity === 'major' ? 'MAJOR' : 'MINOR'}
                </BodyText>
              </View>
              <View style={styles.fallContent}>
                <BodyText>Fall detected at {event.time}</BodyText>
                <Caption>
                  {event.confirmed ? 'Confirmed' : 'Unconfirmed'}
                </Caption>
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
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: Theme.colors.cardBackground,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: Theme.colors.accent + '30',
    ...Theme.shadows.heavy,
    marginBottom: Theme.spacing.lg,
  },
  heroEmoji: {
    fontSize: 40,
    marginBottom: Theme.spacing.xs,
  },
  heroLabel: {
    fontSize: Theme.typography.sizes.base,
    color: Theme.colors.text,
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
  summaryRow: {
    flexDirection: 'row',
    backgroundColor: Theme.colors.cardBackground,
    borderRadius: Theme.borders.radius.lg,
    padding: Theme.spacing.lg,
    marginBottom: Theme.spacing.lg,
    borderWidth: Theme.borders.width.thin,
    borderColor: Theme.colors.divider,
    ...Theme.shadows.light,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
    gap: Theme.spacing.xs,
  },
  summaryDivider: {
    borderLeftWidth: Theme.borders.width.thin,
    borderRightWidth: Theme.borders.width.thin,
    borderColor: Theme.colors.divider,
  },
  summaryEmoji: {
    fontSize: 22,
  },
  summaryValue: {
    fontSize: Theme.typography.sizes.xl,
    fontWeight: Theme.typography.weights.bold,
    color: Theme.colors.text,
  },
  summaryLabel: {
    fontSize: Theme.typography.sizes.xs,
    color: Theme.colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  timelineCard: {
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
  timelineBar: {
    flexDirection: 'row',
    height: 16,
    borderRadius: Theme.borders.radius.round,
    overflow: 'hidden',
    marginBottom: Theme.spacing.md,
    gap: 2,
  },
  timelineBlock: {
    borderRadius: 2,
  },
  legendRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Theme.spacing.md,
    marginBottom: Theme.spacing.lg,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.xs,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: Theme.typography.sizes.xs,
    color: Theme.colors.textSecondary,
  },
  timelineList: {
    gap: 0,
  },
  timelineEntry: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingLeft: Theme.spacing.xs,
    minHeight: 48,
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginTop: 4,
    zIndex: 1,
  },
  timelineConnector: {
    position: 'absolute',
    left: Theme.spacing.xs + 5,
    top: 16,
    bottom: 0,
    width: 2,
    backgroundColor: Theme.colors.divider,
  },
  timelineContent: {
    flex: 1,
    marginLeft: Theme.spacing.md,
    paddingBottom: Theme.spacing.md,
  },
  timelineTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.sm,
  },
  timelineIcon: {
    fontSize: 16,
  },
  timelineActivity: {
    fontWeight: Theme.typography.weights.medium,
    color: Theme.colors.text,
  },
  timelineMeta: {
    flexDirection: 'row',
    gap: Theme.spacing.sm,
    marginTop: 2,
  },
  timelineDuration: {
    color: Theme.colors.textMuted,
  },
  sleepCard: {
    marginBottom: Theme.spacing.lg,
  },
  sleepInfo: {
    gap: Theme.spacing.sm,
  },
  sleepEmpty: {
    alignItems: 'center',
    paddingVertical: Theme.spacing.lg,
    gap: Theme.spacing.sm,
  },
  sleepEmoji: {
    fontSize: 28,
  },
  sleepEmptyText: {
    color: Theme.colors.textSecondary,
  },
  sleepNote: {
    color: Theme.colors.textMuted,
    fontSize: Theme.typography.sizes.xs,
    textAlign: 'center',
    lineHeight: 16,
  },
  fallCard: {
    marginBottom: Theme.spacing.lg,
  },
  fallEmpty: {
    alignItems: 'center',
    paddingVertical: Theme.spacing.lg,
    gap: Theme.spacing.sm,
  },
  fallEmoji: {
    fontSize: 28,
  },
  fallEmptyText: {
    color: Theme.colors.textSecondary,
  },
  fallItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Theme.spacing.sm,
    borderBottomWidth: Theme.borders.width.thin,
    borderBottomColor: Theme.colors.divider,
    gap: Theme.spacing.md,
  },
  fallSeverity: {
    paddingHorizontal: Theme.spacing.sm,
    paddingVertical: Theme.spacing.xs,
    borderRadius: Theme.borders.radius.sm,
  },
  fallContent: {
    flex: 1,
    gap: 2,
  },
});

export default ActivityDetailScreen;
