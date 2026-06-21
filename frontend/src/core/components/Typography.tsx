import React from 'react';
import { Text as RNText, TextStyle, StyleSheet, TextProps } from 'react-native';
import Theme from '../theme/theme';

interface StyledTextProps extends TextProps {
  style?: TextStyle | TextStyle[];
}

export const Heading: React.FC<StyledTextProps> = ({ children, style, ...props }) => {
  return (
    <RNText style={[styles.heading, style]} {...props}>
      {children}
    </RNText>
  );
};

export const Subheading: React.FC<StyledTextProps> = ({ children, style, ...props }) => {
  return (
    <RNText style={[styles.subheading, style]} {...props}>
      {children}
    </RNText>
  );
};

export const BodyText: React.FC<StyledTextProps> = ({ children, style, ...props }) => {
  return (
    <RNText style={[styles.body, style]} {...props}>
      {children}
    </RNText>
  );
};

export const Caption: React.FC<StyledTextProps> = ({ children, style, ...props }) => {
  return (
    <RNText style={[styles.caption, style]} {...props}>
      {children}
    </RNText>
  );
};

const styles = StyleSheet.create({
  heading: {
    fontFamily: Theme.typography.fontFamily,
    fontSize: Theme.typography.sizes.xl,
    fontWeight: Theme.typography.weights.bold,
    color: Theme.colors.text,
    lineHeight: Theme.typography.lineHeights.relaxed,
  },
  subheading: {
    fontFamily: Theme.typography.fontFamily,
    fontSize: Theme.typography.sizes.md,
    fontWeight: Theme.typography.weights.semibold,
    color: Theme.colors.textSecondary,
    lineHeight: Theme.typography.lineHeights.normal,
  },
  body: {
    fontFamily: Theme.typography.fontFamily,
    fontSize: Theme.typography.sizes.base,
    fontWeight: Theme.typography.weights.regular,
    color: Theme.colors.text,
    lineHeight: Theme.typography.lineHeights.normal,
  },
  caption: {
    fontFamily: Theme.typography.fontFamily,
    fontSize: Theme.typography.sizes.sm,
    fontWeight: Theme.typography.weights.regular,
    color: Theme.colors.textMuted,
    lineHeight: Theme.typography.lineHeights.tight,
  },
});
