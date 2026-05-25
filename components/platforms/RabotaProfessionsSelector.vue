<template>
  <div class="w-full">
    <button
      type="button"
      class="w-full flex items-center border rounded-ten min-h-10 bg-athens-gray overflow-hidden text-left transition-colors"
      :class="[
        props.error ? 'border-red-500' : 'border-athens',
        { 'border-[#5898ff]': isModalOpen },
      ]"
      @click="openModal"
    >
      <div class="flex-1 flex items-center min-w-0 pl-15px py-2 pr-3">
        <svg-icon name="search" width="20" height="20" class="text-bali shrink-0 mr-2" />
        <span
          class="text-sm truncate"
          :class="displayLabel ? 'text-[#2F353D]' : 'text-bali'"
        >
          {{ displayLabel || 'Выберите из списка' }}
        </span>
      </div>
      <span
        class="shrink-0 py-2 px-3 border-l border-athens text-bali flex items-center justify-center"
        aria-hidden="true"
      >
        <svg-icon name="drag-burger" width="20" height="20" />
      </span>
    </button>

    <RabotaProfessionsHierarchyModal
      :open="isModalOpen"
      :selected="selectedList"
      :max-selection="maxSelection"
      @update:open="setModalOpen"
      @save="onModalSave"
    />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import RabotaProfessionsHierarchyModal from './RabotaProfessionsHierarchyModal.vue'

const props = defineProps({
  modelValue: {
    type: Array,
    default: () => [],
  },
  error: {
    type: Boolean,
    default: false,
  },
  maxSelection: {
    type: Number,
    default: 5,
  },
})

const emit = defineEmits(['update:modelValue'])

const isModalOpen = ref(false)

const selectedList = computed(() =>
  (props.modelValue ?? []).filter((item) => item && item.id != null),
)

const displayLabel = computed(() => {
  const names = selectedList.value.map((item) => item.name).filter(Boolean)
  if (!names.length) return ''
  if (names.length <= 2) return names.join(', ')
  return `${names.slice(0, 2).join(', ')} и ещё ${names.length - 2}`
})

const setModalOpen = (value) => {
  isModalOpen.value = !!value
}

const openModal = () => {
  isModalOpen.value = true
}

const onModalSave = (items) => {
  emit('update:modelValue', items ?? [])
}
</script>
