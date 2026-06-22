import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

/**
 * MetricCard - Displays a single health metric
 */
export default function MetricCard({
  title,
  value,
  unit,
  icon,
  severity = 'normal',
}) {
  // TODO: Implement MetricCard component
  return (
    <View style={styles.container}>
      <Text>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
