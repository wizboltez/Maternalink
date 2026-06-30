import mongoose from 'mongoose';
import { env } from './config/env';
import { User, EmergencyContacts } from './infrastructure/database/models';
import { EmergencyService } from './application/services/EmergencyService';

async function main() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(env.MONGODB_URI);
    console.log('✅ Connected.');

    // Find the latest user who has configured emergency contacts
    const contactsDoc = await EmergencyContacts.findOne({}).sort({ updatedAt: -1 });
    if (!contactsDoc || contactsDoc.contacts.length === 0) {
      console.log('❌ No user has configured emergency contacts yet. Please add a contact in the React Native app first!');
      await mongoose.disconnect();
      return;
    }

    const user = await User.findById(contactsDoc.userId);
    if (!user) {
      console.log(`❌ User associated with contact list not found (ID: ${contactsDoc.userId})`);
      await mongoose.disconnect();
      return;
    }

    console.log(`🎯 Found User: ${user.name} (ID: ${user._id})`);
    console.log(`📞 Configured contacts count: ${contactsDoc.contacts.length}`);
    contactsDoc.contacts.forEach((c, idx) => {
      console.log(`  ${idx + 1}. ${c.name} (WhatsApp: ${c.whatsapp})`);
    });

    console.log('\n🚨 Triggering test SOS Alert...');
    const result = await EmergencyService.processAlert({
      userId: user._id.toString(),
      triggerType: 'SOS_BUTTON',
      sensorSnapshot: { deviceId: 'test_maternal_belt_123', batteryLevel: 99 },
      location: { latitude: 37.7749, longitude: -122.4194 },
    });

    console.log('\n📊 Trigger Results:');
    console.log(`  Alert Saved ID: ${result.alert._id}`);
    console.log(`  WhatsApp Delivered: ${result.whatsappSent ? '✅ YES' : '❌ NO'}`);
    console.log(`  Push Delivered: ${result.pushSent ? '✅ YES' : '❌ NO'}`);

    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Error triggering test alert:', error);
    try { await mongoose.disconnect(); } catch {}
  }
}

main();
