import type {
  GridContainerRegistration,
  GridContainerRegistrationOptions,
  GridDragHandleRegistration,
  GridDragHandleRegistrationOptions,
  GridDragTriggerRegistration,
  GridDragTriggerRegistrationOptions,
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
} from "../types";
import { aesthetic } from "@stim-io/aesthetic";
import { clonePlan, normalizePlan } from "../lib/plan";
import { projectPlan } from "../lib/projection";
import { GridNamespaceContext } from "./context";
import { GridDragController } from "./drag";
import { GridNamespaceRegistrations } from "./registrations";
import { GridResizeController } from "./resize";

export class GridNamespace {
  readonly id: GridNamespaceId;

  private readonly context: GridNamespaceContext;
  private readonly resize: GridResizeController;
  private readonly drag: GridDragController;
  private readonly registrations: GridNamespaceRegistrations;

  static create(id: GridNamespaceId) {
    return new GridNamespace(id);
  }

  private constructor(id: GridNamespaceId) {
    this.id = id;
    this.context = new GridNamespaceContext(id);
    this.resize = new GridResizeController(this.context);
    this.drag = new GridDragController(this.context);
    this.registrations = new GridNamespaceRegistrations({
      context: this.context,
      drag: this.drag,
      resize: this.resize,
      layout: {
        apply: (plan) => this.applyLayout(plan),
        projectCurrent: () => this.projectCurrentPlan(),
      },
    });
  }

  readonly register = {
    container: (
      element: HTMLElement,
      options: GridContainerRegistrationOptions = {},
    ) => this.registrations.container(element, options),
    panel: (element: HTMLElement, options: GridPanelRegistrationOptions) =>
      this.registrations.panel(element, options),
    handle: (element: HTMLElement, options: GridHandleRegistrationOptions) =>
      this.registrations.handle(element, options),
    dragTrigger: (
      element: HTMLElement,
      options: GridDragTriggerRegistrationOptions,
    ) => this.registrations.dragTrigger(element, options),
    dragHandle: (
      element: HTMLElement,
      options: GridDragHandleRegistrationOptions,
    ) => this.registrations.dragHandle(element, options),
    preview: (
      element: HTMLElement,
      options: GridPreviewRegistrationOptions = {},
    ) => this.registrations.preview(element, options),
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
    dragTriggers: (): GridDragTriggerRegistration[] => [
      ...this.context.dragTriggers.values(),
    ],
    dragHandles: (): GridDragHandleRegistration[] =>
      [...this.context.dragTriggers.values()].filter(
        (registration) => registration.eventKind === "dragHandle",
      ),
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
    this.registrations.destroy();
    this.context.listeners.clear();
    this.context.currentPlan = null;
    this.context.clearInteraction();
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
    return aesthetic.$with(this.context.currentPlan, (currentPlan) => {
      projectPlan({
        plan: currentPlan,
        containers: this.context.containers.values(),
        panels: this.context.panels.values(),
      });
    });
  }
}
