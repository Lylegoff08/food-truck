import { z } from "zod";

export const registrationSchema = z.object({
  companyName: z.string().min(2),
  companySlug: z
    .string()
    .min(2)
    .regex(/^[a-z0-9-]+$/),
  ownerName: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8)
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});
