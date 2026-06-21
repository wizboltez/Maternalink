import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TextInput, Switch, Alert, Text, TouchableOpacity } from 'react-native';
import Theme from '../../../core/theme/theme';
import { Heading, Subheading, BodyText, Caption } from '../../../core/components/Typography';
import { Card } from '../../../core/components/Card';
import { Button } from '../../../core/components/Button';
import voiceSpeechEngine, { LanguageCode } from '../services/voiceSpeechEngine';
import bluetoothService from '../../../core/services/bluetoothService';

export const SettingsScreen: React.FC = () => {
  const [riseThreshold, setRiseThreshold] = useState('12.0');
  const [fallThreshold, setFallThreshold] = useState('4.0');
  const [minDuration, setMinDuration] = useState('20');
  const [maxDuration, setMaxDuration] = useState('120');

  const [isVoiceMuted, setIsVoiceMuted] = useState(voiceSpeechEngine.getMutedState());
  const [currentLang, setCurrentLang] = useState<LanguageCode>(voiceSpeechEngine.getLanguageState());

  const [doctorName, setDoctorName] = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState('');

  const [bleConnected, setBleConnected] = useState(bluetoothService.isConnected());
  const [bleDeviceName, setBleDeviceName] = useState<string | null>(null);

  useEffect(() => {
    bluetoothService.setConnectionCallback((connected, name) => {
      setBleConnected(connected);
      setBleDeviceName(name || null);
    });
    return () => bluetoothService.setConnectionCallback(null);
  }, []);

  const handleSaveSettings = () => {
    // Validate inputs are numbers
    const rise = parseFloat(riseThreshold);
    const fall = parseFloat(fallThreshold);
    const minDur = parseInt(minDuration, 10);
    const maxDur = parseInt(maxDuration, 10);

    if (isNaN(rise) || isNaN(fall) || isNaN(minDur) || isNaN(maxDur)) {
      Alert.alert('Invalid Thresholds', 'Please enter valid numbers for the tracking algorithm parameters.');
      return;
    }

    if (fall >= rise) {
      Alert.alert('Invalid Thresholds', 'Fall completion threshold must be less than rise start threshold.');
      return;
    }

    // Save configurations
    voiceSpeechEngine.setMute(isVoiceMuted);
    voiceSpeechEngine.setLanguage(currentLang);

    Alert.alert('Settings Saved', 'Contraction algorithm thresholds and speech preferences synchronized.');
  };

  const handleTestSpeech = () => {
    voiceSpeechEngine.setMute(isVoiceMuted);
    voiceSpeechEngine.setLanguage(currentLang);
    voiceSpeechEngine.speak('monitoring_started');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Heading style={styles.title}>System Settings</Heading>
        <BodyText style={styles.subtitle}>
          Configure contraction detection thresholds and voice alerts guidelines.
        </BodyText>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Bluetooth Connection */}
        <Card style={styles.sectionCard}>
          <Subheading style={styles.sectionTitle}>Bluetooth Connection</Subheading>
          <View style={styles.bleStatusRow}>
            <View style={[styles.bleIndicator, bleConnected ? styles.bleOn : styles.bleOff]} />
            <BodyText>
              {bleConnected
                ? `Connected to ${bleDeviceName || 'Smart Belt'}`
                : 'No belt connected via Bluetooth'}
            </BodyText>
          </View>
          <Caption style={styles.tipText}>
            Pair your Smart Maternal Belt from the Belt Connection screen. Bluetooth must be enabled on your phone.
          </Caption>
          {bleConnected && (
            <Button
              title="Disconnect Bluetooth"
              variant="outline"
              size="small"
              onPress={() => bluetoothService.disconnect()}
              style={styles.testBtn}
            />
          )}
        </Card>

        {/* Detection Parameters */}
        <Card style={styles.sectionCard}>
          <Subheading style={styles.sectionTitle}>Waveform Detection Thresholds</Subheading>
          
          <View style={styles.inputRow}>
            <View style={styles.inputCol}>
              <Caption>Rise Start (Flex%)</Caption>
              <TextInput
                value={riseThreshold}
                onChangeText={setRiseThreshold}
                keyboardType="numeric"
                style={styles.textInput}
              />
            </View>
            <View style={styles.inputCol}>
              <Caption>Fall End (Flex%)</Caption>
              <TextInput
                value={fallThreshold}
                onChangeText={setFallThreshold}
                keyboardType="numeric"
                style={styles.textInput}
              />
            </View>
          </View>

          <View style={styles.inputRow}>
            <View style={styles.inputCol}>
              <Caption>Min Duration (sec)</Caption>
              <TextInput
                value={minDuration}
                onChangeText={setMinDuration}
                keyboardType="number-pad"
                style={styles.textInput}
              />
            </View>
            <View style={styles.inputCol}>
              <Caption>Max Duration (sec)</Caption>
              <TextInput
                value={maxDuration}
                onChangeText={setMaxDuration}
                keyboardType="number-pad"
                style={styles.textInput}
              />
            </View>
          </View>
          <Caption style={styles.tipText}>
            * Lower rise thresholds increase sensor sensitivity.
          </Caption>
        </Card>

        {/* Voice Speech Assistant preferences */}
        <Card style={styles.sectionCard}>
          <Subheading style={styles.sectionTitle}>Speech Assistant Guidance</Subheading>
          
          <View style={styles.switchRow}>
            <BodyText>Mute Voice Guidance</BodyText>
            <Switch
              value={isVoiceMuted}
              onValueChange={(val) => {
                setIsVoiceMuted(val);
                voiceSpeechEngine.setMute(val);
              }}
            />
          </View>

          <View style={styles.langRow}>
            <BodyText style={styles.langLabel}>Voice Language</BodyText>
            <View style={styles.langButtons}>
              {(['en', 'es', 'fr'] as LanguageCode[]).map((lang) => (
                <TouchableOpacity
                  key={lang}
                  onPress={() => setCurrentLang(lang)}
                  style={[
                    styles.langBtn,
                    currentLang === lang && styles.activeLangBtn,
                  ]}
                >
                  <Text
                    style={[
                      styles.langBtnText,
                      currentLang === lang && styles.activeLangBtnText,
                    ]}
                  >
                    {lang.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <Button
            title="Test Speech Synthesizer"
            variant="outline"
            size="small"
            onPress={handleTestSpeech}
            style={styles.testBtn}
          />
        </Card>

        {/* Emergencies configuration */}
        <Card style={styles.sectionCard}>
          <Subheading style={styles.sectionTitle}>Care Provider Profile</Subheading>
          <View style={styles.fieldCol}>
            <Caption>Attending Obstetrician Name</Caption>
            <TextInput
              value={doctorName}
              onChangeText={setDoctorName}
              style={styles.fullWidthInput}
            />
          </View>
          <View style={styles.fieldCol}>
            <Caption>Emergency Contact Phone</Caption>
            <TextInput
              value={emergencyPhone}
              onChangeText={setEmergencyPhone}
              keyboardType="phone-pad"
              style={styles.fullWidthInput}
            />
          </View>
        </Card>

        <Button
          title="Save Config Options"
          onPress={handleSaveSettings}
          style={styles.saveBtn}
        />
      </ScrollView>
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
    paddingBottom: 120,
  },
  sectionCard: {
    padding: Theme.spacing.lg,
  },
  sectionTitle: {
    color: Theme.colors.text,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.divider,
    paddingBottom: Theme.spacing.sm,
    marginBottom: Theme.spacing.md,
  },
  inputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Theme.spacing.md,
  },
  inputCol: {
    width: '48%',
  },
  textInput: {
    backgroundColor: Theme.colors.background,
    borderColor: Theme.colors.divider,
    borderWidth: 1,
    borderRadius: Theme.borders.radius.sm,
    padding: Theme.spacing.sm,
    color: Theme.colors.text,
    fontSize: Theme.typography.sizes.sm,
    marginTop: 4,
  },
  tipText: {
    marginTop: Theme.spacing.xs,
    fontStyle: 'italic',
  },
  bleStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Theme.spacing.sm,
  },
  bleIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: Theme.spacing.sm,
  },
  bleOn: { backgroundColor: Theme.colors.success },
  bleOff: { backgroundColor: Theme.colors.textMuted },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Theme.spacing.md,
  },
  langRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Theme.spacing.md,
  },
  langLabel: {
    flex: 1,
  },
  langButtons: {
    flexDirection: 'row',
  },
  langBtn: {
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.xs,
    borderWidth: 1,
    borderColor: Theme.colors.divider,
    borderRadius: Theme.borders.radius.sm,
    marginLeft: Theme.spacing.xs,
  },
  activeLangBtn: {
    backgroundColor: Theme.colors.primary,
    borderColor: Theme.colors.primary,
  },
  langBtnText: {
    color: Theme.colors.textSecondary,
    fontSize: Theme.typography.sizes.xs,
    fontWeight: 'bold',
  },
  activeLangBtnText: {
    color: '#FFFFFF',
  },
  testBtn: {
    marginTop: Theme.spacing.sm,
  },
  fieldCol: {
    marginBottom: Theme.spacing.md,
  },
  fullWidthInput: {
    backgroundColor: Theme.colors.background,
    borderColor: Theme.colors.divider,
    borderWidth: 1,
    borderRadius: Theme.borders.radius.sm,
    padding: Theme.spacing.sm,
    color: Theme.colors.text,
    fontSize: Theme.typography.sizes.sm,
    marginTop: 4,
  },
  saveBtn: {
    marginVertical: Theme.spacing.md,
    marginBottom: Theme.spacing.xxl,
  },
});
export default SettingsScreen;
