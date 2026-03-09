import { define } from "@/utils.ts";

export const handler = define.handlers({
  async GET(ctx) {
    const eventLog = await ctx.state.gameService.getEventLog(ctx.params.id);
    return Response.json(eventLog);
  },
});
