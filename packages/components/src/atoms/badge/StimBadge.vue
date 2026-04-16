<script setup lang="ts">
import { computed } from "vue";

const props = withDefaults(
  defineProps<{
    tone?: "default" | "muted" | "accent";
    size?: "sm" | "md";
  }>(),
  {
    tone: "default",
    size: "sm",
  },
);

const className = computed(() => [
  "stim-badge",
  `stim-badge--tone-${props.tone}`,
  `stim-badge--size-${props.size}`,
]);
</script>

<template>
  <span :class="className">
    <slot />
  </span>
</template>
