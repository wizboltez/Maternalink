import { NativeModules, Platform, PermissionsAndroid } from 'react-native';
import { BleManager, Device, Characteristic, State } from 'react-native-ble-plx';

export const MATERNALINK_SERVICE_UUID = '4fafc201-1fb5-459e-8fcc-c5c5c6b0bf00';
export const TELEMETRY_CHARACTERISTIC_UUID = 'beb5483e-36e1-4688-b7f5-ea07361b26a8';
export const BATTERY_CHARACTERISTIC_UUID = 'beb5483e-36e1-4688-b7f5-ea07361b26a9';

export interface ScannedDevice {
  id: string;
  name: string;
  address: string;
  type: 'ble' | 'classic' | 'dual';
}

export interface BeltTelemetry {
  rawAdc?: number;
  flexPercent?: number;
  intensity?: number;
  batteryLevel?: number;
}

type TelemetryCallback = (data: BeltTelemetry) => void;
type ConnectionCallback = (connected: boolean, deviceName?: string) => void;

const { BluetoothScanModule } = NativeModules;

function decodeBleValue(base64: string): string {
  if (typeof globalThis.atob === 'function') {
    return globalThis.atob(base64);
  }
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
  let output = '';
  let i = 0;
  const input = base64.replace(/[^A-Za-z0-9+/=]/g, '');
  while (i < input.length) {
    const enc1 = chars.indexOf(input.charAt(i++));
    const enc2 = chars.indexOf(input.charAt(i++));
    const enc3 = chars.indexOf(input.charAt(i++));
    const enc4 = chars.indexOf(input.charAt(i++));
    output += String.fromCharCode((enc1 << 2) | (enc2 >> 4));
    if (enc3 !== 64) output += String.fromCharCode(((enc2 & 15) << 4) | (enc3 >> 2));
    if (enc4 !== 64) output += String.fromCharCode(((enc3 & 3) << 6) | enc4);
  }
  return output;
}

class BluetoothService {
  private bleManager: BleManager;
  private connectedDevice: Device | null = null;
  private telemetrySubscription: { remove: () => void } | null = null;
  private onTelemetry: TelemetryCallback | null = null;
  private onConnectionChange: ConnectionCallback | null = null;
  private connectedDeviceName: string | null = null;

  constructor() {
    this.bleManager = new BleManager();
  }

  setTelemetryCallback(cb: TelemetryCallback | null) {
    this.onTelemetry = cb;
  }

  setConnectionCallback(cb: ConnectionCallback | null) {
    this.onConnectionChange = cb;
  }

  async requestPermissions(): Promise<boolean> {
    if (Platform.OS !== 'android') return true;

    const apiLevel = Platform.Version as number;
    if (apiLevel >= 31) {
      const results = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      ]);
      return (
        results[PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN] === PermissionsAndroid.RESULTS.GRANTED &&
        results[PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT] === PermissionsAndroid.RESULTS.GRANTED
      );
    }

    const location = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
    );
    return location === PermissionsAndroid.RESULTS.GRANTED;
  }

  async isBluetoothEnabled(): Promise<boolean> {
    if (Platform.OS === 'android' && BluetoothScanModule?.isBluetoothEnabled) {
      return BluetoothScanModule.isBluetoothEnabled();
    }
    const state = await this.bleManager.state();
    return state === State.PoweredOn;
  }

  /** Scan classic + BLE devices using Android BluetoothManager / BluetoothAdapter */
  async scanAllDevices(timeoutMs = 12000): Promise<ScannedDevice[]> {
    const enabled = await this.isBluetoothEnabled();
    if (!enabled) {
      throw new Error('Bluetooth is turned off. Please enable it in Settings.');
    }

    const hasPermission = await this.requestPermissions();
    if (!hasPermission) {
      throw new Error('Bluetooth permissions are required to scan for devices.');
    }

    if (Platform.OS === 'android' && BluetoothScanModule?.startScan) {
      const results = await BluetoothScanModule.startScan(timeoutMs);
      return (results || []).map((d: ScannedDevice) => ({
        id: d.id || d.address,
        name: d.name || 'Unknown Device',
        address: d.address || d.id,
        type: (d.type as ScannedDevice['type']) || 'ble',
      }));
    }

    // iOS fallback: BLE-only via ble-plx
    return new Promise((resolve, reject) => {
      const found = new Map<string, ScannedDevice>();
      this.bleManager.startDeviceScan(null, { allowDuplicates: false }, (error, device) => {
        if (error) {
          this.bleManager.stopDeviceScan();
          reject(error);
          return;
        }
        if (!device?.id) return;
        if (!found.has(device.id)) {
          found.set(device.id, {
            id: device.id,
            name: device.name || device.localName || 'Unknown Device',
            address: device.id,
            type: 'ble',
          });
        }
      });

      setTimeout(() => {
        this.bleManager.stopDeviceScan();
        resolve(Array.from(found.values()));
      }, timeoutMs);
    });
  }

  async connectByAddress(deviceId: string, deviceName: string): Promise<void> {
    await this.disconnect();

    const device = await this.bleManager.connectToDevice(deviceId, { timeout: 15000 });
    await device.discoverAllServicesAndCharacteristics();
    this.connectedDevice = device;
    this.connectedDeviceName = deviceName;
    this.onConnectionChange?.(true, deviceName);
    await this.subscribeToTelemetry(device);
  }

  private async subscribeToTelemetry(device: Device): Promise<void> {
    this.telemetrySubscription?.remove();

    this.telemetrySubscription = device.monitorCharacteristicForService(
      MATERNALINK_SERVICE_UUID,
      TELEMETRY_CHARACTERISTIC_UUID,
      (error, characteristic) => {
        if (error || !characteristic?.value) return;
        const parsed = this.parseTelemetry(characteristic);
        if (parsed) this.onTelemetry?.(parsed);
      }
    );
  }

  private parseTelemetry(characteristic: Characteristic): BeltTelemetry | null {
    try {
      const decoded = decodeBleValue(characteristic.value!);
      const data = JSON.parse(decoded);
      return {
        rawAdc: data.rawAdc ?? data.adc,
        flexPercent: data.flexPercent ?? data.flex,
        intensity: data.intensity,
        batteryLevel: data.batteryLevel ?? data.battery,
      };
    } catch {
      return null;
    }
  }

  async readBatteryLevel(): Promise<number | null> {
    if (!this.connectedDevice) return null;
    try {
      const char = await this.connectedDevice.readCharacteristicForService(
        MATERNALINK_SERVICE_UUID,
        BATTERY_CHARACTERISTIC_UUID
      );
      if (!char.value) return null;
      const level = parseInt(decodeBleValue(char.value), 10);
      return isNaN(level) ? null : level;
    } catch {
      return null;
    }
  }

  getConnectedDeviceId(): string | null {
    return this.connectedDevice?.id ?? null;
  }

  getConnectedDeviceName(): string | null {
    return this.connectedDeviceName;
  }

  isConnected(): boolean {
    return this.connectedDevice !== null;
  }

  async disconnect(): Promise<void> {
    this.telemetrySubscription?.remove();
    this.telemetrySubscription = null;

    if (this.connectedDevice) {
      try {
        await this.connectedDevice.cancelConnection();
      } catch {
        // already disconnected
      }
      this.connectedDevice = null;
      this.connectedDeviceName = null;
      this.onConnectionChange?.(false);
    }
  }

  destroy(): void {
    this.disconnect();
    this.bleManager.destroy();
  }
}

export const bluetoothService = new BluetoothService();
export default bluetoothService;
