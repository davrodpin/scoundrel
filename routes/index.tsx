import { define } from "@/utils.ts";
import { createIndexRedirect } from "./_redirect.ts";

export { createIndexRedirect };

export const handler = define.handlers({
  GET(_ctx) {
    return createIndexRedirect();
  },
});
