import {
  englishDataset,
  englishRecommendedTransformers,
  RegExpMatcher,
} from "obscenity";

const matcher = new RegExpMatcher({
  ...englishDataset.build(),
  ...englishRecommendedTransformers,
});

export function isPlayerNameAllowed(name: string): boolean {
  if (matcher.hasMatch(name)) return false;
  // Also check with spaces stripped to catch spaced-character evasion (e.g. "f u c k")
  const spaceless = name.replace(/\s+/g, "");
  if (spaceless !== name && matcher.hasMatch(spaceless)) return false;
  return true;
}
