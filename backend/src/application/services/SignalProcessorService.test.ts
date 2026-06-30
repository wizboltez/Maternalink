import { SignalProcessorService, DetectionConfig } from './SignalProcessorService';
import { ICalibrationSession } from '../../infrastructure/database/models';

// Mock mongoose models used in SignalProcessorService
jest.mock('../../infrastructure/database/models', () => {
  return {
    ContractionReading: {
      findOne: jest.fn().mockImplementation(() => ({
        sort: jest.fn().mockResolvedValue(null),
      })),
      countDocuments: jest.fn().mockResolvedValue(2),
    },
    MonitoringSession: {
      findById: jest.fn().mockResolvedValue({ status: 'active', _id: 'mock_session_id' }),
    },
  };
});

describe('SignalProcessorService', () => {
  let mockCalibration: ICalibrationSession;
  let testConfig: DetectionConfig;

  beforeEach(() => {
    jest.clearAllMocks();
    SignalProcessorService.initSessionState('test_session');

    mockCalibration = {
      flexMin: 1000,
      flexMax: 3000,
      baseline: 10, // flex percent baseline
      sensorNoise: 5,
      confidence: 90,
      status: 'success',
      timestamp: new Date(),
    } as any;

    testConfig = {
      riseThreshold: 10.0,
      fallThreshold: 3.0,
      minDurationSeconds: 2, // low for easy testing
      maxDurationSeconds: 10,
      smoothingWindowSize: 1,
    };
  });

  afterEach(() => {
    SignalProcessorService.removeSessionState('test_session');
  });

  describe('processIncomingReading with Raw ADC Normalization', () => {
    it('should correctly normalize ADC value between 0 and 100%', async () => {
      // 2000 ADC is halfway between 1000 and 3000, so flexPercent should be 50%
      const result = await SignalProcessorService.processIncomingReading(
        'test_session',
        { rawAdc: 2000 },
        mockCalibration,
        testConfig
      );

      expect(result.flexPercent).toBeCloseTo(50);
      expect(result.isContraction).toBe(false);
    });

    it('should clamp normalized ADC values between 0 and 100%', async () => {
      const resultUnder = await SignalProcessorService.processIncomingReading(
        'test_session',
        { rawAdc: 500 },
        mockCalibration,
        testConfig
      );
      expect(resultUnder.flexPercent).toBe(0);

      const resultOver = await SignalProcessorService.processIncomingReading(
        'test_session',
        { rawAdc: 4500 },
        mockCalibration,
        testConfig
      );
      expect(resultOver.flexPercent).toBe(100);
    });
  });

  describe('Dynamic Contraction Waveform Detection', () => {
    it('should detect a contraction rise, peak, and fall cycle', async () => {
      const sessionId = 'test_session';
      const nowMs = Date.now();

      // 1. Initial State (baseline)
      let result = await SignalProcessorService.processIncomingReading(
        sessionId,
        { flexPercent: 10, timestamp: nowMs },
        mockCalibration,
        testConfig
      );
      expect(result.phase).toBe('none');
      expect(result.isContraction).toBe(false);

      // 2. Rise phase (exceed riseThreshold: baseline 10 + threshold 10 = 20)
      result = await SignalProcessorService.processIncomingReading(
        sessionId,
        { flexPercent: 25, timestamp: nowMs + 1000 },
        mockCalibration,
        testConfig
      );
      expect(result.phase).toBe('rise');
      expect(result.isContraction).toBe(false);

      // 3. Peak phase (continues high)
      result = await SignalProcessorService.processIncomingReading(
        sessionId,
        { flexPercent: 40, timestamp: nowMs + 2000 },
        mockCalibration,
        testConfig
      );
      expect(result.phase).toBe('peak');
      expect(result.isContraction).toBe(false);

      // 4. Fall phase (dropping but still above fallThreshold: baseline 10 + 3 = 13)
      result = await SignalProcessorService.processIncomingReading(
        sessionId,
        { flexPercent: 20, timestamp: nowMs + 3000 },
        mockCalibration,
        testConfig
      );
      expect(result.phase).toBe('fall');
      expect(result.isContraction).toBe(false);

      // 5. Contraction Ends (drops below baseline + fallThreshold = 13)
      result = await SignalProcessorService.processIncomingReading(
        sessionId,
        { flexPercent: 12, timestamp: nowMs + 4000 },
        mockCalibration,
        testConfig
      );

      // Should be flagged as contraction because duration (3 seconds) >= minDurationSeconds (2 seconds)
      expect(result.isContraction).toBe(true);
      expect(result.duration).toBe(3);
      expect(result.intensity).toBeGreaterThan(0);
      expect(result.phase).toBe('none');
    });

    it('should reject contractions that do not meet minDurationSeconds', async () => {
      const sessionId = 'test_session';
      const nowMs = Date.now();

      // 1. Rise
      let result = await SignalProcessorService.processIncomingReading(
        sessionId,
        { flexPercent: 25, timestamp: nowMs },
        mockCalibration,
        testConfig
      );
      expect(result.phase).toBe('rise');

      // 2. Immediate Fall (only 0.5s elapsed)
      result = await SignalProcessorService.processIncomingReading(
        sessionId,
        { flexPercent: 11, timestamp: nowMs + 500 },
        mockCalibration,
        testConfig
      );

      // Should end but NOT count as a contraction due to duration restriction (0.5s < 2s)
      expect(result.isContraction).toBe(false);
      expect(result.phase).toBe('none');
    });
  });
});
