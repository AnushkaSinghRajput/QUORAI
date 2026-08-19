import { z } from "zod";

export const researchRequestSchema = z.object({
  query: z
    .string()
    .trim()
    .min(2, "Query must be at least 2 characters")
    .max(500, "Query is too long"),
  mode: z.enum(["quick", "deep"]).default("quick"),
  sessionId: z.string().optional(),
  history: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().max(20_000),
      }),
    )
    .max(12)
    .optional(),
  attachments: z
    .array(
      z.object({
        name: z.string().trim().min(1).max(180),
        mime: z.string().max(80).optional(),
        text: z.string().min(8).max(24_000),
      }),
    )
    .max(3)
    .optional(),
});

export const signupSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(80, "Name is too long"),
  email: z.email("Enter a valid email").max(160).transform((value) => value.toLowerCase()),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password is too long")
    .regex(/\d/, "Include at least one number")
    .regex(/[^A-Za-z0-9]/, "Include at least one special character"),
});

export const loginSchema = z.object({
  email: z.email("Enter a valid email").max(160).transform((value) => value.toLowerCase()),
  password: z.string().min(1, "Password is required").max(128),
});

export const waitlistSchema = z.object({
  email: z.email("Enter a valid email").max(160).transform((value) => value.toLowerCase()),
});

export const contactSchema = z.object({
  name: z.string().trim().min(2, "Name is required").max(80),
  email: z.email("Enter a valid email").max(160).transform((value) => value.toLowerCase()),
  organization: z.string().trim().max(120).optional(),
  message: z.string().trim().min(8, "Message is too short").max(4000),
});

export const faqHelpfulSchema = z.object({
  id: z.string().trim().min(2).max(80),
});
