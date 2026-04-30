import { expect, test } from "vitest";
import type { GridNamespaceTestContext } from "./suite";

export function registerNamespaceTests(context: GridNamespaceTestContext) {
  test("grid namespace applies plans and isolates tracked elements", async () => {
    const page = await context.newReadyPage();

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
}

export function registerNamespaceDragHandleTests(
  context: GridNamespaceTestContext,
) {
  test("grid namespace drag handle updates panel placement", async () => {
    const page = await context.newReadyPage();

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
    expect(finalStart?.columnStart).toBeLessThan(
      initialStart?.columnStart ?? 0,
    );
    expect(finalStart?.rowStart).toBe(initialStart?.rowStart);

    await page.close();
  });
}
