import { z } from "zod";

export const configSchema = z.object({
  db: z.object({
    url: z.string().min(1),
  }),
  app: z.object({
    origin: z.string().default("https://scoundrel.deno.dev"),
    maxBodyBytes: z.number().int().positive().default(4096),
    maxPlayerNameLength: z.number().int().positive().default(16),
  }).default({}),
  game: z.object({
    defaultPlayerName: z.string().default("Anonymous"),
    leaderboardLimit: z.number().int().positive().default(25),
  }).default({}),
  deploy: z.object({
    id: z.string().optional(),
  }).default({}),
  cleanup: z.object({
    retentionDays: z.number().int().positive().default(30),
  }).default({}),
});

export type AppConfig = z.infer<typeof configSchema>;
