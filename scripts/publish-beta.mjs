import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { spawn } from "node:child_process";

const packageKeyPattern = /^(components|shared)$/;
const semverPattern = /^(\d+)\.(\d+)\.(\d+)(?:-beta\.(\d+))?$/;

const rootDir = process.cwd();
const args = process.argv.slice(2);
const [command, packageKeyArg, versionArg, ...optionArgs] = args;

if (!command || !packageKeyArg || !versionArg) {
  usageAndExit();
}

const publishTarget = await resolvePublishTarget(packageKeyArg, versionArg);

switch (command) {
  case "metadata": {
    const githubOutputPath = readOption("--github-output", optionArgs);

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
      await runCommand(
        "npm",
        ["publish", "--tag", "beta", "--registry=https://npm.pkg.github.com"],
        publishTarget.packageDir,
      );
    });
    break;
  }

  case "create-tag": {
    const ref = readRequiredOption("--ref", optionArgs);
    await createTagForRef(publishTarget, ref);
    break;
  }

  default:
    usageAndExit();
}

async function resolvePublishTarget(packageKey, version) {
  if (!packageKeyPattern.test(packageKey)) {
    throw new Error(
      `unsupported beta package '${packageKey}'. expected components or shared`,
    );
  }

  const parsedVersion = parseSemver(version);

  if (parsedVersion.beta === null) {
    throw new Error(
      `unsupported beta version '${version}'. expected <major>.<minor>.<patch>-beta.<n>`,
    );
  }

  const config = publishConfig()[packageKey];
  const packageJsonPath = path.join(rootDir, config.packageDir, "package.json");
  const packageJson = JSON.parse(await readFile(packageJsonPath, "utf8"));
  const packageVersion = parseSemver(packageJson.version);
  const tagValue = buildTag(packageKey, version);

  if (!sameCoreVersion(packageVersion, parsedVersion)) {
    throw new Error(
      `beta version ${version} does not match base version of ${config.packageDir}/package.json version ${packageJson.version}`,
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
    tag: tagValue,
    packageDir: config.packageDir,
    packageJsonPath,
    npmName: packageJson.name,
    packageVersion: packageJson.version,
    verifyCommands: config.verifyCommands,
  };
}

function buildTag(packageKey, version) {
  return `${packageKey}-v${version}`;
}

async function assertTagOrder(packageKey, version, tagValue) {
  const targetVersion = parseSemver(version);
  const existingTags = await listExistingTags(packageKey);
  const existingVersions = existingTags
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
    `tag=${publishTarget.tag}`,
  ].join("\n");
  await writeFile(filePath, `${body}\n`, { flag: "a" });
}

async function createTagForRef(publishTarget, ref) {
  const normalizedRef = ref.trim();

  if (!normalizedRef) {
    throw new Error("missing --ref for create-tag");
  }

  const existingTags = await listExistingTags(publishTarget.packageKey);
  if (existingTags.includes(publishTarget.tag)) {
    throw new Error(`tag ${publishTarget.tag} already exists`);
  }

  await runCommand("git", ["tag", publishTarget.tag, normalizedRef]);
  await runCommand("git", ["push", "origin", publishTarget.tag]);
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

async function runCommand(commandName, args, cwd = rootDir) {
  await new Promise((resolve, reject) => {
    const child = spawn(commandName, args, {
      cwd,
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

function readOption(name, optionArgs) {
  const index = optionArgs.indexOf(name);
  if (index === -1) {
    return undefined;
  }

  return optionArgs[index + 1];
}

function readRequiredOption(name, optionArgs) {
  const value = readOption(name, optionArgs);
  if (!value) {
    throw new Error(`missing required option ${name}`);
  }

  return value;
}

function usageAndExit() {
  console.error(
    "usage: node scripts/publish-beta.mjs <metadata|verify|publish|create-tag> <components|shared> <x.y.z-beta.n> [--github-output <path>] [--ref <sha>]",
  );
  process.exit(1);
}
