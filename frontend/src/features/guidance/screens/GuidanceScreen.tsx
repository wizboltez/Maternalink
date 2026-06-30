import React from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, Dimensions, TouchableOpacity, useWindowDimensions } from 'react-native';
import { Text, ActivityIndicator, FAB } from 'react-native-paper';
import { useQuery } from '@tanstack/react-query';
import Theme from '../../../core/theme/theme';
import { Heading, Subheading, BodyText, Caption } from '../../../core/components/Typography';
import { Card } from '../../../core/components/Card';
import { useAuth } from '../../../core/context/AuthContext';
import guidanceApi from '../api/guidanceApi';
import { SosButton } from '../../../core/components/SosButton';

const { width } = Dimensions.get('window');

// Color mapping matching requirements:
// Green = Healthy, Yellow = Attention, Orange = Warning, Red = Emergency
const SEMANTIC_COLORS = {
  healthy: {
    primary: '#3FB178', // Success Green
    background: '#F0F9F4',
  },
  attention: {
    primary: '#FBC02D', // Attention Yellow
    background: '#FFFDE7',
  },
  warning: {
    primary: '#EF6C00', // Warning Orange
    background: '#FFF3E0',
  },
  emergency: {
    primary: '#D65454', // Emergency Red
    background: '#FDF2F2',
  },
  info: {
    primary: '#4B92D4', // Hydration Sky Blue
    background: '#F0F7FC',
  },
};

interface GuidanceCardProps {
  title: string;
  icon: string;
  items: string[];
  status: 'healthy' | 'attention' | 'warning' | 'emergency' | 'info';
}

const GuidanceCard: React.FC<GuidanceCardProps> = ({ title, icon, items, status }) => {
  const colors = SEMANTIC_COLORS[status];

  return (
    <Card style={[styles.guidanceCard, { borderLeftColor: colors.primary }]}>
      <View style={[styles.cardHeader, { backgroundColor: colors.background }]}>
        <Text style={styles.cardIcon}>{icon}</Text>
        <Subheading style={[styles.cardTitle, { color: Theme.colors.text }]}>
          {title}
        </Subheading>
        <View style={[styles.statusTag, { backgroundColor: colors.primary }]}>
          <Text style={styles.statusText}>{status.toUpperCase()}</Text>
        </View>
      </View>
      
      <View style={styles.cardContent}>
        {items.length === 0 ? (
          <Caption style={styles.emptyText}>No recommendations for this week.</Caption>
        ) : (
          items.map((item, index) => (
            <View key={index} style={styles.bulletRow}>
              <Text style={[styles.bulletPoint, { color: colors.primary }]}>✦</Text>
              <BodyText style={styles.bulletText}>{item}</BodyText>
            </View>
          ))
        )}
      </View>
    </Card>
  );
};

export const GuidanceScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { user, profile } = useAuth();
  const { width: screenWidth } = useWindowDimensions();
  const isTablet = screenWidth > 768;

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['guidance', user?.id, profile?.pregnancyWeek],
    queryFn: () => guidanceApi.getGuidance(user!.id),
    enabled: !!user?.id && !!profile,
  });

  const trimesterSuffix = (tri: number) => {
    if (tri === 1) return '1st';
    if (tri === 2) return '2nd';
    return '3rd';
  };

  if (!profile) {
    return (
      <View style={styles.loadingContainer}>
        <Caption>No active pregnancy profile found. Please set up your profile.</Caption>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Premium Header */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <View>
            <Heading style={styles.title}>Weekly Guidance</Heading>
            <BodyText style={styles.subtitle}>
              Week {profile.pregnancyWeek || 0} · {trimesterSuffix(profile.trimester || 1)} Trimester
            </BodyText>
          </View>
          <View style={styles.headerRight}>
            <SosButton />
            <View style={styles.weekBadge}>
              <Text style={styles.weekBadgeText}>W{profile.pregnancyWeek}</Text>
            </View>
          </View>
        </View>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Theme.colors.primary} />
          <Caption style={styles.loadingText}>Fetching medical database rules...</Caption>
        </View>
      ) : isError ? (
        <ScrollView
          contentContainerStyle={styles.loadingContainer}
          refreshControl={<RefreshControl refreshing={false} onRefresh={refetch} />}
        >
          <Caption style={styles.errorText}>Failed to fetch rules. Drag down to retry.</Caption>
        </ScrollView>
      ) : data ? (
        <ScrollView
          contentContainerStyle={[styles.scroll, isTablet && styles.scrollTablet]}
          refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} />}
          showsVerticalScrollIndicator={false}
        >
          {/* Nutrition Tips - Green (Healthy) */}
          <GuidanceCard
            title="Nutrition Tips"
            icon="🥗"
            items={data.nutritionTips}
            status="healthy"
          />

          {/* Hydration Tips - Blue (Info) */}
          <GuidanceCard
            title="Hydration Tips"
            icon="💧"
            items={data.hydrationTips}
            status="info"
          />

          {/* Exercise Tips - Green (Healthy) */}
          <GuidanceCard
            title="Exercise Recommendations"
            icon="🏃‍♀️"
            items={data.exerciseTips}
            status="healthy"
          />

          {/* Medical Tests - Yellow (Attention) */}
          <GuidanceCard
            title="Medical Tests"
            icon="🔬"
            items={data.medicalTests}
            status="attention"
          />

          {/* Doctor Visits - Orange (Warning) */}
          <GuidanceCard
            title="Doctor Visits"
            icon="👩‍⚕️"
            items={data.doctorVisits}
            status="warning"
          />

          {/* Precautions - Red (Emergency) */}
          <GuidanceCard
            title="Precautions"
            icon="⚠️"
            items={data.precautions}
            status="emergency"
          />

          <Caption style={styles.disclaimer}>
            Medical advice based on standard pregnancy profiles. Consult your primary obstetrician for specific health symptoms.
          </Caption>
        </ScrollView>
      ) : null}

      <FAB
        icon="chat-processing"
        label="AI Chat"
        style={styles.chatFab}
        onPress={() => navigation.navigate('Chatbot')}
        color="#FFF"
      />
      <FAB
        icon="yoga"
        label="Exercises"
        style={styles.exerciseFab}
        onPress={() => navigation.navigate('Exercises')}
        color="#FFF"
      />
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
    backgroundColor: Theme.colors.cardBackground,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.divider,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    color: Theme.colors.primaryDark,
  },
  subtitle: {
    color: Theme.colors.textSecondary,
    marginTop: 2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  weekBadge: {
    backgroundColor: Theme.colors.primary,
    borderRadius: Theme.borders.radius.md,
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.sm,
    shadowColor: Theme.colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  weekBadgeText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: Theme.typography.sizes.md,
  },
  scroll: {
    padding: Theme.spacing.lg,
    paddingBottom: 100, // Leave space for bottom tab bar
  },
  scrollTablet: {
    alignSelf: 'center',
    width: '100%',
    maxWidth: 800,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Theme.spacing.xl,
  },
  loadingText: {
    marginTop: Theme.spacing.sm,
  },
  errorText: {
    color: Theme.colors.danger,
    textAlign: 'center',
  },
  guidanceCard: {
    marginBottom: Theme.spacing.md,
    borderLeftWidth: 5,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Theme.spacing.lg,
    paddingVertical: Theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.divider,
  },
  cardIcon: {
    fontSize: 22,
    marginRight: Theme.spacing.sm,
  },
  cardTitle: {
    flex: 1,
    fontWeight: '600',
  },
  statusTag: {
    borderRadius: Theme.borders.radius.xs,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: Theme.typography.sizes.xs - 2,
    fontWeight: '700',
  },
  cardContent: {
    padding: Theme.spacing.lg,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Theme.spacing.sm,
  },
  bulletPoint: {
    fontSize: Theme.typography.sizes.base,
    marginRight: Theme.spacing.sm,
    marginTop: -2,
  },
  bulletText: {
    flex: 1,
    color: Theme.colors.textSecondary,
    lineHeight: 20,
  },
  emptyText: {
    textAlign: 'center',
    fontStyle: 'italic',
  },
  disclaimer: {
    textAlign: 'center',
    marginTop: Theme.spacing.lg,
    fontStyle: 'italic',
    lineHeight: 16,
    paddingHorizontal: Theme.spacing.md,
  },
  chatFab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: Theme.colors.primary,
  },
  exerciseFab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 60,
    backgroundColor: '#378ADD',
  },
});

export default GuidanceScreen;
