export type StimTheme = "light" | "dark";
export type StimEngine = "chromium" | "webkit";
export type PlaygroundTheme = StimTheme;
export type PlaygroundEngine = StimEngine;

export function resolveCurrentEngine(
  userAgent: string = navigator.userAgent,
): PlaygroundEngine {
  const value = userAgent.toLowerCase();
  return /safari/.test(value) && !/chrome|chromium|edg/.test(value)
    ? "webkit"
    : "chromium";
}
