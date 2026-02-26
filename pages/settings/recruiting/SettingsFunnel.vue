<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue'
import draggable from 'vuedraggable'
import DotsDropdown from '~/components/custom/DotsDropdown.vue'
import Popup from '@/components/custom/Popup.vue'
import MyInput from '@/components/custom/MyInput.vue'
import {
  getFunnelTemplates,
  getFunnelTemplateStages,
  createTemplateStage,
  reorderTemplateStages,
  updateTemplateStage,
  deleteTemplateStage,
  deleteFunnelTemplate,
  updateFunnelTemplate,
  createFunnelTemplateWithDefaults,
  duplicateFunnelTemplate,
  type FunnelTemplateItem,
  type FunnelTemplateStageItem,
} from '@/src/api/funnelTemplates'

definePageMeta({
  layout: 'settings',
})

useHead({
  title: 'Настройки — Шаблоны воронок',
})

interface StageItem {
  id: number
  title: string
  isLocked: boolean
  maxDays: number | null
}

interface TemplateWithStages extends FunnelTemplateItem {
  stagesOpen: boolean
  stages: FunnelTemplateStageItem[]
  stageItems: StageItem[]
  stagesLoading: boolean
}

function mapStagesToItems(stages: FunnelTemplateStageItem[]): StageItem[] {
  return stages.map((s) => ({
    id: s.id,
    title: s.name,
    isLocked: !!s.fixed,
    maxDays: s.max_days ?? null,
  }))
}

const templates = ref<TemplateWithStages[]>([])
const loading = ref(true)
const editingTemplateId = ref<number | null>(null)
const editingStageId = ref<number | null>(null)
const editingName = ref('')
const stageNameInputRef = ref<HTMLInputElement | null>(null)
const removingTemplateId = ref<number | null>(null)
const removingStageId = ref<number | null>(null)
const removingItemTitle = ref('')
const openRemoveStagePopup = ref(false)
const openRemoveTemplatePopup = ref(false)
const removingTemplateName = ref('')
const openTimeLimitPopup = ref(false)
const timeLimitTemplateId = ref<number | null>(null)
const timeLimitStage = ref<{ id: number; title: string; maxDays: number | null } | null>(null)
const timeLimitDays = ref('')
const savingTimeLimit = ref(false)
const isDragging = ref(false)
const openActionComingSoon = ref(false)
const addingTemplate = ref(false)
const editingTemplateNameId = ref<number | null>(null)
const editingTemplateName = ref('')
const templateNameInputRef = ref<HTMLInputElement | null>(null)

async function loadTemplates() {
  loading.value = true
  try {
    const list = await getFunnelTemplates()
    templates.value = list.map((t) => ({
      ...t,
      stagesOpen: false,
      stages: [],
      stageItems: [],
      stagesLoading: false,
    }))
  } catch (e) {
    console.error('Ошибка загрузки шаблонов воронок', e)
  } finally {
    loading.value = false
  }
}

async function toggleStages(template: TemplateWithStages) {
  template.stagesOpen = !template.stagesOpen
  if (template.stagesOpen && template.stages.length === 0) {
    template.stagesLoading = true
    try {
      template.stages = await getFunnelTemplateStages(template.id)
      template.stageItems = mapStagesToItems(template.stages)
    } catch (e) {
      console.error('Ошибка загрузки этапов шаблона', e)
    } finally {
      template.stagesLoading = false
    }
  }
}

function getTemplate(id: number): TemplateWithStages | undefined {
  return templates.value.find((t) => t.id === id)
}

async function onDragEnd(template: TemplateWithStages) {
  isDragging.value = false
  if (template.stageItems.length === 0) return
  try {
    const stageIds = template.stageItems.map((i) => i.id)
    const stages = await reorderTemplateStages(template.id, stageIds)
    template.stages = stages
    template.stageItems = mapStagesToItems(stages)
    template.stages_count = stages.length
  } catch (e) {
    console.error('Ошибка сохранения порядка этапов', e)
    template.stages = await getFunnelTemplateStages(template.id)
    template.stageItems = mapStagesToItems(template.stages)
  }
}

function startEditStage(templateId: number, element: StageItem) {
  editingTemplateId.value = templateId
  editingStageId.value = element.id
  editingName.value = element.title
  nextTick(() => stageNameInputRef.value?.focus())
}

async function saveEditStage() {
  if (editingStageId.value === null || editingTemplateId.value === null || !editingName.value.trim()) {
    editingTemplateId.value = null
    editingStageId.value = null
    return
  }
  const name = editingName.value.trim()
  const template = getTemplate(editingTemplateId.value)
  if (!template) return
  try {
    const stages = await updateTemplateStage(editingTemplateId.value, editingStageId.value, { name })
    template.stages = stages
    template.stageItems = mapStagesToItems(stages)
    template.stages_count = stages.length
  } catch (e) {
    console.error('Ошибка переименования этапа', e)
  } finally {
    editingTemplateId.value = null
    editingStageId.value = null
  }
}

function openRemoveStagePopupFor(templateId: number, item: StageItem) {
  removingTemplateId.value = templateId
  removingStageId.value = item.id
  removingItemTitle.value = item.title
  openRemoveStagePopup.value = true
}

function closeRemoveStagePopup() {
  openRemoveStagePopup.value = false
  removingTemplateId.value = null
  removingStageId.value = null
}

async function confirmRemoveStage() {
  if (removingTemplateId.value === null || removingStageId.value === null) {
    closeRemoveStagePopup()
    return
  }
  const template = getTemplate(removingTemplateId.value)
  if (!template) return
  try {
    const stages = await deleteTemplateStage(removingTemplateId.value, removingStageId.value)
    template.stages = stages
    template.stageItems = mapStagesToItems(stages)
    template.stages_count = stages.length
    closeRemoveStagePopup()
  } catch (e) {
    console.error('Ошибка удаления этапа', e)
  }
}

async function addStage(template: TemplateWithStages) {
  try {
    const stages = await createTemplateStage(template.id, 'Новый этап')
    template.stages = stages
    template.stageItems = mapStagesToItems(stages)
    template.stages_count = stages.length
  } catch (e) {
    console.error('Ошибка добавления этапа', e)
  }
}

function openTimeLimitFor(templateId: number, stage: StageItem) {
  timeLimitTemplateId.value = templateId
  timeLimitStage.value = stage
  timeLimitDays.value = stage.maxDays != null ? String(stage.maxDays) : ''
  openTimeLimitPopup.value = true
}

function closeTimeLimitPopup() {
  openTimeLimitPopup.value = false
  timeLimitTemplateId.value = null
  timeLimitStage.value = null
}

async function saveTimeLimit() {
  if (timeLimitTemplateId.value === null || !timeLimitStage.value) return
  const days = timeLimitDays.value.trim() ? Math.max(1, parseInt(timeLimitDays.value, 10) || 0) : null
  const template = getTemplate(timeLimitTemplateId.value)
  if (!template) return
  savingTimeLimit.value = true
  try {
    const stages = await updateTemplateStage(
      timeLimitTemplateId.value,
      timeLimitStage.value.id,
      { max_days: days }
    )
    template.stages = stages
    template.stageItems = mapStagesToItems(stages)
    template.stages_count = stages.length
    closeTimeLimitPopup()
  } catch (e) {
    console.error('Ошибка сохранения времени на этапе', e)
  } finally {
    savingTimeLimit.value = false
  }
}

function onTemplateDropdownSelect(template: TemplateWithStages, item: string) {
  if (item === 'Копировать') {
    duplicateTemplate(template)
  } else if (item === 'Удалить воронку') {
    removingTemplateName.value = template.name
    removingTemplateId.value = template.id
    openRemoveTemplatePopup.value = true
  }
}

async function duplicateTemplate(template: TemplateWithStages) {
  try {
    await duplicateFunnelTemplate(template.id)
    await loadTemplates()
  } catch (e) {
    console.error('Ошибка копирования шаблона', e)
  }
}

async function addNewTemplate() {
  if (addingTemplate.value) return
  addingTemplate.value = true
  try {
    await createFunnelTemplateWithDefaults('Новая воронка')
    await loadTemplates()
  } catch (e) {
    console.error('Ошибка создания шаблона', e)
  } finally {
    addingTemplate.value = false
  }
}

function startEditTemplateName(funnel: TemplateWithStages) {
  editingTemplateNameId.value = funnel.id
  editingTemplateName.value = funnel.name
  nextTick(() => templateNameInputRef.value?.focus())
}

async function saveEditTemplateName() {
  if (editingTemplateNameId.value === null || !editingTemplateName.value.trim()) {
    editingTemplateNameId.value = null
    return
  }
  const name = editingTemplateName.value.trim()
  const template = getTemplate(editingTemplateNameId.value)
  if (!template) {
    editingTemplateNameId.value = null
    return
  }
  try {
    await updateFunnelTemplate(editingTemplateNameId.value, { name })
    template.name = name
  } catch (e) {
    console.error('Ошибка переименования шаблона', e)
  } finally {
    editingTemplateNameId.value = null
  }
}

function closeRemoveTemplatePopup() {
  openRemoveTemplatePopup.value = false
  removingTemplateId.value = null
  removingTemplateName.value = ''
}

async function confirmRemoveTemplate() {
  if (removingTemplateId.value === null) {
    closeRemoveTemplatePopup()
    return
  }
  try {
    await deleteFunnelTemplate(removingTemplateId.value)
    templates.value = templates.value.filter((t) => t.id !== removingTemplateId.value)
    closeRemoveTemplatePopup()
  } catch (e) {
    console.error('Ошибка удаления шаблона', e)
  }
}

onMounted(() => {
  loadTemplates()
})
</script>

<template>
  <div>
    <div class="mb-2.5">
      <div class="flex justify-between mb-1px bg-white rounded-fifteen p-25px gap-2.5 pb-23px items-center">
        <div>
          <p class="text-xl text-space mb-2.5 font-semibold">Шаблоны воронок</p>
          <p class="text-sm text-bali font-normal leading-150">
            Сохранённые воронки найма. Их можно применить к любой вакансии в настройках воронки вакансии.
          </p>
        </div>
        <UiButton
          variant="action"
          size="semiaction"
          :disabled="addingTemplate"
          @click="addNewTemplate"
        >
          {{ addingTemplate ? 'Создание…' : 'Добавить новый шаблон' }}
        </UiButton>
      </div>
    </div>
    <div class="[&>*:not(:last-child)]:mb-11px">
      <template v-if="loading">
        <div class="bg-white rounded-fifteen p-25px flex items-center justify-center min-h-[120px]">
          <p class="text-sm text-slate-custom">Загрузка…</p>
        </div>
      </template>
      <template v-else-if="templates.length > 0">
        <div
          v-for="funnel in templates"
          :key="funnel.id"
          class="bg-white rounded-fifteen p-25px"
        >
          <div class="flex justify-between gap-x-2.5 items-center">
            <div class="min-w-0 flex-1">
              <div class="flex items-center gap-x-2 mb-5px">
                <template v-if="editingTemplateNameId === funnel.id">
                  <input
                    ref="templateNameInputRef"
                    v-model="editingTemplateName"
                    type="text"
                    class="text-lg text-space font-medium leading-130 border border-athens rounded-ten px-3 py-1.5 w-full max-w-[33%] outline-none ring-0 focus:ring-0 focus:outline-none"
                    @keydown.enter="saveEditTemplateName"
                    @blur="saveEditTemplateName"
                  />
                </template>
                <template v-else>
                  <p class="text-lg text-space font-medium leading-130">
                    {{ funnel.name }}
                  </p>
                  <button
                    type="button"
                    class="p-1.5 text-slate-custom hover:text-dodger transition-colors shrink-0"
                    aria-label="Переименовать"
                    @click="startEditTemplateName(funnel)"
                  >
                    <svg-icon name="pencil" width="16" height="16" />
                  </button>
                </template>
              </div>
              <p class="text-sm font-normal text-bali">
                {{ funnel.stages_count ?? funnel.stageItems.length ?? 0 }} этапов
              </p>
            </div>
            <div class="flex gap-x-2.5 items-center">
              <button
                type="button"
                class="text-sm cursor-pointer transition-all w-fit h-fit select-none flex gap-x-2.5 py-2.5 px-5 items-center rounded-ten whitespace-nowrap"
                :class="[
                  funnel.stagesOpen ? 'bg-space text-white' : 'bg-zumthor text-dodger',
                ]"
                @click="toggleStages(funnel)"
              >
                <span>{{ funnel.stagesOpen ? 'Скрыть этапы' : 'Раскрыть этапы' }}</span>
                <span
                  class="flex h-fit transition-transform"
                  :class="{ 'rotate-180': funnel.stagesOpen }"
                >
                  <svg-icon name="dropdown-arrow" width="16" height="16" />
                </span>
              </button>
              <DotsDropdown
                :items="['Копировать', 'Удалить воронку']"
                @select-item="(item: string) => onTemplateDropdownSelect(funnel, item)"
              />
            </div>
          </div>

          <div v-if="funnel.stagesOpen" class="mt-5">
            <div v-if="funnel.stagesLoading" class="text-sm text-slate-custom py-4">
              Загрузка этапов…
            </div>
            <template v-else>
              <draggable
                v-model="funnel.stageItems"
                :item-key="(el: StageItem) => el.id"
                handle=".drag-handle"
                animation="200"
                ghost-class="ghost"
                chosen-class="chosen"
                @start="isDragging = true"
                @end="() => { onDragEnd(funnel); isDragging = false }"
              >
                <template #item="{ element }">
                  <div class="card flex mb-2.5" :class="{ 'dragging-card': isDragging }">
                    <div class="drag-handle p-2.5 mr-15px cursor-grab h-fit">
                      <svg-icon name="drag-burger" width="20" height="20" />
                    </div>
                    <div class="w-full">
                      <div class="flex justify-between items-center w-full mb-2.5">
                        <div
                          class="w-full border border-athens rounded-ten flex items-center pl-15px pr-2.5 py-9px mr-2.5 min-h-[40px] cursor-pointer"
                          :class="{
                            'bg-feta': element.title === 'Нанят на работу',
                            'bg-pink': element.title === 'Отказ',
                            'bg-athens-gray':
                              element.title !== 'Нанят на работу' && element.title !== 'Отказ',
                          }"
                          @click.stop="
                            editingStageId !== element.id &&
                              startEditStage(funnel.id, element)
                          "
                        >
                          <input
                            v-if="
                              editingTemplateId === funnel.id &&
                              editingStageId === element.id
                            "
                            ref="stageNameInputRef"
                            v-model="editingName"
                            type="text"
                            class="text-sm text-space font-normal w-full min-w-0 bg-transparent border-none outline-none"
                            @blur="saveEditStage"
                            @keyup.enter="saveEditStage"
                            @click.stop
                          >
                          <p
                            v-else
                            class="text-sm text-space font-normal w-full min-h-[20px]"
                          >
                            {{ element.title }}
                          </p>
                        </div>
                        <div v-if="element.isLocked" class="p-2.5">
                          <svg-icon name="lock20" width="20" height="20" />
                        </div>
                        <button
                          v-else
                          type="button"
                          class="text-slate-custom p-2.5 bg-athens-gray border border-athens rounded-ten hover:bg-pink hover:text-red-custom hover:border-pink transition-colors duration-200"
                          @click="openRemoveStagePopupFor(funnel.id, element)"
                        >
                          <svg-icon name="basket-basket" width="20" height="20" />
                        </button>
                      </div>
                      <div class="flex items-center w-full flex-wrap gap-x-6 gap-y-2">
                        <div class="flex items-center">
                          <p class="text-sm text-slate-custom font-normal mr-1">
                            Действие:
                          </p>
                          <span class="text-sm text-slate-custom font-normal mr-1">—</span>
                          <button
                            type="button"
                            class="flex items-center gap-x-5px cursor-pointer text-dodger hover:opacity-80"
                            @click="openActionComingSoon = true"
                          >
                            <svg-icon name="plus-blue20" width="20" height="20" />
                            <span class="text-sm font-normal">Добавить</span>
                          </button>
                        </div>
                        <div class="flex items-center">
                          <p class="text-sm text-slate-custom font-normal mr-1">
                            Время на этапе:
                          </p>
                          <button
                            v-if="element.maxDays != null"
                            type="button"
                            class="text-sm text-dodger font-normal mr-1 cursor-pointer hover:underline"
                            @click="openTimeLimitFor(funnel.id, element)"
                          >
                            макс. {{ element.maxDays }} дн.
                          </button>
                          <button
                            v-else
                            class="flex items-center gap-x-5px text-dodger"
                            @click="openTimeLimitFor(funnel.id, element)"
                          >
                            <svg-icon name="plus-blue20" width="20" height="20" />
                            <span class="text-sm font-normal">Добавить</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </template>
              </draggable>
              <div class="pl-[55px] mt-2">
                <UiButton
                  variant="semiaction"
                  size="semiaction"
                  class="bg-athens-gray border border-athens text-space hover:bg-zumthor hover:border-dodger"
                  @click="addStage(funnel)"
                >
                  Добавить этап
                </UiButton>
              </div>
            </template>
          </div>
        </div>
      </template>
      <div
        v-else
        class="text-bali min-h-[223px] flex items-center justify-center bg-catskill rounded-fifteen"
      >
        <p class="text-15px font-medium text-bali">
          Вы ещё не создали ни одну воронку
        </p>
      </div>
    </div>

    <!-- Удаление этапа -->
    <transition name="fade">
      <Popup
        v-if="openRemoveStagePopup"
        :isOpen="openRemoveStagePopup"
        @close="closeRemoveStagePopup"
        width="490px"
        :showCloseButton="false"
        :lgSize="true"
        :parentRounded="true"
        :contentRounded="false"
        :contentPadding="false"
      >
        <div class="flex flex-col gap-y-6 pl-[15px]">
          <h2 class="text-xl font-semibold text-space">Подтверждение удаления</h2>
          <p class="text-sm text-slate-custom">
            Вы уверены, что хотите удалить этап
            <strong v-if="removingItemTitle">{{ removingItemTitle }}</strong>
            ?
          </p>
          <div class="flex gap-x-3">
            <button
              type="button"
              class="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md transition-colors bg-red-500 hover:bg-red-600 text-white p-semi-btn text-sm rounded-ten leading-normal h-fit font-semibold"
              @click="confirmRemoveStage"
            >
              Удалить
            </button>
            <button
              type="button"
              class="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md transition-colors bg-athens-gray border border-athens text-slate-custom p-border-semi-btn text-sm rounded-ten leading-normal font-medium"
              @click="closeRemoveStagePopup"
            >
              Отмена
            </button>
          </div>
        </div>
      </Popup>
    </transition>

    <!-- Удаление шаблона -->
    <transition name="fade">
      <Popup
        v-if="openRemoveTemplatePopup"
        :isOpen="openRemoveTemplatePopup"
        @close="closeRemoveTemplatePopup"
        width="490px"
        :showCloseButton="false"
        :lgSize="true"
        :parentRounded="true"
        :contentRounded="false"
        :contentPadding="false"
      >
        <div class="flex flex-col gap-y-6 pl-[15px]">
          <h2 class="text-xl font-semibold text-space">Подтверждение удаления</h2>
          <p class="text-sm text-slate-custom">
            Вы уверены, что хотите удалить шаблон воронки
            <strong v-if="removingTemplateName">{{ removingTemplateName }}</strong>
            ?
          </p>
          <div class="flex gap-x-3">
            <button
              type="button"
              class="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md transition-colors bg-red-500 hover:bg-red-600 text-white p-semi-btn text-sm rounded-ten leading-normal h-fit font-semibold"
              @click="confirmRemoveTemplate"
            >
              Удалить
            </button>
            <button
              type="button"
              class="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md transition-colors bg-athens-gray border border-athens text-slate-custom p-border-semi-btn text-sm rounded-ten leading-normal font-medium"
              @click="closeRemoveTemplatePopup"
            >
              Отмена
            </button>
          </div>
        </div>
      </Popup>
    </transition>

    <!-- Время на этапе -->
    <transition name="fade">
      <Popup
        v-if="openTimeLimitPopup"
        :isOpen="openTimeLimitPopup"
        @close="closeTimeLimitPopup"
        width="490px"
        :showCloseButton="false"
        :lgSize="true"
        :parentRounded="true"
        :contentRounded="false"
        :contentPadding="false"
      >
        <div class="flex flex-col gap-y-6 pl-[15px]">
          <h2 class="text-xl font-semibold text-space">Время на этапе</h2>
          <p class="text-sm text-slate-custom">
            Максимальное количество дней нахождения кандидата на этапе, после которого рекрутеру будет отправлено уведомление.
          </p>
          <div>
            <label class="text-sm font-medium text-space mb-2 block">
              Максимальное количество дней
            </label>
            <MyInput
              v-model="timeLimitDays"
              type="number"
              min="1"
              placeholder="Дней"
              class="w-full"
            />
          </div>
          <div class="flex gap-x-3">
            <button
              type="button"
              class="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md transition-colors bg-space hover:bg-space/90 text-white p-semi-btn text-sm rounded-ten leading-normal h-fit font-semibold disabled:opacity-50"
              :disabled="savingTimeLimit"
              @click="saveTimeLimit"
            >
              {{ savingTimeLimit ? 'Сохранение…' : 'Сохранить' }}
            </button>
            <button
              type="button"
              class="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md transition-colors bg-athens-gray border border-athens text-slate-custom p-border-semi-btn text-sm rounded-ten leading-normal font-medium"
              @click="closeTimeLimitPopup"
            >
              Отмена
            </button>
          </div>
        </div>
      </Popup>
    </transition>

    <!-- Действия для шаблона (пока недоступны) -->
    <transition name="fade">
      <Popup
        v-if="openActionComingSoon"
        :isOpen="openActionComingSoon"
        @close="openActionComingSoon = false"
        width="400px"
        :showCloseButton="false"
        :parentRounded="true"
        :contentRounded="false"
        :contentPadding="false"
      >
        <div class="flex flex-col gap-y-4 pl-[15px]">
          <h2 class="text-xl font-semibold text-space">Действие</h2>
          <p class="text-sm text-slate-custom">
            Настройка действий для этапов шаблона будет доступна в следующих версиях.
          </p>
          <button
            type="button"
            class="inline-flex items-center justify-center rounded-md transition-colors bg-space hover:bg-space/90 text-white p-semi-btn text-sm rounded-ten leading-normal h-fit font-semibold w-fit"
            @click="openActionComingSoon = false"
          >
            Понятно
          </button>
        </div>
      </Popup>
    </transition>
  </div>
</template>
