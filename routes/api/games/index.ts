import { define } from "@/utils.ts";

export const handler = define.handlers({
  async POST(ctx) {
    const view = await ctx.state.gameService.createGame();
    return Response.json(view, { status: 201 });
  },
});
