import path from "node:path";
import { fileURLToPath } from "node:url";

const currentFile = fileURLToPath(import.meta.url);
const libRoot = path.dirname(currentFile);
const e2eRoot = path.dirname(libRoot);
const workspaceRoot = path.dirname(e2eRoot);

export const paths = {
  e2eRoot,
  workspaceRoot,
  fixtures: path.join(e2eRoot, "fixtures"),
  packages: {
    gridLayout: path.join(workspaceRoot, "packages", "grid-layout"),
  },
  playgrounds: {
    chromium: path.join(workspaceRoot, "playgrounds", "chromium"),
  },
};

export function fixturePath(...segments: string[]) {
  return path.join(paths.fixtures, ...segments);
}
