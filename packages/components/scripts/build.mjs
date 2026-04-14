import { spawn } from "node:child_process";
import { cp, mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const packageRoot = path.resolve(__dirname, "..");
const distDir = path.resolve(packageRoot, "dist");
const srcStylesDir = path.resolve(packageRoot, "src", "styles");
const distStylesDir = path.resolve(distDir, "styles");

await rm(distDir, { recursive: true, force: true });
await run("pnpm", ["exec", "vite", "build"]);
await run("pnpm", [
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
]);
await copyCssAssets();

async function run(command, args) {
  await new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: packageRoot,
      stdio: "inherit",
      shell: false,
    });

    child.on("error", reject);
    child.on("exit", (code, signal) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(
        new Error(
          `${command} ${args.join(" ")} failed with ${signal ?? `exit code ${code}`}`,
        ),
      );
    });
  });
}

async function copyCssAssets() {
  await mkdir(distStylesDir, { recursive: true });
  await cp(srcStylesDir, distStylesDir, { recursive: true });
  await writeFile(path.resolve(distStylesDir, "index.d.ts"), "export {}\n", "utf8");
}
