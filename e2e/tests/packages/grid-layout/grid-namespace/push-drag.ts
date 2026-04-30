import { expect, test } from "vitest";
import type { GridNamespaceTestContext } from "./suite";

export function registerPushDragTests(context: GridNamespaceTestContext) {
  test("grid namespace guarded drag stops before visible panel collisions", async () => {
    const page = await context.newReadyPage();

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
    const page = await context.newReadyPage();

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
    const page = await context.newReadyPage();

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
    const page = await context.newReadyPage();

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

    expect(activeDuringDrag.columnStart).toBe(
      initialActivePlacement.columnStart,
    );
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
}
