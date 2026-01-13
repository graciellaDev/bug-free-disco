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
  withId: {
    type: Boolean,
    default: false
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

// Преобразование selectedOptions в формат для emit
const getEmitValue = (options) => {
  if (props.withId) {
    return options.map(option => {
      const value = getOptionValue(option)
      return { id: value }
    })
  }
  return options.map(getOptionValue)
}

// Инициализация selectedOptions
const initializeSelectedOptions = () => {
  let initial = props.initialValue.length > 0 ? props.initialValue : props.modelValue
  if (initial.length > 0) {
    const extractValue = (item) => {
      if (props.withId && typeof item === 'object' && item !== null && 'id' in item) {
        return item.id
      }
      return getOptionValue(item)
    }
    
    selectedOptions.value = initial
      .map(val => {
        const valToFind = extractValue(val)
        const option = props.options.find(opt => getOptionValue(opt) === valToFind)
        return option || null
      })
      .filter(val => val !== null)
  } else {
    selectedOptions.value = []
  }
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
  
  emit('update:modelValue', getEmitValue(selectedOptions.value))
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
  if (selectedOptions.value.length > 0) {
    const validOptions = selectedOptions.value.filter(selected => {
      const selectedValue = getOptionValue(selected)
      const isValid = newOptions.some(opt => getOptionValue(opt) === selectedValue)
      return isValid
    })
    if (validOptions.length !== selectedOptions.value.length) {
      selectedOptions.value = validOptions
      emit('update:modelValue', getEmitValue(validOptions))
    }
  }
}, { deep: true, immediate: true })

// Синхронизация modelValue → selectedOptions
watch(() => props.modelValue, (newValue) => {
  if (!Array.isArray(newValue)) {
    selectedOptions.value = []
    return
  }
  
  // Извлекаем значения из modelValue (может быть массив значений или массив объектов {id: value})
  const extractValue = (item) => {
    if (props.withId && typeof item === 'object' && item !== null && 'id' in item) {
      return item.id
    }
    return item
  }
  
  const newValues = newValue.map(extractValue)
  const currentValues = selectedOptions.value.map(getOptionValue)
  
  if (JSON.stringify(newValues) !== JSON.stringify(currentValues)) {
    selectedOptions.value = newValues
      .map(val => {
        const option = props.options.find(opt => getOptionValue(opt) === val)
        return option || null
      })
      .filter(val => val !== null)
    const computedValues = selectedOptions.value.map(getOptionValue)
    if (JSON.stringify(computedValues) !== JSON.stringify(newValues)) {
      emit('update:modelValue', getEmitValue(selectedOptions.value))
    }
  }
}, { deep: true, immediate: true })

// Обработка initialValue
watch(() => props.initialValue, (newInitial) => {
  const extractValue = (item) => {
    if (props.withId && typeof item === 'object' && item !== null && 'id' in item) {
      return item.id
    }
    return getOptionValue(item)
  }
  
  const newValues = newInitial.map(extractValue)
  const currentValues = selectedOptions.value.map(getOptionValue)
  
  if (newInitial.length > 0 && JSON.stringify(newValues) !== JSON.stringify(currentValues)) {
    selectedOptions.value = newInitial
      .map(val => {
        const valToFind = extractValue(val)
        const option = props.options.find(opt => getOptionValue(opt) === valToFind)
        return option || null
      })
      .filter(val => val !== null)
    emit('update:modelValue', getEmitValue(selectedOptions.value))
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