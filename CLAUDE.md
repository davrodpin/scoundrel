# Project Overview

Scoundrel is a web application where people can play the Scoundrel card game
where the player explores a dungeon, collecting weapons and health potions, and
fighting monsters.

For more information about the games, including all rules, you can refer to
@docs/SCOUNDREL.md

# Development Methodology

IMPORTANT: Before writing or modifying any production code or test code, you
MUST invoke the `tdd-development` skill. This applies to all tasks: new
features, bug fixes, refactors, and any code changes. TDD is non-negotiable.

IMPORTANT: Every implementation task MUST be done inside a git worktree. Invoke
the `git-workflow` skill before starting any work to create the worktree and
branch. Never implement directly on `main`.

When building or modifying UI components, you MUST also invoke the
`game-frontend` skill to maintain the dungeon crawler aesthetic.

# Tech Stack

- **Frontend** implemented in TypeScript (Deno), using
  [Deno Fresh](https://fresh.deno.dev/) and
  [Tailwind CSS](https://tailwindcss.com/)
- **Backend** implemented in TypeScript (Deno) using Deno Fresh. Database Prisma
  with Postgres
- **Platform** [Deno Deploy](https://docs.deno.com/deploy/) will be
  infrastructure provider
- **Schema Validation** [Zod](https://zod.dev/basics)
- **Logging** [LogTape](https://logtape.org/manual/start)

## Subdirectory Context (Routing)

Refer to local `CLAUDE.md` files for specialized instructions:

- `routes/`: Server-side Fresh routes and API handlers.
- `routes/api/`: API route conventions.
- `islands/`: Client-side interactive components (Preact).
- `lib/engine`: Game rule engine.

# Coding Standards

- No any types - ever (use unknown if type truly unknown)
- No type assertions without justification
- Prefer type over interface for data structures
- Reserve interface for behavior contracts only
- Define schemas first, derive types from them (Zod/Standard Schema)
- Use schemas at trust boundaries, plain types for internal logic
- Every and each domain that requires code to be written should be written as a
  [Deno Module](https://docs.deno.com/runtime/fundamentals/modules/) inside the
  `lib/` directory
- All modules should have a `mod.ts` files that will contain only the function,
  type and classes the module exports to be used by clients
- Every module must have an entry on `deno.json` dependencies, scope by
  @scoundrel. Example: an authentication modules would have a
  `@scoundrel/authentication: "./lib/authentication/mod.ts` entry
- Each feature must have their own suite of integration tests. Integration tests
  don't use mocks anywhere. They will run against lower environments.
- Any administered task like database migrations, run tests and etc should be
  represented as a Deno task in `deno.json`
- Environment variables are managed via Deno Deploy and injected locally using
  `deno task --tunnel <task>`
- When adding logging messages, use the appropriate level and use
  [structured data](https://logtape.org/manual/struct)
- Use zod for all schema validations
- All timestamps in UTC
- Any dependency should be injected to the application state defined in
  @utils.ts

## Error Handling

Use `AppError` from `@scoundrel/errors` for all typed errors. Never construct
inline `Response.json` error objects in route handlers or service methods.

- **Service layer**: throw `AppError(reason, statusCode, data)` for business
  errors (e.g. not-found, invalid action, offensive name). Never return
  `{ ok, error }` unions.
- **Route handlers**: throw `AppError` for validation failures; let service
  errors propagate. Keep handlers thin — validate input, call service, return
  success response.
- **Middleware**: `errorMiddleware` in `routes/_middleware.ts` catches all
  `AppError` throws and returns the standard JSON shape. Unknown errors become
  `InternalError (500)`. Fresh framework 4xx errors (e.g. 404 page routes) are
  re-thrown.

**Error response shape**:

```json
{ "code": 422, "error": { "reason": "OffensivePlayerNameError", "data": {} } }
```

**Defined reason slugs** (add new ones to `lib/errors/` and the frontend map):

| Reason                     | Status | Source                       |
| -------------------------- | ------ | ---------------------------- |
| `ValidationError`          | 422    | Routes (Zod parse failure)   |
| `InvalidJsonError`         | 422    | Routes (JSON parse failure)  |
| `GameNotFoundError`        | 404    | Service layer                |
| `InvalidActionError`       | 422    | Service layer                |
| `OffensivePlayerNameError` | 422    | Service layer (`createGame`) |
| `InternalError`            | 500    | Middleware catch-all         |

**Frontend**: map reason slugs to UI strings in `islands/GameBoard.tsx` via the
`ERROR_MESSAGES` record. The backend never dictates UI text.

# CLI Rules

  - Never chain shell commands with `&&`, `||`, or `;`
  - Execute each command as a separate Bash tool call
  - Use parallel tool calls for independent commands instead of chaining
