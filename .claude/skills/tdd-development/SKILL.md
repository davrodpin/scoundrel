---
name: tdd-development
description: Use when writing, modifying, or reviewing any code — features, bug fixes, refactors, or new modules. Defines the mandatory TDD workflow and test conventions for all code changes.
---

# TDD Development

The key is to write clean, testable, functional code that evolves through small, safe increments. Every change should be driven by a test that describes the desired behavior, and the implementation should be the simplest thing that makes that test pass. When in doubt, favor simplicity and readability over cleverness.

TEST-DRIVEN DEVELOPMENT IS NON-NEGOTIABLE. Every single line of production code must be written in response to a failing test. No exceptions.

All work should be done in small, incremental changes that maintain a working state throughout development.

## The TDD Cycle (Red-Green-Refactor)

Repeat this cycle for each small behavior increment:

1. **Red** — Write a test that describes the desired behavior. Run it. Confirm it fails.
2. **Green** — Write the simplest code that makes the test pass. Nothing more.
3. **Refactor** — Clean up while keeping tests green. Remove duplication, improve naming, simplify structure.

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
- An entry in `deno.json` imports as `@scoundrel/<module-name>: "./lib/<module-name>/mod.ts"`

Refer to `CLAUDE.md` for the full coding standards (no `any` types, Zod schemas first, dependency injection, etc.).

## Development Workflow

1. **Understand the requirement** — clarify what behavior is expected
2. **Identify the module** — determine which `lib/<module-name>/` the code belongs in (create a new one if needed)
3. **Write the first failing test** — start with the simplest case
4. **Red-Green-Refactor** — iterate through the TDD cycle, adding one behavior at a time
5. **Run full checks** — `deno task check` to verify formatting, linting, and type checking all pass
6. **Commit and push** — follow the `git-workflow` skill for committing, pushing, and creating a PR

## Key Patterns

- Define Zod schemas first, derive types with `z.infer<>`
- Use schemas at trust boundaries (API inputs, external data), plain types internally
- Inject dependencies through the application state defined in `utils.ts`
- Use LogTape with structured data for logging
- All timestamps in UTC
