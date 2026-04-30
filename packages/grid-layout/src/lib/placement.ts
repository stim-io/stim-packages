import type { GridLayoutPlan, GridPanelId, GridPanelPlacement } from "../types";

export function findVisiblePlacement(
  plan: GridLayoutPlan,
  panelId: GridPanelId,
) {
  const placement = plan.panels.find((panel) => panel.id === panelId);

  if (!placement || placement.visible === false) {
    return null;
  }

  return placement;
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

export function getAxisStart(
  placement: GridPanelPlacement,
  axis: "columns" | "rows",
) {
  switch (axis) {
    case "columns":
      return placement.columnStart;
    case "rows":
      return placement.rowStart;
    default:
      throw new Error(`Unsupported grid axis: ${String(axis)}`);
  }
}

export function getAxisSpan(
  placement: GridPanelPlacement,
  axis: "columns" | "rows",
) {
  switch (axis) {
    case "columns":
      return placement.columnSpan;
    case "rows":
      return placement.rowSpan;
    default:
      throw new Error(`Unsupported grid axis: ${String(axis)}`);
  }
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
