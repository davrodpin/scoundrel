import { define } from "@/utils.ts";
import GameBoard from "../islands/GameBoard.tsx";

export default define.page(function PlayPage() {
  return (
    <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Scoundrel - Play</title>
        <link rel="stylesheet" href="/styles.css" />
      </head>
      <body class="bg-dungeon-bg">
        <GameBoard />
        <footer class="text-center py-4">
          <a
            href="/how-to-play"
            class="text-parchment-dark hover:text-torch-glow text-sm transition-colors duration-200"
          >
            How to Play
          </a>
        </footer>
      </body>
    </html>
  );
});
