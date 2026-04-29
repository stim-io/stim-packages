<script setup lang="ts">
import {
  nextTick,
  onBeforeUnmount,
  onMounted,
  provide,
  ref,
  shallowRef,
  watch,
} from "vue";
import {
  GridNamespace,
  type GridContainerRegistration,
  type GridLayoutPlan,
  type GridPreviewRegistration,
} from "@stim-io/grid-layout";
import { stimGridContextKey } from "./context";

const props = withDefaults(
  defineProps<{
    namespace?: string;
    plan: GridLayoutPlan;
    containerId?: string;
    ariaLabel?: string;
  }>(),
  {
    namespace: "default",
    containerId: "default",
    ariaLabel: "Grid container",
  },
);

const emit = defineEmits<{
  "update:plan": [plan: GridLayoutPlan];
}>();

const root = ref<HTMLElement | null>(null);
const previewRoot = ref<HTMLElement | null>(null);
const ns = shallowRef<GridNamespace | null>(null);
let containerRegistration: GridContainerRegistration | null = null;
let previewRegistration: GridPreviewRegistration | null = null;
let stopLayoutRequest: (() => void) | null = null;

provide(stimGridContextKey, { ns });

onMounted(async () => {
  await nextTick();
  mountNamespace();
});

watch(
  () => [props.namespace, props.containerId],
  async () => {
    await nextTick();
    mountNamespace();
  },
);

watch(
  () => props.plan,
  (plan) => {
    ns.value?.layout.apply(plan);
  },
  { deep: true },
);

onBeforeUnmount(() => {
  stopLayoutRequest?.();
  stopLayoutRequest = null;
  previewRegistration?.unregister();
  previewRegistration = null;
  containerRegistration?.unregister();
  containerRegistration = null;
  ns.value?.destroy();
  ns.value = null;
});

function mountNamespace() {
  if (!root.value || !previewRoot.value) {
    return;
  }

  previewRegistration?.unregister();
  previewRegistration = null;
  containerRegistration?.unregister();
  containerRegistration = null;
  stopLayoutRequest?.();
  stopLayoutRequest = null;
  ns.value?.destroy();
  ns.value = GridNamespace.create(props.namespace);
  stopLayoutRequest = ns.value.events.on("layoutrequest", (event) => {
    emit("update:plan", event.plan);
  });
  containerRegistration = ns.value.register.container(root.value, {
    id: props.containerId,
    plan: props.plan,
  });
  previewRegistration = ns.value.register.preview(previewRoot.value);
}
</script>

<template>
  <div
    ref="root"
    class="stim-grid-container"
    :aria-label="ariaLabel"
    :data-grid-namespace="namespace"
  >
    <div ref="previewRoot" class="stim-grid-preview" aria-hidden="true" />
    <slot />
  </div>
</template>
