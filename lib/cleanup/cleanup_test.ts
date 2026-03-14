import { assertEquals } from "@std/assert";
import { createCleanupService } from "./cleanup.ts";
import { createSpyTracer } from "../telemetry/testing.ts";

Deno.test("runCleanup calls deleteGamesOlderThan with a cutoff date", async () => {
  let capturedCutoff: Date | null = null;
  const stubRepo = {
    deleteGamesOlderThan(cutoffDate: Date): Promise<number> {
      capturedCutoff = cutoffDate;
      return Promise.resolve(5);
    },
  };

  const service = createCleanupService(
    stubRepo,
    { retentionDays: 30 },
    createSpyTracer().tracer,
  );
  await service.runCleanup();

  assertEquals(capturedCutoff !== null, true);
});

Deno.test(
  "runCleanup with retentionDays: 30 sets cutoff approximately 30 days ago",
  async () => {
    let capturedCutoff: Date | null = null;
    const stubRepo = {
      deleteGamesOlderThan(cutoffDate: Date): Promise<number> {
        capturedCutoff = cutoffDate;
        return Promise.resolve(5);
      },
    };

    const before = new Date();
    const service = createCleanupService(
      stubRepo,
      { retentionDays: 30 },
      createSpyTracer().tracer,
    );
    await service.runCleanup();
    const after = new Date();

    const expectedMin = new Date(before);
    expectedMin.setDate(expectedMin.getDate() - 30);

    const expectedMax = new Date(after);
    expectedMax.setDate(expectedMax.getDate() - 30);

    const cutoff = capturedCutoff as unknown as Date;
    const withinTolerance = cutoff.getTime() >= expectedMin.getTime() - 2000 &&
      cutoff.getTime() <= expectedMax.getTime() + 2000;

    assertEquals(withinTolerance, true);
  },
);

Deno.test(
  "runCleanup with retentionDays: 7 sets cutoff approximately 7 days ago",
  async () => {
    let capturedCutoff: Date | null = null;
    const stubRepo = {
      deleteGamesOlderThan(cutoffDate: Date): Promise<number> {
        capturedCutoff = cutoffDate;
        return Promise.resolve(0);
      },
    };

    const before = new Date();
    const service = createCleanupService(
      stubRepo,
      { retentionDays: 7 },
      createSpyTracer().tracer,
    );
    await service.runCleanup();
    const after = new Date();

    const expectedMin = new Date(before);
    expectedMin.setDate(expectedMin.getDate() - 7);

    const expectedMax = new Date(after);
    expectedMax.setDate(expectedMax.getDate() - 7);

    const cutoff = capturedCutoff as unknown as Date;
    const withinTolerance = cutoff.getTime() >= expectedMin.getTime() - 2000 &&
      cutoff.getTime() <= expectedMax.getTime() + 2000;

    assertEquals(withinTolerance, true);
  },
);
