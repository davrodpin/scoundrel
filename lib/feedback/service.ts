import { getLogger } from "@logtape/logtape";
import { AppError } from "@scoundrel/errors";
import type {
  FeedbackRequest,
  FeedbackResult,
  FeedbackService,
  FeedbackServiceConfig,
} from "./types.ts";

export function createFeedbackService(
  config: FeedbackServiceConfig,
): FeedbackService {
  const logger = getLogger(["scoundrel", "feedback"]);

  async function submitFeedback(
    request: FeedbackRequest,
  ): Promise<FeedbackResult> {
    const { message, email, gameId } = request;
    const shortId = gameId
      ? gameId.slice(0, 7)
      : Array.from(crypto.getRandomValues(new Uint8Array(4)))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("")
        .slice(0, 7);
    const name = `Player Feedback ${shortId}`;

    const descParts = [
      "## Feedback",
      "",
      message,
    ];

    if (email) {
      descParts.push("", "## Contact", "", email);
    }

    if (gameId) {
      descParts.push("", "## Game ID", "", gameId);
    }

    descParts.push("", "---", `*Submitted: ${new Date().toUTCString()}*`);

    const desc = descParts.join("\n");

    const url = new URL("https://api.trello.com/1/cards");
    url.searchParams.set("key", config.trelloApiKey);
    url.searchParams.set("token", config.trelloApiToken);

    let response: Response;
    try {
      response = await fetch(url.toString(), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          idList: config.trelloListId,
          name,
          desc,
        }),
      });
    } catch (err) {
      logger.error("Failed to reach Trello API", { error: String(err) });
      throw new AppError("FeedbackSubmissionError", 502);
    }

    if (!response.ok) {
      logger.error("Trello API returned error", { status: response.status });
      throw new AppError("FeedbackSubmissionError", 502);
    }

    const data = await response.json() as {
      id: string;
      shortUrl: string;
    };

    logger.info("Feedback submitted as Trello card", { cardId: data.id });

    return {
      cardId: data.id,
      cardUrl: data.shortUrl,
    };
  }

  return { submitFeedback };
}
