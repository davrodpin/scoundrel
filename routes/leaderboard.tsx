import { define } from "@/utils.ts";
import Leaderboard from "../islands/Leaderboard.tsx";

export default define.page(function LeaderboardPage(ctx) {
  const gameId = ctx.url.searchParams.get("gameId") ?? undefined;
  return <Leaderboard gameId={gameId} />;
});
