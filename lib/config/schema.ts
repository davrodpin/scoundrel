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
    leaderboardLimit: z.number().int().positive().default(100),
  }).default({}),
  deploy: z.object({
    id: z.string().optional(),
  }).default({}),
  cleanup: z.object({
    retentionDays: z.number().int().positive().default(30),
  }).default({}),
  feedback: z.object({
    githubToken: z.string().min(1),
    githubRepo: z.string().default("davrodpin/scoundrel"),
    githubLabel: z.string().default("feedback"),
    maxMessageLength: z.number().int().positive().default(2000),
  }).optional(),
  axiom: z.object({
    apiToken: z.string().min(1),
    dataset: z.string().min(1),
  }).optional(),
});

export type AppConfig = z.infer<typeof configSchema>;
