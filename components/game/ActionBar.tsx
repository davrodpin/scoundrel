import type { GamePhase } from "@scoundrel/engine";

type ActionBarProps = {
  phase: GamePhase;
  cardsChosen?: number;
  lastRoomAvoided: boolean;
  cardSelected: boolean;
  roomSize: number;
};

export function getActionBarHint(
  phase: GamePhase,
  lastRoomAvoided: boolean,
  cardSelected: boolean,
  roomSize: number,
): string {
  if (
    cardSelected &&
    (phase.kind === "room_ready" || phase.kind === "choosing")
  ) {
    return "Card selected. Take an action or select another card";
  }
  switch (phase.kind) {
    case "drawing":
      return roomSize > 0
        ? "Draw another card from the Dungeon"
        : "Draw a card from the Dungeon";
    case "room_ready":
      return lastRoomAvoided
        ? "Select a card to play"
        : "Select a card to play — or Avoid Room";
    case "choosing":
      return `Select a card to play (${phase.cardsChosen} of 3 chosen)`;
    case "game_over":
      return "Game Over";
  }
}

export function ActionBar(
  { phase, lastRoomAvoided, cardSelected, roomSize }: ActionBarProps,
) {
  const hint = getActionBarHint(phase, lastRoomAvoided, cardSelected, roomSize);
  const isGameOver = phase.kind === "game_over";

  return (
    <div class="flex justify-center gap-3 mt-4 mb-4">
      <div
        class={`font-body text-sm self-center ${
          isGameOver ? "text-parchment-dark" : "text-parchment"
        }`}
      >
        {hint}
      </div>
    </div>
  );
}
