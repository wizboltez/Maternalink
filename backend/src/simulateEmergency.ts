import mongoose from 'mongoose';
import { env } from './config/env';
import { User, EmergencyContacts, EmergencySettings, EmergencyAlert } from './infrastructure/database/models';
import { AlertEngine } from './application/services/AlertEngine';
import { EmergencyService } from './application/services/EmergencyService';

async function simulate() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(env.MONGODB_URI);
    console.log('✅ Connected successfully.');

    // 1. Find or create a test user
    let user = await User.findOne({ email: 'sarah.test@maternalink.com' });
    if (!user) {
      console.log('➕ Creating a new test patient user...');
      user = new User({
        email: 'sarah.test@maternalink.com',
        password: 'password123', // Not running bcrypt check for simple seed
        name: 'Sarah Jenkins',
        age: 28,
        role: 'mother',
      });
      await user.save();
    }
    console.log(`👤 Active User: ${user.name} (ID: ${user._id})`);

    const userId = user._id.toString();

    // 2. Set up Emergency settings for this user
    console.log('⚙️ Configuring emergency settings...');
    await EmergencySettings.findOneAndUpdate(
      { userId: user._id },
      {
        userId: user._id,
        whatsappAlertsEnabled: true,
        pushNotificationsEnabled: true,
        autoAlertsEnabled: true,
        sosButtonEnabled: true,
      },
      { upsert: true, new: true }
    );
    console.log('✅ Settings saved.');

    // 3. Set up Emergency contacts list for this user
    console.log('👥 Seeding emergency contacts list...');
    const contactsPayload = [
      {
        name: 'John Jenkins (Husband)',
        relation: 'Husband',
        phone: '+15551234567',
        whatsapp: '+15551234567',
        priority: 1,
      },
      {
        name: 'Dr. Evelyn Carter (Obstetrician)',
        relation: 'Doctor',
        phone: '+15559876543',
        whatsapp: '+15559876543',
        priority: 2,
      },
    ];

    await EmergencyContacts.findOneAndUpdate(
      { userId: user._id },
      { userId: user._id, contacts: contactsPayload },
      { upsert: true, new: true }
    );
    console.log('✅ Emergency contacts list seeded successfully.');

    console.log('\n--- SIMULATION 1: Manual SOS Button Trigger ---');
    console.log('Double press signal received from ESP32...');
    const manualResult = await EmergencyService.processAlert({
      userId,
      triggerType: 'SOS_BUTTON',
      sensorSnapshot: { deviceId: 'belt_esp32_0987', batteryLevel: 85 },
      location: { latitude: 37.7749, longitude: -122.4194 },
    });
    console.log('Alert saved to database:', manualResult.alert._id);
    console.log('Notifications sent flags:', manualResult.alert.notificationsSent);

    console.log('\n--- SIMULATION 2: Automatic Trigger (Single Condition: Fall Detected) ---');
    console.log('Sensor analytics reports fallDetected = true...');
    const sensorSnapshotFall = {
      fallDetected: true,
      maternalHeartRate: 98,
      stressLevel: 45,
    };
    
    // Analyze using AlertEngine
    const fallAnalysis = AlertEngine.analyze(sensorSnapshotFall);
    if (fallAnalysis) {
      console.log(`🚨 Alert Engine triggered: ${fallAnalysis.triggerType} (Severity: ${fallAnalysis.severity})`);
      const fallResult = await EmergencyService.processAlert({
        userId,
        triggerType: fallAnalysis.triggerType,
        sensorSnapshot: sensorSnapshotFall,
        customMessage: fallAnalysis.message,
      });
      console.log('Alert saved to database:', fallResult.alert._id);
      console.log('Notifications sent flags:', fallResult.alert.notificationsSent);
    }

    console.log('\n--- SIMULATION 3: Automatic Trigger (Multiple Risk Factors) ---');
    console.log('Sensor analytics reports heartRate = 125 bpm AND stressLevel = 85%...');
    const sensorSnapshotMulti = {
      fallDetected: false,
      maternalHeartRate: 128,
      stressLevel: 88,
      fetalHeartRate: 145,
    };

    // Analyze using AlertEngine
    const multiAnalysis = AlertEngine.analyze(sensorSnapshotMulti);
    if (multiAnalysis) {
      console.log(`🚨 Alert Engine triggered: ${multiAnalysis.triggerType} (Severity: ${multiAnalysis.severity})`);
      const multiResult = await EmergencyService.processAlert({
        userId,
        triggerType: multiAnalysis.triggerType,
        sensorSnapshot: sensorSnapshotMulti,
        customMessage: multiAnalysis.message,
      });
      console.log('Alert saved to database:', multiResult.alert._id);
      console.log('Notifications sent flags:', multiResult.alert.notificationsSent);
    }

    console.log('\n--- SIMULATION 4: Normal Sensor Data (No Trigger) ---');
    console.log('Sensor analytics reports vitals are normal...');
    const sensorSnapshotNormal = {
      fallDetected: false,
      maternalHeartRate: 75,
      stressLevel: 30,
      fetalHeartRate: 135,
    };

    const normalAnalysis = AlertEngine.analyze(sensorSnapshotNormal);
    if (!normalAnalysis) {
      console.log('✅ Alert Engine verified: Readings normal, no alerts generated.');
    } else {
      console.warn('⚠️ Alert Engine triggered unexpectedly on normal data:', normalAnalysis);
    }

    // 5. Fetch alert history for the user
    console.log('\n--- FETCH HISTORY LOGS ---');
    const logs = await EmergencyAlert.find({ userId: user._id }).sort({ createdAt: -1 });
    console.log(`📋 Total Alerts in database for Sarah: ${logs.length}`);
    logs.forEach((log) => {
      console.log(`- [${log.createdAt.toISOString()}] Trigger: ${log.triggerType}, Severity: ${log.severity}, Status: ${log.status}`);
    });

    console.log('\n🔌 Disconnecting from MongoDB...');
    await mongoose.disconnect();
    console.log('✅ Simulation completed successfully.');
  } catch (error) {
    console.error('❌ Error during simulation:', error);
    try { await mongoose.disconnect(); } catch {}
  }
}

simulate();
