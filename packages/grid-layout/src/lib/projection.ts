import type {
  GridLayoutPlan,
  GridPanelId,
  GridPanelPlacement,
  GridPanelRegistration,
  GridPreviewRegistration,
  GridContainerRegistration,
} from "../types";
import { gridData } from "./grid-data";
import { findVisiblePlacement, isPlacementVisible } from "./placement";
import { toTemplate } from "./plan";

export function projectPlan(options: {
  plan: GridLayoutPlan;
  containers: Iterable<GridContainerRegistration>;
  panels: Iterable<GridPanelRegistration>;
  skipPanelIds?: ReadonlySet<GridPanelId>;
}) {
  for (const container of options.containers) {
    gridData.set(container.element, "mode", options.plan.mode ?? "");
    container.element.style.gridTemplateColumns = toTemplate(
      options.plan.columns,
    );
    container.element.style.gridTemplateRows = toTemplate(options.plan.rows);
  }

  const placementByPanel = new Map(
    options.plan.panels.map((placement) => [placement.id, placement]),
  );

  for (const panel of options.panels) {
    if (options.skipPanelIds?.has(panel.id)) {
      continue;
    }

    const placement = placementByPanel.get(panel.id);

    if (!placement || !isPlacementVisible(placement)) {
      gridData.set(panel.element, "panelVisible", "false");
      panel.element.hidden = true;
      clearPlacementStyle(panel.element);
      continue;
    }

    panel.element.hidden = false;
    gridData.set(panel.element, "panelVisible", "true");
    projectPlacementStyle(panel.element, placement);
  }
}

export function showPreview(options: {
  plan: GridLayoutPlan;
  panelId: GridPanelId;
  interaction: "drag" | "resize";
  previews: Iterable<GridPreviewRegistration>;
}) {
  const placement = findVisiblePlacement(options.plan, options.panelId);

  if (!placement) {
    hidePreview(options.previews);
    return;
  }

  for (const preview of options.previews) {
    preview.element.hidden = false;
    gridData.set(preview.element, "previewPanel", options.panelId);
    gridData.set(preview.element, "previewInteraction", options.interaction);
    projectPlacementStyle(preview.element, placement);
  }
}

export function hidePreview(previews: Iterable<GridPreviewRegistration>) {
  for (const preview of previews) {
    preview.element.hidden = true;
    clearPlacementStyle(preview.element);
    gridData.clear(preview.element, "previewPanel");
    gridData.clear(preview.element, "previewInteraction");
  }
}

function projectPlacementStyle(
  element: HTMLElement,
  placement: GridPanelPlacement,
) {
  element.style.gridColumn = formatPlacementTrack(
    placement.columnStart,
    placement.columnSpan,
  );
  element.style.gridRow = formatPlacementTrack(
    placement.rowStart,
    placement.rowSpan,
  );
}

function clearPlacementStyle(element: HTMLElement) {
  element.style.gridColumn = "";
  element.style.gridRow = "";
}

function formatPlacementTrack(start: number, span: number) {
  return `${start} / span ${span}`;
}
