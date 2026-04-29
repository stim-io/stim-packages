import type { GridLayoutPlan, GridPanelPlacement } from "../types";
import { getAxisSpan, getAxisStart } from "./placement";

export function getAdjacentPlacements(options: {
  plan: GridLayoutPlan;
  placement: GridPanelPlacement;
  axis: "columns" | "rows";
}) {
  const end =
    getAxisStart(options.placement, options.axis) +
    getAxisSpan(options.placement, options.axis);

  return options.plan.panels.filter(
    (panel) =>
      panel.id !== options.placement.id &&
      panel.visible !== false &&
      getAxisStart(panel, options.axis) === end &&
      rangesOverlapOnCrossAxis(panel, options.placement, options.axis),
  );
}

export function getNearestForwardGap(options: {
  plan: GridLayoutPlan;
  placement: GridPanelPlacement;
  axis: "columns" | "rows";
  trackCount: number;
}) {
  const start = getAxisStart(options.placement, options.axis);
  const end = start + getAxisSpan(options.placement, options.axis);
  const nearestBlockingStart = options.plan.panels
    .filter(
      (panel) =>
        panel.id !== options.placement.id &&
        panel.visible !== false &&
        getAxisStart(panel, options.axis) > end &&
        rangesOverlapOnCrossAxis(panel, options.placement, options.axis),
    )
    .map((panel) => getAxisStart(panel, options.axis))
    .sort((a, b) => a - b)[0];

  if (nearestBlockingStart === undefined) {
    return options.trackCount - end + 1;
  }

  return Math.max(0, nearestBlockingStart - end);
}

export function getNearestForwardCollisionGap(options: {
  plan: GridLayoutPlan;
  placement: GridPanelPlacement;
  axis: "columns" | "rows";
  trackCount: number;
}) {
  const start = getAxisStart(options.placement, options.axis);
  const end = start + getAxisSpan(options.placement, options.axis);
  const nearestBlockingStart = options.plan.panels
    .filter(
      (panel) =>
        panel.id !== options.placement.id &&
        panel.visible !== false &&
        getAxisStart(panel, options.axis) >= end &&
        rangesOverlapOnCrossAxis(panel, options.placement, options.axis),
    )
    .map((panel) => getAxisStart(panel, options.axis))
    .sort((a, b) => a - b)[0];

  if (nearestBlockingStart === undefined) {
    return options.trackCount - end + 1;
  }

  return Math.max(0, nearestBlockingStart - end);
}

export function rangesOverlapOnCrossAxis(
  a: GridPanelPlacement,
  b: GridPanelPlacement,
  axis: "columns" | "rows",
) {
  if (axis === "columns") {
    return rangesOverlap(a.rowStart, a.rowSpan, b.rowStart, b.rowSpan);
  }

  return rangesOverlap(
    a.columnStart,
    a.columnSpan,
    b.columnStart,
    b.columnSpan,
  );
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
      panel.visible !== false &&
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
