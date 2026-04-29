import { afterAll, beforeAll } from "vitest";
import type { BrowserResource, ViteResource } from "./resources";
import { createBrowserResource, createViteResource } from "./resources";

export function setupBrowserSuite() {
  let resource: BrowserResource | null = null;

  beforeAll(async () => {
    resource = await createBrowserResource();
  });

  afterAll(async () => {
    await resource?.close();
  });

  return {
    browser() {
      if (!resource) {
        throw new Error("Playwright browser resource was not initialized");
      }

      return resource.browser();
    },
  };
}

export function setupViteSuite(options: {
  root: string;
  configFile?: string | false;
  port?: number;
}) {
  let resource: ViteResource | null = null;

  beforeAll(async () => {
    resource = await createViteResource(options);
  });

  afterAll(async () => {
    await resource?.close();
  });

  return {
    url(pathname = "/") {
      if (!resource) {
        throw new Error("Vite resource was not initialized");
      }

      return new URL(pathname, resource.url()).toString();
    },
  };
}
