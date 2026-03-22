import { createDefine } from "fresh";
import type { AppConfig } from "@scoundrel/config";
import type { GameService } from "@scoundrel/game-service";
import type { FeedbackService } from "@scoundrel/feedback";

// This specifies the type of "ctx.state" which is used to share
// data among middlewares, layouts and routes.
export interface State {
  config: AppConfig;
  gameService: GameService;
  feedbackService: FeedbackService | null;
}

export const define = createDefine<State>();
