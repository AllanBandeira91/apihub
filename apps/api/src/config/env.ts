import dotenv from 'dotenv';
import path from 'path';
import { z } from 'zod';

// Load .env from root or apps/api
dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });
dotenv.config();

const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(3333),
  HOST: z.string().default('0.0.0.0'),
  DATABASE_URL: z.string().default('postgresql://postgres:postgres@localhost:5432/apihub?schema=public'),
  JWT_SECRET: z.string().min(16).default('development-secret-jwt-key-min-16-chars'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  COOKIE_SECRET: z.string().min(16).default('development-cookie-secret-min-16-chars'),
  CORS_ORIGIN: z.string().default('http://localhost:3000'),
  TESTER_TIMEOUT_MS: z.coerce.number().default(10000),
  TESTER_MAX_BODY_BYTES: z.coerce.number().default(1048576), // 1MB
  TESTER_MAX_RESPONSE_BYTES: z.coerce.number().default(5242880), // 5MB
  TESTER_ALLOW_PRIVATE_IPS: z.string().transform(v => v === 'true').default('false'),
  SMTP_HOST: z.string().default('smtp.gmail.com'),
  SMTP_PORT: z.coerce.number().default(465),
  SMTP_SECURE: z.string().transform(v => v !== 'false').default('true'),
  SMTP_USER: z.string().default('apihubsupport@gmail.com'),
  SMTP_PASS: z.string().default(''),
  SMTP_FROM: z.string().default('APIHub <apihubsupport@gmail.com>'),
});

export const env = EnvSchema.parse(process.env);
