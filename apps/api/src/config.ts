import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(4030),
  HOST: z.string().default('0.0.0.0'),

  // Database
  DATABASE_URL: z.string(),

  // JWT
  JWT_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),

  // R2/S3 Storage
  R2_ENDPOINT: z.string(),
  R2_BUCKET: z.string().default('clrvault'),
  R2_ACCESS_KEY_ID: z.string(),
  R2_SECRET_ACCESS_KEY: z.string(),
  R2_PUBLIC_URL: z.string().optional(),
  R2_REGION: z.string().default('auto'),

  // Workers
  THUMBNAIL_WORKER_ENABLED: z.coerce.boolean().default(true),
  METADATA_WORKER_ENABLED: z.coerce.boolean().default(true),
  USAGE_AGGREGATION_ENABLED: z.coerce.boolean().default(true),
  WORKER_POLL_INTERVAL_MS: z.coerce.number().default(5000),

  // Rate Limiting
  RATE_LIMIT_MAX: z.coerce.number().default(100),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(60000),

  // Upload Limits
  MAX_FILE_SIZE_MB: z.coerce.number().default(500),
  MAX_MULTIPART_FILES: z.coerce.number().default(10),
});

function loadConfig() {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    console.error('Invalid environment variables:');
    for (const issue of result.error.issues) {
      console.error(`  ${issue.path.join('.')}: ${issue.message}`);
    }
    process.exit(1);
  }
  return result.data;
}

export const config = loadConfig();
export type Config = z.infer<typeof envSchema>;
