<script setup lang="ts">
import { computed } from "vue";

const props = withDefaults(
  defineProps<{
    gap?: "xs" | "sm" | "md" | "lg";
    align?: "start" | "stretch" | "center";
  }>(),
  {
    gap: "md",
    align: "stretch",
  },
);

const className = computed(() => [
  "stim-stack",
  `stim-stack--gap-${props.gap}`,
  `stim-stack--align-${props.align}`,
]);
</script>

<template>
  <div :class="className">
    <slot />
  </div>
</template>
