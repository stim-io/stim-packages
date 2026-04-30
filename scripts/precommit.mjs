import { spawnSync } from "node:child_process";
import process from "node:process";

const workspaceOwnedPaths = new Set(["package.json", "pnpm-workspace.yaml"]);

const packageBoundaries = [
  {
    directory: "packages/aesthetic",
    checks: ["format", "typecheck"],
  },
  {
    directory: "packages/grid-layout",
    checks: ["lint", "format"],
  },
];

const stagedPaths = getStagedPaths();

if (stagedPaths.length === 0) {
  console.log("precommit: no staged files.");
  process.exit(0);
}

const checks = [];

if (stagedPaths.some(isWorkspaceOwnedPath)) {
  checks.push({
    label: "stim-packages format",
    command: "pnpm",
    args: ["run", "format"],
  });
}

for (const packageBoundary of packageBoundaries) {
  if (
    !stagedPaths.some((filePath) =>
      isInside(filePath, packageBoundary.directory),
    )
  ) {
    continue;
  }

  for (const check of packageBoundary.checks) {
    checks.push({
      label: `${packageBoundary.directory} ${check}`,
      command: "pnpm",
      args: ["-C", packageBoundary.directory, "run", check],
    });
  }
}

if (checks.length === 0) {
  console.log("precommit: no package checks for staged files.");
  process.exit(0);
}

for (const check of checks) {
  const result = spawnSync(check.command, check.args, {
    cwd: process.cwd(),
    stdio: "inherit",
  });

  if (result.error) {
    console.error(`precommit: ${check.label} failed: ${result.error.message}`);
    process.exit(1);
  }

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

function getStagedPaths() {
  const result = spawnSync("git", ["diff", "--cached", "--name-only", "-z"], {
    cwd: process.cwd(),
    encoding: "utf8",
    stdio: ["ignore", "pipe", "inherit"],
  });

  if (result.error) {
    console.error(
      `precommit: failed to read staged files: ${result.error.message}`,
    );
    process.exit(1);
  }

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }

  return result.stdout.split("\0").filter(Boolean);
}

function isWorkspaceOwnedPath(filePath) {
  return workspaceOwnedPaths.has(filePath) || filePath.startsWith("scripts/");
}

function isInside(filePath, directory) {
  return filePath === directory || filePath.startsWith(`${directory}/`);
}
