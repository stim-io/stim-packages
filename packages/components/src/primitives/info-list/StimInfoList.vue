<script setup lang="ts">
import { computed } from "vue";

const props = withDefaults(
  defineProps<{
    gap?: "xs" | "sm" | "md";
  }>(),
  {
    gap: "sm",
  },
);

const className = computed(() => [
  "stim-info-list",
  `stim-info-list--gap-${props.gap}`,
]);
</script>

<template>
  <dl :class="className">
    <slot />
  </dl>
</template>
