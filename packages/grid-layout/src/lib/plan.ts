import type { GridLayoutPlan, GridTrackSet } from "../types";

export function normalizePlan(plan: GridLayoutPlan): GridLayoutPlan {
  return {
    mode: plan.mode,
    columns: cloneTrackSet(plan.columns),
    rows: cloneTrackSet(plan.rows),
    panels: plan.panels.map((placement) => ({
      ...placement,
      columnStart: normalizePositiveInteger(placement.columnStart),
      columnSpan: normalizePositiveInteger(placement.columnSpan),
      rowStart: normalizePositiveInteger(placement.rowStart),
      rowSpan: normalizePositiveInteger(placement.rowSpan),
    })),
  };
}

export function clonePlan(plan: GridLayoutPlan): GridLayoutPlan {
  return {
    mode: plan.mode,
    columns: cloneTrackSet(plan.columns),
    rows: cloneTrackSet(plan.rows),
    panels: plan.panels.map((placement) => ({ ...placement })),
  };
}

export function toTemplate(trackSet: GridTrackSet): string {
  if (typeof trackSet === "number") {
    return `repeat(${normalizePositiveInteger(trackSet)}, minmax(0, 1fr))`;
  }

  if (typeof trackSet === "string") {
    return trackSet;
  }

  return trackSet.join(" ");
}

export function getNumericTrackCount(trackSet: GridTrackSet) {
  if (typeof trackSet === "number") {
    return normalizePositiveInteger(trackSet);
  }

  if (Array.isArray(trackSet)) {
    return normalizePositiveInteger(trackSet.length);
  }

  return null;
}

export function normalizePositiveInteger(value: number) {
  if (!Number.isFinite(value) || value < 1) {
    return 1;
  }

  return Math.floor(value);
}

function cloneTrackSet(trackSet: GridTrackSet): GridTrackSet {
  if (Array.isArray(trackSet)) {
    return [...trackSet];
  }

  return trackSet;
}
