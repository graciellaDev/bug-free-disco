<template>
  <div class="dropdown-wrapper cursor-pointer relative" ref="dropDown">
    <div
      class="dropdown-selected-option relative flex w-full min-w-0 items-center gap-2 rounded-ten py-9px pl-3.5 pr-3.5 text-sm font-normal transition-colors"
      :class="triggerVariantClasses"
      @click="toggleDropDown"
    >
      <span
        :class="{
          'text-bali': !selectedOption && triggerVariant !== 'semiaction',
          'text-space': selectedOption && triggerVariant !== 'semiaction',
          'text-dodger': triggerVariant === 'semiaction',
        }"
        class="min-w-0 flex-1 truncate text-sm"
      >
        {{ displayText }}
      </span>
      <div
        v-if="clearable && selectedOption"
        class="ml-auto shrink-0 text-dodger hover:opacity-80"
        @click.stop="resetSelection"
        aria-label="Очистить"
      >
        <svg-icon name="dropdown-cross" width="20" height="20" />
      </div>
      <div
        v-show="!clearable || !selectedOption"
        class="dropdown-arrow ml-auto shrink-0 transition-transform duration-300"
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
        class="options-wrapper my-dropdown-list absolute w-max min-w-full bg-white border border-athens rounded-ten shadow-shadow-droplist top-14 z-50"
        v-if="isDropDownVisible">
        <div
          v-if="searchable"
          class="border-b border-athens p-2"
          @click.stop
        >
          <input
            ref="searchInputRef"
            v-model="searchQuery"
            type="text"
            :placeholder="searchPlaceholder"
            class="w-full rounded-md border border-athens bg-athens-gray py-2 pl-3 pr-3 text-sm text-space placeholder:text-slate-custom focus:border-dodger focus:outline-none"
            @click.stop
          />
        </div>
        <template v-for="(option, idx) in filteredOptions" :key="option?.type === 'header' ? 'header-' + option.name + idx : getOptionKey(option)">
          <div
            v-if="option?.type === 'header'"
            class="option text-xs font-medium text-slate-custom py-8px px-15px bg-athens-gray cursor-default"
          >
            {{ option.name }}
          </div>
          <div
            v-else
            class="option text-slate-custom text-sm font-normal py-10px px-15px hover:text-space hover:bg-zumthor cursor-pointer whitespace-nowrap"
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
  error: {
    type: Boolean,
    default: false,
  },
  clearable: {
    type: Boolean,
    default: false,
  },
  searchable: {
    type: Boolean,
    default: false,
  },
  searchPlaceholder: {
    type: String,
    default: 'Поиск…',
  },
})

const emit = defineEmits(['update:modelValue', 'select', 'open'])

const dropDown = ref(null)

const triggerVariantClasses = computed(() => {
  const base = 'leading-normal'
  if (props.triggerVariant === 'semiaction') {
    return [
      'bg-zumthor text-dodger border',
      props.error ? 'border-red-500' : (isDropDownVisible.value ? 'border-dodger' : 'border-transparent'),
      base,
    ].filter(Boolean).join(' ')
  }
  return [
    'border bg-athens-gray',
    props.error ? 'border-red-500' : (isDropDownVisible.value ? 'border-[#5898ff]' : 'border-athens'),
    base,
  ].join(' ')
})
const isDropDownVisible = ref(false)
const openDelayTimer = ref(null)
const selectedOption = ref(props.defaultValue ? props.defaultValue : null)
const searchQuery = ref('')
const searchInputRef = ref(null)

const filteredOptions = computed(() => {
  if (!props.searchable || !searchQuery.value.trim()) return props.options
  const q = searchQuery.value.trim().toLowerCase()
  return props.options.filter((opt) => {
    if (opt?.type === 'header') return true
    const label = getOptionLabel(opt)
    return typeof label === 'string' && label.toLowerCase().includes(q)
  })
})

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

// Поиск опции по значению, названию, id или по объекту опции (id/value/name)
const findOption = (value) => {
  if (value === null || value === undefined || value === '') return null
  if (typeof value === 'object' && !Array.isArray(value)) {
    const id = value?.id ?? value?.value
    const name = value?.name
    const found = props.options.find(opt =>
      (id !== undefined && (opt?.id === id || opt?.value === id)) ||
      (name != null && getOptionLabel(opt) === name)
    )
    return found ?? null
  }
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
    searchQuery.value = ''
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
      if (props.searchable && searchInputRef.value) {
        setTimeout(() => searchInputRef.value?.focus(), 50)
      }
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
    searchQuery.value = ''
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

<style>
/* Выпадающий список: ограничение высоты и прокрутка (без scoped — элемент внутри transition) */
.my-dropdown-list {
  max-height: 15rem;
  overflow-y: auto;
}
</style>

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