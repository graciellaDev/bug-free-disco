<!-- components/min-chat/index.vue -->
<script setup>
  import { ref, watch, computed, onMounted } from 'vue'
  import MinTimeline from './MinTimeline.vue'
  import MinChat from './MinChat.vue'

  const props = defineProps({
    initialMessages: { type: Array, default: () => [] },
    containerHeight: { type: Number, default: 400 },
    /** Заполнить высоту родителя (flex), список сообщений прокручивается внутри */
    fillHeight: { type: Boolean, default: false },
    padding: {
      type: Object,
      default: () => ({ top: 25, bottom: 25, left: 15, right: 15 }),
    },
  })

  const emit = defineEmits(['update:messages'])

  const messages = ref([...props.initialMessages])

  watch(messages, newMessages => {
    emit('update:messages', newMessages)
  })

  const timelineRef = ref(null)

  const addMessage = newMessage => {
    messages.value.push(newMessage)
  }

  const containerStyle = computed(() => {
    const style = {
      '--padding-top': `${props.padding.top}px`,
      '--padding-bottom': `${props.padding.bottom}px`,
      paddingTop: `${props.padding.top}px`,
      paddingBottom: `${props.padding.bottom}px`,
      paddingLeft: `${props.padding.left}px`,
      paddingRight: `${props.padding.right}px`,
    }
    if (!props.fillHeight) {
      style.minHeight = '100px'
      style.maxHeight = `${props.containerHeight}px`
    }
    return style
  })

  const scrollToLatestMessage = () => {
    if (timelineRef.value) {
      console.log(
        'Scrolling to latest message in index.vue',
        timelineRef.value.scrollHeight
      )
      timelineRef.value.scrollTo({
        top: timelineRef.value.scrollHeight,
        behavior: 'smooth',
      })
    }
  }

  // Прокрутка при монтировании
  onMounted(() => {
    nextTick(scrollToLatestMessage)
  })

  // Прокрутка при изменении сообщений
  watch(
    messages,
    () => {
      nextTick(scrollToLatestMessage)
    },
    { deep: true }
  )
</script>

<template>
  <div
    class="chat-container"
    :class="fillHeight ? 'flex h-full min-h-0 flex-col' : ''"
  >
    <div :class="fillHeight ? 'flex min-h-0 flex-1 flex-col' : ''">
      <div
        ref="timelineRef"
        class="custom-webkit overflow-auto"
        :class="fillHeight ? 'min-h-0 flex-1' : ''"
        :style="containerStyle"
      >
        <MinTimeline :messages="messages" />
      </div>
    </div>
    <MinChat
      class="shrink-0"
      :messages="messages"
      @add-message="addMessage"
    />
  </div>
</template>

<style scoped>
  /* Стилизация скроллбара для WebKit-браузеров (Chrome, Safari, Edge) */
  .custom-webkit::-webkit-scrollbar {
    width: 10px; /* Ширина скроллбара */
  }

  .custom-webkit::-webkit-scrollbar-track {
    background: transparent; /* Цвет фона дорожки */
    border-radius: 10px; /* Закругление краёв дорожки */
    margin-top: var(--padding-top, 25px);
    margin-bottom: var(--padding-bottom, 25px);
  }

  .custom-webkit::-webkit-scrollbar-thumb {
    background-color: #79869a; /* Цвет ползунка */
    border-radius: 5px; /* Закругление краёв ползунка */
  }
</style>
