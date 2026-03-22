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
    const { message, email } = request;
    const truncatedTitle = message.length > 60 ? message.slice(0, 60) : message;
    const title = `[Player Feedback] ${truncatedTitle}`;

    const bodyParts = [
      "## Feedback",
      "",
      message,
    ];

    if (email) {
      bodyParts.push("", "## Contact", "", email);
    }

    bodyParts.push("", "---", `*Submitted: ${new Date().toUTCString()}*`);

    const issueBody = bodyParts.join("\n");

    let response: Response;
    try {
      response = await fetch(
        `https://api.github.com/repos/${config.githubRepo}/issues`,
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${config.githubToken}`,
            "Content-Type": "application/json",
            "Accept": "application/vnd.github.v3+json",
          },
          body: JSON.stringify({
            title,
            body: issueBody,
            labels: [config.githubLabel],
          }),
        },
      );
    } catch (err) {
      logger.error("Failed to reach GitHub API", { error: String(err) });
      throw new AppError("FeedbackSubmissionError", 502);
    }

    if (!response.ok) {
      logger.error("GitHub API returned error", { status: response.status });
      throw new AppError("FeedbackSubmissionError", 502);
    }

    const data = await response.json() as {
      number: number;
      html_url: string;
    };

    logger.info("Feedback submitted as GitHub issue", {
      issueNumber: data.number,
    });

    return {
      issueNumber: data.number,
      issueUrl: data.html_url,
    };
  }

  return { submitFeedback };
}
