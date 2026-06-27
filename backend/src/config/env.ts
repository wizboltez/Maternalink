import dotenv from 'dotenv';
import path from 'path';
import { z } from 'zod';

// Load environmental configuration
dotenv.config({ path: path.join(__dirname, '../../.env') });

const envSchema = z.object({
  PORT: z.string().transform((val) => parseInt(val, 10)).default('5000'),
  MONGODB_URI: z.string().default('mongodb://localhost:27017/maternalink'),
  JWT_SECRET: z.string().min(10, 'JWT Secret should be at least 10 characters long'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  // Emergency Alert Configurations
  FIREBASE_KEYS: z.string().optional(),
  WHATSAPP_PROVIDER: z.enum(['meta', 'twilio']).default('meta'),
  WHATSAPP_CLOUD_API_TOKEN: z.string().optional(),
  WHATSAPP_PHONE_NUMBER_ID: z.string().optional(),
  TWILIO_SID: z.string().optional(),
  TWILIO_AUTH_TOKEN: z.string().optional(),
  TWILIO_WHATSAPP_NUMBER: z.string().optional(),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error('❌ Environment validation failed:', parsedEnv.error.format());
  process.exit(1);
}

export const env = parsedEnv.data;
