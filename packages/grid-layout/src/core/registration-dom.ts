import { gridData } from "../lib/grid-data";
import type {
  InternalDragTriggerRegistration,
  InternalHandleRegistration,
} from "./context";

export const registrationDom = {
  container(element: HTMLElement, options: { namespace: string; id: string }) {
    gridData.set(element, "namespace", options.namespace);
    gridData.set(element, "container", options.id);
    element.style.display = "grid";
  },

  panel(element: HTMLElement, options: { namespace: string; id: string }) {
    gridData.set(element, "namespace", options.namespace);
    gridData.set(element, "panel", options.id);
  },

  handle(
    element: HTMLElement,
    options: {
      namespace: string;
      registration: InternalHandleRegistration;
    },
  ) {
    gridData.set(element, "namespace", options.namespace);
    gridData.set(element, "handle", options.registration.id);
    gridData.set(element, "resizePanel", options.registration.panelId);
    gridData.set(element, "resizeEdge", options.registration.edge);
    gridData.set(
      element,
      "resizeStrategy",
      options.registration.resize.strategy,
    );
    element.style.touchAction = "none";
  },

  dragTrigger(
    element: HTMLElement,
    options: {
      namespace: string;
      registration: InternalDragTriggerRegistration;
    },
  ) {
    gridData.set(element, "namespace", options.namespace);
    gridData.set(element, "dragTrigger", options.registration.id);
    gridData.set(element, "dragHandle", options.registration.id);
    gridData.set(element, "dragPanel", options.registration.panelId);
    gridData.set(element, "dragStrategy", options.registration.drag.strategy);
    element.style.touchAction = "none";
  },

  preview(element: HTMLElement, options: { namespace: string; id: string }) {
    gridData.set(element, "namespace", options.namespace);
    gridData.set(element, "preview", options.id);
    element.hidden = true;
  },
} as const;
