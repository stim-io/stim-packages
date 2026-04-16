<script setup lang="ts">
import { computed } from "vue";

const props = withDefaults(
  defineProps<{
    label?: string;
    size?: "sm" | "md" | "lg";
    tone?: "default" | "muted" | "accent";
  }>(),
  {
    label: "?",
    size: "md",
    tone: "default",
  },
);

const initials = computed(() => props.label.trim().slice(0, 2).toUpperCase() || "?");

const className = computed(() => [
  "stim-avatar",
  `stim-avatar--size-${props.size}`,
  `stim-avatar--tone-${props.tone}`,
]);
</script>

<template>
  <span :class="className" aria-hidden="true">
    <slot>{{ initials }}</slot>
  </span>
</template>
