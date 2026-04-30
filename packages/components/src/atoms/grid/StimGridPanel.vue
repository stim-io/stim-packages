<script setup lang="ts">
import {
  computed,
  inject,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
} from "vue";
import type {
  GridDragHandleRegistration,
  GridDragOptions,
  GridHandleRegistration,
  GridPanelRegistration,
  GridResizeEdge,
  GridResizeOptions,
} from "@stim-io/grid-layout";
import { stimGridContextKey } from "./context";

const props = withDefaults(
  defineProps<{
    id: string;
    drag?: boolean;
    dragOptions?: GridDragOptions;
    dragAriaLabel?: string;
    resize?: boolean | GridResizeEdge;
    resizeOptions?: GridResizeOptions;
    resizeMinColumnSpan?: number;
    resizeMinRowSpan?: number;
    resizeAriaLabel?: string;
  }>(),
  {
    drag: false,
    dragAriaLabel: "Move panel",
    resize: false,
    resizeAriaLabel: "Resize panel",
  },
);

const root = ref<HTMLElement | null>(null);
const dragTriggerRoot = ref<HTMLElement | null>(null);
const handleRoot = ref<HTMLElement | null>(null);
const context = inject(stimGridContextKey);
let panelRegistration: GridPanelRegistration | null = null;
let handleRegistration: GridHandleRegistration | null = null;
let dragTriggerRegistration: GridDragHandleRegistration | null = null;

if (!context) {
  throw new Error("StimGridPanel must be rendered inside StimGridContainer");
}

onMounted(async () => {
  await nextTick();
  registerPanel();
});

watch(
  () =>
    [
      context.ns.value,
      props.id,
      props.drag,
      props.dragOptions?.strategy,
      props.resize,
      props.resizeOptions?.strategy,
      props.resizeMinColumnSpan,
      props.resizeMinRowSpan,
    ] as const,
  async () => {
    await nextTick();
    registerPanel();
  },
);

onBeforeUnmount(() => {
  dragTriggerRegistration?.unregister();
  dragTriggerRegistration = null;
  handleRegistration?.unregister();
  handleRegistration = null;
  panelRegistration?.unregister();
  panelRegistration = null;
});

const resizeEdge = computed<GridResizeEdge | null>(() => {
  switch (props.resize) {
    case true:
      return "inline-end";
    case false:
      return null;
    case "inline-end":
    case "block-end":
      return props.resize;
    default:
      throw new Error(
        `Unsupported grid resize option: ${String(props.resize)}`,
      );
  }
});

const resizeHandleId = computed(() =>
  resizeEdge.value ? `${props.id}-${resizeEdge.value}` : null,
);

const dragTriggerId = computed(() => (props.drag ? `${props.id}-drag` : null));

const resizeHandleClassName = computed(() => [
  "stim-grid-resize-handle",
  resizeEdge.value ? `stim-grid-resize-handle--edge-${resizeEdge.value}` : null,
]);

const resizeHandleOrientation = computed(() => {
  switch (resizeEdge.value) {
    case "block-end":
      return "horizontal";
    case "inline-end":
    case null:
      return "vertical";
    default:
      throw new Error(`Unsupported resize edge: ${String(resizeEdge.value)}`);
  }
});

function registerPanel() {
  if (!root.value || !context?.ns.value) {
    return;
  }

  panelRegistration?.unregister();
  panelRegistration = context.ns.value.register.panel(root.value, {
    id: props.id,
  });
  registerDragTrigger();
  registerHandle();
}

function registerDragTrigger() {
  dragTriggerRegistration?.unregister();
  dragTriggerRegistration = null;

  if (!dragTriggerRoot.value || !context?.ns.value || !dragTriggerId.value) {
    return;
  }

  dragTriggerRegistration = context.ns.value.register.dragHandle(
    dragTriggerRoot.value,
    {
      id: dragTriggerId.value,
      panelId: props.id,
      drag: props.dragOptions,
    },
  );
}

function registerHandle() {
  handleRegistration?.unregister();
  handleRegistration = null;

  if (!handleRoot.value || !context?.ns.value || !resizeEdge.value) {
    return;
  }

  handleRegistration = context.ns.value.register.handle(handleRoot.value, {
    id: resizeHandleId.value ?? `${props.id}-${resizeEdge.value}`,
    panelId: props.id,
    edge: resizeEdge.value,
    resize: props.resizeOptions,
    minColumnSpan: props.resizeMinColumnSpan,
    minRowSpan: props.resizeMinRowSpan,
  });
}
</script>

<template>
  <section ref="root" class="stim-grid-panel" :data-stim-grid-panel="id">
    <slot />
    <button
      v-if="drag"
      ref="dragTriggerRoot"
      class="stim-grid-drag-handle"
      type="button"
      :aria-label="dragAriaLabel"
    />
    <button
      v-if="resizeEdge"
      ref="handleRoot"
      :class="resizeHandleClassName"
      type="button"
      role="separator"
      :aria-label="resizeAriaLabel"
      :aria-orientation="resizeHandleOrientation"
    />
  </section>
</template>
