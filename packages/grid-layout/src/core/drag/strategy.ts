import type {
  GridDragStrategy,
  GridLayoutPlan,
  GridPanelId,
} from "../../types";
import { findVisiblePlacement } from "../../lib/placement";
import { getNumericTrackCount } from "../../lib/plan";
import { unreachable } from "../../lib/unreachable";
import { getGuardedPlacement } from "./guarded";
import { createPushPlan } from "./push";
import { createReflowPlan } from "./reflow";
import { createPlacementDragPlan, createTargetPlacement } from "./shared";

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
      return unreachable(strategy, "Unsupported drag strategy");
  }
}
