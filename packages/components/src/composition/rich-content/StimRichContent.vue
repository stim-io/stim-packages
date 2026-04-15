<script setup lang="ts">
import { computed, h } from "vue";

const props = defineProps<{
  kind: "text" | "raw-html" | "stim-dom-fragment";
  text?: string;
  html?: string;
  tree?: unknown;
}>();

const className = computed(() => [
  "stim-rich-content",
  `stim-rich-content--kind-${props.kind}`,
]);

type FragmentNode = {
  tag?: string;
  text?: string;
  props?: Record<string, unknown>;
  children?: FragmentNode[];
};

function isFragmentNode(value: unknown): value is FragmentNode {
  return typeof value === "object" && value !== null;
}

function sanitizeProps(props: Record<string, unknown> | undefined) {
  if (!props) {
    return undefined;
  }

  return Object.fromEntries(
    Object.entries(props).filter(([key, value]) => {
      return (
        (key === "class" || key === "title" || key.startsWith("data-")) &&
        typeof value === "string"
      );
    }),
  );
}

function renderFragmentNode(
  node: unknown,
): ReturnType<typeof h> | string | null {
  if (!isFragmentNode(node)) {
    return null;
  }

  if (typeof node.text === "string") {
    return node.text;
  }

  if (typeof node.tag !== "string") {
    return null;
  }

  const children = Array.isArray(node.children)
    ? node.children
        .map((child) => renderFragmentNode(child))
        .filter(
          (child): child is ReturnType<typeof h> | string => child !== null,
        )
    : undefined;

  return h(node.tag, sanitizeProps(node.props), children);
}

const fragmentTree = computed(() => renderFragmentNode(props.tree));
</script>

<template>
  <div :class="className" data-probe="rich-content" :data-content-kind="kind">
    <pre
      v-if="kind === 'text'"
      class="stim-rich-content__text"
      data-probe="rich-content-text"
    >{{
      text ?? ""
    }}</pre>
    <component
      :is="fragmentTree"
      v-else-if="kind === 'stim-dom-fragment' && fragmentTree"
      class="stim-rich-content__fragment"
      data-probe="rich-content-fragment"
    />
    <div
      v-else
      class="stim-rich-content__html"
      data-probe="rich-content-html"
      v-html="html ?? ''"
    />
  </div>
</template>
