import type {
  GridContainerId,
  GridContainerRegistration,
  GridDragHandleRegistration,
  GridHandleRegistration,
  GridLayoutPlan,
  GridNamespaceEventListener,
  GridNamespaceEventMap,
  GridNamespaceEventType,
  GridNamespaceId,
  GridPanelId,
  GridPanelRegistration,
  GridPreviewRegistration,
  GridDragOptions,
  GridResizeOptions,
  GridResizeEdge,
} from "../types";

export interface InternalContainerRegistration extends GridContainerRegistration {
  restore(): void;
}

export interface InternalPanelRegistration extends GridPanelRegistration {
  restore(): void;
}

export interface InternalHandleRegistration extends GridHandleRegistration {
  edge: GridResizeEdge;
  panelId: GridPanelId;
  resize: Required<GridResizeOptions>;
  minColumnSpan: number;
  minRowSpan: number;
  restore(): void;
}

export interface InternalDragHandleRegistration extends GridDragHandleRegistration {
  panelId: GridPanelId;
  drag: Required<GridDragOptions>;
  restore(): void;
}

export interface InternalPreviewRegistration extends GridPreviewRegistration {
  restore(): void;
}

export interface ActiveResize {
  pointerId: number;
  handle: InternalHandleRegistration;
  startX: number;
  startY: number;
  startPlan: GridLayoutPlan;
  lastPlan: GridLayoutPlan | null;
}

export interface ActiveDrag {
  pointerId: number;
  handle: InternalDragHandleRegistration;
  startX: number;
  startY: number;
  startPlan: GridLayoutPlan;
  lastPlan: GridLayoutPlan | null;
}

export class GridNamespaceContext {
  readonly containers = new Map<
    GridContainerId,
    InternalContainerRegistration
  >();
  readonly panels = new Map<GridPanelId, InternalPanelRegistration>();
  readonly handles = new Map<string, InternalHandleRegistration>();
  readonly dragHandles = new Map<string, InternalDragHandleRegistration>();
  readonly previews = new Map<string, InternalPreviewRegistration>();
  readonly listeners = new Map<
    GridNamespaceEventType,
    Set<(event: unknown) => void>
  >();

  currentPlan: GridLayoutPlan | null = null;
  activeResize: ActiveResize | null = null;
  activeDrag: ActiveDrag | null = null;

  constructor(readonly id: GridNamespaceId) {}

  on<Type extends GridNamespaceEventType>(
    type: Type,
    listener: GridNamespaceEventListener<Type>,
  ) {
    const typedListeners = this.listeners.get(type) ?? new Set();
    typedListeners.add(listener as (event: unknown) => void);
    this.listeners.set(type, typedListeners);

    return () => {
      typedListeners.delete(listener as (event: unknown) => void);
    };
  }

  emit<Type extends GridNamespaceEventType>(
    type: Type,
    event: GridNamespaceEventMap[Type],
  ) {
    for (const listener of this.listeners.get(type) ?? []) {
      listener(event);
    }
  }

  clearInteraction() {
    this.activeResize = null;
    this.activeDrag = null;
  }
}
