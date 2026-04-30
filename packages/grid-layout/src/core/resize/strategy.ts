import type {
  GridLayoutPlan,
  GridPanelId,
  GridPanelPlacement,
  GridResizeEdge,
  GridResizeStrategy,
} from "../../types";
import {
  getAdjacentPlacements,
  getNearestForwardCollisionGap,
  getNearestForwardGap,
} from "../../lib/collision";
import {
  clampDelta,
  getAxisSpan,
  getAxisStart,
  findVisiblePlacement,
  replacePlacement,
  replacePlacements,
} from "../../lib/placement";
import { getNumericTrackCount } from "../../lib/plan";

export interface CreateGridResizePlanOptions {
  plan: GridLayoutPlan;
  panelId: GridPanelId;
  edge: GridResizeEdge;
  strategy?: GridResizeStrategy;
  deltaCells: number;
  minColumnSpan: number;
  minRowSpan: number;
}

export function createResizePlan(
  options: CreateGridResizePlanOptions,
): GridLayoutPlan | null {
  const placement = findVisiblePlacement(options.plan, options.panelId);
  const strategy = options.strategy ?? "adjacent";

  if (!placement) {
    return null;
  }

  const nextPlacement = { ...placement };

  switch (options.edge) {
    case "inline-end": {
      const columnCount = getNumericTrackCount(options.plan.columns);

      if (!columnCount) {
        return null;
      }

      const deltaColumns = getBoundedResizeDelta({
        plan: options.plan,
        placement,
        axis: "columns",
        trackCount: columnCount,
        requestedDelta: options.deltaCells,
        minSpan: options.minColumnSpan,
        strategy,
      });

      if (deltaColumns === 0) {
        return null;
      }

      nextPlacement.columnSpan = placement.columnSpan + deltaColumns;

      return createResizeResultPlan({
        plan: options.plan,
        panelId: options.panelId,
        placement,
        nextPlacement,
        axis: "columns",
        delta: deltaColumns,
        strategy,
      });
    }
    case "block-end": {
      const rowCount = getNumericTrackCount(options.plan.rows);

      if (!rowCount) {
        return null;
      }

      const deltaRows = getBoundedResizeDelta({
        plan: options.plan,
        placement,
        axis: "rows",
        trackCount: rowCount,
        requestedDelta: options.deltaCells,
        minSpan: options.minRowSpan,
        strategy,
      });

      if (deltaRows === 0) {
        return null;
      }

      nextPlacement.rowSpan = placement.rowSpan + deltaRows;

      return createResizeResultPlan({
        plan: options.plan,
        panelId: options.panelId,
        placement,
        nextPlacement,
        axis: "rows",
        delta: deltaRows,
        strategy,
      });
    }
    default:
      throw new Error(`Unsupported resize edge: ${String(options.edge)}`);
  }
}

function createResizeResultPlan(options: {
  plan: GridLayoutPlan;
  panelId: GridPanelId;
  placement: GridPanelPlacement;
  nextPlacement: GridPanelPlacement;
  axis: "columns" | "rows";
  delta: number;
  strategy: GridResizeStrategy;
}) {
  switch (options.strategy) {
    case "free":
    case "guarded":
      return replacePlacement(
        options.plan,
        options.panelId,
        options.nextPlacement,
      );
    case "adjacent":
      return replacePlacements(
        options.plan,
        new Map([
          [options.panelId, options.nextPlacement],
          ...getAdjustedAdjacentPlacements({
            plan: options.plan,
            placement: options.placement,
            axis: options.axis,
            delta: options.delta,
          }).map((adjacent) => [adjacent.id, adjacent] as const),
        ]),
      );
    default:
      throw new Error(
        `Unsupported resize strategy: ${String(options.strategy)}`,
      );
  }
}

function getBoundedResizeDelta(options: {
  plan: GridLayoutPlan;
  placement: GridPanelPlacement;
  axis: "columns" | "rows";
  trackCount: number;
  requestedDelta: number;
  minSpan: number;
  strategy: GridResizeStrategy;
}) {
  const { axis, placement, requestedDelta, minSpan, strategy, trackCount } =
    options;
  const span = getAxisSpan(placement, axis);
  const end = getAxisStart(placement, axis) + span;
  const minDelta = minSpan - span;
  const maxDeltaToTrackEnd = trackCount - end + 1;

  switch (strategy) {
    case "free":
      return clampDelta(requestedDelta, minDelta, maxDeltaToTrackEnd);
    case "guarded": {
      const maxDeltaToForwardCollision =
        requestedDelta > 0
          ? getNearestForwardCollisionGap(options)
          : maxDeltaToTrackEnd;

      return clampDelta(
        requestedDelta,
        minDelta,
        Math.min(maxDeltaToTrackEnd, maxDeltaToForwardCollision),
      );
    }
    case "adjacent": {
      const adjacentPlacements = getAdjacentPlacements(options);

      if (requestedDelta > 0) {
        const maxDeltaToAdjacentMinSpan = adjacentPlacements.length
          ? Math.min(
              ...adjacentPlacements.map((adjacent) =>
                Math.max(0, getAxisSpan(adjacent, axis) - minSpan),
              ),
            )
          : Number.POSITIVE_INFINITY;
        const maxDeltaToForwardBlocker = getNearestForwardGap(options);

        return clampDelta(
          requestedDelta,
          minDelta,
          Math.min(
            maxDeltaToTrackEnd,
            maxDeltaToAdjacentMinSpan,
            maxDeltaToForwardBlocker,
          ),
        );
      }

      return clampDelta(requestedDelta, minDelta, maxDeltaToTrackEnd);
    }
    default:
      throw new Error(`Unsupported resize strategy: ${String(strategy)}`);
  }
}

function getAdjustedAdjacentPlacements(options: {
  plan: GridLayoutPlan;
  placement: GridPanelPlacement;
  axis: "columns" | "rows";
  delta: number;
}) {
  if (options.delta === 0) {
    return [];
  }

  return getAdjacentPlacements(options).map((adjacent) => {
    switch (options.axis) {
      case "columns":
        return {
          ...adjacent,
          columnStart: adjacent.columnStart + options.delta,
          columnSpan: adjacent.columnSpan - options.delta,
        };
      case "rows":
        return {
          ...adjacent,
          rowStart: adjacent.rowStart + options.delta,
          rowSpan: adjacent.rowSpan - options.delta,
        };
      default:
        throw new Error(`Unsupported grid axis: ${String(options.axis)}`);
    }
  });
}
