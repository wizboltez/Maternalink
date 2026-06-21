import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import Theme from '../../../core/theme/theme';
import { Heading, Subheading, BodyText, Caption } from '../../../core/components/Typography';
import { Card } from '../../../core/components/Card';
import { useAuth } from '../../../core/context/AuthContext';

export const MainHomeScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { user, profile } = useAuth();

  const dueDate = profile?.dueDate
    ? new Date(profile.dueDate).toLocaleDateString([], { month: 'long', day: 'numeric', year: 'numeric' })
    : 'Not set';

  return (
    <View style={styles.container}>
      <View style={styles.headerSection}>
        <Heading style={styles.title}>Maternalink</Heading>
        <BodyText style={styles.subtitle}>Welcome back, {user?.name || 'there'}</BodyText>
        {profile && (
          <Caption style={styles.meta}>
            Week {profile.gestationalAgeWeeks} · Due {dueDate}
          </Caption>
        )}
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <Card style={styles.heroCard}>
          <Subheading style={styles.heroTitle}>Your Pregnancy Journey</Subheading>
          <BodyText style={styles.heroText}>
            Track your health, connect with your care team, and access smart monitoring tools — all in one place.
          </BodyText>
        </Card>

        <Subheading style={styles.sectionLabel}>Health & Wellness</Subheading>
        <View style={styles.grid}>
          <Card onPress={() => navigation.navigate('Health')} style={styles.gridCard}>
            <Subheading style={styles.cardIcon}>🩺</Subheading>
            <Subheading style={styles.cardTitle}>Health Hub</Subheading>
            <Caption>Vitals, tips & weekly guidance</Caption>
          </Card>

          <Card onPress={() => navigation.navigate('Profile')} style={styles.gridCard}>
            <Subheading style={styles.cardIcon}>👤</Subheading>
            <Subheading style={styles.cardTitle}>My Profile</Subheading>
            <Caption>Care team & preferences</Caption>
          </Card>
        </View>

        <Subheading style={styles.sectionLabel}>Smart Tools</Subheading>
        <Card
          onPress={() => navigation.getParent()?.navigate('Monitoring')}
          style={styles.featureCard}
        >
          <View style={styles.featureRow}>
            <View style={styles.featureIconBox}>
              <Subheading style={styles.featureIcon}>📡</Subheading>
            </View>
            <View style={styles.featureContent}>
              <Subheading style={styles.featureTitle}>Contraction Monitoring</Subheading>
              <BodyText style={styles.featureDesc}>
                Connect your Smart Maternal Belt via Bluetooth, calibrate sensors, and track contraction patterns in real time.
              </BodyText>
              <Caption style={styles.featureTag}>Bluetooth · Live telemetry · Reports</Caption>
            </View>
          </View>
        </Card>

        <Card style={styles.infoCard}>
          <Subheading style={styles.infoTitle}>Care Provider</Subheading>
          <BodyText style={styles.infoText}>
            {profile?.doctorName || 'Add your doctor in Profile settings'}
          </BodyText>
          <Caption style={styles.infoSub}>
            Emergency: {profile?.emergencyContact || 'Not configured'}
          </Caption>
        </Card>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.colors.background },
  headerSection: {
    paddingHorizontal: Theme.spacing.xl,
    paddingTop: Theme.spacing.xxl,
    paddingBottom: Theme.spacing.md,
    backgroundColor: Theme.colors.cardBackground,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.divider,
  },
  title: { color: Theme.colors.primaryDark },
  subtitle: { color: Theme.colors.textSecondary, marginTop: 2 },
  meta: { marginTop: 4, color: Theme.colors.accent },
  scroll: { padding: Theme.spacing.xl, paddingBottom: 80 },
  heroCard: { padding: Theme.spacing.lg, marginBottom: Theme.spacing.lg, backgroundColor: Theme.colors.primaryLight },
  heroTitle: { color: Theme.colors.primaryDark, marginBottom: Theme.spacing.sm },
  heroText: { color: Theme.colors.textSecondary, lineHeight: 20 },
  sectionLabel: { color: Theme.colors.text, marginBottom: Theme.spacing.md, marginTop: Theme.spacing.sm },
  grid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Theme.spacing.lg },
  gridCard: { width: '48%', padding: Theme.spacing.md },
  cardIcon: { fontSize: 24, marginBottom: Theme.spacing.xs },
  cardTitle: { fontSize: Theme.typography.sizes.base, color: Theme.colors.text, marginBottom: 4 },
  featureCard: { padding: Theme.spacing.lg, marginBottom: Theme.spacing.lg },
  featureRow: { flexDirection: 'row', alignItems: 'flex-start' },
  featureIconBox: {
    width: 48,
    height: 48,
    borderRadius: Theme.borders.radius.md,
    backgroundColor: Theme.colors.accentLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Theme.spacing.md,
  },
  featureIcon: { fontSize: 22 },
  featureContent: { flex: 1 },
  featureTitle: { color: Theme.colors.text, marginBottom: 4 },
  featureDesc: { color: Theme.colors.textSecondary, fontSize: Theme.typography.sizes.sm, lineHeight: 18 },
  featureTag: { marginTop: Theme.spacing.sm, color: Theme.colors.accent },
  infoCard: { padding: Theme.spacing.lg },
  infoTitle: { color: Theme.colors.text, marginBottom: Theme.spacing.sm },
  infoText: { color: Theme.colors.textSecondary },
  infoSub: { marginTop: 4 },
});

export default MainHomeScreen;
