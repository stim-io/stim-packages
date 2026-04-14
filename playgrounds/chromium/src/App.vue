<script setup lang="ts">
import { onMounted, ref } from "vue";
import { StimButton } from "@stim-io/components";
import {
  applyStimPlaygroundTheme,
  createPlaygroundTitle,
  type PlaygroundEngine,
} from "@stim-io/shared";

const engine: PlaygroundEngine = "chromium";
const title = createPlaygroundTitle("stim-packages", engine);
const ready = ref(false);

onMounted(async () => {
  await applyStimPlaygroundTheme({ theme: "dark", engine });
  ready.value = true;
});
</script>

<template>
  <main
    class="playground-shell"
    data-playground="chromium"
    :data-ready="String(ready)"
  >
    <section class="playground-card">
      <p class="playground-eyebrow">chromium verification</p>
      <h1 class="playground-title">{{ title }}</h1>
      <p class="playground-copy">
        This playground exists to expose Chromium-specific visual friction in
        atoms, layout primitives, and theme patches before anything leaks into
        `stim`.
      </p>
      <StimButton label="Chromium atom" />
    </section>
  </main>
</template>

<style>
.playground-shell {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: var(--stim-space-8);
}

.playground-card {
  width: min(100%, 40rem);
  padding: var(--stim-space-8);
  border-radius: var(--stim-radius-lg);
  border: 1px solid
    color-mix(in srgb, var(--stim-color-border-strong) 40%, transparent);
  background: color-mix(
    in srgb,
    var(--stim-color-surface-elevated) 84%,
    transparent
  );
}

.playground-eyebrow {
  margin: 0 0 var(--stim-space-3);
  text-transform: uppercase;
  letter-spacing: 0.14em;
  color: var(--stim-color-text-secondary);
}

.playground-title {
  margin: 0;
  line-height: 1.1;
}

.playground-copy {
  margin: var(--stim-space-4) 0 var(--stim-space-8);
  color: var(--stim-color-text-secondary);
  line-height: 1.7;
}
</style>
