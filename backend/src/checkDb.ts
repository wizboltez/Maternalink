import mongoose from 'mongoose';
import { env } from './config/env';
import { User, PregnancyProfile } from './infrastructure/database/models';

async function check() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(env.MONGODB_URI);
    console.log('✅ Connected.');

    const users = await User.find({});
    console.log(`👥 Registered users count: ${users.length}`);
    users.forEach((u) => {
      console.log(`- ID: ${u._id}, Email: ${u.email}, Name: ${u.name}, Age: ${u.age}`);
    });

    const profiles = await PregnancyProfile.find({});
    console.log(`📋 Pregnancy profiles count: ${profiles.length}`);
    profiles.forEach((p) => {
      console.log(`- UserID: ${p.userId}, Week: ${p.pregnancyWeek}, Trimester: ${p.trimester}`);
    });

    await mongoose.disconnect();
  } catch (e) {
    console.error('Error:', e);
  }
}

check();
