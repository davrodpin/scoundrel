import { GameActionSchema } from "@scoundrel/engine";
import { AppError } from "@scoundrel/errors";
import { define } from "@/utils.ts";

export const handler = define.handlers({
  async POST(ctx) {
    let body: unknown;
    try {
      body = await ctx.req.json();
    } catch {
      throw new AppError("InvalidJsonError", 422);
    }

    const parseResult = GameActionSchema.safeParse(body);
    if (!parseResult.success) {
      throw new AppError("ValidationError", 422);
    }

    const view = await ctx.state.gameService.submitAction(
      ctx.params.id,
      parseResult.data,
    );
    return Response.json(view);
  },
});
