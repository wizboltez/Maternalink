import { NativeModules, Platform, PermissionsAndroid } from 'react-native';
import { BleManager, Device, Characteristic, State } from 'react-native-ble-plx';

// Maternalink Smart Belt BLE identifiers (must match ESP32 firmware)
export const MATERNALINK_SERVICE_UUID = '12345678-1234-1234-1234-123456789abc';
export const TELEMETRY_CHARACTERISTIC_UUID = '87654321-4321-4321-4321-cba987654321';
// Battery is read from the telemetry JSON payload (no separate characteristic)
export const BATTERY_CHARACTERISTIC_UUID = '87654321-4321-4321-4321-cba987654321';

export interface BeltTelemetry {
  // Existing fields
  rawAdc?: number;
  flexPercent?: number;
  intensity?: number;
  batteryLevel?: number;
  // NEW — MAX30102 (Heart Rate / SpO2)
  heartRate?: number;
  irValue?: number;
  redValue?: number;
  // NEW — DS18B20 (Temperature)
  temperature?: number;
  // NEW — GSR Sensor
  gsrRaw?: number;
  // NEW — MPU6050 (Accelerometer + Gyroscope)
  accelX?: number;
  accelY?: number;
  accelZ?: number;
  gyroX?: number;
  gyroY?: number;
  gyroZ?: number;
  // NEW — Dual Flex Sensors
  flex1?: number;
  flex2?: number;
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
  private manager: BleManager | null = null;
  private connectedDevice: Device | null = null;
  private telemetrySubscription: { remove: () => void } | null = null;
  private onTelemetry: TelemetryCallback | null = null;
  private onConnectionChange: ConnectionCallback | null = null;
  private connectedDeviceName: string | null = null;

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
      const discovered = new Set<string>();

      // Scan without service UUID filter first — many ESP32 boards don't
      // include the service UUID in their advertisement packets.
      this.manager!.startDeviceScan(
        null,
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
          const serviceUUIDs = device.serviceUUIDs || [];
          const matchesName =
            name.toLowerCase().includes('maternalink') ||
            name.toLowerCase().includes('maternal') ||
            name.toLowerCase().includes('smb') ||
            name.toLowerCase().includes('esp32') ||
            name.toLowerCase().includes('smart belt') ||
            name.toLowerCase().includes('health');
          const matchesUUID = serviceUUIDs.some(
            (uuid: string) => uuid.toLowerCase() === MATERNALINK_SERVICE_UUID.toLowerCase()
          );

          if (matchesName || matchesUUID) {
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
        // Extended sensor data
        heartRate: data.heartRate ?? data.hr,
        irValue: data.irValue ?? data.ir,
        redValue: data.redValue ?? data.red,
        temperature: data.temperature ?? data.temp,
        gsrRaw: data.gsrRaw ?? data.gsr,
        accelX: data.accelX ?? data.ax,
        accelY: data.accelY ?? data.ay,
        accelZ: data.accelZ ?? data.az,
        gyroX: data.gyroX ?? data.gx,
        gyroY: data.gyroY ?? data.gy,
        gyroZ: data.gyroZ ?? data.gz,
        flex1: data.flex1 ?? data.f1,
        flex2: data.flex2 ?? data.f2,
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
    this.manager?.destroy();
  }
}

export const bluetoothService = new BluetoothService();
export default bluetoothService;
