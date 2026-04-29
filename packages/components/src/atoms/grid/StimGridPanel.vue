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
const dragHandleRoot = ref<HTMLElement | null>(null);
const handleRoot = ref<HTMLElement | null>(null);
const context = inject(stimGridContextKey);
let panelRegistration: GridPanelRegistration | null = null;
let handleRegistration: GridHandleRegistration | null = null;
let dragHandleRegistration: GridDragHandleRegistration | null = null;

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
  dragHandleRegistration?.unregister();
  dragHandleRegistration = null;
  handleRegistration?.unregister();
  handleRegistration = null;
  panelRegistration?.unregister();
  panelRegistration = null;
});

const resizeEdge = computed<GridResizeEdge | null>(() => {
  if (props.resize === true) {
    return "inline-end";
  }

  if (props.resize === false) {
    return null;
  }

  return props.resize;
});

const resizeHandleId = computed(() =>
  resizeEdge.value ? `${props.id}-${resizeEdge.value}` : null,
);

const dragHandleId = computed(() => (props.drag ? `${props.id}-drag` : null));

const resizeHandleClassName = computed(() => [
  "stim-grid-resize-handle",
  resizeEdge.value ? `stim-grid-resize-handle--edge-${resizeEdge.value}` : null,
]);

const resizeHandleOrientation = computed(() =>
  resizeEdge.value === "block-end" ? "horizontal" : "vertical",
);

function registerPanel() {
  if (!root.value || !context?.ns.value) {
    return;
  }

  panelRegistration?.unregister();
  panelRegistration = context.ns.value.register.panel(root.value, {
    id: props.id,
  });
  registerDragHandle();
  registerHandle();
}

function registerDragHandle() {
  dragHandleRegistration?.unregister();
  dragHandleRegistration = null;

  if (!dragHandleRoot.value || !context?.ns.value || !dragHandleId.value) {
    return;
  }

  dragHandleRegistration = context.ns.value.register.dragHandle(
    dragHandleRoot.value,
    {
      id: dragHandleId.value,
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
      ref="dragHandleRoot"
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
