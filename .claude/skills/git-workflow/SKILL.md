---
name: git-workflow
description: How to use git worktrees, commit code, push changes, and create pull requests
disable-model-invocation: true
---

# Git Workflow

Every time you need to implement a change, whether a feature or a bug fix, you
must create a [git worktree](https://git-scm.com/docs/git-worktree) to allow
other developers or agents to work on the same codebase in parallel without
conflicts.

## Tools

- Use `git` to perform any operation on the local repository
- Use `gh` to perform any operation on the remote repository

## Starting New Work with Worktrees

1. Make sure you are on the `main` branch and it is up to date:
   ```sh
   git checkout main && git pull origin main
   ```
2. Create a worktree with a descriptive branch name:
   ```sh
   git worktree add ../<repo-name>-<branch-name> -b <branch-name>
   ```
   Branch naming convention: `<type>/<short-description>` (e.g.,
   `feat/deck-shuffle`, `fix/health-overflow`, `refactor/combat-logic`).
3. Navigate to the worktree directory and work from there:
   ```sh
   cd ../<repo-name>-<branch-name>
   ```

## Committing Code

- Before committing, run `deno test`, `deno lint`, `deno check`, and `deno fmt`.
  Fix any failures before committing.
- Always use
  [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) (e.g.,
  `feat:`, `fix:`, `refactor:`) when creating commit messages.
- Commit early, commit often. Each commit should represent a small, logical unit
  of change.

## Creating Pull Requests

- Push your branch and create a PR using `gh`:
  ```sh
  git push origin <branch-name>
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

Once the PR is merged, clean up the worktree and branch:

```sh
cd /path/to/main/repo
git worktree remove ../<repo-name>-<branch-name>
git branch -d <branch-name>
git pull origin main
```
