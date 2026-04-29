import type {
  GridLayoutPlan,
  GridPanelId,
  GridPanelRegistration,
  GridPreviewRegistration,
  GridContainerRegistration,
} from "../types";
import { toTemplate } from "./plan";

export function projectPlan(options: {
  plan: GridLayoutPlan;
  containers: Iterable<GridContainerRegistration>;
  panels: Iterable<GridPanelRegistration>;
}) {
  for (const container of options.containers) {
    container.element.dataset.stimGridMode = options.plan.mode ?? "";
    container.element.style.gridTemplateColumns = toTemplate(
      options.plan.columns,
    );
    container.element.style.gridTemplateRows = toTemplate(options.plan.rows);
  }

  const placementByPanel = new Map(
    options.plan.panels.map((placement) => [placement.id, placement]),
  );

  for (const panel of options.panels) {
    const placement = placementByPanel.get(panel.id);

    if (!placement || placement.visible === false) {
      panel.element.dataset.stimGridPanelVisible = "false";
      panel.element.hidden = true;
      panel.element.style.gridColumn = "";
      panel.element.style.gridRow = "";
      continue;
    }

    panel.element.hidden = false;
    panel.element.dataset.stimGridPanelVisible = "true";
    panel.element.style.gridColumn = `${placement.columnStart} / span ${placement.columnSpan}`;
    panel.element.style.gridRow = `${placement.rowStart} / span ${placement.rowSpan}`;
  }
}

export function showPreview(options: {
  plan: GridLayoutPlan;
  panelId: GridPanelId;
  interaction: "drag" | "resize";
  previews: Iterable<GridPreviewRegistration>;
}) {
  const placement = options.plan.panels.find(
    (panel) => panel.id === options.panelId,
  );

  if (!placement || placement.visible === false) {
    hidePreview(options.previews);
    return;
  }

  for (const preview of options.previews) {
    preview.element.hidden = false;
    preview.element.dataset.stimGridPreviewPanel = options.panelId;
    preview.element.dataset.stimGridPreviewInteraction = options.interaction;
    preview.element.style.gridColumn = `${placement.columnStart} / span ${placement.columnSpan}`;
    preview.element.style.gridRow = `${placement.rowStart} / span ${placement.rowSpan}`;
  }
}

export function hidePreview(previews: Iterable<GridPreviewRegistration>) {
  for (const preview of previews) {
    preview.element.hidden = true;
    preview.element.style.gridColumn = "";
    preview.element.style.gridRow = "";
    delete preview.element.dataset.stimGridPreviewPanel;
    delete preview.element.dataset.stimGridPreviewInteraction;
  }
}
