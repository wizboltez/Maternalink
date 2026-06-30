import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import Theme from '../../../core/theme/theme';
import { Heading, Subheading, BodyText, Caption } from '../../../core/components/Typography';
import { Card } from '../../../core/components/Card';
import { Button } from '../../../core/components/Button';
import { useAuth } from '../../../core/context/AuthContext';
import { emergencyService, EmergencyAlert } from '../services/emergencyService';

export const EmergencyAlertHistoryScreen: React.FC = () => {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState<EmergencyAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedAlertId, setExpandedAlertId] = useState<string | null>(null);

  useEffect(() => {
    if (user?.id) {
      loadHistory();
    }
  }, [user]);

  const loadHistory = async () => {
    if (!user?.id) return;
    setIsLoading(true);
    try {
      const data = await emergencyService.getAlertHistory(user.id);
      setAlerts(data);
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.error || 'Failed to load alert logs.');
    } finally {
      setIsLoading(false);
    }
  };

  const getSeverityStyle = (severity: string) => {
    switch (severity) {
      case 'critical':
        return { color: Theme.colors.danger, bg: Theme.colors.danger + '12', label: 'CRITICAL' };
      case 'high':
        return { color: Theme.colors.warning, bg: Theme.colors.warning + '12', label: 'HIGH RISK' };
      case 'medium':
        return { color: Theme.colors.info, bg: Theme.colors.info + '12', label: 'MEDIUM' };
      case 'low':
      default:
        return { color: Theme.colors.success, bg: Theme.colors.success + '12', label: 'MINOR' };
    }
  };

  const formatTriggerLabel = (type: string) => {
    return type.replace(/_/g, ' ');
  };

  const toggleExpand = (id: string) => {
    if (expandedAlertId === id) {
      setExpandedAlertId(null);
    } else {
      setExpandedAlertId(id);
    }
  };

  if (isLoading && alerts.length === 0) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Theme.colors.primary} />
        <BodyText style={styles.loadingText}>Fetching alert history...</BodyText>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Heading style={styles.title}>Emergency History</Heading>
        <BodyText style={styles.subtitle}>Past incident reports and biometrics</BodyText>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {alerts.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Subheading style={styles.emptyIcon}>🛡️</Subheading>
            <Subheading style={styles.emptyTitle}>All Vitals Clear</Subheading>
            <Caption style={styles.emptyText}>
              No emergency alerts have been logged for your profile. Your maternal belt readings are safe.
            </Caption>
          </Card>
        ) : (
          alerts.map((alert) => {
            const sev = getSeverityStyle(alert.severity);
            const isExpanded = expandedAlertId === alert._id;
            const formattedDate = new Date(alert.createdAt).toLocaleString(undefined, {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <Card key={alert._id} style={styles.alertCard}>
                <View style={styles.cardHeader}>
                  <View style={styles.titleCol}>
                    <Subheading style={styles.alertTitle}>
                      {formatTriggerLabel(alert.triggerType)}
                    </Subheading>
                    <Caption style={styles.alertTime}>{formattedDate}</Caption>
                  </View>
                  <View style={[styles.badge, { backgroundColor: sev.bg }]}>
                    <Caption style={{ color: sev.color, fontWeight: 'bold', fontSize: 10 }}>
                      {sev.label}
                    </Caption>
                  </View>
                </View>

                <BodyText style={styles.alertMessage}>{alert.message}</BodyText>

                {/* Delivery Channels status row */}
                <View style={styles.deliveryRow}>
                  <Caption style={styles.deliveryTitle}>Dispatched:</Caption>
                  <View style={styles.statusBadge}>
                    <Caption style={alert.notificationsSent.whatsapp ? styles.activeStatus : styles.inactiveStatus}>
                      {alert.notificationsSent.whatsapp ? '✅ WhatsApp Contact' : '❌ WhatsApp Contact'}
                    </Caption>
                  </View>
                  <View style={[styles.statusBadge, { marginLeft: Theme.spacing.sm }]}>
                    <Caption style={alert.notificationsSent.push ? styles.activeStatus : styles.inactiveStatus}>
                      {alert.notificationsSent.push ? '✅ App Push' : '❌ App Push'}
                    </Caption>
                  </View>
                </View>

                {/* Expandable Biometrics section */}
                {Object.keys(alert.sensorSnapshot).length > 0 && (
                  <View style={styles.expandableSection}>
                    <TouchableOpacity
                      onPress={() => toggleExpand(alert._id)}
                      style={styles.expandHeader}
                    >
                      <Subheading style={styles.expandTitle}>
                        {isExpanded ? '▼ Hide Sensor Telemetry' : '▶ View Sensor Telemetry'}
                      </Subheading>
                    </TouchableOpacity>

                    {isExpanded && (
                      <View style={styles.snapshotGrid}>
                        {alert.sensorSnapshot.maternalHeartRate !== undefined && (
                          <View style={styles.gridCell}>
                            <Caption style={styles.cellLabel}>Mother HR</Caption>
                            <BodyText style={styles.cellVal}>
                              {alert.sensorSnapshot.maternalHeartRate} bpm
                            </BodyText>
                          </View>
                        )}
                        {alert.sensorSnapshot.fetalHeartRate !== undefined && (
                          <View style={styles.gridCell}>
                            <Caption style={styles.cellLabel}>Fetal HR</Caption>
                            <BodyText style={styles.cellVal}>
                              {alert.sensorSnapshot.fetalHeartRate} bpm
                            </BodyText>
                          </View>
                        )}
                        {alert.sensorSnapshot.stressLevel !== undefined && (
                          <View style={styles.gridCell}>
                            <Caption style={styles.cellLabel}>Stress Level</Caption>
                            <BodyText style={styles.cellVal}>
                              {alert.sensorSnapshot.stressLevel}%
                            </BodyText>
                          </View>
                        )}
                        {alert.sensorSnapshot.contractionIntensity !== undefined && (
                          <View style={styles.gridCell}>
                            <Caption style={styles.cellLabel}>Intensity</Caption>
                            <BodyText style={styles.cellVal}>
                              {alert.sensorSnapshot.contractionIntensity}%
                            </BodyText>
                          </View>
                        )}
                        {alert.sensorSnapshot.contractionFrequency !== undefined && (
                          <View style={styles.gridCell}>
                            <Caption style={styles.cellLabel}>Freq / hour</Caption>
                            <BodyText style={styles.cellVal}>
                              {alert.sensorSnapshot.contractionFrequency}
                            </BodyText>
                          </View>
                        )}
                        {alert.sensorSnapshot.fallDetected !== undefined && (
                          <View style={styles.gridCell}>
                            <Caption style={styles.cellLabel}>Fall Vector</Caption>
                            <BodyText style={[styles.cellVal, { color: alert.sensorSnapshot.fallDetected ? Theme.colors.danger : Theme.colors.success }]}>
                              {alert.sensorSnapshot.fallDetected ? 'FALL DETECTED' : 'CLEAR'}
                            </BodyText>
                          </View>
                        )}
                      </View>
                    )}
                  </View>
                )}
              </Card>
            );
          })
        )}

        {alerts.length > 0 && (
          <Button
            title="Refresh Logs"
            variant="outline"
            onPress={loadHistory}
            style={styles.refreshBtn}
          />
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.colors.background },
  header: { paddingHorizontal: Theme.spacing.xl, paddingTop: Theme.spacing.xxl, paddingBottom: Theme.spacing.md },
  title: { color: Theme.colors.primaryDark },
  subtitle: { color: Theme.colors.textSecondary, marginTop: Theme.spacing.xs },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: Theme.spacing.sm, color: Theme.colors.textSecondary },
  scroll: { padding: Theme.spacing.xl, paddingBottom: 100 },
  emptyCard: { padding: Theme.spacing.xl, alignItems: 'center', backgroundColor: Theme.colors.accentLight + '30', borderStyle: 'solid', borderWidth: 1, borderColor: Theme.colors.accent + '30' },
  emptyIcon: { fontSize: 40, marginBottom: Theme.spacing.md },
  emptyTitle: { color: Theme.colors.accent, marginBottom: Theme.spacing.sm },
  emptyText: { textAlign: 'center', color: Theme.colors.textSecondary, lineHeight: 18 },
  alertCard: { padding: Theme.spacing.lg, marginBottom: Theme.spacing.md },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', borderBottomWidth: 1, borderBottomColor: Theme.colors.divider, paddingBottom: Theme.spacing.xs, marginBottom: Theme.spacing.sm },
  titleCol: { flex: 1 },
  alertTitle: { color: Theme.colors.text, fontWeight: '700' },
  alertTime: { color: Theme.colors.textMuted, marginTop: 2 },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: Theme.borders.radius.xs },
  alertMessage: { color: Theme.colors.textSecondary, lineHeight: 20, fontSize: Theme.typography.sizes.sm },
  deliveryRow: { flexDirection: 'row', alignItems: 'center', marginTop: Theme.spacing.md, paddingTop: Theme.spacing.sm, borderTopWidth: 1, borderTopColor: Theme.colors.divider },
  deliveryTitle: { color: Theme.colors.textMuted, fontSize: 11, marginRight: Theme.spacing.sm },
  statusBadge: { backgroundColor: Theme.colors.background, paddingHorizontal: 6, paddingVertical: 2, borderRadius: Theme.borders.radius.xs, borderWidth: 1, borderColor: Theme.colors.divider },
  activeStatus: { color: Theme.colors.success, fontSize: 10, fontWeight: '600' },
  inactiveStatus: { color: Theme.colors.textMuted, fontSize: 10, fontWeight: '600' },
  expandableSection: { marginTop: Theme.spacing.sm },
  expandHeader: { paddingVertical: Theme.spacing.sm },
  expandTitle: { color: Theme.colors.primary, fontSize: Theme.typography.sizes.sm, fontWeight: '600' },
  snapshotGrid: { flexDirection: 'row', flexWrap: 'wrap', backgroundColor: Theme.colors.background, padding: Theme.spacing.sm, borderRadius: Theme.borders.radius.md, borderWidth: 1, borderColor: Theme.colors.divider, marginTop: Theme.spacing.xs },
  gridCell: { width: '50%', paddingVertical: 4, paddingHorizontal: Theme.spacing.sm },
  cellLabel: { color: Theme.colors.textMuted, fontSize: 10 },
  cellVal: { color: Theme.colors.text, fontSize: Theme.typography.sizes.sm, fontWeight: 'bold', marginTop: 2 },
  refreshBtn: { marginTop: Theme.spacing.md, marginBottom: Theme.spacing.xl },
});

export default EmergencyAlertHistoryScreen;
