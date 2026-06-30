import { Router } from 'express';
import { EmergencyController } from '../controllers/EmergencyController';
import { authMiddleware, validate } from '../../infrastructure/web/middlewares';
import {
  sosAlertSchema,
  autoAlertSchema,
  saveContactSchema,
  updateContactSchema,
  updateSettingsSchema,
} from './schemas';

const router = Router();

// --- Telemetry Triggers (Unauthenticated for IoT/External classification) ---
router.post('/sos', validate(sosAlertSchema), EmergencyController.triggerSos);
router.post('/auto', validate(autoAlertSchema), EmergencyController.triggerAuto);

// --- Alerts Log History ---
router.get('/history/:userId', authMiddleware as any, EmergencyController.getHistory);

// --- Emergency Contacts CRUD ---
router.get('/contacts', authMiddleware as any, EmergencyController.getContacts);
router.post('/contacts', authMiddleware as any, validate(saveContactSchema), EmergencyController.saveContact);
router.put('/contacts/:contactId', authMiddleware as any, validate(updateContactSchema), EmergencyController.updateContact);
router.delete('/contacts/:contactId', authMiddleware as any, EmergencyController.deleteContact);

// --- User System Settings ---
router.get('/settings', authMiddleware as any, EmergencyController.getSettings);
router.put('/settings', authMiddleware as any, validate(updateSettingsSchema), EmergencyController.updateSettings);

export default router;
