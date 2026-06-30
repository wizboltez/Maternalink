import mongoose, { Schema, Document } from 'mongoose';

// User Interface
export interface IUser extends Document {
  email: string;
  password: string; // Hashed password, conforms to DB collection requirements
  passwordHash?: string; // Virtual/getter for compatibility
  name: string;
  age: number;
  role: 'mother' | 'doctor' | 'admin';
  createdAt: Date;
  updatedAt: Date;
}

// Pregnancy Profile Interface
export interface IPregnancyProfile extends Document {
  userId: mongoose.Types.ObjectId;
  pregnancyWeek: number;
  trimester: number;
  expectedDeliveryDate: Date;
  weight: number;
  bloodGroup: string;
  gestationalAgeWeeks: number; // Kept for backwards compatibility
  dueDate: Date; // Kept for backwards compatibility
  doctorName?: string; // Made optional for system integration
  emergencyContact?: string; // Made optional for system integration
  createdAt: Date;
  updatedAt: Date;
}

// Guidance Rule Interface
export interface IGuidanceRule extends Document {
  minWeek: number;
  maxWeek: number;
  nutritionTips: string[];
  hydrationTips: string[];
  exerciseTips: string[];
  medicalTests: string[];
  doctorVisits: string[];
  precautions: string[];
}

// Device Interface
export interface IDevice extends Document {
  serialNumber: string;
  name: string;
  firmwareVersion: string;
  batteryLevel: number;
  capabilities: ('adc' | 'flex_percent' | 'intensity' | 'mpu6050' | 'temperature' | 'heart_rate' | 'emg')[];
  status: 'online' | 'offline' | 'maintenance';
  lastConnectedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Calibration Session Interface
export interface ICalibrationSession extends Document {
  userId: mongoose.Types.ObjectId;
  deviceId: mongoose.Types.ObjectId;
  flexMin: number;
  flexMax: number;
  baseline: number;
  sensorNoise: number;
  confidence: number; // 0 to 100
  timestamp: Date;
  status: 'success' | 'failed';
}

// Monitoring Session Interface
export interface IMonitoringSession extends Document {
  userId: mongoose.Types.ObjectId;
  deviceId: mongoose.Types.ObjectId;
  calibrationSessionId: mongoose.Types.ObjectId;
  startTime: Date;
  endTime?: Date;
  status: 'active' | 'completed';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Contraction Reading Interface
export interface IContractionReading extends Document {
  monitoringSessionId: mongoose.Types.ObjectId;
  timestamp: Date;
  rawAdc?: number;
  flexPercent?: number;
  intensity?: number;
  duration?: number;
  interval?: number;
  frequency?: number; // contractions per hour
  source: 'hardware' | 'manual' | 'hybrid';
  isConfirmed: boolean;
  isContraction: boolean;
  phase: 'none' | 'rise' | 'peak' | 'fall';
}

// --- SCHEMAS ---

const UserSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true, index: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    name: { type: String, required: true, trim: true },
    age: { type: Number, required: true },
    role: { type: String, enum: ['mother', 'doctor', 'admin'], default: 'mother' },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

// Virtual for passwordHash compatibility
UserSchema.virtual('passwordHash')
  .get(function (this: IUser) {
    return this.password;
  })
  .set(function (this: IUser, val: string) {
    this.password = val;
  });

const PregnancyProfileSchema = new Schema<IPregnancyProfile>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    pregnancyWeek: { type: Number, required: true, min: 0, max: 50 },
    trimester: { type: Number, required: true, min: 1, max: 3 },
    expectedDeliveryDate: { type: Date, required: true },
    weight: { type: Number, required: true },
    bloodGroup: { type: String, required: true, trim: true },
    // Compatibility fields
    gestationalAgeWeeks: { type: Number, default: 0 },
    dueDate: { type: Date, default: Date.now },
    doctorName: { type: String, default: 'Not specified', trim: true },
    emergencyContact: { type: String, default: 'Not specified', trim: true },
  },
  { timestamps: true }
);

const GuidanceRuleSchema = new Schema<IGuidanceRule>(
  {
    minWeek: { type: Number, required: true, index: true },
    maxWeek: { type: Number, required: true, index: true },
    nutritionTips: [{ type: String, required: true }],
    hydrationTips: [{ type: String, required: true }],
    exerciseTips: [{ type: String, required: true }],
    medicalTests: [{ type: String, required: true }],
    doctorVisits: [{ type: String, required: true }],
    precautions: [{ type: String, required: true }],
  }
);

const DeviceSchema = new Schema<IDevice>(
  {
    serialNumber: { type: String, required: true, unique: true, index: true, trim: true },
    name: { type: String, required: true, trim: true },
    firmwareVersion: { type: String, required: true, default: '1.0.0' },
    batteryLevel: { type: Number, required: true, min: 0, max: 100, default: 100 },
    capabilities: [{ type: String, enum: ['adc', 'flex_percent', 'intensity', 'mpu6050', 'temperature', 'heart_rate', 'emg'] }],
    status: { type: String, enum: ['online', 'offline', 'maintenance'], default: 'offline' },
    lastConnectedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

const CalibrationSessionSchema = new Schema<ICalibrationSession>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  deviceId: { type: Schema.Types.ObjectId, ref: 'Device', required: true, index: true },
  flexMin: { type: Number, required: true },
  flexMax: { type: Number, required: true },
  baseline: { type: Number, required: true },
  sensorNoise: { type: Number, required: true },
  confidence: { type: Number, required: true, min: 0, max: 100 },
  timestamp: { type: Date, default: Date.now, index: true },
  status: { type: String, enum: ['success', 'failed'], required: true },
});

const MonitoringSessionSchema = new Schema<IMonitoringSession>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    deviceId: { type: Schema.Types.ObjectId, ref: 'Device', required: true },
    calibrationSessionId: { type: Schema.Types.ObjectId, ref: 'CalibrationSession', required: true },
    startTime: { type: Date, required: true, default: Date.now, index: true },
    endTime: { type: Date },
    status: { type: String, enum: ['active', 'completed'], default: 'active' },
    notes: { type: String },
  },
  { timestamps: true }
);

const ContractionReadingSchema = new Schema<IContractionReading>({
  monitoringSessionId: { type: Schema.Types.ObjectId, ref: 'MonitoringSession', required: true, index: true },
  timestamp: { type: Date, required: true, default: Date.now, index: true },
  rawAdc: { type: Number },
  flexPercent: { type: Number },
  intensity: { type: Number },
  duration: { type: Number },
  interval: { type: Number },
  frequency: { type: Number },
  source: { type: String, enum: ['hardware', 'manual', 'hybrid'], required: true },
  isConfirmed: { type: Boolean, default: false },
  isContraction: { type: Boolean, default: false },
  phase: { type: String, enum: ['none', 'rise', 'peak', 'fall'], default: 'none' },
});

// Compound index on session and timestamp for quick retrieval of time-series graphs
ContractionReadingSchema.index({ monitoringSessionId: 1, timestamp: 1 });

// Export Models
export const User = mongoose.model<IUser>('User', UserSchema);
export const PregnancyProfile = mongoose.model<IPregnancyProfile>('PregnancyProfile', PregnancyProfileSchema);
export const GuidanceRule = mongoose.model<IGuidanceRule>('GuidanceRule', GuidanceRuleSchema);
export const Device = mongoose.model<IDevice>('Device', DeviceSchema);
export const CalibrationSession = mongoose.model<ICalibrationSession>('CalibrationSession', CalibrationSessionSchema);
export const MonitoringSession = mongoose.model<IMonitoringSession>('MonitoringSession', MonitoringSessionSchema);
export const ContractionReading = mongoose.model<IContractionReading>('ContractionReading', ContractionReadingSchema);

// Health Sync Reading Interface (sub-document)
export interface IHealthSyncReading {
  timestamp: Date;
  heartRate?: number;
  spO2?: number;
  temperature?: number;
  stressScore?: number;
  activity?: 'lying' | 'sitting' | 'standing' | 'walking' | 'unknown';
  contractionActive?: boolean;
  contractionIntensity?: number;
  contractionDuration?: number;
  contractionInterval?: number;
  contractionFrequency?: number;
  flex1Raw?: number;
  flex2Raw?: number;
  accelMagnitude?: number;
  gsrRaw?: number;
  batteryLevel?: number;
}

// Health Alert Interface (sub-document)
export interface IHealthAlert {
  timestamp: Date;
  type: string;
  value: number;
  message: string;
}

// Health Summary Interface (sub-document)
export interface IHealthSummary {
  avgHeartRate?: number;
  avgSpO2?: number;
  avgTemperature?: number;
  avgStressScore?: number;
  totalContractions?: number;
  avgContractionDuration?: number;
  avgContractionInterval?: number;
  dominantActivity?: string;
  fallsDetected?: number;
  sleepMinutes?: number;
}

// Health Sync Batch Interface
export interface IHealthSyncBatch extends Document {
  userId: mongoose.Types.ObjectId;
  deviceId: string;
  syncTimestamp: Date;
  sessionStart: Date;
  sessionEnd: Date;
  readings: IHealthSyncReading[];
  alerts: IHealthAlert[];
  summary: IHealthSummary;
  createdAt: Date;
  updatedAt: Date;
}

const HealthSyncReadingSchema = new Schema<IHealthSyncReading>(
  {
    timestamp: { type: Date, required: true },
    heartRate: { type: Number },
    spO2: { type: Number },
    temperature: { type: Number },
    stressScore: { type: Number },
    activity: { type: String, enum: ['lying', 'sitting', 'standing', 'walking', 'unknown'] },
    contractionActive: { type: Boolean },
    contractionIntensity: { type: Number },
    contractionDuration: { type: Number },
    contractionInterval: { type: Number },
    contractionFrequency: { type: Number },
    flex1Raw: { type: Number },
    flex2Raw: { type: Number },
    accelMagnitude: { type: Number },
    gsrRaw: { type: Number },
    batteryLevel: { type: Number },
  },
  { _id: false }
);

const HealthAlertSchema = new Schema<IHealthAlert>(
  {
    timestamp: { type: Date, required: true },
    type: { type: String, required: true },
    value: { type: Number, required: true },
    message: { type: String, required: true },
  },
  { _id: false }
);

const HealthSummarySchema = new Schema<IHealthSummary>(
  {
    avgHeartRate: { type: Number },
    avgSpO2: { type: Number },
    avgTemperature: { type: Number },
    avgStressScore: { type: Number },
    totalContractions: { type: Number },
    avgContractionDuration: { type: Number },
    avgContractionInterval: { type: Number },
    dominantActivity: { type: String },
    fallsDetected: { type: Number },
    sleepMinutes: { type: Number },
  },
  { _id: false }
);

const HealthSyncBatchSchema = new Schema<IHealthSyncBatch>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    deviceId: { type: String, required: true },
    syncTimestamp: { type: Date, required: true, default: Date.now },
    sessionStart: { type: Date, required: true },
    sessionEnd: { type: Date, required: true },
    readings: [HealthSyncReadingSchema],
    alerts: [HealthAlertSchema],
    summary: HealthSummarySchema,
  },
  { timestamps: true }
);

// Compound index for efficient per-user chronological queries
HealthSyncBatchSchema.index({ userId: 1, syncTimestamp: -1 });

export const HealthSyncBatch = mongoose.model<IHealthSyncBatch>('HealthSyncBatch', HealthSyncBatchSchema);
