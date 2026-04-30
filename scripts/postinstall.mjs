import { chmod, mkdir, readFile, writeFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import path from "node:path";
import process from "node:process";

const marker = "stim-packages-managed-pre-commit";

try {
  const repoRoot = runGit(["rev-parse", "--show-toplevel"]);
  const hookPath = runGit(["rev-parse", "--git-path", "hooks/pre-commit"]);
  const absoluteHookPath = path.isAbsolute(hookPath)
    ? hookPath
    : path.join(repoRoot, hookPath);
  const existing = await readFileIfExists(absoluteHookPath);

  if (existing && !existing.includes(marker)) {
    console.warn(
      `postinstall: skipped pre-commit hook install because ${absoluteHookPath} is not managed by stim-packages.`,
    );
    process.exit(0);
  }

  await mkdir(path.dirname(absoluteHookPath), { recursive: true });
  await writeFile(
    absoluteHookPath,
    `#!/bin/sh
# ${marker}
set -eu

repo_root="$(git rev-parse --show-toplevel)"
cd "$repo_root"
pnpm run precommit
`,
    "utf8",
  );
  await chmod(absoluteHookPath, 0o755);
} catch (error) {
  console.warn(
    `postinstall: skipped pre-commit hook install: ${error.message}`,
  );
}

function runGit(args) {
  return execFileSync("git", args, {
    cwd: process.cwd(),
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }).trim();
}

async function readFileIfExists(filePath) {
  try {
    return await readFile(filePath, "utf8");
  } catch (error) {
    if (error?.code === "ENOENT") {
      return null;
    }

    throw error;
  }
}
