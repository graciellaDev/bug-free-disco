<template>
  <div
    class="relative"
    @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave"
  >
    <button
      type="button"
      class="inline-flex items-center gap-1 text-sm font-normal text-dodger"
      @mouseenter="handleMouseEnter"
    >
      {{ formatLabels[props.modelValue as keyof typeof formatLabels] }}
      <svg-icon
        name="dropdown-arrow"
        width="16"
        height="16"
        class="shrink-0 transition-transform duration-200"
        :class="{ 'rotate-180': isOpen }"
      />
    </button>

    <Transition name="slide-up">
      <div
        v-if="isOpen"
        class="absolute bottom-full left-0 mb-1 min-w-[124px] bg-athens rounded-plus shadow-md [&>*:not(:last-child)]:mb-px"
        @mouseenter="handleMouseEnter"
        @mouseleave="handleMouseLeave"
      >
        <button
          v-for="(label, format) in formatLabels"
          :key="format"
          class="w-full text-left px-4 py-2.5 text-sm hover:bg-athens-gray transition-colors first:rounded-t-plus last:rounded-b-plus bg-white leading-normal"
          :class="{
            'text-dodger': modelValue === format,
            'text-slate-custom': modelValue !== format,
          }"
          @click="selectFormat(format)"
        >
          {{ label }}
        </button>
      </div>
    </Transition>
    <!-- Прозрачная зона между списком и синим текстом: курсор в ней не закрывает список -->
    <div
      v-if="isOpen"
      class="absolute left-0 bottom-full h-1 w-[124px] min-w-[124px] pointer-events-auto"
      aria-hidden="true"
      @mouseenter="handleMouseEnter"
    />
  </div>
</template>

<script setup lang="ts">
  import { ref } from 'vue'

  const props = defineProps<{
    modelValue: string
  }>()

  const emit = defineEmits<{
    'update:modelValue': [value: string]
    select: [format: string]
  }>()

  const isOpen = ref(false)
  let closeTimer: ReturnType<typeof setTimeout> | null = null

  const formatLabels: Record<string, string> = {
    chat: 'Чат на сайте',
    comment: 'Комментарий',
    email: 'E-mail',
    task: 'Задача',
  }

  const handleMouseEnter = () => {
    if (closeTimer) {
      clearTimeout(closeTimer)
      closeTimer = null
    }
    isOpen.value = true
  }

  const handleMouseLeave = () => {
    closeTimer = setTimeout(() => {
      isOpen.value = false
      closeTimer = null
    }, 400)
  }

  const keepOpen = () => {
    if (closeTimer) {
      clearTimeout(closeTimer)
      closeTimer = null
    }
    isOpen.value = true
  }

  const scheduleClose = (delayMs = 400) => {
    if (closeTimer) clearTimeout(closeTimer)
    closeTimer = setTimeout(() => {
      isOpen.value = false
      closeTimer = null
    }, delayMs)
  }

  defineExpose({ keepOpen, scheduleClose })

  const selectFormat = (format: string) => {
    emit('update:modelValue', format)
    emit('select', format)
    isOpen.value = false
  }
</script>

<style scoped>
  .slide-up-enter-active,
  .slide-up-leave-active {
    transition: all 0.3s ease-out;
  }

  .slide-up-enter-from,
  .slide-up-leave-to {
    opacity: 0;
    transform: translateY(10px);
  }
</style>
