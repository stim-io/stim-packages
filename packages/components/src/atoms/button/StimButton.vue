<script setup lang="ts">
defineProps<{
  label?: string;
}>();
</script>

<template>
  <button class="stim-button" type="button">
    <slot>
      {{ label ?? "Continue" }}
    </slot>
  </button>
</template>
