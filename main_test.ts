import { assertEquals } from "@std/assert";
import { ansiColorFormatter, defaultTextFormatter } from "@logtape/logtape";
import { selectFormatter } from "./main.ts";

Deno.test("selectFormatter returns ansiColorFormatter in development", () => {
  const formatter = selectFormatter(undefined);
  assertEquals(formatter, ansiColorFormatter);
});

Deno.test("selectFormatter returns defaultTextFormatter in production", () => {
  const formatter = selectFormatter("some-deployment-id");
  assertEquals(formatter, defaultTextFormatter);
});
