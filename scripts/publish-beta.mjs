import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { spawn } from "node:child_process";

const betaTagPattern = /^(components|shared)-v(\d+\.\d+\.\d+-beta\.\d+)$/;
const semverPattern = /^(\d+)\.(\d+)\.(\d+)(?:-beta\.(\d+))?$/;

const rootDir = process.cwd();
const [command, tag, maybeOutputFlag, maybeOutputPath] = process.argv.slice(2);

if (!command || !tag) {
  usageAndExit();
}

const publishTarget = await resolvePublishTarget(tag);

switch (command) {
  case "metadata": {
    const githubOutputPath =
      maybeOutputFlag === "--github-output" ? maybeOutputPath : undefined;

    if (githubOutputPath) {
      await appendGitHubOutputs(githubOutputPath, publishTarget);
      break;
    }

    process.stdout.write(`${JSON.stringify(publishTarget, null, 2)}\n`);
    break;
  }

  case "verify": {
    await withTemporaryPackageVersion(publishTarget, async () => {
      for (const args of publishTarget.verifyCommands) {
        await runCommand(args[0], args.slice(1));
      }
    });
    break;
  }

  case "publish": {
    await withTemporaryPackageVersion(publishTarget, async () => {
      await runCommand("pnpm", [
        "-C",
        publishTarget.packageDir,
        "publish",
        "--no-git-checks",
        "--tag",
        "beta",
        "--registry=https://npm.pkg.github.com",
      ]);
    });
    break;
  }

  default:
    usageAndExit();
}

async function resolvePublishTarget(tagValue) {
  const match = betaTagPattern.exec(tagValue);

  if (!match) {
    throw new Error(
      `unsupported beta tag '${tagValue}'. expected components-v<version>-beta.<n> or shared-v<version>-beta.<n>`,
    );
  }

  const [, packageKey, version] = match;
  const config = publishConfig()[packageKey];
  const packageJsonPath = path.join(rootDir, config.packageDir, "package.json");
  const packageJson = JSON.parse(await readFile(packageJsonPath, "utf8"));
  const packageVersion = parseSemver(packageJson.version);
  const tagVersion = parseSemver(version);

  if (!sameCoreVersion(packageVersion, tagVersion)) {
    throw new Error(
      `tag version ${version} does not match base version of ${config.packageDir}/package.json version ${packageJson.version}`,
    );
  }

  if (packageJson.private) {
    throw new Error(
      `${config.packageDir} is still private and cannot be published`,
    );
  }

  await assertTagOrder(packageKey, version, tagValue);

  return {
    packageKey,
    version,
    packageDir: config.packageDir,
    packageJsonPath,
    npmName: packageJson.name,
    packageVersion: packageJson.version,
    verifyCommands: config.verifyCommands,
  };
}

async function assertTagOrder(packageKey, version, tagValue) {
  const targetVersion = parseSemver(version);
  const existingTags = await listExistingTags(packageKey);
  const existingVersions = existingTags
    .filter((existingTag) => existingTag !== tagValue)
    .map((existingTag) => parsePackageTag(packageKey, existingTag))
    .filter(Boolean)
    .map(({ version: existingVersion, tag }) => ({
      tag,
      parsed: parseSemver(existingVersion),
    }));

  let highestVersion = null;
  let highestBetaForSameCore = null;

  for (const existing of existingVersions) {
    if (
      !highestVersion ||
      compareSemver(existing.parsed, highestVersion.parsed) > 0
    ) {
      highestVersion = existing;
    }

    if (
      existing.parsed.major === targetVersion.major &&
      existing.parsed.minor === targetVersion.minor &&
      existing.parsed.patch === targetVersion.patch
    ) {
      if (
        existing.parsed.beta !== null &&
        (!highestBetaForSameCore ||
          existing.parsed.beta > highestBetaForSameCore.parsed.beta)
      ) {
        highestBetaForSameCore = existing;
      }
    }
  }

  if (
    highestVersion &&
    compareSemver(targetVersion, highestVersion.parsed) < 0
  ) {
    throw new Error(
      `tag ${tagValue} regresses package order; highest existing ${packageKey} tag is ${highestVersion.tag}`,
    );
  }

  if (
    highestBetaForSameCore &&
    targetVersion.beta !== null &&
    targetVersion.beta <= highestBetaForSameCore.parsed.beta
  ) {
    throw new Error(
      `tag ${tagValue} does not advance beta order; highest existing ${packageKey} beta for ${targetVersion.major}.${targetVersion.minor}.${targetVersion.patch} is ${highestBetaForSameCore.tag}`,
    );
  }
}

async function listExistingTags(packageKey) {
  const { stdout } = await runCommandCapture("git", [
    "tag",
    "--list",
    `${packageKey}-v*`,
  ]);
  return stdout
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function parsePackageTag(packageKey, tag) {
  const prefix = `${packageKey}-v`;
  if (!tag.startsWith(prefix)) {
    return null;
  }

  return {
    tag,
    version: tag.slice(prefix.length),
  };
}

function parseSemver(version) {
  const match = semverPattern.exec(version);
  if (!match) {
    throw new Error(`unsupported semver '${version}' in publish-beta flow`);
  }

  return {
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3]),
    beta: match[4] === undefined ? null : Number(match[4]),
  };
}

function compareSemver(left, right) {
  for (const key of ["major", "minor", "patch"]) {
    if (left[key] !== right[key]) {
      return left[key] - right[key];
    }
  }

  if (left.beta === right.beta) {
    return 0;
  }

  if (left.beta === null) {
    return 1;
  }

  if (right.beta === null) {
    return -1;
  }

  return left.beta - right.beta;
}

function sameCoreVersion(left, right) {
  return (
    left.major === right.major &&
    left.minor === right.minor &&
    left.patch === right.patch
  );
}

function publishConfig() {
  return {
    components: {
      packageDir: "packages/components",
      verifyCommands: [
        ["pnpm", "verify:ci"],
        ["pnpm", "-C", "packages/components", "build"],
        ["pnpm", "-C", "packages/components", "typecheck"],
        ["pnpm", "-C", "packages/shared", "typecheck"],
        ["pnpm", "-C", "playgrounds/chromium", "typecheck"],
        ["pnpm", "-C", "playgrounds/webkit", "typecheck"],
        ["pnpm", "-C", "e2e", "typecheck"],
        ["pnpm", "-C", "packages/components", "pack:dry-run"],
        ["pnpm", "-C", "packages/components", "publish:dry-run:beta"],
      ],
    },
    shared: {
      packageDir: "packages/shared",
      verifyCommands: [
        ["pnpm", "verify:ci"],
        ["pnpm", "-C", "packages/components", "build"],
        ["pnpm", "-C", "packages/shared", "typecheck"],
        ["pnpm", "-C", "packages/shared", "pack:dry-run"],
        ["pnpm", "-C", "packages/shared", "publish:dry-run:beta"],
      ],
    },
  };
}

async function appendGitHubOutputs(filePath, publishTarget) {
  const body = [
    `package_key=${publishTarget.packageKey}`,
    `package_dir=${publishTarget.packageDir}`,
    `package_name=${publishTarget.npmName}`,
    `version=${publishTarget.version}`,
  ].join("\n");
  await writeFile(filePath, `${body}\n`, { flag: "a" });
}

async function withTemporaryPackageVersion(publishTarget, callback) {
  if (publishTarget.packageVersion === publishTarget.version) {
    await callback();
    return;
  }

  const originalSource = await readFile(publishTarget.packageJsonPath, "utf8");
  const packageJson = JSON.parse(originalSource);
  packageJson.version = publishTarget.version;

  await writeFile(
    publishTarget.packageJsonPath,
    `${JSON.stringify(packageJson, null, 2)}\n`,
  );

  try {
    await callback();
  } finally {
    await writeFile(publishTarget.packageJsonPath, originalSource);
  }
}

async function runCommand(commandName, args) {
  await new Promise((resolve, reject) => {
    const child = spawn(commandName, args, {
      cwd: rootDir,
      stdio: "inherit",
      env: process.env,
    });

    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(
        new Error(
          `${commandName} ${args.join(" ")} failed with exit code ${code}`,
        ),
      );
    });

    child.on("error", reject);
  });
}

async function runCommandCapture(commandName, args) {
  return await new Promise((resolve, reject) => {
    let stdout = "";
    let stderr = "";

    const child = spawn(commandName, args, {
      cwd: rootDir,
      env: process.env,
    });

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });

    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    child.on("exit", (code) => {
      if (code === 0) {
        resolve({ stdout, stderr });
        return;
      }

      reject(
        new Error(
          `${commandName} ${args.join(" ")} failed with exit code ${code}${stderr ? `: ${stderr.trim()}` : ""}`,
        ),
      );
    });

    child.on("error", reject);
  });
}

function usageAndExit() {
  console.error(
    "usage: node scripts/publish-beta.mjs <metadata|verify|publish> <components-v...|shared-v...> [--github-output <path>]",
  );
  process.exit(1);
}
