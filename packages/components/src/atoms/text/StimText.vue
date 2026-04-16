<script setup lang="ts">
import { computed } from "vue";

const props = withDefaults(
  defineProps<{
    as?: "p" | "span" | "div" | "h1" | "h2" | "h3";
    tone?: "primary" | "secondary";
    size?: "body" | "eyebrow" | "display" | "label" | "caption";
  }>(),
  {
    as: "p",
    tone: "primary",
    size: "body",
  },
);

const className = computed(() => [
  "stim-text",
  `stim-text--tone-${props.tone}`,
  `stim-text--size-${props.size}`,
]);
</script>

<template>
  <component :is="as" :class="className">
    <slot />
  </component>
</template>
