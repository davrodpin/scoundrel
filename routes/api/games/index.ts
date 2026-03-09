import { define } from "@/utils.ts";
import { AppError } from "@scoundrel/errors";
import { z } from "zod";
import { isPlayerNameAllowed } from "@scoundrel/validation";

const createGameSchema = z.object({
  playerName: z
    .string()
    .min(1)
    .max(30)
    .trim()
    .refine(isPlayerNameAllowed, {
      message: "Player name contains inappropriate language",
    }),
});

export const handler = define.handlers({
  async POST(ctx) {
    const body = await ctx.req.json().catch(() => null);
    const parsed = createGameSchema.safeParse(body);
    if (!parsed.success) {
      throw new AppError("ValidationError", 422);
    }
    const view = await ctx.state.gameService.createGame(parsed.data.playerName);
    return Response.json(view, { status: 201 });
  },
});
