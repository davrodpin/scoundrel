import { define } from "@/utils.ts";
import { AppError } from "@scoundrel/errors";
import { z } from "zod";

const feedbackSchema = z.object({
  message: z.string().min(1).max(2000).trim(),
  email: z.string().email().optional(),
});

export const handler = define.handlers({
  async POST(ctx) {
    if (!ctx.state.feedbackService) {
      throw new AppError("FeedbackDisabledError", 501);
    }
    const body = await ctx.req.json().catch(() => null);
    const parsed = feedbackSchema.safeParse(body);
    if (!parsed.success) {
      throw new AppError("ValidationError", 422);
    }
    const result = await ctx.state.feedbackService.submitFeedback(parsed.data);
    return Response.json(result, { status: 201 });
  },
});
