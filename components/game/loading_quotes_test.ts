import { assertEquals, assertNotEquals } from "@std/assert";
import { LOADING_QUOTES, pickRandomQuote } from "./loading_quotes.ts";

Deno.test("LOADING_QUOTES has 16 entries", () => {
  assertEquals(LOADING_QUOTES.length, 16);
});

Deno.test("pickRandomQuote returns a quote from the array", () => {
  const quote = pickRandomQuote();
  assertEquals(LOADING_QUOTES.includes(quote), true);
});

Deno.test("pickRandomQuote with no exclude returns a valid quote", () => {
  for (let i = 0; i < 20; i++) {
    const quote = pickRandomQuote();
    assertEquals(LOADING_QUOTES.includes(quote), true);
  }
});

Deno.test("pickRandomQuote with exclude never returns the excluded quote", () => {
  for (const excluded of LOADING_QUOTES) {
    for (let i = 0; i < 30; i++) {
      const quote = pickRandomQuote(excluded);
      assertNotEquals(quote, excluded);
      assertEquals(LOADING_QUOTES.includes(quote), true);
    }
  }
});
