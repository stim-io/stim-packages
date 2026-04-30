import { type GridDataName, gridData } from "./grid-data";

const snapshottedGridDataNames = [
  "namespace",
  "container",
  "panel",
  "handle",
  "preview",
  "previewPanel",
  "previewInteraction",
  "dragTrigger",
  "dragHandle",
  "dragPanel",
  "dragStrategy",
  "dragging",
  "dragSnapshot",
  "resizePanel",
  "resizeEdge",
  "resizeStrategy",
  "resizing",
  "panelVisible",
  "mode",
] satisfies readonly GridDataName[];

export function snapshotElement(element: HTMLElement) {
  return {
    display: element.style.display,
    gridTemplateColumns: element.style.gridTemplateColumns,
    gridTemplateRows: element.style.gridTemplateRows,
    gridColumn: element.style.gridColumn,
    gridRow: element.style.gridRow,
    touchAction: element.style.touchAction,
    hidden: element.hidden,
    data: gridData.snapshot(element, snapshottedGridDataNames),
  };
}

export function restoreElement(
  element: HTMLElement,
  snapshot: ReturnType<typeof snapshotElement>,
) {
  element.style.display = snapshot.display;
  element.style.gridTemplateColumns = snapshot.gridTemplateColumns;
  element.style.gridTemplateRows = snapshot.gridTemplateRows;
  element.style.gridColumn = snapshot.gridColumn;
  element.style.gridRow = snapshot.gridRow;
  element.style.touchAction = snapshot.touchAction;
  element.hidden = snapshot.hidden;

  for (const name of snapshottedGridDataNames) {
    gridData.restore(element, name, snapshot.data[name]);
  }
}
