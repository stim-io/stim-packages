<script setup lang="ts">
import { computed } from "vue";

const props = withDefaults(
  defineProps<{
    gap?: "none" | "xs" | "sm" | "md" | "lg";
    align?: "start" | "stretch" | "center" | "end";
    grow?: boolean;
    fullBlock?: boolean;
  }>(),
  {
    gap: "md",
    align: "stretch",
    grow: false,
    fullBlock: false,
  },
);

const className = computed(() => [
  "stim-stack",
  `stim-stack--gap-${props.gap}`,
  `stim-stack--align-${props.align}`,
  props.grow ? "stim-stack--grow" : null,
  props.fullBlock ? "stim-stack--full-block" : null,
]);
</script>

<template>
  <div :class="className">
    <slot />
  </div>
</template>
