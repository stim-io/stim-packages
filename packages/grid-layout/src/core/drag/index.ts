import type { GridLayoutPlan } from "../../types";
import { getContainerForElement, getTrackStepSize } from "../../lib/geometry";
import { showPreview, hidePreview } from "../../lib/projection";
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

    const handleId = event.currentTarget.dataset.stimGridDragHandle;
    const handle = handleId ? this.context.dragHandles.get(handleId) : null;
    const startPlacement = handle
      ? this.context.currentPlan.panels.find(
          (placement) => placement.id === handle.panelId,
        )
      : null;

    if (!handle || !startPlacement || startPlacement.visible === false) {
      return;
    }

    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    this.context.activeDrag = {
      pointerId: event.pointerId,
      handle,
      startX: event.clientX,
      startY: event.clientY,
      startPlan: clonePlan(this.context.currentPlan),
      lastPlan: null,
    };
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
      this.context.activeDrag.handle.element,
    );

    if (!container) {
      return;
    }

    const nextPlan = this.planFromPointer(
      this.context.activeDrag,
      container.element,
      event,
    );

    if (!nextPlan) {
      return;
    }

    this.context.activeDrag.lastPlan = nextPlan;
    showPreview({
      plan: nextPlan,
      panelId: this.context.activeDrag.handle.panelId,
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

    if (drag.handle.element.hasPointerCapture(event.pointerId)) {
      drag.handle.element.releasePointerCapture(event.pointerId);
    }

    if (drag.lastPlan) {
      this.context.emit("layoutrequest", {
        namespace: this.context.id,
        interaction: "drag",
        dragHandleId: drag.handle.id,
        panelId: drag.handle.panelId,
        plan: clonePlan(drag.lastPlan),
      });
    }

    delete drag.handle.element.dataset.stimGridDragging;
    hidePreview(this.context.previews.values());
    this.context.activeDrag = null;
  };

  readonly cancel = (event: PointerEvent) => {
    if (
      !this.context.activeDrag ||
      event.pointerId !== this.context.activeDrag.pointerId
    ) {
      return;
    }

    if (
      this.context.activeDrag.handle.element.hasPointerCapture(event.pointerId)
    ) {
      this.context.activeDrag.handle.element.releasePointerCapture(
        event.pointerId,
      );
    }

    delete this.context.activeDrag.handle.element.dataset.stimGridDragging;
    hidePreview(this.context.previews.values());
    this.context.activeDrag = null;
  };

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
      panelId: drag.handle.panelId,
      deltaColumns,
      deltaRows,
      strategy: drag.handle.drag.strategy,
    });
  }
}
