---
name: tdd-development
description: Use when making any change to the repository — code, tests, documentation, or skill files. Defines the mandatory TDD and commit workflow.
---

# TDD Development

The key is to write clean, testable, functional code that evolves through small,
safe increments. Every change should be driven by a test that describes the
desired behavior, and the implementation should be the simplest thing that makes
that test pass. When in doubt, favor simplicity and readability over cleverness.

TEST-DRIVEN DEVELOPMENT IS NON-NEGOTIABLE. Every single line of production code
must be written in response to a failing test. No exceptions.

All work should be done in small, incremental changes that maintain a working
state throughout development.

## The TDD Cycle (Red-Green-Refactor)

Repeat this cycle for each small behavior increment:

1. **Red** — Write a test that describes the desired behavior. Run it. Confirm
   it fails.
2. **Green** — Write the simplest code that makes the test pass. Nothing more.
3. **Refactor** — Clean up while keeping tests green. Remove duplication,
   improve naming, simplify structure.

Never skip a step. Never write production code without a failing test first.

## Test File Conventions

- **Unit tests** live alongside the code they test: `<filename>_test.ts`
- **Integration tests** live in a `tests/` directory within the module
- Use Deno's built-in test runner: `Deno.test`
- Integration tests use no mocks — they run against real dependencies
- Run tests with: `deno test`

## Module Structure

New domain modules go under `lib/<module-name>/`. Every module must have:

- A `mod.ts` file that exports only the public API (functions, types, classes)
- An entry in `deno.json` imports as
  `@scoundrel/<module-name>: "./lib/<module-name>/mod.ts"`

Refer to `CLAUDE.md` for the full coding standards (no `any` types, Zod schemas
first, dependency injection, etc.).

## Development Workflow

### Code Changes (steps 1–6)

1. **Create and set up a worktree** — Follow the `git-workflow` skill to create
   a git worktree and branch, then set up the worktree environment (copy `.env`,
   install dependencies with `--allow-scripts`, run Prisma migrations, generate
   Prisma client). Never implement directly on `main`.
2. **Understand the requirement** — clarify what behavior is expected
3. **Identify the module** — determine which `lib/<module-name>/` the code
   belongs in (create a new one if needed)
4. **Write the first failing test** — start with the simplest case
5. **Red-Green-Refactor** — iterate through the TDD cycle, adding one behavior
   at a time
6. **Run full checks** — `deno task check` to verify formatting, linting, and
   type checking all pass

### Every Change (mandatory, no exceptions)

> **MANDATORY FOR ALL CHANGES** — Steps 1–6 apply only to code. Step 7 applies
> to every change without exception, including documentation and skill updates.

7. **Commit and push** — follow the `git-workflow` skill for committing,
   pushing, and creating a PR. This step applies to ALL changes: code,
   documentation, skill files, configuration. Never leave changes uncommitted.

## Database Schema Changes

Whenever `prisma/schema.prisma` is modified, a new migration file must be
generated before applying it:

1. **Create the migration** —
   `deno run -A npm:prisma migrate dev --name <descriptive-name>` (this
   generates a new SQL file under `prisma/migrations/`)
2. **Apply migrations** — `deno task prisma:migrate` (runs
   `prisma migrate deploy`, applies all pending migrations)

Never run `prisma migrate deploy` alone after a schema change without first
creating the migration file. The deploy command only applies existing migration
files — it does not generate new ones.

## Key Patterns

- Define Zod schemas first, derive types with `z.infer<>`
- Use schemas at trust boundaries (API inputs, external data), plain types
  internally
- Inject dependencies through the application state defined in `utils.ts`
- Use LogTape with structured data for logging
- All timestamps in UTC

## Logging Requirements

Logging is mandatory and must be implemented as part of every development cycle:

- **API request logging** is handled centrally by the middleware in
  `routes/_middleware.ts` — no per-route request logging needed
- **Every service-layer function** that performs a write operation (create,
  update, delete) must log the operation at `info` level with structured data
  including relevant entity IDs (e.g. `{ gameId }`)
- **Every error path** that represents an unexpected failure (thrown exceptions,
  not business-rule rejections) must be logged at `error` level with structured
  context
- **Log category convention**: `["scoundrel", "<module-name>"]` (e.g.
  `["scoundrel", "game"]`)
- Use `getLogger` from `@logtape/logtape` and pass structured data as the second
  argument — never use string interpolation in log messages
- Call `getLogger` inside the factory function (e.g. inside
  `createGameService`), not at module top-level
