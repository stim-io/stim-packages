<script setup lang="ts">
const model = defineModel<string>({ required: true });

defineProps<{
  placeholder?: string;
  type?: string;
}>();
</script>

<template>
  <input
    v-model="model"
    class="stim-input"
    :placeholder="placeholder"
    :type="type ?? 'text'"
  />
</template>
