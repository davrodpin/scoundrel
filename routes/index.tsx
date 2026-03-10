import { define } from "@/utils.ts";

export function createIndexRedirect(): Response {
  return new Response(null, {
    status: 302,
    headers: { Location: "/play" },
  });
}

export const handler = define.handlers({
  GET(_ctx) {
    return createIndexRedirect();
  },
});
