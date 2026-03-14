import { define } from "@/utils.ts";

export const handler = define.handlers({
  async GET(ctx) {
    const gameId = ctx.url.searchParams.get("gameId");
    if (gameId) {
      const rankData = await ctx.state.gameService.getLeaderboardRank(gameId);
      return Response.json(rankData);
    }
    const entries = await ctx.state.gameService.getLeaderboard();
    return Response.json(entries);
  },
});
