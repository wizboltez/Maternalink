import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TextInput, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Text } from 'react-native-paper';
import Theme from '../../../core/theme/theme';
import { Heading, BodyText, Caption } from '../../../core/components/Typography';
import { Button } from '../../../core/components/Button';
import { Card } from '../../../core/components/Card';
import { useAuth } from '../../../core/context/AuthContext';
import guidanceApi from '../../guidance/api/guidanceApi';

export const PregnancyProfileScreen: React.FC<{ navigation: any; route?: any }> = ({ navigation, route }) => {
  const { profile, setProfile, refreshProfile } = useAuth();
  const isEditMode = route?.params?.isEdit || false;

  const [pregnancyWeek, setPregnancyWeek] = useState('');
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState('');
  const [weight, setWeight] = useState('');
  const [bloodGroup, setBloodGroup] = useState('');
  const [loading, setLoading] = useState(false);

  // Prepopulate if editing or if profile already exists in context
  useEffect(() => {
    if (profile) {
      setPregnancyWeek(String(profile.pregnancyWeek));
      setWeight(String(profile.weight));
      setBloodGroup(profile.bloodGroup || '');
      if (profile.expectedDeliveryDate) {
        const dateObj = new Date(profile.expectedDeliveryDate);
        const yyyy = dateObj.getFullYear();
        const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
        const dd = String(dateObj.getDate()).padStart(2, '0');
        setExpectedDeliveryDate(`${yyyy}-${mm}-${dd}`);
      }
    }
  }, [profile]);

  const handleSave = async () => {
    const weekNum = parseInt(pregnancyWeek, 10);
    const weightNum = parseFloat(weight);
    
    if (isNaN(weekNum) || weekNum < 1 || weekNum > 42) {
      Alert.alert('Invalid Week', 'Pregnancy week must be a number between 1 and 42.');
      return;
    }

    if (isNaN(Date.parse(expectedDeliveryDate))) {
      Alert.alert('Invalid Date', 'Please enter a valid expected delivery date (YYYY-MM-DD).');
      return;
    }

    if (isNaN(weightNum) || weightNum <= 0) {
      Alert.alert('Invalid Weight', 'Please enter a valid positive weight in kilograms.');
      return;
    }

    if (!bloodGroup.trim()) {
      Alert.alert('Blood Group Required', 'Please enter your blood group (e.g. O+, A-).');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        pregnancyWeek: weekNum,
        expectedDeliveryDate: new Date(expectedDeliveryDate).toISOString(),
        weight: weightNum,
        bloodGroup: bloodGroup.trim().toUpperCase(),
      };

      if (isEditMode && profile?.id) {
        const updatedProfile = await guidanceApi.updateProfile(profile.id, payload);
        setProfile(updatedProfile);
        Alert.alert('Success', 'Pregnancy profile updated successfully.', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      } else {
        const newProfile = await guidanceApi.createProfile(payload);
        setProfile(newProfile);
        // Refresh context details
        await refreshProfile();
        // The AppNavigator will automatically route to main tabs since profile is now set
      }
    } catch (err: any) {
      console.error(err);
      Alert.alert('Error Saving Profile', err.response?.data?.error || 'An error occurred while saving your profile.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scroll}>
        <Heading style={styles.title}>{isEditMode ? 'Edit Profile' : 'Pregnancy Setup'}</Heading>
        <BodyText style={styles.subtitle}>
          {isEditMode
            ? 'Update your pregnancy measurements to keep your guidance tips current.'
            : 'Enter your pregnancy details to receive personalized nutrition, medical, and wellness guidance.'}
        </BodyText>

        <Card style={styles.formCard}>
          <Caption style={styles.label}>Pregnancy Week (1 - 42) *</Caption>
          <TextInput
            value={pregnancyWeek}
            onChangeText={setPregnancyWeek}
            keyboardType="number-pad"
            style={styles.input}
            placeholder="e.g. 22"
            placeholderTextColor={Theme.colors.textMuted}
          />

          <Caption style={styles.label}>Expected Delivery Date (YYYY-MM-DD) *</Caption>
          <TextInput
            value={expectedDeliveryDate}
            onChangeText={setExpectedDeliveryDate}
            style={styles.input}
            placeholder="e.g. 2026-10-15"
            placeholderTextColor={Theme.colors.textMuted}
          />

          <Caption style={styles.label}>Weight (kg) *</Caption>
          <TextInput
            value={weight}
            onChangeText={setWeight}
            keyboardType="numeric"
            style={styles.input}
            placeholder="e.g. 68.5"
            placeholderTextColor={Theme.colors.textMuted}
          />

          <Caption style={styles.label}>Blood Group *</Caption>
          <TextInput
            value={bloodGroup}
            onChangeText={setBloodGroup}
            style={styles.input}
            placeholder="e.g. AB+ or O-"
            placeholderTextColor={Theme.colors.textMuted}
            autoCapitalize="characters"
          />

          <Button
            title={isEditMode ? 'Update Profile' : 'Save & Continue'}
            onPress={handleSave}
            loading={loading}
            style={styles.submitBtn}
          />
        </Card>

        {isEditMode && (
          <Button
            title="Cancel"
            variant="outline"
            onPress={() => navigation.goBack()}
            style={styles.cancelBtn}
          />
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.colors.background },
  scroll: { padding: Theme.spacing.xl, paddingTop: Theme.spacing.xxl, paddingBottom: 60 },
  title: { color: Theme.colors.primaryDark, marginBottom: Theme.spacing.sm },
  subtitle: { color: Theme.colors.textSecondary, marginBottom: Theme.spacing.xl, lineHeight: 22 },
  formCard: { padding: Theme.spacing.lg, marginBottom: Theme.spacing.lg },
  label: { marginBottom: 4, marginTop: Theme.spacing.sm },
  input: {
    backgroundColor: Theme.colors.background,
    borderWidth: 1,
    borderColor: Theme.colors.divider,
    borderRadius: Theme.borders.radius.sm,
    padding: Theme.spacing.sm,
    color: Theme.colors.text,
    fontSize: Theme.typography.sizes.base,
  },
  submitBtn: { marginTop: Theme.spacing.lg },
  cancelBtn: { marginTop: Theme.spacing.sm },
});

export default PregnancyProfileScreen;
