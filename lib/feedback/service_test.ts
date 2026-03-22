import { assertEquals, assertRejects } from "@std/assert";
import { AppError } from "@scoundrel/errors";
import { createFeedbackService } from "./service.ts";

const TEST_CONFIG = {
  githubToken: "test-token",
  githubRepo: "davrodpin/scoundrel",
  githubLabel: "feedback",
};

function makeSuccessResponse(issueNumber: number) {
  return new Response(
    JSON.stringify({
      number: issueNumber,
      html_url: `https://github.com/davrodpin/scoundrel/issues/${issueNumber}`,
    }),
    { status: 201 },
  );
}

function makeErrorResponse(status: number) {
  return new Response(JSON.stringify({ message: "GitHub API error" }), {
    status,
  });
}

Deno.test("submitFeedback — posts to correct GitHub API URL", async () => {
  let capturedUrl = "";
  globalThis.fetch = (input: RequestInfo | URL, _init?: RequestInit) => {
    capturedUrl = input.toString();
    return Promise.resolve(makeSuccessResponse(42));
  };

  const service = createFeedbackService(TEST_CONFIG);
  await service.submitFeedback({ message: "Great game!" });

  assertEquals(
    capturedUrl,
    "https://api.github.com/repos/davrodpin/scoundrel/issues",
  );
});

Deno.test("submitFeedback — sends correct headers", async () => {
  let capturedHeaders: Record<string, string> = {};
  globalThis.fetch = (_input: RequestInfo | URL, init?: RequestInit) => {
    capturedHeaders = Object.fromEntries(
      new Headers(init?.headers).entries(),
    );
    return Promise.resolve(makeSuccessResponse(42));
  };

  const service = createFeedbackService(TEST_CONFIG);
  await service.submitFeedback({ message: "Great game!" });

  assertEquals(capturedHeaders["authorization"], "Bearer test-token");
  assertEquals(capturedHeaders["content-type"], "application/json");
  assertEquals(capturedHeaders["accept"], "application/vnd.github.v3+json");
});

Deno.test("submitFeedback — sets feedback label on issue", async () => {
  let capturedBody: Record<string, unknown> = {};
  globalThis.fetch = (_input: RequestInfo | URL, init?: RequestInit) => {
    capturedBody = JSON.parse(init?.body as string);
    return Promise.resolve(makeSuccessResponse(42));
  };

  const service = createFeedbackService(TEST_CONFIG);
  await service.submitFeedback({ message: "Great game!" });

  assertEquals(capturedBody["labels"], ["feedback"]);
});

Deno.test("submitFeedback — title uses first 60 chars of message", async () => {
  let capturedBody: Record<string, unknown> = {};
  globalThis.fetch = (_input: RequestInfo | URL, init?: RequestInit) => {
    capturedBody = JSON.parse(init?.body as string);
    return Promise.resolve(makeSuccessResponse(42));
  };

  const service = createFeedbackService(TEST_CONFIG);
  const longMessage = "A".repeat(80);
  await service.submitFeedback({ message: longMessage });

  const title = capturedBody["title"] as string;
  assertEquals(
    title,
    `[Player Feedback] ${"A".repeat(60)}`,
  );
});

Deno.test("submitFeedback — title uses full message when under 60 chars", async () => {
  let capturedBody: Record<string, unknown> = {};
  globalThis.fetch = (_input: RequestInfo | URL, init?: RequestInit) => {
    capturedBody = JSON.parse(init?.body as string);
    return Promise.resolve(makeSuccessResponse(42));
  };

  const service = createFeedbackService(TEST_CONFIG);
  await service.submitFeedback({ message: "Short message" });

  assertEquals(capturedBody["title"], "[Player Feedback] Short message");
});

Deno.test("submitFeedback — includes message in issue body", async () => {
  let capturedBody: Record<string, unknown> = {};
  globalThis.fetch = (_input: RequestInfo | URL, init?: RequestInit) => {
    capturedBody = JSON.parse(init?.body as string);
    return Promise.resolve(makeSuccessResponse(42));
  };

  const service = createFeedbackService(TEST_CONFIG);
  await service.submitFeedback({ message: "This is my feedback" });

  assertEquals(
    (capturedBody["body"] as string).includes("This is my feedback"),
    true,
  );
});

Deno.test("submitFeedback — includes email in body when provided", async () => {
  let capturedBody: Record<string, unknown> = {};
  globalThis.fetch = (_input: RequestInfo | URL, init?: RequestInit) => {
    capturedBody = JSON.parse(init?.body as string);
    return Promise.resolve(makeSuccessResponse(42));
  };

  const service = createFeedbackService(TEST_CONFIG);
  await service.submitFeedback({
    message: "My feedback",
    email: "player@example.com",
  });

  assertEquals(
    (capturedBody["body"] as string).includes("player@example.com"),
    true,
  );
});

Deno.test("submitFeedback — omits email section when not provided", async () => {
  let capturedBody: Record<string, unknown> = {};
  globalThis.fetch = (_input: RequestInfo | URL, init?: RequestInit) => {
    capturedBody = JSON.parse(init?.body as string);
    return Promise.resolve(makeSuccessResponse(42));
  };

  const service = createFeedbackService(TEST_CONFIG);
  await service.submitFeedback({ message: "My feedback" });

  assertEquals(
    (capturedBody["body"] as string).includes("undefined"),
    false,
  );
  assertEquals(
    (capturedBody["body"] as string).includes("Contact"),
    false,
  );
});

Deno.test("submitFeedback — returns issueNumber and issueUrl on success", async () => {
  globalThis.fetch = () => Promise.resolve(makeSuccessResponse(99));

  const service = createFeedbackService(TEST_CONFIG);
  const result = await service.submitFeedback({ message: "My feedback" });

  assertEquals(result.issueNumber, 99);
  assertEquals(
    result.issueUrl,
    "https://github.com/davrodpin/scoundrel/issues/99",
  );
});

Deno.test("submitFeedback — includes gameId in body when provided", async () => {
  let capturedBody: Record<string, unknown> = {};
  globalThis.fetch = (_input: RequestInfo | URL, init?: RequestInit) => {
    capturedBody = JSON.parse(init?.body as string);
    return Promise.resolve(makeSuccessResponse(42));
  };

  const service = createFeedbackService(TEST_CONFIG);
  await service.submitFeedback({
    message: "My feedback",
    gameId: "abc-123",
  });

  assertEquals(
    (capturedBody["body"] as string).includes("abc-123"),
    true,
  );
});

Deno.test("submitFeedback — omits gameId section when not provided", async () => {
  let capturedBody: Record<string, unknown> = {};
  globalThis.fetch = (_input: RequestInfo | URL, init?: RequestInit) => {
    capturedBody = JSON.parse(init?.body as string);
    return Promise.resolve(makeSuccessResponse(42));
  };

  const service = createFeedbackService(TEST_CONFIG);
  await service.submitFeedback({ message: "My feedback" });

  assertEquals(
    (capturedBody["body"] as string).includes("Game ID"),
    false,
  );
});

Deno.test("submitFeedback — throws FeedbackSubmissionError on GitHub API failure", async () => {
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
