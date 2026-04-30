import type { GridLayoutPlan, GridPanelPlacement } from "../types";
import { type GridAxis, gridAxis } from "./axis";
import { isPlacementVisible } from "./placement";

export function getAdjacentPlacements(options: {
  plan: GridLayoutPlan;
  placement: GridPanelPlacement;
  axis: GridAxis;
}) {
  const end = gridAxis.end(options.placement, options.axis);

  return options.plan.panels.filter(
    (panel) =>
      panel.id !== options.placement.id &&
      isPlacementVisible(panel) &&
      gridAxis.start(panel, options.axis) === end &&
      rangesOverlapOnCrossAxis(panel, options.placement, options.axis),
  );
}

export function getNearestForwardGap(options: {
  plan: GridLayoutPlan;
  placement: GridPanelPlacement;
  axis: GridAxis;
  trackCount: number;
}) {
  const end = gridAxis.end(options.placement, options.axis);
  const nearestBlockingStart = options.plan.panels
    .filter(
      (panel) =>
        panel.id !== options.placement.id &&
        isPlacementVisible(panel) &&
        gridAxis.start(panel, options.axis) > end &&
        rangesOverlapOnCrossAxis(panel, options.placement, options.axis),
    )
    .map((panel) => gridAxis.start(panel, options.axis))
    .sort((a, b) => a - b)[0];

  if (nearestBlockingStart === undefined) {
    return options.trackCount - end + 1;
  }

  return Math.max(0, nearestBlockingStart - end);
}

export function getNearestForwardCollisionGap(options: {
  plan: GridLayoutPlan;
  placement: GridPanelPlacement;
  axis: GridAxis;
  trackCount: number;
}) {
  const end = gridAxis.end(options.placement, options.axis);
  const nearestBlockingStart = options.plan.panels
    .filter(
      (panel) =>
        panel.id !== options.placement.id &&
        isPlacementVisible(panel) &&
        gridAxis.start(panel, options.axis) >= end &&
        rangesOverlapOnCrossAxis(panel, options.placement, options.axis),
    )
    .map((panel) => gridAxis.start(panel, options.axis))
    .sort((a, b) => a - b)[0];

  if (nearestBlockingStart === undefined) {
    return options.trackCount - end + 1;
  }

  return Math.max(0, nearestBlockingStart - end);
}

export function rangesOverlapOnCrossAxis(
  a: GridPanelPlacement,
  b: GridPanelPlacement,
  axis: GridAxis,
) {
  switch (axis) {
    case "columns":
      return rangesOverlap(a.rowStart, a.rowSpan, b.rowStart, b.rowSpan);
    case "rows":
      return rangesOverlap(
        a.columnStart,
        a.columnSpan,
        b.columnStart,
        b.columnSpan,
      );
    default:
      return gridAxis.unsupported(axis);
  }
}

export function placementOverlaps(
  a: GridPanelPlacement,
  b: GridPanelPlacement,
) {
  return (
    rangesOverlap(a.columnStart, a.columnSpan, b.columnStart, b.columnSpan) &&
    rangesOverlap(a.rowStart, a.rowSpan, b.rowStart, b.rowSpan)
  );
}

export function hasPlacementCollision(options: {
  plan: GridLayoutPlan;
  placement: GridPanelPlacement;
}) {
  return options.plan.panels.some(
    (panel) =>
      panel.id !== options.placement.id &&
      isPlacementVisible(panel) &&
      placementOverlaps(panel, options.placement),
  );
}

export function rangesOverlap(
  startA: number,
  spanA: number,
  startB: number,
  spanB: number,
) {
  return startA < startB + spanB && startB < startA + spanA;
}
