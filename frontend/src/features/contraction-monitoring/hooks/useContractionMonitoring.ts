import { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import voiceSpeechEngine from '../services/voiceSpeechEngine';
import contractionApi from '../api/contractionApi';
import bluetoothService from '../../../core/services/bluetoothService';
import { SOCKET_URL } from '../../../core/config/api';
import { ContractionAnalyzer } from '../../maternal-health/services/sensorProcessors';

export interface ContractionEvent {
  timestamp: string;
  duration: number;
  intensity: number;
  interval?: number;
  isConfirmed: boolean;
}

export const useContractionMonitoring = (
  sessionId: string | null,
  deviceId: string | null,
  initialCalibrationConfidence = 100
) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isBleConnected, setIsBleConnected] = useState(bluetoothService.isConnected());
  const [batteryLevel, setBatteryLevel] = useState<number | null>(null);
  const [currentReading, setCurrentReading] = useState<{
    rawAdc?: number;
    flexPercent: number;
    intensity: number;
    phase: 'none' | 'rise' | 'peak' | 'fall';
  } | null>(null);

  // Time-series buffers for graphs (clamped to last 50 points)
  const [adcBuffer, setAdcBuffer] = useState<number[]>([]);
  const [flexBuffer, setFlexBuffer] = useState<number[]>([]);
  const [intensityBuffer, setIntensityBuffer] = useState<number[]>([]);
  const [timeLabels, setTimeLabels] = useState<string[]>([]);

  // Detected contractions
  const [contractions, setContractions] = useState<ContractionEvent[]>([]);
  const [rollingFrequency, setRollingFrequency] = useState<number>(0);
  const [activeAlert, setActiveAlert] = useState<{ type: string; message: string } | null>(null);

  // Voice States
  const [isMuted, setIsMuted] = useState(voiceSpeechEngine.getMutedState());
  const [voiceVolume, setVoiceVolume] = useState(voiceSpeechEngine.getVolumeState());

  // Manual Confirmation Mode triggers
  const [showManualRecommendation, setShowManualRecommendation] = useState(false);
  const [manualStartTime, setManualStartTime] = useState<Date | null>(null);
  const [isManualRecordingActive, setIsManualRecordingActive] = useState(false);

  const socketRef = useRef<Socket | null>(null);
  const lastPhaseRef = useRef<'none' | 'rise' | 'peak' | 'fall'>('none');

  useEffect(() => {
    if (!sessionId) return;

    // Recommend manual confirmation if calibration confidence is weak
    if (initialCalibrationConfidence < 65) {
      setShowManualRecommendation(true);
    }

    // Connect to WebSocket Server
    const socket = io(SOCKET_URL);
    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
      console.log('✅ Connected to monitoring socket channel.');
      socket.emit('join_session', sessionId);
      voiceSpeechEngine.speak('monitoring_started');
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
      console.log('❌ Disconnected from monitoring socket.');
    });

    // Ingest live reading update from socket (Online Mode)
    socket.on('reading_received', (reading: any) => {
      const { rawAdc, flexPercent, intensity, phase, isContraction, duration, interval, timestamp } = reading;

      setCurrentReading({ rawAdc, flexPercent, intensity, phase });

      const dateStr = new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

      // Update Chart Data Buffers
      setAdcBuffer((prev) => [...prev, rawAdc ?? 0].slice(-40));
      setFlexBuffer((prev) => [...prev, flexPercent ?? 0].slice(-40));
      setIntensityBuffer((prev) => [...prev, intensity ?? 0].slice(-40));
      setTimeLabels((prev) => [...prev, dateStr].slice(-40));

      // Voice guidance based on phase shifts
      if (phase === 'rise' && lastPhaseRef.current === 'none') {
        voiceSpeechEngine.speak('contraction_detected');
      } else if (phase === 'none' && lastPhaseRef.current === 'fall' && isContraction) {
        voiceSpeechEngine.speak('contraction_ended');
      }
      lastPhaseRef.current = phase;

      // Log verified contractions list
      if (isContraction && duration) {
        const event: ContractionEvent = {
          timestamp: new Date(timestamp).toLocaleTimeString(),
          duration,
          intensity,
          interval,
          isConfirmed: false,
        };
        setContractions((prev) => [event, ...prev]);

        // Triggers confirmation overlay request
        voiceSpeechEngine.speak('please_confirm_contraction');
      }
    });

    // Handle Alerts Broadcasters
    socket.on('alert_triggered', (alert: { type: string; message: string }) => {
      setActiveAlert(alert);

      // Play vocal warnings based on alert type
      if (alert.type === 'high_intensity') {
        voiceSpeechEngine.speak('please_remain_still');
      } else if (alert.type === 'frequent_contractions') {
        voiceSpeechEngine.speak('please_confirm_contraction');
      }

      // Auto dismiss after 7 seconds
      setTimeout(() => setActiveAlert((prev) => (prev?.type === alert.type ? null : prev)), 7000);
    });

    socket.on('battery_status', (data: { batteryLevel: number }) => {
      setBatteryLevel(data.batteryLevel);
    });

    socket.on('session_stopped', () => {
      voiceSpeechEngine.speak('monitoring_completed');
    });

    // --- Offline Fallback & BLE Ingestion ---
    const localAnalyzer = new ContractionAnalyzer();

    // Listen to BLE Connection changes
    setIsBleConnected(bluetoothService.isConnected());
    bluetoothService.setConnectionCallback((connected, name) => {
      setIsBleConnected(connected);
      if (connected) {
        voiceSpeechEngine.speak('device_connected');
      } else {
        voiceSpeechEngine.speak('device_disconnected');
      }
    });

    // Forward telemetry to server if online, OR process locally if offline
    bluetoothService.setTelemetryCallback((telemetry) => {
      // 1. Online flow
      if (socket.connected && sessionId) {
        socket.emit('hardware_reading', {
          sessionId,
          rawAdc: telemetry.rawAdc,
          flexPercent: telemetry.flexPercent,
          intensity: telemetry.intensity,
          batteryLevel: telemetry.batteryLevel,
        });
      }

      // 2. Offline flow (runs directly on device without server)
      if (!socket.connected) {
        const rawFlex = telemetry.flexPercent ?? telemetry.flex1 ?? telemetry.flex2 ?? 0;
        const result = localAnalyzer.process(rawFlex, undefined);

        if (result) {
          const timestamp = Date.now();
          const dateStr = new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
          const rawAdcVal = telemetry.rawAdc ?? Math.round(rawFlex * 10);

          setCurrentReading({
            rawAdc: rawAdcVal,
            flexPercent: result.smoothedFlex,
            intensity: result.intensity,
            phase: result.phase,
          });

          setAdcBuffer((prev) => [...prev, rawAdcVal].slice(-40));
          setFlexBuffer((prev) => [...prev, result.smoothedFlex].slice(-40));
          setIntensityBuffer((prev) => [...prev, result.intensity].slice(-40));
          setTimeLabels((prev) => [...prev, dateStr].slice(-40));

          if (telemetry.batteryLevel != null) {
            setBatteryLevel(telemetry.batteryLevel);
          }

          // Local voice guidance and contractions log
          if (result.phase === 'rise' && lastPhaseRef.current === 'none') {
            voiceSpeechEngine.speak('contraction_detected');
          } else if (result.phase === 'none' && lastPhaseRef.current === 'fall') {
            voiceSpeechEngine.speak('contraction_ended');

            const event: ContractionEvent = {
              timestamp: new Date().toLocaleTimeString(),
              duration: result.duration,
              intensity: result.intensity,
              interval: result.interval || undefined,
              isConfirmed: false,
            };
            setContractions((prev) => [event, ...prev]);
            voiceSpeechEngine.speak('please_confirm_contraction');
          }
          lastPhaseRef.current = result.phase;
        }
      }
    });

    return () => {
      bluetoothService.setTelemetryCallback(null);
      bluetoothService.setConnectionCallback(null);
      if (socket) {
        socket.emit('leave_session', sessionId);
        socket.disconnect();
      }
    };
  }, [sessionId, initialCalibrationConfidence]);

  // Voice controls
  const toggleMute = () => {
    const nextState = !isMuted;
    voiceSpeechEngine.setMute(nextState);
    setIsMuted(nextState);
  };

  const changeVolume = (vol: number) => {
    voiceSpeechEngine.setVolume(vol);
    setVoiceVolume(vol);
  };

  // --- Manual Confirmation Mode ---
  const startManualContraction = () => {
    setManualStartTime(new Date());
    setIsManualRecordingActive(true);
    voiceSpeechEngine.speak('recording_in_progress');
  };

  const endManualContraction = async (confirmSave: boolean) => {
    if (!sessionId || !manualStartTime) return;

    setIsManualRecordingActive(false);

    if (confirmSave) {
      const now = new Date();
      const durationSeconds = Math.round((now.getTime() - manualStartTime.getTime()) / 1000);

      // Save manual contraction reading to the backend
      try {
        const response = await contractionApi.postReading(sessionId, {
          source: 'manual',
          isContraction: true,
          isConfirmed: true,
          duration: durationSeconds,
          intensity: 60, // manual average mapping
          timestamp: now.getTime(),
        });

        // Add to local list immediately
        const event: ContractionEvent = {
          timestamp: now.toLocaleTimeString(),
          duration: durationSeconds,
          intensity: 60,
          isConfirmed: true,
        };
        setContractions((prev) => [event, ...prev]);

        console.log('✅ Manual contraction saved:', response);
      } catch (err) {
        console.error('❌ Failed to save manual contraction reading:', err);
      }
    }

    setManualStartTime(null);
  };

  return {
    isConnected: isConnected || isBleConnected,
    batteryLevel,
    currentReading,
    adcBuffer,
    flexBuffer,
    intensityBuffer,
    timeLabels,
    contractions,
    activeAlert,
    isMuted,
    voiceVolume,
    toggleMute,
    changeVolume,
    // Manual Recording flows
    showManualRecommendation,
    dismissManualRecommendation: () => setShowManualRecommendation(false),
    isManualRecordingActive,
    startManualContraction,
    endManualContraction,
  };
};
