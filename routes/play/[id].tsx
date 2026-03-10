import { define } from "@/utils.ts";
import GameBoard from "../../islands/GameBoard.tsx";

export default define.page(function PlayByIdPage(ctx) {
  return (
    <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Scoundrel - Play</title>
        <link rel="stylesheet" href="/styles.css" />
      </head>
      <body class="bg-dungeon-bg">
        <GameBoard gameId={ctx.params.id} />
      </body>
    </html>
  );
});
