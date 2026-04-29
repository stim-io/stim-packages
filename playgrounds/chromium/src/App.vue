<script setup lang="ts">
import { onMounted, ref } from "vue";
import {
  applyStimPlaygroundTheme,
  type PlaygroundEngine,
} from "@stim-io/playground";
import GridLayoutView from "./views/grid-layout/GridLayoutView.vue";

const engine: PlaygroundEngine = "chromium";
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
    <GridLayoutView />
  </main>
</template>

<style>
.playground-shell {
  min-height: 100vh;
  padding: var(--stim-space-4);
}
</style>
