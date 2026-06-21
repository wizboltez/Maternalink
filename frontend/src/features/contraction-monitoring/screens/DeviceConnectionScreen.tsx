import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, FlatList, ActivityIndicator, Alert } from 'react-native';
import { Device } from 'react-native-ble-plx';
import Theme from '../../../core/theme/theme';
import { Heading, Subheading, BodyText, Caption } from '../../../core/components/Typography';
import { Card } from '../../../core/components/Card';
import { Button } from '../../../core/components/Button';
import contractionApi from '../api/contractionApi';
import bluetoothService from '../../../core/services/bluetoothService';

interface DeviceItem {
  _id: string;
  serialNumber: string;
  name: string;
  firmwareVersion: string;
  batteryLevel: number;
  capabilities: string[];
  status: 'online' | 'offline' | 'maintenance';
}

interface ScannedBleDevice {
  id: string;
  name: string;
  device: Device;
}

export const DeviceConnectionScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [devices, setDevices] = useState<DeviceItem[]>([]);
  const [bleDevices, setBleDevices] = useState<ScannedBleDevice[]>([]);
  const [connectingId, setConnectingId] = useState<string | null>(null);
  const [pairedDeviceId, setPairedDeviceId] = useState<string | null>(null);
  const [bleConnected, setBleConnected] = useState(false);

  const fetchDevices = useCallback(async () => {
    setLoading(true);
    try {
      const data = await contractionApi.getDevices();
      setDevices(data.devices || []);
    } catch (err: any) {
      console.error('Error loading devices:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDevices();

    bluetoothService.setConnectionCallback((connected) => {
      setBleConnected(connected);
    });

    return () => {
      bluetoothService.setConnectionCallback(null);
    };
  }, [fetchDevices]);

  const handleBleScan = async () => {
    setScanning(true);
    setBleDevices([]);
    const found: ScannedBleDevice[] = [];
    try {
      await bluetoothService.scanForDevices((device) => {
        const name = device.name || device.localName || 'Unknown Belt';
        const entry = { id: device.id, name, device };
        found.push(entry);
        setBleDevices((prev) => {
          if (prev.some((d) => d.id === device.id)) return prev;
          return [...prev, entry];
        });
      });

      if (found.length === 0) {
        Alert.alert(
          'Scan Complete',
          'No Maternalink belts found nearby. Ensure your belt is powered on and Bluetooth is enabled.'
        );
      }
    } catch (err: any) {
      Alert.alert('Bluetooth Scan Failed', err.message || 'Unable to scan for devices.');
    } finally {
      setScanning(false);
    }
  };

  const handleBleConnect = async (scanned: ScannedBleDevice) => {
    setConnectingId(scanned.id);
    try {
      const connected = await bluetoothService.connect(scanned.device);
      const battery = await bluetoothService.readBatteryLevel();

      const result = await contractionApi.syncDevice({
        serialNumber: connected.id,
        name: scanned.name || 'Smart Maternal Belt',
        firmwareVersion: '1.2.4',
        batteryLevel: battery ?? 100,
        capabilities: ['adc', 'flex_percent', 'intensity'],
      });

      await contractionApi.updateDeviceStatus(result.device._id, 'online').catch(() => {});

      setPairedDeviceId(result.device._id);
      setBleConnected(true);
      Alert.alert('Connected', `Bluetooth paired with "${scanned.name}". Belt is ready for calibration.`);
      fetchDevices();
    } catch (err: any) {
      Alert.alert('Connection Failed', err.response?.data?.error || err.message || 'Could not connect to belt.');
      await bluetoothService.disconnect();
    } finally {
      setConnectingId(null);
    }
  };

  const handleConnectRegisteredDevice = async (device: DeviceItem) => {
    setConnectingId(device._id);
    try {
      setPairedDeviceId(device._id);
      Alert.alert('Device Selected', `Belt "${device.name}" is ready. Proceed to calibration.`);
    } finally {
      setConnectingId(null);
    }
  };

  const handleDisconnect = async () => {
    await bluetoothService.disconnect();
    setPairedDeviceId(null);
    setBleConnected(false);
  };

  const renderBleDevice = ({ item }: { item: ScannedBleDevice }) => {
    const isConnecting = connectingId === item.id;
    return (
      <Card style={styles.deviceCard}>
        <View style={styles.deviceHeader}>
          <View>
            <Subheading style={styles.deviceName}>{item.name}</Subheading>
            <Caption style={styles.deviceSerial}>BLE · {item.id.substring(0, 8)}...</Caption>
          </View>
          <View style={[styles.statusTag, styles.bleTag]}>
            <Caption style={styles.bleText}>Nearby</Caption>
          </View>
        </View>
        <Button
          title={isConnecting ? 'Connecting...' : 'Pair via Bluetooth'}
          onPress={() => handleBleConnect(item)}
          disabled={isConnecting}
          style={styles.connectButton}
        />
      </Card>
    );
  };

  const renderDeviceItem = ({ item }: { item: DeviceItem }) => {
    const isPaired = pairedDeviceId === item._id;
    const isConnecting = connectingId === item._id;

    return (
      <Card style={[styles.deviceCard, ...(isPaired ? [styles.pairedCard] : [])]}>
        <View style={styles.deviceHeader}>
          <View>
            <Subheading style={styles.deviceName}>{item.name}</Subheading>
            <Caption style={styles.deviceSerial}>S/N: {item.serialNumber} · v{item.firmwareVersion}</Caption>
          </View>
          <View style={[styles.statusTag, isPaired ? styles.onlineTag : styles.offlineTag]}>
            <Caption style={isPaired ? styles.onlineText : styles.offlineText}>
              {isPaired ? (bleConnected ? 'BT Connected' : 'Selected') : 'Registered'}
            </Caption>
          </View>
        </View>

        <View style={styles.detailsRow}>
          <BodyText style={styles.batteryLabel}>Battery: {item.batteryLevel}%</BodyText>
          <BodyText style={styles.capabilitiesLabel}>
            Sensors: {item.capabilities.join(', ').toUpperCase()}
          </BodyText>
        </View>

        <Button
          title={isPaired ? 'Disconnect' : isConnecting ? 'Selecting...' : 'Select Belt'}
          variant={isPaired ? 'outline' : 'primary'}
          onPress={() => {
            if (isPaired) {
              handleDisconnect();
            } else {
              handleConnectRegisteredDevice(item);
            }
          }}
          disabled={isConnecting}
          style={styles.connectButton}
        />
      </Card>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerSection}>
        <Heading style={styles.mainTitle}>Belt Connection</Heading>
        <BodyText style={styles.subtitle}>
          Scan for your Smart Maternal Belt over Bluetooth, pair it, then proceed to calibration.
        </BodyText>
      </View>

      <View style={styles.scanSection}>
        <Button
          title={scanning ? 'Scanning...' : 'Scan for Bluetooth Devices'}
          onPress={handleBleScan}
          loading={scanning}
          style={styles.scanBtnTop}
        />
      </View>

      {bleDevices.length > 0 && (
        <View style={styles.bleSection}>
          <Subheading style={styles.sectionLabel}>Nearby Devices</Subheading>
          <FlatList
            data={bleDevices}
            keyExtractor={(item) => item.id}
            renderItem={renderBleDevice}
            scrollEnabled={false}
          />
        </View>
      )}

      {loading && devices.length === 0 ? (
        <ActivityIndicator size="large" color={Theme.colors.primary} style={styles.spinner} />
      ) : (
        <FlatList
          data={devices}
          keyExtractor={(item) => item._id}
          renderItem={renderDeviceItem}
          contentContainerStyle={styles.listContainer}
          ListHeaderComponent={
            devices.length > 0 ? (
              <Subheading style={styles.sectionLabel}>Registered Belts</Subheading>
            ) : null
          }
          ListEmptyComponent={
            !scanning ? (
              <View style={styles.emptyContainer}>
                <Caption style={styles.emptyText}>
                  No registered belts yet. Scan for a Bluetooth device above to pair your belt.
                </Caption>
              </View>
            ) : null
          }
        />
      )}

      {pairedDeviceId && (
        <View style={styles.bottomSection}>
          <Button
            title="Proceed to Calibration"
            variant="primary"
            onPress={() => navigation.navigate('CalibrationWizard', { deviceId: pairedDeviceId })}
            style={styles.nextBtn}
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.colors.background },
  headerSection: { paddingHorizontal: Theme.spacing.xl, paddingTop: Theme.spacing.xxl, paddingBottom: Theme.spacing.md },
  mainTitle: { color: Theme.colors.primaryDark },
  subtitle: { color: Theme.colors.textSecondary, marginTop: Theme.spacing.xs, lineHeight: 18 },
  scanSection: { paddingHorizontal: Theme.spacing.xl, marginBottom: Theme.spacing.md },
  scanBtnTop: { width: '100%' },
  bleSection: { paddingHorizontal: Theme.spacing.xl, marginBottom: Theme.spacing.sm },
  sectionLabel: { color: Theme.colors.text, marginBottom: Theme.spacing.sm },
  spinner: { marginTop: 60 },
  listContainer: { paddingHorizontal: Theme.spacing.xl, paddingBottom: 100 },
  deviceCard: { padding: Theme.spacing.lg, marginBottom: Theme.spacing.sm },
  pairedCard: { borderColor: Theme.colors.primary, borderWidth: Theme.borders.width.medium },
  deviceHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  deviceName: { color: Theme.colors.text },
  deviceSerial: { marginTop: 2 },
  statusTag: { paddingHorizontal: Theme.spacing.sm, paddingVertical: Theme.spacing.xs, borderRadius: Theme.borders.radius.sm },
  onlineTag: { backgroundColor: Theme.colors.accentLight },
  offlineTag: { backgroundColor: Theme.colors.primaryLight },
  bleTag: { backgroundColor: Theme.colors.info + '22' },
  onlineText: { color: Theme.colors.accent, fontWeight: Theme.typography.weights.semibold },
  offlineText: { color: Theme.colors.textSecondary },
  bleText: { color: Theme.colors.info, fontWeight: Theme.typography.weights.semibold },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: Theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: Theme.colors.divider,
    paddingTop: Theme.spacing.md,
  },
  batteryLabel: { fontSize: Theme.typography.sizes.sm, color: Theme.colors.textSecondary },
  capabilitiesLabel: { fontSize: Theme.typography.sizes.sm, color: Theme.colors.textSecondary },
  connectButton: { marginTop: Theme.spacing.xs },
  emptyContainer: { alignItems: 'center', paddingVertical: 40 },
  emptyText: { textAlign: 'center', lineHeight: 18 },
  bottomSection: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Theme.colors.cardBackground,
    paddingHorizontal: Theme.spacing.xl,
    paddingVertical: Theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: Theme.colors.divider,
  },
  nextBtn: { width: '100%' },
});

export default DeviceConnectionScreen;
