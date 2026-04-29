import "@stim-io/components/styles/foundation/index.css";
import "@stim-io/components/styles/components/stim-button/common.css";
import "@stim-io/components/styles/components/stim-grid/common.css";
import type { PlaygroundEngine, PlaygroundTheme } from "@stim-io/shared";

export type { PlaygroundEngine, PlaygroundTheme } from "@stim-io/shared";

export async function applyStimPlaygroundTheme(options: {
  theme: PlaygroundTheme;
  engine: PlaygroundEngine;
}) {
  const { theme, engine } = options;

  if (theme === "dark") {
    await import("@stim-io/components/styles/themes/dark.css");
  } else {
    await import("@stim-io/components/styles/themes/light.css");
  }

  if (engine === "webkit") {
    await import("@stim-io/components/styles/components/stim-button/webkit.css");
  } else {
    await import("@stim-io/components/styles/components/stim-button/chromium.css");
  }

  document.documentElement.dataset.theme = theme;
  document.documentElement.dataset.engine = engine;
}

export function createPlaygroundTitle(name: string, engine: PlaygroundEngine) {
  return `${name} playground (${engine})`;
}
