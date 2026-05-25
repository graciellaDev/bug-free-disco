<template>
  <Teleport to="body">
    <div
      v-if="props.open"
      class="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="rabota-professions-modal-title"
    >
      <div
        class="absolute inset-0 bg-black/80"
        aria-hidden="true"
        @click="cancel"
      />
      <div
        class="relative w-full max-w-[720px] overflow-hidden rounded-fifteen border border-athens bg-white shadow-lg flex flex-col max-h-[90vh]"
        @click.stop
      >
        <div class="p-6 pb-4 shrink-0">
          <h2 id="rabota-professions-modal-title" class="text-xl font-semibold text-space">
            Профессиональные сферы
          </h2>
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
              placeholder="Поиск по категориям и сферам"
              class="w-full pl-10 pr-4 py-2.5 text-sm border border-athens rounded-ten bg-athens-gray text-[#2F353D] placeholder:text-bali outline-none focus:border-[#5898ff]"
            />
          </div>
        </div>

        <div class="flex min-h-[280px] max-h-[360px] border-y border-athens mx-6 rounded-ten overflow-hidden shrink-0">
          <div class="w-1/2 border-r border-athens overflow-y-auto bg-white">
            <div v-if="isLoading" class="py-10 px-4 text-center text-sm text-bali">
              Загрузка…
            </div>
            <div v-else-if="loadError" class="py-10 px-4 text-center text-sm text-red-custom">
              {{ loadError }}
            </div>
            <template v-else>
              <template v-for="(section, sectionIndex) in leftColumnSections" :key="sectionIndex">
                <div
                  v-if="section.header"
                  class="px-4 pt-3 pb-1 text-xs text-bali font-normal"
                >
                  {{ section.header }}
                </div>
                <button
                  v-for="sub in section.items"
                  :key="getNodeKey(sub)"
                  type="button"
                  class="w-full flex items-center justify-between gap-2 py-2.5 px-4 text-left text-sm transition-colors"
                  :class="isLeftActive(sub)
                    ? 'bg-athens-gray text-space font-medium'
                    : 'text-space hover:bg-athens-gray/60'"
                  :disabled="isLoadingSubcategory && isLeftActive(sub)"
                  @click="selectSubcategory(sub)"
                >
                  <span class="min-w-0">{{ sub.name }}</span>
                  <svg-icon
                    v-if="sub.children?.length || sub.id"
                    name="dropdown-arrow"
                    width="16"
                    height="16"
                    class="shrink-0 text-bali -rotate-90"
                  />
                </button>
              </template>
              <div
                v-if="leftColumnSections.length === 0"
                class="py-10 px-4 text-center text-sm text-bali"
              >
                Ничего не найдено
              </div>
            </template>
          </div>

          <div class="w-1/2 overflow-y-auto bg-white">
            <div v-if="isLoadingSubcategory" class="py-10 px-4 text-center text-sm text-bali">
              Загрузка сфер…
            </div>
            <template v-else-if="activeSubcategory">
              <template v-for="block in rightColumnBlocks" :key="block.key">
                <div
                  v-if="block.showHeader"
                  class="px-4 pt-3 pb-1 text-xs text-bali font-normal"
                >
                  {{ block.name }}
                </div>
                <button
                  v-for="profession in block.professions"
                  :key="profession.id"
                  type="button"
                  class="w-full py-2.5 px-4 text-left text-sm transition-colors"
                  :class="professionRowClass(profession)"
                  :disabled="isProfessionDisabled(profession)"
                  @click="toggleProfession(profession)"
                >
                  {{ profession.name }}
                </button>
              </template>
              <div
                v-if="rightColumnBlocks.length === 0"
                class="py-10 px-4 text-center text-sm text-bali"
              >
                Нет доступных профессий
              </div>
            </template>
            <div v-else class="py-10 px-4 text-center text-sm text-bali">
              Выберите категорию слева
            </div>
          </div>
        </div>

        <div class="px-6 pt-4 pb-2 shrink-0">
          <p class="text-sm text-bali leading-normal">
            Выберите подходящие профессиональные сферы.
          </p>
          <p class="text-sm text-bali leading-normal">
            Не более пяти.
          </p>
          <p v-if="limitReached" class="text-xs text-red-custom mt-1">
            Достигнут лимит — можно выбрать не более {{ props.maxSelection }} сфер.
          </p>
        </div>

        <div class="flex gap-3 p-6 pt-4 shrink-0">
          <button
            type="button"
            class="rounded-ten bg-dodger hover:bg-dodger/90 text-white py-2.5 px-5 text-sm font-medium transition-colors"
            @click="save"
          >
            Сохранить
          </button>
          <button
            type="button"
            class="rounded-ten bg-athens-gray hover:bg-gallery text-space py-2.5 px-5 text-sm font-medium transition-colors"
            @click="cancel"
          >
            Отменить
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { getRabotaProfessionsHierarchy } from '@/utils/rabotaAccount'
import {
  getNodeKey,
  buildRightColumnBlocks,
  buildLeftColumnSections,
  findFirstNavigableSubcategory,
  nodeHasProfessionDescendants,
} from '@/utils/rabotaProfessionsHierarchy'

const props = defineProps({
  open: {
    type: Boolean,
    default: false,
  },
  selected: {
    type: Array,
    default: () => [],
  },
  maxSelection: {
    type: Number,
    default: 5,
  },
})

const emit = defineEmits(['update:open', 'save'])

const searchQuery = ref('')
const hierarchyRoots = ref([])
const activeSubcategory = ref(null)
const draftSelected = ref([])
const isLoading = ref(false)
const isLoadingSubcategory = ref(false)
const loadError = ref(null)
const limitReached = ref(false)
let searchDebounceTimer = null

const leftColumnSections = computed(() => buildLeftColumnSections(hierarchyRoots.value))

const findNodeInTree = (nodes, id) => {
  if (!Array.isArray(nodes) || id == null) return null
  for (const node of nodes) {
    if (node.id === id) return node
    const nested = node.children?.length ? findNodeInTree(node.children, id) : null
    if (nested) return nested
  }
  return null
}

const isLeftActive = (sub) => {
  const active = activeSubcategory.value
  if (!active) return false
  return getNodeKey(sub) === getNodeKey(active)
}

const mergeSubcategoryChildren = (target, source) => {
  if (!source?.children?.length) return target
  return {
    ...target,
    children: source.children,
  }
}

const loadSubcategoryDetails = async (sub) => {
  if (!sub?.id || nodeHasProfessionDescendants(sub)) {
    return sub
  }

  isLoadingSubcategory.value = true
  try {
    const result = await getRabotaProfessionsHierarchy({ category_id: sub.id })
    if (result.error || !Array.isArray(result.data) || !result.data.length) {
      return sub
    }

    const detailed = findNodeInTree(result.data, sub.id) ?? result.data[0]
    if (detailed?.children?.length) {
      return mergeSubcategoryChildren(sub, detailed)
    }

    const looksLikeChildrenList = result.data.every(
      (node) => node.type === 'group' || node.type === 'profession',
    )
    if (looksLikeChildrenList) {
      return { ...sub, children: result.data }
    }

    return sub
  } finally {
    isLoadingSubcategory.value = false
  }
}

const selectSubcategory = async (sub) => {
  activeSubcategory.value = await loadSubcategoryDetails(sub)
}

const rightColumnBlocks = computed(() => buildRightColumnBlocks(activeSubcategory.value))

const isProfessionSelected = (profession) =>
  draftSelected.value.some((p) => String(p.id) === String(profession.id))

const isProfessionDisabled = (profession) =>
  !isProfessionSelected(profession) && draftSelected.value.length >= props.maxSelection

const professionRowClass = (profession) => {
  if (isProfessionSelected(profession)) {
    return 'bg-gallery text-dodger font-medium'
  }
  if (isProfessionDisabled(profession)) {
    return 'text-bali cursor-not-allowed opacity-60'
  }
  return 'text-space hover:bg-athens-gray/60 cursor-pointer'
}

const toggleProfession = (profession) => {
  limitReached.value = false
  const idx = draftSelected.value.findIndex((p) => String(p.id) === String(profession.id))
  if (idx >= 0) {
    draftSelected.value = draftSelected.value.filter((_, i) => i !== idx)
    return
  }
  if (draftSelected.value.length >= props.maxSelection) {
    limitReached.value = true
    return
  }
  draftSelected.value = [...draftSelected.value, profession]
}

const pickInitialSubcategory = async () => {
  const first = findFirstNavigableSubcategory(hierarchyRoots.value)
  if (!first) {
    activeSubcategory.value = null
    return
  }
  activeSubcategory.value = await loadSubcategoryDetails(first)
}

const loadHierarchy = async (search) => {
  isLoading.value = true
  loadError.value = null
  try {
    const params = { per_page: 50 }
    if (search?.trim()) {
      params.search = search.trim()
      params.roots_only = 0
    }
    const result = await getRabotaProfessionsHierarchy(params)
    if (result.error) {
      loadError.value = String(result.error)
      hierarchyRoots.value = []
      activeSubcategory.value = null
      return
    }
    hierarchyRoots.value = Array.isArray(result.data) ? result.data : []
    await pickInitialSubcategory()
  } finally {
    isLoading.value = false
  }
}

const closeModal = () => {
  emit('update:open', false)
}

const save = () => {
  emit('save', [...draftSelected.value])
  closeModal()
}

const cancel = () => {
  closeModal()
}

watch(
  () => props.open,
  (open) => {
    if (!open) return
    searchQuery.value = ''
    limitReached.value = false
    draftSelected.value = (props.selected ?? [])
      .filter((p) => p?.id)
      .map((p) => ({
        id: p.id,
        name: p.name,
        tree: p.tree,
        local_id: p.local_id,
      }))
    loadHierarchy()
  },
)

watch(searchQuery, (q) => {
  if (searchDebounceTimer) clearTimeout(searchDebounceTimer)
  searchDebounceTimer = setTimeout(() => {
    loadHierarchy(q)
  }, 300)
})
</script>


