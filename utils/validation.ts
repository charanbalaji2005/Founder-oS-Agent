import { z } from "zod";

export const startupIdeaSchema = z.object({
  idea: z
    .string()
    .min(10, "Please describe your idea in at least 10 characters")
    .max(800, "Please keep your idea under 800 characters"),
  industry: z.string().min(1, "Please select an industry"),
  targetUsers: z
    .string()
    .min(5, "Please describe your target users")
    .max(200, "Keep this under 200 characters"),
});

export const authSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  name: z.string().optional(),
});

export const apiKeySchema = z.object({
  apiKey: z
    .string()
    .min(10, "API key looks too short")
    .refine(
      (val) => val.startsWith("gsk_") || val.startsWith("groq_"),
      "Groq API keys start with 'gsk_'"
    ),
});

export const projectUpdateSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  status: z.enum(["draft", "in_progress", "complete"]).optional(),
});

export type StartupIdeaSchema = z.infer<typeof startupIdeaSchema>;
export type AuthSchema = z.infer<typeof authSchema>;
export type ApiKeySchema = z.infer<typeof apiKeySchema>;
