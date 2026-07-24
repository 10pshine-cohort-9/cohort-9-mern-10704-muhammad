const { z } = require('zod');
require('dotenv').config();

const envSchema = z
  .object({
    PORT: z.coerce.number().default(5000),
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),
    MONGODB_URI: z.string().default('mongodb://localhost:27017/noteshub'),
    JWT_ACCESS_SECRET: z.string().min(16).default('default-access-secret-key-change-me'),
    JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
    JWT_REFRESH_SECRET: z.string().min(16).default('default-refresh-secret-key-change-me'),
    JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  })
  .refine(
    (data) => {
      if (data.NODE_ENV === 'production') {
        if (data.JWT_ACCESS_SECRET.includes('default-access-secret-key-change-me')) {
          return false;
        }
        if (data.JWT_REFRESH_SECRET.includes('default-refresh-secret-key-change-me')) {
          return false;
        }
      }
      return true;
    },
    {
      message: 'Default JWT secrets must not be used in production environment.',
      path: ['JWT_ACCESS_SECRET'],
    }
  );

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment configuration:', parsed.error.format());
  process.exit(1);
}

module.exports = parsed.data;
