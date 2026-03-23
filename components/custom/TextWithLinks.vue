<script setup lang="ts">
  import { computed } from 'vue';
  import { splitTextWithLinks } from '@/utils/splitTextWithLinks';

  const props = withDefaults(
    defineProps<{
      text: string;
    }>(),
    { text: '' }
  );

  const segments = computed(() => splitTextWithLinks(props.text));
</script>

<template>
  <span class="inline align-baseline">
    <template v-for="(seg, i) in segments" :key="i">
      <a
        v-if="seg.kind === 'link'"
        :href="seg.href"
        target="_blank"
        rel="noopener noreferrer"
        class="break-all text-dodger underline hover:opacity-90"
      >
        {{ seg.text }}
      </a>
      <span v-else class="whitespace-pre-line">{{ seg.text }}</span>
    </template>
  </span>
</template>
