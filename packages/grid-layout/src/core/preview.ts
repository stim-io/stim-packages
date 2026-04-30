import type { GridLayoutPlan, GridPanelId } from "../types";
import { hidePreview, showPreview } from "../lib/projection";
import type { GridNamespaceContext } from "./context";

export const namespacePreview = {
  show(
    context: GridNamespaceContext,
    options: {
      plan: GridLayoutPlan;
      panelId: GridPanelId;
      interaction: "drag" | "resize";
    },
  ) {
    showPreview({
      ...options,
      previews: context.previews.values(),
    });
  },

  hide(context: GridNamespaceContext) {
    hidePreview(context.previews.values());
  },
} as const;
