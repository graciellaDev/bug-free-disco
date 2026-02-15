<template>
  <div class="skills-dropdown relative" ref="dropdownRef">
    <div
      class="min-h-[42px] w-full py-9px px-15px border rounded-ten bg-athens-gray transition-colors flex flex-wrap items-center gap-2 cursor-pointer"
      :class="isOpen ? 'border-dodger' : 'border-athens'"
      @click="toggle"
    >
      <template v-if="selectedItems.length > 0">
        <span
          v-for="(item, idx) in selectedItems"
          :key="item.id ?? idx"
          class="inline-flex items-center gap-1 px-10px py-5px rounded-ten bg-zumthor text-dodger text-sm font-medium"
        >
          {{ getItemName(item) }}
          <button
            type="button"
            class="p-0.5 hover:opacity-70"
            aria-label="Удалить"
            @click.stop="removeItem(item)"
          >
            <svg-icon name="dropdown-cross" width="14" height="14" />
          </button>
        </span>
      </template>
      <span v-else-if="!isOpen" class="text-sm text-bali">{{ placeholder }}</span>
      <div
        class="dropdown-arrow ml-auto shrink-0 transition-transform duration-300 text-bali"
        :class="{ 'rotate-180 text-dodger': isOpen }"
      >
        <svg-icon name="dropdown-arrow" width="20" height="20" />
      </div>
    </div>

    <transition name="slide-fade">
      <div
        v-if="isOpen"
        class="absolute left-0 right-0 top-full mt-1 z-50 bg-white border border-athens rounded-ten shadow-shadow-droplist overflow-hidden"
      >
        <div class="p-15px border-b border-athens">
          <input
            ref="searchInputRef"
            v-model="searchQuery"
            type="text"
            placeholder="Найдите или введите свой вариант"
            class="w-full py-9px px-15px border border-athens rounded-ten bg-athens-gray text-sm text-space placeholder:text-bali focus:outline-none focus:border-dodger"
            @click.stop
            @keydown.enter.prevent="addCustomOrSelectFirst"
          />
        </div>
        <div class="p-15px max-h-[240px] overflow-y-auto">
          <div
            v-if="searchQuery.trim() && !filteredOptions.some((o) => (o.name || '').toLowerCase() === searchQuery.trim().toLowerCase())"
            class="mb-2"
          >
            <button
              type="button"
              class="px-4 py-2.5 text-sm rounded-ten border border-dashed border-athens bg-athens-gray text-space hover:bg-zumthor hover:border-dodger"
              @click.stop="addCustomOrSelectFirst"
            >
              Добавить «{{ searchQuery.trim() }}»
            </button>
          </div>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="(opt, optIdx) in filteredOptions"
              :key="opt.id ?? opt.name ?? optIdx"
              type="button"
              class="px-4 py-2.5 text-sm rounded-ten border transition-colors"
              :class="isSelected(opt)
                ? 'bg-zumthor border-dodger text-dodger font-normal'
                : 'bg-athens-gray border-athens text-space font-normal hover:bg-zumthor hover:border-dodger hover:text-dodger'"
              @click.stop="toggleOption(opt)"
            >
              {{ getItemName(opt) }}
            </button>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed, nextTick, onMounted, onBeforeUnmount } from 'vue'

const props = defineProps({
  modelValue: {
    type: Array,
    default: () => [],
  },
  options: {
    type: Array,
    default: () => [],
  },
  placeholder: {
    type: String,
    default: 'Найдите или напишите свой вариант',
  },
})

const emit = defineEmits(['update:modelValue'])

const defaultSkills = [
  { id: 1, name: 'Деловое общение' },
  { id: 2, name: 'Организаторские навыки' },
  { id: 3, name: 'Деловая переписка' },
  { id: 4, name: 'Деловая коммуникация' },
  { id: 5, name: 'Продающий лендинг' },
  { id: 6, name: 'Телефонные переговоры' },
  { id: 7, name: 'Кросс-продажи' },
  { id: 8, name: 'Активные продажи' },
  { id: 9, name: 'SPIN-продажи' },
  { id: 10, name: 'Консультирование клиентов' },
  { id: 11, name: 'Интернет-маркетинг' },
  { id: 12, name: 'Пассивные продажи' },
  { id: 13, name: 'amoCRM' },
  { id: 14, name: 'Консультативные продажи' },
  { id: 15, name: 'Email-маркетинг' },
  { id: 16, name: 'Работа с CRM' },
  { id: 17, name: 'SMS-маркетинг' },
  { id: 18, name: 'Холодные продажи' },
  { id: 19, name: 'Теплые продажи' },
  { id: 20, name: 'Заключение договоров' },
]

const allOptions = computed(() => {
  const opts = props.options && props.options.length > 0 ? props.options : defaultSkills
  return opts.map((o, i) => ({
    id: o.id ?? i + 100,
    name: typeof o === 'object' ? (o.name ?? o.label ?? String(o.id ?? o)) : String(o),
  }))
})

const selectedItems = computed(() => {
  const val = props.modelValue
  if (!val || !Array.isArray(val)) return []
  return val
    .map((v) => {
      if (typeof v === 'object' && v !== null && v.name) return v
      const id = typeof v === 'object' ? v?.id : v
      const found = allOptions.value.find((o) => String(o.id) === String(id) || o.id === id)
      return found || null
    })
    .filter(Boolean)
})

const searchQuery = ref('')
const isOpen = ref(false)
const dropdownRef = ref(null)
const searchInputRef = ref(null)

const filteredOptions = computed(() => {
  const q = (searchQuery.value || '').toLowerCase().trim()
  if (!q) return allOptions.value
  return allOptions.value.filter((o) => (o.name || '').toLowerCase().includes(q))
})

const getItemName = (item) => (typeof item === 'object' ? item?.name ?? item?.label : item)

const isSelected = (opt) => selectedItems.value.some((s) => String(s.id) === String(opt.id))

const toggle = () => {
  isOpen.value = !isOpen.value
  if (isOpen.value) {
    nextTick(() => {
      searchQuery.value = ''
      searchInputRef.value?.focus()
    })
  }
}

const addCustomOrSelectFirst = () => {
  const q = (searchQuery.value || '').trim()
  if (!q) return
  const match = filteredOptions.value.find((o) => (o.name || '').toLowerCase() === q.toLowerCase())
  if (match) {
    toggleOption(match)
  } else {
    const custom = { id: 'custom-' + Date.now(), name: q }
    toggleOption(custom)
  }
  searchQuery.value = ''
}

const toggleOption = (opt) => {
  const current = props.modelValue || []
  const items = Array.isArray(current)
    ? current
        .map((v) =>
          typeof v === 'object' && v !== null && v.name
            ? v
            : allOptions.value.find((o) => String(o.id) === String(v))
        )
        .filter(Boolean)
    : []
  const id = opt.id
  const idx = items.findIndex((i) => String(i?.id) === String(id))
  let next
  if (idx >= 0) {
    next = items.filter((_, i) => i !== idx)
  } else {
    next = [...items, opt]
  }
  emit('update:modelValue', next)
}

const removeItem = (item) => {
  const next = selectedItems.value.filter((s) => String(s?.id) !== String(item?.id))
  emit('update:modelValue', next)
}

const close = (e) => {
  if (dropdownRef.value && !dropdownRef.value.contains(e.target)) {
    isOpen.value = false
    searchQuery.value = ''
  }
}

onMounted(() => {
  window.addEventListener('click', close)
})

onBeforeUnmount(() => {
  window.removeEventListener('click', close)
})
</script>

<style scoped>
.slide-fade-enter-active,
.slide-fade-leave-active {
  transition: all 0.2s ease;
}
.slide-fade-enter-from,
.slide-fade-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
