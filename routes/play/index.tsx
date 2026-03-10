import { define } from "@/utils.ts";
import GameBoard from "../../islands/GameBoard.tsx";

export default define.page(function PlayPage() {
  return (
    <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Scoundrel - Play</title>
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="stylesheet" href="/styles.css" />
      </head>
      <body class="bg-dungeon-bg">
        <GameBoard />
      </body>
    </html>
  );
});
