import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const rootDir = process.cwd();
const bannedProtocols = ["file:", "link:"];
const exactVersionPattern =
  /^\d+\.\d+\.\d+(?:-[0-9A-Za-z-.]+)?(?:\+[0-9A-Za-z-.]+)?$/;
const dependencyFields = [
  "dependencies",
  "devDependencies",
  "peerDependencies",
  "optionalDependencies",
];
const ignoredDirectories = new Set([".git", ".github", "node_modules", "dist"]);

const packageJsonPaths = await collectPackageJsonPaths(rootDir);
const violations = [];

for (const packageJsonPath of packageJsonPaths) {
  const packageJson = JSON.parse(await readFile(packageJsonPath, "utf8"));

  for (const field of dependencyFields) {
    const dependencies = packageJson[field];
    if (!dependencies || typeof dependencies !== "object") continue;

    for (const [name, specifier] of Object.entries(dependencies)) {
      if (typeof specifier !== "string") continue;
      if (specifier.startsWith("workspace:")) continue;

      const bannedProtocol = bannedProtocols.find((protocol) =>
        specifier.startsWith(protocol),
      );

      if (bannedProtocol) {
        violations.push({
          packageJsonPath,
          field,
          name,
          specifier,
          reason: `${bannedProtocol} is not allowed`,
        });
        continue;
      }

      if (!exactVersionPattern.test(specifier)) {
        violations.push({
          packageJsonPath,
          field,
          name,
          specifier,
          reason: "non-fixed versions are not allowed",
        });
      }
    }
  }
}

if (violations.length > 0) {
  console.error("guard failed: invalid dependency specifiers found.\n");

  for (const violation of violations) {
    console.error(
      `- ${path.relative(rootDir, violation.packageJsonPath)} :: ${violation.field}.${violation.name} = ${violation.specifier} (${violation.reason})`,
    );
  }

  process.exit(1);
}

console.log(
  `guard passed: checked ${packageJsonPaths.length} package.json files.`,
);

async function collectPackageJsonPaths(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const paths = [];

  for (const entry of entries) {
    if (entry.isDirectory()) {
      if (ignoredDirectories.has(entry.name)) continue;

      paths.push(
        ...(await collectPackageJsonPaths(path.join(directory, entry.name))),
      );
      continue;
    }

    if (entry.isFile() && entry.name === "package.json") {
      paths.push(path.join(directory, entry.name));
    }
  }

  return paths.sort();
}
