<template>
  <UiDialog :open="props.open" @update:open="$emit('update:open', $event)">
    <UiDialogContent
      class="sm:max-w-[480px] rounded-fifteen border border-athens bg-white p-0 gap-0 overflow-hidden"
      :class="props.class"
    >
      <div class="p-6 pb-0">
        <UiDialogHeader>
          <UiDialogTitle class="text-xl font-semibold text-space">
            Специализация сотрудника
          </UiDialogTitle>
          <UiDialogDescription class="text-sm text-slate-custom mt-2">
            Выберите профессию, а если нет подходящих — наиболее близкую или пункт «Другое»
          </UiDialogDescription>
        </UiDialogHeader>
        <div class="relative mt-4">
          <svg-icon
            name="search"
            width="20"
            height="20"
            class="absolute left-3 top-1/2 -translate-y-1/2 text-bali"
          />
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Поиск"
            class="w-full pl-10 pr-4 py-2.5 text-sm border border-athens rounded-ten bg-athens-gray text-[#2F353D] placeholder:text-bali outline-none focus:border-[#5898ff]"
          />
        </div>
      </div>
      <div class="max-h-[320px] overflow-y-auto border-t border-athens mt-4">
        <div
          v-for="category in filteredCategories"
          :key="category.id || category.name"
          class="border-b border-athens last:border-b-0"
        >
          <button
            type="button"
            class="w-full flex items-center justify-between py-3 px-4 text-left text-sm text-space hover:bg-athens-gray transition-colors"
            @click="toggleCategory(category)"
          >
            <span>{{ getCategoryName(category) }}</span>
            <svg-icon
              name="dropdown-arrow"
              width="16"
              height="16"
              class="text-bali transition-transform duration-200"
              :class="{ 'rotate-180': expandedIds.has(category.id || category.name) }"
            />
          </button>
          <div
            v-if="expandedIds.has(category.id || category.name)"
            class="bg-athens-gray/30 pb-2"
          >
            <div
              v-for="role in getFilteredRoles(category)"
              :key="role.id || role.name"
              class="py-2 px-4 pl-8 text-sm text-slate-custom hover:text-space cursor-pointer hover:bg-gallery"
              :class="{ 'bg-gallery text-dodger font-medium': isRoleSelected(role) }"
              @click="selectRole(role, category)"
            >
              {{ role.name }}
            </div>
            <div
              v-if="getFilteredRoles(category).length === 0"
              class="py-2 px-4 pl-8 text-sm text-bali"
            >
              Нет подходящих вариантов
            </div>
          </div>
        </div>
        <div v-if="filteredCategories.length === 0" class="py-8 px-4 text-center text-bali text-sm">
          Ничего не найдено
        </div>
      </div>
      <div class="flex gap-3 p-4 border-t border-athens bg-white">
        <UiButton
          variant="outline"
          class="flex-1 rounded-ten"
          @click="$emit('update:open', false)"
        >
          Отменить
        </UiButton>
        <UiButton
          variant="default"
          class="flex-1 rounded-ten bg-dodger hover:bg-dodger/90 text-white"
          :disabled="!selectedRole"
          @click="confirmSelect"
        >
          Выбрать
        </UiButton>
      </div>
    </UiDialogContent>
  </UiDialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import {
  Dialog as UiDialog,
  DialogContent as UiDialogContent,
  DialogHeader as UiDialogHeader,
  DialogTitle as UiDialogTitle,
  DialogDescription as UiDialogDescription,
} from '~/components/ui/dialog'
import UiButton from '~/components/ui/button/Button.vue'

const props = defineProps({
  open: {
    type: Boolean,
    default: false,
  },
  categories: {
    type: Array,
    default: () => [],
  },
  selected: {
    type: [Object, String, null],
    default: null,
  },
  class: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['update:open', 'select'])

const searchQuery = ref('')
const expandedIds = ref(new Set())
const selectedRole = ref(null)
const selectedCategory = ref(null)

const getCategoryName = (cat) => cat?.name ?? cat?.label ?? ''
const getCategoryRoles = (cat) => (cat?.roles && Array.isArray(cat.roles) ? cat.roles : [])

const filteredCategories = computed(() => {
  const q = (searchQuery.value || '').trim().toLowerCase()
  if (!q) return props.categories
  return props.categories.filter((cat) => {
    const name = getCategoryName(cat).toLowerCase()
    if (name.includes(q)) return true
    const roles = getCategoryRoles(cat)
    return roles.some((r) => (r.name || '').toLowerCase().includes(q))
  })
})

const getFilteredRoles = (category) => {
  const roles = getCategoryRoles(category)
  const q = (searchQuery.value || '').trim().toLowerCase()
  if (!q) return roles
  return roles.filter((r) => (r.name || '').toLowerCase().includes(q))
}

const toggleCategory = (category) => {
  const id = category.id || category.name
  const next = new Set(expandedIds.value)
  if (next.has(id)) next.delete(id)
  else next.add(id)
  expandedIds.value = next
}

const isRoleSelected = (role) => {
  const s = selectedRole.value
  if (!s) return false
  return (role.id && s.id && String(role.id) === String(s.id)) || role.name === s.name
}

const selectRole = (role, category) => {
  selectedRole.value = role
  selectedCategory.value = category
}

const confirmSelect = () => {
  if (selectedRole.value) {
    emit('select', selectedRole.value)
    emit('update:open', false)
    selectedRole.value = null
    selectedCategory.value = null
  }
}

watch(
  () => props.open,
  (open) => {
    if (open) {
      searchQuery.value = ''
      selectedRole.value = props.selected || null
      const q = (searchQuery.value || '').trim().toLowerCase()
      if (q) {
        const toExpand = new Set()
        props.categories.forEach((cat) => {
          const roles = getCategoryRoles(cat)
          if (roles.some((r) => (r.name || '').toLowerCase().includes(q))) {
            toExpand.add(cat.id || cat.name)
          }
        })
        expandedIds.value = toExpand
      } else {
        expandedIds.value = new Set()
      }
    }
  }
)

watch(searchQuery, (q) => {
  const query = (q || '').trim().toLowerCase()
  if (query) {
    const toExpand = new Set()
    props.categories.forEach((cat) => {
      const roles = getCategoryRoles(cat)
      if (roles.some((r) => (r.name || '').toLowerCase().includes(query))) {
        toExpand.add(cat.id || cat.name)
      }
    })
    expandedIds.value = toExpand
  } else {
    expandedIds.value = new Set()
  }
})
</script>
