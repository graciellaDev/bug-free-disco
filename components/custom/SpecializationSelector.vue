<template>
  <div class="w-full relative" ref="wrapperRef">
    <div
      class="flex items-center border rounded-ten min-h-10 bg-athens-gray overflow-hidden"
      :class="[
        props.error ? 'border-red-500' : 'border-athens',
        { 'border-[#5898ff]': !props.error && (isDropdownOpen || isCatalogOpen) }
      ]"
    >
      <div class="flex-1 flex items-center min-w-0 pl-15px">
        <svg-icon name="search" width="20" height="20" class="text-bali shrink-0 mr-2" />
        <input
          ref="inputRef"
          v-model="searchText"
          type="text"
          class="flex-1 bg-transparent text-sm text-[#2F353D] placeholder:text-bali outline-none min-w-0"
          placeholder="Выберите из списка"
          @focus="onFocus"
          @blur="onBlur"
          @input="onSearchInput"
        />
      </div>
      <button
        type="button"
        class="shrink-0 p-3 border-l border-athens hover:bg-athens-gray transition-colors text-bali hover:text-space"
        @click.stop="openCatalog"
        aria-label="Открыть каталог специализаций"
      >
        <svg-icon name="drag-burger" width="20" height="20" />
      </button>
    </div>
    <transition name="slide-fade">
      <div
        v-if="isDropdownOpen"
        class="absolute left-0 right-0 top-full mt-1 max-h-52 overflow-y-auto bg-white border border-athens rounded-plus shadow-shadow-droplist z-20"
      >
        <template v-if="filteredOptions.length > 0">
          <div
            v-for="option in filteredOptions"
            :key="getOptionKey(option)"
            class="text-slate-custom hover:text-space cursor-pointer hover:bg-gallery py-3 px-15px text-sm border-b border-athens last:border-b-0"
            :class="{ 'bg-gallery': isSelected(option) }"
            @mousedown.prevent="selectOption(option)"
          >
            {{ getOptionLabel(option) }}
          </div>
        </template>
        <div v-else class="py-4 px-15px text-sm text-bali">
          Нет вариантов. Выберите отрасль или откройте каталог.
        </div>
      </div>
    </transition>
    <SpecializationCatalogModal
      v-if="isCatalogOpen"
      :open="isCatalogOpen"
      @update:open="isCatalogOpen = $event"
      :categories="fullCatalog"
      :selected="modelValue"
      @select="onCatalogSelect"
    />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import SpecializationCatalogModal from './SpecializationCatalogModal.vue'

const props = defineProps({
  options: {
    type: Array,
    default: () => [],
  },
  fullCatalog: {
    type: Array,
    default: () => [],
  },
  modelValue: {
    type: [Object, String, null],
    default: null,
  },
  placeholder: {
    type: String,
    default: 'Выберите из списка',
  },
  error: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['update:modelValue', 'focus', 'blur'])

const wrapperRef = ref(null)
const inputRef = ref(null)
const searchText = ref('')
const isDropdownOpen = ref(false)
const isCatalogOpen = ref(false)

const getOptionLabel = (opt) => (opt && typeof opt === 'object' ? opt.name : opt) ?? ''
const getOptionKey = (opt) => (opt?.id ?? opt?.name ?? opt) ?? ''
const isSelected = (opt) => {
  const val = props.modelValue
  if (!val) return false
  const label = getOptionLabel(val)
  return getOptionLabel(opt) === label || (opt?.id && val?.id && String(opt.id) === String(val.id))
}

const allOptions = computed(() => {
  if (props.options && props.options.length > 0) return props.options
  const fromCatalog = []
  ;(props.fullCatalog || []).forEach((cat) => {
    const roles = cat?.roles && Array.isArray(cat.roles) ? cat.roles : []
    fromCatalog.push(...roles)
  })
  return fromCatalog
})

const filteredOptions = computed(() => {
  const query = (searchText.value || '').trim().toLowerCase()
  if (!query) return allOptions.value
  return allOptions.value.filter((opt) => getOptionLabel(opt).toLowerCase().includes(query))
})

const openDropdown = () => {
  isDropdownOpen.value = true
  searchText.value = ''
}

const onFocus = () => {
  openDropdown()
  emit('focus')
}

const onBlur = () => {
  emit('blur')
}

const onSearchInput = () => {
  isDropdownOpen.value = true
}

const openCatalog = (e) => {
  e?.preventDefault?.()
  isCatalogOpen.value = true
  isDropdownOpen.value = false
}

const selectOption = (option) => {
  emit('update:modelValue', option)
  searchText.value = ''
  isDropdownOpen.value = false
}

const onCatalogSelect = (option) => {
  emit('update:modelValue', option)
  isCatalogOpen.value = false
}

const closeDropdown = (e) => {
  if (wrapperRef.value && !wrapperRef.value.contains(e.target)) {
    isDropdownOpen.value = false
  }
}

watch(
  () => props.modelValue,
  (val) => {
    searchText.value = val ? getOptionLabel(val) : ''
  },
  { immediate: true }
)

onMounted(() => {
  document.addEventListener('click', closeDropdown)
})
onBeforeUnmount(() => {
  document.removeEventListener('click', closeDropdown)
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
