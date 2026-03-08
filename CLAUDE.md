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
