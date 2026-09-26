import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  PORT: z.string().default('5000').transform((val) => parseInt(val, 10)),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  JWT_SECRET: z.string().default('lexify_research_secret_key_development_only_min_32_characters'),
  DATABASE_URL: z.string().default('file:./dev.db'),
  ALLOW_QUICK_LOGIN: z
    .string()
    .default('true')
    .transform((val) => val === 'true' || val === '1'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:', parsed.error.format());
  throw new Error('Invalid environment configuration');
}

// In production, force ALLOW_QUICK_LOGIN to false
const validatedEnv = {
  ...parsed.data,
  ALLOW_QUICK_LOGIN: parsed.data.NODE_ENV === 'production' ? false : parsed.data.ALLOW_QUICK_LOGIN,
};

export const env = validatedEnv;
