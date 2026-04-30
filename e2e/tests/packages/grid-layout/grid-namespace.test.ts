import { fixturePath } from "../../../lib/paths";
import { setupBrowserSuite, setupViteSuite } from "../../../lib/setup";
import { registerExternalTriggerTests } from "./grid-namespace/external-trigger";
import {
  registerNamespaceDragHandleTests,
  registerNamespaceTests,
} from "./grid-namespace/namespace";
import { registerPushDragTests } from "./grid-namespace/push-drag";
import { registerVerticalPushDragTests } from "./grid-namespace/push-drag-vertical";
import { registerReflowDragTests } from "./grid-namespace/reflow-drag";
import { registerResizeTests } from "./grid-namespace/resize";
import type { GridNamespaceTestContext } from "./grid-namespace/suite";

const browserSuite = setupBrowserSuite();
const viteSuite = setupViteSuite({
  root: fixturePath("packages", "grid-layout"),
  port: 4273,
});

const context: GridNamespaceTestContext = {
  async newReadyPage() {
    const page = await browserSuite.browser().newPage();

    await page.goto(viteSuite.url(), { waitUntil: "domcontentloaded" });
    await page.waitForSelector('html[data-ready="true"]');

    return page;
  },
};

registerNamespaceTests(context);
registerResizeTests(context);
registerPushDragTests(context);
registerVerticalPushDragTests(context);
registerReflowDragTests(context);
registerExternalTriggerTests(context);
registerNamespaceDragHandleTests(context);
