import "@stim-io/stim-components/style.css";
import "@stim-io/stim-components/tokens.css";

export type PlaygroundTheme = "light" | "dark";
export type PlaygroundEngine = "chromium" | "webkit";

export async function applyStimPlaygroundTheme(options: {
  theme: PlaygroundTheme;
  engine: PlaygroundEngine;
}) {
  const { theme, engine } = options;

  if (theme === "dark") {
    await import("@stim-io/stim-components/themes/dark/common.css");
    await import(
      engine === "webkit"
        ? "@stim-io/stim-components/themes/dark/webkit.css"
        : "@stim-io/stim-components/themes/dark/chromium.css"
    );
  } else {
    await import("@stim-io/stim-components/themes/light/common.css");
    await import(
      engine === "webkit"
        ? "@stim-io/stim-components/themes/light/webkit.css"
        : "@stim-io/stim-components/themes/light/chromium.css"
    );
  }

  document.documentElement.dataset.theme = theme;
  document.documentElement.dataset.engine = engine;
}

export function resolveCurrentEngine(userAgent: string = navigator.userAgent): PlaygroundEngine {
  const value = userAgent.toLowerCase();
  return /safari/.test(value) && !/chrome|chromium|edg/.test(value) ? "webkit" : "chromium";
}

export function createPlaygroundTitle(name: string, engine: PlaygroundEngine) {
  return `${name} playground (${engine})`;
}
