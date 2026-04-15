<script setup lang="ts">
import { computed } from "vue";

const props = withDefaults(
  defineProps<{
    padding?: "md" | "lg" | "xl";
    align?: "center" | "start";
  }>(),
  {
    padding: "xl",
    align: "center",
  },
);

const className = computed(() => [
  "stim-viewport-stage",
  `stim-viewport-stage--padding-${props.padding}`,
  `stim-viewport-stage--align-${props.align}`,
]);
</script>

<template>
  <main :class="className">
    <slot />
  </main>
</template>
