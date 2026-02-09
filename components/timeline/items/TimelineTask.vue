<template>
  <TimelineItem
    icon-name="calendar"
    icon-background="bg-zumthor"
    icon-color="text-dodger"
  >
    <template #content>
      <div class="leading-125">
        <p class="mb-1 text-13px font-normal text-slate-custom">
          <span>{{ task.time }}</span>
          для пользователя {{ task.user }}
        </p>
        <ul class="mb-3">
          <li class="mb-1.5 flex">
            <p class="min-w-[155px] text-sm font-normal text-space">
              Название задачи
            </p>
            <p class="text-sm font-normal text-dodger">
              {{ task.title }}
            </p>
          </li>
          <li class="flex">
            <p class="min-w-[155px] text-sm font-normal text-space">
              Запланировано:
            </p>
            <p class="text-sm font-normal text-dodger">
              {{ task.scheduled }}
            </p>
          </li>
        </ul>
        <button class="text-sm font-medium text-dodger" @click="handleComplete">
          Выполнить
        </button>
      </div>
    </template>
  </TimelineItem>
</template>

<script setup>
  import TimelineItem from '../TimelineItem.vue';

  const props = defineProps({
    task: {
      type: Object,
      required: true,
      default: () => ({
        time: '',
        user: '',
        title: '',
        scheduled: '',
      }),
    },
  });

  const emit = defineEmits(['complete']);

  const handleComplete = () => {
    emit('complete', props.task);
  };
</script>
