import React from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import Theme from '../../../core/theme/theme';
import { Heading, Subheading, BodyText, Caption } from '../../../core/components/Typography';
import { Card } from '../../../core/components/Card';
import { Button } from '../../../core/components/Button';
import { useAuth } from '../../../core/context/AuthContext';

export const ProfileScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { user, profile, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: () => logout(),
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Heading style={styles.title}>My Profile</Heading>
        <BodyText style={styles.subtitle}>Account and care preferences</BodyText>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <Card style={styles.card}>
          <Subheading style={styles.cardTitle}>Account</Subheading>
          <BodyText style={styles.rowLabel}>Name</BodyText>
          <BodyText style={styles.rowValue}>{user?.name}</BodyText>
          <BodyText style={styles.rowLabel}>Email</BodyText>
          <BodyText style={styles.rowValue}>{user?.email}</BodyText>
        </Card>

        {profile && (
          <Card style={styles.card}>
            <Subheading style={styles.cardTitle}>Pregnancy Profile</Subheading>
            <BodyText style={styles.rowLabel}>Gestational Age</BodyText>
            <BodyText style={styles.rowValue}>{profile.gestationalAgeWeeks} weeks</BodyText>
            <BodyText style={styles.rowLabel}>Due Date</BodyText>
            <BodyText style={styles.rowValue}>
              {new Date(profile.dueDate).toLocaleDateString()}
            </BodyText>
            <BodyText style={styles.rowLabel}>Doctor</BodyText>
            <BodyText style={styles.rowValue}>{profile.doctorName}</BodyText>
            <BodyText style={styles.rowLabel}>Emergency Contact</BodyText>
            <BodyText style={styles.rowValue}>{profile.emergencyContact}</BodyText>
          </Card>
        )}

        <Card style={styles.card}>
          <Subheading style={styles.cardTitle}>App Settings</Subheading>
          <Button
            title="Bluetooth & Monitoring Settings"
            variant="outline"
            onPress={() => navigation.navigate('ContractionMonitoring', { screen: 'Settings' })}
            style={styles.settingBtn}
          />
          <Button
            title="Contraction Monitoring Settings"
            variant="outline"
            onPress={() => navigation.navigate('ContractionMonitoring', { screen: 'Settings' })}
            style={styles.settingBtn}
          />
        </Card>

        <Button title="Sign Out" variant="danger" onPress={handleLogout} style={styles.logoutBtn} />
        <Caption style={styles.version}>Maternalink v1.0.0</Caption>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.colors.background },
  header: { paddingHorizontal: Theme.spacing.xl, paddingTop: Theme.spacing.xxl, paddingBottom: Theme.spacing.md },
  title: { color: Theme.colors.primaryDark },
  subtitle: { color: Theme.colors.textSecondary, marginTop: Theme.spacing.xs },
  scroll: { padding: Theme.spacing.xl, paddingBottom: 80 },
  card: { padding: Theme.spacing.lg, marginBottom: Theme.spacing.md },
  cardTitle: { color: Theme.colors.text, marginBottom: Theme.spacing.md, borderBottomWidth: 1, borderBottomColor: Theme.colors.divider, paddingBottom: Theme.spacing.sm },
  rowLabel: { color: Theme.colors.textMuted, fontSize: Theme.typography.sizes.xs, marginTop: Theme.spacing.sm },
  rowValue: { color: Theme.colors.text, marginTop: 2 },
  settingBtn: { marginTop: Theme.spacing.sm },
  logoutBtn: { marginTop: Theme.spacing.md },
  version: { textAlign: 'center', marginTop: Theme.spacing.lg, marginBottom: Theme.spacing.xxl },
});

export default ProfileScreen;
