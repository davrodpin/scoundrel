import { assertEquals } from "@std/assert";
import {
  isPending,
  isPendingAvoidRoom,
  isPendingDraw,
  isPendingOnCard,
  type PendingAction,
  pendingActionLabel,
  pendingCardAnimation,
} from "./pending_action.ts";

// isPending
Deno.test("isPending - idle returns false", () => {
  const action: PendingAction = { kind: "idle" };
  assertEquals(isPending(action), false);
});

Deno.test("isPending - draw_card returns true", () => {
  const action: PendingAction = { kind: "draw_card" };
  assertEquals(isPending(action), true);
});

Deno.test("isPending - avoid_room returns true", () => {
  const action: PendingAction = { kind: "avoid_room" };
  assertEquals(isPending(action), true);
});

Deno.test("isPending - choose_card returns true", () => {
  const action: PendingAction = {
    kind: "choose_card",
    cardIndex: 2,
    actionType: "fight_weapon",
  };
  assertEquals(isPending(action), true);
});

// isPendingOnCard
Deno.test("isPendingOnCard - matches correct card index", () => {
  const action: PendingAction = {
    kind: "choose_card",
    cardIndex: 2,
    actionType: "fight_weapon",
  };
  assertEquals(isPendingOnCard(action, 2), true);
});

Deno.test("isPendingOnCard - returns false for different index", () => {
  const action: PendingAction = {
    kind: "choose_card",
    cardIndex: 2,
    actionType: "fight_weapon",
  };
  assertEquals(isPendingOnCard(action, 0), false);
  assertEquals(isPendingOnCard(action, 3), false);
});

Deno.test("isPendingOnCard - returns false for idle", () => {
  const action: PendingAction = { kind: "idle" };
  assertEquals(isPendingOnCard(action, 0), false);
});

Deno.test("isPendingOnCard - returns false for draw_card", () => {
  const action: PendingAction = { kind: "draw_card" };
  assertEquals(isPendingOnCard(action, 0), false);
});

// isPendingDraw
Deno.test("isPendingDraw - returns true for draw_card", () => {
  const action: PendingAction = { kind: "draw_card" };
  assertEquals(isPendingDraw(action), true);
});

Deno.test("isPendingDraw - returns false for idle", () => {
  assertEquals(isPendingDraw({ kind: "idle" }), false);
});

Deno.test("isPendingDraw - returns false for avoid_room", () => {
  assertEquals(isPendingDraw({ kind: "avoid_room" }), false);
});

Deno.test("isPendingDraw - returns false for choose_card", () => {
  const action: PendingAction = {
    kind: "choose_card",
    cardIndex: 0,
    actionType: "fight_weapon",
  };
  assertEquals(isPendingDraw(action), false);
});

// isPendingAvoidRoom
Deno.test("isPendingAvoidRoom - returns true for avoid_room", () => {
  assertEquals(isPendingAvoidRoom({ kind: "avoid_room" }), true);
});

Deno.test("isPendingAvoidRoom - returns false for idle", () => {
  assertEquals(isPendingAvoidRoom({ kind: "idle" }), false);
});

Deno.test("isPendingAvoidRoom - returns false for draw_card", () => {
  assertEquals(isPendingAvoidRoom({ kind: "draw_card" }), false);
});

Deno.test("isPendingAvoidRoom - returns false for choose_card", () => {
  const action: PendingAction = {
    kind: "choose_card",
    cardIndex: 1,
    actionType: "drink_potion",
  };
  assertEquals(isPendingAvoidRoom(action), false);
});

// pendingCardAnimation
Deno.test("pendingCardAnimation - fight_weapon returns animate-weapon-strike", () => {
  const action: PendingAction = {
    kind: "choose_card",
    cardIndex: 0,
    actionType: "fight_weapon",
  };
  assertEquals(pendingCardAnimation(action), "animate-weapon-strike");
});

Deno.test("pendingCardAnimation - fight_barehanded returns animate-barehanded-strike", () => {
  const action: PendingAction = {
    kind: "choose_card",
    cardIndex: 0,
    actionType: "fight_barehanded",
  };
  assertEquals(pendingCardAnimation(action), "animate-barehanded-strike");
});

Deno.test("pendingCardAnimation - equip_weapon returns animate-equip-glow", () => {
  const action: PendingAction = {
    kind: "choose_card",
    cardIndex: 0,
    actionType: "equip_weapon",
  };
  assertEquals(pendingCardAnimation(action), "animate-equip-glow");
});

Deno.test("pendingCardAnimation - drink_potion returns animate-potion-drink", () => {
  const action: PendingAction = {
    kind: "choose_card",
    cardIndex: 0,
    actionType: "drink_potion",
  };
  assertEquals(pendingCardAnimation(action), "animate-potion-drink");
});

Deno.test("pendingCardAnimation - idle returns null", () => {
  assertEquals(pendingCardAnimation({ kind: "idle" }), null);
});

Deno.test("pendingCardAnimation - draw_card returns null", () => {
  assertEquals(pendingCardAnimation({ kind: "draw_card" }), null);
});

Deno.test("pendingCardAnimation - avoid_room returns null", () => {
  assertEquals(pendingCardAnimation({ kind: "avoid_room" }), null);
});

// pendingActionLabel
Deno.test("pendingActionLabel - idle returns null", () => {
  assertEquals(pendingActionLabel({ kind: "idle" }), null);
});

Deno.test("pendingActionLabel - draw_card returns drawing fate text", () => {
  assertEquals(pendingActionLabel({ kind: "draw_card" }), "Drawing fate...");
});

Deno.test("pendingActionLabel - avoid_room returns retreating text", () => {
  assertEquals(
    pendingActionLabel({ kind: "avoid_room" }),
    "Retreating from the room...",
  );
});

Deno.test("pendingActionLabel - fight_weapon returns striking text", () => {
  const action: PendingAction = {
    kind: "choose_card",
    cardIndex: 0,
    actionType: "fight_weapon",
  };
  assertEquals(pendingActionLabel(action), "Striking with steel...");
});

Deno.test("pendingActionLabel - fight_barehanded returns fighting text", () => {
  const action: PendingAction = {
    kind: "choose_card",
    cardIndex: 1,
    actionType: "fight_barehanded",
  };
  assertEquals(pendingActionLabel(action), "Fighting barehanded...");
});

Deno.test("pendingActionLabel - equip_weapon returns forging text", () => {
  const action: PendingAction = {
    kind: "choose_card",
    cardIndex: 2,
    actionType: "equip_weapon",
  };
  assertEquals(pendingActionLabel(action), "Forging new arms...");
});

Deno.test("pendingActionLabel - drink_potion returns drinking text", () => {
  const action: PendingAction = {
    kind: "choose_card",
    cardIndex: 3,
    actionType: "drink_potion",
  };
  assertEquals(pendingActionLabel(action), "Drinking the potion...");
});
