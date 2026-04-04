export const LOADING_QUOTES: readonly string[] = [
  "Arranging the monsters by how much they'll enjoy defeating you.",
  "Polishing every trap to a mirror shine. You deserve my best work.",
  "Hiding the good weapons where you'll never look. As is tradition.",
  "Another mortal dares enter? How delightfully presumptuous.",
  "Placing health potions just far enough apart to give you false hope.",
  "I carved these halls before your kingdom had a name. Show some respect.",
  "Shuffling the deck in ways that would make chaos itself weep.",
  "Testing the structural integrity of every dead end. Personally.",
  "Whispering words of encouragement to the monsters. They need it more than you.",
  "Ensuring each room is more regrettable than the last.",
  "A thousand adventurers have walked these halls. None have redecorated.",
  "Calibrating monster aggression levels. Leaning toward 'enthusiastic.'",
  "Strategically placing torches so you can see just enough to worry.",
  "My dungeons have won awards. You wouldn't know the ceremonies.",
  "Reviewing your odds of survival. Don't worry, I barely laughed.",
  "Every card placed with divine purpose. Mostly to inconvenience you.",
];

/**
 * Returns a random quote from LOADING_QUOTES. If `exclude` is provided,
 * the same quote will never be returned twice in a row.
 */
export function pickRandomQuote(exclude?: string): string {
  const pool = exclude && LOADING_QUOTES.length > 1
    ? LOADING_QUOTES.filter((q) => q !== exclude)
    : LOADING_QUOTES;
  return pool[Math.floor(Math.random() * pool.length)];
}
