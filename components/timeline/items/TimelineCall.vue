<template>
  <TimelineItem icon-name="missed-call" icon-background="bg-pink">
    <template #content>
      <ul>
        <li
          v-for="(call, index) in calls"
          :key="index"
          :class="{ 'mb-4': index !== calls.length - 1 }"
        >
          <p
            class="text-13px font-normal text-slate-custom leading-normal mb-2"
          >
            <span>{{ call.time }}</span>
            от кандидата {{ call.candidateName }}
          </p>
          <p class="text-space text-sm font-normal leading-normal">
            Пропущенный вызов
          </p>
        </li>
      </ul>
    </template>
  </TimelineItem>
</template>

<script setup>
  import TimelineItem from '../TimelineItem.vue'

  defineProps({
    calls: {
      type: Array,
      required: true,
      default: () => [],
    },
  })
</script>
