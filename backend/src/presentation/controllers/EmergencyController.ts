import { Response } from 'express';
import { AuthenticatedRequest } from '../../infrastructure/web/middlewares';
import { EmergencyContacts, EmergencyAlert, EmergencySettings } from '../../infrastructure/database/models';
import { EmergencyService } from '../../application/services/EmergencyService';
import { AlertEngine } from '../../application/services/AlertEngine';
import mongoose from 'mongoose';

export class EmergencyController {
  /**
   * POST /api/emergency/sos
   * Triggered by hardware ESP32 double press
   */
  public static async triggerSos(req: AuthenticatedRequest, res: Response) {
    try {
      const { userId, deviceId, latitude, longitude, timestamp } = req.body;

      const result = await EmergencyService.processAlert({
        userId,
        triggerType: 'SOS_BUTTON',
        sensorSnapshot: { deviceId },
        location: { latitude, longitude },
        customMessage: `Manual SOS emergency triggered by patient via Smart Belt (Device ID: ${deviceId}).`,
      });

      return res.status(201).json({
        message: 'SOS Emergency alert processed successfully.',
        alert: result.alert,
        notifications: {
          whatsapp: result.whatsappSent,
          push: result.pushSent,
        },
      });
    } catch (error: any) {
      console.error('🔥 Error in triggerSos controller:', error);
      return res.status(500).json({ error: error.message || 'Failed to process SOS alert.' });
    }
  }

  /**
   * POST /api/emergency/auto
   * Triggered by sensor data analytics
   */
  public static async triggerAuto(req: AuthenticatedRequest, res: Response) {
    try {
      const { userId, triggerType, sensorData } = req.body;

      let evaluatedTrigger = triggerType;
      let evaluatedSeverity: 'low' | 'medium' | 'high' | 'critical' = 'medium';
      let evaluatedMessage = '';

      // If triggerType is not supplied, evaluate sensorData using the AlertEngine rules
      if (!evaluatedTrigger) {
        if (!sensorData) {
          return res.status(400).json({ error: 'Either triggerType or sensorData must be supplied.' });
        }

        const analysisResult = AlertEngine.analyze(sensorData);
        if (!analysisResult) {
          return res.status(200).json({
            triggered: false,
            message: 'Sensor telemetry is within safe operating ranges. No alert raised.',
          });
        }

        evaluatedTrigger = analysisResult.triggerType;
        evaluatedSeverity = analysisResult.severity;
        evaluatedMessage = analysisResult.message;
      }

      const result = await EmergencyService.processAlert({
        userId,
        triggerType: evaluatedTrigger,
        sensorSnapshot: sensorData || {},
        customMessage: evaluatedMessage || undefined,
      });

      return res.status(201).json({
        triggered: true,
        message: 'Automatic sensor alert processed successfully.',
        alert: result.alert,
        notifications: {
          whatsapp: result.whatsappSent,
          push: result.pushSent,
        },
      });
    } catch (error: any) {
      console.error('🔥 Error in triggerAuto controller:', error);
      return res.status(500).json({ error: error.message || 'Failed to process auto alert.' });
    }
  }

  /**
   * GET /api/emergency/history/:userId
   * Load history of alerts for a user
   */
  public static async getHistory(req: AuthenticatedRequest, res: Response) {
    try {
      const { userId } = req.params;
      const loggedInUserId = req.user?.userId;

      // Access verification: User can only load their own records unless admin/doctor
      if (loggedInUserId !== userId && req.user?.role !== 'admin' && req.user?.role !== 'doctor') {
        return res.status(403).json({ error: 'Access denied. Forbidden.' });
      }

      const alerts = await EmergencyAlert.find({ userId: new mongoose.Types.ObjectId(userId) })
        .sort({ createdAt: -1 });

      return res.status(200).json(alerts);
    } catch (error: any) {
      console.error('🔥 Error in getHistory controller:', error);
      return res.status(500).json({ error: error.message || 'Failed to fetch alert logs.' });
    }
  }

  /**
   * GET /api/emergency/contacts
   * Fetch contacts for authenticated user
   */
  public static async getContacts(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) return res.status(401).json({ error: 'Unauthorized.' });

      const doc = await EmergencyContacts.findOne({ userId: new mongoose.Types.ObjectId(userId) });
      const contacts = doc ? doc.contacts : [];

      return res.status(200).json(contacts);
    } catch (error: any) {
      console.error('🔥 Error in getContacts controller:', error);
      return res.status(500).json({ error: error.message || 'Failed to fetch contacts.' });
    }
  }

  /**
   * POST /api/emergency/contacts
   * Add a new emergency contact
   */
  public static async saveContact(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) return res.status(401).json({ error: 'Unauthorized.' });

      const { name, relation, phone, whatsapp, priority } = req.body;

      const userOid = new mongoose.Types.ObjectId(userId);
      let doc = await EmergencyContacts.findOne({ userId: userOid });

      if (!doc) {
        doc = new EmergencyContacts({ userId: userOid, contacts: [] });
      }

      // Check for duplicates (same phone or whatsapp)
      const isDuplicate = doc.contacts.some(c => c.phone === phone || c.whatsapp === whatsapp);
      if (isDuplicate) {
        return res.status(400).json({ error: 'A contact with this phone or WhatsApp number already exists.' });
      }

      doc.contacts.push({ name, relation, phone, whatsapp, priority });
      // Sort contacts by priority
      doc.contacts.sort((a, b) => a.priority - b.priority);

      await doc.save();

      return res.status(201).json(doc.contacts);
    } catch (error: any) {
      console.error('🔥 Error in saveContact controller:', error);
      return res.status(500).json({ error: error.message || 'Failed to save contact.' });
    }
  }

  /**
   * PUT /api/emergency/contacts/:contactId
   * Update an existing emergency contact
   */
  public static async updateContact(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.userId;
      const { contactId } = req.params;
      if (!userId) return res.status(401).json({ error: 'Unauthorized.' });

      const doc = await EmergencyContacts.findOne({ userId: new mongoose.Types.ObjectId(userId) });
      if (!doc) {
        return res.status(404).json({ error: 'No contacts list found for user.' });
      }

      const contact = doc.contacts.find(c => (c as any)._id.toString() === contactId);
      if (!contact) {
        return res.status(404).json({ error: 'Emergency contact not found.' });
      }

      // Update fields
      const { name, relation, phone, whatsapp, priority } = req.body;
      if (name !== undefined) contact.name = name;
      if (relation !== undefined) contact.relation = relation;
      if (phone !== undefined) contact.phone = phone;
      if (whatsapp !== undefined) contact.whatsapp = whatsapp;
      if (priority !== undefined) contact.priority = priority;

      // Sort contacts by priority
      doc.contacts.sort((a, b) => a.priority - b.priority);

      await doc.save();

      return res.status(200).json(doc.contacts);
    } catch (error: any) {
      console.error('🔥 Error in updateContact controller:', error);
      return res.status(500).json({ error: error.message || 'Failed to update contact.' });
    }
  }

  /**
   * DELETE /api/emergency/contacts/:contactId
   * Delete an emergency contact
   */
  public static async deleteContact(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.userId;
      const { contactId } = req.params;
      if (!userId) return res.status(401).json({ error: 'Unauthorized.' });

      const doc = await EmergencyContacts.findOne({ userId: new mongoose.Types.ObjectId(userId) });
      if (!doc) {
        return res.status(404).json({ error: 'Contacts list not found.' });
      }

      const originalLength = doc.contacts.length;
      doc.contacts = doc.contacts.filter(c => (c as any)._id.toString() !== contactId) as any;

      if (doc.contacts.length === originalLength) {
        return res.status(404).json({ error: 'Emergency contact not found.' });
      }

      await doc.save();

      return res.status(200).json(doc.contacts);
    } catch (error: any) {
      console.error('🔥 Error in deleteContact controller:', error);
      return res.status(500).json({ error: error.message || 'Failed to delete contact.' });
    }
  }

  /**
   * GET /api/emergency/settings
   * Retrieve settings for user
   */
  public static async getSettings(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) return res.status(401).json({ error: 'Unauthorized.' });

      const userOid = new mongoose.Types.ObjectId(userId);
      let settings = await EmergencySettings.findOne({ userId: userOid });

      if (!settings) {
        settings = new EmergencySettings({
          userId: userOid,
          whatsappAlertsEnabled: true,
          pushNotificationsEnabled: true,
          autoAlertsEnabled: true,
          sosButtonEnabled: true,
        });
        await settings.save();
      }

      return res.status(200).json(settings);
    } catch (error: any) {
      console.error('🔥 Error in getSettings controller:', error);
      return res.status(500).json({ error: error.message || 'Failed to fetch settings.' });
    }
  }

  /**
   * PUT /api/emergency/settings
   * Update user alert configurations
   */
  public static async updateSettings(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) return res.status(401).json({ error: 'Unauthorized.' });

      const userOid = new mongoose.Types.ObjectId(userId);
      let settings = await EmergencySettings.findOne({ userId: userOid });

      if (!settings) {
        settings = new EmergencySettings({ userId: userOid });
      }

      const { whatsappAlertsEnabled, pushNotificationsEnabled, autoAlertsEnabled, sosButtonEnabled } = req.body;

      if (whatsappAlertsEnabled !== undefined) settings.whatsappAlertsEnabled = whatsappAlertsEnabled;
      if (pushNotificationsEnabled !== undefined) settings.pushNotificationsEnabled = pushNotificationsEnabled;
      if (autoAlertsEnabled !== undefined) settings.autoAlertsEnabled = autoAlertsEnabled;
      if (sosButtonEnabled !== undefined) settings.sosButtonEnabled = sosButtonEnabled;

      await settings.save();

      return res.status(200).json(settings);
    } catch (error: any) {
      console.error('🔥 Error in updateSettings controller:', error);
      return res.status(500).json({ error: error.message || 'Failed to update settings.' });
    }
  }
}
export default EmergencyController;
