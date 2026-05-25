<template>
  <div class="w-full relative" ref="wrapperRef">
    <svg-icon
      name="geo-label"
      width="20"
      height="20"
      class="absolute left-3 top-1/2 -translate-y-1/2 text-bali pointer-events-none z-10"
    />
    <input
      type="text"
      ref="inputRef"
      :value="displayValue"
      class="bg-athens-gray border text-sm rounded-ten min-h-10 pl-10 w-full py-[9px] pr-10 text-[#2F353D]"
      :class="[
        error ? 'border-red-500' : 'border-athens',
        { focused: isFocused, 'has-value': search || selectedRegion },
      ]"
      :placeholder="isFocused ? '' : placeholder"
      @focus="handleFocus"
      @blur="handleBlur"
      @keydown.esc="closeList"
      @keydown.enter.prevent="selectFirstResult"
      @input="handleInput"
    />
    <button
      v-if="selectedRegion && !isFocused"
      type="button"
      @click.stop="clearSelection"
      class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-custom hover:text-space cursor-pointer"
    >
      ✖
    </button>
    <transition name="slide-fade">
      <ul
        v-if="isOpen && (suggestOptions.length || suggestLoading)"
        class="rabota-region-suggest-scroll absolute left-0 right-0 top-full max-h-52 overflow-y-auto overscroll-y-contain bg-white z-50 shadow-shadow-droplist rounded-plus border border-athens mt-1"
        @mousedown.prevent.capture
      >
        <li v-if="suggestLoading" class="text-slate-custom text-sm font-normal py-10px px-15px">
          Поиск…
        </li>
        <li
          v-for="(option, index) in suggestOptions"
          :key="`${option.id ?? option.name}-${index}`"
          @mousedown.prevent="selectOption(option)"
          class="text-sm text-slate-custom hover:text-space cursor-pointer hover:bg-zumthor py-10px px-15px border-b border-athens last:border-b-0"
        >
          {{ option.name }}
        </li>
      </ul>
      <div
        v-else-if="isOpen && search.trim() && !suggestLoading && !suggestOptions.length"
        class="absolute left-0 right-0 bg-white z-10 shadow-shadow-droplist rounded-plus border border-athens mt-1"
      >
        <div class="text-slate-custom text-sm font-normal py-10px px-15px">
          Регион не найден
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { computed, ref, watch, nextTick, onMounted, onUnmounted } from 'vue'
import debounce from 'lodash/debounce'
import { searchRabotaRegions } from '@/utils/rabotaAccount'

const props = defineProps({
  modelValue: {
    type: Object,
    default: null,
  },
  placeholder: {
    type: String,
    default: 'Выберите регион',
  },
  error: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['update:modelValue'])

const search = ref('')
const isFocused = ref(false)
const isOpen = ref(false)
const isEditing = ref(false)
const isSelecting = ref(false)
const suggestOptions = ref([])
const suggestLoading = ref(false)
const selectedRegion = ref(null)
const inputRef = ref(null)
const wrapperRef = ref(null)

function normalizeRegion(item) {
  if (typeof item === 'string') {
    const name = item.trim()
    return name ? { name } : null
  }
  if (item && typeof item === 'object') {
    const name = String(
      item.name ?? item.title ?? item.region_name ?? item.city ?? '',
    ).trim()
    const id = item.id ?? item.region_id
    if (!name && id == null) return null
    return {
      ...(id != null ? { id } : {}),
      name: name || String(id),
    }
  }
  return null
}

const displayValue = computed(() => {
  if (isFocused.value || isEditing.value) return search.value
  return selectedRegion.value?.name ?? ''
})

const fetchSuggestions = debounce(async (query) => {
  const q = String(query ?? '').trim()
  if (!q) {
    suggestOptions.value = []
    suggestLoading.value = false
    return
  }
  suggestLoading.value = true
  try {
    const result = await searchRabotaRegions({ query: q, limit: 100 })
    const raw = result?.data
    const list = Array.isArray(raw) ? raw : (raw?.items ?? raw?.regions ?? [])
    suggestOptions.value = (Array.isArray(list) ? list : [])
      .map(normalizeRegion)
      .filter((item) => item?.name)
  } catch (e) {
    console.warn('searchRabotaRegions:', e)
    suggestOptions.value = []
  } finally {
    suggestLoading.value = false
  }
}, 300)

function applySelection(region) {
  selectedRegion.value = region
  search.value = region?.name ?? ''
  emit('update:modelValue', region)
}

function selectOption(option) {
  isSelecting.value = true
  const normalized = normalizeRegion(option)
  if (normalized) applySelection(normalized)
  isOpen.value = false
  isFocused.value = false
  isEditing.value = false
  nextTick(() => inputRef.value?.blur())
}

function selectFirstResult() {
  if (suggestOptions.value.length) selectOption(suggestOptions.value[0])
}

function clearSelection() {
  selectedRegion.value = null
  search.value = ''
  emit('update:modelValue', null)
}

function handleFocus() {
  isFocused.value = true
  isEditing.value = true
  if (selectedRegion.value?.name && !search.value) {
    search.value = selectedRegion.value.name
  }
  if (search.value.trim()) {
    isOpen.value = true
    fetchSuggestions(search.value)
  }
}

function handleBlur() {
  setTimeout(() => {
    if (isSelecting.value) {
      isSelecting.value = false
      return
    }
    isFocused.value = false
    isOpen.value = false
    isEditing.value = false
    if (selectedRegion.value) {
      search.value = selectedRegion.value.name || ''
    } else {
      search.value = ''
    }
  }, 150)
}

function handleInput(event) {
  search.value = event.target.value
  isEditing.value = true
  isOpen.value = true
  fetchSuggestions(search.value)
}

function closeList() {
  isOpen.value = false
}

function onDocumentClick(e) {
  if (!wrapperRef.value?.contains(e.target)) {
    isOpen.value = false
  }
}

watch(
  () => props.modelValue,
  (val) => {
    if (val?.id != null || val?.name) {
      const normalized = normalizeRegion(val)
      if (normalized) {
        selectedRegion.value = normalized
        if (!isFocused.value) search.value = normalized.name
      }
    } else {
      selectedRegion.value = null
      if (!isFocused.value) search.value = ''
    }
  },
  { immediate: true, deep: true },
)

onMounted(() => document.addEventListener('click', onDocumentClick))
onUnmounted(() => {
  document.removeEventListener('click', onDocumentClick)
  fetchSuggestions.cancel?.()
})
</script>

<style scoped>
.rabota-region-suggest-scroll {
  scrollbar-width: thin;
  scrollbar-color: #c5cad8 transparent;
}

.rabota-region-suggest-scroll::-webkit-scrollbar {
  width: 6px;
}

.rabota-region-suggest-scroll::-webkit-scrollbar-thumb {
  background-color: #c5cad8;
  border-radius: 3px;
}
</style>
