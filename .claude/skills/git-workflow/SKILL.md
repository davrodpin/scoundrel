---
name: git-workflow
description: How to use git worktrees, commit code, push changes, and create pull requests
---

# Git Workflow

Every time you need to implement a change, whether a feature or a bug fix, you
must create a [git worktree](https://git-scm.com/docs/git-worktree) to allow
other developers or agents to work on the same codebase in parallel without
conflicts.

## Tools

- Use `git` to perform any operation on the local repository
- Use `gh` to perform any operation on the remote repository

## Repository Layout

This project uses a bare repo layout. The bare repository lives in `.bare/` and
all working directories — including `main` — are git worktrees:

```
scoundrel/
├── .bare/              # bare git repository (source of truth)
├── main/               # worktree for the main branch
├── feat/some-feature/  # worktree for a feature branch
└── fix/some-bug/       # worktree for a bugfix branch
```

`.bare` holds all git objects and refs. Every worktree (including `main/`)
points back to `.bare` via its `.git` file. There is no traditional clone —
`main/` is just another worktree.

## Starting New Work with Worktrees

**You MUST use `deno task worktree:setup` to set up new worktrees.** Never
create worktrees manually.

The script automates:
1. Fetching the latest `origin main`
2. Creating the worktree and branch
3. Copying `.env` and `.claude/settings.local.json` from `main/` (warns if
   missing, does not fail)
4. Running `deno install --allow-scripts`, `deno task prisma:migrate`, and
   `deno task prisma:generate`

**Command** (run from any existing worktree):
```sh
deno task worktree:setup <branch-name>
```

**Example:**
```sh
deno task worktree:setup feat/deck-shuffle
```

Branch naming convention: `<type>/<short-description>` (e.g.,
`feat/deck-shuffle`, `fix/health-overflow`, `refactor/combat-logic`). The
worktree is created as a sibling directory to `main/` and `.bare/`.

## Committing Code

- Before committing, run `deno test`, `deno lint`, `deno check`, and `deno fmt`.
  Fix any failures before committing.
- Always use
  [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) (e.g.,
  `feat:`, `fix:`, `refactor:`) when creating commit messages.
- Commit early, commit often. Each commit should represent a small, logical unit
  of change.

## Creating Pull Requests

- Push your branch using `git`:
  ```sh
  git push origin <branch-name>
  ```
- Create a PR using `gh`:
  ```sh
  gh pr create --base main --title "<type>: <description>" --body "<summary of changes>"
  ```
- In the PR description, provide a clear summary of the changes you made, why
  they were necessary, and any relevant context or links to related issues.
- Never force push. Create as many commits as you need — they all get squashed
  when the PR is merged, so there is no need to rewrite history. This also
  allows reviewers to see incremental changes made in response to feedback.
- Keep your changes minimal. Don't do drive-by changes in a PR. If you need to
  make an unrelated change, create a separate PR for it.

## Cleaning Up After Merge

**You MUST use `deno task worktree:cleanup` to clean up after a merge.** Never
remove worktrees manually.

The script:
1. Verifies the PR is merged or closed (aborts if still open)
2. Removes the worktree directory
3. Deletes the local branch
4. Fetches `origin` with `--prune`
5. Pulls `main` to the latest

**Command** (run from any existing worktree):
```sh
deno task worktree:cleanup <branch-name>
```

**Example:**
```sh
deno task worktree:cleanup feat/deck-shuffle
```
