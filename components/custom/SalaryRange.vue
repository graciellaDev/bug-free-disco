<template>
  <div class="w-full flex gap-x-2.5">
    <!-- Поле "От" -->
    <input type="text" v-model="localFrom" @input="handleInput('from', $event.target.value)"
      @blur="handleBlurAndValidate('from')"
      class="bg-athens-gray border border-athens rounded-ten min-h-10 max-w-400px w-full pl-15px text-sm font-normal text-[#2F353D]" placeholder="От"
      @focus="handleFocus('from')" :class="{ focused: isFocused.from }" />

    <!-- Поле "До" -->
    <input type="text" v-model="localTo" @input="handleInput('to', $event.target.value)"
      @blur="handleBlurAndValidate('to')"
      class="bg-athens-gray border border-athens rounded-ten min-h-10 max-w-400px w-full pl-15px text-sm font-normal text-[#2F353D]" placeholder="До"
      @focus="handleFocus('to')" :class="{ focused: isFocused.to }" />
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

const props = defineProps({
  from: { type: [Number, String], default: null },
  to: { type: [Number, String], default: null },
})

const numFrom = computed(() => (props.from !== null && props.from !== '' && !Number.isNaN(Number(props.from)) ? Number(props.from) : null))
const numTo = computed(() => (props.to !== null && props.to !== '' && !Number.isNaN(Number(props.to)) ? Number(props.to) : null))

const emit = defineEmits(['update:modelValue', 'update:from', 'update:to'])
const localFrom = ref(numFrom.value ? numFrom.value.toLocaleString('ru-RU') : '')
const localTo = ref(numTo.value ? numTo.value.toLocaleString('ru-RU') : '')
const isFocused = ref({ from: false, to: false })

watch(numFrom, (v) => { localFrom.value = v ? v.toLocaleString('ru-RU') : '' }, { immediate: true })
watch(numTo, (v) => { localTo.value = v ? v.toLocaleString('ru-RU') : '' }, { immediate: true })

const handleInput = (field, value) => {
  const sanitizedValue = Number(value.replace(/[^\d]/g, ''))
  emit('update:modelValue', field, sanitizedValue.toString())

  if (field === 'from') {
    localFrom.value = sanitizedValue ? sanitizedValue.toLocaleString('ru-RU') : ''
    emit('update:from', sanitizedValue)
  } else if (field === 'to') {
    localTo.value = sanitizedValue ? sanitizedValue.toLocaleString('ru-RU') : ''
    emit('update:to', sanitizedValue)
  }

}

const handleBlurAndValidate = field => {
  isFocused.value[field] = false
}

const handleFocus = field => {
  isFocused.value[field] = true
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
</style>
