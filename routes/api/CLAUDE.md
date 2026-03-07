# API Routes Context
REST API handlers served under `/api`.

## Rules

### Request & Response
- Return JSON via `Response.json()` with appropriate HTTP status codes (200, 201, 204, 400, 401, 404, 422, 500)
- Use consistent error response shape: `{ error: { code: string, message: string } }`
- Set `Content-Type: application/json` (automatic with `Response.json()`)
- Return 204 No Content for successful deletes with no response body
- Use plural nouns for resource endpoints (e.g. `/api/games`, not `/api/game`)

### Validation
- Validate all request bodies and query params with Zod schemas at the handler boundary
- Return 422 with Zod error details on validation failure
- Define request/response schemas alongside the route file or in a shared schemas directory

### Handlers
- Use `define.handlers()` from `@/utils.ts` for typing
- Only export HTTP methods the route supports; Fresh returns 405 for the rest
- Keep handlers thin — delegate business logic to `lib/` modules

### Security
- Never trust client input — always validate and sanitize
- CSRF protection is mandatory for state-changing methods (POST, PUT, PATCH, DELETE)
- Never leak stack traces or internal details in error responses (log them instead)

### Logging
- Log errors with LogTape at `error` level using structured data (include route, method, status)
- Log unexpected failures; do not log successful requests (leave that to middleware)
