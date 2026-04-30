import {
  copyFile,
  mkdir,
  readFile,
  rm,
  stat,
  writeFile,
} from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execa } from "execa";
import fg from "fast-glob";

export function resolvePackageRoot(importMetaUrl) {
  return path.resolve(path.dirname(fileURLToPath(importMetaUrl)), "..");
}

export function stripArgumentSeparator(args) {
  return args.filter((arg, index) => index < 2 || arg !== "--");
}

export async function runCommand(command, args, options = {}) {
  await execa(command, args, {
    cwd: options.cwd,
    env: options.env,
    stdio: options.stdio ?? "inherit",
  });
}

export async function runCommandCapture(command, args, options = {}) {
  const result = await execa(command, args, {
    cwd: options.cwd,
    env: options.env,
  });

  return {
    stdout: result.stdout,
    stderr: result.stderr,
  };
}

export async function readPackageJson(packageRoot) {
  return JSON.parse(
    await readFile(path.join(packageRoot, "package.json"), "utf8"),
  );
}

export async function assertPublicPackage(packageRoot, action) {
  const packageJson = await readPackageJson(packageRoot);

  if (packageJson.private) {
    throw new Error(
      `${packageJson.name} is still private and cannot be ${action}`,
    );
  }

  return packageJson;
}

export async function verifyPackagePayload(packageRoot) {
  const packageJson = await assertPublicPackage(packageRoot, "payload-checked");
  const failures = [];
  const paths = collectPayloadPaths(packageJson);

  if (!packageJson.name?.startsWith("@stim-io/")) {
    failures.push("package name must use the @stim-io scope");
  }

  if (packageJson.publishConfig?.registry !== "https://npm.pkg.github.com") {
    failures.push("publishConfig.registry must be https://npm.pkg.github.com");
  }

  if (!Array.isArray(packageJson.files) || packageJson.files.length === 0) {
    failures.push("package.json files must declare the published payload root");
  }

  for (const packagePath of paths) {
    await assertPayloadPath(packageRoot, packagePath, failures);
  }

  if (failures.length > 0) {
    throw new Error(
      `payload check failed for ${packageJson.name ?? packageRoot}:\n${failures
        .map((failure) => `- ${failure}`)
        .join("\n")}`,
    );
  }

  console.log(
    `payload verified: ${packageJson.name} (${paths.length} package paths)`,
  );
}

export async function emptyDirectory(directory) {
  await rm(directory, { recursive: true, force: true });
  await mkdir(directory, { recursive: true });
}

export async function hasFilesWithExtensions(directory, extensions) {
  const matches = await fg(extensionPatterns(extensions), {
    cwd: directory,
    dot: true,
    onlyFiles: true,
    unique: true,
  });

  return matches.length > 0;
}

export async function copyFilesByExtension(sourceDir, targetDir, extensions) {
  const matches = await fg(extensionPatterns(extensions), {
    cwd: sourceDir,
    dot: true,
    onlyFiles: true,
    unique: true,
  });

  for (const relativePath of matches) {
    const targetPath = path.join(targetDir, relativePath);
    await mkdir(path.dirname(targetPath), { recursive: true });
    await copyFile(path.join(sourceDir, relativePath), targetPath);
  }
}

export async function writeTextFileEnsured(filePath, content) {
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, content, "utf8");
}

function extensionPatterns(extensions) {
  return extensions.map((extension) => `**/*${extension}`);
}

function collectPayloadPaths(packageJson) {
  return uniquePackagePaths([
    ...collectFiles(packageJson.files),
    ...collectFieldPaths(packageJson, ["main", "module", "types", "typings"]),
    ...collectExportPaths(packageJson.exports),
  ]);
}

function collectFiles(files) {
  if (!Array.isArray(files)) {
    return [];
  }

  return files.filter(
    (file) => typeof file === "string" && !file.startsWith("!"),
  );
}

function collectFieldPaths(packageJson, fieldNames) {
  return fieldNames.flatMap((fieldName) => {
    const value = packageJson[fieldName];
    return typeof value === "string" ? [value] : [];
  });
}

function collectExportPaths(exportsValue) {
  const paths = [];
  collectExportPath(exportsValue, paths);
  return paths;
}

function collectExportPath(value, paths) {
  if (typeof value === "string") {
    paths.push(value);
    return;
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      collectExportPath(item, paths);
    }
    return;
  }

  if (value && typeof value === "object") {
    for (const item of Object.values(value)) {
      collectExportPath(item, paths);
    }
  }
}

function uniquePackagePaths(values) {
  return [
    ...new Set(values.map(toCheckablePackagePath).filter(Boolean)),
  ].sort();
}

function toCheckablePackagePath(value) {
  const packagePath = value.replace(/^\.\//, "");
  const wildcardIndex = packagePath.indexOf("*");

  if (wildcardIndex === -1) {
    return packagePath;
  }

  const prefix = packagePath.slice(0, wildcardIndex).replace(/\/$/, "");
  return prefix || ".";
}

async function assertPayloadPath(packageRoot, packagePath, failures) {
  const absolutePath = path.resolve(packageRoot, packagePath);
  const relativePath = path.relative(packageRoot, absolutePath);

  if (relativePath.startsWith("..") || path.isAbsolute(relativePath)) {
    failures.push(`${packagePath} escapes the package root`);
    return;
  }

  try {
    await stat(absolutePath);
  } catch (error) {
    if (error?.code === "ENOENT") {
      failures.push(`${packagePath} does not exist`);
      return;
    }

    throw error;
  }
}
