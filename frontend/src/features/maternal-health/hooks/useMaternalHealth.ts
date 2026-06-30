/**
 * useMaternalHealth — Main orchestration hook for the Maternal Health Monitoring feature.
 *
 * Subscribes to BLE telemetry from the Smart Belt, runs all sensor data through
 * the local ProcessingEngine, stores snapshots via healthLocalStore,
 * evaluates alerts via alertEngine, and queues sync batches for cloud upload.
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import bluetoothService, { BeltTelemetry } from '../../../core/services/bluetoothService';
import processingEngine, { HealthSnapshot } from '../services/processingEngine';
import { HealthStatus, ActivityType, ContractionPhase } from '../services/sensorProcessors';
import healthLocalStore from '../services/healthLocalStore';
import alertEngine, { ActiveAlert } from '../services/alertEngine';
import cloudSyncService, { SyncStatus } from '../services/cloudSyncService';
import syncQueueManager from '../services/syncQueueManager';

export interface MaternalHealthState {
  // Connection
  isConnected: boolean;
  batteryLevel: number | null;
  // Heart Rate
  heartRate: number | null;
  heartRateStatus: HealthStatus;
  heartRateHistory: number[];
  // SpO2
  spO2: number | null;
  spO2Status: HealthStatus;
  spO2History: number[];
  // Temperature
  temperature: number | null;
  temperatureStatus: HealthStatus;
  temperatureHistory: number[];
  // Stress
  stressScore: number | null;
  stressStatus: HealthStatus;
  stressHistory: number[];
  // Activity
  activity: ActivityType;
  fallDetected: boolean;
  isSleeping: boolean;
  // Contractions
  contractionActive: boolean;
  contractionPhase: ContractionPhase;
  contractionIntensity: number;
  contractionDuration: number;
  contractionInterval: number;
  contractionFrequency: number;
  flexHistory: number[];
  // Alerts
  activeAlerts: ActiveAlert[];
  // Sync
  syncStatus: SyncStatus;
  // Time labels for charts
  timeLabels: string[];
}

const MAX_HISTORY_POINTS = 60; // Keep last 60 data points for charts

export const useMaternalHealth = () => {
  // Connection state
  const [isConnected, setIsConnected] = useState(false);
  const [batteryLevel, setBatteryLevel] = useState<number | null>(null);

  // Vital signs
  const [heartRate, setHeartRate] = useState<number | null>(null);
  const [heartRateStatus, setHeartRateStatus] = useState<HealthStatus>('normal');
  const [spO2, setSpO2] = useState<number | null>(null);
  const [spO2Status, setSpO2Status] = useState<HealthStatus>('normal');
  const [temperature, setTemperature] = useState<number | null>(null);
  const [temperatureStatus, setTemperatureStatus] = useState<HealthStatus>('normal');
  const [stressScore, setStressScore] = useState<number | null>(null);
  const [stressStatus, setStressStatus] = useState<HealthStatus>('normal');

  // Activity
  const [activity, setActivity] = useState<ActivityType>('unknown');
  const [fallDetected, setFallDetected] = useState(false);
  const [isSleeping, setIsSleeping] = useState(false);

  // Contractions
  const [contractionActive, setContractionActive] = useState(false);
  const [contractionPhase, setContractionPhase] = useState<ContractionPhase>('none');
  const [contractionIntensity, setContractionIntensity] = useState(0);
  const [contractionDuration, setContractionDuration] = useState(0);
  const [contractionInterval, setContractionInterval] = useState(0);
  const [contractionFrequency, setContractionFrequency] = useState(0);

  // Chart history buffers
  const [heartRateHistory, setHeartRateHistory] = useState<number[]>([]);
  const [spO2History, setSpO2History] = useState<number[]>([]);
  const [temperatureHistory, setTemperatureHistory] = useState<number[]>([]);
  const [stressHistory, setStressHistory] = useState<number[]>([]);
  const [flexHistory, setFlexHistory] = useState<number[]>([]);
  const [timeLabels, setTimeLabels] = useState<string[]>([]);

  // Alerts
  const [activeAlerts, setActiveAlerts] = useState<ActiveAlert[]>([]);

  // Sync
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    lastSyncTime: null,
    pendingBatches: 0,
    isSyncing: false,
    lastError: null,
  });

  const isProcessingRef = useRef(false);
  const snapshotBufferRef = useRef<HealthSnapshot[]>([]);
  const lastRefreshTimeRef = useRef<number>(Date.now());

  // Process incoming BLE telemetry
  const handleTelemetry = useCallback((telemetry: BeltTelemetry) => {
    if (isProcessingRef.current) return;
    isProcessingRef.current = true;

    try {
      // Run through processing engine
      const snapshot = processingEngine.process(telemetry);
      snapshotBufferRef.current.push(snapshot);

      const now = Date.now();
      // Clean up old entries (keep last 3 minutes max in buffer)
      const threeMinsAgo = now - 180000;
      snapshotBufferRef.current = snapshotBufferRef.current.filter(s => s.timestamp >= threeMinsAgo);

      // Check if 2 minutes (120000 ms) have passed since last refresh
      if (now - lastRefreshTimeRef.current >= 120000) {
        lastRefreshTimeRef.current = now;

        // Take entries from the last 1min 40sec (100 seconds)
        const hundredSecsAgo = now - 100000;
        const targetSnapshots = snapshotBufferRef.current.filter(s => s.timestamp >= hundredSecsAgo);

        if (targetSnapshots.length > 0) {
          // Calculate mean snapshot
          const aggregated = computeAggregatedSnapshot(targetSnapshots);

          // Update vital signs state
          if (aggregated.heartRate != null) {
            setHeartRate(aggregated.heartRate);
            setHeartRateStatus(aggregated.heartRateStatus);
            setHeartRateHistory(prev => [...prev, aggregated.heartRate!].slice(-MAX_HISTORY_POINTS));
          }
          if (aggregated.spO2 != null) {
            setSpO2(aggregated.spO2);
            setSpO2Status(aggregated.spO2Status);
            setSpO2History(prev => [...prev, aggregated.spO2!].slice(-MAX_HISTORY_POINTS));
          }
          if (aggregated.temperature != null) {
            setTemperature(aggregated.temperature);
            setTemperatureStatus(aggregated.temperatureStatus);
            setTemperatureHistory(prev => [...prev, aggregated.temperature!].slice(-MAX_HISTORY_POINTS));
          }
          if (aggregated.stressScore != null) {
            setStressScore(aggregated.stressScore);
            setStressStatus(aggregated.stressStatus);
            setStressHistory(prev => [...prev, aggregated.stressScore!].slice(-MAX_HISTORY_POINTS));
          }

          // Update activity
          setActivity(aggregated.activity);
          setFallDetected(aggregated.fallDetected);
          setIsSleeping(aggregated.isSleeping);

          // Update contractions
          setContractionActive(aggregated.contractionActive);
          setContractionPhase(aggregated.contractionPhase);
          setContractionIntensity(aggregated.contractionIntensity);
          setContractionDuration(aggregated.contractionDuration);
          setContractionInterval(aggregated.contractionInterval);
          setContractionFrequency(aggregated.contractionFrequency);
          setFlexHistory(prev => [...prev, aggregated.smoothedFlex].slice(-MAX_HISTORY_POINTS));

          // Update battery
          if (aggregated.batteryLevel != null) {
            setBatteryLevel(aggregated.batteryLevel);
          }

          // Time label
          const timeStr = new Date().toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          });
          setTimeLabels(prev => [...prev, timeStr].slice(-MAX_HISTORY_POINTS));

          // Evaluate alerts
          const fired = alertEngine.evaluate(aggregated);
          if (fired.length > 0) {
            setActiveAlerts(prev => [...fired, ...prev].slice(0, 20));
          }

          // Store snapshot locally
          healthLocalStore.storeSnapshot(aggregated);

          // Add to sync batch
          syncQueueManager.addReading(aggregated);
        }
      }
    } catch (error) {
      console.error('Error processing telemetry:', error);
    } finally {
      isProcessingRef.current = false;
    }
  }, []);

  // Setup BLE subscription and sync services
  useEffect(() => {
    // Subscribe to BLE telemetry
    bluetoothService.setTelemetryCallback(handleTelemetry);

    // Monitor connection state
    bluetoothService.setConnectionCallback((connected, deviceName) => {
      setIsConnected(connected);
      if (connected && deviceName) {
        syncQueueManager.setDeviceId(deviceName);
      }
    });

    // Start auto-batching and periodic sync
    syncQueueManager.startAutoBatching();
    cloudSyncService.startPeriodicSync();

    // Purge old data on startup
    healthLocalStore.purgeOldData();

    // Refresh sync status periodically
    const statusInterval = setInterval(async () => {
      const status = await cloudSyncService.getStatus();
      setSyncStatus(status);
    }, 10000);

    // Check initial connection state
    setIsConnected(bluetoothService.isConnected());

    return () => {
      bluetoothService.setTelemetryCallback(null);
      bluetoothService.setConnectionCallback(null);
      syncQueueManager.stopAutoBatching();
      cloudSyncService.stopPeriodicSync();
      clearInterval(statusInterval);
    };
  }, [handleTelemetry]);

  // Dismiss an alert
  const dismissAlert = useCallback((index: number) => {
    setActiveAlerts(prev => prev.filter((_, i) => i !== index));
  }, []);

  // Force sync now
  const forceSyncNow = useCallback(async () => {
    await syncQueueManager.flushBatch();
    await cloudSyncService.attemptSync();
    const status = await cloudSyncService.getStatus();
    setSyncStatus(status);
  }, []);

  // Get historical data from local store
  const getHistory = useCallback(async (hours: number) => {
    return healthLocalStore.getHistory(hours);
  }, []);

  // Get stored alerts
  const getAlertHistory = useCallback(async (limit = 50) => {
    return healthLocalStore.getAlerts(limit);
  }, []);

  return {
    // Connection
    isConnected,
    batteryLevel,
    // Vitals
    heartRate,
    heartRateStatus,
    heartRateHistory,
    spO2,
    spO2Status,
    spO2History,
    temperature,
    temperatureStatus,
    temperatureHistory,
    stressScore,
    stressStatus,
    stressHistory,
    // Activity
    activity,
    fallDetected,
    isSleeping,
    // Contractions
    contractionActive,
    contractionPhase,
    contractionIntensity,
    contractionDuration,
    contractionInterval,
    contractionFrequency,
    flexHistory,
    // Alerts
    activeAlerts,
    dismissAlert,
    // Sync
    syncStatus,
    forceSyncNow,
    // Chart labels
    timeLabels,
    // History access
    getHistory,
    getAlertHistory,
  };
};

function computeAggregatedSnapshot(snapshots: HealthSnapshot[]): HealthSnapshot {
  const latest = snapshots[snapshots.length - 1];
  const mean = (arr: number[]) => arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : null;
  const numArr = (key: keyof HealthSnapshot) => snapshots.map(s => s[key] as number).filter(v => v != null);

  const hrArr = numArr('heartRate');
  const spO2Arr = numArr('spO2');
  const tempArr = numArr('temperature');
  const stressArr = numArr('stressScore');
  const batteryArr = numArr('batteryLevel');

  const heartRate = hrArr.length > 0 ? Math.round(mean(hrArr)!) : null;
  const spO2 = spO2Arr.length > 0 ? Math.round(mean(spO2Arr)!) : null;
  const temperature = tempArr.length > 0 ? parseFloat(mean(tempArr)!.toFixed(1)) : null;
  const stressScore = stressArr.length > 0 ? Math.round(mean(stressArr)!) : null;
  const batteryLevel = batteryArr.length > 0 ? Math.round(mean(batteryArr)!) : latest.batteryLevel;

  const getMode = (arr: any[]) => arr.sort((a,b) => arr.filter(v => v===a).length - arr.filter(v => v===b).length).pop();

  return {
    timestamp: latest.timestamp,
    batteryLevel,
    heartRate,
    heartRateStatus: heartRate ? classifyHR(heartRate) : latest.heartRateStatus,
    spO2,
    spO2Status: spO2 ? classifySpO2(spO2) : latest.spO2Status,
    temperature,
    temperatureStatus: temperature ? classifyTemp(temperature) : latest.temperatureStatus,
    stressScore,
    stressStatus: stressScore ? classifyStress(stressScore) : latest.stressStatus,
    activity: getMode(snapshots.map(s => s.activity)),
    fallDetected: snapshots.some(s => s.fallDetected),
    isSleeping: getMode(snapshots.map(s => s.isSleeping)),
    accelMagnitude: latest.accelMagnitude,
    contractionActive: snapshots.some(s => s.contractionActive),
    contractionPhase: getMode(snapshots.map(s => s.contractionPhase)),
    contractionIntensity: latest.contractionIntensity,
    contractionDuration: Math.max(...snapshots.map(s => s.contractionDuration)),
    contractionInterval: Math.max(...snapshots.map(s => s.contractionInterval)),
    contractionFrequency: latest.contractionFrequency,
    smoothedFlex: latest.smoothedFlex,
    flex1Raw: latest.flex1Raw,
    flex2Raw: latest.flex2Raw,
    gsrRaw: latest.gsrRaw
  };
}

function classifyHR(bpm: number): HealthStatus {
  if (bpm < 50 || bpm > 120) return 'urgent';
  if (bpm < 60 || bpm > 100) return 'attention';
  return 'normal';
}
function classifySpO2(spo2: number): HealthStatus {
  if (spo2 < 92) return 'urgent';
  if (spo2 < 95) return 'attention';
  return 'normal';
}
function classifyTemp(temp: number): HealthStatus {
  if (temp < 35.5 || temp > 38.0) return 'urgent';
  if (temp < 36.1 || temp > 37.5) return 'attention';
  return 'normal';
}
function classifyStress(stress: number): HealthStatus {
  if (stress > 70) return 'urgent';
  if (stress > 40) return 'attention';
  return 'normal';
}

export default useMaternalHealth;
