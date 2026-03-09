import { define } from "@/utils.ts";

export const handler = define.handlers({
  async GET(ctx) {
    const view = await ctx.state.gameService.getGame(ctx.params.id);
    return Response.json(view);
  },
});
