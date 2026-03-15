import { define } from "@/utils.ts";

export const handler = define.handlers({
  async GET(ctx) {
    const gameId = ctx.url.searchParams.get("gameId");
    const [entries, playerRank] = await Promise.all([
      ctx.state.gameService.getLeaderboard(),
      gameId
        ? ctx.state.gameService.getLeaderboardRank(gameId)
        : Promise.resolve(null),
    ]);
    return Response.json({ entries, playerRank });
  },
});
