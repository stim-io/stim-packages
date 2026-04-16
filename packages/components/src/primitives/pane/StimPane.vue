<script setup lang="ts">
import { computed } from "vue";

const props = withDefaults(
  defineProps<{
    tone?: "default" | "elevated" | "muted";
    padding?: "none" | "sm" | "md" | "lg";
    radius?: "none" | "sm" | "md" | "lg";
    border?: "none" | "subtle" | "strong";
    grow?: boolean;
    scroll?: boolean;
    inlineSize?: string;
    minInlineSize?: string;
    maxInlineSize?: string;
  }>(),
  {
    tone: "default",
    padding: "md",
    radius: "md",
    border: "subtle",
    grow: false,
    scroll: false,
    inlineSize: undefined,
    minInlineSize: undefined,
    maxInlineSize: undefined,
  },
);

const className = computed(() => [
  "stim-pane",
  `stim-pane--tone-${props.tone}`,
  `stim-pane--padding-${props.padding}`,
  `stim-pane--radius-${props.radius}`,
  `stim-pane--border-${props.border}`,
  props.grow ? "stim-pane--grow" : null,
  props.scroll ? "stim-pane--scroll" : null,
]);

const styleValue = computed(() => ({
  inlineSize: props.inlineSize,
  minInlineSize: props.minInlineSize,
  maxInlineSize: props.maxInlineSize,
}));
</script>

<template>
  <section :class="className" :style="styleValue">
    <slot />
  </section>
</template>
