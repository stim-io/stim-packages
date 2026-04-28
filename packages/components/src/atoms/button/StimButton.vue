<script setup lang="ts">
import { computed } from "vue";

const props = withDefaults(
  defineProps<{
    label?: string;
    size?: "sm" | "md";
    variant?: "primary" | "secondary" | "ghost";
    pressed?: boolean;
  }>(),
  {
    label: undefined,
    size: "md",
    variant: "primary",
    pressed: false,
  },
);

const className = computed(() => [
  "stim-button",
  `stim-button--size-${props.size}`,
  `stim-button--${props.variant}`,
  props.pressed ? "stim-button--pressed" : null,
]);
</script>

<template>
  <button
    :aria-pressed="pressed ? 'true' : undefined"
    :class="className"
    type="button"
  >
    <slot>
      {{ label ?? "Continue" }}
    </slot>
  </button>
</template>
