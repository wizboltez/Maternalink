import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Text,
  Animated,
  TouchableOpacity,
  useWindowDimensions,
} from 'react-native';
import Theme from '../../../core/theme/theme';
import { Heading, Subheading, BodyText, Caption } from '../../../core/components/Typography';
import { Card } from '../../../core/components/Card';
import { Button } from '../../../core/components/Button';

type HealthStatus = 'normal' | 'attention' | 'urgent';

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


const HealthDashboardScreen: React.FC<{ navigation: any; route?: any }> = ({ navigation, route }) => {
  const { width } = useWindowDimensions();
  const isTablet = width > 768;
  const cardWidth = isTablet ? 300 : (width - Theme.spacing.xl * 2 - Theme.spacing.md) / 2;

  // Demo state values
  const [heartRate] = useState(78);
  const [hrStatus] = useState<HealthStatus>('normal');
  const [spO2] = useState(97);
  const [spO2Status] = useState<HealthStatus>('normal');
  const [temperature] = useState(36.8);
  const [tempStatus] = useState<HealthStatus>('normal');
  const [stressScore] = useState(32);
  const [stressStatus] = useState<HealthStatus>('normal');
  const [activity] = useState('sitting');
  const [fallDetected] = useState(false);
  const [contractionActive] = useState(false);
  const [contractionFrequency] = useState(2);
  const [isConnected] = useState(false);
  const [batteryLevel] = useState(85);
  const [syncPending] = useState(3);

  // Pulsing animation for heart rate card
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.08,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),
    );
    pulse.start();
    return () => pulse.stop();
  }, [pulseAnim]);

  const activityLabel = (act: string): string => {
    const labels: Record<string, string> = {
      sitting: 'Sitting',
      walking: 'Walking',
      lying: 'Lying Down',
      standing: 'Standing',
      unknown: 'Unknown',
    };
    return labels[act] || 'Unknown';
  };

  const activityIcon = (act: string): string => {
    const icons: Record<string, string> = {
      sitting: '🪑',
      walking: '🚶',
      lying: '🛏️',
      standing: '🧍',
      unknown: '❓',
    };
    return icons[act] || '❓';
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.scrollContent, isTablet && styles.scrollTablet]}
      showsVerticalScrollIndicator={false}
    >
      {/* Top Bar */}
      <View style={styles.topBar}>
        <View style={styles.topBarLeft}>
          <Heading style={styles.screenTitle}>Maternal Health</Heading>
        </View>
        <View style={styles.topBarRight}>
          {/* BLE Connection */}
          <View style={styles.statusPill}>
            <View
              style={[
                styles.connectionDot,
                { backgroundColor: isConnected ? Theme.colors.success : Theme.colors.danger },
              ]}
            />
            <Caption style={styles.statusPillText}>
              {isConnected ? 'Connected' : 'Disconnected'}
            </Caption>
          </View>
          {/* Battery */}
          <View style={styles.statusPill}>
            <Text style={styles.statusEmoji}>🔋</Text>
            <Caption style={styles.statusPillText}>{batteryLevel}%</Caption>
          </View>
          {/* Sync */}
          <View style={styles.statusPill}>
            <Text style={styles.statusEmoji}>☁️</Text>
            <Caption style={styles.statusPillText}>
              {syncPending > 0 ? `${syncPending}` : '✓'}
            </Caption>
          </View>
        </View>
      </View>

      {/* 6 Cards Grid */}
      <View style={styles.grid}>
        {/* Heart Rate Card */}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => navigation.navigate('HeartRateDetail')}
          style={[styles.gridCard, { borderLeftColor: statusColor(hrStatus), width: cardWidth }]}
        >
          <View style={styles.cardHeader}>
            <Text style={styles.cardEmoji}>❤️</Text>
            <Caption style={styles.cardLabel}>Heart Rate</Caption>
          </View>
          <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
            <Text style={[styles.cardValue, { color: statusColor(hrStatus) }]}>
              {heartRate}
            </Text>
          </Animated.View>
          <Caption style={styles.cardUnit}>bpm</Caption>
        </TouchableOpacity>

        {/* SpO₂ Card */}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => navigation.navigate('SpO2Detail')}
          style={[styles.gridCard, { borderLeftColor: statusColor(spO2Status), width: cardWidth }]}
        >
          <View style={styles.cardHeader}>
            <Text style={styles.cardEmoji}>🫁</Text>
            <Caption style={styles.cardLabel}>Blood Oxygen</Caption>
          </View>
          <Text style={[styles.cardValue, { color: statusColor(spO2Status) }]}>
            {spO2}%
          </Text>
          <Caption style={styles.cardUnit}>SpO₂</Caption>
        </TouchableOpacity>

        {/* Temperature Card */}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => navigation.navigate('TemperatureDetail')}
          style={[styles.gridCard, { borderLeftColor: statusColor(tempStatus), width: cardWidth }]}
        >
          <View style={styles.cardHeader}>
            <Text style={styles.cardEmoji}>🌡️</Text>
            <Caption style={styles.cardLabel}>Body Temp</Caption>
          </View>
          <Text style={[styles.cardValue, { color: statusColor(tempStatus) }]}>
            {temperature.toFixed(1)}°C
          </Text>
          <Caption style={styles.cardUnit}>Celsius</Caption>
        </TouchableOpacity>

        {/* Stress Card */}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => navigation.navigate('StressDetail')}
          style={[styles.gridCard, { borderLeftColor: statusColor(stressStatus), width: cardWidth }]}
        >
          <View style={styles.cardHeader}>
            <Text style={styles.cardEmoji}>🧠</Text>
            <Caption style={styles.cardLabel}>Stress Level</Caption>
          </View>
          <Text style={[styles.cardValue, { color: statusColor(stressStatus) }]}>
            {stressScore}
          </Text>
          {/* Stress Gauge Bar */}
          <View style={styles.gaugeContainer}>
            <View style={styles.gaugeTrack}>
              <View
                style={[
                  styles.gaugeFill,
                  {
                    width: `${Math.min(stressScore, 100)}%`,
                    backgroundColor: statusColor(stressStatus),
                  },
                ]}
              />
            </View>
            <Caption style={styles.gaugeLabel}>0 — 100</Caption>
          </View>
        </TouchableOpacity>

        {/* Activity Card */}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => navigation.navigate('ActivityDetail')}
          style={[
            styles.gridCard,
            { borderLeftColor: fallDetected ? Theme.colors.danger : Theme.colors.success, width: cardWidth },
          ]}
        >
          <View style={styles.cardHeader}>
            <Text style={styles.cardEmoji}>🏃</Text>
            <Caption style={styles.cardLabel}>Activity</Caption>
          </View>
          <View style={styles.activityRow}>
            <Text style={styles.activityIcon}>{activityIcon(activity)}</Text>
            <Subheading style={styles.activityText}>{activityLabel(activity)}</Subheading>
          </View>
          <Caption style={[styles.cardUnit, { color: fallDetected ? Theme.colors.danger : Theme.colors.success }]}>
            {fallDetected ? '⚠️ Fall detected!' : 'No falls detected'}
          </Caption>
        </TouchableOpacity>

        {/* Contractions Card */}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => navigation.navigate('ContractionDetail')}
          style={[
            styles.gridCard,
            {
              borderLeftColor: contractionActive ? Theme.colors.warning : Theme.colors.success,
              width: cardWidth
            },
          ]}
        >
          <View style={styles.cardHeader}>
            <Text style={styles.cardEmoji}>🤰</Text>
            <Caption style={styles.cardLabel}>Contractions</Caption>
          </View>
          <Text
            style={[
              styles.cardValue,
              {
                color: contractionActive ? Theme.colors.warning : Theme.colors.success,
                fontSize: Theme.typography.sizes.xl,
              },
            ]}
          >
            {contractionActive ? 'Active' : 'None'}
          </Text>
          {contractionActive && (
            <>
              <Caption style={styles.cardUnit}>{contractionFrequency}/hr</Caption>
              <View style={styles.intensityBarContainer}>
                <View style={styles.intensityBarTrack}>
                  <View
                    style={[
                      styles.intensityBarFill,
                      { width: '45%', backgroundColor: Theme.colors.warning },
                    ]}
                  />
                </View>
              </View>
            </>
          )}
          {!contractionActive && (
            <Caption style={styles.cardUnit}>{contractionFrequency}/hr frequency</Caption>
          )}
        </TouchableOpacity>
      </View>

      {/* Bottom Sync Button */}
      <View style={styles.bottomActions}>
        <Button
          title={`☁️  Cloud Sync${syncPending > 0 ? ` (${syncPending} pending)` : ''}`}
          variant="outline"
          size="small"
          onPress={() => navigation.navigate('SyncStatus')}
          style={styles.syncButton}
        />
      </View>
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
    paddingTop: Theme.spacing.xxl,
    paddingBottom: Theme.spacing.xxxl,
  },
  scrollTablet: {
    alignSelf: 'center',
    width: '100%',
    maxWidth: 900,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Theme.spacing.xl,
  },
  topBarLeft: {
    flex: 1,
  },
  screenTitle: {
    fontSize: Theme.typography.sizes.xxl,
    color: Theme.colors.primaryDark,
  },
  topBarRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.sm,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.cardBackground,
    paddingHorizontal: Theme.spacing.sm,
    paddingVertical: Theme.spacing.xs,
    borderRadius: Theme.borders.radius.round,
    borderWidth: Theme.borders.width.thin,
    borderColor: Theme.colors.divider,
    gap: 4,
  },
  connectionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusPillText: {
    fontSize: Theme.typography.sizes.xs,
    color: Theme.colors.textSecondary,
  },
  statusEmoji: {
    fontSize: 12,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  gridCard: {
    backgroundColor: Theme.colors.cardBackground,
    borderRadius: Theme.borders.radius.lg,
    padding: Theme.spacing.lg,
    marginBottom: Theme.spacing.md,
    borderLeftWidth: 4,
    borderWidth: Theme.borders.width.thin,
    borderColor: Theme.colors.divider,
    ...Theme.shadows.medium,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Theme.spacing.sm,
    gap: Theme.spacing.xs,
  },
  cardEmoji: {
    fontSize: 18,
  },
  cardLabel: {
    fontSize: Theme.typography.sizes.xs,
    color: Theme.colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  cardValue: {
    fontSize: Theme.typography.sizes.jumbo,
    fontWeight: Theme.typography.weights.bold,
    color: Theme.colors.text,
    marginVertical: Theme.spacing.xs,
  },
  cardUnit: {
    fontSize: Theme.typography.sizes.sm,
    color: Theme.colors.textMuted,
  },
  gaugeContainer: {
    marginTop: Theme.spacing.sm,
  },
  gaugeTrack: {
    height: 6,
    backgroundColor: Theme.colors.divider,
    borderRadius: Theme.borders.radius.round,
    overflow: 'hidden',
  },
  gaugeFill: {
    height: '100%',
    borderRadius: Theme.borders.radius.round,
  },
  gaugeLabel: {
    fontSize: Theme.typography.sizes.xs,
    color: Theme.colors.textMuted,
    textAlign: 'center',
    marginTop: 2,
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.sm,
    marginVertical: Theme.spacing.xs,
  },
  activityIcon: {
    fontSize: 24,
  },
  activityText: {
    fontSize: Theme.typography.sizes.md,
    color: Theme.colors.text,
  },
  intensityBarContainer: {
    marginTop: Theme.spacing.xs,
  },
  intensityBarTrack: {
    height: 4,
    backgroundColor: Theme.colors.divider,
    borderRadius: Theme.borders.radius.round,
    overflow: 'hidden',
  },
  intensityBarFill: {
    height: '100%',
    borderRadius: Theme.borders.radius.round,
  },
  bottomActions: {
    marginTop: Theme.spacing.lg,
    alignItems: 'center',
  },
  syncButton: {
    minWidth: 220,
  },
});

export default HealthDashboardScreen;
