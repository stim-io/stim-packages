import type {
  GridDragStrategy,
  GridLayoutPlan,
  GridPanelId,
  GridPanelPlacement,
} from "../../types";
import { hasPlacementCollision, placementOverlaps } from "../../lib/collision";
import {
  clampInteger,
  findVisiblePlacement,
  getAxisSpan,
  getAxisStart,
  replacePlacement,
  replacePlacements,
} from "../../lib/placement";
import { getNumericTrackCount } from "../../lib/plan";

export interface CreateGridDragPlanOptions {
  plan: GridLayoutPlan;
  panelId: GridPanelId;
  deltaColumns: number;
  deltaRows: number;
  strategy?: GridDragStrategy;
}

export function createDragPlan(
  options: CreateGridDragPlanOptions,
): GridLayoutPlan | null {
  const columnCount = getNumericTrackCount(options.plan.columns);
  const rowCount = getNumericTrackCount(options.plan.rows);
  const placement = findVisiblePlacement(options.plan, options.panelId);
  const strategy = options.strategy ?? "free";

  if (!columnCount || !rowCount || !placement) {
    return null;
  }

  const nextPlacement = createTargetPlacement({
    placement,
    deltaColumns: options.deltaColumns,
    deltaRows: options.deltaRows,
    columnCount,
    rowCount,
  });

  switch (strategy) {
    case "reflow":
      return createReflowPlan({
        plan: options.plan,
        placement,
        targetPlacement: nextPlacement,
        rowCount,
      });
    case "push":
      return createPushPlan({
        plan: options.plan,
        placement,
        targetPlacement: nextPlacement,
        columnCount,
        rowCount,
      });
    case "guarded":
      return createPlacementDragPlan({
        plan: options.plan,
        panelId: options.panelId,
        placement,
        proposedPlacement: getGuardedPlacement({
          plan: options.plan,
          placement,
          targetPlacement: nextPlacement,
        }),
      });
    case "free":
      return createPlacementDragPlan({
        plan: options.plan,
        panelId: options.panelId,
        placement,
        proposedPlacement: nextPlacement,
      });
    default:
      throw new Error(`Unsupported drag strategy: ${String(strategy)}`);
  }
}

function createPlacementDragPlan(options: {
  plan: GridLayoutPlan;
  panelId: GridPanelId;
  placement: GridPanelPlacement;
  proposedPlacement: GridPanelPlacement;
}) {
  if (
    options.proposedPlacement.columnStart === options.placement.columnStart &&
    options.proposedPlacement.rowStart === options.placement.rowStart
  ) {
    return null;
  }

  return replacePlacement(
    options.plan,
    options.panelId,
    options.proposedPlacement,
  );
}

function createTargetPlacement(options: {
  placement: GridPanelPlacement;
  deltaColumns: number;
  deltaRows: number;
  columnCount: number;
  rowCount: number;
}) {
  return {
    ...options.placement,
    columnStart: clampInteger(
      options.placement.columnStart + options.deltaColumns,
      1,
      Math.max(1, options.columnCount - options.placement.columnSpan + 1),
    ),
    rowStart: clampInteger(
      options.placement.rowStart + options.deltaRows,
      1,
      Math.max(1, options.rowCount - options.placement.rowSpan + 1),
    ),
  };
}

function createReflowPlan(options: {
  plan: GridLayoutPlan;
  placement: GridPanelPlacement;
  targetPlacement: GridPanelPlacement;
  rowCount: number;
}): GridLayoutPlan | null {
  const deltaColumns =
    options.targetPlacement.columnStart - options.placement.columnStart;
  const deltaRows =
    options.targetPlacement.rowStart - options.placement.rowStart;

  if (deltaColumns === 0 && deltaRows === 0) {
    return null;
  }

  const steps = Math.max(Math.abs(deltaColumns), Math.abs(deltaRows));
  let lastPlan: GridLayoutPlan | null = null;
  let currentPlan = options.plan;
  let currentPlacement = options.placement;

  for (let step = 1; step <= steps; step += 1) {
    const candidate = {
      ...options.placement,
      columnStart:
        options.placement.columnStart +
        interpolateAxisDelta(deltaColumns, step, steps),
      rowStart:
        options.placement.rowStart +
        interpolateAxisDelta(deltaRows, step, steps),
    };

    if (
      candidate.columnStart === currentPlacement.columnStart &&
      candidate.rowStart === currentPlacement.rowStart
    ) {
      continue;
    }

    const plan = createSingleStepReflowPlan({
      plan: currentPlan,
      placement: currentPlacement,
      targetPlacement: candidate,
      rowCount: options.rowCount,
    });

    if (!plan) {
      break;
    }

    lastPlan = plan;
    currentPlan = plan;
    currentPlacement = candidate;
  }

  return lastPlan;
}

function createSingleStepReflowPlan(options: {
  plan: GridLayoutPlan;
  placement: GridPanelPlacement;
  targetPlacement: GridPanelPlacement;
  rowCount: number;
}): GridLayoutPlan | null {
  const replacements = new Map<GridPanelId, GridPanelPlacement>([
    [options.placement.id, options.targetPlacement],
  ]);

  pushReflowCollisionsDown({
    plan: options.plan,
    replacements,
    pusherId: options.placement.id,
  });
  compactReflowPanelsUp({
    plan: options.plan,
    replacements,
    activePanelId: options.placement.id,
  });

  const nextPlan = replacePlacements(options.plan, replacements);

  if (getPlanBottom(nextPlan) - 1 > options.rowCount) {
    return null;
  }

  return nextPlan;
}

function pushReflowCollisionsDown(options: {
  plan: GridLayoutPlan;
  replacements: Map<GridPanelId, GridPanelPlacement>;
  pusherId: GridPanelId;
}) {
  const queue = [options.pusherId];

  while (queue.length > 0) {
    const pusherId = queue.shift();
    const pusher = pusherId
      ? getCurrentPlacement(options.plan, options.replacements, pusherId)
      : null;

    if (!pusher) {
      continue;
    }

    for (const blocker of getReflowBlockingPanels({
      plan: options.plan,
      replacements: options.replacements,
      pusher,
    })) {
      const nextBlocker = {
        ...blocker,
        rowStart: pusher.rowStart + pusher.rowSpan,
      };

      if (nextBlocker.rowStart === blocker.rowStart) {
        continue;
      }

      options.replacements.set(blocker.id, nextBlocker);
      queue.push(blocker.id);
    }
  }
}

function getReflowBlockingPanels(options: {
  plan: GridLayoutPlan;
  replacements: Map<GridPanelId, GridPanelPlacement>;
  pusher: GridPanelPlacement;
}) {
  return options.plan.panels
    .map((placement, index) => ({
      placement: options.replacements.get(placement.id) ?? placement,
      index,
    }))
    .filter(
      ({ placement }) =>
        placement.id !== options.pusher.id &&
        placement.visible !== false &&
        placementOverlaps(placement, options.pusher),
    )
    .sort((a, b) => compareReflowOrder(a, b))
    .map(({ placement }) => placement);
}

function compactReflowPanelsUp(options: {
  plan: GridLayoutPlan;
  replacements: Map<GridPanelId, GridPanelPlacement>;
  activePanelId: GridPanelId;
}) {
  const activePlacement = getCurrentPlacement(
    options.plan,
    options.replacements,
    options.activePanelId,
  );
  const blockers = activePlacement ? [activePlacement] : [];
  const panels = options.plan.panels
    .map((placement, index) => ({
      placement: options.replacements.get(placement.id) ?? placement,
      index,
    }))
    .filter(
      ({ placement }) =>
        placement.visible !== false && placement.id !== options.activePanelId,
    )
    .sort((a, b) => compareReflowOrder(a, b));

  for (const { placement } of panels) {
    let compacted = placement;

    while (compacted.rowStart > 1) {
      const candidate = {
        ...compacted,
        rowStart: compacted.rowStart - 1,
      };

      if (blockers.some((blocker) => placementOverlaps(blocker, candidate))) {
        break;
      }

      compacted = candidate;
    }

    options.replacements.set(placement.id, compacted);
    blockers.push(compacted);
  }
}

function compareReflowOrder(
  a: { placement: GridPanelPlacement; index: number },
  b: { placement: GridPanelPlacement; index: number },
) {
  return (
    a.placement.rowStart - b.placement.rowStart ||
    a.placement.columnStart - b.placement.columnStart ||
    a.index - b.index
  );
}

function getPlanBottom(plan: GridLayoutPlan) {
  return Math.max(
    1,
    ...plan.panels
      .filter((placement) => placement.visible !== false)
      .map((placement) => placement.rowStart + placement.rowSpan),
  );
}

function createPushPlan(options: {
  plan: GridLayoutPlan;
  placement: GridPanelPlacement;
  targetPlacement: GridPanelPlacement;
  columnCount: number;
  rowCount: number;
}): GridLayoutPlan | null {
  const deltaColumns =
    options.targetPlacement.columnStart - options.placement.columnStart;
  const deltaRows =
    options.targetPlacement.rowStart - options.placement.rowStart;

  if (deltaColumns === 0 && deltaRows === 0) {
    return null;
  }

  const steps = Math.max(Math.abs(deltaColumns), Math.abs(deltaRows));
  let lastPlan: GridLayoutPlan | null = null;
  let currentPlan = options.plan;
  let currentPlacement = options.placement;

  for (let step = 1; step <= steps; step += 1) {
    const candidate = {
      ...options.placement,
      columnStart:
        options.placement.columnStart +
        interpolateAxisDelta(deltaColumns, step, steps),
      rowStart:
        options.placement.rowStart +
        interpolateAxisDelta(deltaRows, step, steps),
    };

    if (
      candidate.columnStart === currentPlacement.columnStart &&
      candidate.rowStart === currentPlacement.rowStart
    ) {
      continue;
    }

    const plan = createSingleStepPushPlan({
      plan: currentPlan,
      placement: currentPlacement,
      targetPlacement: candidate,
      columnCount: options.columnCount,
      rowCount: options.rowCount,
    });

    if (!plan) {
      break;
    }

    lastPlan = plan;
    currentPlan = plan;
    currentPlacement = candidate;
  }

  return lastPlan;
}

function createSingleStepPushPlan(options: {
  plan: GridLayoutPlan;
  placement: GridPanelPlacement;
  targetPlacement: GridPanelPlacement;
  columnCount: number;
  rowCount: number;
}): GridLayoutPlan | null {
  const deltaColumns =
    options.targetPlacement.columnStart - options.placement.columnStart;
  const deltaRows =
    options.targetPlacement.rowStart - options.placement.rowStart;

  const push = getPushAxisDirection({
    deltaColumns,
    deltaRows,
  });

  if (!push) {
    return null;
  }

  const replacements = new Map<GridPanelId, GridPanelPlacement>([
    [options.placement.id, options.targetPlacement],
  ]);
  const isResolved = pushBlockingPanels({
    plan: options.plan,
    replacements,
    pusherId: options.placement.id,
    axis: push.axis,
    direction: push.direction,
    columnCount: options.columnCount,
    rowCount: options.rowCount,
    stack: new Set([options.placement.id]),
  });

  if (!isResolved) {
    return null;
  }

  return replacePlacements(options.plan, replacements);
}

function getPushAxisDirection(options: {
  deltaColumns: number;
  deltaRows: number;
}): { axis: "columns" | "rows"; direction: -1 | 1 } | null {
  if (
    Math.abs(options.deltaColumns) >= Math.abs(options.deltaRows) &&
    options.deltaColumns !== 0
  ) {
    return {
      axis: "columns",
      direction: options.deltaColumns > 0 ? 1 : -1,
    };
  }

  if (options.deltaRows !== 0) {
    return {
      axis: "rows",
      direction: options.deltaRows > 0 ? 1 : -1,
    };
  }

  return null;
}

function pushBlockingPanels(options: {
  plan: GridLayoutPlan;
  replacements: Map<GridPanelId, GridPanelPlacement>;
  pusherId: GridPanelId;
  axis: "columns" | "rows";
  direction: -1 | 1;
  columnCount: number;
  rowCount: number;
  stack: Set<GridPanelId>;
}): boolean {
  while (true) {
    const pusher = getCurrentPlacement(
      options.plan,
      options.replacements,
      options.pusherId,
    );

    if (!pusher) {
      return false;
    }

    const blocker = getFirstPushBlockingPanel({
      plan: options.plan,
      replacements: options.replacements,
      pusher,
      axis: options.axis,
      direction: options.direction,
    });

    if (!blocker) {
      return true;
    }

    if (options.stack.has(blocker.id)) {
      return false;
    }

    const nextBlocker = moveBlockedPanelPastPusher({
      blocker,
      pusher,
      axis: options.axis,
      direction: options.direction,
    });

    if (
      !placementFitsGrid({
        placement: nextBlocker,
        columnCount: options.columnCount,
        rowCount: options.rowCount,
      })
    ) {
      return false;
    }

    options.replacements.set(blocker.id, nextBlocker);
    options.stack.add(blocker.id);

    const blockerIsResolved = pushBlockingPanels({
      ...options,
      pusherId: blocker.id,
    });

    options.stack.delete(blocker.id);

    if (!blockerIsResolved) {
      return false;
    }
  }
}

function getFirstPushBlockingPanel(options: {
  plan: GridLayoutPlan;
  replacements: Map<GridPanelId, GridPanelPlacement>;
  pusher: GridPanelPlacement;
  axis: "columns" | "rows";
  direction: -1 | 1;
}) {
  const indexed = options.plan.panels
    .map((placement, index) => ({
      placement: options.replacements.get(placement.id) ?? placement,
      index,
    }))
    .filter(
      ({ placement }) =>
        placement.id !== options.pusher.id &&
        placement.visible !== false &&
        placementOverlaps(placement, options.pusher),
    );

  indexed.sort((a, b) => {
    const startA = getAxisStart(a.placement, options.axis);
    const startB = getAxisStart(b.placement, options.axis);
    const axisCompare =
      options.direction > 0 ? startA - startB : startB - startA;

    if (axisCompare !== 0) {
      return axisCompare;
    }

    return a.index - b.index;
  });

  return indexed[0]?.placement ?? null;
}

function getCurrentPlacement(
  plan: GridLayoutPlan,
  replacements: Map<GridPanelId, GridPanelPlacement>,
  panelId: GridPanelId,
) {
  return replacements.get(panelId) ?? findVisiblePlacement(plan, panelId);
}

function moveBlockedPanelPastPusher(options: {
  blocker: GridPanelPlacement;
  pusher: GridPanelPlacement;
  axis: "columns" | "rows";
  direction: -1 | 1;
}) {
  const pusherStart = getAxisStart(options.pusher, options.axis);
  const pusherSpan = getAxisSpan(options.pusher, options.axis);
  const blockerSpan = getAxisSpan(options.blocker, options.axis);
  const nextStart =
    options.direction > 0
      ? pusherStart + pusherSpan
      : pusherStart - blockerSpan;

  switch (options.axis) {
    case "columns":
      return {
        ...options.blocker,
        columnStart: nextStart,
      };
    case "rows":
      return {
        ...options.blocker,
        rowStart: nextStart,
      };
    default:
      throw new Error(`Unsupported grid axis: ${String(options.axis)}`);
  }
}

function placementFitsGrid(options: {
  placement: GridPanelPlacement;
  columnCount: number;
  rowCount: number;
}) {
  return (
    options.placement.columnStart >= 1 &&
    options.placement.rowStart >= 1 &&
    options.placement.columnStart + options.placement.columnSpan - 1 <=
      options.columnCount &&
    options.placement.rowStart + options.placement.rowSpan - 1 <=
      options.rowCount
  );
}

function getGuardedPlacement(options: {
  plan: GridLayoutPlan;
  placement: GridPanelPlacement;
  targetPlacement: GridPanelPlacement;
}) {
  if (
    hasPlacementCollision({
      plan: options.plan,
      placement: options.placement,
    })
  ) {
    return options.placement;
  }

  const deltaColumns =
    options.targetPlacement.columnStart - options.placement.columnStart;
  const deltaRows =
    options.targetPlacement.rowStart - options.placement.rowStart;
  const steps = Math.max(Math.abs(deltaColumns), Math.abs(deltaRows));
  let lastPlacement = options.placement;

  for (let step = 1; step <= steps; step += 1) {
    const candidate = {
      ...options.placement,
      columnStart:
        options.placement.columnStart +
        interpolateAxisDelta(deltaColumns, step, steps),
      rowStart:
        options.placement.rowStart +
        interpolateAxisDelta(deltaRows, step, steps),
    };

    if (
      candidate.columnStart === lastPlacement.columnStart &&
      candidate.rowStart === lastPlacement.rowStart
    ) {
      continue;
    }

    if (
      hasPlacementCollision({
        plan: options.plan,
        placement: candidate,
      })
    ) {
      break;
    }

    lastPlacement = candidate;
  }

  return lastPlacement;
}

function interpolateAxisDelta(delta: number, step: number, steps: number) {
  if (delta === 0 || steps <= 0) {
    return 0;
  }

  return Math.sign(delta) * Math.round((Math.abs(delta) * step) / steps);
}
