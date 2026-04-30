import type {
  GridLayoutPlan,
  GridPanelId,
  GridPanelPlacement,
} from "../../types";
import {
  type GridAxis,
  type GridAxisDirection,
  gridAxis,
} from "../../lib/axis";
import { placementOverlaps } from "../../lib/collision";
import { isPlacementVisible, replacePlacements } from "../../lib/placement";
import {
  getCurrentPlacement,
  getDragPlacementDelta,
  placementFitsGrid,
  walkDragStepPlacements,
} from "./shared";

export function createPushPlan(options: {
  plan: GridLayoutPlan;
  placement: GridPanelPlacement;
  targetPlacement: GridPanelPlacement;
  columnCount: number;
  rowCount: number;
}): GridLayoutPlan | null {
  let lastPlan: GridLayoutPlan | null = null;
  let currentPlan = options.plan;
  let currentPlacement = options.placement;

  for (const candidate of walkDragStepPlacements(options)) {
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
  const delta = getDragPlacementDelta(options);
  const push = getPushAxisDirection(delta);

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
  columns: number;
  rows: number;
}): { axis: GridAxis; direction: GridAxisDirection } | null {
  if (
    Math.abs(options.columns) >= Math.abs(options.rows) &&
    options.columns !== 0
  ) {
    return {
      axis: "columns",
      direction: options.columns > 0 ? 1 : -1,
    };
  }

  if (options.rows !== 0) {
    return {
      axis: "rows",
      direction: options.rows > 0 ? 1 : -1,
    };
  }

  return null;
}

function pushBlockingPanels(options: {
  plan: GridLayoutPlan;
  replacements: Map<GridPanelId, GridPanelPlacement>;
  pusherId: GridPanelId;
  axis: GridAxis;
  direction: GridAxisDirection;
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
  axis: GridAxis;
  direction: GridAxisDirection;
}) {
  const indexed = options.plan.panels
    .map((placement, index) => ({
      placement: options.replacements.get(placement.id) ?? placement,
      index,
    }))
    .filter(
      ({ placement }) =>
        placement.id !== options.pusher.id &&
        isPlacementVisible(placement) &&
        placementOverlaps(placement, options.pusher),
    );

  indexed.sort((a, b) => {
    const startA = gridAxis.start(a.placement, options.axis);
    const startB = gridAxis.start(b.placement, options.axis);
    const axisCompare =
      options.direction > 0 ? startA - startB : startB - startA;

    if (axisCompare !== 0) {
      return axisCompare;
    }

    return a.index - b.index;
  });

  return indexed[0]?.placement ?? null;
}

function moveBlockedPanelPastPusher(options: {
  blocker: GridPanelPlacement;
  pusher: GridPanelPlacement;
  axis: GridAxis;
  direction: GridAxisDirection;
}) {
  const pusherStart = gridAxis.start(options.pusher, options.axis);
  const pusherSpan = gridAxis.span(options.pusher, options.axis);
  const blockerSpan = gridAxis.span(options.blocker, options.axis);
  const nextStart =
    options.direction > 0
      ? pusherStart + pusherSpan
      : pusherStart - blockerSpan;

  return gridAxis.setStart(options.blocker, options.axis, nextStart);
}
