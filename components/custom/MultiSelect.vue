<template>
  <div class="dropdown-wrapper cursor-pointer relative" ref="dropDown">
    <div class="dropdown-selected-option relative border border-athens rounded-ten py-9px pr-30px pl-15px bg-athens-gray"
      @click="toggleDropDown">
      <div>
        <div :class="{
          'text-bali': !selectedOptions.length,
          'text-space': selectedOptions.length
        }" class="text-sm">
          {{ displayValue }}
        </div>
        <!-- Стрелка -->
        <div v-show="!selectedOptions.length"
          class="dropdown-arrow absolute right-3.5 top-2 transition-transform duration-300 text-bali"
          :class="{ 'rotate-180 text-dodger': isDropDownVisible }">
          <svg-icon name="dropdown-arrow" width="20" height="20" />
        </div>
        <!-- Крестик -->
        <div v-show="selectedOptions.length" class="dropdown-cross absolute right-3.5 top-2"
          @click.stop="resetSelection">
          <svg-icon name="dropdown-cross" width="20" height="20" />
        </div>
      </div>
    </div>
    <transition name="slide-fade">
      <div
        class="options-wrapper absolute w-full bg-white border border-athens rounded-ten shadow-shadow-droplist top-14 z-10"
        v-if="isDropDownVisible">
        <div
          class="option text-slate-custom text-sm font-normal py-10px px-15px hover:text-space hover:bg-zumthor cursor-pointer first:rounded-t-ten last:rounded-b-ten"
          v-for="(option, index) in props.options" :key="getOptionValue(option) || index"
          @click.stop="toggleOptionSelect(option)">
          <label class="flex items-center w-full cursor-pointer">
            <!-- Скрытый чекбокс -->
            <input type="checkbox" :checked="isSelected(option)" class="hidden" @click.stop />
            <!-- Кастомный чекбокс -->
            <div class="w-5 h-5 flex items-center justify-center border rounded-md check-item mr-[6px]" :class="{
              'bg-dodger border-dodger': isSelected(option),
              'border-athens bg-athens-gray': !isSelected(option)
            }">
              <svg v-if="isSelected(option)" xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-white"
                viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd"
                  d="M16.704 5.293a1 1 0 00-1.408 0L7.5 12.086 4.704 9.293a1 1 0 00-1.408 1.414l3.5 3.5a1 1 0 001.408 0l8-8a1 1 0 000-1.414z"
                  clip-rule="evenodd" />
              </svg>
            </div>
            <span>{{ getOptionLabel(option) }}</span>
          </label>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'

const props = defineProps({
  options: {
    type: Array,
    required: true,
    validator: (options) => options.every(opt => typeof opt === 'string' || ('name' in opt && 'value' in opt))
  },
  modelValue: {
    type: Array,
    default: () => []
  },
  initialValue: {
    type: Array,
    default: () => []
  },
  defaultValue: {
    type: String,
    default: 'Выберите значения'
  }
})

const emit = defineEmits(['update:modelValue'])

const dropDown = ref(null)
const isDropDownVisible = ref(false)
const selectedOptions = ref([])

// Хелперы для работы с опциями (строки или объекты)
const getOptionValue = (option) => {
  return typeof option === 'object' && option !== null ? option.value : option
}

const getOptionLabel = (option) => {
  return typeof option === 'object' && option !== null ? option.name : option
}

// Инициализация selectedOptions
const initializeSelectedOptions = () => {
  let initial = props.initialValue.length > 0 ? props.initialValue : props.modelValue
  console.log('Initializing selectedOptions:', { initial, options: props.options })
  if (initial.length > 0) {
    selectedOptions.value = initial
      .map(val => {
        const option = props.options.find(opt => getOptionValue(opt) === getOptionValue(val))
        return option || null
      })
      .filter(val => val !== null)
  } else {
    selectedOptions.value = []
  }
  console.log('Initialized selectedOptions:', selectedOptions.value)
}

// Отображаемое значение
const displayValue = computed(() => {
  if (!selectedOptions.value.length) return props.defaultValue
  return selectedOptions.value
    .map(option => getOptionLabel(option))
    .join(', ')
})

// Проверка, выбрана ли опция
const isSelected = (option) => {
  const optionValue = getOptionValue(option)
  return selectedOptions.value.some(selected => getOptionValue(selected) === optionValue)
}

// Открытие/закрытие выпадающего списка
const toggleDropDown = () => {
  isDropDownVisible.value = !isDropDownVisible.value
}

// Выбор/снятие опции
const toggleOptionSelect = (option) => {
  const optionValue = getOptionValue(option)
  const index = selectedOptions.value.findIndex(selected => getOptionValue(selected) === optionValue)
  if (index === -1) {
    selectedOptions.value.push(option)
  } else {
    selectedOptions.value.splice(index, 1)
  }
  console.log('toggleOptionSelect:', { selectedOptions: selectedOptions.value, emitted: selectedOptions.value.map(getOptionValue) })
  emit('update:modelValue', selectedOptions.value.map(getOptionValue))
}

// Сброс выбора
const resetSelection = () => {
  selectedOptions.value = []
  emit('update:modelValue', [])
}

// Закрытие выпадающего списка при клике вне
const closeDropDown = (event) => {
  if (!dropDown.value?.contains(event.target)) {
    isDropDownVisible.value = false
  }
}

// Проверка валидности selectedOptions при изменении options
watch(() => props.options, (newOptions) => {
  console.log('watch: options changed', { oldOptions: props.options, newOptions, selectedOptions: selectedOptions.value })
  if (selectedOptions.value.length > 0) {
    const validOptions = selectedOptions.value.filter(selected => {
      const selectedValue = getOptionValue(selected)
      const isValid = newOptions.some(opt => getOptionValue(opt) === selectedValue)
      return isValid
    })
    if (validOptions.length !== selectedOptions.value.length) {
      selectedOptions.value = validOptions
      emit('update:modelValue', validOptions.map(getOptionValue))
    }
  }
}, { deep: true, immediate: true })

// Синхронизация modelValue → selectedOptions
watch(() => props.modelValue, (newValue) => {
  if (!Array.isArray(newValue)) {
    selectedOptions.value = []
    return
  }
  const currentValues = selectedOptions.value.map(getOptionValue)
  if (JSON.stringify(newValue) !== JSON.stringify(currentValues)) {
    selectedOptions.value = newValue
      .map(val => {
        const option = props.options.find(opt => getOptionValue(opt) === val)
        return option || null
      })
      .filter(val => val !== null)
    const newValues = selectedOptions.value.map(getOptionValue)
    if (JSON.stringify(newValues) !== JSON.stringify(newValue)) {
      emit('update:modelValue', newValues)
    }
  }
}, { deep: true, immediate: true })

// Обработка initialValue
watch(() => props.initialValue, (newInitial) => {
  if (newInitial.length > 0 && JSON.stringify(newInitial) !== JSON.stringify(selectedOptions.value.map(getOptionValue))) {
    selectedOptions.value = newInitial
      .map(val => {
        const option = props.options.find(opt => getOptionValue(opt) === getOptionValue(val))
        return option || null
      })
      .filter(val => val !== null)
    emit('update:modelValue', selectedOptions.value.map(getOptionValue))
  }
}, { immediate: true })

onMounted(() => {
  window.addEventListener('click', closeDropDown)
  initializeSelectedOptions()
})

onBeforeUnmount(() => {
  window.removeEventListener('click', closeDropDown)
})
</script>

<style scoped>
.option:not(:last-child) {
  border-bottom: 1px solid #f4f6f8;
}

.check-item:hover {
  border: 1px solid #5898FF;
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