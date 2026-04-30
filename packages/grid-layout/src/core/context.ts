import type {
  GridContainerId,
  GridContainerRegistration,
  GridDragTriggerRegistration,
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

export type InternalDragTriggerEventKind = "dragTrigger" | "dragHandle";

export interface InternalDragTriggerRegistration extends GridDragTriggerRegistration {
  panelId: GridPanelId;
  drag: Required<GridDragOptions>;
  eventKind: InternalDragTriggerEventKind;
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
  trigger: InternalDragTriggerRegistration;
  panel: InternalPanelRegistration;
  startX: number;
  startY: number;
  startPlan: GridLayoutPlan;
  candidatePlan: GridLayoutPlan | null;
  snapshot: {
    transform: string;
    zIndex: string;
    willChange: string;
  };
}

export type NamespaceLayerName = "fact" | "interaction" | "snapshot";

export interface NamespaceLayers {
  readonly order: readonly NamespaceLayerName[];
  readonly fact: {
    readonly plan: {
      current: GridLayoutPlan | null;
    };
  };
  readonly interaction: {
    readonly plan: {
      candidate: GridLayoutPlan | null;
    };
  };
  readonly snapshot: {
    readonly drag: {
      activePanelId: GridPanelId | null;
      deltaX: number;
      deltaY: number;
      transform: string | null;
    };
  };
}

export class GridNamespaceContext {
  readonly containers = new Map<
    GridContainerId,
    InternalContainerRegistration
  >();
  readonly panels = new Map<GridPanelId, InternalPanelRegistration>();
  readonly handles = new Map<string, InternalHandleRegistration>();
  readonly dragTriggers = new Map<string, InternalDragTriggerRegistration>();
  readonly previews = new Map<string, InternalPreviewRegistration>();
  readonly listeners = new Map<
    GridNamespaceEventType,
    Set<(event: unknown) => void>
  >();

  readonly layers: NamespaceLayers = {
    order: ["fact", "interaction", "snapshot"],
    fact: {
      plan: {
        current: null,
      },
    },
    interaction: {
      plan: {
        candidate: null,
      },
    },
    snapshot: {
      drag: {
        activePanelId: null,
        deltaX: 0,
        deltaY: 0,
        transform: null,
      },
    },
  };

  activeResize: ActiveResize | null = null;
  activeDrag: ActiveDrag | null = null;

  constructor(readonly id: GridNamespaceId) {}

  get currentPlan() {
    return this.layers.fact.plan.current;
  }

  set currentPlan(plan: GridLayoutPlan | null) {
    this.layers.fact.plan.current = plan;
  }

  setInteractionCandidatePlan(plan: GridLayoutPlan | null) {
    this.layers.interaction.plan.candidate = plan;
  }

  activateDragSnapshotLayer(panelId: GridPanelId) {
    this.layers.snapshot.drag.activePanelId = panelId;
    this.layers.snapshot.drag.deltaX = 0;
    this.layers.snapshot.drag.deltaY = 0;
    this.layers.snapshot.drag.transform = null;
  }

  updateDragSnapshotLayer(options: {
    panelId: GridPanelId;
    deltaX: number;
    deltaY: number;
    transform: string;
  }) {
    if (this.layers.snapshot.drag.activePanelId !== options.panelId) {
      this.activateDragSnapshotLayer(options.panelId);
    }

    this.layers.snapshot.drag.deltaX = options.deltaX;
    this.layers.snapshot.drag.deltaY = options.deltaY;
    this.layers.snapshot.drag.transform = options.transform;
  }

  clearDragSnapshotLayer(panelId?: GridPanelId) {
    if (
      panelId &&
      this.layers.snapshot.drag.activePanelId &&
      this.layers.snapshot.drag.activePanelId !== panelId
    ) {
      return;
    }

    this.layers.snapshot.drag.activePanelId = null;
    this.layers.snapshot.drag.deltaX = 0;
    this.layers.snapshot.drag.deltaY = 0;
    this.layers.snapshot.drag.transform = null;
  }

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
    this.setInteractionCandidatePlan(null);
    this.clearDragSnapshotLayer();
  }
}
