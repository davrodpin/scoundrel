import { assertEquals } from "@std/assert";
import { createCleanupService } from "./cleanup.ts";
import { createSpyTracer } from "../telemetry/testing.ts";

Deno.test("runCleanup creates a span named cleanup.runCleanup", async () => {
  const { tracer, getSpans } = createSpyTracer();
  const stubRepo = {
    deleteGamesOlderThan(_cutoffDate: Date): Promise<number> {
      return Promise.resolve(5);
    },
  };

  const service = createCleanupService(stubRepo, { retentionDays: 30 }, tracer);
  await service.runCleanup();

  const spans = getSpans();
  assertEquals(spans[0].name, "cleanup.runCleanup");
  assertEquals(spans[0].ended, true);
});

Deno.test("runCleanup span sets cleanup.retention_days attribute", async () => {
  const { tracer, getSpans } = createSpyTracer();
  const stubRepo = {
    deleteGamesOlderThan(_cutoffDate: Date): Promise<number> {
      return Promise.resolve(3);
    },
  };

  const service = createCleanupService(stubRepo, { retentionDays: 7 }, tracer);
  await service.runCleanup();

  const spans = getSpans();
  assertEquals(spans[0].attributes["cleanup.retention_days"], 7);
});

Deno.test("runCleanup span sets cleanup.deleted_count after operation", async () => {
  const { tracer, getSpans } = createSpyTracer();
  const stubRepo = {
    deleteGamesOlderThan(_cutoffDate: Date): Promise<number> {
      return Promise.resolve(42);
    },
  };

  const service = createCleanupService(stubRepo, { retentionDays: 30 }, tracer);
  await service.runCleanup();

  const spans = getSpans();
  assertEquals(spans[0].attributes["cleanup.deleted_count"], 42);
});
