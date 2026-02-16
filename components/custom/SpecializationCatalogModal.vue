<template>
  <!-- Свой overlay без Radix Portal — при v-if="false" у родителя окно исчезает -->
  <Teleport to="body">
    <div
      v-if="props.open"
      class="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="spec-modal-title"
    >
      <div
        class="absolute inset-0 bg-black/80"
        aria-hidden="true"
        @click="closeModal"
      />
      <div
        class="relative w-full max-w-[480px] rounded-fifteen border border-athens bg-white shadow-lg flex flex-col max-h-[90vh]"
        :class="props.class"
        @click.stop
      >
        <div class="p-6 pb-0 shrink-0">
          <div class="flex items-start justify-between gap-4">
            <div>
              <h2 id="spec-modal-title" class="text-xl font-semibold text-space">
                Специализация сотрудника
              </h2>
              <p class="text-sm text-slate-custom mt-2">
                Выберите профессию, а если нет подходящих — наиболее близкую или пункт «Другое»
              </p>
            </div>
            <button
              type="button"
              class="shrink-0 p-1 rounded hover:bg-athens-gray text-bali hover:text-space transition-colors"
              aria-label="Закрыть"
              @click="closeModal"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
            </button>
          </div>
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
        <div class="max-h-[320px] overflow-y-auto border-t border-athens mt-4 shrink-0">
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
        <div class="flex gap-3 p-4 border-t border-athens bg-white shrink-0">
          <button
            type="button"
            class="w-full rounded-ten bg-dodger hover:bg-dodger/90 text-white py-2.5 px-4 text-sm font-medium transition-colors"
            @click="confirmSelect"
          >
            Выбрать
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

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
  /** Вызывается при необходимости закрыть окно (гарантированно с родителя) */
  onClose: {
    type: Function,
    default: null,
  },
})

const emit = defineEmits(['update:open', 'select'])

const searchQuery = ref('')
const expandedIds = ref(new Set())
const selectedRole = ref(null)

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
  // Сразу выбираем специализацию и закрываем окно
  emit('select', role)
  closeModal()
}

const closeModal = () => {
  if (typeof props.onClose === 'function') {
    props.onClose()
  }
  emit('update:open', false)
}

const confirmSelect = () => {
  // То же действие, что и у кнопки «Закрыть» — только закрыть окно
  closeModal()
}

watch(
  () => props.open,
  (open) => {
    if (open) {
      searchQuery.value = ''
      expandedIds.value = new Set()
      selectedRole.value = props.selected || null
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
