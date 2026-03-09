import { define } from "@/utils.ts";

export const handler = define.handlers({
  async GET(ctx) {
    const entries = await ctx.state.gameService.getLeaderboard();
    return Response.json(entries);
  },
});
