import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';
import { ActivityIndicator, Text } from 'react-native-paper';
import Theme from '../../../core/theme/theme';

const { width } = Dimensions.get('window');

interface SplashScreenProps {
  onAnimationComplete: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onAnimationComplete }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const textFadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Run introductory animation sequence
    Animated.sequence([
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(textFadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();

    // Hold the splash screen for 2.8 seconds total, then call transition callback
    const timer = setTimeout(() => {
      onAnimationComplete();
    }, 2800);

    return () => clearTimeout(timer);
  }, [fadeAnim, scaleAnim, textFadeAnim, onAnimationComplete]);

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.logoContainer, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
        <View style={styles.iconCircle}>
          <Text style={styles.emojiIcon}>🤰</Text>
        </View>
      </Animated.View>

      <Animated.View style={[styles.brandContainer, { opacity: textFadeAnim }]}>
        <Text style={styles.brandName}>Maternalink</Text>
        <Text style={styles.tagline}>Smart Pregnancy Guidance & Care</Text>
      </Animated.View>

      <Animated.View style={[styles.loaderContainer, { opacity: textFadeAnim }]}>
        <ActivityIndicator size="small" color={Theme.colors.primary} />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFD', // Calm, soft off-white
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Theme.spacing.xl,
  },
  iconCircle: {
    width: width * 0.35,
    height: width * 0.35,
    borderRadius: (width * 0.35) / 2,
    backgroundColor: Theme.colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Theme.colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 5,
  },
  emojiIcon: {
    fontSize: 52,
  },
  brandContainer: {
    alignItems: 'center',
    marginTop: Theme.spacing.md,
  },
  brandName: {
    fontSize: Theme.typography.sizes.xxl,
    fontWeight: Theme.typography.weights.bold,
    color: Theme.colors.primaryDark,
    letterSpacing: 0.8,
  },
  tagline: {
    fontSize: Theme.typography.sizes.sm,
    color: Theme.colors.textSecondary,
    marginTop: Theme.spacing.xs,
    letterSpacing: 0.2,
  },
  loaderContainer: {
    position: 'absolute',
    bottom: 80,
  },
});

export default SplashScreen;
