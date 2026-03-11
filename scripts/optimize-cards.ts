// Resize and compress all card images in static/cards/ to max 460px wide at JPEG quality 80.
// Run with: deno task optimize:cards
import sharp from "npm:sharp@0.33";
import { join } from "jsr:@std/path@^1";

const CARDS_DIR = new URL("../static/cards/", import.meta.url).pathname;
const MAX_WIDTH = 460;
const JPEG_QUALITY = 80;

async function getFileSize(path: string): Promise<number> {
  const stat = await Deno.stat(path);
  return stat.size;
}

function formatKB(bytes: number): string {
  return `${(bytes / 1024).toFixed(1)}KB`;
}

const entries = [];
for await (const entry of Deno.readDir(CARDS_DIR)) {
  if (entry.isFile && /\.(jpe?g|png)$/i.test(entry.name)) {
    entries.push(entry.name);
  }
}
entries.sort();

console.log(`Optimizing ${entries.length} images in ${CARDS_DIR}\n`);

let totalBefore = 0;
let totalAfter = 0;

for (const name of entries) {
  const filePath = join(CARDS_DIR, name);
  const before = await getFileSize(filePath);
  totalBefore += before;

  const outputBuffer = await sharp(filePath)
    .resize({ width: MAX_WIDTH, withoutEnlargement: true })
    .jpeg({ quality: JPEG_QUALITY })
    .toBuffer();

  await Deno.writeFile(filePath, outputBuffer);

  const after = outputBuffer.byteLength;
  totalAfter += after;

  const saved = ((before - after) / before * 100).toFixed(0);
  console.log(
    `  ${name}: ${formatKB(before)} → ${formatKB(after)} (-${saved}%)`,
  );
}

console.log(
  `\nTotal: ${formatKB(totalBefore)} → ${formatKB(totalAfter)} (-${
    ((totalBefore - totalAfter) / totalBefore * 100).toFixed(0)
  }%)`,
);
