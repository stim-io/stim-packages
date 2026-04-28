<script setup lang="ts">
import { computed } from "vue";

const props = withDefaults(
  defineProps<{
    as?: "p" | "span" | "div" | "h1" | "h2" | "h3";
    tone?: "primary" | "secondary" | "danger";
    size?: "body" | "eyebrow" | "display" | "label" | "caption";
    truncate?: boolean;
  }>(),
  {
    as: "p",
    tone: "primary",
    size: "body",
    truncate: false,
  },
);

const className = computed(() => [
  "stim-text",
  `stim-text--tone-${props.tone}`,
  `stim-text--size-${props.size}`,
  props.truncate ? "stim-text--truncate" : null,
]);
</script>

<template>
  <component :is="as" :class="className">
    <slot />
  </component>
</template>
