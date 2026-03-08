import { define } from "@/utils.ts";

export const handler = define.handlers({
  async GET(ctx) {
    const gameId = ctx.params.id;
    const view = await ctx.state.gameService.getGame(gameId);

    if (!view) {
      return Response.json(
        { error: { code: "GAME_NOT_FOUND", message: "Game not found" } },
        { status: 404 },
      );
    }

    return Response.json(view);
  },
});
