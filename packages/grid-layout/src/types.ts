export type GridNamespaceId = string;
export type GridContainerId = string;
export type GridPanelId = string;

export type GridTrackSet = number | readonly string[] | string;

export interface GridPanelPlacement {
  id: GridPanelId;
  columnStart: number;
  columnSpan: number;
  rowStart: number;
  rowSpan: number;
  visible?: boolean;
}

export interface GridLayoutPlan {
  mode?: string;
  columns: GridTrackSet;
  rows: GridTrackSet;
  panels: readonly GridPanelPlacement[];
}

export type GridPlan = GridLayoutPlan;

export interface GridContainerRegistrationOptions {
  id?: GridContainerId;
  plan?: GridLayoutPlan;
}

export interface GridPanelRegistrationOptions {
  id: GridPanelId;
}

export type GridResizeEdge = "inline-end" | "block-end";
export type GridResizeStrategy = "adjacent" | "free" | "guarded";
export type GridDragStrategy = "free" | "guarded" | "push" | "reflow";

export interface GridResizeOptions {
  strategy?: GridResizeStrategy;
}

export interface GridDragOptions {
  strategy?: GridDragStrategy;
}

export interface GridHandleRegistrationOptions {
  id: string;
  panelId: GridPanelId;
  edge?: GridResizeEdge;
  resize?: GridResizeOptions;
  minColumnSpan?: number;
  minRowSpan?: number;
}

export interface GridDragTriggerRegistrationOptions {
  id: string;
  panelId: GridPanelId;
  drag?: GridDragOptions;
}

export interface GridDragHandleRegistrationOptions extends GridDragTriggerRegistrationOptions {}

export interface GridPreviewRegistrationOptions {
  id?: string;
}

export interface GridContainerRegistration {
  id: GridContainerId;
  element: HTMLElement;
  unregister(): void;
}

export interface GridPanelRegistration {
  id: GridPanelId;
  element: HTMLElement;
  unregister(): void;
}

export interface GridHandleRegistration {
  id: string;
  element: HTMLElement;
  unregister(): void;
}

export interface GridDragTriggerRegistration {
  id: string;
  element: HTMLElement;
  unregister(): void;
}

export interface GridDragHandleRegistration extends GridDragTriggerRegistration {}

export interface GridPreviewRegistration {
  id: string;
  element: HTMLElement;
  unregister(): void;
}

export interface GridResizeLayoutRequestEvent {
  namespace: GridNamespaceId;
  interaction: "resize";
  handleId: string;
  panelId: GridPanelId;
  edge: GridResizeEdge;
  plan: GridLayoutPlan;
}

export interface GridDragLayoutRequestEvent {
  namespace: GridNamespaceId;
  interaction: "drag";
  dragTriggerId: string;
  dragHandleId: string;
  panelId: GridPanelId;
  plan: GridLayoutPlan;
}

export type GridLayoutRequestEvent =
  | GridResizeLayoutRequestEvent
  | GridDragLayoutRequestEvent;

export interface GridNamespaceEventMap {
  layoutchange: {
    namespace: GridNamespaceId;
    plan: GridLayoutPlan;
  };
  layoutrequest: GridLayoutRequestEvent;
  register: {
    namespace: GridNamespaceId;
    kind:
      | "container"
      | "panel"
      | "handle"
      | "dragTrigger"
      | "dragHandle"
      | "preview";
    id: string;
    element: HTMLElement;
  };
  unregister: {
    namespace: GridNamespaceId;
    kind:
      | "container"
      | "panel"
      | "handle"
      | "dragTrigger"
      | "dragHandle"
      | "preview";
    id: string;
  };
}

export type GridNamespaceEventType = keyof GridNamespaceEventMap;

export type GridNamespaceEventListener<Type extends GridNamespaceEventType> = (
  event: GridNamespaceEventMap[Type],
) => void;
