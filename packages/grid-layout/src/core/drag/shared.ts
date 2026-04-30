import type {
  GridLayoutPlan,
  GridPanelId,
  GridPanelPlacement,
} from "../../types";
import {
  clampInteger,
  findVisiblePlacement,
  replacePlacement,
} from "../../lib/placement";

export interface GridDragPlacementDelta {
  columns: number;
  rows: number;
}

export function createPlacementDragPlan(options: {
  plan: GridLayoutPlan;
  panelId: GridPanelId;
  placement: GridPanelPlacement;
  proposedPlacement: GridPanelPlacement;
}) {
  if (hasSameGridStart(options.proposedPlacement, options.placement)) {
    return null;
  }

  return replacePlacement(
    options.plan,
    options.panelId,
    options.proposedPlacement,
  );
}

export function createTargetPlacement(options: {
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

export function getDragPlacementDelta(options: {
  placement: GridPanelPlacement;
  targetPlacement: GridPanelPlacement;
}): GridDragPlacementDelta {
  return {
    columns:
      options.targetPlacement.columnStart - options.placement.columnStart,
    rows: options.targetPlacement.rowStart - options.placement.rowStart,
  };
}

function getDragStepCount(delta: GridDragPlacementDelta) {
  return Math.max(Math.abs(delta.columns), Math.abs(delta.rows));
}

export function* walkDragStepPlacements(options: {
  placement: GridPanelPlacement;
  targetPlacement: GridPanelPlacement;
}) {
  const delta = getDragPlacementDelta(options);
  const steps = getDragStepCount(delta);
  let lastPlacement = options.placement;

  for (let step = 1; step <= steps; step += 1) {
    const candidate = createSteppedPlacement({
      placement: options.placement,
      delta,
      step,
      steps,
    });

    if (hasSameGridStart(candidate, lastPlacement)) {
      continue;
    }

    yield candidate;
    lastPlacement = candidate;
  }
}

function createSteppedPlacement(options: {
  placement: GridPanelPlacement;
  delta: GridDragPlacementDelta;
  step: number;
  steps: number;
}) {
  return {
    ...options.placement,
    columnStart:
      options.placement.columnStart +
      interpolateAxisDelta(options.delta.columns, options.step, options.steps),
    rowStart:
      options.placement.rowStart +
      interpolateAxisDelta(options.delta.rows, options.step, options.steps),
  };
}

function hasSameGridStart(a: GridPanelPlacement, b: GridPanelPlacement) {
  return a.columnStart === b.columnStart && a.rowStart === b.rowStart;
}

export function getCurrentPlacement(
  plan: GridLayoutPlan,
  replacements: Map<GridPanelId, GridPanelPlacement>,
  panelId: GridPanelId,
) {
  return replacements.get(panelId) ?? findVisiblePlacement(plan, panelId);
}

export function placementFitsGrid(options: {
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

function interpolateAxisDelta(delta: number, step: number, steps: number) {
  if (delta === 0 || steps <= 0) {
    return 0;
  }

  return Math.sign(delta) * Math.round((Math.abs(delta) * step) / steps);
}
