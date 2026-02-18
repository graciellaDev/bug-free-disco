<template>
  <div class="w-full">
    <input v-model="formattedValue"
      class="bg-athens-gray border border-athens rounded-ten min-h-10 w-full pl-15px text-sm font-normal text-[#2F353D]"
      :class="{ focused: isFocused, 'border-red-500': error }" placeholder="+7-000-000-0000" @focus="isFocused = true"
      @blur="validatePhone" @input="handleInput" />
    <span v-if="error" class="text-red-500 text-xs">{{ error }}</span>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  modelValue: String,
})

const emit = defineEmits(['update:modelValue'])

const isFocused = ref(false)
const error = ref('')
const rawValue = ref('') // Оригинальный ввод
const formattedValue = ref('')

// Функция форматирования
const formatPhone = digits => {
  let mask = '+7'
  if (digits.length > 1) mask += ` (${digits.slice(1, 4)}`
  if (digits.length >= 5) mask += `) ${digits.slice(4, 7)}`
  if (digits.length >= 8) mask += `-${digits.slice(7, 9)}`
  if (digits.length >= 10) mask += `-${digits.slice(9, 11)}`
  return mask
}

// Следим за изменением modelValue (например, после загрузки с сервера)
watch(
  () => props.modelValue,
  newValue => {
    if (newValue) {
      const digits = newValue.replace(/\D/g, '') // Убираем нецифровые символы
      rawValue.value = digits
      formattedValue.value = formatPhone(digits)
    }
  },
  { immediate: true }
) // Запускаем сразу при монтировании

const handleInput = event => {
  const digits = event.target.value.replace(/\D/g, '').slice(0, 11)
  rawValue.value = digits
  formattedValue.value = formatPhone(digits)
  emit('update:modelValue', `+${digits}`)
}

const validatePhone = () => {
  isFocused.value = false
  error.value =
    !rawValue.value || rawValue.value.length < 11
      ? 'Введите полный номер телефона'
      : ''
}
</script>

<style scoped>
input::placeholder {
  font-size: 14px;
  font-weight: 400;
  font-family: 'Inter', sans-serif;
}

.focused {
  outline: 1px solid #5898ff;
}

.border-red-500 {
  border-color: #ef4444;
}
</style>
