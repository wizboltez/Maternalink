import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Text, Alert } from 'react-native';
import Theme from '../../../core/theme/theme';
import { Heading, Subheading, BodyText, Caption } from '../../../core/components/Typography';
import { Card } from '../../../core/components/Card';
import { Button } from '../../../core/components/Button';
import { Modal } from '../../../core/components/Modal';
import { getSavedBelts } from '../../../core/services/beltHistoryService';
import { formatSessionTimer } from '../../../core/utils/timeFormat';
import contractionApi from '../api/contractionApi';

export const ManualRecordingScreen: React.FC<{ route: any; navigation: any }> = ({ route, navigation }) => {
  const deviceId = route.params?.deviceId || '6674681144f8dc05b2ee13c1';
  
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  
  // List of recorded sessions
  const [loggedContractions, setLoggedContractions] = useState<{
    start: string;
    duration: number;
  }[]>([]);

  useEffect(() => {
    const setupManualSession = async () => {
      setLoading(true);
      try {
        const saved = await getSavedBelts();
        if (saved.length === 0) {
          Alert.alert(
            'No Belt Connected',
            'Connect your Smart Maternal Belt via Bluetooth before manual recording.',
            [{ text: 'Connect Belt', onPress: () => navigation.navigate('DeviceConnection') }]
          );
          return;
        }

        const belt = saved[0];
        if (!belt.backendDeviceId) {
          Alert.alert('Belt Not Ready', 'Reconnect your belt before manual recording.');
          return;
        }

        let calibrationId: string;
        try {
          const calData = await contractionApi.getLatestCalibration(belt.backendDeviceId);
          calibrationId = calData.calibration._id;
        } catch {
          Alert.alert(
            'Calibration Required',
            'Run the calibration wizard before manual recording.',
            [{ text: 'Calibrate', onPress: () => navigation.navigate('CalibrationWizard', { deviceId: belt.backendDeviceId }) }]
          );
          return;
        }

        const sess = await contractionApi.startSession(belt.backendDeviceId, calibrationId);
        setActiveSessionId(sess.session._id);
      } catch (err: any) {
        Alert.alert('Session Setup Error', err.response?.data?.error || 'Failed to initialize session.');
      } finally {
        setLoading(false);
      }
    };

    setupManualSession();
  }, [navigation]);

  // Timer counter
  useEffect(() => {
    let tId: NodeJS.Timeout;
    if (isRecording) {
      tId = setInterval(() => {
        setTimerSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(tId);
  }, [isRecording]);

  const handleStartContraction = () => {
    setStartTime(new Date());
    setTimerSeconds(0);
    setIsRecording(true);
  };

  const handleStopContraction = () => {
    setIsRecording(false);
    setShowConfirmModal(true);
  };

  const saveManualContraction = async (confirm: boolean) => {
    setShowConfirmModal(false);
    
    if (confirm && activeSessionId && startTime) {
      const now = new Date();
      const elapsedSeconds = timerSeconds;

      try {
        await contractionApi.postReading(activeSessionId, {
          source: 'manual',
          isContraction: true,
          isConfirmed: true,
          duration: elapsedSeconds,
          intensity: 50,
          timestamp: now.getTime(),
        });

        // Add to local logs list
        setLoggedContractions((prev) => [
          { start: startTime.toLocaleTimeString(), duration: elapsedSeconds },
          ...prev,
        ]);
        
        Alert.alert('Saved', 'Contraction registered successfully.');
      } catch (err: any) {
        Alert.alert('Error Saving', 'Unable to reach backend servers.');
      }
    }
    
    setStartTime(null);
    setTimerSeconds(0);
  };

  const formatTimer = formatSessionTimer;

  const handleCloseSession = async () => {
    if (activeSessionId) {
      try {
        const result = await contractionApi.stopSession(activeSessionId);
        if (result.discarded) {
          Alert.alert('Session Not Saved', 'Sessions shorter than 1 minute are not stored.');
          navigation.navigate('MonitoringHome');
          return;
        }
        navigation.navigate('SessionSummary', { sessionId: activeSessionId });
      } catch {
        navigation.navigate('MonitoringHome');
      }
    } else {
      navigation.navigate('MonitoringHome');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Heading style={styles.title}>Manual Recording Mode</Heading>
        <BodyText style={styles.subtitle}>
          Track contractions by pressing the trigger manually. Useful if your smart belt is charging or offline.
        </BodyText>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Active Timer Box */}
            <Card style={styles.timerCard}>
          <Heading style={styles.timer}>
            {formatTimer(timerSeconds)}
          </Heading>
          <Caption>{isRecording ? 'RECORDING ACTIVE CONTRACTION' : 'READY TO RECORD'}</Caption>

          {!isRecording ? (
            <Button
              title="Start Contraction"
              onPress={handleStartContraction}
              disabled={loading}
              style={styles.actionBtn}
            />
          ) : (
            <Button
              title="End Contraction"
              variant="danger"
              onPress={handleStopContraction}
              style={styles.actionBtn}
            />
          )}
        </Card>

        {/* Local History logs during this session */}
        <Card style={styles.logCard}>
          <Subheading style={styles.logHeader}>Registered Timers</Subheading>
          
          {loggedContractions.length === 0 ? (
            <Caption style={styles.emptyText}>No manual contractions recorded yet.</Caption>
          ) : (
            loggedContractions.map((c, idx) => (
              <View key={idx} style={styles.logRow}>
                <BodyText style={styles.logTime}>Contraction at {c.start}</BodyText>
                <BodyText style={styles.logDur}>Duration: {c.duration}s</BodyText>
              </View>
            ))
          )}
        </Card>

        <Button
          title="Save and Exit Session"
          variant="outline"
          onPress={handleCloseSession}
          style={styles.exitBtn}
        />
      </ScrollView>

      {/* Confirmation Modal */}
      <Modal visible={showConfirmModal} onClose={() => setShowConfirmModal(false)}>
        <Subheading style={styles.modalTitle}>Confirm Contraction</Subheading>
        <BodyText style={styles.modalText}>
          Did this contraction last approximately {timerSeconds} seconds?
        </BodyText>
        <View style={styles.modalButtons}>
          <Button
            title="Discard"
            variant="outline"
            onPress={() => saveManualContraction(false)}
            style={styles.modalBtn}
          />
          <Button
            title="Save Record"
            onPress={() => saveManualContraction(true)}
            style={styles.modalBtn}
          />
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
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
  },
  timerCard: {
  alignItems: 'center',
  paddingTop: Theme.spacing.xl,      // 24
  paddingBottom: Theme.spacing.xxl,  // 32
  },
  timer: {
  fontSize: Theme.typography.sizes.jumbo,
  lineHeight: 60,
  color: Theme.colors.primary,
  marginBottom: Theme.spacing.md,
  },
  actionBtn: {
    width: '80%',
    marginTop: Theme.spacing.lg,
  },
  logCard: {
    padding: Theme.spacing.lg,
  },
  logHeader: {
    color: Theme.colors.text,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.divider,
    paddingBottom: Theme.spacing.sm,
    marginBottom: Theme.spacing.md,
  },
  emptyText: {
    textAlign: 'center',
    paddingVertical: Theme.spacing.md,
  },
  logRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.divider,
  },
  logTime: {
    color: Theme.colors.text,
  },
  logDur: {
    color: Theme.colors.primary,
    fontWeight: Theme.typography.weights.semibold,
  },
  exitBtn: {
    marginTop: Theme.spacing.md,
    marginBottom: Theme.spacing.xxl,
  },
  modalTitle: {
    color: Theme.colors.text,
    marginBottom: Theme.spacing.md,
    textAlign: 'center',
  },
  modalText: {
    textAlign: 'center',
    color: Theme.colors.textSecondary,
    marginBottom: Theme.spacing.xl,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalBtn: {
    flex: 1,
    marginHorizontal: Theme.spacing.xs,
  },
});
export default ManualRecordingScreen;
