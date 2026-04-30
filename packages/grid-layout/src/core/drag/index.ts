import type { GridLayoutPlan } from "../../types";
import { aesthetic } from "@stim-io/aesthetic";
import { getContainerForElement, getTrackStepSize } from "../../lib/geometry";
import { gridData } from "../../lib/grid-data";
import { findVisiblePlacement } from "../../lib/placement";
import { pointerCapture } from "../../lib/pointer";
import { projectPlan } from "../../lib/projection";
import { clonePlan, getNumericTrackCount } from "../../lib/plan";
import { unreachable } from "../../lib/unreachable";
import {
  GridNamespaceContext,
  type ActiveDrag,
  type InternalDragTriggerRegistration,
  type InternalPanelRegistration,
} from "../context";
import { namespacePreview } from "../preview";
import { createDragPlan } from "./strategy";

interface DragStart {
  target: HTMLElement;
  trigger: InternalDragTriggerRegistration;
  panel: InternalPanelRegistration;
  plan: GridLayoutPlan;
}

export class GridDragController {
  constructor(private readonly context: GridNamespaceContext) {}

  readonly begin = (event: PointerEvent) => {
    return aesthetic.$with(this.getDragStart(event), (start) => {
      event.preventDefault();
      start.target.setPointerCapture(event.pointerId);
      const drag = this.createActiveDrag(event, start);

      this.context.activeDrag = drag;
      this.context.clearInteractionCandidatePlan();
      this.context.activateDragSnapshotLayer(start.trigger.panelId);
      gridData.set(drag.panel.element, "dragSnapshot", "true");
      drag.panel.element.style.zIndex = "2";
      drag.panel.element.style.willChange = "transform";
      gridData.set(start.target, "dragging", "true");
    });
  };

  readonly request = (event: PointerEvent) => {
    return aesthetic.$with(this.getActiveDrag(event), (drag) => {
      const container = getContainerForElement(
        this.context.containers.values(),
        drag.panel.element,
      );

      if (!container) {
        return;
      }

      this.projectDragSnapshot(drag, event);

      const nextPlan = this.planFromPointer(drag, container.element, event);

      if (!nextPlan) {
        this.rejectDragPlan(drag);
        return;
      }

      this.acceptDragPlan(drag, nextPlan);
    });
  };

  readonly commit = (event: PointerEvent) => {
    return aesthetic.$with(this.getActiveDrag(event), (drag) => {
      pointerCapture.release(drag.trigger.element, event.pointerId);
      this.emitDragLayoutRequest(drag);
      this.clearActiveDrag(drag);
      this.restoreAcceptedPlanAfterCommit(drag);
    });
  };

  readonly cancel = (event: PointerEvent) => {
    return aesthetic.$with(this.getActiveDrag(event), (drag) => {
      pointerCapture.release(drag.trigger.element, event.pointerId);
      this.restoreTransientFullPlanProjection(drag);
      this.clearActiveDrag(drag);
    });
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

  private getDragStart(event: PointerEvent): DragStart | null {
    if (
      !(event.currentTarget instanceof HTMLElement) ||
      !this.context.currentPlan ||
      this.context.activeDrag ||
      this.context.activeResize
    ) {
      return null;
    }

    const triggerId =
      gridData.get(event.currentTarget, "dragTrigger") ??
      gridData.get(event.currentTarget, "dragHandle");
    const trigger =
      triggerId === undefined
        ? null
        : (this.context.dragTriggers.get(triggerId) ?? null);
    const panel = trigger ? this.context.panels.get(trigger.panelId) : null;
    const startPlacement = trigger
      ? findVisiblePlacement(this.context.currentPlan, trigger.panelId)
      : null;

    if (!trigger || !panel || !startPlacement) {
      return null;
    }

    return {
      target: event.currentTarget,
      trigger,
      panel,
      plan: this.context.currentPlan,
    };
  }

  private createActiveDrag(event: PointerEvent, start: DragStart): ActiveDrag {
    return {
      pointerId: event.pointerId,
      trigger: start.trigger,
      panel: start.panel,
      startX: event.clientX,
      startY: event.clientY,
      startPlan: clonePlan(start.plan),
      candidatePlan: null,
      snapshot: {
        transform: start.panel.element.style.transform,
        zIndex: start.panel.element.style.zIndex,
        willChange: start.panel.element.style.willChange,
      },
    };
  }

  private getActiveDrag(event: PointerEvent) {
    const drag = this.context.activeDrag;

    if (!drag || event.pointerId !== drag.pointerId) {
      return null;
    }

    return drag;
  }

  private acceptDragPlan(drag: ActiveDrag, plan: GridLayoutPlan) {
    drag.candidatePlan = plan;
    this.context.setInteractionCandidatePlan(plan);
    this.projectTransientFullPlan(drag, plan);
    namespacePreview.show(this.context, {
      plan,
      panelId: drag.trigger.panelId,
      interaction: "drag",
    });
  }

  private rejectDragPlan(drag: ActiveDrag) {
    drag.candidatePlan = null;
    this.context.clearInteractionCandidatePlan();
    this.restoreTransientFullPlanProjection(drag);
    namespacePreview.hide(this.context);
  }

  private emitDragLayoutRequest(drag: ActiveDrag) {
    return aesthetic.$with(drag.candidatePlan, (candidatePlan) => {
      this.context.emit("layoutrequest", {
        namespace: this.context.id,
        interaction: "drag",
        dragTriggerId: drag.trigger.id,
        dragHandleId: drag.trigger.id,
        panelId: drag.trigger.panelId,
        plan: clonePlan(candidatePlan),
      });
    });
  }

  private clearActiveDrag(drag: ActiveDrag) {
    gridData.clear(drag.trigger.element, "dragging");
    this.restoreDragSnapshot(drag);
    this.context.clearInteractionCandidatePlan();
    namespacePreview.hide(this.context);
    this.context.activeDrag = null;
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
      aesthetic.$with(this.context.currentPlan, (currentPlan) => {
        this.projectPlan(currentPlan);
      });
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
    gridData.clear(drag.panel.element, "dragSnapshot");
    this.context.clearDragSnapshotLayer(drag.trigger.panelId);
  }

  private projectPlan(plan: GridLayoutPlan, skipPanelId?: string) {
    projectPlan({
      plan,
      containers: this.context.containers.values(),
      panels: this.context.panels.values(),
      skipPanelIds:
        skipPanelId === undefined ? undefined : new Set([skipPanelId]),
    });
  }
}

function usesTransientFullPlanProjection(drag: ActiveDrag) {
  const strategy = drag.trigger.drag.strategy;

  switch (strategy) {
    case "push":
    case "reflow":
      return true;
    case "free":
    case "guarded":
      return false;
    default:
      return unreachable(strategy, "Unsupported drag strategy");
  }
}
