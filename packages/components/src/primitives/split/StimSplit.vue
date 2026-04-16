<script setup lang="ts">
import { computed } from "vue";

const props = withDefaults(
  defineProps<{
    direction?: "horizontal" | "vertical";
    gap?: "none" | "xs" | "sm" | "md" | "lg";
  }>(),
  {
    direction: "horizontal",
    gap: "md",
  },
);

const className = computed(() => [
  "stim-split",
  `stim-split--direction-${props.direction}`,
  `stim-split--gap-${props.gap}`,
]);
</script>

<template>
  <div :class="className">
    <slot />
  </div>
</template>
