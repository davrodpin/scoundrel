import { define } from "@/utils.ts";

export default define.page(function App({ Component }) {
  return (
    <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Scoundrel</title>
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="stylesheet" href="/styles.css" />
      </head>
      <body class="bg-dungeon-bg">
        <Component />
      </body>
    </html>
  );
});
