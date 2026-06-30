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
import { printSessionPdf } from '../../../core/services/pdfExportService';
import {
  formatSessionTimer,
  formatInterval,
  formatConfidenceLabel,
} from '../../../core/utils/timeFormat';

export const LiveMonitoringScreen: React.FC<{ route: any; navigation: any }> = ({ route, navigation }) => {
  const sessionId = route.params?.sessionId ?? null;
  const deviceId = route.params?.deviceId ?? null;
  const confidence = route.params?.calibrationConfidence ?? 95;

  const monitoring = useContractionMonitoring(sessionId, deviceId, confidence);

  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const [showConfirmEndModal, setShowConfirmEndModal] = useState(false);
  const [showContractionPrompt, setShowContractionPrompt] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);

  const {
    isConnected,
    isBleConnected,
    batteryLevel,
    sessionStartedAt,
    currentReading,
    isContractionCalculating,
    flexBuffer,
    intensityBuffer,
    timeLabels,
    contractions,
    activeAlert,
    isMuted,
    toggleMute,
    isManualRecordingActive,
    startManualContraction,
    endManualContraction,
  } = monitoring;

  useEffect(() => {
    if (!sessionStartedAt) return;
    const tick = () => {
      setSecondsElapsed(Math.floor((Date.now() - sessionStartedAt.getTime()) / 1000));
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [sessionStartedAt]);

  if (!sessionId || !deviceId) {
    return (
      <View style={styles.container}>
        <BodyText style={styles.errorText}>Invalid session. Please start monitoring again.</BodyText>
      </View>
    );
  }

  const handleStopSession = async () => {
    try {
      const result = await contractionApi.stopSession(sessionId);
      if (result.discarded) {
        Alert.alert(
          'Session Not Saved',
          'Sessions shorter than 1 minute are not stored.',
          [{ text: 'OK', onPress: () => navigation.navigate('MonitoringHome') }]
        );
        return;
      }
      navigation.navigate('SessionSummary', { sessionId });
    } catch {
      Alert.alert('Session Error', 'Failed to complete the monitoring session.');
    }
  };

  const handleExportPdf = async () => {
    setExportingPdf(true);
    try {
      await printSessionPdf(sessionId);
    } finally {
      setExportingPdf(false);
    }
  };

  return (
    <View style={styles.container}>
      {activeAlert && (
        <View style={styles.alertBanner}>
          <Text style={styles.alertText}>⚠️ {activeAlert.message}</Text>
        </View>
      )}

      <View style={styles.statusBar}>
        <View style={styles.row}>
          <View style={[styles.indicator, isBleConnected ? styles.green : styles.red]} />
          <Caption style={styles.statusText}>
            Belt: {isBleConnected ? 'Connected' : 'Not connected'}
          </Caption>
        </View>
        <View style={styles.row}>
          <View style={[styles.indicator, isConnected ? styles.green : styles.red]} />
          <Caption style={styles.statusText}>
            Server: {isConnected ? 'Live' : 'Offline'}
          </Caption>
        </View>
        <Caption style={styles.statusText}>
          Cal: {confidence}% ({formatConfidenceLabel(confidence)})
        </Caption>
        {batteryLevel !== null && <Caption style={styles.statusText}>🔋 {batteryLevel}%</Caption>}
      </View>

      {isContractionCalculating && (
        <View style={styles.calculatingBanner}>
          <Caption style={styles.calculatingText}>Analyzing contraction waveform...</Caption>
        </View>
      )}

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Card style={styles.timerCard}>
          <Heading style={styles.timer}>{formatSessionTimer(secondsElapsed)}</Heading>
          <Caption>SESSION ELAPSED</Caption>

          <View style={styles.metricsRow}>
            <View style={styles.metricItem}>
              <Subheading style={styles.metricVal}>
                {currentReading ? Math.round(currentReading.flexPercent) : 0}%
              </Subheading>
              <Caption style={styles.metricLabel}>Current Flex</Caption>
            </View>
            <View style={styles.metricItem}>
              <Subheading style={styles.metricVal}>{contractions.length}</Subheading>
              <Caption style={styles.metricLabel}>Detected</Caption>
            </View>
            <View style={styles.metricItem}>
              <Subheading style={styles.metricVal}>
                {formatInterval(contractions[0]?.interval)}
              </Subheading>
              <Caption style={styles.metricLabel}>Last Interval</Caption>
            </View>
          </View>
        </Card>

        <Card style={styles.chartCard}>
          <CustomLineChart
            data={flexBuffer}
            labels={timeLabels}
            title="Real-Time Flex %"
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
            title="Contraction Intensity"
            color={Theme.colors.accent}
            unit="%"
            minVal={0}
            maxVal={100}
          />
        </Card>

        <Card style={styles.audioCard}>
          <Subheading style={styles.audioTitle}>Voice Guidance</Subheading>
          <View style={styles.audioControlRow}>
            <BodyText>Mute voice cues</BodyText>
            <Switch value={isMuted} onValueChange={toggleMute} />
          </View>
        </Card>

        {!isContractionCalculating && (
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
                title="Stop Manual Recording"
                variant="danger"
                onPress={() => setShowContractionPrompt(true)}
                style={styles.fullWidthBtn}
              />
            )}
          </View>
        )}

        <Button
          title={exportingPdf ? 'Preparing PDF...' : 'Print / Export PDF (This Session)'}
          variant="outline"
          onPress={handleExportPdf}
          loading={exportingPdf}
          style={styles.exportBtn}
        />

        <Button
          title="Complete Session"
          variant="primary"
          onPress={() => setShowConfirmEndModal(true)}
          style={styles.stopBtn}
        />
      </ScrollView>

      <Modal visible={showConfirmEndModal} onClose={() => setShowConfirmEndModal(false)}>
        <Subheading style={styles.modalTitle}>End monitoring session?</Subheading>
        <BodyText style={styles.modalText}>
          Sessions under 1 minute will not be saved. Longer sessions are stored for history and reports.
        </BodyText>
        <View style={styles.modalButtons}>
          <Button title="Cancel" variant="outline" onPress={() => setShowConfirmEndModal(false)} style={styles.modalBtn} />
          <Button
            title="Finish"
            onPress={() => {
              setShowConfirmEndModal(false);
              handleStopSession();
            }}
            style={styles.modalBtn}
          />
        </View>
      </Modal>

      <Modal visible={showContractionPrompt} onClose={() => setShowContractionPrompt(false)}>
        <Subheading style={styles.modalTitle}>Save this manual contraction?</Subheading>
        <View style={styles.modalButtons}>
          <Button
            title="Keep Recording"
            variant="outline"
            onPress={() => setShowContractionPrompt(false)}
            style={styles.modalBtn}
          />
          <Button
            title="Save & Stop"
            onPress={() => {
              setShowContractionPrompt(false);
              endManualContraction(true);
            }}
            style={styles.modalBtn}
          />
          <Button
            title="Discard"
            variant="outline"
            onPress={() => {
              setShowContractionPrompt(false);
              endManualContraction(false);
            }}
            style={styles.modalBtn}
          />
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.colors.background },
  errorText: { padding: Theme.spacing.xl, color: Theme.colors.danger },
  alertBanner: { backgroundColor: Theme.colors.danger, padding: Theme.spacing.md, alignItems: 'center' },
  alertText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: Theme.typography.sizes.sm },
  calculatingBanner: { backgroundColor: Theme.colors.warning + '22', padding: Theme.spacing.sm, alignItems: 'center' },
  calculatingText: { color: Theme.colors.warning, fontWeight: '600' },
  statusBar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: Theme.spacing.lg,
    paddingVertical: Theme.spacing.sm,
    backgroundColor: Theme.colors.cardBackground,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.divider,
    gap: Theme.spacing.xs,
  },
  row: { flexDirection: 'row', alignItems: 'center' },
  indicator: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  green: { backgroundColor: Theme.colors.success },
  red: { backgroundColor: Theme.colors.danger },
  statusText: { fontSize: Theme.typography.sizes.xs },
  scrollContent: { padding: Theme.spacing.lg },
  timerCard: { alignItems: 'center', paddingVertical: Theme.spacing.xl },
  timer: { fontSize: Theme.typography.sizes.jumbo, color: Theme.colors.primaryDark, fontWeight: Theme.typography.weights.bold },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: Theme.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Theme.colors.divider,
    paddingTop: Theme.spacing.lg,
  },
  metricItem: { alignItems: 'center', flex: 1 },
  metricVal: { color: Theme.colors.text, textAlign: 'center' },
  metricLabel: { marginTop: 2, textAlign: 'center' },
  chartCard: { padding: Theme.spacing.md },
  audioCard: { padding: Theme.spacing.lg },
  audioTitle: { color: Theme.colors.text, marginBottom: Theme.spacing.sm },
  audioControlRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  manualControlsRow: { marginVertical: Theme.spacing.md },
  fullWidthBtn: { width: '100%' },
  exportBtn: { marginBottom: Theme.spacing.sm },
  stopBtn: { marginBottom: Theme.spacing.xxl },
  modalTitle: { color: Theme.colors.text, marginBottom: Theme.spacing.md, textAlign: 'center' },
  modalText: { textAlign: 'center', color: Theme.colors.textSecondary, marginBottom: Theme.spacing.xl },
  modalButtons: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  modalBtn: { flex: 1, marginHorizontal: Theme.spacing.xs, marginBottom: Theme.spacing.xs, minWidth: '30%' },
});

export default LiveMonitoringScreen;
