import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import Theme from '../../../core/theme/theme';
import { Heading, Subheading, BodyText, Caption } from '../../../core/components/Typography';
import { Card } from '../../../core/components/Card';
import { useAuth } from '../../../core/context/AuthContext';

const WEEKLY_TIPS: Record<string, string> = {
  early: 'Stay hydrated and take prenatal vitamins daily. Light walking is great for circulation.',
  mid: 'Monitor your energy levels and rest when needed. Consider starting a birth plan discussion with your provider.',
  late: 'Pack your hospital bag and familiarize yourself with early labor signs. Rest between activities.',
};

export const HealthScreen: React.FC = () => {
  const { profile } = useAuth();
  const weeks = profile?.gestationalAgeWeeks ?? 0;

  const stage = weeks < 20 ? 'early' : weeks < 32 ? 'mid' : 'late';
  const trimester = weeks < 14 ? '1st' : weeks < 28 ? '2nd' : '3rd';

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Heading style={styles.title}>Health Hub</Heading>
        <BodyText style={styles.subtitle}>Pregnancy wellness at a glance</BodyText>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <Card style={styles.statCard}>
          <Subheading style={styles.statTitle}>Current Stage</Subheading>
          <BodyText style={styles.statValue}>Week {weeks} · {trimester} Trimester</BodyText>
          {profile?.dueDate && (
            <Caption>Expected due date: {new Date(profile.dueDate).toLocaleDateString()}</Caption>
          )}
        </Card>

        <Card style={styles.tipCard}>
          <Subheading style={styles.tipTitle}>Weekly Guidance</Subheading>
          <BodyText style={styles.tipText}>{WEEKLY_TIPS[stage]}</BodyText>
        </Card>

        <Card style={styles.checklistCard}>
          <Subheading style={styles.checkTitle}>Wellness Checklist</Subheading>
          {[
            'Take prenatal vitamins',
            'Drink 8+ glasses of water',
            'Track fetal movement (after week 28)',
            'Attend scheduled prenatal visits',
            'Get adequate rest (7-9 hours)',
          ].map((item) => (
            <View key={item} style={styles.checkRow}>
              <BodyText style={styles.checkBullet}>✓</BodyText>
              <BodyText style={styles.checkText}>{item}</BodyText>
            </View>
          ))}
        </Card>

        <Card style={styles.disclaimerCard}>
          <Caption style={styles.disclaimer}>
            This information is for educational purposes only and does not replace professional medical advice.
            Contact your healthcare provider for any concerns.
          </Caption>
        </Card>
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
  statCard: { padding: Theme.spacing.lg, marginBottom: Theme.spacing.md },
  statTitle: { color: Theme.colors.text, marginBottom: Theme.spacing.sm },
  statValue: { color: Theme.colors.primary, fontSize: Theme.typography.sizes.lg, marginBottom: 4 },
  tipCard: { padding: Theme.spacing.lg, marginBottom: Theme.spacing.md, backgroundColor: Theme.colors.accentLight },
  tipTitle: { color: Theme.colors.accent, marginBottom: Theme.spacing.sm },
  tipText: { color: Theme.colors.textSecondary, lineHeight: 20 },
  checklistCard: { padding: Theme.spacing.lg, marginBottom: Theme.spacing.md },
  checkTitle: { color: Theme.colors.text, marginBottom: Theme.spacing.md },
  checkRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: Theme.spacing.sm },
  checkBullet: { color: Theme.colors.success, marginRight: Theme.spacing.sm, fontWeight: 'bold' },
  checkText: { flex: 1, color: Theme.colors.textSecondary, fontSize: Theme.typography.sizes.sm },
  disclaimerCard: { padding: Theme.spacing.md },
  disclaimer: { fontStyle: 'italic', lineHeight: 16 },
});

export default HealthScreen;
