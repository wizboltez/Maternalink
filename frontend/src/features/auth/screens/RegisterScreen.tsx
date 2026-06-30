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
  const [age, setAge] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    const ageNum = parseInt(age, 10);
    if (!name.trim() || !email.trim() || password.length < 6 || isNaN(ageNum)) {
      Alert.alert('Invalid Form', 'Please fill in all required fields. Age must be a number, and password must be at least 6 characters.');
      return;
    }

    if (ageNum < 15 || ageNum > 60) {
      Alert.alert('Invalid Age', 'Age must be between 15 and 60 years.');
      return;
    }

    setLoading(true);
    try {
      await register({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        age: ageNum,
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
        <BodyText style={styles.subtitle}>Sign up to access maternal care and personalized guidance.</BodyText>

        <Card style={styles.formCard}>
          <Caption style={styles.label}>Full Name *</Caption>
          <TextInput
            value={name}
            onChangeText={setName}
            style={styles.input}
            placeholder="e.g. Jane Doe"
            placeholderTextColor={Theme.colors.textMuted}
          />

          <Caption style={styles.label}>Email *</Caption>
          <TextInput
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            style={styles.input}
            placeholder="jane@example.com"
            placeholderTextColor={Theme.colors.textMuted}
          />

          <Caption style={styles.label}>Password (min 6 characters) *</Caption>
          <TextInput
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            style={styles.input}
            placeholder="••••••••"
            placeholderTextColor={Theme.colors.textMuted}
          />

          <Caption style={styles.label}>Age *</Caption>
          <TextInput
            value={age}
            onChangeText={setAge}
            keyboardType="number-pad"
            style={styles.input}
            placeholder="e.g. 28"
            placeholderTextColor={Theme.colors.textMuted}
          />

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
