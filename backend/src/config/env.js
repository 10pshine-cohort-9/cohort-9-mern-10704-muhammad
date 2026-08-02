const { z } = require('zod');
require('dotenv').config();

const durationRegex = /^[1-9]\d*[smhdwy]$/i;

const envSchema = z
  .object({
    PORT: z.coerce.number().default(5000),
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),
    MONGODB_URI: z.string().min(1, 'MONGODB_URI is required'),
    JWT_ACCESS_SECRET: z.string().min(16).default('default-access-secret-key-change-me'),
    JWT_ACCESS_EXPIRES_IN: z
      .string()
      .regex(durationRegex, 'Invalid JWT_ACCESS_EXPIRES_IN format')
      .default('15m'),
    JWT_REFRESH_SECRET: z.string().min(16).default('default-refresh-secret-key-change-me'),
    JWT_REFRESH_EXPIRES_IN: z
      .string()
      .regex(durationRegex, 'Invalid JWT_REFRESH_EXPIRES_IN format')
      .default('7d'),
    CLOUDINARY_CLOUD_NAME: z.string().default(''),
    CLOUDINARY_API_KEY: z.string().default(''),
    CLOUDINARY_API_SECRET: z.string().default(''),
    FRONTEND_URL: z.string().default('http://localhost:3000'),
  })
  .refine(
    (d) =>
      d.NODE_ENV === 'test' ||
      (!d.JWT_ACCESS_SECRET.includes('default-access-secret-key-change-me') &&
        !d.JWT_REFRESH_SECRET.includes('default-refresh-secret-key-change-me')),
    {
      message: 'Default JWT secrets must not be used outside of test environment.',
      path: ['JWT_ACCESS_SECRET'],
    }
  )
  .refine(
    (d) =>
      d.NODE_ENV === 'test' ||
      (Boolean(d.CLOUDINARY_CLOUD_NAME) &&
        Boolean(d.CLOUDINARY_API_KEY) &&
        Boolean(d.CLOUDINARY_API_SECRET)),
    {
      message: 'Cloudinary credentials are required outside of test environment.',
      path: ['CLOUDINARY_CLOUD_NAME'],
    }
  );

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment configuration:', parsed.error.format());
  process.exit(1);
}

module.exports = parsed.data;
