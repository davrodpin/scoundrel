// Resize and compress all card images in static/decks/ to max 460px wide.
// JPEGs are output at quality 80; PNGs use compression level 9 with palette.
// Run with: deno task optimize:cards
import sharp from "npm:sharp@0.33";
import { join } from "jsr:@std/path@^1";

const DECKS_DIR = new URL("../static/decks/", import.meta.url).pathname;
const MAX_WIDTH = 460;
const JPEG_QUALITY = 80;

async function getFileSize(path: string): Promise<number> {
  const stat = await Deno.stat(path);
  return stat.size;
}

function formatKB(bytes: number): string {
  return `${(bytes / 1024).toFixed(1)}KB`;
}

async function optimizeDeck(deckDir: string, deckName: string): Promise<{
  before: number;
  after: number;
}> {
  const entries: string[] = [];
  for await (const entry of Deno.readDir(deckDir)) {
    if (entry.isFile && /\.(jpe?g|png)$/i.test(entry.name)) {
      entries.push(entry.name);
    }
  }
  entries.sort();

  console.log(`\n[${deckName}] ${entries.length} images`);

  let deckBefore = 0;
  let deckAfter = 0;

  for (const name of entries) {
    const filePath = join(deckDir, name);
    const before = await getFileSize(filePath);
    deckBefore += before;

    const isPng = /\.png$/i.test(name);
    const resized = sharp(filePath).resize({
      width: MAX_WIDTH,
      withoutEnlargement: true,
    });

    const outputBuffer = isPng
      ? await resized.png({ compressionLevel: 9, palette: true }).toBuffer()
      : await resized.jpeg({ quality: JPEG_QUALITY }).toBuffer();

    await Deno.writeFile(filePath, outputBuffer);

    const after = outputBuffer.byteLength;
    deckAfter += after;

    const saved = before > 0
      ? ((before - after) / before * 100).toFixed(0)
      : "0";
    console.log(
      `  ${name}: ${formatKB(before)} → ${formatKB(after)} (-${saved}%)`,
    );
  }

  console.log(
    `  [${deckName}] subtotal: ${formatKB(deckBefore)} → ${
      formatKB(deckAfter)
    } (-${
      deckBefore > 0
        ? ((deckBefore - deckAfter) / deckBefore * 100).toFixed(0)
        : "0"
    }%)`,
  );

  return { before: deckBefore, after: deckAfter };
}

const deckEntries: string[] = [];
for await (const entry of Deno.readDir(DECKS_DIR)) {
  if (entry.isDirectory) {
    deckEntries.push(entry.name);
  }
}
deckEntries.sort();

console.log(`Optimizing decks in ${DECKS_DIR}`);
console.log(`Decks found: ${deckEntries.join(", ")}`);

let totalBefore = 0;
let totalAfter = 0;

for (const deckName of deckEntries) {
  const deckDir = join(DECKS_DIR, deckName);
  const { before, after } = await optimizeDeck(deckDir, deckName);
  totalBefore += before;
  totalAfter += after;
}

console.log(
  `\nGrand total: ${formatKB(totalBefore)} → ${formatKB(totalAfter)} (-${
    totalBefore > 0
      ? ((totalBefore - totalAfter) / totalBefore * 100).toFixed(0)
      : "0"
  }%)`,
);
