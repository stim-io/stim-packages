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

<style>
.stim-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: var(--stim-size-control-md);
  padding-inline: var(--stim-space-4);
  padding-block: var(--stim-space-2);
  border: 1px solid var(--stim-color-border-strong);
  border-radius: var(--stim-radius-control);
  background: var(--stim-color-surface-accent);
  color: var(--stim-color-text-on-accent);
  font: inherit;
  font-weight: var(--stim-font-weight-medium);
  line-height: 1;
  cursor: pointer;
  transition:
    background-color 160ms ease,
    border-color 160ms ease,
    box-shadow 160ms ease,
    transform 160ms ease;
}

.stim-button:hover {
  background: var(--stim-color-surface-accent-hover);
}

.stim-button:focus-visible {
  outline: none;
  box-shadow: var(--stim-focus-ring);
}

.stim-button:active {
  transform: translateY(1px);
}

.stim-button:disabled {
  cursor: not-allowed;
  opacity: 0.56;
}
</style>
