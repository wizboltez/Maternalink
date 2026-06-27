import mongoose from 'mongoose';
import { User, EmergencyContacts, EmergencyAlert, EmergencySettings, IEmergencyAlert } from '../../infrastructure/database/models';
import { WhatsAppService } from '../../infrastructure/notification/whatsapp';
import { FirebaseNotificationService } from '../../infrastructure/notification/fcm';

export class EmergencyService {
  /**
   * Main orchestrator for raising a maternal emergency alert.
   */
  public static async processAlert(params: {
    userId: string;
    triggerType: 'SOS_BUTTON' | 'HIGH_STRESS' | 'HIGH_HEART_RATE' | 'STRONG_CONTRACTIONS' | 'ABNORMAL_FETAL_HEARTBEAT' | 'FALL_DETECTED' | 'MULTIPLE_RISK_FACTORS';
    sensorSnapshot?: Record<string, any>;
    location?: { latitude: number; longitude: number; text?: string };
    customMessage?: string;
  }): Promise<{ alert: IEmergencyAlert; whatsappSent: boolean; pushSent: boolean }> {
    const { userId, triggerType, sensorSnapshot = {}, location, customMessage } = params;

    console.log(`🚨 [EmergencyService] Processing emergency alert for User: ${userId}, Type: ${triggerType}`);

    const userOid = new mongoose.Types.ObjectId(userId);

    // 1. Fetch or initialize Emergency Settings
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

    // 2. Validate trigger permission based on settings
    if (triggerType === 'SOS_BUTTON' && !settings.sosButtonEnabled) {
      console.log('🛑 [EmergencyService] Alert cancelled: SOS button triggers are disabled in user settings.');
      throw new Error('SOS alerts are disabled in settings.');
    }
    if (triggerType !== 'SOS_BUTTON' && !settings.autoAlertsEnabled) {
      console.log('🛑 [EmergencyService] Alert cancelled: Automated trigger alerts are disabled in user settings.');
      throw new Error('Automated alerts are disabled in settings.');
    }

    // 3. Retrieve Patient/User Details
    const user = await User.findById(userId);
    if (!user) {
      console.error(`❌ [EmergencyService] User ${userId} not found.`);
      throw new Error('User not found.');
    }

    // 4. Format the location and reasons
    const locationString = location
      ? `Lat: ${location.latitude}, Lng: ${location.longitude} (https://maps.google.com/?q=${location.latitude},${location.longitude})`
      : 'Not Available (Automatic Sensor Trigger)';

    const triggerLabel = this.getTriggerLabel(triggerType);
    const alertMessage = customMessage || `Emergency detected on Smart Maternal Belt. Trigger: ${triggerLabel}.`;

    // 5. Determine severity based on trigger type
    const severity = this.getSeverityForTrigger(triggerType);

    // 6. Create and Save Emergency Alert
    const alert = new EmergencyAlert({
      userId: userOid,
      triggerType,
      severity,
      message: alertMessage,
      sensorSnapshot,
      status: 'active',
      notificationsSent: { push: false, whatsapp: false },
    });
    await alert.save();

    // 7. Load Emergency Contacts
    const contactDoc = await EmergencyContacts.findOne({ userId: userOid });
    const contacts = contactDoc?.contacts || [];

    let whatsappSuccess = false;
    let pushSuccess = false;

    // 8. Send WhatsApp Messages to Emergency Contacts if enabled
    if (settings.whatsappAlertsEnabled && contacts.length > 0) {
      try {
        const formattedMsg = WhatsAppService.compileMessage({
          patientName: user.name,
          trigger: triggerLabel,
          timestamp: new Date().toLocaleString(),
          location: locationString,
        });

        // Map contacts for the sender utility
        const whatsappRecipients = contacts.map((c) => ({
          name: c.name,
          whatsapp: c.whatsapp,
        }));

        whatsappSuccess = await WhatsAppService.sendAlertToContacts(whatsappRecipients, formattedMsg);
      } catch (err) {
        console.error('❌ [EmergencyService] WhatsApp delivery failed:', err);
      }
    } else {
      console.log('ℹ️ [EmergencyService] WhatsApp alerts skipped (disabled or no contacts configured).');
    }

    // 9. Send Push Notification to the Patient's App if enabled
    if (settings.pushNotificationsEnabled) {
      try {
        const pushPayload = {
          title: '🚨 EMERGENCY ALERT TRIGGERED',
          body: `Emergency Alert triggered: ${triggerLabel}. Contacts are being notified.`,
          data: {
            alertId: alert._id.toString(),
            triggerType,
            severity,
          },
        };

        // Simulated token or check for registered token
        const mockDeviceToken = `fcm_token_${userId}`;
        pushSuccess = await FirebaseNotificationService.sendPushNotification(mockDeviceToken, pushPayload);
      } catch (err) {
        console.error('❌ [EmergencyService] Push notification delivery failed:', err);
      }
    } else {
      console.log('ℹ️ [EmergencyService] Push notifications skipped (disabled).');
    }

    // 10. Update notification delivery status flags on the Alert record
    alert.notificationsSent = {
      push: pushSuccess,
      whatsapp: whatsappSuccess,
    };
    await alert.save();

    return {
      alert,
      whatsappSent: whatsappSuccess,
      pushSent: pushSuccess,
    };
  }

  /**
   * Helper to translate trigger keys into readable titles
   */
  private static getTriggerLabel(triggerType: string): string {
    switch (triggerType) {
      case 'SOS_BUTTON':
        return 'Manual SOS Button Double-Pressed';
      case 'HIGH_STRESS':
        return 'Critical Maternal Stress Level';
      case 'HIGH_HEART_RATE':
        return 'Abnormally High Maternal Heart Rate';
      case 'STRONG_CONTRACTIONS':
        return 'Excessive / Strong Contractions Detected';
      case 'ABNORMAL_FETAL_HEARTBEAT':
        return 'Fetal Distress: Abnormal Heartbeat';
      case 'FALL_DETECTED':
        return 'Maternal Fall Event Detected';
      case 'MULTIPLE_RISK_FACTORS':
        return 'Multiple Biometric Risk Factors Triggered';
      default:
        return triggerType;
    }
  }

  /**
   * Helper to map trigger types to relative severity levels
   */
  private static getSeverityForTrigger(triggerType: string): 'low' | 'medium' | 'high' | 'critical' {
    switch (triggerType) {
      case 'SOS_BUTTON':
      case 'FALL_DETECTED':
      case 'ABNORMAL_FETAL_HEARTBEAT':
      case 'MULTIPLE_RISK_FACTORS':
        return 'critical';
      case 'HIGH_HEART_RATE':
      case 'STRONG_CONTRACTIONS':
        return 'high';
      case 'HIGH_STRESS':
        return 'medium';
      default:
        return 'low';
    }
  }
}
export default EmergencyService;
