<script setup lang="ts">
import { computed, ref } from "vue";
import { StimGridContainer, StimGridPanel } from "@stim-io/components";
import type {
  GridDragStrategy,
  GridLayoutPlan,
  GridResizeStrategy,
} from "@stim-io/grid-layout";

type DemoMode = "default" | "focus" | "compact";

const mode = ref<DemoMode>("default");
const dragStrategy = ref<GridDragStrategy>("reflow");
const resizeStrategy = ref<GridResizeStrategy>("adjacent");
const dragStrategies: readonly GridDragStrategy[] = [
  "reflow",
  "push",
  "free",
  "guarded",
];
const resizeStrategies: readonly GridResizeStrategy[] = [
  "adjacent",
  "free",
  "guarded",
];
const plans: Record<DemoMode, GridLayoutPlan> = {
  default: {
    mode: "default",
    columns: 24,
    rows: 12,
    panels: [
      { id: "rail", columnStart: 1, columnSpan: 2, rowStart: 1, rowSpan: 12 },
      {
        id: "sessions",
        columnStart: 3,
        columnSpan: 5,
        rowStart: 1,
        rowSpan: 6,
      },
      {
        id: "conversation",
        columnStart: 8,
        columnSpan: 11,
        rowStart: 1,
        rowSpan: 12,
      },
      { id: "tools", columnStart: 19, columnSpan: 4, rowStart: 1, rowSpan: 7 },
      {
        id: "context",
        columnStart: 19,
        columnSpan: 4,
        rowStart: 8,
        rowSpan: 5,
      },
    ],
  },
  focus: {
    mode: "focus",
    columns: 24,
    rows: 12,
    panels: [
      { id: "rail", columnStart: 1, columnSpan: 2, rowStart: 1, rowSpan: 12 },
      {
        id: "sessions",
        columnStart: 1,
        columnSpan: 1,
        rowStart: 1,
        rowSpan: 1,
        visible: false,
      },
      {
        id: "conversation",
        columnStart: 3,
        columnSpan: 17,
        rowStart: 1,
        rowSpan: 12,
      },
      { id: "tools", columnStart: 20, columnSpan: 5, rowStart: 1, rowSpan: 12 },
      {
        id: "context",
        columnStart: 1,
        columnSpan: 1,
        rowStart: 1,
        rowSpan: 1,
        visible: false,
      },
    ],
  },
  compact: {
    mode: "compact",
    columns: 12,
    rows: 10,
    panels: [
      { id: "rail", columnStart: 1, columnSpan: 1, rowStart: 1, rowSpan: 10 },
      {
        id: "sessions",
        columnStart: 2,
        columnSpan: 3,
        rowStart: 1,
        rowSpan: 10,
      },
      {
        id: "conversation",
        columnStart: 5,
        columnSpan: 8,
        rowStart: 1,
        rowSpan: 7,
      },
      { id: "tools", columnStart: 5, columnSpan: 8, rowStart: 8, rowSpan: 3 },
      {
        id: "context",
        columnStart: 1,
        columnSpan: 1,
        rowStart: 1,
        rowSpan: 1,
        visible: false,
      },
    ],
  },
};

const layoutPlan = ref<GridLayoutPlan>(cloneLayoutPlan(plans.default));
const visiblePanels = computed(
  () =>
    layoutPlan.value.panels.filter((panel) => panel.visible !== false).length,
);
const conversationSpan = computed(
  () =>
    layoutPlan.value.panels.find((panel) => panel.id === "conversation")
      ?.columnSpan ?? 0,
);
const toolsSpan = computed(
  () =>
    layoutPlan.value.panels.find((panel) => panel.id === "tools")?.rowSpan ?? 0,
);
const gridSize = computed(
  () => `${layoutPlan.value.columns} × ${layoutPlan.value.rows}`,
);

function setMode(nextMode: DemoMode) {
  mode.value = nextMode;
  layoutPlan.value = cloneLayoutPlan(plans[nextMode]);
}

function setDragStrategy(nextStrategy: GridDragStrategy) {
  dragStrategy.value = nextStrategy;
}

function setResizeStrategy(nextStrategy: GridResizeStrategy) {
  resizeStrategy.value = nextStrategy;
}

function cloneLayoutPlan(plan: GridLayoutPlan): GridLayoutPlan {
  return {
    mode: plan.mode,
    columns: plan.columns,
    rows: plan.rows,
    panels: plan.panels.map((panel) => ({ ...panel })),
  };
}
</script>

<template>
  <section
    class="grid-layout-view"
    data-grid-layout-demo
    :data-grid-mode="mode"
    :data-grid-drag-strategy="dragStrategy"
    :data-grid-resize-strategy="resizeStrategy"
    aria-label="Flat namespace grid layout demo"
  >
    <div class="grid-layout-view__controls">
      <div class="grid-layout-view__control-group" aria-label="Layout modes">
        <span class="grid-layout-view__control-label">layout</span>
        <button
          v-for="modeName in Object.keys(plans)"
          :key="modeName"
          class="grid-layout-view__option"
          type="button"
          :aria-pressed="mode === modeName"
          :data-grid-mode-option="modeName"
          @click="setMode(modeName as DemoMode)"
        >
          {{ modeName }}
        </button>
      </div>

      <div class="grid-layout-view__control-group" aria-label="Drag strategy">
        <span class="grid-layout-view__control-label">drag</span>
        <button
          v-for="strategy in dragStrategies"
          :key="strategy"
          class="grid-layout-view__option"
          type="button"
          :aria-pressed="dragStrategy === strategy"
          :data-grid-drag-strategy-option="strategy"
          @click="setDragStrategy(strategy)"
        >
          {{ strategy }}
        </button>
      </div>

      <div class="grid-layout-view__control-group" aria-label="Resize strategy">
        <span class="grid-layout-view__control-label">resize</span>
        <button
          v-for="strategy in resizeStrategies"
          :key="strategy"
          class="grid-layout-view__option"
          type="button"
          :aria-pressed="resizeStrategy === strategy"
          :data-grid-resize-strategy-option="strategy"
          @click="setResizeStrategy(strategy)"
        >
          {{ strategy }}
        </button>
      </div>
    </div>

    <StimGridContainer
      class="grid-layout-view__grid"
      v-model:plan="layoutPlan"
      aria-label="Stim main grid namespace"
    >
      <StimGridPanel id="rail">
        <div class="grid-layout-view__panel-content">rail</div>
      </StimGridPanel>

      <StimGridPanel
        id="sessions"
        drag
        :drag-options="{ strategy: dragStrategy }"
        drag-aria-label="Move sessions panel"
      >
        <div class="grid-layout-view__panel-content">sessions</div>
      </StimGridPanel>

      <StimGridPanel
        id="conversation"
        resize="inline-end"
        :resize-options="{ strategy: resizeStrategy }"
        :resize-min-column-span="resizeStrategy === 'adjacent' ? undefined : 8"
        resize-aria-label="Resize conversation panel"
      >
        <div class="grid-layout-view__panel-content">
          <span>conversation</span>
          <dl class="grid-layout-view__metrics">
            <div>
              <dt>namespace</dt>
              <dd data-grid-layout-metric="namespace">default</dd>
            </div>
            <div>
              <dt>mode</dt>
              <dd data-grid-layout-metric="mode">{{ mode }}</dd>
            </div>
            <div>
              <dt>grid</dt>
              <dd data-grid-layout-metric="grid">{{ gridSize }}</dd>
            </div>
            <div>
              <dt>visible panels</dt>
              <dd data-grid-layout-metric="visible-panels">
                {{ visiblePanels }}
              </dd>
            </div>
            <div>
              <dt>conversation span</dt>
              <dd data-grid-layout-metric="conversation-span">
                {{ conversationSpan }}
              </dd>
            </div>
            <div>
              <dt>tools span</dt>
              <dd data-grid-layout-metric="tools-span">
                {{ toolsSpan }}
              </dd>
            </div>
            <div>
              <dt>drag</dt>
              <dd data-grid-layout-metric="drag-strategy">
                {{ dragStrategy }}
              </dd>
            </div>
            <div>
              <dt>resize</dt>
              <dd data-grid-layout-metric="resize-strategy">
                {{ resizeStrategy }}
              </dd>
            </div>
          </dl>
        </div>
      </StimGridPanel>

      <StimGridPanel
        id="tools"
        resize="block-end"
        :resize-options="{ strategy: resizeStrategy }"
        :resize-min-row-span="3"
        resize-aria-label="Resize tools panel"
      >
        <div class="grid-layout-view__panel-content">tools</div>
      </StimGridPanel>

      <StimGridPanel id="context">
        <div class="grid-layout-view__panel-content">context</div>
      </StimGridPanel>
    </StimGridContainer>
  </section>
</template>

<style>
.grid-layout-view {
  min-height: calc(100vh - var(--stim-space-8));
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  gap: var(--stim-space-3);
}

.grid-layout-view__controls {
  display: flex;
  flex-wrap: wrap;
  gap: var(--stim-space-2);
}

.grid-layout-view__control-group {
  display: flex;
  align-items: center;
  gap: var(--stim-space-2);
}

.grid-layout-view__control-label {
  color: var(--stim-color-text-secondary);
}

.grid-layout-view__option {
  border: 1px solid var(--stim-color-border-strong);
  padding: var(--stim-space-2) var(--stim-space-3);
  color: var(--stim-color-text-primary);
  background: transparent;
}

.grid-layout-view__option[aria-pressed="true"] {
  outline: 2px solid var(--stim-color-border-strong);
}

.grid-layout-view__grid {
  min-height: 0;
}

.grid-layout-view__panel-content {
  min-width: 0;
  min-height: 0;
  padding: var(--stim-space-3);
}

.grid-layout-view__metrics {
  display: grid;
  grid-template-columns: repeat(8, minmax(0, 1fr));
  gap: var(--stim-space-2);
  margin: var(--stim-space-3) 0 0;
}

.grid-layout-view__metrics dt {
  color: var(--stim-color-text-secondary);
}

.grid-layout-view__metrics dd {
  margin: 0;
}
</style>
