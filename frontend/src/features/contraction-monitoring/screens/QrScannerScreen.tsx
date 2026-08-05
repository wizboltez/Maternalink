import React, { useState } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Alert } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import Theme from '../../../core/theme/theme';
import { Heading, BodyText } from '../../../core/components/Typography';

export const QrScannerScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);

  if (!permission) {
    // Camera permissions are still loading
    return <View style={styles.loadingContainer} />;
  }

  if (!permission.granted) {
    // Camera permissions are not granted yet
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionText}>We need your permission to show the camera</Text>
        <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
          <Text style={styles.buttonText}>Grant Permission</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleBarcodeScanned = ({ type, data }: { type: string; data: string }) => {
    if (scanned) return;
    setScanned(true);

    try {
      let mac = '';
      let name = 'Maternal Belt';

      // Attempt to parse JSON first (e.g. {"mac": "B0:CB:D8:0A:88:1A", "name": "Belt X"})
      if (data.startsWith('{') && data.endsWith('}')) {
        const parsed = JSON.parse(data);
        mac = parsed.mac || parsed.id || '';
        if (parsed.name) name = parsed.name;
      } else {
        // Assume it's a raw MAC address or name
        // Validate MAC format XX:XX:XX:XX:XX:XX or similar
        const macRegex = /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/;
        if (macRegex.test(data.trim())) {
          mac = data.trim();
        } else {
          throw new Error('Invalid QR code format. Expected a Bluetooth MAC address.');
        }
      }

      if (!mac) {
        throw new Error('No MAC address found in the QR code.');
      }

      // Navigate back to DeviceConnection with the scanned data
      navigation.navigate('DeviceConnection', {
        scannedDevice: { id: mac, name, type: 'ble' },
      });
    } catch (err: any) {
      Alert.alert(
        'Scan Error',
        err.message || 'Unable to read device details from QR code.',
        [{ text: 'OK', onPress: () => setScanned(false) }]
      );
    }
  };

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFillObject}
        onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: ['qr'],
        }}
      />
      {/* Overlay with a scanner target area */}
      <View style={styles.overlay}>
        <View style={styles.topOverlay}>
          <Heading style={styles.scanTitle}>Scan Belt QR Code</Heading>
          <BodyText style={styles.scanSubtitle}>Position the QR code on your belt within the frame</BodyText>
        </View>
        
        <View style={styles.middleOverlay}>
          <View style={styles.sideOverlay} />
          <View style={styles.targetFrame}>
            <View style={[styles.corner, styles.topLeft]} />
            <View style={[styles.corner, styles.topRight]} />
            <View style={[styles.corner, styles.bottomLeft]} />
            <View style={[styles.corner, styles.bottomRight]} />
          </View>
          <View style={styles.sideOverlay} />
        </View>

        <View style={styles.bottomOverlay}>
          <TouchableOpacity style={styles.cancelButton} onPress={() => navigation.goBack()}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: Theme.colors.background,
  },
  permissionText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    color: Theme.colors.text,
  },
  permissionButton: {
    backgroundColor: Theme.colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: Theme.borders.radius.sm,
    marginBottom: 16,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  backButton: {
    padding: 12,
  },
  backButtonText: {
    color: Theme.colors.primary,
    fontSize: 16,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  topOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  scanTitle: {
    color: '#fff',
    marginBottom: 8,
  },
  scanSubtitle: {
    color: '#ccc',
    textAlign: 'center',
  },
  middleOverlay: {
    flexDirection: 'row',
    height: 250,
  },
  sideOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  targetFrame: {
    width: 250,
    height: 250,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderColor: Theme.colors.primary,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
  },
  bottomOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButton: {
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: Theme.borders.radius.sm,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default QrScannerScreen;
