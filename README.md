# Scoundrel

A web-based implementation of Scoundrel, a single-player rogue-like card game by
Zach Gage and Kurt Bieg. You explore a dungeon built from a shuffled deck of
playing cards — defeating monsters, collecting weapons, and managing your health
until the dungeon runs out or you do.

**[Play now](https://scoundrel.ever-forward.deno.net)**

<a href="https://www.buymeacoffee.com/davpin" target="_blank"><img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="Buy me a coffee" height="45" width="163"></a>

Full rules: [docs/SCOUNDREL.md](docs/SCOUNDREL.md)

## Tech Stack

| Layer          | Technology                                              |
| -------------- | ------------------------------------------------------- |
| Runtime        | [Deno](https://deno.com/)                               |
| Web framework  | [Fresh](https://fresh.deno.dev/) (server-side rendered) |
| UI components  | [Preact](https://preactjs.com/)                         |
| Styling        | [Tailwind CSS](https://tailwindcss.com/)                |
| Database ORM   | [Prisma](https://www.prisma.io/) + PostgreSQL           |
| Schema         | [Zod](https://zod.dev/)                                 |
| Logging        | [LogTape](https://logtape.org/)                         |
| Observability  | [OpenTelemetry](https://opentelemetry.io/)              |
| Infrastructure | [Deno Deploy](https://docs.deno.com/deploy/)            |

## Getting Started

### Prerequisites

- [Deno](https://docs.deno.com/runtime/getting_started/installation/) v2.7.5

### Setup

### Repository Layout

The repository uses a bare repo + worktree layout. The bare repository (the git
object store) lives in `.bare/`, and every working directory — including `main`
— is a git worktree pointing back to it:

```
scoundrel/
├── .bare/              # bare git repository (source of truth)
├── main/               # worktree tracking the main branch
├── feat/some-feature/  # isolated worktree for a feature branch
└── fix/some-bug/       # isolated worktree for a bugfix branch
```

This layout allows multiple agents (or developers) to work on separate branches
simultaneously without interfering with each other. Each worktree has its own
working tree and index; they all share the same git history in `.bare`.

New worktrees are created and torn down using Deno tasks that wrap the
`git worktree` commands with project-specific setup:

```sh
deno task worktree:setup feat/my-feature
deno task worktree:cleanup feat/my-feature
```

## How to setup the local repository

Clone the repository and install dependencies:

```sh
git clone --bare https://github.com/davrodpin/scoundrel.git scoundrel/.bare
cd scoundrel
git -C .bare worktree add ../main main
cd main
deno install --allow-scripts
deno task prisma:generate
```

To run integration tests, configure a local database:

```sh
cp .env.template .env
# Edit .env and set DATABASE_URL to your local PostgreSQL connection string
deno task prisma:migrate
```

### Run

```sh
# The "--tunnel" flag injects all environment variables to the local environment, including DATABASE_URL
deno task --tunnel dev
```

### Common tasks

Run `deno task` to see the full list of supported tasks.

## Project Structure

```
main/
├── lib/            # Domain modules (each exported via mod.ts)
│   ├── config/     # App configuration
│   ├── engine/     # Game rule engine (pure logic, no I/O)
│   ├── errors/     # AppError and typed error reasons
│   ├── game/       # Game service and repository
│   ├── scoundrel/  # Card game domain types and deck logic
│   ├── telemetry/  # OpenTelemetry setup
│   ├── validation/ # Shared Zod schemas
│   └── ...
├── routes/         # Fresh server-side routes and API handlers
│   └── api/        # REST API endpoints
├── islands/        # Client-side interactive Preact components
├── components/     # Server-rendered Preact components
├── docs/           # Project documentation
│   └── SCOUNDREL.md  # Official game rules
├── prisma/         # Prisma schema and migrations
├── tests/          # Integration tests
└── .claude/        # Agentic AI configuration (see below)
```

### Module aliases

Every `lib/` module is registered in `deno.json` under an `@scoundrel/*` alias:

| Alias                     | Path                    |
| ------------------------- | ----------------------- |
| `@scoundrel/config`       | `lib/config/mod.ts`     |
| `@scoundrel/engine`       | `lib/engine/mod.ts`     |
| `@scoundrel/errors`       | `lib/errors/mod.ts`     |
| `@scoundrel/game`         | `lib/scoundrel/mod.ts`  |
| `@scoundrel/game-service` | `lib/game/mod.ts`       |
| `@scoundrel/telemetry`    | `lib/telemetry/mod.ts`  |
| `@scoundrel/validation`   | `lib/validation/mod.ts` |

## Contributing

This project uses
[Claude Code](https://docs.anthropic.com/en/docs/claude-code/overview) skills to
define its development workflows. Before making any changes, read the relevant
skill files in `.claude/skills/`:

| Skill           | File                                                                                 | When to Read                      |
| --------------- | ------------------------------------------------------------------------------------ | --------------------------------- |
| Git Workflow    | [`.claude/skills/git-workflow/SKILL.md`](.claude/skills/git-workflow/SKILL.md)       | Every change (branch, commit, PR) |
| TDD Development | [`.claude/skills/tdd-development/SKILL.md`](.claude/skills/tdd-development/SKILL.md) | Every code change (tests first)   |
| Game Frontend   | [`.claude/skills/game-frontend/SKILL.md`](.claude/skills/game-frontend/SKILL.md)     | UI/component work                 |
| Game Rules      | [`.claude/skills/game-rules/SKILL.md`](.claude/skills/game-rules/SKILL.md)           | Game engine logic                 |

## Built with Agentic AI

This project is developed using
[Claude Code](https://docs.anthropic.com/en/docs/claude-code/overview),
Anthropic's CLI for agentic software development. The `.claude/` directory
contains the configuration, skills, and hooks that define how the agent operates
on this codebase.

### Claude Code

`CLAUDE.md` files throughout the project provide Claude with context at each
directory level. The root `CLAUDE.md` defines coding standards, the tech stack,
error handling conventions, and which skills to load for each type of task.
Subdirectory `CLAUDE.md` files (e.g., `routes/CLAUDE.md`,
`routes/api/CLAUDE.md`) provide more specific guidance for their scope.

### Skills

Skills are markdown files that encode task-specific workflows for the agent.
Claude is required to read the relevant skill file before starting any work.
Skills live in `.claude/skills/`.

| Skill             | Directory                         | Purpose                                                         |
| ----------------- | --------------------------------- | --------------------------------------------------------------- |
| `tdd-development` | `.claude/skills/tdd-development/` | Mandatory Red-Green-Refactor TDD workflow for every code change |
| `git-workflow`    | `.claude/skills/git-workflow/`    | Worktree creation, conventional commits, PRs, and cleanup       |
| `game-frontend`   | `.claude/skills/game-frontend/`   | Dungeon crawler UI aesthetic, Tailwind palette, component rules |
| `game-rules`      | `.claude/skills/game-rules/`      | Translating card game rules into domain code                    |

### Claude Settings (`.claude/settings.json`)

The settings file pre-authorizes common operations so the agent can work without
prompting for every file read or `git` command:

- File tools (`Read`, `Edit`, `Write`, `Glob`, `Grep`) are permitted on `./**`
  and `../**`
- Shell commands are restricted to a named allowlist: `git`, `deno`, `gh`, `cp`,
  `ls`, `mkdir`, `printf`, `grep`, `cat`, `find`, `cd`
- `additionalDirectories: ["../"]` extends the agent's working directory scope
  to the parent of `main/`, which covers sibling worktrees

> **Warning:** The `additionalDirectories` setting references `../` so the agent
> can read and write files across sibling worktrees. This only works correctly
> when the repository is set up using the bare repo + worktree layout described
> above. If you clone the repository normally (e.g., `git clone` into a single
> directory), `../` will point outside the project boundary and the agent may
> read or modify unrelated files. Always use the documented layout.

### Hook: Compound Command Prevention

`.claude/hooks/check-no-compound-commands.sh` runs as a `PreToolUse` hook on
every Bash call. It rejects any command that contains `&&`, `||`, or `;`.

This enforces a one-command-per-tool-call rule. The practical effect is that
each shell operation appears as a discrete, auditable step in the agent's
transcript rather than being bundled into an opaque compound expression. It also
reduces the surface area for permission bypasses where a dangerous command is
hidden after a benign one joined with `&&`.

## Disclaimer

This is an unofficial fan-made implementation. Scoundrel was designed
[by Zach Gage and Kurt Bieg](http://stfj.net/art/2011/Scoundrel.pdf). This app
is not affiliated with, endorsed by, or associated with the original authors in
any way.

## License

This project is licensed under the [MIT License](LICENSE).
