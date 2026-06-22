import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

/**
 * TrendChart - Reusable chart component for displaying trends
 */
export default function TrendChart({ data, title }) {
  return (
    <View style={styles.container}>
      <Text>{title}</Text>
      <Text>TrendChart</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
