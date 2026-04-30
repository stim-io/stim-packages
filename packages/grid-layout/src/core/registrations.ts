import type {
  GridContainerRegistration,
  GridContainerRegistrationOptions,
  GridDragHandleRegistration,
  GridDragHandleRegistrationOptions,
  GridDragStrategy,
  GridDragTriggerRegistration,
  GridDragTriggerRegistrationOptions,
  GridHandleRegistration,
  GridHandleRegistrationOptions,
  GridLayoutPlan,
  GridNamespaceEventMap,
  GridPanelRegistration,
  GridPanelRegistrationOptions,
  GridPreviewRegistration,
  GridPreviewRegistrationOptions,
  GridResizeStrategy,
} from "../types";
import { normalizePositiveInteger } from "../lib/plan";
import { pointerCapture, pointerLifecycle } from "../lib/pointer";
import { restoreElement, snapshotElement } from "../lib/snapshot";
import {
  type ActiveDrag,
  type ActiveResize,
  GridNamespaceContext,
  type InternalContainerRegistration,
  type InternalDragTriggerEventKind,
  type InternalDragTriggerRegistration,
  type InternalHandleRegistration,
  type InternalPanelRegistration,
  type InternalPreviewRegistration,
} from "./context";
import type { GridDragController } from "./drag";
import { registrationDom } from "./registration-dom";
import { namespacePreview } from "./preview";
import type { GridResizeController } from "./resize";

const defaultContainerId = "default";
const defaultPreviewId = "default";
const defaultMinSpan = 1;
const defaultDragStrategy: GridDragStrategy = "free";
const defaultResizeStrategy: GridResizeStrategy = "adjacent";

type GridRegistrationKind = GridNamespaceEventMap["register"]["kind"];

interface GridNamespaceRegistrationLayout {
  apply(plan: GridLayoutPlan): void;
  projectCurrent(): void;
}

export class GridNamespaceRegistrations {
  constructor(
    private readonly options: {
      context: GridNamespaceContext;
      drag: GridDragController;
      resize: GridResizeController;
      layout: GridNamespaceRegistrationLayout;
    },
  ) {}

  container(
    element: HTMLElement,
    options: GridContainerRegistrationOptions = {},
  ): GridContainerRegistration {
    const containerId = options.id ?? defaultContainerId;

    this.replaceExisting(this.context.containers.get(containerId));

    const lifecycle = registrationLifecycle();
    const restore = captureElementRestore(element);
    const registration: InternalContainerRegistration = {
      id: containerId,
      element,
      unregister: () => {
        if (
          !lifecycle.deactivateIfCurrent(
            () => this.context.containers.get(containerId) === registration,
          )
        ) {
          return;
        }

        this.context.containers.delete(containerId);
        registration.restore();
        this.emitUnregister("container", containerId);
      },
      restore,
    };

    this.context.containers.set(containerId, registration);
    registrationDom.container(element, {
      namespace: this.context.id,
      id: containerId,
    });
    this.emitRegister("container", containerId, element);

    if (options.plan) {
      this.options.layout.apply(options.plan);
    } else if (this.context.currentPlan) {
      this.options.layout.projectCurrent();
    }

    return registration;
  }

  panel(
    element: HTMLElement,
    options: GridPanelRegistrationOptions,
  ): GridPanelRegistration {
    this.replaceExisting(this.context.panels.get(options.id));

    const lifecycle = registrationLifecycle();
    const restore = captureElementRestore(element);
    const registration: InternalPanelRegistration = {
      id: options.id,
      element,
      unregister: () => {
        if (
          !lifecycle.deactivateIfCurrent(
            () => this.context.panels.get(options.id) === registration,
          )
        ) {
          return;
        }

        this.context.panels.delete(options.id);
        this.clearActiveDragIf((drag) => drag.panel === registration);
        registration.restore();
        this.emitUnregister("panel", options.id);
      },
      restore,
    };

    this.context.panels.set(options.id, registration);
    registrationDom.panel(element, {
      namespace: this.context.id,
      id: options.id,
    });
    this.emitRegister("panel", options.id, element);

    if (this.context.currentPlan) {
      this.options.layout.projectCurrent();
    }

    return registration;
  }

  handle(
    element: HTMLElement,
    options: GridHandleRegistrationOptions,
  ): GridHandleRegistration {
    this.replaceExisting(this.context.handles.get(options.id));

    const lifecycle = registrationLifecycle();
    const restore = captureElementRestore(element);
    const registration: InternalHandleRegistration = {
      id: options.id,
      element,
      panelId: options.panelId,
      edge: options.edge ?? "inline-end",
      resize: {
        strategy: options.resize?.strategy ?? defaultResizeStrategy,
      },
      minColumnSpan: normalizePositiveInteger(
        options.minColumnSpan ?? defaultMinSpan,
      ),
      minRowSpan: normalizePositiveInteger(
        options.minRowSpan ?? defaultMinSpan,
      ),
      unregister: () => {
        if (
          !lifecycle.deactivateIfCurrent(
            () => this.context.handles.get(options.id) === registration,
          )
        ) {
          return;
        }

        this.context.handles.delete(options.id);
        this.clearActiveResizeIf((resize) => resize.handle === registration);
        pointerLifecycle.remove(element, this.options.resize);
        registration.restore();
        this.emitUnregister("handle", options.id);
      },
      restore,
    };

    this.context.handles.set(options.id, registration);
    registrationDom.handle(element, {
      namespace: this.context.id,
      registration,
    });
    pointerLifecycle.add(element, this.options.resize);
    this.emitRegister("handle", options.id, element);

    return registration;
  }

  dragTrigger(
    element: HTMLElement,
    options: GridDragTriggerRegistrationOptions,
  ): GridDragTriggerRegistration {
    return this.registerDragTrigger(element, options, "dragTrigger");
  }

  dragHandle(
    element: HTMLElement,
    options: GridDragHandleRegistrationOptions,
  ): GridDragHandleRegistration {
    return this.registerDragTrigger(element, options, "dragHandle");
  }

  preview(
    element: HTMLElement,
    options: GridPreviewRegistrationOptions = {},
  ): GridPreviewRegistration {
    const previewId = options.id ?? defaultPreviewId;

    this.replaceExisting(this.context.previews.get(previewId));

    const lifecycle = registrationLifecycle();
    const restore = captureElementRestore(element);
    const registration: InternalPreviewRegistration = {
      id: previewId,
      element,
      unregister: () => {
        if (
          !lifecycle.deactivateIfCurrent(
            () => this.context.previews.get(previewId) === registration,
          )
        ) {
          return;
        }

        this.context.previews.delete(previewId);
        registration.restore();
        this.emitUnregister("preview", previewId);
      },
      restore,
    };

    this.context.previews.set(previewId, registration);
    registrationDom.preview(element, {
      namespace: this.context.id,
      id: previewId,
    });
    this.emitRegister("preview", previewId, element);

    return registration;
  }

  destroy() {
    for (const preview of [...this.context.previews.values()]) {
      preview.unregister();
    }

    for (const dragTrigger of [...this.context.dragTriggers.values()]) {
      dragTrigger.unregister();
    }

    for (const handle of [...this.context.handles.values()]) {
      handle.unregister();
    }

    for (const panel of [...this.context.panels.values()]) {
      panel.unregister();
    }

    for (const container of [...this.context.containers.values()]) {
      container.unregister();
    }
  }

  private get context() {
    return this.options.context;
  }

  private registerDragTrigger(
    element: HTMLElement,
    options: GridDragTriggerRegistrationOptions,
    eventKind: InternalDragTriggerEventKind,
  ): GridDragTriggerRegistration {
    this.replaceExisting(this.context.dragTriggers.get(options.id));

    const lifecycle = registrationLifecycle();
    const restore = captureElementRestore(element);
    const registration: InternalDragTriggerRegistration = {
      id: options.id,
      element,
      panelId: options.panelId,
      drag: {
        strategy: options.drag?.strategy ?? defaultDragStrategy,
      },
      eventKind,
      unregister: () => {
        if (
          !lifecycle.deactivateIfCurrent(
            () => this.context.dragTriggers.get(options.id) === registration,
          )
        ) {
          return;
        }

        this.context.dragTriggers.delete(options.id);
        this.clearActiveDragIf((drag) => drag.trigger === registration);
        pointerLifecycle.remove(element, this.options.drag);
        registration.restore();
        this.emitUnregister(registration.eventKind, options.id);
      },
      restore,
    };

    this.context.dragTriggers.set(options.id, registration);
    registrationDom.dragTrigger(element, {
      namespace: this.context.id,
      registration,
    });
    pointerLifecycle.add(element, this.options.drag);
    this.emitRegister(registration.eventKind, options.id, element);

    return registration;
  }

  private clearActiveDragIf(matches: (drag: ActiveDrag) => boolean) {
    const drag = this.context.activeDrag;

    if (!drag || !matches(drag)) {
      return;
    }

    pointerCapture.release(drag.trigger.element, drag.pointerId);
    this.options.drag.restoreTransientFullPlanProjection(drag);
    this.options.drag.restoreDragSnapshotProjection(drag);
    this.context.clearInteractionCandidatePlan();
    namespacePreview.hide(this.context);
    this.context.activeDrag = null;
  }

  private clearActiveResizeIf(matches: (resize: ActiveResize) => boolean) {
    const resize = this.context.activeResize;

    if (!resize || !matches(resize)) {
      return;
    }

    pointerCapture.release(resize.handle.element, resize.pointerId);
    namespacePreview.hide(this.context);
    this.context.activeResize = null;
  }

  private replaceExisting(registration: { unregister(): void } | undefined) {
    registration?.unregister();
  }

  private emitRegister(
    kind: GridRegistrationKind,
    id: string,
    element: HTMLElement,
  ) {
    this.context.emit("register", {
      namespace: this.context.id,
      kind,
      id,
      element,
    });
  }

  private emitUnregister(kind: GridRegistrationKind, id: string) {
    this.context.emit("unregister", {
      namespace: this.context.id,
      kind,
      id,
    });
  }
}

function captureElementRestore(element: HTMLElement) {
  const previous = snapshotElement(element);

  return () => restoreElement(element, previous);
}

function registrationLifecycle() {
  let active = true;

  return {
    deactivateIfCurrent(isCurrent: () => boolean) {
      if (!active || !isCurrent()) {
        return false;
      }

      active = false;
      return true;
    },
  };
}
