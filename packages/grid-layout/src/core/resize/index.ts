import type { GridLayoutPlan } from "../../types";
import { aesthetic } from "@stim-io/aesthetic";
import { getContainerForElement, getTrackStepSize } from "../../lib/geometry";
import { gridData } from "../../lib/grid-data";
import { findVisiblePlacement } from "../../lib/placement";
import { pointerCapture } from "../../lib/pointer";
import { clonePlan, getNumericTrackCount } from "../../lib/plan";
import { unreachable } from "../../lib/unreachable";
import {
  GridNamespaceContext,
  type ActiveResize,
  type InternalHandleRegistration,
} from "../context";
import { namespacePreview } from "../preview";
import { createResizePlan } from "./strategy";

interface ResizeStart {
  target: HTMLElement;
  handle: InternalHandleRegistration;
  plan: GridLayoutPlan;
}

export class GridResizeController {
  constructor(private readonly context: GridNamespaceContext) {}

  readonly begin = (event: PointerEvent) => {
    return aesthetic.$with(this.getResizeStart(event), (start) => {
      event.preventDefault();
      start.target.setPointerCapture(event.pointerId);
      this.context.activeResize = this.createActiveResize(event, start);
      gridData.set(start.target, "resizing", "true");
    });
  };

  readonly request = (event: PointerEvent) => {
    return aesthetic.$with(this.getActiveResize(event), (resize) => {
      const container = getContainerForElement(
        this.context.containers.values(),
        resize.handle.element,
      );

      if (!container) {
        return;
      }

      const nextPlan = this.planFromPointer(resize, container.element, event);

      if (!nextPlan) {
        return;
      }

      this.acceptResizePlan(resize, nextPlan);
    });
  };

  readonly commit = (event: PointerEvent) => {
    return aesthetic.$with(this.getActiveResize(event), (resize) => {
      pointerCapture.release(resize.handle.element, event.pointerId);
      this.emitResizeLayoutRequest(resize);
      this.clearActiveResize(resize);
    });
  };

  readonly cancel = (event: PointerEvent) => {
    return aesthetic.$with(this.getActiveResize(event), (resize) => {
      pointerCapture.release(resize.handle.element, event.pointerId);
      this.clearActiveResize(resize);
    });
  };

  private getResizeStart(event: PointerEvent): ResizeStart | null {
    if (
      !(event.currentTarget instanceof HTMLElement) ||
      !this.context.currentPlan ||
      this.context.activeResize ||
      this.context.activeDrag
    ) {
      return null;
    }

    const handleId = gridData.get(event.currentTarget, "handle");
    const handle =
      handleId === undefined
        ? null
        : (this.context.handles.get(handleId) ?? null);
    const startPlacement = handle
      ? findVisiblePlacement(this.context.currentPlan, handle.panelId)
      : null;

    if (!handle || !startPlacement) {
      return null;
    }

    return {
      target: event.currentTarget,
      handle,
      plan: this.context.currentPlan,
    };
  }

  private createActiveResize(
    event: PointerEvent,
    start: ResizeStart,
  ): ActiveResize {
    return {
      pointerId: event.pointerId,
      handle: start.handle,
      startX: event.clientX,
      startY: event.clientY,
      startPlan: clonePlan(start.plan),
      lastPlan: null,
    };
  }

  private getActiveResize(event: PointerEvent) {
    const resize = this.context.activeResize;

    if (!resize || event.pointerId !== resize.pointerId) {
      return null;
    }

    return resize;
  }

  private acceptResizePlan(resize: ActiveResize, plan: GridLayoutPlan) {
    resize.lastPlan = plan;
    namespacePreview.show(this.context, {
      plan,
      panelId: resize.handle.panelId,
      interaction: "resize",
    });
  }

  private emitResizeLayoutRequest(resize: ActiveResize) {
    return aesthetic.$with(resize.lastPlan, (lastPlan) => {
      this.context.emit("layoutrequest", {
        namespace: this.context.id,
        interaction: "resize",
        handleId: resize.handle.id,
        panelId: resize.handle.panelId,
        edge: resize.handle.edge,
        plan: clonePlan(lastPlan),
      });
    });
  }

  private clearActiveResize(resize: ActiveResize) {
    gridData.clear(resize.handle.element, "resizing");
    namespacePreview.hide(this.context);
    this.context.activeResize = null;
  }

  private planFromPointer(
    resize: ActiveResize,
    container: HTMLElement,
    event: PointerEvent,
  ): GridLayoutPlan | null {
    const columnCount = getNumericTrackCount(resize.startPlan.columns);
    const rowCount = getNumericTrackCount(resize.startPlan.rows);
    const rect = container.getBoundingClientRect();
    const edge = resize.handle.edge;

    if (rect.width <= 0 || rect.height <= 0) {
      return null;
    }

    switch (edge) {
      case "inline-end": {
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

        const deltaCells = Math.round(
          (event.clientX - resize.startX) / cellSize,
        );
        return createResizePlan({
          plan: resize.startPlan,
          panelId: resize.handle.panelId,
          edge,
          strategy: resize.handle.resize.strategy,
          deltaCells,
          minColumnSpan: resize.handle.minColumnSpan,
          minRowSpan: resize.handle.minRowSpan,
        });
      }
      case "block-end": {
        if (!rowCount) {
          return null;
        }

        const cellSize = getTrackStepSize(container, "rows", rowCount, rect);
        if (cellSize <= 0) {
          return null;
        }

        const deltaCells = Math.round(
          (event.clientY - resize.startY) / cellSize,
        );
        return createResizePlan({
          plan: resize.startPlan,
          panelId: resize.handle.panelId,
          edge,
          strategy: resize.handle.resize.strategy,
          deltaCells,
          minColumnSpan: resize.handle.minColumnSpan,
          minRowSpan: resize.handle.minRowSpan,
        });
      }
      default:
        return unreachable(edge, "Unsupported resize edge");
    }
  }
}
