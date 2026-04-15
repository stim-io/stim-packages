<script setup lang="ts">
import { computed } from "vue";

const props = withDefaults(
  defineProps<{
    tone?: "default" | "elevated" | "accent" | "muted";
    padding?: "none" | "sm" | "md" | "lg";
    radius?: "sm" | "md" | "lg";
  }>(),
  {
    tone: "default",
    padding: "md",
    radius: "md",
  },
);

const className = computed(() => [
  "stim-surface",
  `stim-surface--tone-${props.tone}`,
  `stim-surface--padding-${props.padding}`,
  `stim-surface--radius-${props.radius}`,
]);
</script>

<template>
  <div :class="className">
    <slot />
  </div>
</template>
