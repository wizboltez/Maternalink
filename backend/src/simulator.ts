import { io, Socket } from 'socket.io-client';

const BACKEND_URL = 'http://localhost:5000';

class DeviceSimulator {
  private socket: Socket | null = null;
  private sessionId: string;
  private option: number;
  private intervalId: NodeJS.Timeout | null = null;
  private timeElapsed = 0;

  // Waveform parameters
  private baselineAdc = 1200;
  private peakAdc = 2800;
  private baselineFlex = 10;
  private peakFlex = 80;

  // Contraction scheduling (contraction occurs every 60 seconds for demo purposes)
  private contractionIntervalSeconds = 60;
  private contractionDurationSeconds = 20;

  constructor(sessionId: string, option = 1) {
    this.sessionId = sessionId;
    this.option = option;
  }

  public start() {
    console.log(`🔌 Starting ESP32 Simulator...`);
    console.log(`📡 Targeting session: ${this.sessionId}`);
    console.log(`🔧 Using Data Option: ${this.option}`);

    // Dynamic import to avoid node types mismatch in browser/native
    const clientIo = require('socket.io-client');
    this.socket = clientIo(BACKEND_URL);

    this.socket!.on('connect', () => {
      console.log('✅ Simulator connected to backend Socket.IO.');
      this.socket!.emit('join_session', this.sessionId);

      // Start streaming at 1Hz
      this.intervalId = setInterval(() => this.streamReading(), 1000);
    });

    this.socket!.on('disconnect', () => {
      console.log('❌ Simulator disconnected.');
      this.stop();
    });

    this.socket!.on('error', (err: string) => {
      console.error('⚠️ Backend sent error:', err);
    });
  }

  public stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    console.log('⏹️ Simulator stopped.');
  }

  private streamReading() {
    this.timeElapsed++;

    // Calculate simulated waveform value (sine wave pulse)
    const cycleTime = this.timeElapsed % this.contractionIntervalSeconds;
    const inContraction = cycleTime < this.contractionDurationSeconds;

    let flexPercent = this.baselineFlex;
    let rawAdc = this.baselineAdc;
    let intensity = 0;

    // Add small random noise
    const adcNoise = Math.round((Math.random() - 0.5) * 20);
    const flexNoise = (Math.random() - 0.5) * 1.0;

    if (inContraction) {
      // Create a smooth rise-peak-fall curve
      const angle = (cycleTime / this.contractionDurationSeconds) * Math.PI;
      const amplitude = Math.sin(angle); // 0 -> 1 -> 0

      flexPercent = this.baselineFlex + amplitude * (this.peakFlex - this.baselineFlex) + flexNoise;
      rawAdc = this.baselineAdc + amplitude * (this.peakAdc - this.baselineAdc) + adcNoise;
      intensity = amplitude * 100;
    } else {
      flexPercent += flexNoise;
      rawAdc += adcNoise;
    }

    // Keep values positive and bounded
    flexPercent = Math.max(0, parseFloat(flexPercent.toFixed(1)));
    rawAdc = Math.max(0, Math.round(rawAdc));
    intensity = Math.max(0, Math.round(intensity));

    // Construct telemetry payload based on selected ESP32 data option
    let payload: any = {
      sessionId: this.sessionId,
      timestamp: Date.now(),
      batteryLevel: Math.max(10, 98 - Math.floor(this.timeElapsed / 10)), // slow discharging
    };

    switch (this.option) {
      case 1:
        // Option 1: Only Raw ADC
        payload.rawAdc = rawAdc;
        break;

      case 2:
        // Option 2: Only Flex Percentage
        payload.flexPercent = flexPercent;
        break;

      case 3:
        // Option 3: Only Intensity
        if (inContraction) {
          payload.intensity = intensity;
        }
        break;

      case 4:
        // Option 4: Summary packets sent at end of contraction cycle
        if (cycleTime === this.contractionDurationSeconds) {
          payload.duration = this.contractionDurationSeconds;
          payload.intensity = this.peakFlex; // peak mapping
          payload.interval = this.contractionIntervalSeconds;
          payload.frequency = 60; // 1 per minute = 60 per hour
        } else {
          // Send nothing or simple alive heartbeat
          return;
        }
        break;

      case 5:
      default:
        // Option 5: Any mixed combinations
        payload.rawAdc = rawAdc;
        payload.flexPercent = flexPercent;
        if (inContraction) {
          payload.intensity = intensity;
        }
        break;
    }

    console.log(`📤 Sending payload (Option ${this.option}):`, JSON.stringify(payload));
    this.socket!.emit('hardware_reading', payload);
  }
}

// Read options from command args
const args = process.argv.slice(2);
const sessionArg = args[0] || '6674681144f8dc05b2ee13c1'; // mock session objectId
const optionArg = parseInt(args[1] || '1', 10);

const simulator = new DeviceSimulator(sessionArg, optionArg);
simulator.start();

// Handle graceful termination
process.on('SIGINT', () => {
  simulator.stop();
  process.exit(0);
});
