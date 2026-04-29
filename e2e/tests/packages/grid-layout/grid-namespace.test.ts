import { expect, test } from "vitest";
import { fixturePath } from "../../../lib/paths";
import { setupBrowserSuite, setupViteSuite } from "../../../lib/setup";

const browserSuite = setupBrowserSuite();
const viteSuite = setupViteSuite({
  root: fixturePath("packages", "grid-layout"),
  port: 4273,
});

test("grid namespace applies plans and isolates tracked elements", async () => {
  const page = await browserSuite.browser().newPage();

  await page.goto(viteSuite.url(), { waitUntil: "domcontentloaded" });
  await page.waitForSelector('html[data-ready="true"]');

  await expect
    .poll(() =>
      page.evaluate(() => window.__gridLayoutFixture.getPlanMode("a")),
    )
    .toBe("default");
  await expect
    .poll(() =>
      page.evaluate(() => window.__gridLayoutFixture.getPlanMode("b")),
    )
    .toBe("isolated");

  const initialBTemplate = await page.evaluate(() =>
    window.__gridLayoutFixture.getGridTemplate("#grid-b"),
  );

  await page.evaluate(() => window.__gridLayoutFixture.applyFocus());

  await expect
    .poll(() =>
      page.evaluate(() => window.__gridLayoutFixture.getPlanMode("a")),
    )
    .toBe("focus");
  await expect
    .poll(() =>
      page.evaluate(() => window.__gridLayoutFixture.getPlanMode("b")),
    )
    .toBe("isolated");
  await expect
    .poll(() => page.evaluate(() => window.__gridLayoutFixture.events.length))
    .toBeGreaterThan(0);
  await expect
    .poll(() =>
      page.evaluate(() =>
        window.__gridLayoutFixture.exerciseStaleRegistration(),
      ),
    )
    .toBe(true);

  const focusedContent = await page.evaluate(() =>
    window.__gridLayoutFixture.getPanelPlacement("#content"),
  );
  const hiddenContext = await page.evaluate(() =>
    window.__gridLayoutFixture.getPanelPlacement("#context"),
  );
  const finalBTemplate = await page.evaluate(() =>
    window.__gridLayoutFixture.getGridTemplate("#grid-b"),
  );

  expect(
    await page.evaluate(() =>
      window.__gridLayoutFixture.getNamespace("#grid-a"),
    ),
  ).toBe("fixture-a");
  expect(
    await page.evaluate(() =>
      window.__gridLayoutFixture.getNamespace("#grid-b"),
    ),
  ).toBe("fixture-b");
  expect(focusedContent.columnStart).toBe("2");
  expect(focusedContent.columnEnd).toBe("span 7");
  expect(hiddenContext.hidden).toBe(true);
  expect(hiddenContext.visible).toBe("false");
  expect(finalBTemplate).toBe(initialBTemplate);

  await page.close();
});

test("grid namespace resize handle previews then commits adjacent resize", async () => {
  const page = await browserSuite.browser().newPage();

  await page.goto(viteSuite.url(), { waitUntil: "domcontentloaded" });
  await page.waitForSelector('html[data-ready="true"]');

  const initialContentSpan = await page.evaluate(
    () => window.__gridLayoutFixture.getPanelSpan("content")?.columnSpan,
  );
  const initialContentStart = await page.evaluate(() =>
    window.__gridLayoutFixture.getPanelStart("content"),
  );
  const initialContextSpan = await page.evaluate(
    () => window.__gridLayoutFixture.getPanelSpan("context")?.columnSpan,
  );
  const initialContextStart = await page.evaluate(() =>
    window.__gridLayoutFixture.getPanelStart("context"),
  );
  const initialBTemplate = await page.evaluate(() =>
    window.__gridLayoutFixture.getGridTemplate("#grid-b"),
  );
  const handle = page.locator("#content-resize");
  const handleBox = await handle.boundingBox();

  if (!handleBox) {
    throw new Error("expected content resize handle to be visible");
  }

  await page.mouse.move(
    handleBox.x + handleBox.width / 2,
    handleBox.y + handleBox.height / 2,
  );
  await page.mouse.down();
  await page.mouse.move(
    handleBox.x + handleBox.width / 2 + 360,
    handleBox.y + handleBox.height / 2,
    { steps: 6 },
  );

  const previewDuringResize = await page.evaluate(() =>
    window.__gridLayoutFixture.getPreviewPlacement(),
  );
  const spanDuringResize = await page.evaluate(
    () => window.__gridLayoutFixture.getPanelSpan("content")?.columnSpan,
  );
  const contextSpanDuringResize = await page.evaluate(
    () => window.__gridLayoutFixture.getPanelSpan("context")?.columnSpan,
  );
  const layoutRequestsDuringResize = await page.evaluate(
    () => window.__gridLayoutFixture.layoutRequests.length,
  );

  expect(previewDuringResize.hidden).toBe(false);
  expect(previewDuringResize.panel).toBe("content");
  expect(previewDuringResize.interaction).toBe("resize");
  expect(spanDuringResize).toBe(initialContentSpan);
  expect(contextSpanDuringResize).toBe(initialContextSpan);
  expect(layoutRequestsDuringResize).toBe(0);

  await page.mouse.up();

  const resizedContentSpan = await page.evaluate(
    () => window.__gridLayoutFixture.getPanelSpan("content")?.columnSpan,
  );
  const layoutRequests = await page.evaluate(
    () => window.__gridLayoutFixture.layoutRequests.length,
  );
  const resizedContextSpan = await page.evaluate(
    () => window.__gridLayoutFixture.getPanelSpan("context")?.columnSpan,
  );
  const resizedContextStart = await page.evaluate(() =>
    window.__gridLayoutFixture.getPanelStart("context"),
  );
  const finalBTemplate = await page.evaluate(() =>
    window.__gridLayoutFixture.getGridTemplate("#grid-b"),
  );
  const previewAfterResize = await page.evaluate(() =>
    window.__gridLayoutFixture.getPreviewPlacement(),
  );

  expect(resizedContentSpan).toBeGreaterThan(initialContentSpan ?? 0);
  expect(resizedContextSpan).toBeLessThan(initialContextSpan ?? 0);
  expect(resizedContextSpan).toBe(2);
  expect(resizedContextStart?.columnStart).toBeGreaterThan(
    initialContextStart?.columnStart ?? 0,
  );
  expect((resizedContentSpan ?? 0) + (resizedContextSpan ?? 0)).toBe(
    (initialContentSpan ?? 0) + (initialContextSpan ?? 0),
  );
  expect(resizedContextStart?.columnStart).toBe(
    (initialContentStart?.columnStart ?? 0) + (resizedContentSpan ?? 0),
  );
  expect(layoutRequests).toBeGreaterThan(0);
  expect(finalBTemplate).toBe(initialBTemplate);
  expect(previewAfterResize.hidden).toBe(true);

  await page.close();
});

test("grid namespace resize request does not mutate layout until accepted", async () => {
  const page = await browserSuite.browser().newPage();

  await page.goto(viteSuite.url(), { waitUntil: "domcontentloaded" });
  await page.waitForSelector('html[data-ready="true"]');

  const initialSpan = await page.evaluate(
    () => window.__gridLayoutFixture.getRejectedPanelSpan()?.columnSpan,
  );
  const initialAdjacentSpan = await page.evaluate(
    () => window.__gridLayoutFixture.getRejectedAdjacentPanelSpan()?.columnSpan,
  );
  const initialPlacement = await page.evaluate(() =>
    window.__gridLayoutFixture.getPanelPlacement("#reject-content"),
  );
  const handle = page.locator("#reject-resize");
  const handleBox = await handle.boundingBox();

  if (!handleBox) {
    throw new Error("expected rejected resize handle to be visible");
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

  const rejectedPreviewDuringResize = await page.evaluate(() =>
    window.__gridLayoutFixture.getRejectedPreviewPlacement(),
  );
  const rejectedRequestsDuringResize = await page.evaluate(
    () => window.__gridLayoutFixture.rejectedLayoutRequests.length,
  );

  expect(rejectedPreviewDuringResize.hidden).toBe(false);
  expect(rejectedPreviewDuringResize.panel).toBe("reject-content");
  expect(rejectedPreviewDuringResize.interaction).toBe("resize");
  expect(rejectedRequestsDuringResize).toBe(0);

  await page.mouse.up();

  const finalSpan = await page.evaluate(
    () => window.__gridLayoutFixture.getRejectedPanelSpan()?.columnSpan,
  );
  const finalPlacement = await page.evaluate(() =>
    window.__gridLayoutFixture.getPanelPlacement("#reject-content"),
  );
  const rejectedRequests = await page.evaluate(
    () => window.__gridLayoutFixture.rejectedLayoutRequests.length,
  );
  const rejectedResizePlan = await page.evaluate(() =>
    window.__gridLayoutFixture.rejectedResizePlans.at(-1),
  );
  const rejectedResizeAdjacentPanel = rejectedResizePlan?.panels.find(
    (panel) => panel.id === "reject-adjacent",
  );
  const rejectedPreviewAfterResize = await page.evaluate(() =>
    window.__gridLayoutFixture.getRejectedPreviewPlacement(),
  );

  expect(rejectedRequests).toBeGreaterThan(0);
  expect(
    rejectedResizePlan?.panels.find((panel) => panel.id === "reject-content")
      ?.columnSpan,
  ).toBeGreaterThan(initialSpan ?? 0);
  expect(rejectedResizeAdjacentPanel?.columnSpan).toBe(initialAdjacentSpan);
  expect(finalSpan).toBe(initialSpan);
  expect(finalPlacement.columnEnd).toBe(initialPlacement.columnEnd);
  expect(rejectedPreviewAfterResize.hidden).toBe(true);

  const dragHandle = page.locator("#reject-drag");
  const dragHandleBox = await dragHandle.boundingBox();

  if (!dragHandleBox) {
    throw new Error("expected rejected drag handle to be visible");
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

  const finalDragPlacement = await page.evaluate(() =>
    window.__gridLayoutFixture.getPanelPlacement("#reject-content"),
  );
  const finalRejectedRequests = await page.evaluate(
    () => window.__gridLayoutFixture.rejectedLayoutRequests.length,
  );

  expect(finalRejectedRequests).toBeGreaterThan(rejectedRequests);
  expect(finalDragPlacement.columnStart).toBe(initialPlacement.columnStart);

  await page.close();
});

test("grid namespace guarded resize stops before visible panel collisions", async () => {
  const page = await browserSuite.browser().newPage();

  await page.goto(viteSuite.url(), { waitUntil: "domcontentloaded" });
  await page.waitForSelector('html[data-ready="true"]');

  const initialSpan = await page.evaluate(
    () => window.__gridLayoutFixture.getRejectedPanelSpan()?.columnSpan,
  );
  const initialPlacement = await page.evaluate(() =>
    window.__gridLayoutFixture.getPanelPlacement("#reject-content"),
  );
  const initialResizePlans = await page.evaluate(
    () => window.__gridLayoutFixture.rejectedResizePlans.length,
  );
  const handle = page.locator("#reject-guarded-resize");
  const handleBox = await handle.boundingBox();

  if (!handleBox) {
    throw new Error("expected guarded resize handle to be visible");
  }

  await page.mouse.move(
    handleBox.x + handleBox.width / 2,
    handleBox.y + handleBox.height / 2,
  );
  await page.mouse.down();
  await page.mouse.move(
    handleBox.x + handleBox.width / 2 + 260,
    handleBox.y + handleBox.height / 2,
    { steps: 6 },
  );

  const previewDuringResize = await page.evaluate(() =>
    window.__gridLayoutFixture.getRejectedPreviewPlacement(),
  );

  expect(previewDuringResize.hidden).toBe(false);
  expect(previewDuringResize.panel).toBe("reject-content");
  expect(previewDuringResize.interaction).toBe("resize");

  await page.mouse.up();

  const guardedPlan = await page.evaluate(() =>
    window.__gridLayoutFixture.rejectedResizePlans.at(-1),
  );
  const guardedContent = guardedPlan?.panels.find(
    (panel) => panel.id === "reject-content",
  );
  const guardedAdjacent = guardedPlan?.panels.find(
    (panel) => panel.id === "reject-adjacent",
  );
  const finalPlacement = await page.evaluate(() =>
    window.__gridLayoutFixture.getPanelPlacement("#reject-content"),
  );

  expect(
    await page.evaluate(
      () => window.__gridLayoutFixture.rejectedResizePlans.length,
    ),
  ).toBeGreaterThan(initialResizePlans);
  expect(guardedContent?.columnSpan).toBe(4);
  expect(guardedContent?.columnSpan).toBeGreaterThan(initialSpan ?? 0);
  expect(guardedAdjacent?.columnStart).toBe(5);
  expect(finalPlacement.columnEnd).toBe(initialPlacement.columnEnd);

  await page.close();
});

test("grid namespace guarded drag stops before visible panel collisions", async () => {
  const page = await browserSuite.browser().newPage();

  await page.goto(viteSuite.url(), { waitUntil: "domcontentloaded" });
  await page.waitForSelector('html[data-ready="true"]');

  const initialPlacement = await page.evaluate(() =>
    window.__gridLayoutFixture.getPanelPlacement("#reject-content"),
  );
  const initialDragPlans = await page.evaluate(
    () => window.__gridLayoutFixture.rejectedDragPlans.length,
  );
  const dragHandle = page.locator("#reject-guarded-drag");
  const dragHandleBox = await dragHandle.boundingBox();

  if (!dragHandleBox) {
    throw new Error("expected guarded drag handle to be visible");
  }

  await page.mouse.move(
    dragHandleBox.x + dragHandleBox.width / 2,
    dragHandleBox.y + dragHandleBox.height / 2,
  );
  await page.mouse.down();
  await page.mouse.move(
    dragHandleBox.x + dragHandleBox.width / 2 + 260,
    dragHandleBox.y + dragHandleBox.height / 2,
    { steps: 6 },
  );

  const previewDuringDrag = await page.evaluate(() =>
    window.__gridLayoutFixture.getRejectedPreviewPlacement(),
  );

  expect(previewDuringDrag.hidden).toBe(false);
  expect(previewDuringDrag.panel).toBe("reject-content");
  expect(previewDuringDrag.interaction).toBe("drag");

  await page.mouse.up();

  const finalPlacement = await page.evaluate(() =>
    window.__gridLayoutFixture.getPanelPlacement("#reject-content"),
  );
  const guardedPlan = await page.evaluate(() =>
    window.__gridLayoutFixture.rejectedDragPlans.at(-1),
  );
  const guardedContent = guardedPlan?.panels.find(
    (panel) => panel.id === "reject-content",
  );
  const guardedAdjacent = guardedPlan?.panels.find(
    (panel) => panel.id === "reject-adjacent",
  );

  expect(
    await page.evaluate(
      () => window.__gridLayoutFixture.rejectedDragPlans.length,
    ),
  ).toBeGreaterThan(initialDragPlans);
  expect(guardedContent?.columnStart).toBe(3);
  expect(guardedContent?.columnSpan).toBe(2);
  expect(guardedAdjacent?.columnStart).toBe(5);
  expect(finalPlacement.columnStart).toBe(initialPlacement.columnStart);

  await page.close();
});

test("grid namespace drag handle updates panel placement", async () => {
  const page = await browserSuite.browser().newPage();

  await page.goto(viteSuite.url(), { waitUntil: "domcontentloaded" });
  await page.waitForSelector('html[data-ready="true"]');

  const initialStart = await page.evaluate(() =>
    window.__gridLayoutFixture.getPanelStart("context"),
  );
  const handle = page.locator("#context-drag");
  const handleBox = await handle.boundingBox();

  if (!handleBox) {
    throw new Error("expected context drag handle to be visible");
  }

  await page.mouse.move(
    handleBox.x + handleBox.width / 2,
    handleBox.y + handleBox.height / 2,
  );
  await page.mouse.down();
  await page.mouse.move(
    handleBox.x + handleBox.width / 2 - 120,
    handleBox.y + handleBox.height / 2,
    { steps: 6 },
  );

  const previewDuringDrag = await page.evaluate(() =>
    window.__gridLayoutFixture.getPreviewPlacement(),
  );
  const startDuringDrag = await page.evaluate(() =>
    window.__gridLayoutFixture.getPanelStart("context"),
  );
  const dragRequestsDuringDrag = await page.evaluate(
    () => window.__gridLayoutFixture.dragRequests.length,
  );

  expect(previewDuringDrag.hidden).toBe(false);
  expect(previewDuringDrag.panel).toBe("context");
  expect(previewDuringDrag.interaction).toBe("drag");
  expect(startDuringDrag?.columnStart).toBe(initialStart?.columnStart);
  expect(dragRequestsDuringDrag).toBe(0);

  await page.mouse.up();

  const finalStart = await page.evaluate(() =>
    window.__gridLayoutFixture.getPanelStart("context"),
  );
  const dragRequests = await page.evaluate(
    () => window.__gridLayoutFixture.dragRequests.length,
  );

  expect(dragRequests).toBeGreaterThan(0);
  expect(finalStart?.columnStart).toBeLessThan(initialStart?.columnStart ?? 0);
  expect(finalStart?.rowStart).toBe(initialStart?.rowStart);

  await page.close();
});
