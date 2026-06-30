import { Router } from 'express';
import { AuthController } from '../controllers/AuthController';
import { DeviceController } from '../controllers/DeviceController';
import { CalibrationController } from '../controllers/CalibrationController';
import { MonitoringController } from '../controllers/MonitoringController';
import { PregnancyProfileController } from '../controllers/PregnancyProfileController';
import { GuidanceController } from '../controllers/GuidanceController';
import emergencyRouter from './emergencyRoutes';
import { HealthSyncController } from '../controllers/HealthSyncController';
import { authMiddleware, validate } from '../../infrastructure/web/middlewares';

import {
  registerSchema,
  loginSchema,
  syncDeviceSchema,
  updateDeviceStatusSchema,
  processRelaxationSchema,
  saveCalibrationSchema,
  startSessionSchema,
  postReadingSchema,
  createProfileSchema,
  updateProfileSchema,
  healthSyncSchema,
} from './schemas';

const router = Router();

// --- Auth Routes ---
router.post('/auth/register', validate(registerSchema), AuthController.register);
router.post('/auth/login', validate(loginSchema), AuthController.login);
router.get('/auth/profile', authMiddleware as any, AuthController.getProfile);

// --- Pregnancy Profile Routes ---
router.post('/profile', authMiddleware as any, validate(createProfileSchema), PregnancyProfileController.createProfile);
router.put('/profile/:id', authMiddleware as any, validate(updateProfileSchema), PregnancyProfileController.updateProfile);

// --- Guidance Routes ---
router.get('/guidance/:userId', authMiddleware as any, GuidanceController.getGuidance);

// --- Device Routes ---
router.post('/device/sync', validate(syncDeviceSchema), DeviceController.registerDevice);
router.get('/device/list', authMiddleware as any, DeviceController.getDevices);
router.put('/device/:id/status', authMiddleware as any, validate(updateDeviceStatusSchema), DeviceController.updateDeviceStatus);

// --- Calibration Routes ---
router.post('/calibration/relaxation', authMiddleware as any, validate(processRelaxationSchema), CalibrationController.processRelaxation);
router.post('/calibration/save', authMiddleware as any, validate(saveCalibrationSchema), CalibrationController.saveCalibration);
router.get('/calibration/latest/:deviceId', authMiddleware as any, CalibrationController.getLatestCalibration);

// --- Monitoring Session Routes ---
router.post('/monitoring/start', authMiddleware as any, validate(startSessionSchema), MonitoringController.startSession);
router.post('/monitoring/stop/:sessionId', authMiddleware as any, MonitoringController.stopSession);
router.post('/monitoring/reading/:sessionId', authMiddleware as any, validate(postReadingSchema), MonitoringController.postReading);
router.get('/monitoring/sessions', authMiddleware as any, MonitoringController.getSessions);
router.get('/monitoring/session/:sessionId', authMiddleware as any, MonitoringController.getSessionDetails);

// --- Reports & Export Routes ---
router.get('/monitoring/export/pdf/:sessionId', authMiddleware as any, MonitoringController.exportPdf);
router.get('/monitoring/export/pdf-all', authMiddleware as any, MonitoringController.exportAllPdf);

// --- Emergency System Routes ---
router.use('/emergency', emergencyRouter);

// --- Health Sync Routes ---
router.post('/health/sync', authMiddleware as any, validate(healthSyncSchema), HealthSyncController.syncBatch);
router.get('/health/history', authMiddleware as any, HealthSyncController.getHistory);
router.get('/health/latest', authMiddleware as any, HealthSyncController.getLatest);
router.get('/health/batch/:batchId', authMiddleware as any, HealthSyncController.getBatchDetails);

export default router;
