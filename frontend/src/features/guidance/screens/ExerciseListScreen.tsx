import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Linking } from 'react-native';
import { Text, ActivityIndicator } from 'react-native-paper';
import Theme from '../../../core/theme/theme';
import { Heading, Subheading, BodyText, Caption } from '../../../core/components/Typography';
import { Card } from '../../../core/components/Card';
import { useAuth } from '../../../core/context/AuthContext';
import { useMaternalHealth } from '../../maternal-health/hooks/useMaternalHealth';
import guidanceApi, { ExerciseRecommendationResponse } from '../api/guidanceApi';
import { SosButton } from '../../../core/components/SosButton';

export const ExerciseListScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { profile } = useAuth();
  const { heartRate, spO2, temperature, stressScore, activity, fallDetected, isSleeping, contractionActive, contractionIntensity, contractionDuration, contractionFrequency } = useMaternalHealth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ExerciseRecommendationResponse | null>(null);

  const mapActivityToIndex = (value: typeof activity): number => {
    switch (value) {
      case 'lying':
        return 0.1;
      case 'sitting':
        return 0.3;
      case 'standing':
        return 0.5;
      case 'walking':
        return 0.8;
      default:
        return 0.4;
    }
  };

  const fetchRecommendations = async () => {
    setLoading(true);
    try {
      const sensorData = {
        heartRate,
        spo2: spO2,
        temperature,
        stressScore,
        activity,
        activityIndex: mapActivityToIndex(activity),
        posture: activity,
        fallDetected,
        isSleeping,
        contractionActive,
        contractionIntensity,
        contractionDuration,
        contractionFrequency,
        pregnancyWeek: profile?.pregnancyWeek,
      };

      const res = await guidanceApi.getRecommendations(sensorData);
      setData(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecommendations();
  }, []);

  const openVideo = (url: string) => {
    Linking.openURL(url).catch(() => console.log("Failed to open URL"));
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Heading style={styles.title}>Recommended Exercises</Heading>
        </View>
        <SosButton />
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={Theme.colors.primary} />
          <Caption style={{ marginTop: 12 }}>Analyzing your current vitals...</Caption>
        </View>
      ) : data ? (
        <ScrollView 
          contentContainerStyle={styles.scroll}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchRecommendations} />}
        >
          {data.emergency && (
            <Card style={styles.emergencyCard}>
              <Subheading style={styles.emergencyTitle}>⚠️ Safety Alert</Subheading>
              <BodyText style={styles.emergencyText}>
                We detected a potential fall or high heart rate. Please rest immediately.
              </BodyText>
            </Card>
          )}

          <View style={styles.reasonsContainer}>
            <Subheading style={styles.sectionTitle}>Why these recommendations?</Subheading>
            {data.reasons.map((r, i) => (
              <View key={i} style={styles.reasonRow}>
                <Text style={styles.bullet}>•</Text>
                <BodyText style={styles.reasonText}>{r}</BodyText>
              </View>
            ))}
          </View>

          {data.recommendations.map((cat, i) => (
            <Card key={i} style={[styles.categoryCard, { borderLeftColor: cat.color }]}>
              <View style={[styles.catHeader, { backgroundColor: cat.color + '15' }]}>
                <Text style={styles.catIcon}>{cat.icon}</Text>
                <View>
                  <Subheading style={styles.catTitle}>{cat.label}</Subheading>
                  <Caption>{cat.description}</Caption>
                </View>
              </View>
              
              <View style={styles.videoList}>
                {cat.videos.map((vid: any) => (
                  <TouchableOpacity key={vid.id} style={styles.videoItem} onPress={() => openVideo(vid.url)}>
                    <View style={styles.playIconContainer}>
                      <Text style={styles.playIcon}>▶</Text>
                    </View>
                    <View style={styles.videoInfo}>
                      <BodyText style={styles.videoTitle}>{vid.title}</BodyText>
                      <Caption>{vid.duration}</Caption>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </Card>
          ))}
        </ScrollView>
      ) : (
        <View style={styles.centerContainer}>
          <BodyText>Failed to load recommendations.</BodyText>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Theme.spacing.xxl + 10,
    paddingBottom: Theme.spacing.md,
    paddingHorizontal: Theme.spacing.lg,
    backgroundColor: Theme.colors.cardBackground,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.divider,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backBtn: {
    padding: 8,
    marginRight: 8,
  },
  backIcon: {
    fontSize: 24,
    color: Theme.colors.primary,
  },
  title: {
    color: Theme.colors.primaryDark,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scroll: {
    padding: Theme.spacing.lg,
    paddingBottom: 40,
  },
  emergencyCard: {
    backgroundColor: '#FDF2F2',
    borderLeftWidth: 4,
    borderLeftColor: Theme.colors.danger,
    padding: Theme.spacing.lg,
    marginBottom: Theme.spacing.lg,
  },
  emergencyTitle: {
    color: Theme.colors.danger,
    fontWeight: '700',
    marginBottom: 4,
  },
  emergencyText: {
    color: Theme.colors.danger,
  },
  reasonsContainer: {
    marginBottom: Theme.spacing.xl,
  },
  sectionTitle: {
    fontWeight: '600',
    marginBottom: Theme.spacing.md,
  },
  reasonRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  bullet: {
    fontSize: 16,
    color: Theme.colors.primary,
    marginRight: 8,
    marginTop: -2,
  },
  reasonText: {
    flex: 1,
    color: Theme.colors.textSecondary,
  },
  categoryCard: {
    marginBottom: Theme.spacing.lg,
    borderLeftWidth: 5,
    overflow: 'hidden',
  },
  catHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.divider,
  },
  catIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  catTitle: {
    fontWeight: '700',
  },
  videoList: {
    padding: Theme.spacing.md,
  },
  videoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.divider,
  },
  playIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Theme.colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  playIcon: {
    color: Theme.colors.primary,
    fontSize: 12,
    marginLeft: 2,
  },
  videoInfo: {
    flex: 1,
  },
  videoTitle: {
    fontWeight: '500',
  },
});

export default ExerciseListScreen;
