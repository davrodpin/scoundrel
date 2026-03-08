import { createDefine } from "fresh";
import type { GameService } from "@scoundrel/game-service";

// This specifies the type of "ctx.state" which is used to share
// data among middlewares, layouts and routes.
export interface State {
  gameService: GameService;
}

export const define = createDefine<State>();
