// Set up a new git worktree: create branch, copy config files, install deps.
// Run with: deno task worktree:setup <branch-name>
// Example:  deno task worktree:setup feat/add-new-button
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

const branchName = Deno.args[0];
if (!branchName) {
  console.error("Usage: deno task worktree:setup <branch-name>");
  console.error("Example: deno task worktree:setup feat/add-new-button");
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
const worktreeDir = join(repoRoot, branchName);
const mainDir = join(repoRoot, "main");

console.log(`Setting up worktree for branch: ${branchName}`);
console.log(`  Bare dir:     ${bareDir}`);
console.log(`  Worktree dir: ${worktreeDir}`);

// Fetch latest refs from origin.
console.log("\nFetching origin main...");
const fetchResult = await runCommand(
  ["git", "fetch", "origin", "main"],
  { cwd: bareDir },
);
if (fetchResult.code !== 0) {
  console.error("Failed to fetch origin main:", fetchResult.stderr);
  Deno.exit(1);
}
console.log("  Fetch complete.");

// Create the worktree and branch.
console.log(`\nCreating worktree at: ${worktreeDir}`);
const worktreeRelPath = join("..", branchName);
const addResult = await runCommand(
  ["git", "worktree", "add", "-b", branchName, worktreeRelPath],
  { cwd: bareDir },
);
if (addResult.code !== 0) {
  console.error("Failed to create worktree:", addResult.stderr);
  Deno.exit(1);
}
console.log("  Worktree created.");

// Copy .env (warn if missing, don't fail).
console.log("\nCopying .env...");
const envSrc = join(mainDir, ".env");
const envDst = join(worktreeDir, ".env");
try {
  await Deno.stat(envSrc);
  await Deno.copyFile(envSrc, envDst);
  console.log("  .env copied.");
} catch {
  console.warn(
    `  Warning: ${envSrc} not found — skipping. Set up .env manually.`,
  );
}

// Copy .claude/settings.local.json (warn if missing, don't fail).
console.log("\nCopying .claude/settings.local.json...");
const settingsSrc = join(mainDir, ".claude", "settings.local.json");
const settingsDst = join(worktreeDir, ".claude", "settings.local.json");
try {
  await Deno.stat(settingsSrc);
  await Deno.mkdir(join(worktreeDir, ".claude"), { recursive: true });
  await Deno.copyFile(settingsSrc, settingsDst);
  console.log("  settings.local.json copied.");
} catch {
  console.warn(
    `  Warning: ${settingsSrc} not found — skipping. Set up settings.local.json manually.`,
  );
}

// Install dependencies.
console.log("\nInstalling dependencies (deno install --allow-scripts)...");
const installResult = await runCommand(
  ["deno", "install", "--allow-scripts"],
  { cwd: worktreeDir },
);
if (installResult.code !== 0) {
  console.error("Failed to install dependencies:", installResult.stderr);
  Deno.exit(1);
}
console.log("  Dependencies installed.");

// Run Prisma migrations.
console.log("\nRunning Prisma migrations (deno task prisma:migrate)...");
const migrateResult = await runCommand(
  ["deno", "task", "prisma:migrate"],
  { cwd: worktreeDir },
);
if (migrateResult.code !== 0) {
  console.error("Failed to run Prisma migrations:", migrateResult.stderr);
  Deno.exit(1);
}
console.log("  Migrations complete.");

// Generate Prisma client.
console.log("\nGenerating Prisma client (deno task prisma:generate)...");
const generateResult = await runCommand(
  ["deno", "task", "prisma:generate"],
  { cwd: worktreeDir },
);
if (generateResult.code !== 0) {
  console.error("Failed to generate Prisma client:", generateResult.stderr);
  Deno.exit(1);
}
console.log("  Prisma client generated.");

console.log(
  `\nDone. Worktree '${branchName}' is ready at:\n  ${worktreeDir}`,
);
