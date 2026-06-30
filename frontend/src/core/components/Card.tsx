import React from 'react';
import { View, StyleSheet, ViewStyle, TouchableOpacity } from 'react-native';
import Theme from '../theme/theme';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
  shadow?: 'none' | 'light' | 'medium' | 'heavy';
  onPress?: () => void;
}

export const Card: React.FC<CardProps> = ({ children, style, shadow = 'light', onPress }) => {
  const shadowStyle = shadow === 'none' ? {} : Theme.shadows[shadow];

  if (onPress) {
    return (
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={onPress}
        style={[styles.card, shadowStyle, style]}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return (
    <View style={[styles.card, shadowStyle, style]}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Theme.colors.cardBackground,
    borderRadius: Theme.borders.radius.lg,
    padding: Theme.spacing.lg,
    marginVertical: Theme.spacing.sm,
    borderWidth: Theme.borders.width.thin,
    borderColor: Theme.colors.divider,
  },
});
