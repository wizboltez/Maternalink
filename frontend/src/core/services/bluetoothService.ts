import { NativeModules, Platform, PermissionsAndroid } from 'react-native';
import { BleManager, Device, Characteristic, State } from 'react-native-ble-plx';
import RNBluetoothClassic, { BluetoothDevice } from 'react-native-bluetooth-classic';

// Maternalink Smart Belt BLE identifiers (must match ESP32 firmware)
export const MATERNALINK_SERVICE_UUID = '12345678-1234-1234-1234-123456789abc';
export const TELEMETRY_CHARACTERISTIC_UUID = '87654321-4321-4321-4321-cba987654321';
export const BATTERY_CHARACTERISTIC_UUID = '87654321-4321-4321-4321-cba987654321';

export interface ScannedDevice {
  id: string;
  name: string;
  address: string;
  type: 'ble' | 'classic' | 'dual';
  rssi?: number | null;
}

export interface BeltTelemetry {
  heartRate?: number;
  heartRateValid?: number;
  spo2?: number;
  spo2Valid?: number;
  tempC?: number;
  flex1?: number;
  flex2?: number;
  flexStatus?: string;
  gsr?: number;
  gsrChange?: number;
  motion?: string;
  pitch?: number;
  roll?: number;
  jerk?: number;
  rawAx?: number;
  rawAy?: number;
  rawAz?: number;
  rawGx?: number;
  rawGy?: number;
  rawGz?: number;
  batteryLevel?: number;
}

type TelemetryCallback = (data: BeltTelemetry) => void;
type ConnectionCallback = (connected: boolean, deviceName?: string) => void;

const { BluetoothScanModule } = NativeModules;

const MOCK_SCANNED_DEVICES: ScannedDevice[] = [
  { id: 'mock-ble-001', name: 'Maternalink Smart Belt (BLE)', address: 'AA:BB:CC:DD:EE:01', type: 'ble' },
  { id: 'mock-classic-001', name: 'Maternal Belt Classic', address: 'AA:BB:CC:DD:EE:02', type: 'classic' },
  { id: 'mock-dual-001', name: 'Maternalink Dual-Mode Belt', address: 'AA:BB:CC:DD:EE:03', type: 'dual' },
];

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

function normalizeNativeScanResult(raw: Record<string, string>): ScannedDevice {
  return {
    id: raw.id || raw.address,
    name: raw.name || 'Unknown Device',
    address: raw.address || raw.id,
    type: (raw.type as ScannedDevice['type']) || 'ble',
  };
}

class BluetoothService {
  private manager: BleManager | null = null;
  private connectedDevice: Device | null = null;
  private connectedClassicDevice: BluetoothDevice | null = null;
  private telemetrySubscription: { remove: () => void } | null = null;
  private classicReadSubscription: { remove: () => void } | null = null;
  private dataBuffer = '';
  private onTelemetry: TelemetryCallback | null = null;
  private onConnectionChange: ConnectionCallback | null = null;
  private connectedDeviceName: string | null = null;

  constructor() {
    try {
      this.manager = new BleManager();
    } catch (e) {
      console.warn('BluetoothService: Native BleManager not available.', e);
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
    if (Platform.OS === 'android' && BluetoothScanModule?.isBluetoothEnabled) {
      try {
        return await BluetoothScanModule.isBluetoothEnabled();
      } catch {
        return false;
      }
    }
    if (!this.manager) return false;
    try {
      const state = await this.manager.state();
      return state === State.PoweredOn;
    } catch {
      return false;
    }
  }

  /**
   * Scan for both Classic Bluetooth and BLE devices (Android native module),
   * or return mock devices in simulators / web / Expo Go.
   */
  async scanAllDevices(timeoutMs = 12000): Promise<ScannedDevice[]> {
    if (Platform.OS === 'web' || !this.manager) {
      throw new Error('Bluetooth is not supported in Expo Go. Please build the custom Dev Client (via EAS) to scan for real devices.');
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
      const devices = (results || []).map(normalizeNativeScanResult);
      return devices;
    }

    const discoveredMap = new Map<string, ScannedDevice>();

    // Fetch already connected devices (e.g. if paired via OS settings)
    try {
      if (this.manager) {
        const connected = await this.manager.connectedDevices([MATERNALINK_SERVICE_UUID]);
        for (const device of connected) {
          if (device.id) {
            discoveredMap.set(device.id, {
              id: device.id,
              name: device.name || device.localName || 'Unknown Device',
              address: device.id,
              type: 'ble',
            });
          }
        }
      }
    } catch (e) {
      console.warn('Could not fetch connected BLE devices', e);
    }

    try {
      const paired = await RNBluetoothClassic.getBondedDevices();
      for (const device of paired) {
        if (device.address) {
          discoveredMap.set(device.address, {
            id: device.address,
            name: device.name || 'Unknown Paired Device',
            address: device.address,
            type: 'classic',
          });
        }
      }
    } catch (e) {
      console.warn('Could not fetch Classic paired devices', e);
    }

    await new Promise<void>((resolve, reject) => {
      this.manager!.startDeviceScan(null, { allowDuplicates: true }, (error, device) => {
        if (error) {
          this.manager!.stopDeviceScan();
          reject(error);
          return;
        }
        if (!device?.id) return;

        const name = device.name || device.localName;
        
        if (discoveredMap.has(device.id)) {
          const existing = discoveredMap.get(device.id)!;
          if (name && existing.name === 'Unknown Device') {
            existing.name = name;
          }
          existing.rssi = device.rssi;
          discoveredMap.set(device.id, existing);
        } else {
          discoveredMap.set(device.id, {
            id: device.id,
            name: name || 'Unknown Device',
            address: device.id,
            type: 'ble',
            rssi: device.rssi,
          });
        }
      });

      setTimeout(() => {
        this.manager!.stopDeviceScan();
        resolve();
      }, timeoutMs);
    });

    return Array.from(discoveredMap.values());
  }

  async scanForDevices(
    onDeviceFound: (device: Device) => void,
    timeoutMs = 12000
  ): Promise<void> {
    const allDevices = await this.scanAllDevices(timeoutMs);
    for (const scanned of allDevices) {
      if (scanned.type === 'classic') continue;
      onDeviceFound({
        id: scanned.id,
        name: scanned.name,
        localName: scanned.name,
      } as Device);
    }
  }

  async connectByAddress(deviceId: string, deviceName: string, type: string = 'ble'): Promise<void> {
    await this.disconnect();

    if (type === 'classic') {
      try {
        const device = await RNBluetoothClassic.connectToDevice(deviceId);
        this.connectedClassicDevice = device;
        this.connectedDeviceName = deviceName;
        this.onConnectionChange?.(true, deviceName);
        this.subscribeToClassicTelemetry(device);
        return;
      } catch (err: any) {
        console.warn('Classic connect failed, falling back to BLE if available', err);
      }
    }

    if (!this.manager) {
      throw new Error('BLE is not available in this environment.');
    }
    const device = await this.manager.connectToDevice(deviceId, { timeout: 15000 });
    await device.discoverAllServicesAndCharacteristics();
    this.connectedDevice = device;
    this.connectedDeviceName = deviceName;
    this.onConnectionChange?.(true, deviceName);
    await this.subscribeToTelemetry(device);
  }

  private subscribeToClassicTelemetry(device: BluetoothDevice) {
    this.classicReadSubscription?.remove();
    this.dataBuffer = '';
    
    this.classicReadSubscription = device.onDataReceived((event) => {
      this.dataBuffer += event.data;
      
      // Look for the first '{' and the first '}' after it
      let startIdx = this.dataBuffer.indexOf('{');
      while (startIdx >= 0) {
        let openBraces = 0;
        let endIdx = -1;
        
        // Find the matching closing brace
        for (let i = startIdx; i < this.dataBuffer.length; i++) {
          if (this.dataBuffer[i] === '{') openBraces++;
          else if (this.dataBuffer[i] === '}') openBraces--;
          
          if (openBraces === 0) {
            endIdx = i;
            break;
          }
        }

        if (endIdx >= 0) {
          const jsonStr = this.dataBuffer.substring(startIdx, endIdx + 1);
          this.dataBuffer = this.dataBuffer.substring(endIdx + 1);
          
          try {
            const data = JSON.parse(jsonStr);
            const parsed = {
              heartRate: data.heartRate,
              heartRateValid: data.heartRateValid,
              spo2: data.spo2,
              spo2Valid: data.spo2Valid,
              tempC: data.tempC,
              flex1: data.flex1,
              flex2: data.flex2,
              flexStatus: data.flexStatus,
              gsr: data.gsr,
              gsrChange: data.gsrChange,
              motion: data.motion,
              pitch: data.pitch,
              roll: data.roll,
              jerk: data.jerk,
              rawAx: data.rawAx,
              rawAy: data.rawAy,
              rawAz: data.rawAz,
              rawGx: data.rawGx,
              rawGy: data.rawGy,
              rawGz: data.rawGz,
              batteryLevel: data.batteryLevel ?? data.battery,
            };
            this.onTelemetry?.(parsed);
          } catch (e) {
            // Bad JSON, skip
          }
          
          startIdx = this.dataBuffer.indexOf('{');
        } else {
          // No complete JSON object found yet, wait for more data
          break;
        }
      }
      
      // Prevent buffer from growing infinitely if no '{' is found
      if (this.dataBuffer.length > 5000 && startIdx === -1) {
        this.dataBuffer = '';
      }
    });
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
        heartRate: data.heartRate,
        heartRateValid: data.heartRateValid,
        spo2: data.spo2,
        spo2Valid: data.spo2Valid,
        tempC: data.tempC,
        flex1: data.flex1,
        flex2: data.flex2,
        flexStatus: data.flexStatus,
        gsr: data.gsr,
        gsrChange: data.gsrChange,
        motion: data.motion,
        pitch: data.pitch,
        roll: data.roll,
        jerk: data.jerk,
        rawAx: data.rawAx,
        rawAy: data.rawAy,
        rawAz: data.rawAz,
        rawGx: data.rawGx,
        rawGy: data.rawGy,
        rawGz: data.rawGz,
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
    return this.connectedDevice?.id ?? this.connectedClassicDevice?.address ?? null;
  }

  getConnectedDeviceName(): string | null {
    return this.connectedDeviceName;
  }

  isConnected(): boolean {
    return this.connectedDevice !== null || this.connectedClassicDevice !== null;
  }

  async disconnect(): Promise<void> {
    this.telemetrySubscription?.remove();
    this.telemetrySubscription = null;
    
    this.classicReadSubscription?.remove();
    this.classicReadSubscription = null;

    let disconnected = false;

    if (this.connectedDevice) {
      try {
        await this.connectedDevice.cancelConnection();
      } catch {}
      this.connectedDevice = null;
      disconnected = true;
    }

    if (this.connectedClassicDevice) {
      try {
        await this.connectedClassicDevice.disconnect();
      } catch {}
      this.connectedClassicDevice = null;
      disconnected = true;
    }

    if (disconnected) {
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
