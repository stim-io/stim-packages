import path from "node:path";
import {
  copyFilesByExtension,
  emptyDirectory,
  hasFilesWithExtensions,
  resolvePackageRoot,
  runCommand,
  writeTextFileEnsured,
} from "@stim-io/shared/node";

const packageRoot = resolvePackageRoot(import.meta.url);
const distDir = path.resolve(packageRoot, "dist");
const srcStylesDir = path.resolve(packageRoot, "src", "styles");
const distStylesDir = path.resolve(distDir, "styles");

await emptyDirectory(distDir);
await runCommand("pnpm", ["exec", "vite", "build"], { cwd: packageRoot });
await runCommand(
  "pnpm",
  [
    "exec",
    "vue-tsc",
    "-p",
    "tsconfig.json",
    "--noEmit",
    "false",
    "--declaration",
    "--emitDeclarationOnly",
    "--declarationMap",
    "false",
    "--outDir",
    "dist",
    "--rootDir",
    "src",
  ],
  { cwd: packageRoot },
);
await copyCssAssets();
await compileSassAssets();

async function copyCssAssets() {
  await copyFilesByExtension(srcStylesDir, distStylesDir, [".css"]);
  await writeTextFileEnsured(
    path.resolve(distStylesDir, "index.d.ts"),
    "export {}\n",
  );
}

async function compileSassAssets() {
  if (!(await hasFilesWithExtensions(srcStylesDir, [".scss", ".sass"]))) {
    return;
  }

  await runCommand(
    "pnpm",
    [
      "exec",
      "sass",
      "--style=expanded",
      "--no-source-map",
      `${srcStylesDir}:${distStylesDir}`,
    ],
    { cwd: packageRoot },
  );
}
