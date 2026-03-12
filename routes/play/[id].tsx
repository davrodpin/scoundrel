import { define } from "@/utils.ts";
import GameBoard from "../../islands/GameBoard.tsx";

export default define.page(function PlayByIdPage(ctx) {
  return <GameBoard gameId={ctx.params.id} />;
});
