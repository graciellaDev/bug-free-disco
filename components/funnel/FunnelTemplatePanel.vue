<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import Popup from '~/components/custom/Popup.vue'
import MyInput from '~/components/custom/MyInput.vue'
import MyDropdown from '~/components/custom/MyDropdown.vue'
import {
  getFunnelTemplates,
  getFunnelTemplateStages,
  createFunnelTemplate,
  applyFunnelTemplate,
  type FunnelTemplateItem,
  type FunnelTemplateStageItem,
} from '@/src/api/funnelTemplates'
import { isPresetFunnelTemplate } from '@/utils/funnelTemplatePresetNames'

const props = defineProps<{
  vacancyId?: string | number | null
}>()

const emit = defineEmits<{
  applied: []
  saved: []
}>()

const LS_LAST_TEMPLATE_KEY = 'jobly_last_funnel_template_id'

const semiactionBtnClass =
  'bg-athens-gray border border-athens text-space hover:bg-zumthor hover:border-dodger shrink-0 whitespace-nowrap'

const templatesList = ref<FunnelTemplateItem[]>([])
const selectedTemplateId = ref<number | null>(null)
const previewStages = ref<FunnelTemplateStageItem[]>([])
const loadingTemplates = ref(false)
const loadingPreview = ref(false)
const applyingTemplate = ref(false)
const savingTemplate = ref(false)

const openPickPopup = ref(false)
const openApplyConfirm = ref(false)
const openSavePopup = ref(false)
const templateName = ref('')
const openPopups = ref<string[]>([])

const vacancyIdResolved = computed(() => {
  const v = props.vacancyId
  if (v == null || v === '') return null
  return String(v)
})

const selectedTemplate = computed(() =>
  templatesList.value.find((t) => t.id === selectedTemplateId.value) ?? null
)

const templateDropdownOptions = computed(() => {
  const opts: Array<{ type: 'header'; name: string } | { id: number; name: string; value: number }> = []
  const presets = templatesList.value.filter((t) => isPresetFunnelTemplate(t.name))
  const custom = templatesList.value.filter((t) => !isPresetFunnelTemplate(t.name))
  if (presets.length) {
    opts.push({ type: 'header', name: 'Рекомендуемые' })
    for (const t of presets) {
      opts.push({ id: t.id, name: formatTemplateLabel(t), value: t.id })
    }
  }
  if (custom.length) {
    opts.push({ type: 'header', name: 'Мои шаблоны' })
    for (const t of custom) {
      opts.push({ id: t.id, name: formatTemplateLabel(t), value: t.id })
    }
  }
  return opts
})

const canApply = computed(
  () => !!vacancyIdResolved.value && selectedTemplateId.value != null && !applyingTemplate.value
)

const canSave = computed(
  () => !!vacancyIdResolved.value && !!(templateName.value && templateName.value.trim()) && !savingTemplate.value
)

function formatTemplateLabel(t: FunnelTemplateItem): string {
  if (t.stages_count != null) return `${t.name} (${t.stages_count} этапов)`
  return t.name
}

function onTemplateSelect(value: unknown) {
  if (value == null || value === '') {
    selectedTemplateId.value = null
    return
  }
  const n = typeof value === 'object' && value !== null && 'id' in value
    ? Number((value as { id: number }).id)
    : Number(value)
  selectedTemplateId.value = Number.isFinite(n) ? n : null
}

function enableBodyScroll(popupId: string) {
  openPopups.value = openPopups.value.filter((id) => id !== popupId)
  if (openPopups.value.length === 0 && typeof document !== 'undefined') {
    document.body.style.overflow = ''
  }
}

function disableBodyScroll(popupId: string) {
  if (!openPopups.value.includes(popupId)) {
    openPopups.value.push(popupId)
  }
  if (typeof document !== 'undefined') {
    document.body.style.overflow = 'hidden'
  }
}

async function loadTemplates() {
  loadingTemplates.value = true
  try {
    templatesList.value = await getFunnelTemplates()
    const stored = typeof localStorage !== 'undefined' ? localStorage.getItem(LS_LAST_TEMPLATE_KEY) : null
    const storedId = stored ? Number(stored) : NaN
    if (Number.isFinite(storedId) && templatesList.value.some((t) => t.id === storedId)) {
      selectedTemplateId.value = storedId
    } else if (templatesList.value.length && selectedTemplateId.value == null) {
      const universal = templatesList.value.find((t) => t.name === 'Универсальный подбор')
      selectedTemplateId.value = universal?.id ?? templatesList.value[0].id
    }
  } catch (e) {
    console.error('Не удалось загрузить список шаблонов', e)
  } finally {
    loadingTemplates.value = false
  }
}

async function loadPreview(templateId: number | null) {
  if (templateId == null) {
    previewStages.value = []
    return
  }
  loadingPreview.value = true
  try {
    previewStages.value = await getFunnelTemplateStages(templateId)
  } catch (e) {
    console.error(e)
    previewStages.value = []
  } finally {
    loadingPreview.value = false
  }
}

watch(selectedTemplateId, (id) => {
  void loadPreview(id)
})

async function openTemplatesPopup() {
  if (!vacancyIdResolved.value) return
  if (!templatesList.value.length && !loadingTemplates.value) {
    await loadTemplates()
  }
  openPickPopup.value = true
  disableBodyScroll('pick-template')
}

function closeTemplatesPopup() {
  openPickPopup.value = false
  enableBodyScroll('pick-template')
}

function openApplyDialog() {
  if (!canApply.value) return
  openApplyConfirm.value = true
  disableBodyScroll('apply-template')
}

function closeApplyDialog() {
  openApplyConfirm.value = false
  enableBodyScroll('apply-template')
}

async function confirmApply() {
  const tid = selectedTemplateId.value
  const vid = vacancyIdResolved.value
  if (tid == null || !vid) return
  applyingTemplate.value = true
  try {
    await applyFunnelTemplate(vid, tid)
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(LS_LAST_TEMPLATE_KEY, String(tid))
    }
    closeApplyDialog()
    closeTemplatesPopup()
    emit('applied')
  } catch (e) {
    console.error('Не удалось применить шаблон', e)
  } finally {
    applyingTemplate.value = false
  }
}

function openSaveDialog() {
  if (!vacancyIdResolved.value) return
  templateName.value = ''
  openSavePopup.value = true
  disableBodyScroll('save-template')
}

function closeSaveDialog() {
  openSavePopup.value = false
  enableBodyScroll('save-template')
}

async function submitSave() {
  const name = templateName.value.trim()
  const vid = vacancyIdResolved.value
  if (!name || !vid) return
  savingTemplate.value = true
  try {
    const created = await createFunnelTemplate(name, vid)
    await loadTemplates()
    selectedTemplateId.value = created.id
    closeSaveDialog()
    emit('saved')
  } catch (e) {
    console.error('Не удалось сохранить шаблон', e)
  } finally {
    savingTemplate.value = false
  }
}

onMounted(() => {
  void loadTemplates()
})
</script>

<template>
  <div class="funnel-template-actions shrink-0">
    <p
      v-if="!vacancyIdResolved"
      class="text-sm text-slate-custom leading-normal text-right max-w-[280px]"
    >
      Сначала сохраните вакансию.
    </p>

    <div
      v-else
      class="flex flex-row flex-wrap items-center justify-end gap-2"
    >
      <UiButton
        variant="semiaction"
        size="semiaction"
        :class="semiactionBtnClass"
        @click="openTemplatesPopup"
      >
        Шаблоны воронок
      </UiButton>
      <UiButton
        variant="semiaction"
        size="semiaction"
        :class="semiactionBtnClass"
        @click="openSaveDialog"
      >
        Сохранить как шаблон
      </UiButton>
    </div>
  </div>

  <transition name="fade" @after-leave="enableBodyScroll('pick-template')">
    <Popup
      :isOpen="openPickPopup"
      width="490px"
      :showCloseButton="false"
      :lgSize="true"
      :parentRounded="true"
      :contentRounded="false"
      :contentPadding="false"
      @close="closeTemplatesPopup"
    >
      <div class="popup-delete-content flex flex-col gap-y-6">
        <div>
          <h2 class="text-xl font-semibold text-space mb-2">
            Шаблоны воронок
          </h2>
          <p class="text-sm text-slate-custom leading-relaxed">
            Выберите шаблон из кабинета и примените его к этой вакансии.
          </p>
        </div>

        <div v-if="loadingTemplates" class="text-sm text-slate-custom">
          Загрузка шаблонов…
        </div>
        <div v-else-if="!templateDropdownOptions.length" class="text-sm text-slate-custom">
          Нет шаблонов.
          <NuxtLink
            to="/settings/recruiting/SettingsFunnel"
            class="text-dodger hover:opacity-80"
          >
            Создать в настройках
          </NuxtLink>
        </div>
        <template v-else>
          <div>
            <label class="text-sm font-medium text-space mb-2 block">
              Шаблон
            </label>
            <MyDropdown
              :options="templateDropdownOptions"
              :model-value="selectedTemplateId"
              placeholder="Выберите шаблон"
              searchable
              search-placeholder="Поиск…"
              class="w-full"
              @update:model-value="onTemplateSelect"
            />
          </div>

          <div v-if="loadingPreview" class="text-sm text-slate-custom">
            Загрузка этапов…
          </div>
          <ul
            v-else-if="previewStages.length"
            class="text-sm text-space max-h-40 overflow-y-auto border border-athens rounded-ten p-3 bg-athens-gray space-y-1.5"
          >
            <li
              v-for="(s, i) in previewStages"
              :key="s.id"
              class="flex flex-wrap gap-x-2"
            >
              <span class="text-bali">{{ i + 1 }}.</span>
              <span>{{ s.name }}</span>
              <span v-if="s.max_days != null" class="text-dodger">макс. {{ s.max_days }} дн.</span>
            </li>
          </ul>
        </template>

        <div class="flex flex-wrap gap-x-3 gap-y-2">
          <button
            type="button"
            class="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md transition-colors bg-space hover:bg-space/90 text-white p-semi-btn text-sm rounded-ten leading-normal h-fit font-semibold disabled:opacity-50"
            :disabled="!canApply"
            @click="openApplyDialog"
          >
            Применить к вакансии
          </button>
          <button
            type="button"
            class="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md transition-colors bg-athens-gray border border-athens text-slate-custom p-border-semi-btn text-sm rounded-ten leading-normal font-medium"
            @click="closeTemplatesPopup"
          >
            Закрыть
          </button>
        </div>

        <NuxtLink
          to="/settings/recruiting/SettingsFunnel"
          class="text-sm text-dodger font-normal hover:opacity-80 -mt-2"
          @click="closeTemplatesPopup"
        >
          Все шаблоны в настройках →
        </NuxtLink>
      </div>
    </Popup>
  </transition>

  <transition name="fade" @after-leave="enableBodyScroll('apply-template')">
    <Popup
      :isOpen="openApplyConfirm"
      width="490px"
      :showCloseButton="false"
      :lgSize="true"
      :parentRounded="true"
      :contentRounded="false"
      :contentPadding="false"
      @close="closeApplyDialog"
    >
      <div class="popup-delete-content flex flex-col gap-y-6">
        <h2 class="text-xl font-semibold text-space">
          Применить шаблон?
        </h2>
        <p class="text-sm text-slate-custom leading-relaxed">
          Этапы и сроки вакансии будут заменены шаблоном
          <strong v-if="selectedTemplate"> «{{ selectedTemplate.name }}»</strong>.
        </p>
        <div class="flex gap-x-3">
          <button
            type="button"
            class="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md transition-colors bg-space hover:bg-space/90 text-white p-semi-btn text-sm rounded-ten leading-normal h-fit font-semibold disabled:opacity-50"
            :disabled="applyingTemplate"
            @click="confirmApply"
          >
            {{ applyingTemplate ? 'Применение…' : 'Применить' }}
          </button>
          <button
            type="button"
            class="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md transition-colors bg-athens-gray border border-athens text-slate-custom p-border-semi-btn text-sm rounded-ten leading-normal font-medium"
            @click="closeApplyDialog"
          >
            Отмена
          </button>
        </div>
      </div>
    </Popup>
  </transition>

  <transition name="fade" @after-leave="enableBodyScroll('save-template')">
    <Popup
      :isOpen="openSavePopup"
      width="490px"
      :showCloseButton="false"
      :lgSize="true"
      :parentRounded="true"
      :contentRounded="false"
      :contentPadding="false"
      @close="closeSaveDialog"
    >
      <div class="popup-delete-content flex flex-col gap-y-6">
        <h2 class="text-xl font-semibold text-space">
          Сохранить как шаблон
        </h2>
        <p class="text-sm text-slate-custom">
          Текущие этапы и сроки этой вакансии сохранятся в библиотеку шаблонов кабинета.
        </p>
        <div>
          <label class="text-sm font-medium text-space mb-2 block">
            Название шаблона
          </label>
          <MyInput
            v-model="templateName"
            placeholder="Введите название"
            class="w-full"
          />
        </div>
        <div class="flex gap-x-3">
          <button
            type="button"
            class="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md transition-colors bg-space hover:bg-space/90 text-white p-semi-btn text-sm rounded-ten leading-normal h-fit font-semibold disabled:opacity-50"
            :disabled="!canSave"
            @click="submitSave"
          >
            {{ savingTemplate ? 'Сохранение…' : 'Сохранить' }}
          </button>
          <button
            type="button"
            class="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md transition-colors bg-athens-gray border border-athens text-slate-custom p-border-semi-btn text-sm rounded-ten leading-normal font-medium"
            @click="closeSaveDialog"
          >
            Отмена
          </button>
        </div>
      </div>
    </Popup>
  </transition>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
