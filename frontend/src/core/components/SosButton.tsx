import React, { useState } from 'react';
import { TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { Text } from 'react-native-paper';
import Theme from '../theme/theme';
import sosApi from '../api/sosApi';
import { useAuth } from '../context/AuthContext';

export const SosButton: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const handlePress = () => {
    Alert.alert(
      'Emergency SOS',
      'Are you sure you want to activate the Emergency SOS? This will send a distress message to your emergency contacts.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'ACTIVATE', 
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              const res = await sosApi.activateSos(user?.id, 'Unknown Location');
              if (res.success) {
                Alert.alert('SOS Sent', res.mocked 
                  ? 'SOS Activated (Mock Mode - Twilio not configured)' 
                  : 'Distress message sent to emergency contacts.');
              } else {
                Alert.alert('Error', res.error || 'Failed to send SOS.');
              }
            } catch (err) {
              Alert.alert('Error', 'Network error while sending SOS.');
            } finally {
              setLoading(false);
            }
          }
        },
      ]
    );
  };

  return (
    <TouchableOpacity 
      style={styles.container} 
      onPress={handlePress}
      disabled={loading}
    >
      {loading ? (
        <ActivityIndicator size="small" color="#FFF" />
      ) : (
        <Text style={styles.text}>Emergency SOS</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Theme.colors.danger,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Theme.borders.radius.md,
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 12,
  },
});
