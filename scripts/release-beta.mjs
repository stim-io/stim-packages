import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import {
  readPackageJson,
  runCommand,
  runCommandCapture,
} from "@stim-io/shared/node";

const packageKeyPattern = /^(components|shared)$/;
const semverPattern = /^(\d+)\.(\d+)\.(\d+)(?:-beta\.(\d+))?$/;

const rootDir = process.cwd();
const args = process.argv.slice(2);
const [command, packageKeyArg, versionArg, ...optionArgs] = args;

if (!command || !packageKeyArg || !versionArg) {
  usageAndExit();
}

const releaseTarget = await resolveReleaseTarget(packageKeyArg, versionArg);

switch (command) {
  case "metadata": {
    const githubOutputPath = readOption("--github-output", optionArgs);

    if (githubOutputPath) {
      await appendGitHubOutputs(githubOutputPath, releaseTarget);
      break;
    }

    process.stdout.write(`${JSON.stringify(releaseTarget, null, 2)}\n`);
    break;
  }

  case "verify": {
    await withTemporaryPackageVersion(releaseTarget, async () => {
      for (const args of releaseTarget.verifyCommands) {
        await runCommand(args[0], args.slice(1), { cwd: rootDir });
      }
    });
    break;
  }

  case "release": {
    await withTemporaryPackageVersion(releaseTarget, async () => {
      await runCommand(
        "pnpm",
        [
          "-C",
          releaseTarget.packageDir,
          "run",
          "release",
          "--",
          "--target=release",
          "--tag=beta",
          "--no-dry-run",
        ],
        { cwd: rootDir },
      );
    });
    break;
  }

  case "create-tag": {
    const ref = readRequiredOption("--ref", optionArgs);
    await createTagForRef(releaseTarget, ref);
    break;
  }

  default:
    usageAndExit();
}

async function resolveReleaseTarget(packageKey, version) {
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

  const config = releaseConfig()[packageKey];
  const packageJsonPath = path.join(rootDir, config.packageDir, "package.json");
  const packageJson = await readPackageJson(
    path.join(rootDir, config.packageDir),
  );
  const packageVersion = parseSemver(packageJson.version);
  const tagValue = buildTag(packageKey, version);

  if (!sameCoreVersion(packageVersion, parsedVersion)) {
    throw new Error(
      `beta version ${version} does not match base version of ${config.packageDir}/package.json version ${packageJson.version}`,
    );
  }

  if (packageJson.private) {
    throw new Error(
      `${config.packageDir} is still private and cannot be released`,
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
  const { stdout } = await runCommandCapture(
    "git",
    ["tag", "--list", `${packageKey}-v*`],
    { cwd: rootDir },
  );
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
    throw new Error(`unsupported semver '${version}' in release-beta flow`);
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

function releaseConfig() {
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
        ["pnpm", "-C", "packages/components", "run", "pack"],
        [
          "pnpm",
          "-C",
          "packages/components",
          "run",
          "release",
          "--",
          "--target=all",
          "--tag=beta",
        ],
      ],
    },
    shared: {
      packageDir: "packages/shared",
      verifyCommands: [
        ["pnpm", "verify:ci"],
        ["pnpm", "-C", "packages/components", "build"],
        ["pnpm", "-C", "packages/shared", "typecheck"],
        ["pnpm", "-C", "packages/shared", "run", "pack"],
        [
          "pnpm",
          "-C",
          "packages/shared",
          "run",
          "release",
          "--",
          "--target=all",
          "--tag=beta",
        ],
      ],
    },
  };
}

async function appendGitHubOutputs(filePath, releaseTarget) {
  const body = [
    `package_key=${releaseTarget.packageKey}`,
    `package_dir=${releaseTarget.packageDir}`,
    `package_name=${releaseTarget.npmName}`,
    `version=${releaseTarget.version}`,
    `tag=${releaseTarget.tag}`,
  ].join("\n");
  await writeFile(filePath, `${body}\n`, { flag: "a" });
}

async function createTagForRef(releaseTarget, ref) {
  const normalizedRef = ref.trim();

  if (!normalizedRef) {
    throw new Error("missing --ref for create-tag");
  }

  const existingTags = await listExistingTags(releaseTarget.packageKey);
  if (existingTags.includes(releaseTarget.tag)) {
    throw new Error(`tag ${releaseTarget.tag} already exists`);
  }

  await runCommand("git", ["tag", releaseTarget.tag, normalizedRef], {
    cwd: rootDir,
  });
  await runCommand("git", ["push", "origin", releaseTarget.tag], {
    cwd: rootDir,
  });
}

async function withTemporaryPackageVersion(releaseTarget, callback) {
  if (releaseTarget.packageVersion === releaseTarget.version) {
    await callback();
    return;
  }

  const originalSource = await readFile(releaseTarget.packageJsonPath, "utf8");
  const packageJson = JSON.parse(originalSource);
  packageJson.version = releaseTarget.version;

  await writeFile(
    releaseTarget.packageJsonPath,
    `${JSON.stringify(packageJson, null, 2)}\n`,
  );

  try {
    await callback();
  } finally {
    await writeFile(releaseTarget.packageJsonPath, originalSource);
  }
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
    "usage: node scripts/release-beta.mjs <metadata|verify|release|create-tag> <components|shared> <x.y.z-beta.n> [--github-output <path>] [--ref <sha>]",
  );
  process.exit(1);
}
