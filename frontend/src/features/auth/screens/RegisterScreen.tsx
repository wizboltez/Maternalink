import React, { useState } from 'react';
import { View, StyleSheet, TextInput, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import Theme from '../../../core/theme/theme';
import { Heading, BodyText, Caption } from '../../../core/components/Typography';
import { Button } from '../../../core/components/Button';
import { Card } from '../../../core/components/Card';
import { useAuth } from '../../../core/context/AuthContext';

export const RegisterScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [gestationalWeeks, setGestationalWeeks] = useState('28');
  const [dueDate, setDueDate] = useState('');
  const [doctorName, setDoctorName] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    const weeks = parseInt(gestationalWeeks, 10);
    if (!name.trim() || !email.trim() || password.length < 6 || isNaN(weeks)) {
      Alert.alert('Invalid Form', 'Please fill in all required fields. Password must be at least 6 characters.');
      return;
    }
    if (!dueDate) {
      Alert.alert('Due Date Required', 'Please enter your expected due date (YYYY-MM-DD).');
      return;
    }

    setLoading(true);
    try {
      await register({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        gestationalAgeWeeks: weeks,
        dueDate,
        doctorName: doctorName.trim() || 'Not specified',
        emergencyContact: emergencyContact.trim() || 'Not specified',
      });
    } catch (err: any) {
      Alert.alert('Registration Failed', err.response?.data?.error || 'Unable to create account.');
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
        <Heading style={styles.title}>Create Account</Heading>
        <BodyText style={styles.subtitle}>Set up your maternal health profile to get started.</BodyText>

        <Card style={styles.formCard}>
          <Caption style={styles.label}>Full Name *</Caption>
          <TextInput value={name} onChangeText={setName} style={styles.input} placeholder="Your name" placeholderTextColor={Theme.colors.textMuted} />

          <Caption style={styles.label}>Email *</Caption>
          <TextInput value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" style={styles.input} />

          <Caption style={styles.label}>Password *</Caption>
          <TextInput value={password} onChangeText={setPassword} secureTextEntry style={styles.input} />

          <Caption style={styles.label}>Gestational Age (weeks) *</Caption>
          <TextInput value={gestationalWeeks} onChangeText={setGestationalWeeks} keyboardType="number-pad" style={styles.input} />

          <Caption style={styles.label}>Due Date (YYYY-MM-DD) *</Caption>
          <TextInput value={dueDate} onChangeText={setDueDate} placeholder="2026-09-15" placeholderTextColor={Theme.colors.textMuted} style={styles.input} />

          <Caption style={styles.label}>Attending Doctor</Caption>
          <TextInput value={doctorName} onChangeText={setDoctorName} style={styles.input} />

          <Caption style={styles.label}>Emergency Contact</Caption>
          <TextInput value={emergencyContact} onChangeText={setEmergencyContact} keyboardType="phone-pad" style={styles.input} />

          <Button title="Create Account" onPress={handleRegister} loading={loading} style={styles.submitBtn} />
        </Card>

        <Button title="Back to Sign In" variant="outline" onPress={() => navigation.goBack()} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.colors.background },
  scroll: { padding: Theme.spacing.xl, paddingBottom: 60 },
  title: { color: Theme.colors.primaryDark, marginBottom: Theme.spacing.sm },
  subtitle: { color: Theme.colors.textSecondary, marginBottom: Theme.spacing.xl },
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
});

export default RegisterScreen;
