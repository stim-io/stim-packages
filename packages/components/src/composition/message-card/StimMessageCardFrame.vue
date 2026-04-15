<script setup lang="ts">
import { computed } from "vue";

import StimSurface from "../../primitives/surface/StimSurface.vue";

const props = withDefaults(
  defineProps<{
    roleTone?: "user" | "assistant" | "system";
    layoutFamily?: "bubble" | "card";
    verticalPressure?: "compact" | "expand" | "scroll" | "none";
    minHeightPx?: number | null;
    maxHeightPx?: number | null;
  }>(),
  {
    roleTone: "assistant",
    layoutFamily: "bubble",
    verticalPressure: "none",
    minHeightPx: null,
    maxHeightPx: null,
  },
);

const surfaceTone = computed(() => {
  switch (props.roleTone) {
    case "user":
      return "accent" as const;
    case "system":
      return "muted" as const;
    default:
      return props.layoutFamily === "card"
        ? ("elevated" as const)
        : ("default" as const);
  }
});

const styleValue = computed(() => ({
  minHeight: props.minHeightPx ? `${props.minHeightPx}px` : undefined,
  maxHeight: props.maxHeightPx ? `${props.maxHeightPx}px` : undefined,
}));

const className = computed(() => [
  "stim-message-card-frame",
  `stim-message-card-frame--role-${props.roleTone}`,
  `stim-message-card-frame--layout-${props.layoutFamily}`,
  `stim-message-card-frame--pressure-${props.verticalPressure}`,
]);
</script>

<template>
  <StimSurface
    :tone="surfaceTone"
    :class="className"
    :style="styleValue"
    :padding="layoutFamily === 'card' ? 'lg' : 'md'"
    :radius="layoutFamily === 'card' ? 'lg' : 'md'"
  >
    <slot />
  </StimSurface>
</template>
