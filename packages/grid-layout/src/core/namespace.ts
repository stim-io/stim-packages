import type {
  GridContainerRegistration,
  GridContainerRegistrationOptions,
  GridDragHandleRegistration,
  GridDragHandleRegistrationOptions,
  GridHandleRegistration,
  GridHandleRegistrationOptions,
  GridLayoutPlan,
  GridNamespaceEventListener,
  GridNamespaceEventType,
  GridNamespaceId,
  GridPanelId,
  GridPanelRegistration,
  GridPanelRegistrationOptions,
  GridPreviewRegistration,
  GridPreviewRegistrationOptions,
  GridDragStrategy,
  GridResizeStrategy,
} from "../types";
import {
  clonePlan,
  normalizePlan,
  normalizePositiveInteger,
} from "../lib/plan";
import { projectPlan, hidePreview } from "../lib/projection";
import { restoreElement, snapshotElement } from "../lib/snapshot";
import {
  GridNamespaceContext,
  type InternalContainerRegistration,
  type InternalDragHandleRegistration,
  type InternalHandleRegistration,
  type InternalPanelRegistration,
  type InternalPreviewRegistration,
} from "./context";
import { GridDragController } from "./drag";
import { GridResizeController } from "./resize";

const defaultContainerId = "default";
const defaultPreviewId = "default";
const defaultMinSpan = 1;
const defaultDragStrategy: GridDragStrategy = "free";
const defaultResizeStrategy: GridResizeStrategy = "adjacent";

export class GridNamespace {
  readonly id: GridNamespaceId;

  private readonly context: GridNamespaceContext;
  private readonly resize: GridResizeController;
  private readonly drag: GridDragController;

  static create(id: GridNamespaceId) {
    return new GridNamespace(id);
  }

  private constructor(id: GridNamespaceId) {
    this.id = id;
    this.context = new GridNamespaceContext(id);
    this.resize = new GridResizeController(this.context);
    this.drag = new GridDragController(this.context);
  }

  readonly register = {
    container: (
      element: HTMLElement,
      options: GridContainerRegistrationOptions = {},
    ) => this.registerContainer(element, options),
    panel: (element: HTMLElement, options: GridPanelRegistrationOptions) =>
      this.registerPanel(element, options),
    handle: (element: HTMLElement, options: GridHandleRegistrationOptions) =>
      this.registerHandle(element, options),
    dragHandle: (
      element: HTMLElement,
      options: GridDragHandleRegistrationOptions,
    ) => this.registerDragHandle(element, options),
    preview: (
      element: HTMLElement,
      options: GridPreviewRegistrationOptions = {},
    ) => this.registerPreview(element, options),
  };

  readonly layout = {
    apply: (plan: GridLayoutPlan) => this.applyLayout(plan),
    get: () =>
      this.context.currentPlan ? clonePlan(this.context.currentPlan) : null,
  };

  readonly elements = {
    containers: (): GridContainerRegistration[] => [
      ...this.context.containers.values(),
    ],
    panels: (): GridPanelRegistration[] => [...this.context.panels.values()],
    handles: (): GridHandleRegistration[] => [...this.context.handles.values()],
    dragHandles: (): GridDragHandleRegistration[] => [
      ...this.context.dragHandles.values(),
    ],
    previews: (): GridPreviewRegistration[] => [
      ...this.context.previews.values(),
    ],
    panel: (panelId: GridPanelId): GridPanelRegistration | null =>
      this.context.panels.get(panelId) ?? null,
  };

  readonly events = {
    on: <Type extends GridNamespaceEventType>(
      type: Type,
      listener: GridNamespaceEventListener<Type>,
    ) => this.context.on(type, listener),
  };

  destroy() {
    for (const preview of [...this.context.previews.values()]) {
      preview.unregister();
    }

    for (const dragHandle of [...this.context.dragHandles.values()]) {
      dragHandle.unregister();
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

    this.context.listeners.clear();
    this.context.currentPlan = null;
    this.context.clearInteraction();
  }

  private registerContainer(
    element: HTMLElement,
    options: GridContainerRegistrationOptions,
  ): GridContainerRegistration {
    const containerId = options.id ?? defaultContainerId;
    const existing = this.context.containers.get(containerId);

    if (existing) {
      existing.unregister();
    }

    const previous = snapshotElement(element);
    let active = true;
    const registration: InternalContainerRegistration = {
      id: containerId,
      element,
      unregister: () => {
        if (
          !active ||
          this.context.containers.get(containerId) !== registration
        ) {
          return;
        }

        active = false;
        this.context.containers.delete(containerId);
        registration.restore();
        this.context.emit("unregister", {
          namespace: this.id,
          kind: "container",
          id: containerId,
        });
      },
      restore() {
        restoreElement(element, previous);
      },
    };

    this.context.containers.set(containerId, registration);
    element.dataset.stimGridNamespace = this.id;
    element.dataset.stimGridContainer = containerId;
    element.style.display = "grid";
    this.context.emit("register", {
      namespace: this.id,
      kind: "container",
      id: containerId,
      element,
    });

    if (options.plan) {
      this.layout.apply(options.plan);
    } else if (this.context.currentPlan) {
      this.projectCurrentPlan();
    }

    return registration;
  }

  private registerPanel(
    element: HTMLElement,
    options: GridPanelRegistrationOptions,
  ): GridPanelRegistration {
    const existing = this.context.panels.get(options.id);

    if (existing) {
      existing.unregister();
    }

    const previous = snapshotElement(element);
    let active = true;
    const registration: InternalPanelRegistration = {
      id: options.id,
      element,
      unregister: () => {
        if (!active || this.context.panels.get(options.id) !== registration) {
          return;
        }

        active = false;
        this.context.panels.delete(options.id);
        registration.restore();
        this.context.emit("unregister", {
          namespace: this.id,
          kind: "panel",
          id: options.id,
        });
      },
      restore() {
        restoreElement(element, previous);
      },
    };

    this.context.panels.set(options.id, registration);
    element.dataset.stimGridNamespace = this.id;
    element.dataset.stimGridPanel = options.id;
    this.context.emit("register", {
      namespace: this.id,
      kind: "panel",
      id: options.id,
      element,
    });

    if (this.context.currentPlan) {
      this.projectCurrentPlan();
    }

    return registration;
  }

  private registerHandle(
    element: HTMLElement,
    options: GridHandleRegistrationOptions,
  ): GridHandleRegistration {
    const existing = this.context.handles.get(options.id);

    if (existing) {
      existing.unregister();
    }

    const previous = snapshotElement(element);
    let active = true;
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
        if (!active || this.context.handles.get(options.id) !== registration) {
          return;
        }

        active = false;
        this.context.handles.delete(options.id);
        if (this.context.activeResize?.handle === registration) {
          if (element.hasPointerCapture(this.context.activeResize.pointerId)) {
            element.releasePointerCapture(this.context.activeResize.pointerId);
          }
          hidePreview(this.context.previews.values());
          this.context.activeResize = null;
        }
        this.removeHandleListeners(element);
        registration.restore();
        this.context.emit("unregister", {
          namespace: this.id,
          kind: "handle",
          id: options.id,
        });
      },
      restore() {
        restoreElement(element, previous);
      },
    };

    this.context.handles.set(options.id, registration);
    element.dataset.stimGridNamespace = this.id;
    element.dataset.stimGridHandle = options.id;
    element.dataset.stimGridResizePanel = options.panelId;
    element.dataset.stimGridResizeEdge = registration.edge;
    element.dataset.stimGridResizeStrategy = registration.resize.strategy;
    element.style.touchAction = "none";
    element.addEventListener("pointerdown", this.resize.begin);
    element.addEventListener("pointermove", this.resize.request);
    element.addEventListener("pointerup", this.resize.commit);
    element.addEventListener("pointercancel", this.resize.cancel);
    this.context.emit("register", {
      namespace: this.id,
      kind: "handle",
      id: options.id,
      element,
    });

    return registration;
  }

  private registerDragHandle(
    element: HTMLElement,
    options: GridDragHandleRegistrationOptions,
  ): GridDragHandleRegistration {
    const existing = this.context.dragHandles.get(options.id);

    if (existing) {
      existing.unregister();
    }

    const previous = snapshotElement(element);
    let active = true;
    const registration: InternalDragHandleRegistration = {
      id: options.id,
      element,
      panelId: options.panelId,
      drag: {
        strategy: options.drag?.strategy ?? defaultDragStrategy,
      },
      unregister: () => {
        if (
          !active ||
          this.context.dragHandles.get(options.id) !== registration
        ) {
          return;
        }

        active = false;
        this.context.dragHandles.delete(options.id);
        if (this.context.activeDrag?.handle === registration) {
          if (element.hasPointerCapture(this.context.activeDrag.pointerId)) {
            element.releasePointerCapture(this.context.activeDrag.pointerId);
          }
          hidePreview(this.context.previews.values());
          this.context.activeDrag = null;
        }
        this.removeDragHandleListeners(element);
        registration.restore();
        this.context.emit("unregister", {
          namespace: this.id,
          kind: "dragHandle",
          id: options.id,
        });
      },
      restore() {
        restoreElement(element, previous);
      },
    };

    this.context.dragHandles.set(options.id, registration);
    element.dataset.stimGridNamespace = this.id;
    element.dataset.stimGridDragHandle = options.id;
    element.dataset.stimGridDragPanel = options.panelId;
    element.dataset.stimGridDragStrategy = registration.drag.strategy;
    element.style.touchAction = "none";
    element.addEventListener("pointerdown", this.drag.begin);
    element.addEventListener("pointermove", this.drag.request);
    element.addEventListener("pointerup", this.drag.commit);
    element.addEventListener("pointercancel", this.drag.cancel);
    this.context.emit("register", {
      namespace: this.id,
      kind: "dragHandle",
      id: options.id,
      element,
    });

    return registration;
  }

  private registerPreview(
    element: HTMLElement,
    options: GridPreviewRegistrationOptions,
  ): GridPreviewRegistration {
    const previewId = options.id ?? defaultPreviewId;
    const existing = this.context.previews.get(previewId);

    if (existing) {
      existing.unregister();
    }

    const previous = snapshotElement(element);
    let active = true;
    const registration: InternalPreviewRegistration = {
      id: previewId,
      element,
      unregister: () => {
        if (!active || this.context.previews.get(previewId) !== registration) {
          return;
        }

        active = false;
        this.context.previews.delete(previewId);
        registration.restore();
        this.context.emit("unregister", {
          namespace: this.id,
          kind: "preview",
          id: previewId,
        });
      },
      restore() {
        restoreElement(element, previous);
      },
    };

    this.context.previews.set(previewId, registration);
    element.dataset.stimGridNamespace = this.id;
    element.dataset.stimGridPreview = previewId;
    element.hidden = true;
    this.context.emit("register", {
      namespace: this.id,
      kind: "preview",
      id: previewId,
      element,
    });

    return registration;
  }

  private applyLayout(plan: GridLayoutPlan) {
    this.context.currentPlan = normalizePlan(plan);
    this.projectCurrentPlan();
    this.context.emit("layoutchange", {
      namespace: this.id,
      plan: clonePlan(this.context.currentPlan),
    });
  }

  private projectCurrentPlan() {
    if (!this.context.currentPlan) {
      return;
    }

    projectPlan({
      plan: this.context.currentPlan,
      containers: this.context.containers.values(),
      panels: this.context.panels.values(),
    });
  }

  private removeHandleListeners(element: HTMLElement) {
    element.removeEventListener("pointerdown", this.resize.begin);
    element.removeEventListener("pointermove", this.resize.request);
    element.removeEventListener("pointerup", this.resize.commit);
    element.removeEventListener("pointercancel", this.resize.cancel);
  }

  private removeDragHandleListeners(element: HTMLElement) {
    element.removeEventListener("pointerdown", this.drag.begin);
    element.removeEventListener("pointermove", this.drag.request);
    element.removeEventListener("pointerup", this.drag.commit);
    element.removeEventListener("pointercancel", this.drag.cancel);
  }
}
