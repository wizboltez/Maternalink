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

  // Process incoming BLE telemetry
  const handleTelemetry = useCallback((telemetry: BeltTelemetry) => {
    if (isProcessingRef.current) return;
    isProcessingRef.current = true;

    try {
      // Run through processing engine
      const snapshot = processingEngine.process(telemetry);

      // Update vital signs state
      if (snapshot.heartRate != null) {
        setHeartRate(snapshot.heartRate);
        setHeartRateStatus(snapshot.heartRateStatus);
        setHeartRateHistory(prev => [...prev, snapshot.heartRate!].slice(-MAX_HISTORY_POINTS));
      }
      if (snapshot.spO2 != null) {
        setSpO2(snapshot.spO2);
        setSpO2Status(snapshot.spO2Status);
        setSpO2History(prev => [...prev, snapshot.spO2!].slice(-MAX_HISTORY_POINTS));
      }
      if (snapshot.temperature != null) {
        setTemperature(snapshot.temperature);
        setTemperatureStatus(snapshot.temperatureStatus);
        setTemperatureHistory(prev => [...prev, snapshot.temperature!].slice(-MAX_HISTORY_POINTS));
      }
      if (snapshot.stressScore != null) {
        setStressScore(snapshot.stressScore);
        setStressStatus(snapshot.stressStatus);
        setStressHistory(prev => [...prev, snapshot.stressScore!].slice(-MAX_HISTORY_POINTS));
      }

      // Update activity
      setActivity(snapshot.activity);
      setFallDetected(snapshot.fallDetected);
      setIsSleeping(snapshot.isSleeping);

      // Update contractions
      setContractionActive(snapshot.contractionActive);
      setContractionPhase(snapshot.contractionPhase);
      setContractionIntensity(snapshot.contractionIntensity);
      setContractionDuration(snapshot.contractionDuration);
      setContractionInterval(snapshot.contractionInterval);
      setContractionFrequency(snapshot.contractionFrequency);
      setFlexHistory(prev => [...prev, snapshot.smoothedFlex].slice(-MAX_HISTORY_POINTS));

      // Update battery
      if (snapshot.batteryLevel != null) {
        setBatteryLevel(snapshot.batteryLevel);
      }

      // Time label
      const timeStr = new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
      setTimeLabels(prev => [...prev, timeStr].slice(-MAX_HISTORY_POINTS));

      // Evaluate alerts
      const fired = alertEngine.evaluate(snapshot);
      if (fired.length > 0) {
        setActiveAlerts(prev => [...fired, ...prev].slice(0, 20));
      }

      // Store snapshot locally
      healthLocalStore.storeSnapshot(snapshot);

      // Add to sync batch
      syncQueueManager.addReading(snapshot);
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

export default useMaternalHealth;
