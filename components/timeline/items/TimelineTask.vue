<template>
  <TimelineItem
    icon-name="calendar"
    icon-background="bg-zumthor"
    icon-color="text-dodger"
  >
    <template #content>
      <div class="leading-125">
        <p class="text-13px font-normal text-slate-custom mb-1">
          <span>{{ task.time }}</span>
          для пользователя {{ task.user }}
        </p>
        <ul class="mb-3">
          <li class="flex mb-1.5">
            <p class="text-sm font-normal text-space min-w-[155px]">
              Название задачи
            </p>
            <p class="text-sm font-normal text-dodger">
              {{ task.title }}
            </p>
          </li>
          <li class="flex">
            <p class="text-sm font-normal text-space min-w-[155px]">
              Запланировано:
            </p>
            <p class="text-sm font-normal text-dodger">
              {{ task.scheduled }}
            </p>
          </li>
        </ul>
        <button class="text-sm text-dodger font-medium" @click="handleComplete">
          Выполнить
        </button>
      </div>
    </template>
  </TimelineItem>
</template>

<script setup>
  import TimelineItem from '../TimelineItem.vue'

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
  })

  const emit = defineEmits(['complete'])

  const handleComplete = () => {
    emit('complete', props.task)
  }
</script>
