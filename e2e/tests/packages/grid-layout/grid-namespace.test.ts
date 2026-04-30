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
  expect(
    await page.evaluate(() =>
      window.__gridLayoutFixture.getDefaultDragStrategy(),
    ),
  ).toBe("free");
  expect(
    await page.evaluate(() =>
      window.__gridLayoutFixture.getDragHandleLifecycleKinds(),
    ),
  ).toEqual(["dragHandle", "dragHandle"]);
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

test("grid namespace push drag moves blocking panels in the proposal", async () => {
  const page = await browserSuite.browser().newPage();

  await page.goto(viteSuite.url(), { waitUntil: "domcontentloaded" });
  await page.waitForSelector('html[data-ready="true"]');

  const initialPlacement = await page.evaluate(() =>
    window.__gridLayoutFixture.getPanelPlacement("#reject-content"),
  );
  const initialAdjacentPlacement = await page.evaluate(() =>
    window.__gridLayoutFixture.getPanelPlacement("#reject-adjacent"),
  );
  const initialDragPlans = await page.evaluate(
    () => window.__gridLayoutFixture.rejectedDragPlans.length,
  );
  const dragHandle = page.locator("#reject-drag");
  const dragHandleBox = await dragHandle.boundingBox();

  if (!dragHandleBox) {
    throw new Error("expected push drag handle to be visible");
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
  const contentDuringDrag = await page.evaluate(() =>
    window.__gridLayoutFixture.getPanelPlacement("#reject-content"),
  );
  const contentSnapshotDuringDrag = await page.evaluate(() =>
    window.__gridLayoutFixture.getPanelSnapshot("#reject-content"),
  );
  const adjacentDuringDrag = await page.evaluate(() =>
    window.__gridLayoutFixture.getPanelPlacement("#reject-adjacent"),
  );

  expect(previewDuringDrag.hidden).toBe(false);
  expect(previewDuringDrag.panel).toBe("reject-content");
  expect(previewDuringDrag.interaction).toBe("drag");
  expect(contentDuringDrag.columnStart).toBe(initialPlacement.columnStart);
  expect(contentSnapshotDuringDrag.active).toBe("true");
  expect(contentSnapshotDuringDrag.x).toBeGreaterThan(0);
  expect(adjacentDuringDrag.columnStart).toBe("8");

  await page.mouse.up();

  const pushPlan = await page.evaluate(() =>
    window.__gridLayoutFixture.rejectedDragPlans.at(-1),
  );
  const pushedContent = pushPlan?.panels.find(
    (panel) => panel.id === "reject-content",
  );
  const pushedAdjacent = pushPlan?.panels.find(
    (panel) => panel.id === "reject-adjacent",
  );
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          window.__gridLayoutFixture.getPanelPlacement("#reject-content")
            .columnStart,
      ),
    )
    .toBe(initialPlacement.columnStart);
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          window.__gridLayoutFixture.getPanelPlacement("#reject-adjacent")
            .columnStart,
      ),
    )
    .toBe(initialAdjacentPlacement.columnStart);

  expect(
    await page.evaluate(
      () => window.__gridLayoutFixture.rejectedDragPlans.length,
    ),
  ).toBeGreaterThan(initialDragPlans);
  expect(pushedContent?.columnStart).toBe(6);
  expect(pushedContent?.columnSpan).toBe(2);
  expect(pushedAdjacent?.columnStart).toBe(8);
  expect(pushedAdjacent?.columnSpan).toBe(4);

  await page.close();
});

test("grid namespace push drag stays at the last resolved placement when overdragged", async () => {
  const page = await browserSuite.browser().newPage();

  await page.goto(viteSuite.url(), { waitUntil: "domcontentloaded" });
  await page.waitForSelector('html[data-ready="true"]');

  const initialPlacement = await page.evaluate(() =>
    window.__gridLayoutFixture.getPanelPlacement("#reject-content"),
  );
  const initialAdjacentPlacement = await page.evaluate(() =>
    window.__gridLayoutFixture.getPanelPlacement("#reject-adjacent"),
  );
  const initialDragPlans = await page.evaluate(
    () => window.__gridLayoutFixture.rejectedDragPlans.length,
  );
  const dragHandle = page.locator("#reject-drag");
  const dragHandleBox = await dragHandle.boundingBox();

  if (!dragHandleBox) {
    throw new Error("expected push drag handle to be visible");
  }

  await page.mouse.move(
    dragHandleBox.x + dragHandleBox.width / 2,
    dragHandleBox.y + dragHandleBox.height / 2,
  );
  await page.mouse.down();
  await page.mouse.move(
    dragHandleBox.x + dragHandleBox.width / 2 + 520,
    dragHandleBox.y + dragHandleBox.height / 2,
    { steps: 8 },
  );

  const previewDuringDrag = await page.evaluate(() =>
    window.__gridLayoutFixture.getRejectedPreviewPlacement(),
  );
  const contentDuringDrag = await page.evaluate(() =>
    window.__gridLayoutFixture.getPanelPlacement("#reject-content"),
  );
  const contentSnapshotDuringDrag = await page.evaluate(() =>
    window.__gridLayoutFixture.getPanelSnapshot("#reject-content"),
  );
  const adjacentDuringDrag = await page.evaluate(() =>
    window.__gridLayoutFixture.getPanelPlacement("#reject-adjacent"),
  );

  expect(previewDuringDrag.hidden).toBe(false);
  expect(previewDuringDrag.panel).toBe("reject-content");
  expect(previewDuringDrag.interaction).toBe("drag");
  expect(contentDuringDrag.columnStart).toBe(initialPlacement.columnStart);
  expect(contentSnapshotDuringDrag.active).toBe("true");
  expect(contentSnapshotDuringDrag.x).toBeGreaterThan(0);
  expect(adjacentDuringDrag.columnStart).toBe("9");

  await page.mouse.up();

  const pushPlan = await page.evaluate(() =>
    window.__gridLayoutFixture.rejectedDragPlans.at(-1),
  );
  const pushedContent = pushPlan?.panels.find(
    (panel) => panel.id === "reject-content",
  );
  const pushedAdjacent = pushPlan?.panels.find(
    (panel) => panel.id === "reject-adjacent",
  );

  expect(
    await page.evaluate(
      () => window.__gridLayoutFixture.rejectedDragPlans.length,
    ),
  ).toBeGreaterThan(initialDragPlans);
  expect(pushedContent?.columnStart).toBe(7);
  expect(pushedAdjacent?.columnStart).toBe(9);
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          window.__gridLayoutFixture.getPanelPlacement("#reject-content")
            .columnStart,
      ),
    )
    .toBe(initialPlacement.columnStart);
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          window.__gridLayoutFixture.getPanelPlacement("#reject-adjacent")
            .columnStart,
      ),
    )
    .toBe(initialAdjacentPlacement.columnStart);

  await page.close();
});

test("grid namespace push drag advances through blockers without skipping them", async () => {
  const page = await browserSuite.browser().newPage();

  await page.goto(viteSuite.url(), { waitUntil: "domcontentloaded" });
  await page.waitForSelector('html[data-ready="true"]');

  const initialActivePlacement = await page.evaluate(() =>
    window.__gridLayoutFixture.getPanelPlacement("#push-skip-active"),
  );
  const initialBlockerPlacement = await page.evaluate(() =>
    window.__gridLayoutFixture.getPanelPlacement("#push-skip-blocker"),
  );
  const initialDragPlans = await page.evaluate(
    () => window.__gridLayoutFixture.pushSkipDragPlans.length,
  );
  const dragHandle = page.locator("#push-skip-drag");
  await dragHandle.scrollIntoViewIfNeeded();
  const dragHandleBox = await dragHandle.boundingBox();

  if (!dragHandleBox) {
    throw new Error("expected push skip drag handle to be visible");
  }

  await page.mouse.move(
    dragHandleBox.x + dragHandleBox.width / 2,
    dragHandleBox.y + dragHandleBox.height / 2,
  );
  await page.mouse.down();
  await page.mouse.move(
    dragHandleBox.x + dragHandleBox.width / 2 + 520,
    dragHandleBox.y + dragHandleBox.height / 2,
    { steps: 8 },
  );

  const activeDuringDrag = await page.evaluate(() =>
    window.__gridLayoutFixture.getPanelPlacement("#push-skip-active"),
  );
  const activeSnapshotDuringDrag = await page.evaluate(() =>
    window.__gridLayoutFixture.getPanelSnapshot("#push-skip-active"),
  );
  const blockerDuringDrag = await page.evaluate(() =>
    window.__gridLayoutFixture.getPanelPlacement("#push-skip-blocker"),
  );

  expect(activeDuringDrag.columnStart).toBe(initialActivePlacement.columnStart);
  expect(activeSnapshotDuringDrag.active).toBe("true");
  expect(activeSnapshotDuringDrag.x).toBeGreaterThan(0);
  expect(blockerDuringDrag.columnStart).toBe("4");

  await page.mouse.up();

  const pushPlan = await page.evaluate(() =>
    window.__gridLayoutFixture.pushSkipDragPlans.at(-1),
  );
  const pushedActive = pushPlan?.panels.find(
    (panel) => panel.id === "push-skip-active",
  );
  const pushedBlocker = pushPlan?.panels.find(
    (panel) => panel.id === "push-skip-blocker",
  );

  expect(
    await page.evaluate(
      () => window.__gridLayoutFixture.pushSkipDragPlans.length,
    ),
  ).toBeGreaterThan(initialDragPlans);
  expect(pushedActive?.columnStart).toBe(3);
  expect(pushedBlocker?.columnStart).toBe(4);
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          window.__gridLayoutFixture.getPanelPlacement("#push-skip-active")
            .columnStart,
      ),
    )
    .toBe(initialActivePlacement.columnStart);
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          window.__gridLayoutFixture.getPanelPlacement("#push-skip-blocker")
            .columnStart,
      ),
    )
    .toBe(initialBlockerPlacement.columnStart);

  await page.close();
});

test("grid namespace push drag supports vertical blocking panels", async () => {
  const page = await browserSuite.browser().newPage();

  await page.goto(viteSuite.url(), { waitUntil: "domcontentloaded" });
  await page.waitForSelector('html[data-ready="true"]');

  const initialDragPlans = await page.evaluate(
    () => window.__gridLayoutFixture.pushDragPlans.length,
  );
  const initialActivePlacement = await page.evaluate(() =>
    window.__gridLayoutFixture.getPanelPlacement("#push-vertical-active"),
  );
  const initialBlockerPlacement = await page.evaluate(() =>
    window.__gridLayoutFixture.getPanelPlacement("#push-vertical-blocker"),
  );
  const dragHandle = page.locator("#push-vertical-drag");
  await dragHandle.scrollIntoViewIfNeeded();
  const dragHandleBox = await dragHandle.boundingBox();

  if (!dragHandleBox) {
    throw new Error("expected vertical push drag handle to be visible");
  }

  await page.mouse.move(
    dragHandleBox.x + dragHandleBox.width / 2,
    dragHandleBox.y + dragHandleBox.height / 2,
  );
  await page.mouse.down();
  await page.mouse.move(
    dragHandleBox.x + dragHandleBox.width / 2,
    dragHandleBox.y + dragHandleBox.height / 2 + 100,
    { steps: 6 },
  );

  const previewDuringDrag = await page.evaluate(() =>
    window.__gridLayoutFixture.getPushPreviewPlacement(),
  );
  const activeDuringDrag = await page.evaluate(() =>
    window.__gridLayoutFixture.getPanelPlacement("#push-vertical-active"),
  );
  const activeSnapshotDuringDrag = await page.evaluate(() =>
    window.__gridLayoutFixture.getPanelSnapshot("#push-vertical-active"),
  );
  const blockerDuringDrag = await page.evaluate(() =>
    window.__gridLayoutFixture.getPanelPlacement("#push-vertical-blocker"),
  );

  expect(previewDuringDrag.hidden).toBe(false);
  expect(previewDuringDrag.panel).toBe("push-vertical-active");
  expect(previewDuringDrag.interaction).toBe("drag");
  expect(activeDuringDrag.rowStart).toBe(initialActivePlacement.rowStart);
  expect(activeSnapshotDuringDrag.active).toBe("true");
  expect(activeSnapshotDuringDrag.y).toBeGreaterThan(0);
  expect(blockerDuringDrag.rowStart).toBe("5");

  await page.mouse.up();

  const pushPlan = await page.evaluate(() =>
    window.__gridLayoutFixture.pushDragPlans.at(-1),
  );
  const pushedActive = pushPlan?.panels.find(
    (panel) => panel.id === "push-vertical-active",
  );
  const pushedBlocker = pushPlan?.panels.find(
    (panel) => panel.id === "push-vertical-blocker",
  );

  expect(
    await page.evaluate(() => window.__gridLayoutFixture.pushDragPlans.length),
  ).toBeGreaterThan(initialDragPlans);
  expect(pushedActive?.rowStart).toBe(3);
  expect(pushedActive?.rowSpan).toBe(2);
  expect(pushedBlocker?.rowStart).toBe(5);
  expect(pushedBlocker?.rowSpan).toBe(2);
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          window.__gridLayoutFixture.getPanelPlacement("#push-vertical-active")
            .rowStart,
      ),
    )
    .toBe(initialActivePlacement.rowStart);
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          window.__gridLayoutFixture.getPanelPlacement("#push-vertical-blocker")
            .rowStart,
      ),
    )
    .toBe(initialBlockerPlacement.rowStart);

  await page.close();
});

test("grid namespace accepted push drag keeps pushed panels after commit", async () => {
  const page = await browserSuite.browser().newPage();

  await page.goto(viteSuite.url(), { waitUntil: "domcontentloaded" });
  await page.waitForSelector('html[data-ready="true"]');
  await page.evaluate(() =>
    window.__gridLayoutFixture.setAcceptPushRequests(true),
  );

  const dragHandle = page.locator("#push-vertical-drag");
  await dragHandle.scrollIntoViewIfNeeded();
  const dragHandleBox = await dragHandle.boundingBox();

  if (!dragHandleBox) {
    throw new Error("expected accepted push drag handle to be visible");
  }

  await page.mouse.move(
    dragHandleBox.x + dragHandleBox.width / 2,
    dragHandleBox.y + dragHandleBox.height / 2,
  );
  await page.mouse.down();
  await page.mouse.move(
    dragHandleBox.x + dragHandleBox.width / 2,
    dragHandleBox.y + dragHandleBox.height / 2 + 100,
    { steps: 6 },
  );
  await page.mouse.up();

  await expect
    .poll(() =>
      page.evaluate(
        () =>
          window.__gridLayoutFixture.getPanelPlacement("#push-vertical-active")
            .rowStart,
      ),
    )
    .toBe("3");
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          window.__gridLayoutFixture.getPanelPlacement("#push-vertical-blocker")
            .rowStart,
      ),
    )
    .toBe("5");

  await page.close();
});

test("grid namespace push drag does not grow the grid when blocked", async () => {
  const page = await browserSuite.browser().newPage();

  await page.goto(viteSuite.url(), { waitUntil: "domcontentloaded" });
  await page.waitForSelector('html[data-ready="true"]');

  const initialDragPlans = await page.evaluate(
    () => window.__gridLayoutFixture.pushDragPlans.length,
  );
  const dragHandle = page.locator("#push-blocked-drag");
  await dragHandle.scrollIntoViewIfNeeded();
  const dragHandleBox = await dragHandle.boundingBox();

  if (!dragHandleBox) {
    throw new Error("expected blocked push drag handle to be visible");
  }

  await page.mouse.move(
    dragHandleBox.x + dragHandleBox.width / 2,
    dragHandleBox.y + dragHandleBox.height / 2,
  );
  await page.mouse.down();
  await page.mouse.move(
    dragHandleBox.x + dragHandleBox.width / 2 + 100,
    dragHandleBox.y + dragHandleBox.height / 2,
    { steps: 6 },
  );

  const previewDuringDrag = await page.evaluate(() =>
    window.__gridLayoutFixture.getPushPreviewPlacement(),
  );

  expect(previewDuringDrag.hidden).toBe(true);

  await page.mouse.up();

  expect(
    await page.evaluate(() => window.__gridLayoutFixture.pushDragPlans.length),
  ).toBe(initialDragPlans);

  await page.close();
});

test("grid namespace reflow drag moves blockers and compacts vacated panels", async () => {
  const page = await browserSuite.browser().newPage();

  await page.goto(viteSuite.url(), { waitUntil: "domcontentloaded" });
  await page.waitForSelector('html[data-ready="true"]');

  const initialActivePlacement = await page.evaluate(() =>
    window.__gridLayoutFixture.getPanelPlacement("#reflow-active"),
  );
  const initialBlockerPlacement = await page.evaluate(() =>
    window.__gridLayoutFixture.getPanelPlacement("#reflow-blocker"),
  );
  const initialLowerPlacement = await page.evaluate(() =>
    window.__gridLayoutFixture.getPanelPlacement("#reflow-lower"),
  );
  const initialDragPlans = await page.evaluate(
    () => window.__gridLayoutFixture.reflowDragPlans.length,
  );
  await page.evaluate(() =>
    document.querySelector("#grid-reflow")?.scrollIntoView({ block: "center" }),
  );
  const dragHandle = page.locator("#reflow-drag");
  await dragHandle.scrollIntoViewIfNeeded();
  const dragHandleBox = await dragHandle.boundingBox();

  if (!dragHandleBox) {
    throw new Error("expected reflow drag handle to be visible");
  }

  await page.mouse.move(
    dragHandleBox.x + dragHandleBox.width / 2,
    dragHandleBox.y + dragHandleBox.height / 2,
  );
  await page.mouse.down();
  await page.mouse.move(
    dragHandleBox.x + dragHandleBox.width / 2 + 320,
    dragHandleBox.y + dragHandleBox.height / 2,
    { steps: 8 },
  );

  const activeDuringDrag = await page.evaluate(() =>
    window.__gridLayoutFixture.getPanelPlacement("#reflow-active"),
  );
  const activeSnapshotDuringDrag = await page.evaluate(() =>
    window.__gridLayoutFixture.getPanelSnapshot("#reflow-active"),
  );
  const blockerDuringDrag = await page.evaluate(() =>
    window.__gridLayoutFixture.getPanelPlacement("#reflow-blocker"),
  );
  const lowerDuringDrag = await page.evaluate(() =>
    window.__gridLayoutFixture.getPanelPlacement("#reflow-lower"),
  );

  expect(activeDuringDrag.columnStart).toBe(initialActivePlacement.columnStart);
  expect(activeDuringDrag.rowStart).toBe("1");
  expect(activeSnapshotDuringDrag.active).toBe("true");
  expect(activeSnapshotDuringDrag.x).toBeGreaterThan(0);
  expect(blockerDuringDrag.columnStart).toBe("3");
  expect(blockerDuringDrag.rowStart).toBe("3");
  expect(lowerDuringDrag.columnStart).toBe("1");
  expect(lowerDuringDrag.rowStart).toBe("1");

  await page.mouse.up();

  const reflowPlan = await page.evaluate(() =>
    window.__gridLayoutFixture.reflowDragPlans.at(-1),
  );
  const reflowActive = reflowPlan?.panels.find(
    (panel) => panel.id === "reflow-active",
  );
  const reflowBlocker = reflowPlan?.panels.find(
    (panel) => panel.id === "reflow-blocker",
  );
  const reflowLower = reflowPlan?.panels.find(
    (panel) => panel.id === "reflow-lower",
  );

  expect(
    await page.evaluate(
      () => window.__gridLayoutFixture.reflowDragPlans.length,
    ),
  ).toBeGreaterThan(initialDragPlans);
  expect(reflowActive?.columnStart).toBe(3);
  expect(reflowActive?.rowStart).toBe(1);
  expect(reflowBlocker?.columnStart).toBe(3);
  expect(reflowBlocker?.rowStart).toBe(3);
  expect(reflowLower?.columnStart).toBe(1);
  expect(reflowLower?.rowStart).toBe(1);
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          window.__gridLayoutFixture.getPanelPlacement("#reflow-active")
            .columnStart,
      ),
    )
    .toBe(initialActivePlacement.columnStart);
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          window.__gridLayoutFixture.getPanelPlacement("#reflow-blocker")
            .rowStart,
      ),
    )
    .toBe(initialBlockerPlacement.rowStart);
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          window.__gridLayoutFixture.getPanelPlacement("#reflow-lower")
            .rowStart,
      ),
    )
    .toBe(initialLowerPlacement.rowStart);

  await page.close();
});

test("grid namespace reflow drag stops at the last no-deformation placement", async () => {
  const page = await browserSuite.browser().newPage();

  await page.goto(viteSuite.url(), { waitUntil: "domcontentloaded" });
  await page.waitForSelector('html[data-ready="true"]');

  const initialActivePlacement = await page.evaluate(() =>
    window.__gridLayoutFixture.getPanelPlacement("#reflow-active"),
  );
  const initialDragPlans = await page.evaluate(
    () => window.__gridLayoutFixture.reflowDragPlans.length,
  );
  await page.evaluate(() =>
    document.querySelector("#grid-reflow")?.scrollIntoView({ block: "center" }),
  );
  const dragHandle = page.locator("#reflow-drag");
  await dragHandle.scrollIntoViewIfNeeded();
  const dragHandleBox = await dragHandle.boundingBox();

  if (!dragHandleBox) {
    throw new Error("expected bounded reflow drag handle to be visible");
  }

  await page.mouse.move(
    dragHandleBox.x + dragHandleBox.width / 2,
    dragHandleBox.y + dragHandleBox.height / 2,
  );
  await page.mouse.down();
  await page.mouse.move(
    dragHandleBox.x + dragHandleBox.width / 2,
    dragHandleBox.y + dragHandleBox.height / 2 + 250,
    { steps: 8 },
  );

  const activeDuringDrag = await page.evaluate(() =>
    window.__gridLayoutFixture.getPanelPlacement("#reflow-active"),
  );
  const activeSnapshotDuringDrag = await page.evaluate(() =>
    window.__gridLayoutFixture.getPanelSnapshot("#reflow-active"),
  );

  expect(activeDuringDrag.rowStart).toBe(initialActivePlacement.rowStart);
  expect(activeSnapshotDuringDrag.active).toBe("true");
  expect(activeSnapshotDuringDrag.y).toBeGreaterThan(0);

  await page.mouse.up();

  const reflowPlan = await page.evaluate(() =>
    window.__gridLayoutFixture.reflowDragPlans.at(-1),
  );
  const reflowActive = reflowPlan?.panels.find(
    (panel) => panel.id === "reflow-active",
  );

  expect(
    await page.evaluate(
      () => window.__gridLayoutFixture.reflowDragPlans.length,
    ),
  ).toBeGreaterThan(initialDragPlans);
  expect(reflowActive?.rowStart).toBe(2);
  expect(reflowPlan?.rows).toBe(5);
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          window.__gridLayoutFixture.getPanelPlacement("#reflow-active")
            .rowStart,
      ),
    )
    .toBe(initialActivePlacement.rowStart);

  await page.close();
});

test("grid namespace reflow drag does not push blockers beyond fixed rows", async () => {
  const page = await browserSuite.browser().newPage();

  await page.goto(viteSuite.url(), { waitUntil: "domcontentloaded" });
  await page.waitForSelector('html[data-ready="true"]');

  const initialActivePlacement = await page.evaluate(() =>
    window.__gridLayoutFixture.getPanelPlacement("#reflow-fixed-active"),
  );
  const initialBlockerPlacement = await page.evaluate(() =>
    window.__gridLayoutFixture.getPanelPlacement("#reflow-fixed-blocker"),
  );
  const initialDragPlans = await page.evaluate(
    () => window.__gridLayoutFixture.reflowFixedDragPlans.length,
  );
  await page.evaluate(() =>
    document
      .querySelector("#grid-reflow-fixed")
      ?.scrollIntoView({ block: "center" }),
  );
  const dragHandle = page.locator("#reflow-fixed-drag");
  await dragHandle.scrollIntoViewIfNeeded();
  const dragHandleBox = await dragHandle.boundingBox();

  if (!dragHandleBox) {
    throw new Error("expected fixed-row reflow drag handle to be visible");
  }

  await page.mouse.move(
    dragHandleBox.x + dragHandleBox.width / 2,
    dragHandleBox.y + dragHandleBox.height / 2,
  );
  await page.mouse.down();
  await page.mouse.move(
    dragHandleBox.x + dragHandleBox.width / 2,
    dragHandleBox.y + dragHandleBox.height / 2 + 200,
    { steps: 8 },
  );

  const activeDuringDrag = await page.evaluate(() =>
    window.__gridLayoutFixture.getPanelPlacement("#reflow-fixed-active"),
  );
  const activeSnapshotDuringDrag = await page.evaluate(() =>
    window.__gridLayoutFixture.getPanelSnapshot("#reflow-fixed-active"),
  );
  const blockerDuringDrag = await page.evaluate(() =>
    window.__gridLayoutFixture.getPanelPlacement("#reflow-fixed-blocker"),
  );

  expect(activeDuringDrag.rowStart).toBe(initialActivePlacement.rowStart);
  expect(activeSnapshotDuringDrag.active).toBe("true");
  expect(activeSnapshotDuringDrag.y).toBeGreaterThan(0);
  expect(blockerDuringDrag.rowStart).toBe(initialBlockerPlacement.rowStart);

  await page.mouse.up();

  expect(
    await page.evaluate(
      () => window.__gridLayoutFixture.reflowFixedDragPlans.length,
    ),
  ).toBe(initialDragPlans);

  await page.close();
});

test("grid namespace clears drag snapshot when active panel unregisters mid-drag", async () => {
  const page = await browserSuite.browser().newPage();

  await page.goto(viteSuite.url(), { waitUntil: "domcontentloaded" });
  await page.waitForSelector('html[data-ready="true"]');

  const initialDragPlans = await page.evaluate(
    () => window.__gridLayoutFixture.reflowDragPlans.length,
  );
  await page.evaluate(() =>
    document.querySelector("#grid-reflow")?.scrollIntoView({ block: "center" }),
  );
  const dragHandle = page.locator("#reflow-drag");
  await dragHandle.scrollIntoViewIfNeeded();
  const dragHandleBox = await dragHandle.boundingBox();

  if (!dragHandleBox) {
    throw new Error("expected unregister reflow drag handle to be visible");
  }

  await page.mouse.move(
    dragHandleBox.x + dragHandleBox.width / 2,
    dragHandleBox.y + dragHandleBox.height / 2,
  );
  await page.mouse.down();
  await page.mouse.move(
    dragHandleBox.x + dragHandleBox.width / 2 + 160,
    dragHandleBox.y + dragHandleBox.height / 2,
    { steps: 4 },
  );

  const snapshotDuringDrag = await page.evaluate(() =>
    window.__gridLayoutFixture.getPanelSnapshot("#reflow-active"),
  );

  expect(snapshotDuringDrag.active).toBe("true");
  expect(snapshotDuringDrag.x).toBeGreaterThan(0);

  await page.evaluate(() =>
    window.__gridLayoutFixture.unregisterReflowActive(),
  );

  const snapshotAfterUnregister = await page.evaluate(() =>
    window.__gridLayoutFixture.getPanelSnapshot("#reflow-active"),
  );

  expect(snapshotAfterUnregister.active).toBeUndefined();
  expect(snapshotAfterUnregister.x).toBe(0);

  await page.mouse.up();

  expect(
    await page.evaluate(
      () => window.__gridLayoutFixture.reflowDragPlans.length,
    ),
  ).toBe(initialDragPlans);

  await page.close();
});

test("grid namespace drag trigger can live outside the target panel", async () => {
  const page = await browserSuite.browser().newPage();

  await page.goto(viteSuite.url(), { waitUntil: "domcontentloaded" });
  await page.waitForSelector('html[data-ready="true"]');

  const initialDragPlans = await page.evaluate(
    () => window.__gridLayoutFixture.triggerDragPlans.length,
  );
  const initialPlacement = await page.evaluate(() =>
    window.__gridLayoutFixture.getPanelPlacement("#trigger-panel"),
  );
  const trigger = page.locator("#external-drag-trigger");
  await trigger.scrollIntoViewIfNeeded();
  const triggerBox = await trigger.boundingBox();

  if (!triggerBox) {
    throw new Error("expected external drag trigger to be visible");
  }

  expect(
    await page.evaluate(() =>
      window.__gridLayoutFixture.getExternalDragTriggerCount(),
    ),
  ).toBe(1);
  expect(
    await page.evaluate(() =>
      window.__gridLayoutFixture.getExternalDragHandleCount(),
    ),
  ).toBe(0);

  const registeredDataset = await page.evaluate(() =>
    window.__gridLayoutFixture.getDragTriggerDataset("#external-drag-trigger"),
  );

  expect(registeredDataset.trigger).toBe("external-drag-trigger");
  expect(registeredDataset.handle).toBe("external-drag-trigger");
  expect(registeredDataset.panel).toBe("trigger-panel");
  expect(registeredDataset.strategy).toBe("free");

  await page.mouse.move(
    triggerBox.x + triggerBox.width / 2,
    triggerBox.y + triggerBox.height / 2,
  );
  await page.mouse.down();
  await page.mouse.move(
    triggerBox.x + triggerBox.width / 2 + 180,
    triggerBox.y + triggerBox.height / 2,
    { steps: 6 },
  );

  const draggingDataset = await page.evaluate(() =>
    window.__gridLayoutFixture.getDragTriggerDataset("#external-drag-trigger"),
  );

  expect(draggingDataset.dragging).toBe("true");

  await page.mouse.up();

  const triggerRequest = await page.evaluate(() =>
    window.__gridLayoutFixture.triggerDragRequests.at(-1),
  );

  expect(triggerRequest?.dragTriggerId).toBe("external-drag-trigger");
  expect(triggerRequest?.dragHandleId).toBe("external-drag-trigger");
  expect(triggerRequest?.panelId).toBe("trigger-panel");
  expect(
    await page.evaluate(
      () => window.__gridLayoutFixture.triggerDragPlans.length,
    ),
  ).toBeGreaterThan(initialDragPlans);
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          window.__gridLayoutFixture.getPanelPlacement("#trigger-panel")
            .columnStart,
      ),
    )
    .toBe("2");

  await page.evaluate(() =>
    window.__gridLayoutFixture.unregisterExternalDragTrigger(),
  );

  const unregisteredDataset = await page.evaluate(() =>
    window.__gridLayoutFixture.getDragTriggerDataset("#external-drag-trigger"),
  );
  const dragPlansAfterUnregister = await page.evaluate(
    () => window.__gridLayoutFixture.triggerDragPlans.length,
  );
  const unregisteredTriggerBox = await trigger.boundingBox();

  if (!unregisteredTriggerBox) {
    throw new Error(
      "expected unregistered external drag trigger to remain visible",
    );
  }

  expect(
    await page.evaluate(() =>
      window.__gridLayoutFixture.getExternalDragTriggerCount(),
    ),
  ).toBe(0);
  expect(unregisteredDataset.trigger).toBeUndefined();
  expect(unregisteredDataset.handle).toBeUndefined();
  expect(unregisteredDataset.panel).toBeUndefined();
  expect(unregisteredDataset.strategy).toBeUndefined();

  await page.mouse.move(
    unregisteredTriggerBox.x + unregisteredTriggerBox.width / 2,
    unregisteredTriggerBox.y + unregisteredTriggerBox.height / 2,
  );
  await page.mouse.down();
  await page.mouse.move(
    unregisteredTriggerBox.x + unregisteredTriggerBox.width / 2 + 180,
    unregisteredTriggerBox.y + unregisteredTriggerBox.height / 2,
    { steps: 6 },
  );
  await page.mouse.up();

  expect(
    await page.evaluate(
      () => window.__gridLayoutFixture.triggerDragPlans.length,
    ),
  ).toBe(dragPlansAfterUnregister);
  expect(
    await page.evaluate(
      () =>
        window.__gridLayoutFixture.getPanelPlacement("#trigger-panel")
          .columnStart,
    ),
  ).toBe("2");
  expect(initialPlacement.columnStart).toBe("1");

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
  const snapshotDuringDrag = await page.evaluate(() =>
    window.__gridLayoutFixture.getPanelSnapshot("#context"),
  );
  const dragRequestsDuringDrag = await page.evaluate(
    () => window.__gridLayoutFixture.dragRequests.length,
  );

  expect(previewDuringDrag.hidden).toBe(false);
  expect(previewDuringDrag.panel).toBe("context");
  expect(previewDuringDrag.interaction).toBe("drag");
  expect(startDuringDrag?.columnStart).toBe(initialStart?.columnStart);
  expect(snapshotDuringDrag.active).toBe("true");
  expect(snapshotDuringDrag.x).toBeLessThan(0);
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
