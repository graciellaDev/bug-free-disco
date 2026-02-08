<template>
  <TimelineItem icon-name="document" icon-background="bg-athens-gray">
    <template #content>
      <div class="flex flex-col">
        <p class="mb-5px text-13px font-normal text-slate-custom">
          <span>{{ note.time }}</span>
          {{ note.author }} оставил заметку
        </p>
        <p class="text-sm font-normal text-space">
          {{ note.content }}
        </p>
      </div>
    </template>
  </TimelineItem>
</template>

<script setup>
  import TimelineItem from '../TimelineItem.vue';

  defineProps({
    note: {
      type: Object,
      required: true,
      default: () => ({
        time: '',
        author: '',
        content: '',
      }),
    },
  });
</script>
