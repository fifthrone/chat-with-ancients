import { z } from "zod";

export const clientIdSchema = z
  .string()
  .trim()
  .min(1)
  .max(128)
  .regex(/^[\w.-]+$/, "clientId contains invalid characters");

export const chatSessionBodySchema = z.object({
  clientId: clientIdSchema,
});

export const conversationQuerySchema = z.object({
  slug: z.string().trim().min(1).max(64),
});

export const chatPostBodySchema = z.object({
  slug: z.string().trim().min(1).max(64),
  messages: z
    .array(
      z
        .object({
          id: z.string().optional(),
          role: z.enum(["user", "assistant", "system"]),
          parts: z.array(z.unknown()),
        })
        .passthrough(),
    )
    .min(1),
});

export type ChatPostBody = z.infer<typeof chatPostBodySchema>;
