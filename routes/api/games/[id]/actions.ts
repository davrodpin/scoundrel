import { GameActionSchema } from "@scoundrel/engine";
import { define } from "@/utils.ts";

export const handler = define.handlers({
  async POST(ctx) {
    const gameId = ctx.params.id;

    let body: unknown;
    try {
      body = await ctx.req.json();
    } catch {
      return Response.json(
        {
          error: {
            code: "INVALID_JSON",
            message: "Request body must be valid JSON",
          },
        },
        { status: 422 },
      );
    }

    const parseResult = GameActionSchema.safeParse(body);
    if (!parseResult.success) {
      return Response.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: parseResult.error.message,
          },
        },
        { status: 422 },
      );
    }

    const result = await ctx.state.gameService.submitAction(
      gameId,
      parseResult.data,
    );

    if (!result.ok) {
      if (result.error === "Game not found") {
        return Response.json(
          {
            error: { code: "GAME_NOT_FOUND", message: "Game not found" },
          },
          { status: 404 },
        );
      }
      return Response.json(
        {
          error: { code: "INVALID_ACTION", message: result.error },
        },
        { status: 422 },
      );
    }

    return Response.json(result.view);
  },
});
