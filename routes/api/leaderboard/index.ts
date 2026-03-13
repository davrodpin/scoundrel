import { define } from "@/utils.ts";

export const handler = define.handlers({
  async GET(ctx) {
    const gameId = ctx.url.searchParams.get("gameId");
    if (gameId) {
      const entry = await ctx.state.gameService.getLeaderboardEntry(gameId);
      return Response.json(entry ? [entry] : []);
    }
    const entries = await ctx.state.gameService.getLeaderboard();
    return Response.json(entries);
  },
});
