import { assertEquals, assertNotEquals } from "@std/assert";
import {
  cardIdentifier,
  deckCardBackPath,
  deckCardImagePath,
  getAllCardIdentifiers,
  getAllDeckCardImagePaths,
  validateDeckMetadata,
} from "./decks.ts";
import type { DeckInfo } from "./decks.ts";
import type { Card } from "@scoundrel/engine";

const CLASSIC_DECK: DeckInfo = {
  id: "dungeon",
  name: "Dungeon",
  basePath: "/decks/dungeon",
  cards: {
    "clubs_2": "clubs_2.jpg",
    "clubs_3": "clubs_3.jpg",
    "clubs_4": "clubs_4.jpg",
    "clubs_5": "clubs_5.jpg",
    "clubs_6": "clubs_6.jpg",
    "clubs_7": "clubs_7.jpg",
    "clubs_8": "clubs_8.jpg",
    "clubs_9": "clubs_9.jpg",
    "clubs_10": "clubs_10.jpg",
    "clubs_j": "clubs_j.jpg",
    "clubs_q": "clubs_q.jpg",
    "clubs_k": "clubs_k.jpg",
    "clubs_a": "clubs_a.jpg",
    "spades_2": "spades_2.jpg",
    "spades_3": "spades_3.jpg",
    "spades_4": "spades_4.jpg",
    "spades_5": "spades_5.jpg",
    "spades_6": "spades_6.jpg",
    "spades_7": "spades_7.jpg",
    "spades_8": "spades_8.jpg",
    "spades_9": "spades_9.jpg",
    "spades_10": "spades_10.jpg",
    "spades_j": "spades_j.jpg",
    "spades_q": "spades_q.jpg",
    "spades_k": "spades_k.jpg",
    "spades_a": "spades_a.jpg",
    "diamonds_2": "diamonds_2.jpg",
    "diamonds_3": "diamonds_3.jpg",
    "diamonds_4": "diamonds_4.jpg",
    "diamonds_5": "diamonds_5.jpg",
    "diamonds_6": "diamonds_6.jpg",
    "diamonds_7": "diamonds_7.jpg",
    "diamonds_8": "diamonds_8.jpg",
    "diamonds_9": "diamonds_9.jpg",
    "diamonds_10": "diamonds_10.jpg",
    "hearts_2": "hearts_2.jpg",
    "hearts_3": "hearts_3.jpg",
    "hearts_4": "hearts_4.jpg",
    "hearts_5": "hearts_5.jpg",
    "hearts_6": "hearts_6.jpg",
    "hearts_7": "hearts_7.jpg",
    "hearts_8": "hearts_8.jpg",
    "hearts_9": "hearts_9.jpg",
    "hearts_10": "hearts_10.jpg",
    "card_back": "card_cover.jpg",
  },
};

Deno.test("cardIdentifier — pip card", () => {
  const card: Card = { suit: "clubs", rank: 7 };
  assertEquals(cardIdentifier(card), "clubs_7");
});

Deno.test("cardIdentifier — face cards use letter abbreviations", () => {
  assertEquals(cardIdentifier({ suit: "spades", rank: 11 }), "spades_j");
  assertEquals(cardIdentifier({ suit: "spades", rank: 12 }), "spades_q");
  assertEquals(cardIdentifier({ suit: "spades", rank: 13 }), "spades_k");
  assertEquals(cardIdentifier({ suit: "clubs", rank: 14 }), "clubs_a");
});

Deno.test("getAllCardIdentifiers — returns exactly 45 identifiers", () => {
  const ids = getAllCardIdentifiers();
  assertEquals(ids.length, 45);
});

Deno.test("getAllCardIdentifiers — includes card_back", () => {
  const ids = getAllCardIdentifiers();
  assertEquals(ids.includes("card_back"), true);
});

Deno.test("getAllCardIdentifiers — includes all monster cards", () => {
  const ids = getAllCardIdentifiers();
  for (const suit of ["clubs", "spades"]) {
    for (
      const rank of [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "j",
        "q",
        "k",
        "a",
      ]
    ) {
      assertEquals(
        ids.includes(`${suit}_${rank}`),
        true,
        `missing ${suit}_${rank}`,
      );
    }
  }
});

Deno.test("getAllCardIdentifiers — includes all pip cards (diamonds, hearts)", () => {
  const ids = getAllCardIdentifiers();
  for (const suit of ["diamonds", "hearts"]) {
    for (const rank of ["2", "3", "4", "5", "6", "7", "8", "9", "10"]) {
      assertEquals(
        ids.includes(`${suit}_${rank}`),
        true,
        `missing ${suit}_${rank}`,
      );
    }
  }
});

Deno.test("getAllCardIdentifiers — no duplicates", () => {
  const ids = getAllCardIdentifiers();
  const unique = new Set(ids);
  assertEquals(unique.size, ids.length);
});

Deno.test("deckCardImagePath — resolves face-up card path", () => {
  const card: Card = { suit: "clubs", rank: 7 };
  assertEquals(
    deckCardImagePath(CLASSIC_DECK, card),
    "/decks/dungeon/clubs_7.jpg",
  );
});

Deno.test("deckCardImagePath — resolves face card path", () => {
  const card: Card = { suit: "spades", rank: 11 };
  assertEquals(
    deckCardImagePath(CLASSIC_DECK, card),
    "/decks/dungeon/spades_j.jpg",
  );
});

Deno.test("deckCardBackPath — resolves card back path", () => {
  assertEquals(deckCardBackPath(CLASSIC_DECK), "/decks/dungeon/card_cover.jpg");
});

Deno.test("getAllDeckCardImagePaths — returns exactly 45 paths", () => {
  const paths = getAllDeckCardImagePaths(CLASSIC_DECK);
  assertEquals(paths.length, 45);
});

Deno.test("getAllDeckCardImagePaths — all paths start with basePath", () => {
  const paths = getAllDeckCardImagePaths(CLASSIC_DECK);
  for (const p of paths) {
    assertEquals(
      p.startsWith("/decks/dungeon/"),
      true,
      `path does not start with basePath: ${p}`,
    );
  }
});

Deno.test("validateDeckMetadata — accepts valid metadata", () => {
  const data = {
    name: "Dungeon",
    cards: CLASSIC_DECK.cards,
  };
  const result = validateDeckMetadata(data);
  assertNotEquals(result, null);
  assertEquals(result!.name, "Dungeon");
});

Deno.test("validateDeckMetadata — rejects missing name", () => {
  const data = { cards: CLASSIC_DECK.cards };
  assertEquals(validateDeckMetadata(data), null);
});

Deno.test("validateDeckMetadata — rejects non-string name", () => {
  const data = { name: 42, cards: CLASSIC_DECK.cards };
  assertEquals(validateDeckMetadata(data), null);
});

Deno.test("validateDeckMetadata — rejects missing cards", () => {
  const data = { name: "Dungeon" };
  assertEquals(validateDeckMetadata(data), null);
});

Deno.test("validateDeckMetadata — rejects non-object", () => {
  assertEquals(validateDeckMetadata(null), null);
  assertEquals(validateDeckMetadata("string"), null);
  assertEquals(validateDeckMetadata(42), null);
});

// Deck-on-disk validation — ensures all decks in manifest.json are complete and valid
Deno.test("disk — manifest.json is valid and has at least one deck", async () => {
  const raw = await Deno.readTextFile(
    new URL("../../static/decks/manifest.json", import.meta.url),
  );
  const manifest = JSON.parse(raw) as unknown;
  assertEquals(typeof manifest, "object");
  const m = manifest as Record<string, unknown>;
  assertEquals(typeof m["defaultDeck"], "string");
  assertEquals(Array.isArray(m["decks"]), true);
  const decks = m["decks"] as string[];
  assertNotEquals(decks.length, 0);
  assertEquals(decks.includes(m["defaultDeck"] as string), true);
});

Deno.test("disk — each deck has valid deck.json with all 45 images on disk", async () => {
  const decksDir = new URL("../../static/decks/", import.meta.url);

  for await (const entry of Deno.readDir(decksDir)) {
    if (!entry.isDirectory) continue;
    const deckId = entry.name;
    const deckJsonPath = new URL(
      `../../static/decks/${deckId}/deck.json`,
      import.meta.url,
    );
    try {
      await Deno.stat(deckJsonPath);
    } catch {
      continue;
    }

    const deckRaw = await Deno.readTextFile(deckJsonPath);
    const deckData = JSON.parse(deckRaw) as unknown;
    const meta = validateDeckMetadata(deckData);
    assertNotEquals(meta, null, `deck "${deckId}" failed schema validation`);

    const requiredIds = getAllCardIdentifiers();
    for (const id of requiredIds) {
      assertEquals(
        id in meta!.cards,
        true,
        `deck "${deckId}" missing card identifier: ${id}`,
      );
      const filename = meta!.cards[id];
      const imagePath = new URL(
        `../../static/decks/${deckId}/${filename}`,
        import.meta.url,
      );
      await Deno.stat(imagePath);
    }
  }
});
