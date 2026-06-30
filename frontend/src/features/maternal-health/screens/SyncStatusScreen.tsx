import React, { useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  Alert,
} from 'react-native';
import Theme from '../../../core/theme/theme';
import { Heading, Subheading, BodyText, Caption } from '../../../core/components/Typography';
import { Card } from '../../../core/components/Card';
import { Button } from '../../../core/components/Button';

interface SyncEvent {
  time: string;
  status: 'success' | 'failed' | 'partial';
  batchesSynced: number;
  message: string;
}

const SyncStatusScreen: React.FC<{ navigation: any; route?: any }> = ({ navigation, route }) => {
  const [lastSyncTime] = useState<string | null>('14:12');
  const [pendingBatches] = useState(3);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isOnline] = useState(true);

  // Demo sync history
  const [syncHistory] = useState<SyncEvent[]>([
    { time: '14:12', status: 'success', batchesSynced: 5, message: '5 batches synced successfully' },
    { time: '13:45', status: 'partial', batchesSynced: 3, message: '3 of 6 batches synced — retrying' },
    { time: '13:00', status: 'success', batchesSynced: 8, message: '8 batches synced successfully' },
    { time: '12:15', status: 'failed', batchesSynced: 0, message: 'Network timeout — will retry' },
    { time: '11:30', status: 'success', batchesSynced: 4, message: '4 batches synced successfully' },
  ]);

  const syncStatusText = (): string => {
    if (isSyncing) return 'Syncing...';
    if (pendingBatches === 0) return 'Up to date';
    return `${pendingBatches} batches pending`;
  };

  const syncStatusColor = (): string => {
    if (isSyncing) return Theme.colors.info;
    if (pendingBatches === 0) return Theme.colors.success;
    return Theme.colors.warning;
  };

  const eventStatusColor = (status: string): string => {
    switch (status) {
      case 'success':
        return Theme.colors.success;
      case 'failed':
        return Theme.colors.danger;
      case 'partial':
        return Theme.colors.warning;
      default:
        return Theme.colors.textMuted;
    }
  };

  const eventStatusEmoji = (status: string): string => {
    switch (status) {
      case 'success':
        return '✅';
      case 'failed':
        return '❌';
      case 'partial':
        return '⚠️';
      default:
        return '❓';
    }
  };

  const handleSync = () => {
    if (!isOnline || isSyncing) return;
    setIsSyncing(true);
    // Simulate sync
    setTimeout(() => setIsSyncing(false), 3000);
  };

  const handleClearQueue = () => {
    Alert.alert(
      'Clear Sync Queue',
      'Are you sure you want to clear all pending sync data? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: () => {
            // Would clear the queue
          },
        },
      ],
    );
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

      {/* Screen Title */}
      <Heading style={styles.screenTitle}>☁️ Cloud Sync</Heading>

      {/* Network Status */}
      <View
        style={[
          styles.networkBanner,
          {
            backgroundColor: isOnline
              ? Theme.colors.success + '15'
              : Theme.colors.danger + '15',
            borderColor: isOnline
              ? Theme.colors.success + '30'
              : Theme.colors.danger + '30',
          },
        ]}
      >
        <View
          style={[
            styles.networkDot,
            { backgroundColor: isOnline ? Theme.colors.success : Theme.colors.danger },
          ]}
        />
        <BodyText
          style={[
            styles.networkText,
            { color: isOnline ? Theme.colors.success : Theme.colors.danger },
          ]}
        >
          {isOnline ? 'Online' : 'Offline'}
        </BodyText>
      </View>

      {/* Sync Status Card */}
      <Card style={styles.statusCard} shadow="medium">
        <View style={styles.statusHeader}>
          <View style={styles.statusIconWrapper}>
            <Text style={styles.statusEmoji}>
              {isSyncing ? '🔄' : pendingBatches === 0 ? '✅' : '⏳'}
            </Text>
          </View>
          <View style={styles.statusInfo}>
            <Subheading style={styles.statusTitle}>Sync Status</Subheading>
            <BodyText style={[styles.statusValue, { color: syncStatusColor() }]}>
              {syncStatusText()}
            </BodyText>
          </View>
        </View>

        <View style={styles.statusDetails}>
          <View style={styles.statusRow}>
            <Caption style={styles.detailLabel}>Last Sync</Caption>
            <BodyText style={styles.detailValue}>
              {lastSyncTime ? `Today, ${lastSyncTime}` : 'Never'}
            </BodyText>
          </View>
          <View style={styles.statusDivider} />
          <View style={styles.statusRow}>
            <Caption style={styles.detailLabel}>Pending Batches</Caption>
            <BodyText
              style={[
                styles.detailValue,
                {
                  color: pendingBatches > 0 ? Theme.colors.warning : Theme.colors.success,
                  fontWeight: Theme.typography.weights.semibold,
                },
              ]}
            >
              {pendingBatches}
            </BodyText>
          </View>
          <View style={styles.statusDivider} />
          <View style={styles.statusRow}>
            <Caption style={styles.detailLabel}>Connection</Caption>
            <BodyText style={styles.detailValue}>
              {isOnline ? 'Wi-Fi' : 'No Connection'}
            </BodyText>
          </View>
        </View>
      </Card>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <Button
          title={isSyncing ? '🔄  Syncing...' : '☁️  Sync Now'}
          variant="primary"
          size="large"
          onPress={handleSync}
          disabled={!isOnline || isSyncing}
          loading={isSyncing}
          style={styles.syncNowButton}
        />
        <Button
          title="🗑️  Clear Queue"
          variant="danger"
          size="medium"
          onPress={handleClearQueue}
          disabled={pendingBatches === 0}
          style={styles.clearButton}
        />
      </View>

      {/* Sync History */}
      <Card style={styles.historyCard} shadow="light">
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionEmoji}>📜</Text>
          <Subheading style={styles.sectionTitle}>Sync History</Subheading>
        </View>

        {syncHistory.length === 0 ? (
          <View style={styles.emptyHistory}>
            <Text style={styles.emptyEmoji}>📭</Text>
            <BodyText style={styles.emptyText}>No sync history yet</BodyText>
          </View>
        ) : (
          syncHistory.map((event, index) => (
            <View
              key={index}
              style={[
                styles.historyItem,
                index < syncHistory.length - 1 && styles.historyItemBorder,
              ]}
            >
              <View style={styles.historyLeft}>
                <Text style={styles.historyEmoji}>{eventStatusEmoji(event.status)}</Text>
                <View style={styles.historyContent}>
                  <BodyText style={styles.historyMessage}>{event.message}</BodyText>
                  <Caption style={styles.historyTime}>Today, {event.time}</Caption>
                </View>
              </View>
              <View
                style={[
                  styles.historyBadge,
                  { backgroundColor: eventStatusColor(event.status) + '20' },
                ]}
              >
                <Caption
                  style={[
                    styles.historyBadgeText,
                    { color: eventStatusColor(event.status) },
                  ]}
                >
                  {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
                </Caption>
              </View>
            </View>
          ))
        )}
      </Card>

      {/* Info Note */}
      <View style={styles.infoNote}>
        <Text style={styles.infoEmoji}>ℹ️</Text>
        <Caption style={styles.infoText}>
          Data is batched locally and synced to the cloud periodically. Sync occurs
          automatically when connected to the internet.
        </Caption>
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
  screenTitle: {
    fontSize: Theme.typography.sizes.xxl,
    color: Theme.colors.primaryDark,
    marginBottom: Theme.spacing.lg,
  },
  networkBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Theme.spacing.lg,
    paddingVertical: Theme.spacing.md,
    borderRadius: Theme.borders.radius.md,
    borderWidth: Theme.borders.width.thin,
    gap: Theme.spacing.sm,
    marginBottom: Theme.spacing.lg,
  },
  networkDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  networkText: {
    fontWeight: Theme.typography.weights.semibold,
  },
  statusCard: {
    marginBottom: Theme.spacing.lg,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.md,
    marginBottom: Theme.spacing.lg,
  },
  statusIconWrapper: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Theme.colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusEmoji: {
    fontSize: 24,
  },
  statusInfo: {
    flex: 1,
    gap: 2,
  },
  statusTitle: {
    color: Theme.colors.text,
  },
  statusValue: {
    fontWeight: Theme.typography.weights.semibold,
  },
  statusDetails: {
    backgroundColor: Theme.colors.background,
    borderRadius: Theme.borders.radius.md,
    padding: Theme.spacing.md,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Theme.spacing.sm,
  },
  statusDivider: {
    height: Theme.borders.width.thin,
    backgroundColor: Theme.colors.divider,
  },
  detailLabel: {
    fontSize: Theme.typography.sizes.sm,
    color: Theme.colors.textMuted,
  },
  detailValue: {
    fontSize: Theme.typography.sizes.base,
    color: Theme.colors.text,
  },
  actionButtons: {
    gap: Theme.spacing.md,
    marginBottom: Theme.spacing.xl,
  },
  syncNowButton: {
    width: '100%',
  },
  clearButton: {
    width: '100%',
  },
  historyCard: {
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
  emptyHistory: {
    alignItems: 'center',
    paddingVertical: Theme.spacing.xl,
    gap: Theme.spacing.sm,
  },
  emptyEmoji: {
    fontSize: 28,
  },
  emptyText: {
    color: Theme.colors.textMuted,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Theme.spacing.md,
  },
  historyItemBorder: {
    borderBottomWidth: Theme.borders.width.thin,
    borderBottomColor: Theme.colors.divider,
  },
  historyLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
    gap: Theme.spacing.md,
  },
  historyEmoji: {
    fontSize: 18,
    marginTop: 2,
  },
  historyContent: {
    flex: 1,
    gap: 2,
  },
  historyMessage: {
    fontSize: Theme.typography.sizes.sm,
    color: Theme.colors.text,
  },
  historyTime: {
    fontSize: Theme.typography.sizes.xs,
    color: Theme.colors.textMuted,
  },
  historyBadge: {
    paddingHorizontal: Theme.spacing.sm,
    paddingVertical: Theme.spacing.xs,
    borderRadius: Theme.borders.radius.sm,
    marginLeft: Theme.spacing.sm,
  },
  historyBadgeText: {
    fontSize: Theme.typography.sizes.xs,
    fontWeight: Theme.typography.weights.semibold,
  },
  infoNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Theme.spacing.sm,
    padding: Theme.spacing.md,
    backgroundColor: Theme.colors.info + '10',
    borderRadius: Theme.borders.radius.md,
    borderWidth: Theme.borders.width.thin,
    borderColor: Theme.colors.info + '20',
    marginBottom: Theme.spacing.lg,
  },
  infoEmoji: {
    fontSize: 16,
    marginTop: 1,
  },
  infoText: {
    flex: 1,
    color: Theme.colors.textSecondary,
    fontSize: Theme.typography.sizes.xs,
    lineHeight: 16,
  },
});

export default SyncStatusScreen;
