import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Text, Alert, Switch } from 'react-native';
import Theme from '../../../core/theme/theme';
import { Heading, Subheading, BodyText, Caption } from '../../../core/components/Typography';
import { Card } from '../../../core/components/Card';
import { Button } from '../../../core/components/Button';
import { Modal } from '../../../core/components/Modal';
import { CustomLineChart } from '../../../core/components/CustomLineChart';
import { useContractionMonitoring } from '../hooks/useContractionMonitoring';
import contractionApi from '../api/contractionApi';

export const LiveMonitoringScreen: React.FC<{ route: any; navigation: any }> = ({ route, navigation }) => {
  const sessionId = route.params?.sessionId || '6674681144f8dc05b2ee13c1';
  const deviceId = route.params?.deviceId || '6674681144f8dc05b2ee13c1';
  const confidence = route.params?.calibrationConfidence || 95;

  const {
    isConnected,
    batteryLevel,
    currentReading,
    adcBuffer,
    flexBuffer,
    intensityBuffer,
    timeLabels,
    contractions,
    activeAlert,
    isMuted,
    voiceVolume,
    toggleMute,
    changeVolume,
    showManualRecommendation,
    dismissManualRecommendation,
    isManualRecordingActive,
    startManualContraction,
    endManualContraction,
  } = useContractionMonitoring(sessionId, deviceId, confidence);

  // Active Session Timer
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const [showConfirmEndModal, setShowConfirmEndModal] = useState(false);
  const [showContractionPrompt, setShowContractionPrompt] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setSecondsElapsed((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTimer = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleStopSession = async () => {
    try {
      await contractionApi.stopSession(sessionId);
      navigation.navigate('SessionSummary', { sessionId });
    } catch (err: any) {
      Alert.alert('Session Error', 'Failed to save active session logs.');
    }
  };

  return (
    <View style={styles.container}>
      {/* Real-time Toast Warning */}
      {activeAlert && (
        <View style={styles.alertBanner}>
          <Text style={styles.alertText}>⚠️ {activeAlert.message}</Text>
        </View>
      )}

      {/* Connection & Calibration Info Bar */}
      <View style={styles.statusBar}>
        <View style={styles.row}>
          <View style={[styles.indicator, isConnected ? styles.green : styles.red]} />
          <Caption style={styles.statusText}>
            {isConnected ? 'Belt Connected' : 'Waiting for Belt...'}
          </Caption>
        </View>
        <Caption style={styles.statusText}>
          Calibration: {confidence}% (Good)
        </Caption>
        {batteryLevel !== null && (
          <Caption style={styles.statusText}>🔋 {batteryLevel}%</Caption>
        )}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Main Dashboard Widget */}
        <Card style={styles.timerCard}>
          <Heading style={styles.timer}>{formatTimer(secondsElapsed)}</Heading>
          <Caption>ACTIVE MONITORING DURATION</Caption>

          <View style={styles.metricsRow}>
            <View style={styles.metricItem}>
              <Subheading style={styles.metricVal}>
                {currentReading ? Math.round(currentReading.flexPercent) : 0}%
              </Subheading>
              <Caption style={styles.metricLabel}>Current Flex</Caption>
            </View>
            <View style={styles.metricItem}>
              <Subheading style={styles.metricVal}>
                {contractions.length}
              </Subheading>
              <Caption style={styles.metricLabel}>Total Detected</Caption>
            </View>
            <View style={styles.metricItem}>
              <Subheading style={styles.metricVal}>
                {contractions[0]?.interval ? Math.round(contractions[0].interval / 60) : 'N/A'} min
              </Subheading>
              <Caption style={styles.metricLabel}>Last Interval</Caption>
            </View>
          </View>
        </Card>

        {/* Dynamic Warning Toast Banner: Low Confidence Recommendation */}
        {showManualRecommendation && (
          <Card style={styles.manualRecommendCard}>
            <Subheading style={styles.warnText}>⚠️ Low Sensor Confidence</Subheading>
            <BodyText style={styles.manualWarnDescription}>
              The belt is experiencing high physical movement. We highly recommend using Manual Confirmation Mode to track contractions.
            </BodyText>
            <Button
              title="Acknowledge"
              variant="outline"
              size="small"
              onPress={dismissManualRecommendation}
              style={styles.dismissBtn}
            />
          </Card>
        )}

        {/* Live SVG Telemetry Charts */}
        <Card style={styles.chartCard}>
          <CustomLineChart
            data={flexBuffer}
            labels={timeLabels}
            title="Real-Time Flex% Curve"
            color={Theme.colors.primary}
            unit="%"
            minVal={0}
            maxVal={100}
          />
        </Card>

        <Card style={styles.chartCard}>
          <CustomLineChart
            data={intensityBuffer}
            labels={timeLabels}
            title="Contraction Intensity Tracker"
            color={Theme.colors.accent}
            unit="%"
            minVal={0}
            maxVal={100}
          />
        </Card>

        {/* Audio Controls */}
        <Card style={styles.audioCard}>
          <Subheading style={styles.audioTitle}>🔊 Voice Guidance Assistant</Subheading>
          <View style={styles.audioControlRow}>
            <BodyText>Mute Guidance Cues</BodyText>
            <Switch value={isMuted} onValueChange={toggleMute} />
          </View>
        </Card>

        {/* Contraction Confirmation Buttons */}
        <View style={styles.manualControlsRow}>
          {!isManualRecordingActive ? (
            <Button
              title="Record Contraction Manually"
              variant="secondary"
              onPress={startManualContraction}
              style={styles.fullWidthBtn}
            />
          ) : (
            <Button
              title="Stop Contraction Manually"
              variant="danger"
              onPress={() => setShowContractionPrompt(true)}
              style={styles.fullWidthBtn}
            />
          )}
        </View>

        <Button
          title="Complete Session"
          variant="primary"
          onPress={() => setShowConfirmEndModal(true)}
          style={styles.stopBtn}
        />
      </ScrollView>

      {/* Dialog Modals */}
      {/* 1. Confirm Complete Session Modal */}
      <Modal visible={showConfirmEndModal} onClose={() => setShowConfirmEndModal(false)}>
        <Subheading style={styles.modalTitle}>Has the monitoring session finished?</Subheading>
        <BodyText style={styles.modalText}>
          We will wrap up analysis, compile statistics tables, and generate reports.
        </BodyText>
        <View style={styles.modalButtons}>
          <Button
            title="Cancel"
            variant="outline"
            onPress={() => setShowConfirmEndModal(false)}
            style={styles.modalBtn}
          />
          <Button
            title="Yes, Finish"
            onPress={() => {
              setShowConfirmEndModal(false);
              handleStopSession();
            }}
            style={styles.modalBtn}
          />
        </View>
      </Modal>

      {/* 2. Manual Contraction End Confirmation Prompt */}
      <Modal visible={showContractionPrompt} onClose={() => setShowContractionPrompt(false)}>
        <Subheading style={styles.modalTitle}>Has the contraction stopped completely?</Subheading>
        <View style={styles.modalButtons}>
          <Button
            title="No, Keep Recording"
            variant="outline"
            onPress={() => {
              setShowContractionPrompt(false);
              endManualContraction(false);
            }}
            style={styles.modalBtn}
          />
          <Button
            title="Yes, Confirmed"
            onPress={() => {
              setShowContractionPrompt(false);
              endManualContraction(true);
            }}
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
  alertBanner: {
    backgroundColor: Theme.colors.danger,
    padding: Theme.spacing.md,
    alignItems: 'center',
  },
  alertText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: Theme.typography.sizes.sm,
  },
  statusBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: Theme.spacing.lg,
    paddingVertical: Theme.spacing.sm,
    backgroundColor: Theme.colors.cardBackground,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.divider,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  green: {
    backgroundColor: Theme.colors.success,
  },
  red: {
    backgroundColor: Theme.colors.danger,
  },
  statusText: {
    fontSize: Theme.typography.sizes.xs,
  },
  scrollContent: {
    padding: Theme.spacing.lg,
  },
  timerCard: {
    alignItems: 'center',
    paddingVertical: Theme.spacing.xl,
  },
  timer: {
    fontSize: Theme.typography.sizes.jumbo,
    color: Theme.colors.primaryDark,
    fontWeight: Theme.typography.weights.bold,
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: Theme.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Theme.colors.divider,
    paddingTop: Theme.spacing.lg,
  },
  metricItem: {
    alignItems: 'center',
  },
  metricVal: {
    color: Theme.colors.text,
  },
  metricLabel: {
    marginTop: 2,
  },
  manualRecommendCard: {
    borderColor: Theme.colors.warning,
    borderWidth: 1,
  },
  warnText: {
    color: Theme.colors.warning,
  },
  manualWarnDescription: {
    fontSize: Theme.typography.sizes.sm,
    color: Theme.colors.textSecondary,
    marginVertical: Theme.spacing.sm,
  },
  dismissBtn: {
    alignSelf: 'flex-start',
  },
  chartCard: {
    padding: Theme.spacing.md,
  },
  audioCard: {
    padding: Theme.spacing.lg,
  },
  audioTitle: {
    color: Theme.colors.text,
    marginBottom: Theme.spacing.sm,
  },
  audioControlRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  manualControlsRow: {
    marginVertical: Theme.spacing.md,
  },
  fullWidthBtn: {
    width: '100%',
  },
  stopBtn: {
    marginTop: Theme.spacing.sm,
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
export default LiveMonitoringScreen;
