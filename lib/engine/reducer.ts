import type { Card, ChoosingPhase, GameState } from "./types.ts";
import type { GameAction } from "./actions.ts";
import { cardValue, getCardType } from "./deck.ts";

/**
 * Pure state reducer for the Scoundrel game engine.
 * Assumes the action has already been validated by rules.ts.
 * Returns a new GameState — never mutates the input.
 */
export function applyAction(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case "draw_card":
      return handleDrawCard(state);
    case "avoid_room":
      return handleAvoidRoom(state);
    case "enter_room":
      return handleEnterRoom(state);
    case "choose_card":
      return handleChooseCard(state, action.cardIndex, action.fightWith);
    case "fill_room":
      throw new Error(
        "fill_room is a composite action handled by the service layer, not the reducer",
      );
  }
}

function handleDrawCard(state: GameState): GameState {
  if (state.dungeon.length === 0 && state.room.length === 0) {
    return {
      ...state,
      phase: { kind: "game_over", reason: "dungeon_cleared" },
    };
  }

  const drawnCard = state.dungeon[0];
  const remainingDungeon = state.dungeon.slice(1);
  const newRoom = [...state.room, drawnCard];

  const roomFull = newRoom.length >= 4;
  const dungeonEmpty = remainingDungeon.length === 0;

  return {
    ...state,
    dungeon: remainingDungeon,
    room: newRoom,
    phase: roomFull || dungeonEmpty
      ? { kind: "room_ready" }
      : { kind: "drawing" },
  };
}

function handleAvoidRoom(state: GameState): GameState {
  return {
    ...state,
    dungeon: [...state.dungeon, ...state.room],
    room: [],
    lastRoomAvoided: true,
    phase: { kind: "drawing" },
  };
}

function handleEnterRoom(state: GameState): GameState {
  return {
    ...state,
    phase: { kind: "choosing", cardsChosen: 0, potionUsedThisTurn: false },
  };
}

function handleChooseCard(
  state: GameState,
  cardIndex: number,
  fightWith: "weapon" | "barehanded",
): GameState {
  const card = state.room[cardIndex];
  const newRoom = [
    ...state.room.slice(0, cardIndex),
    ...state.room.slice(cardIndex + 1),
  ];
  const cardType = getCardType(card);

  let newState: GameState = { ...state, room: newRoom, lastCardPlayed: card };

  switch (cardType) {
    case "weapon":
      newState = applyWeapon(newState, card);
      break;
    case "potion":
      newState = applyPotion(newState, card);
      break;
    case "monster":
      newState = applyMonster(newState, card, fightWith);
      if (newState.health <= 0) {
        return {
          ...newState,
          phase: { kind: "game_over", reason: "dead" },
        };
      }
      break;
  }

  return completeTurn(newState);
}

function applyWeapon(state: GameState, card: Card): GameState {
  const discardedCards: Card[] = [];
  if (state.equippedWeapon !== null) {
    discardedCards.push(state.equippedWeapon.card);
    discardedCards.push(...state.equippedWeapon.slainMonsters);
  }

  return {
    ...state,
    equippedWeapon: { card, slainMonsters: [] },
    discard: [...state.discard, ...discardedCards],
  };
}

function applyPotion(state: GameState, card: Card): GameState {
  const phase = state.phase as ChoosingPhase;
  let newHealth = state.health;

  if (!phase.potionUsedThisTurn) {
    newHealth = Math.min(20, state.health + cardValue(card));
  }

  return {
    ...state,
    health: newHealth,
    discard: [...state.discard, card],
  };
}

function applyMonster(
  state: GameState,
  card: Card,
  fightWith: "weapon" | "barehanded",
): GameState {
  if (fightWith === "barehanded") {
    return {
      ...state,
      health: state.health - cardValue(card),
      discard: [...state.discard, card],
    };
  }

  // Fight with weapon
  const weapon = state.equippedWeapon!;
  const damage = Math.max(0, cardValue(card) - cardValue(weapon.card));

  return {
    ...state,
    health: state.health - damage,
    equippedWeapon: {
      ...weapon,
      slainMonsters: [...weapon.slainMonsters, card],
    },
  };
}

function completeTurn(state: GameState): GameState {
  const phase = state.phase as ChoosingPhase;
  const newCardsChosen = phase.cardsChosen + 1;

  // Determine potionUsedThisTurn: if we just used a potion, set to true
  const lastCard = state.lastCardPlayed;
  const potionUsedThisTurn =
    lastCard !== null && getCardType(lastCard) === "potion"
      ? true
      : phase.potionUsedThisTurn;

  // Room fully exhausted with no dungeon left (end-game short room scenario)
  if (state.room.length === 0 && state.dungeon.length === 0) {
    return {
      ...state,
      lastRoomAvoided: false,
      turnNumber: state.turnNumber + 1,
      phase: { kind: "game_over", reason: "dungeon_cleared" },
    };
  }

  if (newCardsChosen >= 3) {
    // Turn complete - 3 cards chosen, 1 remains in room
    if (state.dungeon.length === 0) {
      return {
        ...state,
        lastRoomAvoided: false,
        turnNumber: state.turnNumber + 1,
        phase: { kind: "game_over", reason: "dungeon_cleared" },
      };
    }
    return {
      ...state,
      lastRoomAvoided: false,
      turnNumber: state.turnNumber + 1,
      phase: { kind: "drawing" },
    };
  }

  return {
    ...state,
    phase: {
      kind: "choosing",
      cardsChosen: newCardsChosen,
      potionUsedThisTurn,
    },
  };
}
