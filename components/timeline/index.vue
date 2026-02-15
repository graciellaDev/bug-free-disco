<template>
  <div
    ref="timelineContainer"
    class="bg-athens-gray p-25px pt-70px pb-2.5 max-h-[calc(100vh-230px)] overflow-y-auto"
  >
    <template v-for="(group, index) in timelineGroups" :key="index">
      <ChatDivider :text="group.date" />
      <template v-for="event in group.events" :key="event.id">
        <!-- Системные события -->
        <p
          v-if="event.type === 'system'"
          class="text-13px font-normal text-slate-custom px-20 pb-0.5"
        >
          <span>{{ event.time }}</span>
          {{ event.content }}
        </p>

        <!-- Пропущенные звонки -->
        <TimelineCall
          v-else-if="event.type === 'call'"
          :calls="event.calls"
          @complete="handleComplete"
        />

        <!-- Заметки -->
        <TimelineNote v-else-if="event.type === 'note'" :note="event" />

        <!-- Задачи -->
        <TimelineTask
          v-else-if="event.type === 'task'"
          :task="event"
          @complete="handleComplete"
        />

        <!-- Email -->
        <TimelineEmail
          v-else-if="event.type === 'email'"
          :emails="event.emails"
          @send="handleSendEmail"
        />

        <!-- HH.ru чат -->
        <TimelineChat
          v-else-if="event.type === 'hh_chat'"
          :message="event"
          @reply="handleReplyInChat"
        />

        <!-- Telegram -->
        <TimelineTelegram
          v-else-if="event.type === 'telegram'"
          :message="event"
          @reply="handleReplyInTelegram"
        />

        <!-- WhatsApp -->
        <TimelineWhatsApp
          v-else-if="event.type === 'whatsapp'"
          :message="event"
        />

        <!-- Комментарии -->
        <TimelineComment
          v-else-if="event.type === 'comment'"
          :comment="event"
          @reply="handleReplyInThread"
        />
      </template>
    </template>
  </div>
</template>

<script setup>
  import ChatDivider from '@/components/custom/ChatDivider.vue'
  import TimelineCall from './items/TimelineCall.vue'
  import TimelineNote from './items/TimelineNote.vue'
  import TimelineTask from './items/TimelineTask.vue'
  import TimelineEmail from './items/TimelineEmail.vue'
  import TimelineChat from './items/TimelineChat.vue'
  import TimelineTelegram from './items/TimelineTelegram.vue'
  import TimelineWhatsApp from './items/TimelineWhatsApp.vue'
  import TimelineComment from './items/TimelineComment.vue'
  import { ref, onMounted, nextTick } from 'vue'

  const props = defineProps({
    timelineGroups: {
      type: Array,
      required: true,
      default: () => [],
    },
  })

  const emit = defineEmits(['complete', 'send', 'reply'])

  const handleComplete = task => {
    emit('complete', task)
  }

  const handleSendEmail = emails => {
    emit('send', emails)
  }

  const handleReplyInChat = message => {
    emit('reply', { type: 'chat', message })
  }

  const handleReplyInTelegram = message => {
    emit('reply', { type: 'telegram', message })
  }

  const handleReplyInThread = comment => {
    emit('reply', { type: 'thread', comment })
  }

  const timelineContainer = ref(null)

  onMounted(() => {
    nextTick(() => {
      timelineContainer.value.scrollTop = timelineContainer.value.scrollHeight
    })
  })
</script>

<style scoped>
  ::-webkit-scrollbar {
    width: 10px;
    background-color: #f4f6f8;
    border-bottom-right-radius: 10px;
  }

  ::-webkit-scrollbar-thumb {
    background-color: #79869a;
    /* Your preferred color */
    border-radius: 5px;
    cursor: pointer;
  }
</style>
