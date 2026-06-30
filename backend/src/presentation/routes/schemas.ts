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

// --- Emergency System Zod Schemas ---

export const sosAlertSchema = z.object({
  body: z.object({
    userId: z.string().length(24, 'Invalid User ID format.'),
    deviceId: z.string().min(1, 'Device identifier is required.'),
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    timestamp: z.string().refine((val) => !isNaN(Date.parse(val)), {
      message: 'Timestamp must be a valid date string.',
    }).optional(),
  }),
});

export const autoAlertSchema = z.object({
  body: z.object({
    userId: z.string().length(24, 'Invalid User ID format.'),
    triggerType: z.enum([
      'SOS_BUTTON',
      'HIGH_STRESS',
      'HIGH_HEART_RATE',
      'STRONG_CONTRACTIONS',
      'ABNORMAL_FETAL_HEARTBEAT',
      'FALL_DETECTED',
      'MULTIPLE_RISK_FACTORS',
    ]).optional(),
    sensorData: z.object({
      maternalHeartRate: z.number().optional(),
      fetalHeartRate: z.number().optional(),
      stressLevel: z.number().optional(),
      contractionIntensity: z.number().optional(),
      contractionFrequency: z.number().optional(),
      fallDetected: z.boolean().optional(),
    }).optional(),
  }),
});

export const saveContactSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters.'),
    relation: z.string().min(2, 'Relation must be at least 2 characters.'),
    phone: z.string().min(8, 'Phone number must be at least 8 digits.').regex(/^\+?[0-9]{8,15}$/, 'Invalid phone number format.'),
    whatsapp: z.string().min(8, 'WhatsApp number must be at least 8 digits.').regex(/^\+?[0-9]{8,15}$/, 'Invalid WhatsApp number format.'),
    priority: z.number().min(1, 'Priority must be at least 1.'),
  }),
});

export const updateContactSchema = z.object({
  params: z.object({
    contactId: z.string().length(24, 'Invalid Contact ID format.'),
  }),
  body: z.object({
    name: z.string().min(2).optional(),
    relation: z.string().min(2).optional(),
    phone: z.string().min(8).regex(/^\+?[0-9]{8,15}$/).optional(),
    whatsapp: z.string().min(8).regex(/^\+?[0-9]{8,15}$/).optional(),
    priority: z.number().min(1).optional(),
  }),
});

export const updateSettingsSchema = z.object({
  body: z.object({
    whatsappAlertsEnabled: z.boolean().optional(),
    pushNotificationsEnabled: z.boolean().optional(),
    autoAlertsEnabled: z.boolean().optional(),
    sosButtonEnabled: z.boolean().optional(),
  }),
});

