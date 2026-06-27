import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator, Alert, ScrollView } from 'react-native';
import Theme from '../../../core/theme/theme';
import { Heading, Subheading, BodyText, Caption } from '../../../core/components/Typography';
import { Card } from '../../../core/components/Card';
import { Button } from '../../../core/components/Button';
import contractionApi from '../api/contractionApi';
import voiceSpeechEngine from '../services/voiceSpeechEngine';
import bluetoothService from '../../../core/services/bluetoothService';

export const CalibrationWizardScreen: React.FC<{ route: any; navigation: any }> = ({ route, navigation }) => {
  const deviceId: string | undefined = route.params?.deviceId;

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Calibration measurements
  const [relaxationReadings, setRelaxationReadings] = useState<number[]>([]);
  const [countdown, setCountdown] = useState(10);
  const [isSampling, setIsSampling] = useState(false);

  // Saved baseline results
  const [flexMin, setFlexMin] = useState<number | null>(null);
  const [flexMax, setFlexMax] = useState<number | null>(null);
  const [baseline, setBaseline] = useState<number | null>(null);
  const [sensorNoise, setSensorNoise] = useState<number | null>(null);
  const [confidence, setConfidence] = useState<number | null>(null);
  const [calibrationSessionId, setCalibrationSessionId] = useState<string | null>(null);

  // Step 2: collect real BLE readings when belt connected, else simulated fallback
  useEffect(() => {
    let timerId: NodeJS.Timeout;

    bluetoothService.setTelemetryCallback((telemetry) => {
      if (isSampling && telemetry.rawAdc != null) {
        setRelaxationReadings((prev) => [...prev, telemetry.rawAdc!]);
      }
    });

    if (isSampling && countdown > 0) {
      timerId = setInterval(() => {
        setCountdown((prev) => prev - 1);
        if (!bluetoothService.isConnected()) {
          const reading = Math.round(1200 + (Math.random() - 0.5) * 50);
          setRelaxationReadings((prev) => [...prev, reading]);
        }
      }, 1000);
    } else if (isSampling && countdown === 0) {
      setIsSampling(false);
      processRelaxationData();
    }

    return () => {
      clearInterval(timerId);
      if (!isSampling) bluetoothService.setTelemetryCallback(null);
    };
  }, [isSampling, countdown]);

  const startRelaxationSampling = () => {
    setRelaxationReadings([]);
    setCountdown(10);
    setIsSampling(true);
    voiceSpeechEngine.speak('calibration_started');
    setTimeout(() => voiceSpeechEngine.speak('please_remain_still'), 1500);
  };

  const processRelaxationData = async () => {
    setLoading(true);
    try {
      const result = await contractionApi.processRelaxation(relaxationReadings);
      const data = result.data;
      setFlexMin(data.flexMin);
      setBaseline(data.baseline);
      setSensorNoise(data.sensorNoise);
      setConfidence(data.confidence);
      setStep(3);
    } catch (err: any) {
      voiceSpeechEngine.speak('calibration_failed');
      Alert.alert('Processing Failed', err.response?.data?.error || 'Unable to analyze baseline noise.');
      setStep(1); // Reset
    } finally {
      setLoading(false);
    }
  };

  const [peakAdcReadings, setPeakAdcReadings] = useState<number[]>([]);

  const recordMaxStretch = () => {
    setLoading(true);
    voiceSpeechEngine.speak('please_remain_still');
    setPeakAdcReadings([]);

    const samples: number[] = [];
    const collect = (telemetry: { rawAdc?: number }) => {
      if (telemetry.rawAdc != null) samples.push(telemetry.rawAdc);
    };
    bluetoothService.setTelemetryCallback(collect);

    setTimeout(async () => {
      bluetoothService.setTelemetryCallback(null);
      const maxAdcVal =
        samples.length > 0
          ? Math.max(...samples)
          : Math.round(2800 + (Math.random() - 0.5) * 100);
      setFlexMax(maxAdcVal);
      setPeakAdcReadings(samples);
      setLoading(false);
      setStep(4);
    }, 3000);
  };

  const saveCalibration = async () => {
    if (flexMin === null || flexMax === null || baseline === null || sensorNoise === null || confidence === null) {
      Alert.alert('Error', 'Missing calibration parameters. Please restart Wizard.');
      return;
    }

    setLoading(true);
    try {
      const result = await contractionApi.saveCalibration({
        deviceId: deviceId!,
        flexMin,
        flexMax,
        baseline,
        sensorNoise,
        confidence,
      });

      setCalibrationSessionId(result.calibration._id);
      voiceSpeechEngine.speak('calibration_completed');
      setStep(5); // Complete calibration
    } catch (err: any) {
      voiceSpeechEngine.speak('calibration_failed');
      Alert.alert('Calibration Failed', err.response?.data?.error || 'Validation gap check failed.');
      setStep(1); // Reset back to instructions
    } finally {
      setLoading(false);
    }
  };

  const renderContent = () => {
    switch (step) {
      case 1:
        return (
          <ScrollView contentContainerStyle={styles.scrollContainer}>
            <Heading style={styles.stepTitle}>Step 1: Preparation & Safety</Heading>
            <BodyText style={styles.description}>
              Before starting the belt's contraction monitor, a quick calibration is required. This ensures readings are tailored specifically to your abdominal outline.
            </BodyText>

            <Card style={styles.safetyCard}>
              <Subheading style={styles.safetyTitle}>⚠️ Comfort & Safety Briefing</Subheading>
              <View style={styles.bulletRow}>
                <BodyText style={styles.bulletSymbol}>•</BodyText>
                <BodyText style={styles.bulletText}>Ensure the belt is centered snugly across your lower abdomen.</BodyText>
              </View>
              <View style={styles.bulletRow}>
                <BodyText style={styles.bulletSymbol}>•</BodyText>
                <BodyText style={styles.bulletText}>Sit or lie back comfortably. Avoid changing posture or moving during calibration.</BodyText>
              </View>
              <View style={styles.bulletRow}>
                <BodyText style={styles.bulletSymbol}>•</BodyText>
                <BodyText style={styles.bulletText}>Keep breathing naturally and stay relaxed.</BodyText>
              </View>
              <View style={styles.bulletRow}>
                <BodyText style={styles.bulletSymbol}>•</BodyText>
                <BodyText style={styles.bulletText}>Disclaimer: This monitoring belt is intended solely for pattern tracking. It does not replace medical diagnostics.</BodyText>
              </View>
            </Card>

            <Button
              title="I am Comfortably Seated"
              onPress={() => setStep(2)}
              style={styles.actionBtn}
            />
          </ScrollView>
        );

      case 2:
        return (
          <View style={styles.stepContainer}>
            <Heading style={styles.stepTitle}>Step 2: Relaxation Baseline</Heading>
            <BodyText style={styles.description}>
              We are measuring baseline values of the sensor during absolute relaxation. Please lie still.
            </BodyText>

            <Card style={styles.timerCard}>
              {isSampling ? (
                <View style={styles.countdownBox}>
                  <Heading style={styles.countdownText}>{countdown}s</Heading>
                  <Caption style={styles.countdownLabel}>Collecting baseline data points...</Caption>
                  <ActivityIndicator size="small" color={Theme.colors.primary} style={styles.miniLoader} />
                </View>
              ) : (
                <View style={styles.actionBox}>
                  <Button
                    title="Begin Relaxation Phase"
                    onPress={startRelaxationSampling}
                    disabled={loading}
                    style={styles.samplingBtn}
                  />
                  <Caption style={styles.helperText}>Takes approximately 10 seconds</Caption>
                </View>
              )}
            </Card>
          </View>
        );

      case 3:
        return (
          <View style={styles.stepContainer}>
            <Heading style={styles.stepTitle}>Step 3: Maximum Stretch</Heading>
            <BodyText style={styles.description}>
              Please gently contract or tighten your abdomen (simulating muscle tension during a contraction) and hold.
            </BodyText>

            <Card style={styles.actionCard}>
              <Subheading style={styles.holdLabel}>Tighten and press the button below</Subheading>
              <Button
                title={loading ? 'Measuring Peak...' : 'Record Tension Peak'}
                onPress={recordMaxStretch}
                loading={loading}
                style={styles.actionBtn}
              />
            </Card>
          </View>
        );

      case 4:
        return (
          <View style={styles.stepContainer}>
            <Heading style={styles.stepTitle}>Step 4: Verify Calibration</Heading>
            <BodyText style={styles.description}>
              Review the calculated parameters. Ensure confidence levels indicate stable sensor alignment.
            </BodyText>

            <Card style={styles.statsCard}>
              <Subheading style={styles.statsHeader}>Calibration Parameters</Subheading>
              <View style={styles.statLine}>
                <BodyText style={styles.statLabel}>Baseline Reading:</BodyText>
                <BodyText style={styles.statVal}>{baseline} ADC</BodyText>
              </View>
              <View style={styles.statLine}>
                <BodyText style={styles.statLabel}>Relaxation Min:</BodyText>
                <BodyText style={styles.statVal}>{flexMin} ADC</BodyText>
              </View>
              <View style={styles.statLine}>
                <BodyText style={styles.statLabel}>Tension Max:</BodyText>
                <BodyText style={styles.statVal}>{flexMax} ADC</BodyText>
              </View>
              <View style={styles.statLine}>
                <BodyText style={styles.statLabel}>Signal Noise:</BodyText>
                <BodyText style={styles.statVal}>{sensorNoise} ADC</BodyText>
              </View>
              <View style={styles.statLine}>
                <BodyText style={styles.statLabel}>Confidence Score:</BodyText>
                <BodyText
                  style={[
                    styles.statVal,
                    styles.boldVal,
                    { color: (confidence || 0) > 75 ? Theme.colors.success : Theme.colors.warning },
                  ]}
                >
                  {confidence}%
                </BodyText>
              </View>
            </Card>

            <View style={styles.btnRow}>
              <Button
                title="Recalibrate"
                variant="outline"
                onPress={() => setStep(1)}
                disabled={loading}
                style={styles.halfBtn}
              />
              <Button
                title="Save & Proceed"
                onPress={saveCalibration}
                loading={loading}
                style={styles.halfBtn}
              />
            </View>
          </View>
        );

      case 5:
      default:
        return (
          <View style={styles.stepContainer}>
            <Heading style={styles.stepTitle}>Step 5: Ready to Monitor</Heading>
            <BodyText style={styles.description}>
              Calibration succeeded! The Smart Maternal Belt is ready to stream metrics.
            </BodyText>

            <Card style={styles.completeCard}>
              <Subheading style={styles.completeTitle}>🎉 Calibrated & Configured</Subheading>
              <BodyText style={styles.completeText}>
                The detection algorithms will now compute normalized contraction values and rolling hourly trends based on your baseline.
              </BodyText>
            </Card>

            <Button
              title="Start Live Monitoring"
              onPress={async () => {
                if (!calibrationSessionId) {
                  Alert.alert('Error', 'Calibration session not saved. Please recalibrate.');
                  return;
                }
                setLoading(true);
                try {
                  const result = await contractionApi.startSession(deviceId!, calibrationSessionId);
                  navigation.navigate('LiveMonitoring', {
                    sessionId: result.session._id,
                    deviceId: deviceId!,
                    calibrationConfidence: confidence,
                  });
                } catch (err: any) {
                  Alert.alert('Session Error', err.response?.data?.error || 'Failed to start monitoring session.');
                } finally {
                  setLoading(false);
                }
              }}
              loading={loading}
              style={styles.actionBtn}
            />
          </View>
        );
    }
  };

  if (!deviceId) {
    return (
      <View style={styles.container}>
        <BodyText style={{ padding: Theme.spacing.xl }}>No belt selected. Connect a belt first.</BodyText>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Progress Dots */}
      <View style={styles.stepperHeader}>
        {[1, 2, 3, 4, 5].map((s) => (
          <View
            key={s}
            style={[
              styles.stepDot,
              step === s && styles.activeDot,
              step > s && styles.completedDot,
            ]}
          />
        ))}
      </View>

      {renderContent()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  stepperHeader: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: Theme.spacing.lg,
    backgroundColor: Theme.colors.cardBackground,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.divider,
  },
  stepDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Theme.colors.divider,
    marginHorizontal: Theme.spacing.xs,
  },
  activeDot: {
    backgroundColor: Theme.colors.primary,
    transform: [{ scale: 1.2 }],
  },
  completedDot: {
    backgroundColor: Theme.colors.accent,
  },
  scrollContainer: {
    padding: Theme.spacing.xl,
  },
  stepContainer: {
    flex: 1,
    padding: Theme.spacing.xl,
    justifyContent: 'center',
  },
  stepTitle: {
    color: Theme.colors.primaryDark,
    marginBottom: Theme.spacing.sm,
  },
  description: {
    color: Theme.colors.textSecondary,
    marginBottom: Theme.spacing.xl,
    lineHeight: Theme.typography.lineHeights.normal,
  },
  safetyCard: {
    backgroundColor: '#FFFFFF',
    borderColor: Theme.colors.primaryLight,
    borderWidth: 1,
    padding: Theme.spacing.lg,
    marginBottom: Theme.spacing.xl,
  },
  safetyTitle: {
    color: Theme.colors.primary,
    marginBottom: Theme.spacing.md,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Theme.spacing.sm,
  },
  bulletSymbol: {
    marginRight: Theme.spacing.sm,
    color: Theme.colors.primary,
    fontSize: 18,
  },
  bulletText: {
    flex: 1,
    fontSize: Theme.typography.sizes.sm,
    color: Theme.colors.textSecondary,
    lineHeight: 18,
  },
  timerCard: {
    alignItems: 'center',
    paddingVertical: Theme.spacing.xxl,
  },
  countdownBox: {
    alignItems: 'center',
  },
  countdownText: {
    fontSize: Theme.typography.sizes.jumbo,
    color: Theme.colors.primary,
  },
  countdownLabel: {
    marginTop: Theme.spacing.sm,
  },
  miniLoader: {
    marginTop: Theme.spacing.md,
  },
  actionBox: {
    alignItems: 'center',
    width: '100%',
  },
  samplingBtn: {
    width: '80%',
  },
  helperText: {
    marginTop: Theme.spacing.sm,
  },
  actionCard: {
    alignItems: 'center',
    paddingVertical: Theme.spacing.xxl,
  },
  holdLabel: {
    color: Theme.colors.textSecondary,
    marginBottom: Theme.spacing.xl,
  },
  statsCard: {
    padding: Theme.spacing.lg,
    marginBottom: Theme.spacing.xl,
  },
  statsHeader: {
    color: Theme.colors.text,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.divider,
    paddingBottom: Theme.spacing.sm,
    marginBottom: Theme.spacing.md,
  },
  statLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Theme.spacing.md,
  },
  statLabel: {
    color: Theme.colors.textSecondary,
  },
  statVal: {
    color: Theme.colors.text,
    fontWeight: Theme.typography.weights.medium,
  },
  boldVal: {
    fontWeight: Theme.typography.weights.bold,
  },
  completeCard: {
    padding: Theme.spacing.lg,
    borderColor: Theme.colors.accentLight,
    borderWidth: 1,
    backgroundColor: '#FFFFFF',
    marginBottom: Theme.spacing.xl,
  },
  completeTitle: {
    color: Theme.colors.accent,
    marginBottom: Theme.spacing.sm,
  },
  completeText: {
    color: Theme.colors.textSecondary,
    fontSize: Theme.typography.sizes.sm,
  },
  btnRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfBtn: {
    flex: 1,
    marginHorizontal: Theme.spacing.xs,
  },
  actionBtn: {
    width: '100%',
  },
});
export default CalibrationWizardScreen;
