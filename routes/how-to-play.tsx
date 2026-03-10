import { define } from "@/utils.ts";
import HowToPlay from "../islands/HowToPlay.tsx";

export default define.page(function HowToPlayPage() {
  return (
    <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Scoundrel - How to Play</title>
        <link rel="stylesheet" href="/styles.css" />
      </head>
      <body class="bg-dungeon-bg">
        <HowToPlay />
      </body>
    </html>
  );
});
