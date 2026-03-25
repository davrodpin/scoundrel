import { assertEquals, assertRejects } from "@std/assert";
import { AppError } from "@scoundrel/errors";
import { createFeedbackService } from "./service.ts";

const TEST_CONFIG = {
  trelloApiKey: "test-api-key",
  trelloApiToken: "test-api-token",
  trelloListId: "list-abc-123",
};

function makeSuccessResponse(cardId: string) {
  return new Response(
    JSON.stringify({
      id: cardId,
      shortUrl: `https://trello.com/c/${cardId}`,
    }),
    { status: 200 },
  );
}

function makeErrorResponse(status: number) {
  return new Response(JSON.stringify({ message: "Trello API error" }), {
    status,
  });
}

Deno.test("submitFeedback — posts to correct Trello API URL", async () => {
  let capturedUrl = "";
  globalThis.fetch = (input: RequestInfo | URL, _init?: RequestInit) => {
    capturedUrl = input.toString();
    return Promise.resolve(makeSuccessResponse("card-42"));
  };

  const service = createFeedbackService(TEST_CONFIG);
  await service.submitFeedback({ message: "Great game!" });

  const url = new URL(capturedUrl);
  assertEquals(url.origin + url.pathname, "https://api.trello.com/1/cards");
  assertEquals(url.searchParams.get("key"), "test-api-key");
  assertEquals(url.searchParams.get("token"), "test-api-token");
});

Deno.test("submitFeedback — sends POST with JSON content-type", async () => {
  let capturedMethod = "";
  let capturedHeaders: Record<string, string> = {};
  globalThis.fetch = (_input: RequestInfo | URL, init?: RequestInit) => {
    capturedMethod = init?.method ?? "";
    capturedHeaders = Object.fromEntries(
      new Headers(init?.headers).entries(),
    );
    return Promise.resolve(makeSuccessResponse("card-42"));
  };

  const service = createFeedbackService(TEST_CONFIG);
  await service.submitFeedback({ message: "Great game!" });

  assertEquals(capturedMethod, "POST");
  assertEquals(capturedHeaders["content-type"], "application/json");
});

Deno.test("submitFeedback — sends correct list ID in body", async () => {
  let capturedBody: Record<string, unknown> = {};
  globalThis.fetch = (_input: RequestInfo | URL, init?: RequestInit) => {
    capturedBody = JSON.parse(init?.body as string);
    return Promise.resolve(makeSuccessResponse("card-42"));
  };

  const service = createFeedbackService(TEST_CONFIG);
  await service.submitFeedback({ message: "Great game!" });

  assertEquals(capturedBody["idList"], "list-abc-123");
});

Deno.test("submitFeedback — card name uses first 60 chars of message", async () => {
  let capturedBody: Record<string, unknown> = {};
  globalThis.fetch = (_input: RequestInfo | URL, init?: RequestInit) => {
    capturedBody = JSON.parse(init?.body as string);
    return Promise.resolve(makeSuccessResponse("card-42"));
  };

  const service = createFeedbackService(TEST_CONFIG);
  const longMessage = "A".repeat(80);
  await service.submitFeedback({ message: longMessage });

  assertEquals(capturedBody["name"], `[Player Feedback] ${"A".repeat(60)}`);
});

Deno.test("submitFeedback — card name uses full message when under 60 chars", async () => {
  let capturedBody: Record<string, unknown> = {};
  globalThis.fetch = (_input: RequestInfo | URL, init?: RequestInit) => {
    capturedBody = JSON.parse(init?.body as string);
    return Promise.resolve(makeSuccessResponse("card-42"));
  };

  const service = createFeedbackService(TEST_CONFIG);
  await service.submitFeedback({ message: "Short message" });

  assertEquals(capturedBody["name"], "[Player Feedback] Short message");
});

Deno.test("submitFeedback — includes message in card description", async () => {
  let capturedBody: Record<string, unknown> = {};
  globalThis.fetch = (_input: RequestInfo | URL, init?: RequestInit) => {
    capturedBody = JSON.parse(init?.body as string);
    return Promise.resolve(makeSuccessResponse("card-42"));
  };

  const service = createFeedbackService(TEST_CONFIG);
  await service.submitFeedback({ message: "This is my feedback" });

  assertEquals(
    (capturedBody["desc"] as string).includes("This is my feedback"),
    true,
  );
});

Deno.test("submitFeedback — includes email in description when provided", async () => {
  let capturedBody: Record<string, unknown> = {};
  globalThis.fetch = (_input: RequestInfo | URL, init?: RequestInit) => {
    capturedBody = JSON.parse(init?.body as string);
    return Promise.resolve(makeSuccessResponse("card-42"));
  };

  const service = createFeedbackService(TEST_CONFIG);
  await service.submitFeedback({
    message: "My feedback",
    email: "player@example.com",
  });

  assertEquals(
    (capturedBody["desc"] as string).includes("player@example.com"),
    true,
  );
});

Deno.test("submitFeedback — omits email section when not provided", async () => {
  let capturedBody: Record<string, unknown> = {};
  globalThis.fetch = (_input: RequestInfo | URL, init?: RequestInit) => {
    capturedBody = JSON.parse(init?.body as string);
    return Promise.resolve(makeSuccessResponse("card-42"));
  };

  const service = createFeedbackService(TEST_CONFIG);
  await service.submitFeedback({ message: "My feedback" });

  assertEquals(
    (capturedBody["desc"] as string).includes("undefined"),
    false,
  );
  assertEquals(
    (capturedBody["desc"] as string).includes("Contact"),
    false,
  );
});

Deno.test("submitFeedback — includes gameId in description when provided", async () => {
  let capturedBody: Record<string, unknown> = {};
  globalThis.fetch = (_input: RequestInfo | URL, init?: RequestInit) => {
    capturedBody = JSON.parse(init?.body as string);
    return Promise.resolve(makeSuccessResponse("card-42"));
  };

  const service = createFeedbackService(TEST_CONFIG);
  await service.submitFeedback({
    message: "My feedback",
    gameId: "abc-123",
  });

  assertEquals(
    (capturedBody["desc"] as string).includes("abc-123"),
    true,
  );
});

Deno.test("submitFeedback — omits gameId section when not provided", async () => {
  let capturedBody: Record<string, unknown> = {};
  globalThis.fetch = (_input: RequestInfo | URL, init?: RequestInit) => {
    capturedBody = JSON.parse(init?.body as string);
    return Promise.resolve(makeSuccessResponse("card-42"));
  };

  const service = createFeedbackService(TEST_CONFIG);
  await service.submitFeedback({ message: "My feedback" });

  assertEquals(
    (capturedBody["desc"] as string).includes("Game ID"),
    false,
  );
});

Deno.test("submitFeedback — returns cardId and cardUrl on success", async () => {
  globalThis.fetch = () => Promise.resolve(makeSuccessResponse("card-99"));

  const service = createFeedbackService(TEST_CONFIG);
  const result = await service.submitFeedback({ message: "My feedback" });

  assertEquals(result.cardId, "card-99");
  assertEquals(result.cardUrl, "https://trello.com/c/card-99");
});

Deno.test("submitFeedback — throws FeedbackSubmissionError on Trello API failure", async () => {
  globalThis.fetch = () => Promise.resolve(makeErrorResponse(422));

  const service = createFeedbackService(TEST_CONFIG);
  const error = await assertRejects(
    () => service.submitFeedback({ message: "My feedback" }),
    AppError,
  );

  assertEquals((error as AppError).reason, "FeedbackSubmissionError");
  assertEquals((error as AppError).statusCode, 502);
});

Deno.test("submitFeedback — throws FeedbackSubmissionError on network failure", async () => {
  globalThis.fetch = () => Promise.reject(new Error("Network error"));

  const service = createFeedbackService(TEST_CONFIG);
  const error = await assertRejects(
    () => service.submitFeedback({ message: "My feedback" }),
    AppError,
  );

  assertEquals((error as AppError).reason, "FeedbackSubmissionError");
  assertEquals((error as AppError).statusCode, 502);
});
