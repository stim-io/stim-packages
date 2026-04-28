<script setup lang="ts">
import { computed } from "vue";

const props = withDefaults(
  defineProps<{
    summary: string;
    caption?: string | null;
    open?: boolean;
  }>(),
  {
    caption: null,
    open: false,
  },
);

const className = computed(() => ["stim-disclosure"]);
</script>

<template>
  <details :class="className" :open="open">
    <summary class="stim-disclosure__summary">
      <span class="stim-disclosure__title">{{ summary }}</span>
      <span v-if="caption" class="stim-disclosure__caption">{{ caption }}</span>
    </summary>
    <div class="stim-disclosure__body">
      <slot />
    </div>
  </details>
</template>
