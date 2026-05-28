<template>
  <div class="tag-input-wrapper flex flex-col">
    <div v-if="tags.length" class="tags flex flex-wrap gap-x-5px mb-15px">
      <div
        v-for="(tag, index) in tags"
        :key="`${skillName(tag)}-${index}`"
        class="tag flex items-center bg-zumthor py-5px rounded-ten font-medium text-dodger text-sm px-10px"
      >
        {{ skillName(tag) }}
        <button type="button" class="remove-button cursor-pointer ml-1" @click="removeTag(index)">
          <svg-icon name="reset-tag" width="20" height="20" />
        </button>
      </div>
    </div>
    <div class="relative">
      <div class="input-container relative w-full">
        <input
          type="text"
          v-model="currentTag"
          @keyup.enter="addTagFromInput"
          @input="onSearchInput"
          :placeholder="isFocused ? '' : placeholder"
          class="input-skills w-full py-[9px] pl-[42px] border rounded-ten bg-athens-gray text-sm font-normal focus:outline-none focus:border-dodger"
          :class="error ? 'border-red-custom' : 'border-athens'"
          @focus="isFocused = true"
          @blur="onBlur"
        />
        <button
          v-if="currentTag"
          type="button"
          class="clear-input absolute top-2/4 right-4 text-slate-custom"
          @click="clearInput"
        >
          ✖
        </button>
      </div>
      <transition name="slide-fade">
        <ul
          v-if="isOpen && (suggestOptions.length || suggestLoading)"
          class="autocomplete-list absolute w-full bg-white border border-athens rounded-plus shadow-shadow-droplist top-12 z-10 max-h-52 overflow-y-auto"
        >
          <li v-if="suggestLoading" class="text-slate-custom text-sm font-normal py-10px px-15px">
            Поиск…
          </li>
          <li
            v-for="(option, index) in suggestOptions"
            :key="`${option.name}-${index}`"
            class="option text-slate-custom text-sm font-normal py-10px px-15px hover:text-space hover:bg-zumthor cursor-pointer"
            :class="index < suggestOptions.length - 1 ? 'border-b border-athens' : ''"
            @mousedown.prevent="selectOption(option)"
          >
            {{ option.name }}
          </li>
        </ul>
      </transition>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { debounce } from '@/utils/debounce'
import { suggestRabotaSkills } from '@/utils/rabotaAccount'

const props = defineProps({
  modelValue: {
    type: Array,
    default: () => [],
  },
  placeholder: {
    type: String,
    default: 'Например, Активный',
  },
  error: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['update:modelValue'])

const currentTag = ref('')
const isFocused = ref(false)
const isOpen = ref(false)
const suggestOptions = ref([])
const suggestLoading = ref(false)
const tags = ref(normalizeTags(props.modelValue))

watch(
  () => props.modelValue,
  (value) => {
    tags.value = normalizeTags(value)
  },
  { deep: true },
)

function normalizeTags(value) {
  if (!Array.isArray(value)) return []
  return value
    .map((item) => {
      if (typeof item === 'string') {
        const name = item.trim()
        return name ? { name } : null
      }
      if (item && typeof item === 'object') {
        const name = String(item.name ?? item.title ?? item.skill ?? '').trim()
        return name ? { name, ...(item.id != null ? { id: item.id } : {}) } : null
      }
      return null
    })
    .filter(Boolean)
}

function normalizeSuggestItem(item) {
  if (typeof item === 'string') {
    const name = item.trim()
    return name ? { name } : null
  }
  if (item && typeof item === 'object') {
    const name = String(item.name ?? item.title ?? item.skill ?? item.value ?? '').trim()
    if (!name) return null
    const id = item.id ?? item.skill_id
    return id != null ? { id, name } : { name }
  }
  return null
}

function skillName(tag) {
  return typeof tag === 'object' && tag != null ? tag.name : String(tag ?? '')
}

function normText(value) {
  return String(value ?? '')
    .trim()
    .toLowerCase()
}

function isSelected(name) {
  const target = normText(name)
  return tags.value.some((tag) => normText(skillName(tag)) === target)
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
    const result = await suggestRabotaSkills(q)
    const raw = result?.data
    const list = Array.isArray(raw) ? raw : (raw?.items ?? raw?.skills ?? [])
    suggestOptions.value = (Array.isArray(list) ? list : [])
      .map(normalizeSuggestItem)
      .filter((item) => item?.name && !isSelected(item.name))
  } catch (e) {
    console.warn('suggestRabotaSkills:', e)
    suggestOptions.value = []
  } finally {
    suggestLoading.value = false
  }
}, 300)

function onSearchInput() {
  isOpen.value = true
  fetchSuggestions(currentTag.value)
}

function onBlur() {
  isFocused.value = false
  window.setTimeout(() => {
    isOpen.value = false
  }, 150)
}

function emitTags() {
  emit('update:modelValue', [...tags.value])
}

function selectOption(option) {
  if (!option?.name || isSelected(option.name)) return
  tags.value = [...tags.value, { name: option.name, ...(option.id != null ? { id: option.id } : {}) }]
  emitTags()
  clearInput()
}

function addTagFromInput() {
  const name = currentTag.value.trim()
  if (!name || isSelected(name)) {
    clearInput()
    return
  }
  tags.value = [...tags.value, { name }]
  emitTags()
  clearInput()
}

function removeTag(index) {
  tags.value = tags.value.filter((_, i) => i !== index)
  emitTags()
}

function clearInput() {
  currentTag.value = ''
  suggestOptions.value = []
  suggestLoading.value = false
}
</script>

<style scoped>
.input-skills {
  background-image: url('../../assets/sprite/svg/search.svg');
  background-repeat: no-repeat;
  background-position: 15px center;
}

.input-skills::placeholder {
  color: #9098b4;
}

.clear-input {
  transform: translateY(-50%);
  cursor: pointer;
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
</style>
