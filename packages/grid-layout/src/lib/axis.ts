import type { GridPanelPlacement } from "../types";
import { unreachable } from "./unreachable";

export type GridAxis = "columns" | "rows";
export type GridAxisDirection = -1 | 1;

function start(placement: GridPanelPlacement, axis: GridAxis) {
  switch (axis) {
    case "columns":
      return placement.columnStart;
    case "rows":
      return placement.rowStart;
    default:
      return unsupported(axis);
  }
}

function span(placement: GridPanelPlacement, axis: GridAxis) {
  switch (axis) {
    case "columns":
      return placement.columnSpan;
    case "rows":
      return placement.rowSpan;
    default:
      return unsupported(axis);
  }
}

function end(placement: GridPanelPlacement, axis: GridAxis) {
  return start(placement, axis) + span(placement, axis);
}

function setStart(
  placement: GridPanelPlacement,
  axis: GridAxis,
  start: number,
) {
  switch (axis) {
    case "columns":
      return {
        ...placement,
        columnStart: start,
      };
    case "rows":
      return {
        ...placement,
        rowStart: start,
      };
    default:
      return unsupported(axis);
  }
}

function setSpan(placement: GridPanelPlacement, axis: GridAxis, span: number) {
  switch (axis) {
    case "columns":
      return {
        ...placement,
        columnSpan: span,
      };
    case "rows":
      return {
        ...placement,
        rowSpan: span,
      };
    default:
      return unsupported(axis);
  }
}

function unsupported(axis: never): never {
  return unreachable(axis, "Unsupported grid axis");
}

export const gridAxis = {
  start,
  span,
  end,
  setStart,
  setSpan,
  unsupported,
} as const;
