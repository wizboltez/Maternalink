import { BleManager, Device, Characteristic, State } from 'react-native-ble-plx';
import { PermissionsAndroid, Platform } from 'react-native';

// Maternalink Smart Belt BLE identifiers (ESP32 firmware)
export const MATERNALINK_SERVICE_UUID = '4fafc201-1fb5-459e-8fcc-c5c5c6b0bf00';
export const TELEMETRY_CHARACTERISTIC_UUID = 'beb5483e-36e1-4688-b7f5-ea07361b26a8';
export const BATTERY_CHARACTERISTIC_UUID = 'beb5483e-36e1-4688-b7f5-ea07361b26a9';

export interface BeltTelemetry {
  rawAdc?: number;
  flexPercent?: number;
  intensity?: number;
  batteryLevel?: number;
}

type TelemetryCallback = (data: BeltTelemetry) => void;
type ConnectionCallback = (connected: boolean, deviceName?: string) => void;

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
    const chr1 = (enc1 << 2) | (enc2 >> 4);
    const chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
    const chr3 = ((enc3 & 3) << 6) | enc4;
    output += String.fromCharCode(chr1);
    if (enc3 !== 64) output += String.fromCharCode(chr2);
    if (enc4 !== 64) output += String.fromCharCode(chr3);
  }
  return output;
}

class BluetoothService {
  private manager: BleManager | null = null;
  private connectedDevice: Device | null = null;
  private telemetrySubscription: { remove: () => void } | null = null;
  private onTelemetry: TelemetryCallback | null = null;
  private onConnectionChange: ConnectionCallback | null = null;

  constructor() {
    try {
      this.manager = new BleManager();
    } catch (e) {
      console.warn('BluetoothService: Native BleManager not available. Bluetooth features will be disabled (fallback mode enabled for Expo Go).', e);
      this.manager = null;
    }
  }

  setTelemetryCallback(cb: TelemetryCallback | null) {
    this.onTelemetry = cb;
  }

  setConnectionCallback(cb: ConnectionCallback | null) {
    this.onConnectionChange = cb;
  }

  async requestPermissions(): Promise<boolean> {
    if (Platform.OS !== 'android') {
      return true;
    }

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
    if (!this.manager) return false;
    try {
      const state = await this.manager.state();
      return state === State.PoweredOn;
    } catch {
      return false;
    }
  }

  async scanForDevices(
    onDeviceFound: (device: Device) => void,
    timeoutMs = 12000
  ): Promise<void> {
    if (!this.manager) {
      throw new Error('Bluetooth scan is not supported in this environment (Expo Go). Please run the native development build or record manually.');
    }
    const enabled = await this.isBluetoothEnabled();
    if (!enabled) {
      throw new Error('Bluetooth is turned off. Please enable it in your device settings.');
    }

    const hasPermission = await this.requestPermissions();
    if (!hasPermission) {
      throw new Error('Bluetooth permissions are required to scan for the maternal belt.');
    }

    return new Promise((resolve, reject) => {
      const discovered = new Set<string>();

      this.manager!.startDeviceScan(
        [MATERNALINK_SERVICE_UUID],
        { allowDuplicates: false },
        (error, device) => {
          if (error) {
            this.manager!.stopDeviceScan();
            reject(error);
            return;
          }
          if (!device || !device.id || discovered.has(device.id)) {
            return;
          }

          const name = device.name || device.localName || '';
          if (
            name.toLowerCase().includes('maternalink') ||
            name.toLowerCase().includes('maternal') ||
            name.toLowerCase().includes('smb') ||
            name.toLowerCase().includes('esp32')
          ) {
            discovered.add(device.id);
            onDeviceFound(device);
          }
        }
      );

      setTimeout(() => {
        this.manager!.stopDeviceScan();
        resolve();
      }, timeoutMs);
    });
  }

  async connect(device: Device): Promise<Device> {
    await this.disconnect();

    const connected = await device.connect({ timeout: 15000 });
    await connected.discoverAllServicesAndCharacteristics();
    this.connectedDevice = connected;
    this.onConnectionChange?.(true, connected.name || connected.localName || 'Smart Belt');

    await this.subscribeToTelemetry(connected);
    return connected;
  }

  private async subscribeToTelemetry(device: Device): Promise<void> {
    this.telemetrySubscription?.remove();

    this.telemetrySubscription = device.monitorCharacteristicForService(
      MATERNALINK_SERVICE_UUID,
      TELEMETRY_CHARACTERISTIC_UUID,
      (error, characteristic) => {
        if (error || !characteristic?.value) {
          return;
        }
        const parsed = this.parseTelemetry(characteristic);
        if (parsed) {
          this.onTelemetry?.(parsed);
        }
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
    if (!this.connectedDevice) {
      return null;
    }
    try {
      const char = await this.connectedDevice.readCharacteristicForService(
        MATERNALINK_SERVICE_UUID,
        BATTERY_CHARACTERISTIC_UUID
      );
      if (!char.value) {
        return null;
      }
      const level = parseInt(decodeBleValue(char.value), 10);
      return isNaN(level) ? null : level;
    } catch {
      return null;
    }
  }

  getConnectedDevice(): Device | null {
    return this.connectedDevice;
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
        // Device may already be disconnected
      }
      this.connectedDevice = null;
      this.onConnectionChange?.(false);
    }
  }

  destroy(): void {
    this.disconnect();
    this.manager?.destroy();
  }
}

export const bluetoothService = new BluetoothService();
export default bluetoothService;
