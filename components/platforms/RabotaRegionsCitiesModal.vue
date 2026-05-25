<template>
  <Teleport to="body">
    <div
      v-if="props.open"
      class="fixed inset-0 z-[210] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="rabota-regions-cities-title"
    >
      <div class="absolute inset-0 bg-black/80" aria-hidden="true" @click="cancel" />
      <div
        class="relative w-full max-w-[640px] overflow-hidden rounded-fifteen border border-athens bg-white shadow-lg flex flex-col max-h-[90vh]"
        @click.stop
      >
        <div class="p-6 pb-4 shrink-0">
          <h2 id="rabota-regions-cities-title" class="text-xl font-semibold text-space">
            Где разместить вакансию
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
              placeholder="Поиск по региону или городу"
              class="w-full pl-10 pr-4 py-2.5 text-sm border border-athens rounded-ten bg-athens-gray text-[#2F353D] placeholder:text-bali outline-none focus:border-[#5898ff]"
              @input="onSearchInput"
            />
          </div>
        </div>

        <div
          class="flex min-h-[280px] max-h-[360px] border-y border-athens mx-6 rounded-ten overflow-hidden shrink-0"
        >
          <div class="w-1/2 border-r border-athens overflow-y-auto bg-white rabota-regions-modal-scroll">
            <div v-if="leftLoading" class="py-10 px-4 text-center text-sm text-bali">
              Загрузка…
            </div>
            <div v-else-if="leftError" class="py-10 px-4 text-center text-sm text-red-custom">
              {{ leftError }}
            </div>
            <template v-else>
              <button
                v-for="region in leftRegions"
                :key="regionKey(region)"
                type="button"
                class="w-full flex items-center justify-between gap-2 py-2.5 px-4 text-left text-sm transition-colors border-b border-athens last:border-b-0"
                :class="
                  isLeftActive(region)
                    ? 'bg-athens-gray text-space font-medium'
                    : 'text-space hover:bg-athens-gray/60'
                "
                @click="selectLeftRegion(region)"
              >
                <span class="min-w-0 flex items-center gap-2">
                  <span v-if="region.is_all_russia" class="text-base leading-none" aria-hidden="true">🇷🇺</span>
                  <span>{{ region.name }}</span>
                </span>
                <svg-icon
                  v-if="region.has_children !== false"
                  name="dropdown-arrow"
                  width="16"
                  height="16"
                  class="shrink-0 text-bali -rotate-90"
                />
              </button>
              <div
                v-if="!leftRegions.length"
                class="py-10 px-4 text-center text-sm text-bali"
              >
                Ничего не найдено
              </div>
            </template>
          </div>

          <div class="w-1/2 overflow-y-auto bg-white rabota-regions-modal-scroll">
            <div v-if="rightLoading" class="py-10 px-4 text-center text-sm text-bali">
              Загрузка…
            </div>
            <div v-else-if="rightError" class="py-10 px-4 text-center text-sm text-red-custom">
              {{ rightError }}
            </div>
            <template v-else-if="activeLeftRegion">
              <button
                v-for="city in rightCities"
                :key="regionKey(city)"
                type="button"
                class="w-full py-2.5 px-4 text-left text-sm transition-colors border-b border-athens last:border-b-0"
                :class="
                  isRightSelected(city)
                    ? 'bg-athens-gray text-space font-medium'
                    : 'text-space hover:bg-athens-gray/60'
                "
                @click="selectRightCity(city)"
              >
                {{ city.name }}
              </button>
              <div
                v-if="!rightCities.length"
                class="py-10 px-4 text-center text-sm text-bali"
              >
                Нет городов в этом регионе
              </div>
            </template>
            <div v-else class="py-10 px-4 text-center text-sm text-bali">
              Выберите регион слева
            </div>
          </div>
        </div>

        <div class="px-6 pt-4 pb-2 shrink-0">
          <p class="text-sm text-bali leading-normal">
            Выберите один или несколько городов показа, регион или всю Россию!
          </p>
        </div>

        <div class="flex gap-3 p-6 pt-2 shrink-0">
          <button
            type="button"
            class="rounded-ten bg-dodger hover:bg-dodger/90 text-white py-2.5 px-5 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            :disabled="!pendingSelection?.id"
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
import { ref, watch } from 'vue'
import debounce from 'lodash/debounce'
import { searchRabotaRegions } from '@/utils/rabotaAccount'

const props = defineProps({
  open: {
    type: Boolean,
    default: false,
  },
  modelValue: {
    type: Object,
    default: null,
  },
})

const emit = defineEmits(['close', 'confirm'])

const searchQuery = ref('')
const leftRegions = ref([])
const rightCities = ref([])
const activeLeftRegion = ref(null)
const pendingSelection = ref(null)
const leftLoading = ref(false)
const rightLoading = ref(false)
const leftError = ref('')
const rightError = ref('')

function normalizeRegion(item) {
  if (!item || typeof item !== 'object') return null
  const name = String(
    item.name ?? item.title ?? item.region_name ?? item.city ?? '',
  ).trim()
  const id = item.id ?? item.region_id
  if (!name && id == null) return null
  const isAllRussia =
    item.is_all_russia === true ||
    /всю\s+россию/i.test(name) ||
    String(item.alias ?? '').toLowerCase() === 'all_russia'
  return {
    ...(id != null ? { id } : {}),
    name: name || String(id),
    has_children: item.has_children ?? item.has_subregions ?? !isAllRussia,
    is_all_russia: isAllRussia,
  }
}

function regionKey(region) {
  return `${region?.id ?? 'noid'}-${region?.name ?? ''}`
}

function isLeftActive(region) {
  return activeLeftRegion.value && regionKey(activeLeftRegion.value) === regionKey(region)
}

function isRightSelected(city) {
  return pendingSelection.value && regionKey(pendingSelection.value) === regionKey(city)
}

function parseRegionsList(raw) {
  const list = Array.isArray(raw) ? raw : (raw?.items ?? raw?.regions ?? [])
  return (Array.isArray(list) ? list : []).map(normalizeRegion).filter((r) => r?.name)
}

async function loadLeftRegions() {
  leftLoading.value = true
  leftError.value = ''
  try {
    const result = await searchRabotaRegions({
      query: searchQuery.value.trim() || undefined,
      limit: 100,
    })
    if (result?.error) {
      leftError.value = result.error
      leftRegions.value = []
      return
    }
    leftRegions.value = parseRegionsList(result?.data)
    if (leftRegions.value.length && !activeLeftRegion.value) {
      await selectLeftRegion(leftRegions.value[0], !!pendingSelection.value)
    } else if (activeLeftRegion.value) {
      const still = leftRegions.value.find(
        (r) => regionKey(r) === regionKey(activeLeftRegion.value),
      )
      if (still) {
        activeLeftRegion.value = still
        await loadRightCities(still.id)
      } else if (leftRegions.value.length) {
        await selectLeftRegion(leftRegions.value[0], false)
      } else {
        activeLeftRegion.value = null
        rightCities.value = []
      }
    }
  } catch (e) {
    console.warn('loadLeftRegions:', e)
    leftError.value = 'Не удалось загрузить регионы'
    leftRegions.value = []
  } finally {
    leftLoading.value = false
  }
}

async function loadRightCities(parentId) {
  if (parentId == null) {
    rightCities.value = []
    return
  }
  rightLoading.value = true
  rightError.value = ''
  try {
    const result = await searchRabotaRegions({
      parent_id: parentId,
      limit: 100,
      query: searchQuery.value.trim() || undefined,
    })
    if (result?.error) {
      rightError.value = result.error
      rightCities.value = []
      return
    }
    rightCities.value = parseRegionsList(result?.data)
  } catch (e) {
    console.warn('loadRightCities:', e)
    rightError.value = 'Не удалось загрузить города'
    rightCities.value = []
  } finally {
    rightLoading.value = false
  }
}

async function selectLeftRegion(region, preservePending = true) {
  activeLeftRegion.value = region
  if (!preservePending) {
    pendingSelection.value = null
  }
  if (region?.is_all_russia) {
    rightCities.value = []
    pendingSelection.value = region
    return
  }
  await loadRightCities(region?.id)
}

function selectRightCity(city) {
  pendingSelection.value = city
}

const fetchLeftDebounced = debounce(() => {
  activeLeftRegion.value = null
  pendingSelection.value = null
  rightCities.value = []
  loadLeftRegions()
}, 300)

function onSearchInput() {
  fetchLeftDebounced()
}

function save() {
  if (pendingSelection.value?.id != null) {
    emit('confirm', pendingSelection.value)
  }
  emit('close')
}

function cancel() {
  emit('close')
}

function resetModalState() {
  searchQuery.value = ''
  leftRegions.value = []
  rightCities.value = []
  activeLeftRegion.value = null
  pendingSelection.value = props.modelValue ? normalizeRegion(props.modelValue) : null
  leftError.value = ''
  rightError.value = ''
}

watch(
  () => props.open,
  async (open) => {
    if (!open) {
      fetchLeftDebounced.cancel?.()
      return
    }
    resetModalState()
    await loadLeftRegions()
    if (pendingSelection.value?.id != null && leftRegions.value.length) {
      const parentMatch = leftRegions.value.find((r) =>
        rightCities.value.some((c) => regionKey(c) === regionKey(pendingSelection.value)),
      )
      if (!parentMatch && activeLeftRegion.value) {
        const selected = rightCities.value.find(
          (c) => regionKey(c) === regionKey(pendingSelection.value),
        )
        if (selected) pendingSelection.value = selected
      }
    }
  },
)
</script>

<style scoped>
.rabota-regions-modal-scroll {
  scrollbar-width: thin;
  scrollbar-color: #c5cad8 transparent;
}

.rabota-regions-modal-scroll::-webkit-scrollbar {
  width: 6px;
}

.rabota-regions-modal-scroll::-webkit-scrollbar-thumb {
  background-color: #c5cad8;
  border-radius: 3px;
}
</style>
