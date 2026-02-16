<template>
  <div class="dropdown-wrapper cursor-pointer relative" ref="dropDown">
    <div
      class="dropdown-selected-option relative flex items-center gap-3.5 rounded-ten py-9px pl-3.5 pr-3.5 text-sm font-normal transition-colors"
      :class="triggerVariantClasses"
      @click="toggleDropDown"
    >
      <span
        :class="{
          'text-bali': !selectedOption && triggerVariant !== 'semiaction',
          'text-space': selectedOption && triggerVariant !== 'semiaction',
          'text-dodger': triggerVariant === 'semiaction',
        }"
        class="text-sm min-w-0 truncate"
      >
        {{ displayText }}
      </span>
      <div
        class="dropdown-arrow shrink-0 transition-transform duration-300"
        :class="[
          triggerVariant === 'semiaction' ? 'text-dodger' : (isDropDownVisible ? 'text-dodger' : 'text-bali'),
          { 'rotate-180': isDropDownVisible },
        ]"
      >
        <svg-icon name="dropdown-arrow" width="20" height="20" />
      </div>
    </div>
    <transition name="slide-fade">
      <div
        class="options-wrapper absolute w-full bg-white border border-athens rounded-ten shadow-shadow-droplist top-14 z-50"
        v-if="isDropDownVisible">
        <template v-for="(option, idx) in props.options" :key="option?.type === 'header' ? 'header-' + option.name + idx : getOptionKey(option)">
          <div
            v-if="option?.type === 'header'"
            class="option text-xs font-medium text-slate-custom py-8px px-15px bg-athens-gray cursor-default"
          >
            {{ option.name }}
          </div>
          <div
            v-else
            class="option text-slate-custom text-sm font-normal py-10px px-15px hover:text-space hover:bg-zumthor cursor-pointer"
            @click="toggleOptionSelect(option)"
          >
            {{ getOptionLabel(option) }}
          </div>
        </template>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'

const props = defineProps({
  options: {
    type: Array,
    required: true,
    validator: (options) => options.every(opt => typeof opt === 'string' || opt?.type === 'header' || ('name' in opt && ('value' in opt || 'id' in opt)))
  },
  modelValue: {
    type: [String, Number, Object, null],
    default: null,
  },
  defaultValue: {
    type: String,
    default: null,
  },
  initialValue: {
    type: [String, Number, Object, null],
    default: null,
  },
  selected: {
    type: [Number, String, null],
    default: null,
  },
  placeholder: {
    type: String,
    default: 'Выберите значение',
  },
  triggerVariant: {
    type: String,
    default: 'default', // 'default' | 'semiaction' — стиль как у кнопки «В черновик»
  },
})

const emit = defineEmits(['update:modelValue', 'select', 'open'])

const dropDown = ref(null)

const triggerVariantClasses = computed(() => {
  const base = 'leading-normal'
  if (props.triggerVariant === 'semiaction') {
    return [
      'bg-zumthor text-dodger border border-transparent',
      isDropDownVisible.value ? 'border-dodger' : '',
      base,
    ].filter(Boolean).join(' ')
  }
  return [
    'border bg-athens-gray',
    isDropDownVisible.value ? 'border-[#5898ff]' : 'border-athens',
    base,
  ].join(' ')
})
const isDropDownVisible = ref(false)
const openDelayTimer = ref(null)
const selectedOption = ref(props.defaultValue ? props.defaultValue : null)

// Утилиты для обработки options
const getOptionValue = (option) => option?.value ?? option
const getOptionLabel = (option) => option?.name ?? option
const getOptionKey = (option) => getOptionValue(option)
const valueData = ref(props.defaultValue)

// Отображаемый текст: при выборе — значение, иначе — только placeholder
const displayText = computed(() => {
  const val = selectedOption.value
  if (val === null || val === undefined || val === '') {
    return props.placeholder
  }
  return getOptionLabel(val)
})

// Поиск опции по значению, названию или id (для совместимости с API)
const findOption = (value) => {
  if (value === null || value === undefined || value === '') return null
  return props.options.find(opt =>
    getOptionValue(opt) === value ||
    getOptionLabel(opt) === value ||
    (opt?.id !== undefined && opt.id === value)
  ) ?? null
}

// Инициализация selectedOption
const initializeSelectedOption = () => {
  let initial = props.initialValue ?? props.modelValue ?? props.selected
  if (initial !== null && initial !== undefined && initial !== '') {
    const option = findOption(initial)
    selectedOption.value = option ?? initial
  } else {
    selectedOption.value = null
  }
}

// Открытие/закрытие выпадающего списка
const toggleDropDown = () => {
  if (isDropDownVisible.value) {
    isDropDownVisible.value = false
    if (openDelayTimer.value) {
      clearTimeout(openDelayTimer.value)
      openDelayTimer.value = null
    }
  } else {
    if (openDelayTimer.value) return
    openDelayTimer.value = setTimeout(() => {
      isDropDownVisible.value = true
      openDelayTimer.value = null
      emit('open')
    }, 120)
  }
}

// Выбор значения (заголовки не выбираются)
const toggleOptionSelect = (option) => {
  if (option?.type === 'header') return
  selectedOption.value = option
  emit('update:modelValue', getOptionValue(option))
  emit('select', option)
  isDropDownVisible.value = false
}

// Сброс значения
const resetSelection = () => {
  selectedOption.value = null
  emit('update:modelValue', null)
  isDropDownVisible.value = false
}

// Закрытие выпадающего списка при клике вне
const closeDropDown = (event) => {
  if (!dropDown.value?.contains(event.target)) {
    if (openDelayTimer.value) {
      clearTimeout(openDelayTimer.value)
      openDelayTimer.value = null
    }
    isDropDownVisible.value = false
  }
}

// Проверка валидности selectedOption при изменении options + обновление на полный объект опции
watch(() => props.options, (newOptions) => {
  if (selectedOption.value === null && !props.modelValue) return
  const currentValue = props.modelValue ?? getOptionValue(selectedOption.value)
  const foundOption = findOption(currentValue)
  if (foundOption) {
    selectedOption.value = foundOption
  } else if (currentValue !== null && currentValue !== undefined && currentValue !== '') {
    const isValid = newOptions.some(opt => getOptionValue(opt) === currentValue || getOptionLabel(opt) === currentValue)
    if (!isValid && !props.initialValue) {
      selectedOption.value = null
      emit('update:modelValue', null)
    }
  }
}, { deep: true })

// Синхронизация modelValue → selectedOption
watch(() => props.modelValue, (newValue) => {
  const option = findOption(newValue)
  selectedOption.value = option ?? (newValue && newValue !== '' ? newValue : null)
  if (!option && newValue !== null && newValue !== '' && !props.initialValue) {
    emit('update:modelValue', null)
  }
}, { immediate: true })

// Обработка selected
watch(() => props.selected, (newSelected) => {
  if (newSelected !== null && newSelected !== getOptionValue(selectedOption.value)) {
    const option = props.options.find(opt => getOptionValue(opt) === newSelected)
    selectedOption.value = option ?? null
    emit('update:modelValue', getOptionValue(option) ?? null)
  }
}, { immediate: true })

onMounted(() => {
  window.addEventListener('click', closeDropDown)
  initializeSelectedOption()
})

onBeforeUnmount(() => {
  if (openDelayTimer.value) {
    clearTimeout(openDelayTimer.value)
  }
  window.removeEventListener('click', closeDropDown)
})
</script>

<style scoped>
.option:not(:last-child) {
  border-bottom: 1px solid #f4f6f8;
}

.slide-fade-enter-active {
  transition: all 0.3s ease-out;
}

.slide-fade-leave-active {
  transition: all 0.3s cubic-bezier(1, 0.5, 0.8, 1);
}

.slide-fade-enter-from,
.slide-fade-leave-to {
  transform: translateY(-4px);
  opacity: 0;
}

.dropdown-arrow {
  transition: transform 0.3s ease-in-out;
}
</style>