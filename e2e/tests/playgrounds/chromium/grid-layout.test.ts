import path from "node:path";
import { expect, test } from "vitest";
import { paths } from "../../../lib/paths";
import { setupBrowserSuite, setupViteSuite } from "../../../lib/setup";

const browserSuite = setupBrowserSuite();
const viteSuite = setupViteSuite({
  root: paths.playgrounds.chromium,
  configFile: path.join(paths.playgrounds.chromium, "vite.config.ts"),
  port: 4274,
});

test("chromium playground assembles a single-namespace flat grid demo", async () => {
  const page = await browserSuite.browser().newPage();

  await page.goto(viteSuite.url(), { waitUntil: "domcontentloaded" });
  await page.waitForSelector('[data-playground="chromium"][data-ready="true"]');

  await expect
    .poll(() => page.locator("[data-grid-layout-demo]").count())
    .toBe(1);
  await expect.poll(() => page.locator(".stim-grid-container").count()).toBe(1);
  await expect
    .poll(() => page.locator('[data-stim-grid-namespace="default"]').count())
    .toBeGreaterThan(1);

  const initialGrid = await page
    .locator('[data-grid-layout-metric="grid"]')
    .textContent();
  const initialVisible = await page
    .locator('[data-grid-layout-metric="visible-panels"]')
    .textContent();
  const initialSessionsStart = await page
    .locator('[data-stim-grid-panel="sessions"]')
    .evaluate((element) => getComputedStyle(element).gridColumnStart);
  const dragHandle = page.locator(
    '[data-stim-grid-drag-handle="sessions-drag"]',
  );
  const dragHandleBox = await dragHandle.boundingBox();

  if (!dragHandleBox) {
    throw new Error("expected sessions drag handle to be visible");
  }

  await page.mouse.move(
    dragHandleBox.x + dragHandleBox.width / 2,
    dragHandleBox.y + dragHandleBox.height / 2,
  );
  await page.mouse.down();
  await page.mouse.move(
    dragHandleBox.x + dragHandleBox.width / 2 + 120,
    dragHandleBox.y + dragHandleBox.height / 2,
    { steps: 6 },
  );
  await page.mouse.up();

  await expect
    .poll(() =>
      page
        .locator('[data-stim-grid-panel="sessions"]')
        .evaluate((element) => getComputedStyle(element).gridColumnStart),
    )
    .not.toBe(initialSessionsStart);

  await page.locator('[data-grid-mode-option="default"]').click();

  await expect
    .poll(() =>
      page
        .locator('[data-stim-grid-panel="sessions"]')
        .evaluate((element) => getComputedStyle(element).gridColumnStart),
    )
    .toBe(initialSessionsStart);

  await page.locator('[data-grid-drag-strategy-option="guarded"]').click();

  await expect
    .poll(() =>
      page.locator('[data-grid-layout-metric="drag-strategy"]').textContent(),
    )
    .toBe("guarded");
  await expect
    .poll(() =>
      dragHandle.evaluate((element) =>
        element.getAttribute("data-stim-grid-drag-strategy"),
      ),
    )
    .toBe("guarded");

  const guardedDragHandleBox = await dragHandle.boundingBox();

  if (!guardedDragHandleBox) {
    throw new Error("expected sessions guarded drag handle to be visible");
  }

  await page.mouse.move(
    guardedDragHandleBox.x + guardedDragHandleBox.width / 2,
    guardedDragHandleBox.y + guardedDragHandleBox.height / 2,
  );
  await page.mouse.down();
  await page.mouse.move(
    guardedDragHandleBox.x + guardedDragHandleBox.width / 2 + 120,
    guardedDragHandleBox.y + guardedDragHandleBox.height / 2,
    { steps: 6 },
  );
  await page.mouse.up();

  await expect
    .poll(() =>
      page
        .locator('[data-stim-grid-panel="sessions"]')
        .evaluate((element) => getComputedStyle(element).gridColumnStart),
    )
    .toBe(initialSessionsStart);

  const initialConversationEnd = await page
    .locator('[data-stim-grid-panel="conversation"]')
    .evaluate((element) => getComputedStyle(element).gridColumnEnd);
  const initialToolsStart = await page
    .locator('[data-stim-grid-panel="tools"]')
    .evaluate((element) => getComputedStyle(element).gridColumnStart);
  const initialToolsEnd = await page
    .locator('[data-stim-grid-panel="tools"]')
    .evaluate((element) => getComputedStyle(element).gridRowEnd);
  const initialContextStart = await page
    .locator('[data-stim-grid-panel="context"]')
    .evaluate((element) => getComputedStyle(element).gridRowStart);
  await expect
    .poll(() =>
      page
        .locator('[data-grid-layout-metric="conversation-span"]')
        .textContent(),
    )
    .toBe("11");
  await expect
    .poll(() =>
      page.locator('[data-grid-layout-metric="tools-span"]').textContent(),
    )
    .toBe("7");
  const handle = page.locator(
    '[data-stim-grid-handle="conversation-inline-end"]',
  );
  const handleBox = await handle.boundingBox();

  if (!handleBox) {
    throw new Error("expected conversation resize handle to be visible");
  }

  await page.mouse.move(
    handleBox.x + handleBox.width / 2,
    handleBox.y + handleBox.height / 2,
  );
  await page.mouse.down();
  await page.mouse.move(
    handleBox.x + handleBox.width / 2 + 120,
    handleBox.y + handleBox.height / 2,
    { steps: 6 },
  );
  await page.mouse.up();

  await expect
    .poll(() =>
      page
        .locator('[data-stim-grid-panel="conversation"]')
        .evaluate((element) => getComputedStyle(element).gridColumnEnd),
    )
    .not.toBe(initialConversationEnd);

  await page.locator('[data-grid-mode-option="default"]').click();

  await expect
    .poll(() =>
      page
        .locator('[data-stim-grid-panel="conversation"]')
        .evaluate((element) => getComputedStyle(element).gridColumnEnd),
    )
    .toBe(initialConversationEnd);
  await expect
    .poll(() =>
      page
        .locator('[data-stim-grid-panel="tools"]')
        .evaluate((element) => getComputedStyle(element).gridColumnStart),
    )
    .toBe(initialToolsStart);

  await page.locator('[data-grid-resize-strategy-option="free"]').click();

  await expect
    .poll(() =>
      page.locator('[data-grid-layout-metric="resize-strategy"]').textContent(),
    )
    .toBe("free");

  const freeResizeHandleBox = await handle.boundingBox();

  if (!freeResizeHandleBox) {
    throw new Error("expected free conversation resize handle to be visible");
  }

  await page.mouse.move(
    freeResizeHandleBox.x + freeResizeHandleBox.width / 2,
    freeResizeHandleBox.y + freeResizeHandleBox.height / 2,
  );
  await page.mouse.down();
  await page.mouse.move(
    freeResizeHandleBox.x + freeResizeHandleBox.width / 2 - 600,
    freeResizeHandleBox.y + freeResizeHandleBox.height / 2,
    { steps: 6 },
  );
  await page.mouse.up();

  await expect
    .poll(() =>
      page
        .locator('[data-grid-layout-metric="conversation-span"]')
        .textContent(),
    )
    .toBe("8");
  await expect
    .poll(() =>
      page
        .locator('[data-stim-grid-panel="tools"]')
        .evaluate((element) => getComputedStyle(element).gridColumnStart),
    )
    .toBe(initialToolsStart);

  const toolsHandle = page.locator('[data-stim-grid-handle="tools-block-end"]');
  const toolsHandleBox = await toolsHandle.boundingBox();

  if (!toolsHandleBox) {
    throw new Error("expected tools block-end resize handle to be visible");
  }

  await page.mouse.move(
    toolsHandleBox.x + toolsHandleBox.width / 2,
    toolsHandleBox.y + toolsHandleBox.height / 2,
  );
  await page.mouse.down();
  await page.mouse.move(
    toolsHandleBox.x + toolsHandleBox.width / 2,
    toolsHandleBox.y + toolsHandleBox.height / 2 - 220,
    { steps: 6 },
  );
  await page.mouse.up();

  await expect
    .poll(() =>
      page.locator('[data-grid-layout-metric="tools-span"]').textContent(),
    )
    .toBe("3");
  await expect
    .poll(() =>
      page
        .locator('[data-stim-grid-panel="context"]')
        .evaluate((element) => getComputedStyle(element).gridRowStart),
    )
    .toBe(initialContextStart);

  await page.locator('[data-grid-mode-option="default"]').click();

  await expect
    .poll(() =>
      page
        .locator('[data-stim-grid-panel="tools"]')
        .evaluate((element) => getComputedStyle(element).gridRowEnd),
    )
    .toBe(initialToolsEnd);

  await page.locator('[data-grid-resize-strategy-option="guarded"]').click();

  await expect
    .poll(() =>
      page.locator('[data-grid-layout-metric="resize-strategy"]').textContent(),
    )
    .toBe("guarded");
  await expect
    .poll(() =>
      handle.evaluate((element) =>
        element.getAttribute("data-stim-grid-resize-strategy"),
      ),
    )
    .toBe("guarded");

  const guardedResizeHandleBox = await handle.boundingBox();

  if (!guardedResizeHandleBox) {
    throw new Error(
      "expected guarded conversation resize handle to be visible",
    );
  }

  await page.mouse.move(
    guardedResizeHandleBox.x + guardedResizeHandleBox.width / 2,
    guardedResizeHandleBox.y + guardedResizeHandleBox.height / 2,
  );
  await page.mouse.down();
  await page.mouse.move(
    guardedResizeHandleBox.x + guardedResizeHandleBox.width / 2 + 120,
    guardedResizeHandleBox.y + guardedResizeHandleBox.height / 2,
    { steps: 6 },
  );
  await page.mouse.up();

  await expect
    .poll(() =>
      page
        .locator('[data-stim-grid-panel="conversation"]')
        .evaluate((element) => getComputedStyle(element).gridColumnEnd),
    )
    .toBe(initialConversationEnd);

  const guardedShrinkHandleBox = await handle.boundingBox();

  if (!guardedShrinkHandleBox) {
    throw new Error("expected guarded shrink handle to be visible");
  }

  await page.mouse.move(
    guardedShrinkHandleBox.x + guardedShrinkHandleBox.width / 2,
    guardedShrinkHandleBox.y + guardedShrinkHandleBox.height / 2,
  );
  await page.mouse.down();
  await page.mouse.move(
    guardedShrinkHandleBox.x + guardedShrinkHandleBox.width / 2 - 600,
    guardedShrinkHandleBox.y + guardedShrinkHandleBox.height / 2,
    { steps: 6 },
  );
  await page.mouse.up();

  await expect
    .poll(() =>
      page
        .locator('[data-stim-grid-panel="conversation"]')
        .evaluate((element) => getComputedStyle(element).gridColumnEnd),
    )
    .not.toBe(initialConversationEnd);
  await expect
    .poll(() =>
      page
        .locator('[data-grid-layout-metric="conversation-span"]')
        .textContent(),
    )
    .toBe("8");
  await expect
    .poll(() =>
      page
        .locator('[data-stim-grid-panel="tools"]')
        .evaluate((element) => getComputedStyle(element).gridColumnStart),
    )
    .toBe(initialToolsStart);

  await page.locator('[data-grid-mode-option="compact"]').click();

  await expect
    .poll(() => page.locator('[data-grid-layout-metric="mode"]').textContent())
    .toBe("compact");
  await expect
    .poll(() => page.locator('[data-grid-layout-metric="grid"]').textContent())
    .not.toBe(initialGrid);
  await expect
    .poll(() =>
      page.locator('[data-grid-layout-metric="visible-panels"]').textContent(),
    )
    .not.toBe(initialVisible);
  await expect
    .poll(() =>
      page.locator('[data-stim-grid-panel="context"][hidden]').count(),
    )
    .toBe(1);

  await page.close();
});
