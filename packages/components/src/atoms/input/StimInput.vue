<script setup lang="ts">
const model = defineModel<string>({ required: true });

import { computed } from "vue";

const props = withDefaults(
  defineProps<{
    placeholder?: string;
    size?: "sm" | "md";
    type?: string;
  }>(),
  {
    placeholder: undefined,
    size: "md",
    type: "text",
  },
);

const className = computed(() => [
  "stim-input",
  `stim-input--size-${props.size}`,
]);
</script>

<template>
  <input
    v-model="model"
    :class="className"
    :placeholder="placeholder"
    :type="type"
  />
</template>
