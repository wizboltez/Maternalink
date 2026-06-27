import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, FlatList, ActivityIndicator, Alert } from 'react-native';
import Theme from '../../../core/theme/theme';
import { Heading, Subheading, BodyText, Caption } from '../../../core/components/Typography';
import { Card } from '../../../core/components/Card';
import { Button } from '../../../core/components/Button';
import contractionApi from '../api/contractionApi';
import bluetoothService, { ScannedDevice } from '../../../core/services/bluetoothService';
import {
  getSavedBelts,
  saveConnectedBelt,
  removeSavedBelt,
  updateBeltBackendId,
  SavedBelt,
} from '../../../core/services/beltHistoryService';
import { formatSessionDate, formatClockTime } from '../../../core/utils/timeFormat';

export const DeviceConnectionScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [scanning, setScanning] = useState(false);
  const [connectingId, setConnectingId] = useState<string | null>(null);
  const [savedBelts, setSavedBelts] = useState<SavedBelt[]>([]);
  const [scannedDevices, setScannedDevices] = useState<ScannedDevice[]>([]);
  const [activeBeltId, setActiveBeltId] = useState<string | null>(null);
  const [activeBackendId, setActiveBackendId] = useState<string | null>(null);
  const [bleConnected, setBleConnected] = useState(false);

  const loadSavedBelts = useCallback(async () => {
    const belts = await getSavedBelts();
    setSavedBelts(belts);
  }, []);

  useEffect(() => {
    loadSavedBelts();
    bluetoothService.setConnectionCallback((connected, name) => {
      setBleConnected(connected);
    });
    return () => bluetoothService.setConnectionCallback(null);
  }, [loadSavedBelts]);

  const handleScan = async () => {
    setScanning(true);
    setScannedDevices([]);
    try {
      const devices = await bluetoothService.scanAllDevices(12000);
      setScannedDevices(devices);
      if (devices.length === 0) {
        Alert.alert(
          'Scan Complete',
          'No Bluetooth devices found. Ensure nearby devices have Bluetooth enabled and are discoverable.'
        );
      }
    } catch (err: any) {
      Alert.alert('Scan Failed', err.message || 'Unable to scan for Bluetooth devices.');
    } finally {
      setScanning(false);
    }
  };

  const connectBelt = async (device: { id: string; name: string; type: SavedBelt['type'] }) => {
    setConnectingId(device.id);
    try {
      await bluetoothService.connectByAddress(device.id, device.name);
      const battery = await bluetoothService.readBatteryLevel();

      let backendDeviceId: string | undefined;
      const existing = savedBelts.find((b) => b.id === device.id);

      if (existing?.backendDeviceId) {
        backendDeviceId = existing.backendDeviceId;
        await contractionApi.updateDeviceStatus(backendDeviceId, 'online').catch(() => {});
      } else {
        const result = await contractionApi.syncDevice({
          serialNumber: device.id,
          name: device.name,
          firmwareVersion: '1.0.0',
          batteryLevel: battery ?? 100,
          capabilities: ['adc', 'flex_percent', 'intensity'],
        });
        backendDeviceId = result.device._id;
      }

      await saveConnectedBelt({
        id: device.id,
        name: device.name,
        type: device.type,
        backendDeviceId,
        lastConnectedAt: new Date().toISOString(),
      });

      if (backendDeviceId) {
        await updateBeltBackendId(device.id, backendDeviceId);
      }

      setActiveBeltId(device.id);
      setActiveBackendId(backendDeviceId || null);
      setBleConnected(true);
      await loadSavedBelts();

      Alert.alert('Connected', `"${device.name}" is paired and ready for calibration.`);
    } catch (err: any) {
      Alert.alert('Connection Failed', err.response?.data?.error || err.message || 'Could not connect.');
      await bluetoothService.disconnect();
    } finally {
      setConnectingId(null);
    }
  };

  const handleDisconnect = async () => {
    await bluetoothService.disconnect();
    setActiveBeltId(null);
    setActiveBackendId(null);
    setBleConnected(false);
  };

  const handleForgetBelt = async (belt: SavedBelt) => {
    Alert.alert('Remove Belt', `Remove "${belt.name}" from previously connected devices?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          if (activeBeltId === belt.id) await handleDisconnect();
          await removeSavedBelt(belt.id);
          await loadSavedBelts();
        },
      },
    ]);
  };

  const renderSavedBelt = ({ item }: { item: SavedBelt }) => {
    const isActive = activeBeltId === item.id;
    const isConnecting = connectingId === item.id;
    const lastSeen = `${formatSessionDate(item.lastConnectedAt)} ${formatClockTime(item.lastConnectedAt)}`;

    return (
      <Card style={[styles.deviceCard, ...(isActive ? [styles.pairedCard] : [])]}>
        <View style={styles.deviceHeader}>
          <View style={{ flex: 1 }}>
            <Subheading style={styles.deviceName}>{item.name}</Subheading>
            <Caption>{item.id} · {item.type.toUpperCase()}</Caption>
            <Caption style={styles.lastSeen}>Last connected: {lastSeen}</Caption>
          </View>
          <View style={[styles.statusTag, isActive && bleConnected ? styles.onlineTag : styles.offlineTag]}>
            <Caption style={isActive && bleConnected ? styles.onlineText : styles.offlineText}>
              {isActive && bleConnected ? 'Connected' : 'Saved'}
            </Caption>
          </View>
        </View>
        <View style={styles.btnRow}>
          <Button
            title={isActive && bleConnected ? 'Disconnect' : isConnecting ? 'Connecting...' : 'Reconnect'}
            variant={isActive && bleConnected ? 'outline' : 'primary'}
            onPress={() => {
              if (isActive && bleConnected) handleDisconnect();
              else connectBelt(item);
            }}
            disabled={isConnecting}
            style={styles.flexBtn}
          />
          <Button title="Remove" variant="outline" size="small" onPress={() => handleForgetBelt(item)} style={styles.removeBtn} />
        </View>
      </Card>
    );
  };

  const renderScannedDevice = ({ item }: { item: ScannedDevice }) => {
    const isConnecting = connectingId === item.id;
    const alreadySaved = savedBelts.some((b) => b.id === item.id);

    return (
      <Card style={styles.deviceCard}>
        <View style={styles.deviceHeader}>
          <View>
            <Subheading style={styles.deviceName}>{item.name}</Subheading>
            <Caption>{item.address} · {item.type.toUpperCase()}</Caption>
          </View>
          {alreadySaved && (
            <Caption style={styles.savedHint}>Previously connected</Caption>
          )}
        </View>
        <Button
          title={isConnecting ? 'Connecting...' : 'Connect'}
          onPress={() => connectBelt(item)}
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
          Scan for Bluetooth Classic and BLE devices. Only belts you have connected before appear under Previously Connected.
        </BodyText>
      </View>

      <View style={styles.scanSection}>
        <Button
          title={scanning ? 'Scanning Classic + BLE...' : 'Scan for Bluetooth Devices'}
          onPress={handleScan}
          loading={scanning}
        />
      </View>

      <FlatList
        data={[]}
        renderItem={() => null}
        ListHeaderComponent={
          <>
            {savedBelts.length > 0 && (
              <View style={styles.section}>
                <Subheading style={styles.sectionLabel}>Previously Connected</Subheading>
                {savedBelts.map((belt) => (
                  <View key={belt.id}>{renderSavedBelt({ item: belt })}</View>
                ))}
              </View>
            )}

            {scannedDevices.length > 0 && (
              <View style={styles.section}>
                <Subheading style={styles.sectionLabel}>Nearby Devices</Subheading>
                {scannedDevices.map((device) => (
                  <View key={device.id}>{renderScannedDevice({ item: device })}</View>
                ))}
              </View>
            )}

            {savedBelts.length === 0 && scannedDevices.length === 0 && !scanning && (
              <View style={styles.emptyContainer}>
                <Caption style={styles.emptyText}>
                  No belts connected yet. Tap Scan to find Bluetooth devices nearby.
                </Caption>
              </View>
            )}

            {scanning && (
              <ActivityIndicator size="large" color={Theme.colors.primary} style={styles.spinner} />
            )}
          </>
        }
        contentContainerStyle={styles.listContainer}
      />

      {activeBackendId && bleConnected && (
        <View style={styles.bottomSection}>
          <Button
            title="Proceed to Calibration"
            onPress={() => navigation.navigate('CalibrationWizard', { deviceId: activeBackendId })}
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
  section: { paddingHorizontal: Theme.spacing.xl, marginBottom: Theme.spacing.sm },
  sectionLabel: { color: Theme.colors.text, marginBottom: Theme.spacing.sm },
  listContainer: { paddingBottom: 100 },
  spinner: { marginVertical: Theme.spacing.xl },
  deviceCard: { padding: Theme.spacing.lg, marginBottom: Theme.spacing.sm },
  pairedCard: { borderColor: Theme.colors.primary, borderWidth: Theme.borders.width.medium },
  deviceHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  deviceName: { color: Theme.colors.text },
  lastSeen: { marginTop: 4 },
  statusTag: { paddingHorizontal: Theme.spacing.sm, paddingVertical: Theme.spacing.xs, borderRadius: Theme.borders.radius.sm },
  onlineTag: { backgroundColor: Theme.colors.accentLight },
  offlineTag: { backgroundColor: Theme.colors.primaryLight },
  onlineText: { color: Theme.colors.accent, fontWeight: Theme.typography.weights.semibold },
  offlineText: { color: Theme.colors.textSecondary },
  savedHint: { color: Theme.colors.accent },
  btnRow: { flexDirection: 'row', marginTop: Theme.spacing.sm, gap: Theme.spacing.sm },
  flexBtn: { flex: 1 },
  removeBtn: { minWidth: 80 },
  connectButton: { marginTop: Theme.spacing.sm },
  emptyContainer: { alignItems: 'center', paddingVertical: 40, paddingHorizontal: Theme.spacing.xl },
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
});

export default DeviceConnectionScreen;
