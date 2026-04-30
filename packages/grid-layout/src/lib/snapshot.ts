export function snapshotElement(element: HTMLElement) {
  return {
    display: element.style.display,
    gridTemplateColumns: element.style.gridTemplateColumns,
    gridTemplateRows: element.style.gridTemplateRows,
    gridColumn: element.style.gridColumn,
    gridRow: element.style.gridRow,
    touchAction: element.style.touchAction,
    hidden: element.hidden,
    namespace: element.dataset.stimGridNamespace,
    container: element.dataset.stimGridContainer,
    panel: element.dataset.stimGridPanel,
    handle: element.dataset.stimGridHandle,
    preview: element.dataset.stimGridPreview,
    previewPanel: element.dataset.stimGridPreviewPanel,
    previewInteraction: element.dataset.stimGridPreviewInteraction,
    dragTrigger: element.dataset.stimGridDragTrigger,
    dragHandle: element.dataset.stimGridDragHandle,
    dragPanel: element.dataset.stimGridDragPanel,
    dragStrategy: element.dataset.stimGridDragStrategy,
    dragging: element.dataset.stimGridDragging,
    resizePanel: element.dataset.stimGridResizePanel,
    resizeEdge: element.dataset.stimGridResizeEdge,
    resizing: element.dataset.stimGridResizing,
    panelVisible: element.dataset.stimGridPanelVisible,
    mode: element.dataset.stimGridMode,
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
  restoreDatasetValue(element, "stimGridNamespace", snapshot.namespace);
  restoreDatasetValue(element, "stimGridContainer", snapshot.container);
  restoreDatasetValue(element, "stimGridPanel", snapshot.panel);
  restoreDatasetValue(element, "stimGridHandle", snapshot.handle);
  restoreDatasetValue(element, "stimGridPreview", snapshot.preview);
  restoreDatasetValue(element, "stimGridPreviewPanel", snapshot.previewPanel);
  restoreDatasetValue(
    element,
    "stimGridPreviewInteraction",
    snapshot.previewInteraction,
  );
  restoreDatasetValue(element, "stimGridDragTrigger", snapshot.dragTrigger);
  restoreDatasetValue(element, "stimGridDragHandle", snapshot.dragHandle);
  restoreDatasetValue(element, "stimGridDragPanel", snapshot.dragPanel);
  restoreDatasetValue(element, "stimGridDragStrategy", snapshot.dragStrategy);
  restoreDatasetValue(element, "stimGridDragging", snapshot.dragging);
  restoreDatasetValue(element, "stimGridResizePanel", snapshot.resizePanel);
  restoreDatasetValue(element, "stimGridResizeEdge", snapshot.resizeEdge);
  restoreDatasetValue(element, "stimGridResizing", snapshot.resizing);
  restoreDatasetValue(element, "stimGridPanelVisible", snapshot.panelVisible);
  restoreDatasetValue(element, "stimGridMode", snapshot.mode);
}

function restoreDatasetValue(
  element: HTMLElement,
  key: keyof HTMLElement["dataset"],
  value: string | undefined,
) {
  if (value === undefined) {
    delete element.dataset[key];
    return;
  }

  element.dataset[key] = value;
}
