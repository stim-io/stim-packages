import type { GridLayoutPlan, GridPanelPlacement } from "../../types";
import { hasPlacementCollision } from "../../lib/collision";
import { walkDragStepPlacements } from "./shared";

export function getGuardedPlacement(options: {
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

  let lastPlacement = options.placement;

  for (const candidate of walkDragStepPlacements(options)) {
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
