import { expect, test } from "vitest";
import type { GridNamespaceTestContext } from "./suite";

export function registerReflowDragTests(context: GridNamespaceTestContext) {
  test("grid namespace reflow drag moves blockers and compacts vacated panels", async () => {
    const page = await context.newReadyPage();

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
      document.querySelector("#grid-reflow")?.scrollIntoView({
        block: "center",
      }),
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

    expect(activeDuringDrag.columnStart).toBe(
      initialActivePlacement.columnStart,
    );
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
    const page = await context.newReadyPage();

    const initialActivePlacement = await page.evaluate(() =>
      window.__gridLayoutFixture.getPanelPlacement("#reflow-active"),
    );
    const initialDragPlans = await page.evaluate(
      () => window.__gridLayoutFixture.reflowDragPlans.length,
    );
    await page.evaluate(() =>
      document
        .querySelector("#grid-reflow")
        ?.scrollIntoView({ block: "center" }),
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
    const page = await context.newReadyPage();

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
    const page = await context.newReadyPage();

    const initialDragPlans = await page.evaluate(
      () => window.__gridLayoutFixture.reflowDragPlans.length,
    );
    await page.evaluate(() =>
      document
        .querySelector("#grid-reflow")
        ?.scrollIntoView({ block: "center" }),
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
}
