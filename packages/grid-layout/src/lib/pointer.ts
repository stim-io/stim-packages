export interface PointerLifecycleHandlers {
  begin(event: PointerEvent): void;
  request(event: PointerEvent): void;
  commit(event: PointerEvent): void;
  cancel(event: PointerEvent): void;
}

function add(element: HTMLElement, handlers: PointerLifecycleHandlers) {
  element.addEventListener("pointerdown", handlers.begin);
  element.addEventListener("pointermove", handlers.request);
  element.addEventListener("pointerup", handlers.commit);
  element.addEventListener("pointercancel", handlers.cancel);
}

function remove(element: HTMLElement, handlers: PointerLifecycleHandlers) {
  element.removeEventListener("pointerdown", handlers.begin);
  element.removeEventListener("pointermove", handlers.request);
  element.removeEventListener("pointerup", handlers.commit);
  element.removeEventListener("pointercancel", handlers.cancel);
}

function release(element: HTMLElement, pointerId: number) {
  if (element.hasPointerCapture(pointerId)) {
    element.releasePointerCapture(pointerId);
  }
}

export const pointerLifecycle = {
  add,
  remove,
} as const;

export const pointerCapture = {
  release,
} as const;
