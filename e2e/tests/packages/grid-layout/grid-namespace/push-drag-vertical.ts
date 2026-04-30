import { expect, test } from "vitest";
import type { GridNamespaceTestContext } from "./suite";

export function registerVerticalPushDragTests(
  context: GridNamespaceTestContext,
) {
  test("grid namespace push drag supports vertical blocking panels", async () => {
    const page = await context.newReadyPage();

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
      await page.evaluate(
        () => window.__gridLayoutFixture.pushDragPlans.length,
      ),
    ).toBeGreaterThan(initialDragPlans);
    expect(pushedActive?.rowStart).toBe(3);
    expect(pushedActive?.rowSpan).toBe(2);
    expect(pushedBlocker?.rowStart).toBe(5);
    expect(pushedBlocker?.rowSpan).toBe(2);
    await expect
      .poll(() =>
        page.evaluate(
          () =>
            window.__gridLayoutFixture.getPanelPlacement(
              "#push-vertical-active",
            ).rowStart,
        ),
      )
      .toBe(initialActivePlacement.rowStart);
    await expect
      .poll(() =>
        page.evaluate(
          () =>
            window.__gridLayoutFixture.getPanelPlacement(
              "#push-vertical-blocker",
            ).rowStart,
        ),
      )
      .toBe(initialBlockerPlacement.rowStart);

    await page.close();
  });

  test("grid namespace accepted push drag keeps pushed panels after commit", async () => {
    const page = await context.newReadyPage();

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
            window.__gridLayoutFixture.getPanelPlacement(
              "#push-vertical-active",
            ).rowStart,
        ),
      )
      .toBe("3");
    await expect
      .poll(() =>
        page.evaluate(
          () =>
            window.__gridLayoutFixture.getPanelPlacement(
              "#push-vertical-blocker",
            ).rowStart,
        ),
      )
      .toBe("5");

    await page.close();
  });

  test("grid namespace push drag does not grow the grid when blocked", async () => {
    const page = await context.newReadyPage();

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
      await page.evaluate(
        () => window.__gridLayoutFixture.pushDragPlans.length,
      ),
    ).toBe(initialDragPlans);

    await page.close();
  });
}
