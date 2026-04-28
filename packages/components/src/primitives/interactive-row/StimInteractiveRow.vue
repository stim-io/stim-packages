<script setup lang="ts">
import { computed } from "vue";

const props = withDefaults(
  defineProps<{
    active?: boolean;
    justify?: "start" | "center" | "between";
    tone?: "default" | "muted" | "accent";
    padding?: "sm" | "md";
    radius?: "sm" | "md" | "lg";
  }>(),
  {
    active: false,
    justify: "start",
    tone: "default",
    padding: "md",
    radius: "md",
  },
);

const className = computed(() => [
  "stim-interactive-row",
  `stim-interactive-row--justify-${props.justify}`,
  `stim-interactive-row--tone-${props.tone}`,
  `stim-interactive-row--padding-${props.padding}`,
  `stim-interactive-row--radius-${props.radius}`,
  props.active ? "stim-interactive-row--active" : null,
]);
</script>

<template>
  <button :class="className" type="button">
    <slot />
  </button>
</template>
