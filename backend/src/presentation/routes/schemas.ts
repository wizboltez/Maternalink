import { z } from 'zod';

export const registerSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address format.'),
    password: z.string().min(6, 'Password must be at least 6 characters.'),
    name: z.string().min(2, 'Name is too short.'),
    gestationalAgeWeeks: z.number().min(0).max(50),
    dueDate: z.string().datetime({ message: 'Due date must be a valid ISO datetime.' }),
    doctorName: z.string().min(2, 'Doctor name is required.'),
    emergencyContact: z.string().min(5, 'Emergency contact is required.'),
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
