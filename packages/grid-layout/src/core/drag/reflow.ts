import type {
  GridLayoutPlan,
  GridPanelId,
  GridPanelPlacement,
} from "../../types";
import { placementOverlaps } from "../../lib/collision";
import { isPlacementVisible, replacePlacements } from "../../lib/placement";
import { getCurrentPlacement, walkDragStepPlacements } from "./shared";

export function createReflowPlan(options: {
  plan: GridLayoutPlan;
  placement: GridPanelPlacement;
  targetPlacement: GridPanelPlacement;
  rowCount: number;
}): GridLayoutPlan | null {
  let lastPlan: GridLayoutPlan | null = null;
  let currentPlan = options.plan;
  let currentPlacement = options.placement;

  for (const candidate of walkDragStepPlacements(options)) {
    const plan = createSingleStepReflowPlan({
      plan: currentPlan,
      placement: currentPlacement,
      targetPlacement: candidate,
      rowCount: options.rowCount,
    });

    if (!plan) {
      break;
    }

    lastPlan = plan;
    currentPlan = plan;
    currentPlacement = candidate;
  }

  return lastPlan;
}

function createSingleStepReflowPlan(options: {
  plan: GridLayoutPlan;
  placement: GridPanelPlacement;
  targetPlacement: GridPanelPlacement;
  rowCount: number;
}): GridLayoutPlan | null {
  const replacements = new Map<GridPanelId, GridPanelPlacement>([
    [options.placement.id, options.targetPlacement],
  ]);

  pushReflowCollisionsDown({
    plan: options.plan,
    replacements,
    pusherId: options.placement.id,
  });
  compactReflowPanelsUp({
    plan: options.plan,
    replacements,
    activePanelId: options.placement.id,
  });

  const nextPlan = replacePlacements(options.plan, replacements);

  if (getPlanBottom(nextPlan) - 1 > options.rowCount) {
    return null;
  }

  return nextPlan;
}

function pushReflowCollisionsDown(options: {
  plan: GridLayoutPlan;
  replacements: Map<GridPanelId, GridPanelPlacement>;
  pusherId: GridPanelId;
}) {
  const queue = [options.pusherId];

  while (queue.length > 0) {
    const pusherId = queue.shift();
    const pusher =
      pusherId === undefined
        ? null
        : getCurrentPlacement(options.plan, options.replacements, pusherId);

    if (!pusher) {
      continue;
    }

    for (const blocker of getReflowBlockingPanels({
      plan: options.plan,
      replacements: options.replacements,
      pusher,
    })) {
      const nextBlocker = {
        ...blocker,
        rowStart: pusher.rowStart + pusher.rowSpan,
      };

      if (nextBlocker.rowStart === blocker.rowStart) {
        continue;
      }

      options.replacements.set(blocker.id, nextBlocker);
      queue.push(blocker.id);
    }
  }
}

function getReflowBlockingPanels(options: {
  plan: GridLayoutPlan;
  replacements: Map<GridPanelId, GridPanelPlacement>;
  pusher: GridPanelPlacement;
}) {
  return options.plan.panels
    .map((placement, index) => ({
      placement: options.replacements.get(placement.id) ?? placement,
      index,
    }))
    .filter(
      ({ placement }) =>
        placement.id !== options.pusher.id &&
        isPlacementVisible(placement) &&
        placementOverlaps(placement, options.pusher),
    )
    .sort((a, b) => compareReflowOrder(a, b))
    .map(({ placement }) => placement);
}

function compactReflowPanelsUp(options: {
  plan: GridLayoutPlan;
  replacements: Map<GridPanelId, GridPanelPlacement>;
  activePanelId: GridPanelId;
}) {
  const activePlacement = getCurrentPlacement(
    options.plan,
    options.replacements,
    options.activePanelId,
  );
  const blockers = activePlacement ? [activePlacement] : [];
  const panels = options.plan.panels
    .map((placement, index) => ({
      placement: options.replacements.get(placement.id) ?? placement,
      index,
    }))
    .filter(
      ({ placement }) =>
        isPlacementVisible(placement) && placement.id !== options.activePanelId,
    )
    .sort((a, b) => compareReflowOrder(a, b));

  for (const { placement } of panels) {
    let compacted = placement;

    while (compacted.rowStart > 1) {
      const candidate = {
        ...compacted,
        rowStart: compacted.rowStart - 1,
      };

      if (blockers.some((blocker) => placementOverlaps(blocker, candidate))) {
        break;
      }

      compacted = candidate;
    }

    options.replacements.set(placement.id, compacted);
    blockers.push(compacted);
  }
}

function compareReflowOrder(
  a: { placement: GridPanelPlacement; index: number },
  b: { placement: GridPanelPlacement; index: number },
) {
  return (
    a.placement.rowStart - b.placement.rowStart ||
    a.placement.columnStart - b.placement.columnStart ||
    a.index - b.index
  );
}

function getPlanBottom(plan: GridLayoutPlan) {
  return Math.max(
    1,
    ...plan.panels
      .filter((placement) => isPlacementVisible(placement))
      .map((placement) => placement.rowStart + placement.rowSpan),
  );
}
