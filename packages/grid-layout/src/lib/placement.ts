import type { GridLayoutPlan, GridPanelId, GridPanelPlacement } from "../types";

export function findVisiblePlacement(
  plan: GridLayoutPlan,
  panelId: GridPanelId,
) {
  const placement = plan.panels.find((panel) => panel.id === panelId);

  if (!placement || !isPlacementVisible(placement)) {
    return null;
  }

  return placement;
}

export function isPlacementVisible(placement: GridPanelPlacement) {
  return placement.visible !== false;
}

export function replacePlacement(
  plan: GridLayoutPlan,
  panelId: GridPanelId,
  nextPlacement: GridPanelPlacement,
) {
  return {
    ...plan,
    panels: plan.panels.map((placement) =>
      placement.id === panelId ? nextPlacement : placement,
    ),
  };
}

export function replacePlacements(
  plan: GridLayoutPlan,
  replacements: ReadonlyMap<GridPanelId, GridPanelPlacement>,
) {
  return {
    ...plan,
    panels: plan.panels.map(
      (placement) => replacements.get(placement.id) ?? placement,
    ),
  };
}

export function clampDelta(value: number, min: number, max: number) {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.min(max, Math.max(min, Math.trunc(value)));
}

export function clampInteger(value: number, min: number, max: number) {
  const normalized =
    !Number.isFinite(value) || value < 1 ? 1 : Math.floor(value);

  return Math.min(max, Math.max(min, normalized));
}
