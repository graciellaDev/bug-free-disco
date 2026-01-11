<template>
  <div class="w-full relative" ref="wrapperRef">
    <input
      type="text"
      ref="inputRef"
      :value="displayValue"
      class="bg-athens-gray border text-sm border-athens rounded-ten min-h-10 pl-15px w-full py-[9px] pr-15px"
      :placeholder="isFocused ? '' : placeholder"
      :class="{ focused: isFocused, 'has-value': search || selectedCity }"
      @focus="(event) => handleFocus(event)"
      @blur="handleBlur"
      @keydown.esc="closeList"
      @keydown.enter.prevent="selectFirstResult"
      @input="handleInput"
    />
    <button
      v-if="selectedCity && !isFocused"
      @click.stop="clearCity"
      class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-custom hover:text-space cursor-pointer"
    >
      ✖
    </button>
    <transition name="slide-fade">
      <ul
        v-if="(filteredCities.length && isOpen) || (props.isOpen && isOpen && !search)"
        class="absolute left-0 right-0 max-h-52 overflow-y-auto bg-white z-10 shadow-shadow-droplist rounded-plus border border-athens mt-1"
      >
        <li
          v-for="city in filteredCities"
          :key="city.id"
          @mousedown.prevent="selectCity(city)"
          class="text-slate-custom hover:text-space cursor-pointer hover:bg-zumthor py-10px px-15px border-b border-athens last:border-b-0"
        >
          {{ city.name || city.city }}
        </li>
      </ul>
      <div
        v-else-if="isOpen && !filteredCities.length"
        @mousedown.prevent="clearCity"
        class="absolute left-0 right-0 bg-white z-10 shadow-shadow-droplist rounded-plus border border-athens mt-1"
      >
        <div class="text-slate-custom text-sm font-normal py-10px px-15px">
          Город не найден
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { computed, ref, onMounted, onUnmounted, watch, nextTick } from 'vue'

const props = defineProps({
  options: {
    type: Array,
    required: true,
    default: () => [],
  },
  modelValue: {
    type: [String, Number, null, Object],
    default: null,
  },
  placeholder: {
    type: String,
    default: 'Введите название города',
  },
  isOpen: {
    type: Boolean,
    default: false,
  }
})

const emit = defineEmits(['update:modelValue'])

const search = ref('')
const isFocused = ref(false)
const isOpen = ref(false)
const wrapperRef = ref(null)
const isEditing = ref(false) // Флаг для отслеживания редактирования

const selectedCity = computed(() => {
  if (!props.modelValue && !props.isOpen) {
    return null
  }
  return props.options.find(city => 
    city.id === props.modelValue || city.value === props.modelValue
  ) || null
})

const displayValue = computed(() => {
  // Всегда показываем значение из search для возможности редактирования
  return search.value
})

const filteredCities = computed(() => {
  if (!search.value && !props.isOpen) {
    return []
  }
  
  const searchLower = search.value ? search.value.toLowerCase() : ''
  
  return props.options.filter(city => {
    
    const name = (city.name || city.city).toString().toLowerCase()
    return name.includes(searchLower)
  }).slice(0, 10) // Ограничиваем до 10 результатов
})

const handleFocus = (event) => {
  isFocused.value = true
  if (event.target.value) {
    return
  }
  // При фокусе показываем название выбранного города для возможности редактирования
  search.value = selectedCity.value ? selectedCity.value.name : ''
  if (search.value || props.isOpen) {
    isOpen.value = true
  }
}

const handleBlur = () => {
  // Задержка для обработки клика по элементу списка
  setTimeout(() => {
    isFocused.value = false
    isOpen.value = false
    // Если город выбран, показываем его название
    // Если пользователь редактировал текст, сохраняем его
    if (selectedCity.value && !isEditing.value) {
      search.value = selectedCity.value.name
    } else if (!selectedCity.value && !search.value) {
      search.value = ''
    }
    // Сбрасываем флаг редактирования
    isEditing.value = false
  }, 200)
}

const handleInput = async (event) => {
  const inputValue = event.target.value
  // Устанавливаем флаг редактирования ПЕРЕД обновлением
  isEditing.value = true
  // Сохраняем значение из поля ввода - это важно для посимвольного удаления
  search.value = inputValue
  
  // Ждем обновления DOM
  await nextTick()
  
  // Если пользователь удалил весь текст, очищаем выбранный город
  if (!inputValue) {
    emit('update:modelValue', null)
    isOpen.value = false
  } else {
  
   // Если текст изменился и не совпадает с выбранным городом, очищаем выбор
    if (selectedCity.value && inputValue !== selectedCity.value.name) {
      emit('update:modelValue', null)
    }
    // Показываем список подсказок для оставшейся строки
    isOpen.value = true
  }
  
  // Сбрасываем флаг редактирования после задержки, чтобы watch не мешал
  setTimeout(() => {
    isEditing.value = false
  }, 500)
}

const selectCity = async (city) => {
  const cityId = city.id || city.value
  const cityName = city.name || city.city || ''
  emit('update:modelValue', cityId)
  // Ждем обновления DOM и computed свойств
  await nextTick()
  // Сохраняем название города в поле ввода
  search.value = cityName
  isFocused.value = false
  isOpen.value = false
}

const selectFirstResult = () => {
  if (filteredCities.value.length > 0) {
    selectCity(filteredCities.value[0])
  }
}

const clearCity = () => {
  emit('update:modelValue', null)
  search.value = ''
}

const closeList = () => {
  isOpen.value = false
  isFocused.value = false
}

watch(() => props.modelValue, (newValue, oldValue) => {
  // Синхронизируем search при изменении modelValue только если поле не в фокусе
  // и пользователь не редактирует текст в данный момент
  // Пропускаем обновление, если изменение произошло из-за редактирования
  if (isFocused.value || isEditing.value) {
    return
  }
  
  if (selectedCity.value) {
    // Обновляем только если значение действительно изменилось извне
    if (search.value !== selectedCity.value.name) {
      search.value = selectedCity.value.name
    }
  } else if (!newValue) {
    // Очищаем только если значение было очищено извне и поле пустое
    if (!isFocused.value) {
      search.value = ''
    }
  }
}, { flush: 'post' })

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})

const handleClickOutside = (event) => {
  if (wrapperRef.value && !wrapperRef.value.contains(event.target)) {
    closeList()
  }
}
</script>

<style scoped>
input::placeholder {
  font-size: 14px;
  font-weight: 400;
  font-family: 'Inter', sans-serif;
  color: #9098b4;
}

input.focused {
  padding-left: 43px;
  background-image: url('../../assets/sprite/svg/search.svg');
  background-repeat: no-repeat;
  background-position: 15px center;
  background-size: 20px 20px;
  border: 1px solid #5898ff;
}

input:focus {
  outline: none;
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

ul {
  scrollbar-width: none;
}

ul::-webkit-scrollbar {
  display: none;
}
</style>

