<template>
  <div class="w-full relative" ref="wrapperRef">
    <input
      type="text"
      ref="inputRef"
      :value="displayValue"
      class="bg-athens-gray border text-sm rounded-ten min-h-10 pl-15px w-full py-[9px] pr-15px text-[#2F353D]"
      :class="[
        error ? 'border-red-500' : 'border-athens',
        { focused: isFocused, 'has-value': search || selectedWorkplace },
      ]"
      :placeholder="isFocused ? '' : placeholder"
      @focus="handleFocus"
      @blur="handleBlur"
      @keydown.esc="closeList"
      @keydown.enter.prevent="selectFirstResult"
      @input="handleInput"
    />
    <button
      v-if="selectedWorkplace && !isFocused"
      type="button"
      @click.stop="clearSelection"
      class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-custom hover:text-space cursor-pointer"
    >
      ✖
    </button>
    <transition name="slide-fade">
      <ul
        v-if="isOpen && (suggestOptions.length || suggestLoading)"
        class="rabota-workplace-suggest-scroll absolute left-0 right-0 top-full max-h-52 overflow-y-auto overscroll-y-contain bg-white z-50 shadow-shadow-droplist rounded-plus border border-athens mt-1"
        @mousedown.prevent.capture
      >
        <li v-if="suggestLoading" class="text-slate-custom text-sm font-normal py-10px px-15px">
          Поиск…
        </li>
        <li
          v-for="(option, index) in suggestOptions"
          :key="`${option.id ?? option.name}-${index}`"
          @mousedown.prevent="selectOption(option)"
          class="flex items-center gap-2 cursor-pointer hover:bg-zumthor py-10px px-15px border-b border-athens last:border-b-0"
        >
          <div class="flex-1 min-w-0">
            <div
              class="text-sm leading-normal"
              :class="needsConfirmation(option) ? 'text-space' : 'text-slate-custom hover:text-space'"
            >
              {{ option.name }}
            </div>
            <div
              v-if="needsConfirmation(option)"
              class="text-xs text-red-custom leading-normal mt-0.5"
            >
              Требует подтверждения
            </div>
          </div>
          <span
            v-if="needsConfirmation(option)"
            class="shrink-0 flex items-center justify-center"
            aria-hidden="true"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M8 1.333L14.667 14H1.333L8 1.333Z" fill="#f50a0a" />
              <path d="M8 5.5V9" stroke="white" stroke-width="1.25" stroke-linecap="round" />
              <circle cx="8" cy="10.75" r="0.75" fill="white" />
            </svg>
          </span>
        </li>
      </ul>
      <div
        v-else-if="isOpen && search.trim() && !suggestLoading && !suggestOptions.length"
        class="absolute left-0 right-0 bg-white z-10 shadow-shadow-droplist rounded-plus border border-athens mt-1"
      >
        <div class="text-slate-custom text-sm font-normal py-10px px-15px">
          Адрес не найден
        </div>
      </div>
    </transition>

    <RabotaWorkplaceConfirmPopup
      :open="confirmPopupOpen"
      :workplace="pendingWorkplace"
      :region-id="regionId"
      @close="closeConfirmPopup"
      @confirmed="onWorkplaceConfirmed"
    />
  </div>
</template>

<script setup>
import { computed, ref, watch, nextTick, onMounted, onUnmounted } from 'vue'
import debounce from 'lodash/debounce'
import { searchRabotaWorkplaces } from '@/utils/rabotaAccount'
import RabotaWorkplaceConfirmPopup from '~/components/platforms/RabotaWorkplaceConfirmPopup.vue'

const props = defineProps({
  modelValue: {
    type: Object,
    default: null,
  },
  regionId: {
    type: [Number, String],
    default: null,
  },
  placeholder: {
    type: String,
    default: 'Введите адрес, метро или название компании',
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
const wrapperRef = ref(null)
const inputRef = ref(null)
const suggestOptions = ref([])
const suggestLoading = ref(false)
const confirmPopupOpen = ref(false)
const pendingWorkplace = ref(null)

const selectedWorkplace = computed(() => {
  const id = props.modelValue?.id
  const name = props.modelValue?.name
  if (id == null && !name) return null
  return { id, name: name ?? '' }
})

const displayValue = computed(() => search.value)

function needsConfirmation(option) {
  return option != null && option.kladr_id === null
}

function readKladrId(item) {
  if (Object.prototype.hasOwnProperty.call(item, 'kladr_id')) {
    return item.kladr_id
  }
  if (Object.prototype.hasOwnProperty.call(item, 'kladrId')) {
    return item.kladrId
  }
  return undefined
}

function normalizeWorkplace(item) {
  if (typeof item === 'string') {
    const name = item.trim()
    return name ? { name } : null
  }
  if (item && typeof item === 'object') {
    const name = String(
      item.name ?? item.title ?? item.address ?? item.full_address ?? item.value ?? '',
    ).trim()
    if (!name) return null
    const id = item.id ?? item.workplace_id ?? item.address_id
    const kladr_id = readKladrId(item)
    const base = {
      name,
      ...(kladr_id !== undefined ? { kladr_id } : {}),
      ...(item.address != null ? { address: item.address } : {}),
      ...(item.region != null ? { region: item.region } : {}),
      ...(item.region_id != null ? { region_id: item.region_id } : {}),
      ...(item.subway_stations != null ? { subway_stations: item.subway_stations } : {}),
    }
    return id != null ? { id, ...base } : base
  }
  return null
}

const fetchSuggestions = debounce(async (query) => {
  const q = String(query ?? '').trim()
  if (!q) {
    suggestOptions.value = []
    suggestLoading.value = false
    return
  }
  suggestLoading.value = true
  try {
    const result = await searchRabotaWorkplaces({ query: q, limit: 10, offset: 0 })
    const raw = result?.data
    const list = Array.isArray(raw) ? raw : (raw?.items ?? raw?.workplaces ?? [])
    suggestOptions.value = (Array.isArray(list) ? list : [])
      .map(normalizeWorkplace)
      .filter((item) => item?.name)
  } catch (e) {
    console.warn('searchRabotaWorkplaces:', e)
    suggestOptions.value = []
  } finally {
    suggestLoading.value = false
  }
}, 300)

function handleFocus() {
  isFocused.value = true
  if (selectedWorkplace.value?.name && !search.value) {
    search.value = selectedWorkplace.value.name
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
    if (selectedWorkplace.value && !isEditing.value) {
      search.value = selectedWorkplace.value.name || ''
    } else if (!selectedWorkplace.value && !search.value) {
      search.value = ''
    }
    isEditing.value = false
  }, 200)
}

async function handleInput(event) {
  const inputValue = event.target.value
  isEditing.value = true
  search.value = inputValue
  await nextTick()

  if (!inputValue.trim()) {
    emit('update:modelValue', null)
    suggestOptions.value = []
    isOpen.value = false
  } else {
    if (
      selectedWorkplace.value?.name &&
      inputValue !== selectedWorkplace.value.name
    ) {
      emit('update:modelValue', null)
    }
    isOpen.value = true
    fetchSuggestions(inputValue)
  }

  setTimeout(() => {
    isEditing.value = false
  }, 500)
}

function applySelection(option) {
  if (!option?.id) return
  const payload = { id: option.id, name: option.name }
  if (option.kladr_id !== undefined) {
    payload.kladr_id = option.kladr_id
  }
  emit('update:modelValue', payload)
  search.value = option.name
  isFocused.value = false
  isOpen.value = false
  suggestOptions.value = []
}

function selectOption(option) {
  if (!option?.id) return
  isSelecting.value = true
  if (needsConfirmation(option)) {
    pendingWorkplace.value = { ...option }
    confirmPopupOpen.value = true
    isOpen.value = false
    inputRef.value?.blur()
    setTimeout(() => {
      isSelecting.value = false
    }, 250)
    return
  }
  applySelection(option)
  inputRef.value?.blur()
  setTimeout(() => {
    isSelecting.value = false
  }, 250)
}

function closeConfirmPopup() {
  confirmPopupOpen.value = false
  pendingWorkplace.value = null
}

function onWorkplaceConfirmed(workplace) {
  applySelection(workplace)
  closeConfirmPopup()
}

function selectFirstResult() {
  if (suggestOptions.value.length > 0) {
    selectOption(suggestOptions.value[0])
  }
}

function clearSelection() {
  emit('update:modelValue', null)
  search.value = ''
  suggestOptions.value = []
}

function closeList() {
  isOpen.value = false
  isFocused.value = false
}

watch(
  () => props.modelValue,
  () => {
    if (isFocused.value || isEditing.value) return
    nextTick(() => {
      if (selectedWorkplace.value?.name) {
        const workplaceName = selectedWorkplace.value.name
        if (search.value !== workplaceName) {
          search.value = workplaceName
        }
      } else if (!props.modelValue?.id) {
        if (!isFocused.value) search.value = ''
      }
    })
  },
  { deep: true, flush: 'post', immediate: true },
)

function handleClickOutside(event) {
  if (wrapperRef.value && !wrapperRef.value.contains(event.target)) {
    closeList()
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
  fetchSuggestions.cancel?.()
})
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

.rabota-workplace-suggest-scroll {
  scrollbar-width: thin;
  scrollbar-color: #c5cad8 transparent;
}

.rabota-workplace-suggest-scroll::-webkit-scrollbar {
  width: 6px;
}

.rabota-workplace-suggest-scroll::-webkit-scrollbar-track {
  background: transparent;
  margin: 4px 0;
}

.rabota-workplace-suggest-scroll::-webkit-scrollbar-thumb {
  background-color: #c5cad8;
  border-radius: 3px;
}

.rabota-workplace-suggest-scroll::-webkit-scrollbar-thumb:hover {
  background-color: #9098b4;
}
</style>
