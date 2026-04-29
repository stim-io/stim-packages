import type { GridLayoutPlan } from "../../types";
import { getContainerForElement, getTrackStepSize } from "../../lib/geometry";
import { showPreview, hidePreview } from "../../lib/projection";
import { clonePlan, getNumericTrackCount } from "../../lib/plan";
import { GridNamespaceContext, type ActiveResize } from "../context";
import { createResizePlan } from "./strategy";

export class GridResizeController {
  constructor(private readonly context: GridNamespaceContext) {}

  readonly begin = (event: PointerEvent) => {
    if (
      !(event.currentTarget instanceof HTMLElement) ||
      !this.context.currentPlan ||
      this.context.activeResize ||
      this.context.activeDrag
    ) {
      return;
    }

    const handleId = event.currentTarget.dataset.stimGridHandle;
    const handle = handleId ? this.context.handles.get(handleId) : null;
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
    this.context.activeResize = {
      pointerId: event.pointerId,
      handle,
      startX: event.clientX,
      startY: event.clientY,
      startPlan: clonePlan(this.context.currentPlan),
      lastPlan: null,
    };
    event.currentTarget.dataset.stimGridResizing = "true";
  };

  readonly request = (event: PointerEvent) => {
    if (
      !this.context.activeResize ||
      event.pointerId !== this.context.activeResize.pointerId
    ) {
      return;
    }

    const container = getContainerForElement(
      this.context.containers.values(),
      this.context.activeResize.handle.element,
    );

    if (!container) {
      return;
    }

    const nextPlan = this.planFromPointer(
      this.context.activeResize,
      container.element,
      event,
    );

    if (!nextPlan) {
      return;
    }

    this.context.activeResize.lastPlan = nextPlan;
    showPreview({
      plan: nextPlan,
      panelId: this.context.activeResize.handle.panelId,
      interaction: "resize",
      previews: this.context.previews.values(),
    });
  };

  readonly commit = (event: PointerEvent) => {
    if (
      !this.context.activeResize ||
      event.pointerId !== this.context.activeResize.pointerId
    ) {
      return;
    }

    const resize = this.context.activeResize;

    if (resize.handle.element.hasPointerCapture(event.pointerId)) {
      resize.handle.element.releasePointerCapture(event.pointerId);
    }

    if (resize.lastPlan) {
      this.context.emit("layoutrequest", {
        namespace: this.context.id,
        interaction: "resize",
        handleId: resize.handle.id,
        panelId: resize.handle.panelId,
        edge: resize.handle.edge,
        plan: clonePlan(resize.lastPlan),
      });
    }

    delete resize.handle.element.dataset.stimGridResizing;
    hidePreview(this.context.previews.values());
    this.context.activeResize = null;
  };

  readonly cancel = (event: PointerEvent) => {
    if (
      !this.context.activeResize ||
      event.pointerId !== this.context.activeResize.pointerId
    ) {
      return;
    }

    if (
      this.context.activeResize.handle.element.hasPointerCapture(
        event.pointerId,
      )
    ) {
      this.context.activeResize.handle.element.releasePointerCapture(
        event.pointerId,
      );
    }

    delete this.context.activeResize.handle.element.dataset.stimGridResizing;
    hidePreview(this.context.previews.values());
    this.context.activeResize = null;
  };

  private planFromPointer(
    resize: ActiveResize,
    container: HTMLElement,
    event: PointerEvent,
  ): GridLayoutPlan | null {
    const columnCount = getNumericTrackCount(resize.startPlan.columns);
    const rowCount = getNumericTrackCount(resize.startPlan.rows);
    const rect = container.getBoundingClientRect();

    if (rect.width <= 0 || rect.height <= 0) {
      return null;
    }

    if (resize.handle.edge === "inline-end") {
      if (!columnCount) {
        return null;
      }

      const cellSize = getTrackStepSize(
        container,
        "columns",
        columnCount,
        rect,
      );
      if (cellSize <= 0) {
        return null;
      }

      const deltaCells = Math.round((event.clientX - resize.startX) / cellSize);
      return createResizePlan({
        plan: resize.startPlan,
        panelId: resize.handle.panelId,
        edge: resize.handle.edge,
        strategy: resize.handle.resize.strategy,
        deltaCells,
        minColumnSpan: resize.handle.minColumnSpan,
        minRowSpan: resize.handle.minRowSpan,
      });
    }

    if (!rowCount) {
      return null;
    }

    const cellSize = getTrackStepSize(container, "rows", rowCount, rect);
    if (cellSize <= 0) {
      return null;
    }

    const deltaCells = Math.round((event.clientY - resize.startY) / cellSize);
    return createResizePlan({
      plan: resize.startPlan,
      panelId: resize.handle.panelId,
      edge: resize.handle.edge,
      strategy: resize.handle.resize.strategy,
      deltaCells,
      minColumnSpan: resize.handle.minColumnSpan,
      minRowSpan: resize.handle.minRowSpan,
    });
  }
}
