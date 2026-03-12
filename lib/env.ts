import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(16),
  APP_URL: z.string().url().optional(),
  STRIPE_CLIENT_ID: z.string().optional(),
  STRIPE_SECRET_KEY: z.string().optional(),
  CRON_SECRET: z.string().optional()
});

export function getEnv() {
  return envSchema.parse({
    DATABASE_URL: process.env.DATABASE_URL,
    JWT_SECRET: process.env.JWT_SECRET,
    APP_URL: process.env.APP_URL,
    STRIPE_CLIENT_ID: process.env.STRIPE_CLIENT_ID,
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
    CRON_SECRET: process.env.CRON_SECRET
  });
}
