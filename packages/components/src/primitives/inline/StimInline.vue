<script setup lang="ts">
import { computed } from "vue";

const props = withDefaults(
  defineProps<{
    gap?: "none" | "xs" | "sm" | "md" | "lg";
    align?: "start" | "center" | "end" | "stretch";
    justify?: "start" | "center" | "end" | "between";
    wrap?: boolean;
  }>(),
  {
    gap: "md",
    align: "center",
    justify: "start",
    wrap: false,
  },
);

const className = computed(() => [
  "stim-inline",
  `stim-inline--gap-${props.gap}`,
  `stim-inline--align-${props.align}`,
  `stim-inline--justify-${props.justify}`,
  props.wrap ? "stim-inline--wrap" : null,
]);
</script>

<template>
  <div :class="className">
    <slot />
  </div>
</template>
