import React from 'react';
import { Modal as RNModal, StyleSheet, View, TouchableWithoutFeedback, ViewStyle } from 'react-native';
import Theme from '../theme/theme';
import { Card } from './Card';

interface ModalProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  style?: ViewStyle;
}

export const Modal: React.FC<ModalProps> = ({ visible, onClose, children, style }) => {
  return (
    <RNModal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.container}>
              <Card shadow="heavy" style={style ? [styles.card, style] : styles.card}>
                {children}
              </Card>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </RNModal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(28, 25, 46, 0.4)', // Dim dark HSL translucent layer
    justifyContent: 'center',
    alignItems: 'center',
    padding: Theme.spacing.lg,
  },
  container: {
    width: '100%',
    maxWidth: 400,
  },
  card: {
    marginVertical: 0,
    padding: Theme.spacing.xl,
    backgroundColor: Theme.colors.cardBackground,
    borderRadius: Theme.borders.radius.xl,
  },
});
