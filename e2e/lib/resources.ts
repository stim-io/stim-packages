import { chromium, type Browser } from "@playwright/test";
import { createServer, type ViteDevServer } from "vite";

export interface BrowserResource {
  browser(): Browser;
  close(): Promise<void>;
}

export interface ViteResource {
  url(): string;
  close(): Promise<void>;
}

export async function createBrowserResource(): Promise<BrowserResource> {
  let browser: Browser;

  try {
    browser = await chromium.launch();
  } catch (error) {
    throw new Error(
      `Playwright chromium is not installed. Run \`pnpm --dir e2e install:browsers\`.\n${String(error)}`,
    );
  }

  return {
    browser() {
      return browser;
    },
    async close() {
      await browser.close();
    },
  };
}

export async function createViteResource(options: {
  root: string;
  configFile?: string | false;
  host?: string;
  port?: number;
}): Promise<ViteResource> {
  const host = options.host ?? "127.0.0.1";
  const server: ViteDevServer = await createServer({
    root: options.root,
    configFile: options.configFile ?? false,
    server: {
      host,
      port: options.port ?? 0,
      strictPort: false,
    },
  });

  await server.listen();

  return {
    url() {
      const address = server.httpServer?.address();

      if (!address || typeof address === "string") {
        throw new Error("expected Vite dev server to expose a TCP address");
      }

      return `http://${host}:${address.port}`;
    },
    async close() {
      await server.close();
    },
  };
}
