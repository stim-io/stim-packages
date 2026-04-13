import { cp, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const packageRoot = path.resolve(__dirname, "..");
const srcTokensDir = path.resolve(packageRoot, "src", "tokens");
const srcThemesDir = path.resolve(packageRoot, "src", "themes");
const distTokensDir = path.resolve(packageRoot, "dist", "tokens");
const distThemesDir = path.resolve(packageRoot, "dist", "themes");

await mkdir(distTokensDir, { recursive: true });
await mkdir(distThemesDir, { recursive: true });
await cp(srcTokensDir, distTokensDir, { recursive: true });
await cp(srcThemesDir, distThemesDir, { recursive: true });
await writeFile(path.resolve(distTokensDir, "index.d.ts"), "export {}\n", "utf8");
await writeFile(path.resolve(distThemesDir, "index.d.ts"), "export {}\n", "utf8");
