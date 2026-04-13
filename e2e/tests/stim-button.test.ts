import { chromium } from "@playwright/test";
import { afterAll, beforeAll, expect, test } from "vitest";

const baseUrl =
  process.env.STIM_COMPONENTS_E2E_BASE_URL ?? "http://127.0.0.1:4173";

let browser: Awaited<ReturnType<typeof chromium.launch>> | null = null;

beforeAll(async () => {
  try {
    browser = await chromium.launch();
  } catch (error) {
    throw new Error(
      `Playwright chromium is not installed. Run \`pnpm --dir e2e install:browsers\`.\n${String(error)}`,
    );
  }
});

afterAll(async () => {
  await browser?.close();
});

test("stim-button renders inside the chromium playground", async () => {
  if (!browser) {
    throw new Error("expected Playwright browser to be available");
  }

  const page = await browser.newPage();
  await page.goto(baseUrl, { waitUntil: "networkidle" });

  await page.waitForSelector('[data-playground="chromium"][data-ready="true"]');

  const buttonText = await page.locator(".stim-button").textContent();
  expect(buttonText).toBe("Chromium atom");

  await page.close();
});
