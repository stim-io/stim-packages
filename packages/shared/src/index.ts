import "@stim-io/components/styles/foundation/index.css";
import "@stim-io/components/styles/components/stim-button/common.css";

export type PlaygroundTheme = "light" | "dark";
export type PlaygroundEngine = "chromium" | "webkit";

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

  await import(
    engine === "webkit"
      ? "@stim-io/components/styles/components/stim-button/webkit.css"
      : "@stim-io/components/styles/components/stim-button/chromium.css"
  );

  document.documentElement.dataset.theme = theme;
  document.documentElement.dataset.engine = engine;
}

export function resolveCurrentEngine(
  userAgent: string = navigator.userAgent,
): PlaygroundEngine {
  const value = userAgent.toLowerCase();
  return /safari/.test(value) && !/chrome|chromium|edg/.test(value)
    ? "webkit"
    : "chromium";
}

export function createPlaygroundTitle(name: string, engine: PlaygroundEngine) {
  return `${name} playground (${engine})`;
}
