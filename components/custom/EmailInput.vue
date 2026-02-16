<template>
  <div class="w-full">
    <input v-model="email" class="bg-athens-gray border border-athens rounded-ten min-h-10 w-full pl-15px text-sm font-normal text-[#2F353D]"
      :class="{ focused: isFocused, 'border-red-500': error }" placeholder="Email" @focus="isFocused = true"
      @blur="validateEmail" />
    <span v-if="error" class="text-red-custom text-xs">{{ error }}</span>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  modelValue: String,
})

const emit = defineEmits(['update:modelValue'])

const isFocused = ref(false)
const email = ref(props.modelValue || '')
const error = ref('')

watch(
  () => props.modelValue,
  newValue => {
    if (newValue !== email.value) {
      email.value = newValue || ''
    }
  }
)

const validateEmail = () => {
  isFocused.value = false

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

  if (!email.value) {
    error.value = 'Поле обязательно для заполнения'
  } else if (!emailRegex.test(email.value)) {
    error.value = 'Введите корректный email'
  } else {
    error.value = ''
  }

  emit('update:modelValue', email.value)
}
</script>

<style scoped>
input::placeholder {
  font-size: 14px;
  font-weight: 400;
  font-family: 'Inter', sans-serif;
}

.focused {
  border: 1px solid #5898ff;
  outline: none;
}
</style>
