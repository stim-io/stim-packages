import type { GridLayoutPlan } from "../../types";
import { getContainerForElement, getTrackStepSize } from "../../lib/geometry";
import { showPreview, hidePreview, projectPlan } from "../../lib/projection";
import { clonePlan, getNumericTrackCount } from "../../lib/plan";
import { GridNamespaceContext, type ActiveDrag } from "../context";
import { createDragPlan } from "./strategy";

export class GridDragController {
  constructor(private readonly context: GridNamespaceContext) {}

  readonly begin = (event: PointerEvent) => {
    if (
      !(event.currentTarget instanceof HTMLElement) ||
      !this.context.currentPlan ||
      this.context.activeDrag ||
      this.context.activeResize
    ) {
      return;
    }

    const triggerId =
      event.currentTarget.dataset.stimGridDragTrigger ??
      event.currentTarget.dataset.stimGridDragHandle;
    const trigger = triggerId ? this.context.dragTriggers.get(triggerId) : null;
    const panel = trigger ? this.context.panels.get(trigger.panelId) : null;
    const startPlacement = trigger
      ? this.context.currentPlan.panels.find(
          (placement) => placement.id === trigger.panelId,
        )
      : null;

    if (
      !trigger ||
      !panel ||
      !startPlacement ||
      startPlacement.visible === false
    ) {
      return;
    }

    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    this.context.activeDrag = {
      pointerId: event.pointerId,
      trigger,
      panel,
      startX: event.clientX,
      startY: event.clientY,
      startPlan: clonePlan(this.context.currentPlan),
      candidatePlan: null,
      snapshot: {
        transform: panel.element.style.transform,
        zIndex: panel.element.style.zIndex,
        willChange: panel.element.style.willChange,
      },
    };
    this.context.setInteractionCandidatePlan(null);
    this.context.activateDragSnapshotLayer(trigger.panelId);
    this.context.activeDrag.panel.element.dataset.stimGridDragSnapshot = "true";
    this.context.activeDrag.panel.element.style.zIndex = "2";
    this.context.activeDrag.panel.element.style.willChange = "transform";
    event.currentTarget.dataset.stimGridDragging = "true";
  };

  readonly request = (event: PointerEvent) => {
    if (
      !this.context.activeDrag ||
      event.pointerId !== this.context.activeDrag.pointerId
    ) {
      return;
    }

    const container = getContainerForElement(
      this.context.containers.values(),
      this.context.activeDrag.panel.element,
    );

    if (!container) {
      return;
    }

    this.projectDragSnapshot(this.context.activeDrag, event);

    const nextPlan = this.planFromPointer(
      this.context.activeDrag,
      container.element,
      event,
    );

    if (!nextPlan) {
      this.context.activeDrag.candidatePlan = null;
      this.context.setInteractionCandidatePlan(null);
      this.restoreTransientFullPlanProjection(this.context.activeDrag);
      hidePreview(this.context.previews.values());
      return;
    }

    this.context.activeDrag.candidatePlan = nextPlan;
    this.context.setInteractionCandidatePlan(nextPlan);
    this.projectTransientFullPlan(this.context.activeDrag, nextPlan);
    showPreview({
      plan: nextPlan,
      panelId: this.context.activeDrag.trigger.panelId,
      interaction: "drag",
      previews: this.context.previews.values(),
    });
  };

  readonly commit = (event: PointerEvent) => {
    if (
      !this.context.activeDrag ||
      event.pointerId !== this.context.activeDrag.pointerId
    ) {
      return;
    }

    const drag = this.context.activeDrag;

    if (drag.trigger.element.hasPointerCapture(event.pointerId)) {
      drag.trigger.element.releasePointerCapture(event.pointerId);
    }

    if (drag.candidatePlan) {
      this.context.emit("layoutrequest", {
        namespace: this.context.id,
        interaction: "drag",
        dragTriggerId: drag.trigger.id,
        dragHandleId: drag.trigger.id,
        panelId: drag.trigger.panelId,
        plan: clonePlan(drag.candidatePlan),
      });
    }

    delete drag.trigger.element.dataset.stimGridDragging;
    this.restoreDragSnapshot(drag);
    this.context.setInteractionCandidatePlan(null);
    hidePreview(this.context.previews.values());
    this.context.activeDrag = null;
    this.restoreAcceptedPlanAfterCommit(drag);
  };

  readonly cancel = (event: PointerEvent) => {
    if (
      !this.context.activeDrag ||
      event.pointerId !== this.context.activeDrag.pointerId
    ) {
      return;
    }

    if (
      this.context.activeDrag.trigger.element.hasPointerCapture(event.pointerId)
    ) {
      this.context.activeDrag.trigger.element.releasePointerCapture(
        event.pointerId,
      );
    }

    delete this.context.activeDrag.trigger.element.dataset.stimGridDragging;
    this.restoreTransientFullPlanProjection(this.context.activeDrag);
    this.restoreDragSnapshot(this.context.activeDrag);
    this.context.setInteractionCandidatePlan(null);
    hidePreview(this.context.previews.values());
    this.context.activeDrag = null;
  };

  restoreTransientFullPlanProjection(drag: ActiveDrag) {
    if (!usesTransientFullPlanProjection(drag)) {
      return;
    }

    this.projectPlan(drag.startPlan, drag.trigger.panelId);
  }

  restoreDragSnapshotProjection(drag: ActiveDrag) {
    this.restoreDragSnapshot(drag);
  }

  private planFromPointer(
    drag: ActiveDrag,
    container: HTMLElement,
    event: PointerEvent,
  ): GridLayoutPlan | null {
    const columnCount = getNumericTrackCount(drag.startPlan.columns);
    const rowCount = getNumericTrackCount(drag.startPlan.rows);
    const rect = container.getBoundingClientRect();

    if (!columnCount || !rowCount || rect.width <= 0 || rect.height <= 0) {
      return null;
    }

    const columnSize = getTrackStepSize(
      container,
      "columns",
      columnCount,
      rect,
    );
    const rowSize = getTrackStepSize(container, "rows", rowCount, rect);

    if (columnSize <= 0 || rowSize <= 0) {
      return null;
    }

    const deltaColumns = Math.round((event.clientX - drag.startX) / columnSize);
    const deltaRows = Math.round((event.clientY - drag.startY) / rowSize);

    return createDragPlan({
      plan: drag.startPlan,
      panelId: drag.trigger.panelId,
      deltaColumns,
      deltaRows,
      strategy: drag.trigger.drag.strategy,
    });
  }

  private projectTransientFullPlan(drag: ActiveDrag, plan: GridLayoutPlan) {
    if (!usesTransientFullPlanProjection(drag)) {
      return;
    }

    this.projectPlan(plan, drag.trigger.panelId);
  }

  private restoreAcceptedPlanAfterCommit(drag: ActiveDrag) {
    if (!usesTransientFullPlanProjection(drag)) {
      return;
    }

    queueMicrotask(() => {
      if (!this.context.currentPlan) {
        return;
      }

      this.projectPlan(this.context.currentPlan);
    });
  }

  private projectDragSnapshot(drag: ActiveDrag, event: PointerEvent) {
    const translate = `translate3d(${event.clientX - drag.startX}px, ${
      event.clientY - drag.startY
    }px, 0)`;
    const transform = drag.snapshot.transform
      ? `${translate} ${drag.snapshot.transform}`
      : translate;
    drag.panel.element.style.transform = transform;
    this.context.updateDragSnapshotLayer({
      panelId: drag.trigger.panelId,
      deltaX: event.clientX - drag.startX,
      deltaY: event.clientY - drag.startY,
      transform,
    });
  }

  private restoreDragSnapshot(drag: ActiveDrag) {
    drag.panel.element.style.transform = drag.snapshot.transform;
    drag.panel.element.style.zIndex = drag.snapshot.zIndex;
    drag.panel.element.style.willChange = drag.snapshot.willChange;
    delete drag.panel.element.dataset.stimGridDragSnapshot;
    this.context.clearDragSnapshotLayer(drag.trigger.panelId);
  }

  private projectPlan(plan: GridLayoutPlan, skipPanelId?: string) {
    projectPlan({
      plan,
      containers: this.context.containers.values(),
      panels: this.context.panels.values(),
      skipPanelIds: skipPanelId ? new Set([skipPanelId]) : undefined,
    });
  }
}

function usesTransientFullPlanProjection(drag: ActiveDrag) {
  switch (drag.trigger.drag.strategy) {
    case "push":
    case "reflow":
      return true;
    case "free":
    case "guarded":
      return false;
    default:
      throw new Error(
        `Unsupported drag strategy: ${String(drag.trigger.drag.strategy)}`,
      );
  }
}
