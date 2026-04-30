import type { Page } from "@playwright/test";

export interface GridNamespaceTestContext {
  newReadyPage(): Promise<Page>;
}
