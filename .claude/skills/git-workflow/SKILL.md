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

1. Navigate to `.bare` and fetch the latest refs:
   ```sh
   cd ../.bare
   git fetch origin main
   ```
2. Create a worktree based with a descriptive branch name:
   ```sh
   git worktree add -b <branch-name ../<branch-name>
   ```
   Branch naming convention: `<type>/<short-description>` (e.g.,
   `feat/deck-shuffle`, `fix/health-overflow`, `refactor/combat-logic`). The
   worktree is created as a sibling directory to `main/` and `.bare/`.
3. Navigate to the new worktree:
   ```sh
   cd ../<branch-name>
   ```
4. Set up the worktree environment:
   ```sh
   cp ../main/.env .
   cp ../main/.claude/settings.local.json ./.claude/
   deno install --allow-scripts
   deno task prisma:migrate
   deno task prisma:generate
   ```

   The `--allow-scripts` flag is needed because Prisma and esbuild have npm
   lifecycle scripts (postinstall) that must run to download engines/binaries.
   Without it, `deno install` skips these scripts and the project won't work.

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

Once the PR is merged, navigate to `.bare` and clean up:

```sh
cd ../.bare
git worktree remove ../<branch-name>
git branch -d <branch-name>
```
