import { copyFile, mkdir, readFile, rm, writeFile } from "node:fs/promises";
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
