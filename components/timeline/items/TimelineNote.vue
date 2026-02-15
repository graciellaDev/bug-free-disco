<template>
  <TimelineItem icon-name="document" icon-background="bg-athens-gray">
    <template #content>
      <div class="flex flex-col">
        <p class="text-13px font-normal text-slate-custom mb-5px">
          <span>{{ note.time }}</span>
          {{ note.author }} оставил заметку
        </p>
        <p class="text-space text-sm font-normal">
          {{ note.content }}
        </p>
      </div>
    </template>
  </TimelineItem>
</template>

<script setup>
  import TimelineItem from '../TimelineItem.vue'

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
  })
</script>
