import { z } from 'zod';

// Define the schema for environment variables
const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  
  // NextAuth.js
  NEXTAUTH_URL: z.string().url().optional(),
  NEXTAUTH_SECRET: z.string().min(1, 'NEXTAUTH_SECRET is required'),
  
  // JWT
  JWT_SECRET: z.string().min(1, 'JWT_SECRET is required'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  REFRESH_TOKEN_SECRET: z.string().min(1, 'REFRESH_TOKEN_SECRET is required'),
  REFRESH_TOKEN_EXPIRES_IN: z.string().default('30d'),
  
  // API
  API_BASE_URL: z.string().url().default('http://localhost:3000/api'),
  
  // Email
  EMAIL_HOST: z.string().optional(),
  EMAIL_PORT: z.coerce.number().optional(),
  EMAIL_USER: z.string().optional(),
  EMAIL_PASSWORD: z.string().optional(),
  EMAIL_FROM: z.string().optional(),
  
  // SMS
  SMS_PROVIDER: z.string().optional(),
  TWILIO_ACCOUNT_SID: z.string().optional(),
  TWILIO_AUTH_TOKEN: z.string().optional(),
  TWILIO_PHONE_NUMBER: z.string().optional(),
  
  // File Upload
  UPLOAD_DIR: z.string().default('./public/uploads'),
  MAX_FILE_SIZE: z.coerce.number().default(5242880), // 5MB
  
  // Timezone
  DEFAULT_TIMEZONE: z.string().default('Europe/Madrid'),
  
  // App Configuration
  APP_NAME: z.string().default('CRM Restaurante'),
  APP_VERSION: z.string().default('1.0.0'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  
  // Redis (optional)
  REDIS_URL: z.string().optional(),
  
  // Analytics (optional)
  GOOGLE_ANALYTICS_ID: z.string().optional(),
  
  // Monitoring (optional)
  SENTRY_DSN: z.string().optional(),
  
  // Development
  NEXT_PUBLIC_APP_URL: z.string().url().default('http://localhost:3000'),
});

// Validate environment variables
function validateEnv() {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.errors.map(
        (issue) => `${issue.path.join('.')}: ${issue.message}`
      );
      throw new Error(`Environment validation failed: ${errorMessages.join(', ')}`);
    }
    throw error;
  }
}

// Export validated environment variables
export const env = validateEnv();

// Export types for environment variables
export type Env = z.infer<typeof envSchema>;