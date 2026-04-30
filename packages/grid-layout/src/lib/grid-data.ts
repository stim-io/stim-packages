const names = {
  namespace: "stimGridNamespace",
  container: "stimGridContainer",
  panel: "stimGridPanel",
  handle: "stimGridHandle",
  preview: "stimGridPreview",
  previewPanel: "stimGridPreviewPanel",
  previewInteraction: "stimGridPreviewInteraction",
  dragTrigger: "stimGridDragTrigger",
  dragHandle: "stimGridDragHandle",
  dragPanel: "stimGridDragPanel",
  dragStrategy: "stimGridDragStrategy",
  dragging: "stimGridDragging",
  dragSnapshot: "stimGridDragSnapshot",
  resizePanel: "stimGridResizePanel",
  resizeEdge: "stimGridResizeEdge",
  resizeStrategy: "stimGridResizeStrategy",
  resizing: "stimGridResizing",
  panelVisible: "stimGridPanelVisible",
  mode: "stimGridMode",
} as const;

export type GridDataName = keyof typeof names;
export type GridDataSnapshot = Partial<Record<GridDataName, string>>;

function get(element: HTMLElement, name: GridDataName) {
  return element.dataset[names[name]];
}

function set(element: HTMLElement, name: GridDataName, value: string) {
  element.dataset[names[name]] = value;
}

function clear(element: HTMLElement, name: GridDataName) {
  delete element.dataset[names[name]];
}

function restore(
  element: HTMLElement,
  name: GridDataName,
  value: string | undefined,
) {
  if (value === undefined) {
    clear(element, name);
    return;
  }

  set(element, name, value);
}

function snapshot(element: HTMLElement, targetNames: readonly GridDataName[]) {
  const snapshot: GridDataSnapshot = {};

  for (const name of targetNames) {
    snapshot[name] = get(element, name);
  }

  return snapshot;
}

export const gridData = {
  get,
  set,
  clear,
  restore,
  snapshot,
} as const;
