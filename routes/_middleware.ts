import { PrismaClient } from "../lib/generated/prisma/client.ts";
import { createGameEngine } from "@scoundrel/engine";
import {
  createGameService,
  createPrismaGameRepository,
} from "@scoundrel/game-service";
import { define } from "@/utils.ts";

const prisma = new PrismaClient();
const engine = createGameEngine();
const repository = createPrismaGameRepository(prisma);
const gameService = createGameService(engine, repository);

export const handler = define.middleware((ctx) => {
  ctx.state.gameService = gameService;
  return ctx.next();
});
