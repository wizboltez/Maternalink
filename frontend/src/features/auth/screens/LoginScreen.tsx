import React, { useState } from 'react';
import { View, StyleSheet, TextInput, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import Theme from '../../../core/theme/theme';
import { Heading, BodyText, Caption } from '../../../core/components/Typography';
import { Button } from '../../../core/components/Button';
import { Card } from '../../../core/components/Card';
import { useAuth } from '../../../core/context/AuthContext';

export const LoginScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      Alert.alert('Missing Fields', 'Please enter your email and password.');
      return;
    }
    setLoading(true);
    try {
      await login(email.trim().toLowerCase(), password);
    } catch (err: any) {
      Alert.alert('Login Failed', err.response?.data?.error || 'Unable to sign in. Check your credentials.');
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
        <Heading style={styles.title}>Welcome to Maternalink</Heading>
        <BodyText style={styles.subtitle}>
          Your maternal health companion — sign in to access monitoring, health tracking, and care resources.
        </BodyText>

        <Card style={styles.formCard}>
          <Caption style={styles.label}>Email</Caption>
          <TextInput
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            style={styles.input}
            placeholder="you@example.com"
            placeholderTextColor={Theme.colors.textMuted}
          />

          <Caption style={styles.label}>Password</Caption>
          <TextInput
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            style={styles.input}
            placeholder="Enter password"
            placeholderTextColor={Theme.colors.textMuted}
          />

          <Button title="Sign In" onPress={handleLogin} loading={loading} style={styles.submitBtn} />
        </Card>

        <Button
          title="Create New Account"
          variant="outline"
          onPress={() => navigation.navigate('Register')}
          style={styles.registerBtn}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.colors.background },
  scroll: { padding: Theme.spacing.xl, paddingTop: Theme.spacing.xxxl },
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
  registerBtn: { marginTop: Theme.spacing.sm },
});

export default LoginScreen;
