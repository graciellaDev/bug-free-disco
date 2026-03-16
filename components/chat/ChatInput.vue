<template>
  <div
    ref="containerRef"
    class="w-full bg-white rounded-b-fifteen relative"
    :class="{ 'z-10': isExpanded || isFocused }"
    @mouseleave="handleMouseLeave"
  >
    <!-- Фиксированная часть: выбор формата, плейсхолдер или блок ввода -->
    <div class="flex flex-col py-15px">
      <!-- Верхняя строка: селектор формата (как у «Задача») -->
      <div class="flex flex-nowrap items-center gap-2 px-15px">
        <ChatFormatSelector
          v-model="selectedFormat"
          @select="handleFormatSelect"
        />
        <template v-if="selectedFormat === 'task'">
          <span class="shrink-0 text-sm font-normal text-space">на</span>
          <TaskDatePicker v-model="taskDate" compact class="shrink-0" />
          <TaskTimePicker v-model="taskTime" compact class="shrink-0" />
          <span class="shrink-0 text-sm font-normal text-space">для</span>
          <div ref="taskManagerDropdownRef" class="relative shrink-0">
            <button
              type="button"
              class="inline-flex items-center gap-1 text-sm font-normal text-dodger"
              @click="taskManagerOpen = !taskManagerOpen"
            >
              <span class="truncate max-w-[140px]">{{ selectedTaskManagerName }}</span>
              <svg-icon
                name="dropdown-arrow"
                width="16"
                height="16"
                class="shrink-0 transition-transform duration-200"
                :class="{ 'rotate-180': taskManagerOpen }"
              />
            </button>
            <Transition name="slide-fade">
              <div
                v-if="taskManagerOpen"
                class="absolute left-0 top-full z-20 mt-1 min-w-[140px] max-h-48 overflow-y-auto bg-athens rounded-plus shadow-md py-px"
                @click.stop
              >
                <button
                  v-for="m in taskManagers"
                  :key="m.id"
                  type="button"
                  class="w-full text-left px-4 py-2.5 text-sm transition-colors first:rounded-t-plus last:rounded-b-plus bg-white leading-normal"
                  :class="{
                    'text-dodger': taskManagerId === m.id,
                    'text-slate-custom hover:bg-athens-gray': taskManagerId !== m.id,
                  }"
                  @click="selectTaskManager(m.id)"
                >
                  {{ m.name }}
                </button>
              </div>
            </Transition>
          </div>
        </template>
        <span
          v-if="!isFocused && !message && !attachments.length && (selectedFormat === 'comment' || selectedFormat === 'chat')"
          class="cursor-text shrink-0 text-sm font-normal placeholder-styled"
          role="button"
          tabindex="0"
          @click="focusTextarea"
          @keydown.enter.space.prevent="focusTextarea"
        >
          {{ placeholderText }}
        </span>
      </div>

      <!-- Блок задачи: под выпадающим списком «Задача» -->
      <Transition name="slide-down">
        <div v-if="selectedFormat === 'task'" class="mt-3 px-15px">
          <TaskFormPanel
            ref="taskFormRef"
            v-model:date="taskDate"
            v-model:description="taskDescription"
            :submit-label="props.editTaskId != null ? 'Сохранить' : 'Поставить'"
            @submit="handleTaskSubmit"
            @cancel="handleTaskCancel"
          />
        </div>
      </Transition>

      <!-- Блок ввода для комментария и чата (как у задачи: поле внизу в том же стиле) -->
      <Transition name="slide-down">
        <div
          v-if="(selectedFormat === 'comment' || selectedFormat === 'chat') && (isFocused || message || attachments.length > 0)"
          class="mt-3 px-15px"
        >
          <!-- Прикреплённые файлы -->
          <div v-if="attachments.length > 0" class="mb-3 flex flex-wrap gap-2">
            <div
              v-for="(file, index) in attachments"
              :key="file.name"
              class="text-sm text-dodger font-medium flex items-center gap-1"
            >
              <span class="text-sm text-dodger font-medium">{{ file.name }}</span>
              <button type="button" class="p-[2.5px]" @click="removeFile(index)">
                <svg-icon name="dropdown-cross" width="15" height="15" />
              </button>
            </div>
          </div>
          <!-- Поле ввода в стиле задачи -->
          <div class="mb-3">
            <textarea
              ref="textareaRef"
              v-model="message"
              :placeholder="placeholderText"
              class="placeholder-styled min-h-[100px] w-full resize-y rounded-ten border border-athens bg-white px-3 py-2.5 text-sm text-space outline-none placeholder:text-[#b0b8c4] focus:border-dodger"
              rows="4"
              @input="handleInput"
              @focus="handleFocus"
              @blur="handleBlur"
            />
          </div>
          <!-- Кнопки -->
          <div class="flex items-center gap-2">
            <UiButton
              class="font-semibold"
              variant="action"
              size="action"
              :disabled="!message.trim()"
              @click="handleSend"
            >
              {{ sendButtonLabel }}
            </UiButton>
            <button
              type="button"
              class="font-medium text-sm font-normal text-slate-custom hover:text-space"
              @click="handleCancel"
            >
              Отменить
            </button>
            <div v-if="showAttachmentButton" class="relative ml-auto">
              <input
                ref="fileInput"
                type="file"
                multiple
                class="hidden"
                @change="handleFileSelect"
              />
              <button
                type="button"
                class="flex h-10 w-10 items-center justify-center rounded-full bg-athens-gray text-slate-custom transition-colors hover:bg-space hover:text-white"
                :class="{ 'bg-space text-white': attachments.length > 0 }"
                @click="triggerFileInput"
              >
                <svg-icon name="clip20" width="16" height="16" />
                <span
                  v-if="attachments.length"
                  class="absolute -top-0.5 -right-0.5 flex h-[18px] w-[18px] items-center justify-center rounded-full bg-dodger text-xs text-white"
                >
                  {{ attachments.length }}
                </span>
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
  import { useChatStore } from '@/stores/chat'
  import { useUserStore } from '@/stores/user'
  import ChatFormatSelector from '@/components/chat/components/ChatFormatSelector.vue'
  import TaskFormPanel from '@/components/chat/components/TaskFormPanel.vue'
  import TaskDatePicker from '@/components/chat/components/TaskDatePicker.vue'
  import TaskTimePicker from '@/components/chat/components/TaskTimePicker.vue'
  import { employeesList } from '@/utils/executorsList'

  // Store
  const chatStore = useChatStore()
  const userStore = useUserStore()

  // Props & Emits
  const props = defineProps<{
    initialRecipient?: string
    /** Текст для режима редактирования комментария — подставляется в поле ввода */
    initialEditText?: string
    /** ID комментария при редактировании (кнопка «Сохранить», в emit передаётся editCommentId) */
    editCommentId?: number | null
    /** Текст задачи при редактировании — подставляется в форму задачи */
    initialEditTaskText?: string
    /** ID события задачи при редактировании (кнопка «Сохранить», в emit передаётся editTaskId) */
    editTaskId?: number | null
  }>()

  const emit = defineEmits<{
    send: [
      {
        format: string
        message: string
        attachments: File[]
        recipient: string
        editCommentId?: number
        editTaskId?: number
        taskDate?: string
        taskTime?: string
        taskManagerId?: number | null
        taskManagerName?: string
      }
    ]
    'cancel-edit': []
    'cancel-edit-task': []
  }>()

  // State
  const message = ref('')
  const selectedFormat = ref(chatStore.currentFormat)
  const isExpanded = ref(false)
  const isFocused = ref(false)
  const attachments = ref<File[]>([])
  const fileInput = ref<HTMLInputElement | null>(null)
  const textareaRef = ref<HTMLTextAreaElement | null>(null)
  const containerRef = ref<HTMLDivElement | null>(null)
  const textareaHeight = ref('auto')
  const recipient = computed(() => props.initialRecipient || '')

  // Состояние формы задачи
  const now = new Date()
  const taskDate = ref(now.toISOString().slice(0, 10))
  const taskTime = ref(String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0'))
  const taskManagerId = ref<number | null>(null)
  const taskDescription = ref('')
  const taskManagers = ref<{ id: number; name: string; email?: string; role?: string }[]>([])
  const taskFormRef = ref<InstanceType<typeof TaskFormPanel> | null>(null)
  const taskManagerDropdownRef = ref<HTMLElement | null>(null)
  const taskManagerOpen = ref(false)

  const selectedTaskManagerName = computed(() => {
    if (taskManagerId.value == null) return 'Выберите'
    const m = taskManagers.value.find((x) => x.id === taskManagerId.value)
    return m?.name ?? 'Выберите'
  })

  // Computed
  /** Скрепка скрыта для комментария и чата на сайте */
  const showAttachmentButton = computed(
    () => selectedFormat.value !== 'comment' && selectedFormat.value !== 'chat'
  )

  const placeholderText = computed(() =>
    selectedFormat.value === 'comment' ? 'введите комментарий...' : 'введите сообщение...'
  )

  const sendButtonLabel = computed(() =>
    props.editCommentId != null ? 'Сохранить' : 'Отправить'
  )

  watch(
    () => props.initialEditText,
    (text) => {
      if (text != null && text !== '') {
        message.value = text
        isExpanded.value = true
        isFocused.value = true
        nextTick(() => textareaRef.value?.focus())
      }
    }
  )

  watch(
    () => props.initialEditTaskText,
    (text) => {
      if (text != null && text !== '') {
        chatStore.setCurrentFormat('task')
        selectedFormat.value = 'task'
        taskDescription.value = text
        loadTaskManagers()
        const n = new Date()
        taskDate.value = n.toISOString().slice(0, 10)
        taskTime.value = String(n.getHours()).padStart(2, '0') + ':' + String(n.getMinutes()).padStart(2, '0')
        nextTick(() => taskFormRef.value?.focusDescription?.())
      }
    }
  )

  watch(
    () => chatStore.currentFormat,
    (format) => {
      selectedFormat.value = format
    }
  )

  watch(
    () => selectedFormat.value,
    (format) => {
      if (format === 'task') {
        if (props.editTaskId == null) {
          taskDescription.value = ''
        }
        taskManagerId.value = null
        loadTaskManagers()
        const n = new Date()
        taskDate.value = n.toISOString().slice(0, 10)
        taskTime.value = String(n.getHours()).padStart(2, '0') + ':' + String(n.getMinutes()).padStart(2, '0')
      } else if (format === 'comment' || format === 'chat') {
        // Сразу переходим в состояние ввода: показываем блок с полем и фокус
        isFocused.value = true
        isExpanded.value = true
        nextTick(() => textareaRef.value?.focus())
      }
    }
  )

  // Methods
  const handleMouseLeave = () => {
    if (!isFocused.value && !message.value) {
      isExpanded.value = false
    }
  }

  const handleFocus = () => {
    isFocused.value = true
    isExpanded.value = true
  }

  const focusTextarea = () => {
    isFocused.value = true
    isExpanded.value = true
    nextTick(() => {
      textareaRef.value?.focus()
    })
  }

  const handleBlur = () => {
    isFocused.value = false
    if (!message.value && !isExpanded.value) {
      handleCancel()
    }
  }

  const handleClickOutside = (e: MouseEvent) => {
    if (taskManagerDropdownRef.value?.contains(e.target as Node)) {
      return
    }
    taskManagerOpen.value = false
    if (
      !containerRef.value ||
      containerRef.value.contains(e.target as Node)
    ) {
      return
    }
    if (!isFocused.value && !message.value && !attachments.value.length) {
      return
    }
    textareaRef.value?.blur()
    isFocused.value = false
    if (!message.value && !attachments.value.length) {
      handleCancel()
    }
  }

  function selectTaskManager(id: number) {
    taskManagerId.value = id
    taskManagerOpen.value = false
  }

  onMounted(() => {
    document.addEventListener('mousedown', handleClickOutside)
  })

  onUnmounted(() => {
    document.removeEventListener('mousedown', handleClickOutside)
  })

  const handleInput = (e: Event) => {
    const target = e.target as HTMLTextAreaElement
    textareaHeight.value = 'auto'
    textareaHeight.value = `${target.scrollHeight}px`
  }

  const handleFormatSelect = (format: string) => {
    chatStore.setCurrentFormat(format)
    selectedFormat.value = format
  }

  const handleRecipientClick = () => {
    console.log('Recipient clicked')
  }

  const triggerFileInput = () => {
    fileInput.value?.click()
  }

  const handleFileSelect = (e: Event) => {
    const input = e.target as HTMLInputElement
    if (input.files) {
      attachments.value = [...attachments.value, ...Array.from(input.files)]
    }
  }

  /** Возврат в исходное состояние: формат «Комментарий», свёрнутый блок ввода */
  const resetToInitialState = () => {
    selectedFormat.value = 'comment'
    chatStore.setCurrentFormat('comment')
    message.value = ''
    attachments.value = []
    taskDescription.value = ''
    textareaHeight.value = 'auto'
    isFocused.value = false
    isExpanded.value = false
    // После смены формата watch раскрывает блок для comment/chat — в nextTick снова сворачиваем
    nextTick(() => {
      isFocused.value = false
      isExpanded.value = false
    })
  }

  const handleSend = () => {
    if (!message.value.trim()) return

    const messageData = {
      format: selectedFormat.value,
      message: message.value,
      attachments: attachments.value,
      recipient: recipient.value,
      ...(props.editCommentId != null && { editCommentId: props.editCommentId }),
    }

    chatStore.addMessage(messageData)
    emit('send', messageData)
    resetToInitialState()
  }

  /** Загружает сотрудников компании для выпадающего списка «для»; по умолчанию выбран текущий пользователь (создатель задачи) */
  const loadTaskManagers = async () => {
    try {
      const list = await employeesList()
      taskManagers.value = Array.isArray(list) ? list : []
      if (taskManagers.value.length > 0 && taskManagerId.value == null) {
        const currentName = userStore.name || ''
        const match = taskManagers.value.find((m) => m.name === currentName)
        taskManagerId.value = match ? match.id : taskManagers.value[0].id
      }
    } catch (e) {
      console.error('Ошибка загрузки списка сотрудников:', e)
      taskManagers.value = []
    }
  }

  const handleTaskSubmit = () => {
    if (!taskDescription.value.trim()) return
    emit('send', {
      format: 'task',
      message: taskDescription.value.trim(),
      attachments: [],
      recipient: recipient.value,
      editTaskId: props.editTaskId ?? undefined,
      taskDate: taskDate.value,
      taskTime: taskTime.value,
      taskManagerId: taskManagerId.value,
      taskManagerName: selectedTaskManagerName.value || undefined,
    })
    resetToInitialState()
  }

  const handleTaskCancel = () => {
    if (props.editTaskId != null) {
      emit('cancel-edit-task')
    }
    selectedFormat.value = 'chat'
    chatStore.setCurrentFormat('chat')
    taskDescription.value = ''
  }

  const handleCancel = () => {
    if (props.editCommentId != null) {
      emit('cancel-edit')
    }
    message.value = ''
    attachments.value = []
    textareaHeight.value = 'auto'
    if (!isFocused.value) {
      isExpanded.value = false
    }
  }

  const removeFile = (index: number) => {
    attachments.value = attachments.value.filter((_, i) => i !== index)
  }

  const focusInput = () => {
    focusTextarea()
  }

  const focusTaskForm = () => {
    taskFormRef.value?.focusDescription?.()
  }

  defineExpose({ focusInput, focusTaskForm })
</script>

<style scoped>
  .placeholder-styled {
    color: #b0b8c4;
  }

  /* Введённый текст — как в полях формы вакансии (тёмный) */
  textarea.placeholder-styled {
    color: #1a1a1a;
  }

  textarea.placeholder-styled::placeholder {
    color: #b0b8c4;
  }

  .fade-enter-active,
  .fade-leave-active {
    transition: opacity 0.3s ease;
  }

  .fade-enter-from,
  .fade-leave-to {
    opacity: 0;
  }

  .slide-down-enter-active,
  .slide-down-leave-active {
    transition: all 0.3s ease-out;
  }

  .slide-down-enter-from,
  .slide-down-leave-to {
    opacity: 0;
    transform: translateY(-10px);
  }

  .slide-fade-enter-active,
  .slide-fade-leave-active {
    transition: all 0.15s ease-out;
  }
  .slide-fade-enter-from,
  .slide-fade-leave-to {
    opacity: 0;
    transform: translateY(-4px);
  }
</style>
