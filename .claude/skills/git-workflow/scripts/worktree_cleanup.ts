// Remove a merged/closed worktree, its branch, and sync main/.
// Run with: deno task worktree:cleanup <worktree-name>
// Example:  deno task worktree:cleanup feat/avoid-room-in-adventurer-panel
import { join, resolve } from "jsr:@std/path@^1";

type RunResult = { stdout: string; stderr: string; code: number };

async function runCommand(
  cmd: string[],
  options: { cwd: string },
): Promise<RunResult> {
  const process = new Deno.Command(cmd[0], {
    args: cmd.slice(1),
    cwd: options.cwd,
    stdout: "piped",
    stderr: "piped",
  });
  const { code, stdout, stderr } = await process.output();
  return {
    code,
    stdout: new TextDecoder().decode(stdout).trim(),
    stderr: new TextDecoder().decode(stderr).trim(),
  };
}

const worktreeName = Deno.args[0];
if (!worktreeName) {
  console.error("Usage: deno task worktree:cleanup <worktree-name>");
  console.error("Example: deno task worktree:cleanup feat/my-feature");
  Deno.exit(1);
}

// Resolve paths via git rev-parse --git-common-dir (works from any worktree).
const gitCommonDirResult = await runCommand(
  ["git", "rev-parse", "--git-common-dir"],
  { cwd: Deno.cwd() },
);
if (gitCommonDirResult.code !== 0) {
  console.error("Failed to resolve git common dir:", gitCommonDirResult.stderr);
  Deno.exit(1);
}

const bareDir = resolve(gitCommonDirResult.stdout);
const repoRoot = resolve(bareDir, "..");
const worktreeDir = join(repoRoot, worktreeName);
const mainDir = join(repoRoot, "main");

// Verify the worktree directory exists.
try {
  const stat = await Deno.stat(worktreeDir);
  if (!stat.isDirectory) {
    console.error(`Error: '${worktreeDir}' exists but is not a directory.`);
    Deno.exit(1);
  }
} catch {
  console.error(`Error: Worktree directory not found: ${worktreeDir}`);
  Deno.exit(1);
}

// Check PR state via gh CLI.
const branchName = worktreeName;
const prListResult = await runCommand(
  [
    "gh",
    "pr",
    "list",
    "--head",
    branchName,
    "--json",
    "state",
    "--limit",
    "1",
    "--state",
    "all",
  ],
  { cwd: mainDir },
);

if (prListResult.code !== 0) {
  console.error("Failed to query PR state:", prListResult.stderr);
  Deno.exit(1);
}

type PrEntry = { state: string };
let prs: PrEntry[];
try {
  prs = JSON.parse(prListResult.stdout) as PrEntry[];
} catch {
  console.error("Failed to parse gh output:", prListResult.stdout);
  Deno.exit(1);
}

if (prs.length === 0) {
  console.error(
    `Error: No PR found for branch '${branchName}'. Aborting cleanup.`,
  );
  Deno.exit(1);
}

const prState = prs[0].state.toUpperCase();
if (prState === "OPEN") {
  console.error(
    `Error: PR for '${branchName}' is still open (state: ${prState}). Aborting cleanup.`,
  );
  Deno.exit(1);
}

console.log(`PR state: ${prState} — proceeding with cleanup.`);

// Remove worktree.
console.log(`\nRemoving worktree: ${worktreeDir}`);
const removeResult = await runCommand(
  ["git", "worktree", "remove", worktreeDir, "--force"],
  { cwd: bareDir },
);
if (removeResult.code !== 0) {
  console.error("Failed to remove worktree:", removeResult.stderr);
  Deno.exit(1);
}
console.log("  Worktree removed.");

// Delete branch.
console.log(`\nDeleting branch: ${branchName}`);
const branchResult = await runCommand(
  ["git", "branch", "-D", branchName],
  { cwd: bareDir },
);
if (branchResult.code !== 0) {
  console.warn("  Warning: could not delete branch:", branchResult.stderr);
} else {
  console.log("  Branch deleted.");
}

// Fetch origin with prune.
console.log("\nFetching origin (--prune)...");
const fetchResult = await runCommand(
  ["git", "fetch", "origin", "--prune"],
  { cwd: bareDir },
);
if (fetchResult.code !== 0) {
  console.warn("  Warning: fetch failed:", fetchResult.stderr);
} else {
  console.log("  Fetch complete.");
}

// Pull main.
console.log("\nPulling main...");
const pullResult = await runCommand(["git", "pull"], { cwd: mainDir });
if (pullResult.code !== 0) {
  console.warn("  Warning: pull failed:", pullResult.stderr);
} else {
  console.log("  main is up to date.");
}

console.log(`\nDone. Cleaned up worktree '${worktreeName}'.`);
