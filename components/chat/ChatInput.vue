<template>
  <div
    class="w-full bg-white rounded-b-fifteen relative"
    :class="{ 'z-10': isExpanded || isFocused }"
    @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave"
  >
    <!-- Расширяющаяся часть (прикрепленные файлы и текстовое поле) -->
    <Transition name="slide-down">
      <div
        v-if="isExpanded || message || attachments.length > 0"
        class="absolute bottom-[51px] left-0 w-full bg-white rounded-t-fifteen"
        :style="{ maxHeight: hasOverflow ? '271px' : '101px' }"
      >
        <!-- Прикрепленные файлы -->
        <div v-if="attachments.length > 0" class="px-15px py-2.5 bg-zumthor">
          <div class="flex flex-wrap gap-2">
            <div
              v-for="(file, index) in attachments"
              :key="file.name"
              class="text-sm text-dodger font-medium flex items-center gap-1"
            >
              <span class="text-sm text-dodger font-medium">
                {{ file.name }}
              </span>
              <button @click="removeFile(index)" class="p-[2.5px]">
                <svg-icon name="dropdown-cross" width="15" height="15" />
              </button>
            </div>
          </div>
        </div>

        <!-- Поле ввода -->
        <div class="p-15px pt-25px">
          <textarea
            placeholder="Введите текст..."
            v-model="message"
            class="w-full resize-none bg-transparent outline-none text-sm text-space font-normal"
            :class="{ 'max-h-[200px] overflow-y-auto': hasOverflow }"
            :style="{ height: textareaHeight }"
            @input="handleInput"
            @focus="handleFocus"
            @blur="handleBlur"
          />
        </div>
      </div>
    </Transition>

    <!-- Фиксированная часть (выбор формата и кнопки) -->
    <div class="h-[61px] flex flex-col justify-between">
      <!-- Верхняя строка с выбором формата и получателем -->
      <div
        class="px-15px pt-15px flex items-center transition-all duration-300"
        :style="{
          transform:
            isExpanded || message || attachments.length > 0
              ? `translateY(-${expandHeight}px)`
              : 'translateY(0)',
        }"
      >
        <ChatFormatSelector
          v-model="selectedFormat"
          @select="handleFormatSelect"
        />
        <span class="text-sm text-space font-normal mx-2">для</span>
        <button
          class="text-sm text-dodger font-medium hover:underline"
          @click="handleRecipientClick"
        >
          {{ recipient }}
        </button>
        <span
          v-if="!isExpanded && !message"
          class="text-sm text-slate-custom font-normal ml-2"
        >
          введите текст...
        </span>
      </div>

      <!-- Кнопки управления -->
      <Transition name="fade">
        <div
          v-if="showControls"
          class="px-15px flex items-center gap-2"
          style="transform: translateY(-35px)"
        >
          <UiButton
            class="font-semibold"
            variant="action"
            size="action"
            @click="handleSend"
          >
            Отправить
          </UiButton>
          <UiButton
            class="font-medium mr-auto"
            variant="back"
            size="back"
            @click="handleCancel"
          >
            Отменить
          </UiButton>
          <div class="relative">
            <input
              ref="fileInput"
              type="file"
              multiple
              class="hidden"
              @change="handleFileSelect"
            />
            <button
              class="text-sm text-slate-custom font-medium flex items-center gap-1 bg-athens-gray rounded-full p-2.5px hover:bg-space hover:text-white transition-colors duration-300 w-10 h-10 justify-center"
              @click="triggerFileInput"
              :class="{ 'bg-space text-white': attachments.length > 0 }"
            >
              <svg-icon name="clip20" width="16" height="16" />
              <span
                v-if="attachments.length"
                class="absolute -top-5px -right-5px bg-dodger text-white rounded-full w-[18px] h-[18px] text-xs flex items-center justify-center"
              >
                {{ attachments.length }}
              </span>
            </button>
          </div>
        </div>
      </Transition>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, computed } from 'vue'
  import { useChatStore } from '@/stores/chat'
  import ChatFormatSelector from '@/components/chat/components/ChatFormatSelector.vue'

  // Store
  const chatStore = useChatStore()

  // Props & Emits
  const props = defineProps<{
    initialRecipient?: string
  }>()

  const emit = defineEmits<{
    send: [
      {
        format: string
        message: string
        attachments: File[]
        recipient: string
      }
    ]
  }>()

  // State
  const message = ref('')
  const selectedFormat = ref(chatStore.currentFormat)
  const isExpanded = ref(false)
  const isFocused = ref(false)
  const attachments = ref<File[]>([])
  const fileInput = ref<HTMLInputElement | null>(null)
  const textareaHeight = ref('auto')
  const recipient = computed(() => props.initialRecipient || '')

  // Computed
  const hasOverflow = computed(() => {
    return message.value.split('\n').length > 3 || message.value.length > 200
  })

  const showControls = computed(() => {
    return (
      isExpanded.value ||
      isFocused.value ||
      message.value.length > 0 ||
      attachments.value.length > 0
    )
  })

  const expandHeight = computed(() => {
    // Вычисляем высоту расширяющегося блока (без padding)
    const baseHeight = hasOverflow.value ? 261 : 101
    // Учитываем padding (pt-15px для файлов + p-15px для textarea)
    const padding = attachments.value.length > 0 ? 30 : 15 // 15px + 15px если есть файлы, иначе только 15px
    return baseHeight - padding
  })

  // Methods
  const handleMouseEnter = () => {
    isExpanded.value = true
  }

  const handleMouseLeave = () => {
    if (!isFocused.value && !message.value) {
      isExpanded.value = false
    }
  }

  const handleFocus = () => {
    isFocused.value = true
    isExpanded.value = true
  }

  const handleBlur = () => {
    isFocused.value = false
    if (!message.value && !isExpanded.value) {
      handleCancel()
    }
  }

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

  const handleSend = () => {
    if (!message.value.trim()) return

    const messageData = {
      format: selectedFormat.value,
      message: message.value,
      attachments: attachments.value,
      recipient: recipient.value,
    }

    console.log('Отправка сообщения:', {
      format: messageData.format,
      message: messageData.message,
      attachmentsCount: messageData.attachments.length,
      recipient: messageData.recipient,
    })

    chatStore.addMessage(messageData)
    emit('send', messageData)
    handleCancel()
  }

  const handleCancel = () => {
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
</script>

<style scoped>
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
</style>
