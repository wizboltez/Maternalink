import { z } from 'zod';

export const registerSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address format.'),
    password: z.string().min(6, 'Password must be at least 6 characters.'),
    name: z.string().min(2, 'Name is too short.'),
    age: z.number().min(15, 'Age must be at least 15.').max(60, 'Age must be at most 60.'),
  }),
});

export const createProfileSchema = z.object({
  body: z.object({
    pregnancyWeek: z.number().min(1, 'Pregnancy week must be at least 1.').max(42, 'Pregnancy week must be at most 42.'),
    expectedDeliveryDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
      message: 'Expected delivery date must be a valid date.',
    }),
    weight: z.number().positive('Weight must be a positive number.'),
    bloodGroup: z.string().min(1, 'Blood group is required.'),
  }),
});

export const updateProfileSchema = z.object({
  params: z.object({
    id: z.string().length(24, 'Invalid profile ID format.'),
  }),
  body: z.object({
    pregnancyWeek: z.number().min(1).max(42).optional(),
    expectedDeliveryDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
      message: 'Expected delivery date must be a valid date.',
    }).optional(),
    weight: z.number().positive().optional(),
    bloodGroup: z.string().optional(),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address format.'),
    password: z.string().min(1, 'Password is required.'),
  }),
});

export const syncDeviceSchema = z.object({
  body: z.object({
    serialNumber: z.string().min(1, 'Device serial number is required.'),
    name: z.string().min(1, 'Device name is required.'),
    firmwareVersion: z.string().optional(),
    batteryLevel: z.number().min(0).max(100).optional(),
    capabilities: z.array(z.string()).optional(),
  }),
});

export const updateDeviceStatusSchema = z.object({
  params: z.object({
    id: z.string().length(24, 'Invalid Device ObjectId.'),
  }),
  body: z.object({
    batteryLevel: z.number().min(0).max(100).optional(),
    status: z.enum(['online', 'offline', 'maintenance']).optional(),
  }),
});

export const processRelaxationSchema = z.object({
  body: z.object({
    readings: z.array(z.number()).min(5, 'At least 5 baseline readings are required.'),
  }),
});

export const saveCalibrationSchema = z.object({
  body: z.object({
    deviceId: z.string().length(24, 'Invalid Device ID format.'),
    flexMin: z.number(),
    flexMax: z.number(),
    baseline: z.number(),
    sensorNoise: z.number(),
    confidence: z.number().min(0).max(100),
  }),
});

export const startSessionSchema = z.object({
  body: z.object({
    deviceId: z.string().length(24, 'Invalid Device ID format.'),
    calibrationSessionId: z.string().length(24, 'Invalid Calibration Session ID format.'),
  }),
});

export const postReadingSchema = z.object({
  params: z.object({
    sessionId: z.string().length(24, 'Invalid Session ID.'),
  }),
  body: z.object({
    rawAdc: z.number().optional(),
    flexPercent: z.number().optional(),
    intensity: z.number().optional(),
    duration: z.number().optional(),
    interval: z.number().optional(),
    frequency: z.number().optional(),
    source: z.enum(['hardware', 'manual', 'hybrid']).default('hardware'),
    isConfirmed: z.boolean().optional(),
    isContraction: z.boolean().optional(),
  }),
});

export const healthSyncSchema = z.object({
  body: z.object({
    deviceId: z.string().min(1),
    sessionStart: z.string().or(z.number()),
    sessionEnd: z.string().or(z.number()),
    readings: z.array(z.object({
      timestamp: z.string().or(z.number()),
      heartRate: z.number().optional(),
      spO2: z.number().optional(),
      temperature: z.number().optional(),
      stressScore: z.number().optional(),
      activity: z.enum(['lying', 'sitting', 'standing', 'walking', 'unknown']).optional(),
      contractionActive: z.boolean().optional(),
      contractionIntensity: z.number().optional(),
      contractionDuration: z.number().optional(),
      contractionInterval: z.number().optional(),
      contractionFrequency: z.number().optional(),
      flex1Raw: z.number().optional(),
      flex2Raw: z.number().optional(),
      accelMagnitude: z.number().optional(),
      gsrRaw: z.number().optional(),
      batteryLevel: z.number().optional(),
    })).min(1),
    alerts: z.array(z.object({
      timestamp: z.string().or(z.number()),
      type: z.string(),
      value: z.number(),
      message: z.string(),
    })).optional().default([]),
    summary: z.object({
      avgHeartRate: z.number().optional(),
      avgSpO2: z.number().optional(),
      avgTemperature: z.number().optional(),
      avgStressScore: z.number().optional(),
      totalContractions: z.number().optional(),
      avgContractionDuration: z.number().optional(),
      avgContractionInterval: z.number().optional(),
      dominantActivity: z.string().optional(),
      fallsDetected: z.number().optional(),
      sleepMinutes: z.number().optional(),
    }).optional().default({}),
  }),
});
