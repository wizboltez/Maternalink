import React from 'react';
import { TouchableOpacity, StyleSheet, TextStyle, ViewStyle, ActivityIndicator } from 'react-native';
import Theme from '../theme/theme';
import { BodyText } from './Typography';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  style,
}) => {
  const getStyles = () => {
    let btnStyle: ViewStyle = {};
    let textStyle: TextStyle = {};

    // Variant mapping
    switch (variant) {
      case 'secondary':
        btnStyle = { backgroundColor: Theme.colors.primaryLight };
        textStyle = { color: Theme.colors.primary, fontWeight: Theme.typography.weights.semibold };
        break;
      case 'outline':
        btnStyle = {
          backgroundColor: 'transparent',
          borderWidth: Theme.borders.width.thin,
          borderColor: Theme.colors.primary,
        };
        textStyle = { color: Theme.colors.primary, fontWeight: Theme.typography.weights.semibold };
        break;
      case 'danger':
        btnStyle = { backgroundColor: Theme.colors.danger };
        textStyle = { color: Theme.colors.textOnPrimary, fontWeight: Theme.typography.weights.semibold };
        break;
      case 'primary':
      default:
        btnStyle = { backgroundColor: Theme.colors.primary };
        textStyle = { color: Theme.colors.textOnPrimary, fontWeight: Theme.typography.weights.semibold };
        break;
    }

    // Size mapping
    switch (size) {
      case 'small':
        btnStyle.paddingVertical = Theme.spacing.xs;
        btnStyle.paddingHorizontal = Theme.spacing.md;
        textStyle.fontSize = Theme.typography.sizes.sm;
        break;
      case 'large':
        btnStyle.paddingVertical = Theme.spacing.lg;
        btnStyle.paddingHorizontal = Theme.spacing.xxl;
        textStyle.fontSize = Theme.typography.sizes.lg;
        break;
      case 'medium':
      default:
        btnStyle.paddingVertical = Theme.spacing.md;
        btnStyle.paddingHorizontal = Theme.spacing.xl;
        textStyle.fontSize = Theme.typography.sizes.base;
        break;
    }

    if (disabled || loading) {
      btnStyle.opacity = 0.5;
    }

    return { button: btnStyle, text: textStyle };
  };

  const currentStyles = getStyles();

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      disabled={disabled || loading}
      style={[styles.baseButton, currentStyles.button, style]}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'primary' || variant === 'danger' ? '#FFFFFF' : Theme.colors.primary}
        />
      ) : (
        <BodyText style={currentStyles.text}>{title}</BodyText>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  baseButton: {
    borderRadius: Theme.borders.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
});
