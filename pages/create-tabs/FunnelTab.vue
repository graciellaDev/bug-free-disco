<script setup lang="ts">
  import { ref, computed, onMounted, onBeforeUnmount, watch, nextTick, inject } from 'vue'
  import { useRoute } from 'vue-router'
  import draggable from 'vuedraggable'
  import MyInput from '@/components/custom/MyInput.vue'
  import Popup from '@/components/custom/Popup.vue'
  import StatusService from '~/components/custom/ServiceStatus.vue'
  import MyDropdown from '~/components/custom/MyDropdown.vue'
  import ResponseChoose from '~/components/custom/ResponseChoose.vue'
  import Autocomplete from '~/components/custom/Autocomplete.vue'
  import {
    getVacancyStages,
    createVacancyStage,
    reorderVacancyStages,
    renameVacancyStage,
    deleteVacancyStage,
    updateVacancyStageMaxDays,
  } from '@/src/api/vacancyStages'
  import {
    getFunnelTemplates,
    createFunnelTemplate,
    applyFunnelTemplate,
    type FunnelTemplateItem,
  } from '@/src/api/funnelTemplates'
  import type { VacancyStage } from '@/types/vacancy'

  import * as DropdownData from '~/src/data/funnelDropdowns.json'
  import responses from '~/src/data/responses.json'
  import ActiveTasks from '~/src/data/active-tasks.json'

  const props = defineProps<{
    id?: string | number | null
    application?: unknown
    type?: string
  }>()

  const route = useRoute()
  // id вакансии: route.params → props → query._vid (после создания, пока URL не обновился) → pathname
  const vacancyId = computed(() => {
    const fromRoute = (route.params?.id != null && route.params?.id !== '') ? String(route.params.id) : null
    if (fromRoute) return fromRoute
    const fromProps = (props.id != null && props.id !== '') ? String(props.id) : null
    if (fromProps) return fromProps
    const fromQuery = (route.query?._vid != null && String(route.query._vid) !== '') ? String(route.query._vid) : null
    if (fromQuery) return fromQuery
    if (typeof window !== 'undefined') {
      const m = window.location.pathname.match(/newvacancy\/(\d+)/)
      if (m) return m[1]
    }
    const pathMatch = (route.path || route.fullPath || '').match(/newvacancy\/(\d+)/)
    if (pathMatch) return pathMatch[1]
    return null
  })

  const saveAndContinueHandler = inject('saveAndContinueHandler', null)

  const items = ref<{ id: number; title: string; isLocked: boolean; actions: { id: number; title: string }[]; maxDays: number | null }[]>([])
  const stagesListKey = ref(0)
  const isDragging = ref(false)
  const loadingStages = ref(false)
  const editingStageId = ref<number | null>(null)
  const editingName = ref('')
  const stageNameInputRef = ref<HTMLInputElement | null>(null)
  const removingStageId = ref<number | null>(null)

  const openSaveTemplatePopup = ref(false)
  const openLoadTemplatePopup = ref(false)
  const openTimeLimitPopup = ref(false)
  const stageForTimeLimit = ref<{ id: number; title: string; maxDays: number | null } | null>(null)
  const timeLimitDays = ref<string>('')
  const savingTimeLimit = ref(false)
  const templateName = ref('')
  const selectedTemplateId = ref<number | null>(null)
  const templatesList = ref<FunnelTemplateItem[]>([])
  const loadingTemplates = ref(false)
  const savingTemplate = ref(false)
  const applyingTemplate = ref(false)

  const openPopups = ref([])
  const openActionPopup = ref(false)
  const openInvitePopup = ref(false)
  const openMovePopup = ref(false)
  const openMailPopup = ref(false)
  const openFormPopup = ref(false)
  const openRemovePopup = ref(false)
  const openDeniedPopup = ref(false)
  const openChangeResponsePopup = ref(false)
  const openChangeTextPopup = ref(false)
  const showInput = ref(false)
  const showInputTask = ref(false)
  const openWebhookPopup = ref(false)
  const openCreateTaskPopup = ref(false)
  const openFinishTaskPopup = ref(false)
  const inviteFieldIfValue = ref('')
  const inviteFieldConditionValue = ref('')
  const inviteFieldWhenValue = ref('')
  const moveFieldLevelValue = ref('')
  const moveFieldIfValue = ref('')
  const moveFieldConditionValue = ref('')
  const moveFieldWhenValue = ref('')
  const mailFieldSendValue = ref('')
  const mailFieldItemValue = ref('')
  const mailFieldConditionValue = ref('')
  const mailFieldWhenValue = ref('')
  const formFieldSendValue = ref('')
  const formFieldIfValue = ref('')
  const formFieldConditionValue = ref('')
  const formFieldWhenValue = ref('')
  const deniedFieldIfValue = ref('')
  const deniedFieldConditionValue = ref('')
  const deniedFieldWhenValue = ref('')
  const newResponsible = ref('')
  const changeText = ref('')
  const sendWebhook = ref('')
  const createTask = ref('')
  const newResponseTask = ref('')
  const taskCreateFieldWhenValue = ref('')
  const targetToFinishTask = ref('')
  const taskFinishFieldWhenValue = ref('')

  const removingItemTitle = ref('')

  // Этапы по умолчанию для отображения до сохранения вакансии (как на бэкенде)
  const DEFAULT_FUNNEL_STAGES: { id: number; title: string; isLocked: boolean; actions: { id: number; title: string }[]; maxDays: number | null }[] = [
    { id: -1, title: 'Новые', isLocked: true, actions: [], maxDays: null },
    { id: -2, title: 'Предварительный отбор', isLocked: false, actions: [], maxDays: null },
    { id: -3, title: 'Собеседование', isLocked: false, actions: [], maxDays: null },
    { id: -4, title: 'Оффер', isLocked: false, actions: [], maxDays: null },
    { id: -5, title: 'Нанят на работу', isLocked: true, actions: [], maxDays: null },
    { id: -6, title: 'Отказ', isLocked: true, actions: [], maxDays: null },
  ]

  function mapStagesToItems(stages: VacancyStage[]) {
    return stages.map(s => ({
      id: s.id,
      title: s.name,
      isLocked: !!s.fixed,
      actions: [] as { id: number; title: string }[],
      maxDays: s.max_days ?? null,
    }))
  }

  const fetchItems = async () => {
    if (!vacancyId.value) {
      items.value = DEFAULT_FUNNEL_STAGES.map(s => ({ ...s }))
      return
    }
    loadingStages.value = true
    try {
      const stages = await getVacancyStages(vacancyId.value)
      items.value = mapStagesToItems(stages)
    } catch (e) {
      console.error('Ошибка при загрузке этапов', e)
      items.value = []
    } finally {
      loadingStages.value = false
    }
  }

  const actionBtn = [
    {
      id: 1,
      icon: 'hand',
      title: 'Пригласить кандидата',
      handler: handleOpenInvite,
    },
    {
      id: 2,
      icon: 'move-arrow',
      title: 'Переместить на другой этап',
      handler: handleOpenMove,
    },
    {
      id: 3,
      icon: 'stop20',
      title: 'Отказать кандидату',
      handler: handleDeniedPopup,
    },
    {
      id: 4,
      icon: 'envelope20',
      title: 'Отправить письмо на почту',
      handler: handleOpenMail,
    },
    {
      id: 5,
      icon: 'change-user',
      title: 'Сменить ответственного',
      handler: handleChangeResponsePopup,
    },
    {
      id: 6,
      icon: 'change-text',
      title: 'Изменить поле',
      handler: handleOpenChangeTextPopup,
    },
    {
      id: 7,
      icon: 'webhook',
      title: 'Отправить webhook',
      handler: handleOpenWebhookPopup,
    },
    {
      id: 8,
      icon: 'form-user',
      title: 'Отправить анкету',
      handler: handleOpenForm,
    },
    {
      id: 9,
      icon: 'task-create',
      title: 'Создать задачу',
      handler: handleCreateTaskPopup,
    },
    {
      id: 10,
      icon: 'task-complete',
      title: 'Завершить задачу',
      handler: handleFinishTaskPopup,
    },
  ]

  const addNewItem = async () => {
    if (!vacancyId.value) {
      const newId = -Date.now()
      items.value = [...items.value, { id: newId, title: 'Новый этап', isLocked: false, actions: [], maxDays: null }]
      return
    }
    try {
      const stages = await createVacancyStage(vacancyId.value, 'Новый этап')
      items.value = mapStagesToItems(stages)
    } catch (e) {
      console.error('Ошибка при добавлении этапа', e)
    }
  }

  const removeItem = (index: number) => {
    const item = items.value[index]
    if (!item) return
    removingStageId.value = item.id
    removingItemTitle.value = item.title
    handleRemovePopup()
  }

  const confirmRemove = async () => {
    if (removingStageId.value === null) {
      handleCloseRemovePopup()
      return
    }
    if (!vacancyId.value) {
      const item = items.value.find(i => i.id === removingStageId.value)
      if (item && !item.isLocked) items.value = items.value.filter(i => i.id !== removingStageId.value)
      handleCloseRemovePopup()
      removingStageId.value = null
      return
    }
    try {
      const stages = await deleteVacancyStage(vacancyId.value, removingStageId.value)
      items.value = mapStagesToItems(stages)
      handleCloseRemovePopup()
    } catch (e) {
      console.error('Ошибка при удалении этапа', e)
    } finally {
      removingStageId.value = null
    }
  }

  const onDragStart = () => {
    isDragging.value = true
  }

  const onDragEnd = async () => {
    isDragging.value = false
    if (!vacancyId.value || items.value.length === 0) return
    try {
      const stageIds = items.value.map(i => i.id)
      const stages = await reorderVacancyStages(vacancyId.value, stageIds)
      items.value = mapStagesToItems(stages)
    } catch (e) {
      console.error('Ошибка при сохранении порядка этапов', e)
      await fetchItems()
    }
  }

  const startEditStage = (element: { id: number; title: string }) => {
    editingStageId.value = element.id
    editingName.value = element.title
    nextTick(() => stageNameInputRef.value?.focus())
  }

  const saveEditStage = async () => {
    if (editingStageId.value === null || editingName.value.trim() === '') {
      editingStageId.value = null
      return
    }
    const name = editingName.value.trim()
    if (!vacancyId.value) {
      const idx = items.value.findIndex(i => i.id === editingStageId.value)
      if (idx !== -1) items.value[idx] = { ...items.value[idx], title: name }
      editingStageId.value = null
      return
    }
    try {
      const stages = await renameVacancyStage(vacancyId.value, editingStageId.value, name)
      items.value = mapStagesToItems(stages)
    } catch (e) {
      console.error('Ошибка при переименовании этапа', e)
    } finally {
      editingStageId.value = null
    }
  }

  onMounted(() => {
    if (saveAndContinueHandler) {
      saveAndContinueHandler.value = async () => {}
    }
    fetchItems()
  })
  onBeforeUnmount(() => {
    if (saveAndContinueHandler) {
      saveAndContinueHandler.value = null
    }
  })
  watch(vacancyId, () => {
    fetchItems()
  })

  function enableBodyScroll(popupId) {
    openPopups.value = openPopups.value.filter(id => id !== popupId)
    if (openPopups.value.length === 0) {
      document.body.style.overflow = '' // Включаем прокрутку
    }
  }

  // config for control scroll
  function disableBodyScroll(popupId) {
    if (!openPopups.value.includes(popupId)) {
      openPopups.value.push(popupId)
    }
    if (openPopups.value.length > 0) {
      document.body.style.overflow = 'hidden' // Отключаем прокрутку
    }
  }

  function handleOpenAction() {
    openActionPopup.value = true
    disableBodyScroll('action')
  }

  function openTimeLimitPopupFor(element: { id: number; title: string; maxDays: number | null }) {
    stageForTimeLimit.value = element
    timeLimitDays.value = element.maxDays != null ? String(element.maxDays) : ''
    openTimeLimitPopup.value = true
    disableBodyScroll('time-limit')
  }
  function closeTimeLimitPopup() {
    openTimeLimitPopup.value = false
    stageForTimeLimit.value = null
    enableBodyScroll('time-limit')
  }
  async function saveTimeLimit() {
    if (!stageForTimeLimit.value) return
    const days = timeLimitDays.value.trim() ? Math.max(1, parseInt(timeLimitDays.value, 10) || 0) : null
    if (!vacancyId.value) {
      const idx = items.value.findIndex(i => i.id === stageForTimeLimit.value!.id)
      if (idx !== -1) items.value[idx] = { ...items.value[idx], maxDays: days }
      closeTimeLimitPopup()
      return
    }
    savingTimeLimit.value = true
    try {
      const stages = await updateVacancyStageMaxDays(vacancyId.value, stageForTimeLimit.value.id, days)
      items.value = mapStagesToItems(stages)
      closeTimeLimitPopup()
    } catch (e) {
      console.error('Ошибка сохранения времени на этапе', e)
    } finally {
      savingTimeLimit.value = false
    }
  }

  function handleCloseActionPopup() {
    openActionPopup.value = false
  }

  function handleOpenInvite() {
    openInvitePopup.value = true
    openActionPopup.value = false
    disableBodyScroll('invite')
  }

  function handleCloseInvitePopup() {
    openInvitePopup.value = false
    openActionPopup.value = true
    disableBodyScroll('action')
  }

  function handleOpenMove() {
    openMovePopup.value = true
    openActionPopup.value = false
    disableBodyScroll('move')
  }

  function handleCloseMovePopup() {
    openMovePopup.value = false
    openActionPopup.value = true
    disableBodyScroll('action')
  }

  function handleOpenMail() {
    openMailPopup.value = true
    openActionPopup.value = false
    disableBodyScroll('mail')
  }

  function handleCloseMailPopup() {
    openMailPopup.value = false
    openActionPopup.value = true
    disableBodyScroll('action')
  }

  function handleOpenForm() {
    openFormPopup.value = true
    openActionPopup.value = false
    disableBodyScroll('form')
  }

  function handleCloseFormPopup() {
    openFormPopup.value = false
    openActionPopup.value = true
    disableBodyScroll('action')
  }

  function handleRemovePopup() {
    openRemovePopup.value = true
    disableBodyScroll('remove')
  }

  function handleCloseRemovePopup() {
    openRemovePopup.value = false
  }

  function openSaveTemplateModal() {
    templateName.value = ''
    openSaveTemplatePopup.value = true
    disableBodyScroll('save-template')
  }
  function closeSaveTemplatePopup() {
    openSaveTemplatePopup.value = false
    enableBodyScroll('save-template')
  }
  async function submitSaveTemplate() {
    const name = (templateName.value || '').trim()
    if (!name || !vacancyId.value) return
    savingTemplate.value = true
    try {
      await createFunnelTemplate(name, vacancyId.value)
      closeSaveTemplatePopup()
    } catch (e) {
      console.error('Ошибка сохранения шаблона', e)
    } finally {
      savingTemplate.value = false
    }
  }

  async function openLoadTemplateModal() {
    openLoadTemplatePopup.value = true
    selectedTemplateId.value = null
    loadingTemplates.value = true
    disableBodyScroll('load-template')
    try {
      templatesList.value = await getFunnelTemplates()
    } catch (e) {
      console.error('Ошибка загрузки шаблонов', e)
    } finally {
      loadingTemplates.value = false
    }
  }
  function closeLoadTemplatePopup() {
    openLoadTemplatePopup.value = false
    enableBodyScroll('load-template')
  }
  async function submitApplyTemplate() {
    const tid = selectedTemplateId.value
    if (tid == null || !vacancyId.value) return
    applyingTemplate.value = true
    try {
      await applyFunnelTemplate(vacancyId.value, tid)
      closeLoadTemplatePopup()
      await fetchItems()
      stagesListKey.value += 1
    } catch (e) {
      console.error('Ошибка применения шаблона', e)
    } finally {
      applyingTemplate.value = false
    }
  }

  function handleDeniedPopup() {
    openDeniedPopup.value = true
    openActionPopup.value = false
    disableBodyScroll('denied')
  }

  function handleCloseDeniedPopup() {
    openDeniedPopup.value = false
    openActionPopup.value = true
    disableBodyScroll('action')
  }

  function handleChangeResponsePopup() {
    openChangeResponsePopup.value = true
    openActionPopup.value = false
    disableBodyScroll('change-response')
  }

  function handleCloseChangeResponsePopup() {
    openChangeResponsePopup.value = false
    openActionPopup.value = true
    disableBodyScroll('action')
  }

  function handleShowInput(value) {
    console.log('handleShowInput called with:', value) // Для отладки
    showInput.value = value
  }

  function handleShowInputTask(value) {
    showInputTask.value = value
  }

  function handleOpenChangeTextPopup() {
    openChangeTextPopup.value = true
    openActionPopup.value = false
    disableBodyScroll('change-field')
  }

  function handleCloseChangeTextPopup() {
    openChangeTextPopup.value = false
    openActionPopup.value = true
    disableBodyScroll('action')
  }

  function handleOpenWebhookPopup() {
    openWebhookPopup.value = true
    openActionPopup.value = false
    disableBodyScroll('webhook')
  }

  function handleCloseWebhookPopup() {
    openWebhookPopup.value = false
    openActionPopup.value = true
    disableBodyScroll('action')
  }

  function handleCreateTaskPopup() {
    openCreateTaskPopup.value = true
    openActionPopup.value = false
    disableBodyScroll('create-task')
  }

  function handleCloseCreateTaskPopup() {
    openCreateTaskPopup.value = false
    openActionPopup.value = true
    disableBodyScroll('action')
  }

  function handleFinishTaskPopup() {
    openFinishTaskPopup.value = true
    openActionPopup.value = false
    disableBodyScroll('finish-task')
  }

  function handleCloseFinishTaskPopup() {
    openFinishTaskPopup.value = false
    openActionPopup.value = true
    disableBodyScroll('action')
  }
</script>

<template>
  <div class="container pb-10 pt-6">
    <div class="w-full bg-white rounded-fifteen p-25px">
      <div class="mb-[36px] flex flex-wrap items-start justify-between gap-4">
        <div>
          <p class="text-space text-xl font-semibold mb-2.5 leading-normal">
            Настройка воронки найма
          </p>
          <p class="text-sm text-slate-custom leading-normal">
            Настройте ваши этапы и&nbsp;добавьте и&nbsp;действия триггеры
            к&nbsp;ним.
          </p>
        </div>
        <div class="flex flex-wrap gap-2 shrink-0">
          <UiButton
            variant="semiaction"
            size="semiaction"
            class="bg-athens-gray border border-athens text-space hover:bg-zumthor hover:border-dodger"
            @click="openSaveTemplateModal()"
          >
            Сохранить как шаблон
          </UiButton>
          <UiButton
            variant="semiaction"
            size="semiaction"
            class="bg-athens-gray border border-athens text-space hover:bg-zumthor hover:border-dodger"
            @click="openLoadTemplateModal()"
          >
            Применить шаблон
          </UiButton>
        </div>
      </div>
      <div>
        <draggable
          :key="stagesListKey"
          v-model="items"
          item-key="id"
          handle=".drag-handle"
          animation="200"
          ghost-class="ghost"
          chosen-class="chosen"
          @start="onDragStart"
          @end="onDragEnd"
        >
          <template #item="{ element, index }">
            <div class="card flex" :class="{ 'dragging-card': isDragging }">
              <div class="drag-handle p-2.5 mr-15px cursor-grab h-fit">
                <svg-icon name="drag-burger" width="20" height="20" />
              </div>
              <div class="w-full">
                <div class="flex justify-between items-center w-full mb-2.5">
                  <div
                    class="w-full border border-athens rounded-ten flex justify-between items-center pl-15px pr-2.5 py-9px mr-2.5 min-h-[40px]"
                    :class="{
                      'bg-feta': element.title === 'Нанят на работу',
                      'bg-pink': element.title === 'Отказ',
                      'bg-athens-gray': element.title !== 'Нанят на работу' && element.title !== 'Отказ',
                      'cursor-pointer': editingStageId !== element.id
                    }"
                    @click.stop="editingStageId !== element.id && startEditStage(element)"
                  >
                    <input
                      v-if="editingStageId === element.id"
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
                  <div>
                    <div class="p-2.5" v-if="element.isLocked">
                      <svg-icon name="lock20" width="20" height="20" />
                    </div>
                    <button
                      v-else
                      @click="removeItem(index)"
                      class="text-slate-custom p-2.5 bg-athens-gray border border-athens rounded-ten hover:bg-pink hover:text-red-custom hover:border-pink transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <svg-icon name="basket-basket" width="20" height="20" />
                    </button>
                  </div>
                </div>
                <div class="flex items-center w-full flex-wrap gap-x-6 gap-y-2">
                  <div class="flex items-center">
                    <p class="text-sm text-slate-custom font-normal mr-1">
                      Действие:
                    </p>
                    <div
                      v-for="(action, actionIndex) in element.actions"
                      :key="action.id"
                      class="flex items-center gap-x-5px mr-1"
                    >
                      <svg-icon name="shuffle" width="18" height="18" />
                      <p class="text-sm text-space font-normal flex">
                        {{ action.title }}
                        <span
                          v-if="
                            element.actions.length > 1 &&
                            actionIndex < element.actions.length - 1
                          "
                        >
                          ,
                        </span>
                      </p>
                    </div>
                    <button
                      type="button"
                      class="flex items-center gap-x-5px cursor-pointer"
                      @click="handleOpenAction"
                    >
                      <svg-icon name="plus-blue20" width="20" height="20" />
                      <span class="text-sm text-dodger font-normal">
                        Добавить
                      </span>
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
                      @click="openTimeLimitPopupFor(element)"
                    >
                      макс. {{ element.maxDays }} дн.
                    </button>
                    <button
                      v-else
                      class="flex items-center gap-x-5px"
                      @click="openTimeLimitPopupFor(element)"
                    >
                      <svg-icon name="plus-blue20" width="20" height="20" />
                      <span class="text-sm text-dodger font-normal">
                        Добавить
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </template>
        </draggable>
        <div class="pl-[55px] mt-18px mb-[34px]">
          <UiButton
            variant="semiaction"
            size="semiaction"
            class="bg-athens-gray border border-athens text-space hover:bg-zumthor hover:border-dodger"
            @click="addNewItem"
          >
            Добавить этап
          </UiButton>
        </div>
        <div v-if="loadingStages" class="text-sm text-slate-custom pl-[55px]">
          Загрузка этапов...
        </div>
      </div>
    </div>
  </div>
  <transition name="fade" @after-leave="enableBodyScroll('action')">
    <Popup
      :isOpen="openActionPopup"
      @close="handleCloseActionPopup"
      :showCloseButton="false"
      :width="'490px'"
      :topActive="true"
      :lgSize="true"
      :max-height="true"
      :overflowContainer="true"
    >
      <p class="text-xl font-semibold text-space mb-35px leading-normal">
        Добавить действие
      </p>
      <div class="flex flex-col gap-y-2.5 mb-5">
        <button
          v-for="btn in actionBtn"
          class="border border-athens bg-athens-gray rounded-fifteen text-slate-custom flex py-[14.5px] px-15px"
          @click="btn.handler ? btn.handler() : null"
        >
          <svg-icon :name="btn.icon" width="20" height="20" class="mr-2.5" />
          <span class="text-sm font-normal">
            {{ btn.title }}
          </span>
        </button>
      </div>
      <div class="w-full h-px bg-athens mb-5"></div>
      <p class="text-sm font-medium mb-15px">Интеграция</p>
      <div class="grid grid-cols-3 gap-x-2.5 min-h-[120px] mb-35px">
        <button
          class="rounded-fifteen bg-malachite flex items-center justify-center"
        >
          <svg-icon name="logo-wh60" width="60.21" height="60.27" />
        </button>
        <button
          class="rounded-fifteen bg-picton flex items-center justify-center"
        >
          <svg-icon name="logo-tg54" width="54" height="46" />
        </button>
        <button
          class="rounded-fifteen bg-royal flex items-center justify-center"
        >
          <svg-icon name="logo-vb70" width="69.57" height="71.91" />
        </button>
      </div>
      <UiButton
        size="second-back"
        variant="back"
        @click="handleCloseActionPopup"
      >
        Отмена
      </UiButton>
    </Popup>
  </transition>
  <transition name="fade" @after-leave="enableBodyScroll('invite')">
    <Popup
      :isOpen="openInvitePopup"
      @close="handleCloseInvitePopup"
      :show-close-button="false"
      :width="'400px'"
      :disableOverflowHidden="true"
      :overflowContainer="true"
    >
      <p class="text-xl font-semibold text-space mb-25px leading-normal">
        Назначение действия
      </p>
      <p class="text-sm font-medium text-space mb-15px leading-normal">
        Этап воронки
      </p>
      <StatusService :status="'Подумать'" class="mb-15px" />
      <p class="text-sm font-medium text-space mb-15px leading-normal">
        Действие
      </p>
      <StatusService
        :nameIcon="'hand'"
        :status="'Пригласить кандидата'"
        class="mb-15px"
      />
      <p class="text-sm font-medium text-space mb-15px">Если</p>
      <MyDropdown
        :defaultValue="'Выберите поле'"
        :options="DropdownData.inviteFieldIf"
        class="mb-15px"
        v-model="inviteFieldIfValue"
      />
      <p class="text-sm font-medium text-space mb-15px">Условие</p>
      <MyDropdown
        :defaultValue="'Выберите условие'"
        :options="DropdownData.inviteFieldCondition"
        class="mb-15px"
        v-model="inviteFieldConditionValue"
      />
      <p class="text-sm font-medium text-space mb-15px leading-normal">Когда</p>
      <MyDropdown
        :defaultValue="'Выберите время'"
        :options="DropdownData.inviteFieldWhen"
        v-model="inviteFieldWhenValue"
        class="mb-25px"
      />
      <div>
        <UiButton size="semiaction" variant="action" class="mr-15px">
          Добавить
        </UiButton>
        <UiButton
          size="second-back"
          variant="back"
          @click="handleCloseInvitePopup"
        >
          Назад
        </UiButton>
      </div>
    </Popup>
  </transition>
  <transition name="fade" @after-leave="enableBodyScroll('move')">
    <Popup
      :isOpen="openMovePopup"
      @close="handleCloseMovePopup"
      :show-close-button="false"
      :width="'400px'"
      :disableOverflowHidden="true"
      :overflowContainer="true"
    >
      <p class="text-xl font-semibold text-space mb-25px leading-normal">
        Назначение действия
      </p>
      <p class="text-sm font-medium text-space mb-15px leading-normal">
        Этап воронки
      </p>
      <StatusService :status="'Подумать'" class="mb-15px" />
      <p class="text-sm font-medium text-space mb-15px leading-normal">
        Действие
      </p>
      <StatusService
        :nameIcon="'move-arrow'"
        :status="'Пригласить кандидата'"
        class="mb-15px"
      />
      <p class="text-sm font-medium text-space mb-15px leading-normal">
        Выбор этапа
      </p>
      <MyDropdown
        :defaultValue="'Выберите этап'"
        :options="DropdownData.moveFieldLevel"
        class="mb-15px"
        v-model="moveFieldLevelValue"
      />
      <p class="text-sm font-medium text-space mb-15px leading-normal">Если</p>
      <MyDropdown
        :defaultValue="'Выберите поле'"
        :options="DropdownData.moveFieldIf"
        class="mb-15px"
        v-model="moveFieldIfValue"
      />
      <p class="text-sm font-medium text-space mb-15px">Условие</p>
      <MyDropdown
        :defaultValue="'Выберите условие'"
        :options="DropdownData.moveFieldCondition"
        class="mb-15px"
        v-model="moveFieldConditionValue"
      />
      <p class="text-sm font-medium text-space mb-15px leading-normal">Когда</p>
      <MyDropdown
        :defaultValue="'Выберите время'"
        :options="DropdownData.moveFieldWhen"
        class="mb-25px"
        v-model="moveFieldWhenValue"
      />
      <div>
        <UiButton size="semiaction" variant="action" class="mr-15px">
          Добавить
        </UiButton>
        <UiButton
          size="second-back"
          variant="back"
          @click="handleCloseMovePopup"
        >
          Назад
        </UiButton>
      </div>
    </Popup>
  </transition>
  <transition name="fade" @after-leave="enableBodyScroll('mail')">
    <Popup
      :isOpen="openMailPopup"
      @close="handleCloseMailPopup"
      :show-close-button="false"
      :width="'400px'"
      :disableOverflowHidden="true"
      :overflowContainer="true"
    >
      <p class="text-xl font-semibold text-space mb-25px leading-normal">
        Назначение действия
      </p>
      <p class="text-sm font-medium text-space mb-15px leading-normal">
        Этап воронки
      </p>
      <StatusService :status="'Подумать'" class="mb-15px" />
      <p class="text-sm font-medium text-space mb-15px leading-normal">
        Действие
      </p>
      <StatusService
        :nameIcon="'envelope20'"
        :status="'Отправить письмо на почту'"
        class="mb-15px"
      />
      <p class="text-sm font-medium text-space mb-15px leading-normal">
        Выбор письма
      </p>
      <MyDropdown
        :defaultValue="'Выберите шаблон'"
        :options="DropdownData.mailFieldSend"
        class="mb-15px"
        v-model="mailFieldSendValue"
      />
      <p class="text-sm font-medium text-space mb-15px leading-normal">Если</p>
      <MyDropdown
        :defaultValue="'Выберите поле'"
        :options="DropdownData.mailFieldItems"
        class="mb-15px"
        v-model="mailFieldItemValue"
      />
      <p class="text-sm font-medium text-space mb-15px">Условие</p>
      <MyDropdown
        :defaultValue="'Выберите условие'"
        :options="DropdownData.mailFieldConditions"
        class="mb-15px"
        v-model="mailFieldConditionValue"
      />
      <p class="text-sm font-medium text-space mb-15px leading-normal">Когда</p>
      <MyDropdown
        :defaultValue="'Выберите условие'"
        :options="DropdownData.mailFieldWhen"
        class="mb-25px"
        v-model="mailFieldWhenValue"
      />
      <div>
        <UiButton size="semiaction" variant="action" class="mr-15px">
          Добавить
        </UiButton>
        <UiButton
          size="second-back"
          variant="back"
          @click="handleCloseMailPopup"
        >
          Назад
        </UiButton>
      </div>
    </Popup>
  </transition>
  <transition name="fade" @after-leave="enableBodyScroll('form')">
    <Popup
      :isOpen="openFormPopup"
      @close="handleCloseFormPopup"
      :show-close-button="false"
      :width="'400px'"
      :disableOverflowHidden="true"
      :overflowContainer="true"
    >
      <p class="text-xl font-semibold text-space mb-25px leading-normal">
        Назначение действия
      </p>
      <p class="text-sm font-medium text-space mb-15px leading-normal">
        Этап воронки
      </p>
      <StatusService :status="'Подумать'" class="mb-15px" />
      <p class="text-sm font-medium text-space mb-15px leading-normal">
        Действие
      </p>
      <StatusService
        :nameIcon="'form-user'"
        :status="'Отправить анкету'"
        class="mb-15px"
      />
      <p class="text-sm font-medium text-space mb-15px leading-normal">
        Выбор анкеты
      </p>
      <MyDropdown
        :defaultValue="'Выберите шаблон'"
        :options="DropdownData.formFieldSend"
        class="mb-15px"
        v-model="formFieldSendValue"
      />
      <p class="text-sm font-medium text-space mb-15px leading-normal">Если</p>
      <MyDropdown
        :defaultValue="'Выберите поле'"
        :options="DropdownData.formFieldIf"
        class="mb-15px"
        v-model="formFieldIfValue"
      />
      <p class="text-sm font-medium text-space mb-15px">Условие</p>
      <MyDropdown
        :defaultValue="'Выберите условие'"
        :options="DropdownData.formFieldConditions"
        class="mb-15px"
        v-model="formFieldConditionValue"
      />
      <p class="text-sm font-medium text-space mb-15px leading-normal">Когда</p>
      <MyDropdown
        :defaultValue="'Выберите время'"
        :options="DropdownData.formFieldWhen"
        class="mb-25px"
        v-model="formFieldWhenValue"
      />
      <div>
        <UiButton size="semiaction" variant="action" class="mr-15px">
          Добавить
        </UiButton>
        <UiButton
          size="second-back"
          variant="back"
          @click="handleCloseFormPopup"
        >
          Назад
        </UiButton>
      </div>
    </Popup>
  </transition>
  <transition name="fade" @after-leave="enableBodyScroll('remove')">
    <Popup
      :isOpen="openRemovePopup"
      @close="handleCloseRemovePopup"
      width="490px"
      :showCloseButton="false"
      :lgSize="true"
      :parentRounded="true"
      :contentRounded="false"
      :contentPadding="false"
    >
      <div class="popup-delete-content flex flex-col gap-y-6">
        <h2 class="text-xl font-semibold text-space">
          Подтверждение удаления
        </h2>
        <p class="text-sm text-slate-custom">
          Вы уверены, что хотите удалить этап
          <strong v-if="removingItemTitle">{{ removingItemTitle }}</strong>
          ?
        </p>
        <div class="flex gap-x-3">
          <button
            type="button"
            class="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring bg-red-500 hover:bg-red-600 text-white p-semi-btn text-sm rounded-ten leading-normal h-fit font-semibold"
            @click="confirmRemove"
          >
            Удалить
          </button>
          <button
            type="button"
            class="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring bg-athens-gray border border-athens text-slate-custom p-border-semi-btn text-sm rounded-ten leading-normal font-medium"
            @click="handleCloseRemovePopup"
          >
            Отмена
          </button>
        </div>
      </div>
    </Popup>
  </transition>
  <transition name="fade" @after-leave="enableBodyScroll('save-template')">
    <Popup
      :isOpen="openSaveTemplatePopup"
      @close="closeSaveTemplatePopup"
      width="490px"
      :showCloseButton="false"
      :lgSize="true"
      :parentRounded="true"
      :contentRounded="false"
      :contentPadding="false"
    >
      <div class="flex flex-col gap-y-6 pl-[15px]">
        <h2 class="text-xl font-semibold text-space">
          Сохранить как шаблон
        </h2>
        <p v-if="!vacancyId" class="text-sm text-slate-custom">
          Сначала сохраните вакансию, нажав «Сохранить и продолжить» на вкладке «Описание вакансии».
        </p>
        <div v-else>
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
            :disabled="savingTemplate || !vacancyId || !(templateName && templateName.trim())"
            @click="submitSaveTemplate"
          >
            {{ savingTemplate ? 'Сохранение…' : 'Сохранить' }}
          </button>
          <button
            type="button"
            class="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md transition-colors bg-athens-gray border border-athens text-slate-custom p-border-semi-btn text-sm rounded-ten leading-normal font-medium"
            @click="closeSaveTemplatePopup"
          >
            Отмена
          </button>
        </div>
      </div>
    </Popup>
  </transition>
  <transition name="fade" @after-leave="enableBodyScroll('load-template')">
    <Popup
      :isOpen="openLoadTemplatePopup"
      @close="closeLoadTemplatePopup"
      width="490px"
      :showCloseButton="false"
      :lgSize="true"
      :parentRounded="true"
      :contentRounded="false"
      :contentPadding="false"
    >
      <div class="flex flex-col gap-y-6 pl-[15px]">
        <h2 class="text-xl font-semibold text-space">
          Применить шаблон
        </h2>
        <p v-if="!vacancyId" class="text-sm text-slate-custom">
          Сначала сохраните вакансию, нажав «Сохранить и продолжить» на вкладке «Описание вакансии».
        </p>
        <template v-else>
        <p class="text-sm text-slate-custom">
          Выберите сохранённый шаблон воронки — текущие этапы будут заменены.
        </p>
        <div v-if="loadingTemplates" class="text-sm text-slate-custom">
          Загрузка шаблонов…
        </div>
        <div v-else>
          <label class="text-sm font-medium text-space mb-2 block">
            Шаблон воронки
          </label>
          <select
            v-model="selectedTemplateId"
            class="w-full border border-athens rounded-ten bg-athens-gray text-space text-sm px-3 py-2.5 outline-none focus:ring-1 focus:ring-dodger"
          >
            <option :value="null">
              Выберите шаблон
            </option>
            <option
              v-for="t in templatesList"
              :key="t.id"
              :value="t.id"
            >
              {{ t.name }}
            </option>
          </select>
        </div>
        <div class="flex gap-x-3">
          <button
            type="button"
            class="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md transition-colors bg-space hover:bg-space/90 text-white p-semi-btn text-sm rounded-ten leading-normal h-fit font-semibold disabled:opacity-50"
            :disabled="applyingTemplate || !vacancyId || selectedTemplateId == null"
            @click="submitApplyTemplate"
          >
            {{ applyingTemplate ? 'Применение…' : 'Применить' }}
          </button>
          <button
            type="button"
            class="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md transition-colors bg-athens-gray border border-athens text-slate-custom p-border-semi-btn text-sm rounded-ten leading-normal font-medium"
            @click="closeLoadTemplatePopup"
          >
            Отмена
          </button>
        </div>
        </template>
      </div>
    </Popup>
  </transition>
  <transition name="fade" @after-leave="enableBodyScroll('time-limit')">
    <Popup
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
        <h2 class="text-xl font-semibold text-space">
          Время на этапе
        </h2>
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
  <transition name="fade" @after-leave="enableBodyScroll('denied')">
    <Popup
      :isOpen="openDeniedPopup"
      @close="handleCloseDeniedPopup"
      :show-close-button="false"
      :width="'400px'"
      :disableOverflowHidden="true"
      :overflowContainer="true"
    >
      <p class="text-xl font-semibold text-space mb-25px leading-normal">
        Назначение действия
      </p>
      <p class="text-sm font-medium text-space mb-15px leading-normal">
        Этап воронки
      </p>
      <StatusService :status="'Подумать'" class="mb-15px" />
      <p class="text-sm font-medium text-space mb-15px leading-normal">
        Действие
      </p>
      <StatusService
        :nameIcon="'stop20'"
        :status="'Отказать кандидату'"
        class="mb-15px"
      />
      <p class="text-sm font-medium text-space mb-15px">Если</p>
      <MyDropdown
        :defaultValue="'Выберите поле'"
        :options="DropdownData.deniedFieldIf"
        class="mb-15px"
        v-model="deniedFieldIfValue"
      />
      <p class="text-sm font-medium text-space mb-15px">Условие</p>
      <MyDropdown
        :defaultValue="'Выберите условие'"
        :options="DropdownData.deniedFieldCondition"
        class="mb-15px"
        v-model="deniedFieldConditionValue"
      />
      <p class="text-sm font-medium text-space mb-15px leading-normal">Когда</p>
      <MyDropdown
        :defaultValue="'Выберите время'"
        :options="DropdownData.deniedFieldWhen"
        v-model="deniedFieldWhenValue"
        class="mb-25px"
      />
      <div>
        <UiButton size="semiaction" variant="action" class="mr-15px">
          Добавить
        </UiButton>
        <UiButton
          size="second-back"
          variant="back"
          @click="handleCloseDeniedPopup"
        >
          Назад
        </UiButton>
      </div>
    </Popup>
  </transition>
  <transition name="fade" @after-leave="enableBodyScroll('change-response')">
    <Popup
      :isOpen="openChangeResponsePopup"
      @close="handleCloseChangeResponsePopup"
      :show-close-button="false"
      :width="'400px'"
      :disableOverflowHidden="true"
      :overflowContainer="true"
    >
      <p class="text-xl font-semibold text-space mb-25px leading-normal">
        Назначение действия
      </p>
      <p class="text-sm font-medium text-space mb-15px leading-normal">
        Этап воронки
      </p>
      <StatusService :status="'Подумать'" class="mb-15px" />
      <p class="text-sm font-medium text-space mb-15px leading-normal">
        Действие
      </p>
      <StatusService
        :nameIcon="'change-user'"
        :status="'Сменить ответственного'"
        class="mb-15px"
      />
      <p class="text-sm font-medium text-space mb-15px leading-normal">
        Настоящий ответственный
      </p>
      <StatusService :status="'Иванов Иван'" class="mb-15px" />
      <p class="text-sm font-medium text-space mb-15px leading-normal">
        Новый ответственный
      </p>
      <ResponseChoose
        v-model="newResponsible"
        :showInput="showInput"
        :responses="responses"
        @update:showInput="handleShowInput"
        class="mb-25px"
      />
      <div>
        <UiButton size="semiaction" variant="action" class="mr-15px">
          Добавить
        </UiButton>
        <UiButton
          size="second-back"
          variant="back"
          @click="handleCloseChangeResponsePopup"
        >
          Назад
        </UiButton>
      </div>
    </Popup>
  </transition>
  <transition name="fade" @after-leave="enableBodyScroll('change-field')">
    <Popup
      :isOpen="openChangeTextPopup"
      @close="handleCloseChangeTextPopup"
      :show-close-button="false"
      :width="'400px'"
    >
      <p class="text-xl font-semibold text-space mb-25px leading-normal">
        Назначение действия
      </p>
      <p class="text-sm font-medium text-space mb-15px leading-normal">
        Этап воронки
      </p>
      <StatusService :status="'Подумать'" class="mb-15px" />
      <p class="text-sm font-medium text-space mb-15px leading-normal">
        Действие
      </p>
      <StatusService
        :nameIcon="'change-text'"
        :status="'Изменить поле'"
        class="mb-15px"
      />
      <p class="text-sm font-medium text-space mb-15px leading-normal">
        Настоящее поле
      </p>
      <StatusService :status="'Временное значение'" class="mb-15px" />
      <p class="text-sm font-medium text-space mb-15px leading-normal">
        Новое поле
      </p>
      <MyInput
        :placeholder="'Введите значение'"
        v-model="changeText"
        class="mb-25px"
      />
      <div>
        <UiButton size="semiaction" variant="action" class="mr-15px">
          Добавить
        </UiButton>
        <UiButton
          size="second-back"
          variant="back"
          @click="handleCloseChangeTextPopup"
        >
          Назад
        </UiButton>
      </div>
    </Popup>
  </transition>
  <transition name="fade" @after-leave="enableBodyScroll('webhook')">
    <Popup
      :isOpen="openWebhookPopup"
      @close="handleCloseWebhookPopup"
      :show-close-button="false"
      :width="'400px'"
    >
      <p class="text-xl font-semibold text-space mb-25px leading-normal">
        Назначение действия
      </p>
      <p class="text-sm font-medium text-space mb-15px leading-normal">
        Этап воронки
      </p>
      <StatusService :status="'Подумать'" class="mb-15px" />
      <p class="text-sm font-medium text-space mb-15px leading-normal">
        Действие
      </p>
      <StatusService
        :nameIcon="'webhook'"
        :status="'Отправить webhook'"
        class="mb-15px"
      />
      <p class="text-sm font-medium text-space mb-15px leading-normal">
        Адрес webhook(url)
      </p>
      <MyInput
        :placeholder="'Введите адрес'"
        v-model="sendWebhook"
        class="mb-25px"
      />
      <div>
        <UiButton size="semiaction" variant="action" class="mr-15px">
          Добавить
        </UiButton>
        <UiButton
          size="second-back"
          variant="back"
          @click="handleCloseWebhookPopup"
        >
          Назад
        </UiButton>
      </div>
    </Popup>
  </transition>
  <transition name="fade" @after-leave="enableBodyScroll('create-task')">
    <Popup
      :isOpen="openCreateTaskPopup"
      @close="handleCloseCreateTaskPopup"
      :show-close-button="false"
      :width="'400px'"
      :disableOverflowHidden="true"
      :overflowContainer="true"
    >
      <p class="text-xl font-semibold text-space mb-25px leading-normal">
        Назначение действия
      </p>
      <p class="text-sm font-medium text-space mb-15px leading-normal">
        Этап воронки
      </p>
      <StatusService :status="'Подумать'" class="mb-15px" />
      <p class="text-sm font-medium text-space mb-15px leading-normal">
        Действие
      </p>
      <StatusService
        :nameIcon="'task-create'"
        :status="'Создать задачу'"
        class="mb-15px"
      />
      <p class="text-sm font-medium text-space mb-15px leading-normal">
        Название задачи
      </p>
      <MyInput
        :placeholder="'Введите название'"
        v-model="createTask"
        class="mb-15px"
      />
      <p class="text-sm font-medium text-space mb-15px leading-normal">
        Ответственный
      </p>
      <ResponseChoose
        v-model="newResponseTask"
        :showInput="showInputTask"
        :responses="responses"
        @update:showInputTask="handleShowInputTask"
        class="mb-15px"
      />
      <p class="text-sm font-medium text-space mb-15px leading-normal">Когда</p>
      <MyDropdown
        :defaultValue="'Выберите время'"
        :options="DropdownData.taskCreateFieldWhen"
        v-model="taskCreateFieldWhenValue"
        class="mb-25px"
      />
      <div>
        <UiButton size="semiaction" variant="action" class="mr-15px">
          Добавить
        </UiButton>
        <UiButton
          size="second-back"
          variant="back"
          @click="handleCloseCreateTaskPopup"
        >
          Назад
        </UiButton>
      </div>
    </Popup>
  </transition>
  <transition name="fade" @after-leave="enableBodyScroll('finish-task')">
    <Popup
      :isOpen="openFinishTaskPopup"
      @close="handleCloseFinishTaskPopup"
      :show-close-button="false"
      :width="'400px'"
      :disableOverflowHidden="true"
      :overflowContainer="true"
    >
      <p class="text-xl font-semibold text-space mb-25px leading-normal">
        Назначение действия
      </p>
      <p class="text-sm font-medium text-space mb-15px leading-normal">
        Этап воронки
      </p>
      <StatusService :status="'Подумать'" class="mb-15px" />
      <p class="text-sm font-medium text-space mb-15px leading-normal">
        Действие
      </p>
      <StatusService
        :nameIcon="'task-complete'"
        :status="'Завершить задачу'"
        class="mb-15px"
      />
      <p class="text-sm font-medium text-space mb-15px leading-normal">
        Выбрать задачу
      </p>
      <Autocomplete
        :source="ActiveTasks"
        v-model="targetToFinishTask"
        placeholder="Начните ввод для поиска"
        class="mb-15px"
      />
      <p class="text-sm font-medium text-space mb-15px leading-normal">Когда</p>
      <MyDropdown
        :defaultValue="'Выберите время'"
        :options="DropdownData.taskFinishFieldWhen"
        v-model="taskFinishFieldWhenValue"
        class="mb-25px"
      />
      <div>
        <UiButton size="semiaction" variant="action" class="mr-15px">
          Добавить
        </UiButton>
        <UiButton
          size="second-back"
          variant="back"
          @click="handleCloseFinishTaskPopup"
        >
          Назад
        </UiButton>
      </div>
    </Popup>
  </transition>
</template>

<style scoped>
  .card:not(:last-child) {
    margin-bottom: 1.22rem;
  }

  /* Анимация появления и скрытия */
  .fade-enter-active,
  .fade-leave-active {
    transition: opacity 0.3s ease;
  }

  .fade-enter-from,
  .fade-leave-to {
    opacity: 0;
  }

  .fade-leave-from {
    opacity: 1;
  }
</style>
