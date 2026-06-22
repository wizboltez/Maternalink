import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function DailySummaryScreen() {
  return (
    <View style={styles.container}>
      <Text>DailySummaryScreen</Text>
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
