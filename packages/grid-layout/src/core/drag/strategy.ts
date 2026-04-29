import type {
  GridDragStrategy,
  GridLayoutPlan,
  GridPanelId,
  GridPanelPlacement,
} from "../../types";
import { hasPlacementCollision } from "../../lib/collision";
import {
  clampInteger,
  findVisiblePlacement,
  replacePlacement,
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

  if (!columnCount || !rowCount || !placement) {
    return null;
  }

  const nextPlacement = {
    ...placement,
    columnStart: clampInteger(
      placement.columnStart + options.deltaColumns,
      1,
      Math.max(1, columnCount - placement.columnSpan + 1),
    ),
    rowStart: clampInteger(
      placement.rowStart + options.deltaRows,
      1,
      Math.max(1, rowCount - placement.rowSpan + 1),
    ),
  };

  const proposedPlacement =
    options.strategy === "guarded"
      ? getGuardedPlacement({
          plan: options.plan,
          placement,
          targetPlacement: nextPlacement,
        })
      : nextPlacement;

  if (
    proposedPlacement.columnStart === placement.columnStart &&
    proposedPlacement.rowStart === placement.rowStart
  ) {
    return null;
  }

  return replacePlacement(options.plan, options.panelId, proposedPlacement);
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
