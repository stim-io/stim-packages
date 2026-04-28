<script setup lang="ts">
import { computed } from "vue";

import StimAvatar from "../../atoms/avatar/StimAvatar.vue";
import StimText from "../../atoms/text/StimText.vue";
import StimInline from "../../primitives/inline/StimInline.vue";
import StimStack from "../../primitives/stack/StimStack.vue";

const props = withDefaults(
  defineProps<{
    role?: "user" | "assistant" | "system";
    author: string;
    sentAtLabel: string;
    metaLabel?: string | null;
    metaTone?: "neutral" | "danger";
    avatarLabel?: string | null;
  }>(),
  {
    role: "assistant",
    metaLabel: null,
    metaTone: "neutral",
    avatarLabel: null,
  },
);

const isUser = computed(() => props.role === "user");
const avatarTone = computed(() => (isUser.value ? "accent" : "muted"));
const className = computed(() => [
  "stim-message-row",
  `stim-message-row--${props.role}`,
]);
const displayAvatarLabel = computed(() => props.avatarLabel ?? props.author);
</script>

<template>
  <div :class="className">
    <StimInline
      class="stim-message-row__inner"
      :justify="isUser ? 'end' : 'start'"
      align="start"
      gap="sm"
    >
      <StimAvatar
        v-if="!isUser"
        :label="displayAvatarLabel"
        :tone="avatarTone"
        size="md"
      />

      <StimStack class="stim-message-row__content" gap="xs">
        <StimInline :justify="isUser ? 'end' : 'start'" gap="sm" wrap>
          <StimText as="span" size="label">{{ author }}</StimText>
          <StimText as="span" size="caption" tone="secondary">
            {{ sentAtLabel }}
          </StimText>
          <StimText
            v-if="metaLabel"
            as="span"
            :tone="metaTone === 'danger' ? 'primary' : 'secondary'"
            size="caption"
          >
            {{ metaLabel }}
          </StimText>
        </StimInline>
        <slot />
      </StimStack>

      <StimAvatar
        v-if="isUser"
        :label="displayAvatarLabel"
        :tone="avatarTone"
        size="md"
      />
    </StimInline>
  </div>
</template>
