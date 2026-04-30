import { expect, test } from "vitest";
import type { GridNamespaceTestContext } from "./suite";

export function registerExternalTriggerTests(
  context: GridNamespaceTestContext,
) {
  test("grid namespace drag trigger can live outside the target panel", async () => {
    const page = await context.newReadyPage();

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
      window.__gridLayoutFixture.getDragTriggerDataset(
        "#external-drag-trigger",
      ),
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
      window.__gridLayoutFixture.getDragTriggerDataset(
        "#external-drag-trigger",
      ),
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
      window.__gridLayoutFixture.getDragTriggerDataset(
        "#external-drag-trigger",
      ),
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
}
