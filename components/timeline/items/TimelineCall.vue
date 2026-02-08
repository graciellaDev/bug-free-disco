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
            class="mb-2 text-13px font-normal leading-normal text-slate-custom"
          >
            <span>{{ call.time }}</span>
            от кандидата {{ call.candidateName }}
          </p>
          <p class="text-sm font-normal leading-normal text-space">
            Пропущенный вызов
          </p>
        </li>
      </ul>
    </template>
  </TimelineItem>
</template>

<script setup>
  import TimelineItem from '../TimelineItem.vue';

  defineProps({
    calls: {
      type: Array,
      required: true,
      default: () => [],
    },
  });
</script>
