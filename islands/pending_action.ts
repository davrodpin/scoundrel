export type PendingAction =
  | { kind: "idle" }
  | { kind: "draw_card" }
  | { kind: "fill_room" }
  | { kind: "avoid_room" }
  | {
    kind: "choose_card";
    cardIndex: number;
    actionType:
      | "fight_weapon"
      | "fight_barehanded"
      | "equip_weapon"
      | "drink_potion";
  };

export function isPending(action: PendingAction): boolean {
  return action.kind !== "idle";
}

export function isPendingOnCard(
  action: PendingAction,
  index: number,
): boolean {
  return action.kind === "choose_card" && action.cardIndex === index;
}

export function isPendingDraw(action: PendingAction): boolean {
  return action.kind === "draw_card" || action.kind === "fill_room";
}

export function isPendingFillRoom(action: PendingAction): boolean {
  return action.kind === "fill_room";
}

export function isPendingAvoidRoom(action: PendingAction): boolean {
  return action.kind === "avoid_room";
}

export function pendingCardAnimation(action: PendingAction): string | null {
  if (action.kind !== "choose_card") return null;
  switch (action.actionType) {
    case "fight_weapon":
      return "animate-weapon-strike";
    case "fight_barehanded":
      return "animate-barehanded-strike";
    case "equip_weapon":
      return "animate-equip-glow";
    case "drink_potion":
      return "animate-potion-drink";
  }
}

export function pendingActionLabel(action: PendingAction): string | null {
  switch (action.kind) {
    case "idle":
      return null;
    case "draw_card":
      return "Drawing fate...";
    case "fill_room":
      return "Entering the room...";
    case "avoid_room":
      return "Retreating from the room...";
    case "choose_card":
      switch (action.actionType) {
        case "fight_weapon":
          return "Striking with steel...";
        case "fight_barehanded":
          return "Fighting barehanded...";
        case "equip_weapon":
          return "Forging new arms...";
        case "drink_potion":
          return "Drinking the potion...";
      }
  }
}
