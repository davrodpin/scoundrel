import { z } from "zod";

export const DrawCardActionSchema = z.object({
  type: z.literal("draw_card"),
}).strict();

export const AvoidRoomActionSchema = z.object({
  type: z.literal("avoid_room"),
}).strict();

export const EnterRoomActionSchema = z.object({
  type: z.literal("enter_room"),
}).strict();

export const ChooseCardActionSchema = z.object({
  type: z.literal("choose_card"),
  cardIndex: z.number().int().nonnegative(),
  fightWith: z.enum(["weapon", "barehanded"]),
}).strict();

export const GameActionSchema = z.discriminatedUnion("type", [
  DrawCardActionSchema,
  AvoidRoomActionSchema,
  EnterRoomActionSchema,
  ChooseCardActionSchema,
]);

export type DrawCardAction = z.infer<typeof DrawCardActionSchema>;
export type AvoidRoomAction = z.infer<typeof AvoidRoomActionSchema>;
export type EnterRoomAction = z.infer<typeof EnterRoomActionSchema>;
export type ChooseCardAction = z.infer<typeof ChooseCardActionSchema>;
export type GameAction = z.infer<typeof GameActionSchema>;
