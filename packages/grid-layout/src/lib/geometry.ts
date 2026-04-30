import type { GridContainerRegistration } from "../types";

export function getContainerForElement(
  containers: Iterable<GridContainerRegistration>,
  element: HTMLElement,
) {
  const allContainers = [...containers];
  const owningContainers = allContainers.filter((container) =>
    container.element.contains(element),
  );

  return owningContainers.at(-1) ?? allContainers[0];
}

export function getTrackStepSize(
  container: HTMLElement,
  axis: "columns" | "rows",
  trackCount: number,
  rect: DOMRect,
) {
  const style = getComputedStyle(container);
  const { gap, totalSize } = getAxisGeometry({ axis, rect, style });
  const availableSize = Math.max(
    0,
    totalSize - gap * Math.max(0, trackCount - 1),
  );

  return availableSize / trackCount + gap;
}

function getAxisGeometry(options: {
  axis: "columns" | "rows";
  rect: DOMRect;
  style: CSSStyleDeclaration;
}) {
  switch (options.axis) {
    case "columns":
      return {
        gap: parseCssPixelValue(options.style.columnGap),
        totalSize: options.rect.width,
      };
    case "rows":
      return {
        gap: parseCssPixelValue(options.style.rowGap),
        totalSize: options.rect.height,
      };
    default:
      throw new Error(`Unsupported grid axis: ${String(options.axis)}`);
  }
}

function parseCssPixelValue(value: string) {
  const parsed = Number.parseFloat(value);

  if (!Number.isFinite(parsed)) {
    return 0;
  }

  return parsed;
}
