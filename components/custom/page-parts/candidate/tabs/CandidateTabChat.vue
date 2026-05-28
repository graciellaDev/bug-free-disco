<script setup lang="ts">
import { useCandidateCardContext } from '@/components/custom/page-parts/candidate/candidateCardContext'
import CandidateLog from '~/components/custom/page-parts/candidate/CandidateLog.vue'
import ChatInput from '~/components/chat/ChatInput.vue'

const c = useCandidateCardContext()
</script>

<template>
  <div
    class="flex flex-col"
    :ref="(el) => { c.eventFeedRef = el as HTMLElement | null }"
  >
    <div class="h-[500px] overflow-hidden border border-athens-gray bg-athens-gray">
      <CandidateLog
        :candidate-id="c.props.c.props.candidate?.id"
        :refresh-trigger="c.props.logRefreshTrigger"
        :vacancy-id="c.props.vacancyId"
        :candidate-source="c.props.c.props.candidate?.source ?? null"
        :feed-active="c.activeTab === 'chat'"
        @delete-request="c.handleDeleteCommentRequest"
        @edit-comment="c.handleEditComment"
        @delete-task-request="c.handleDeleteTaskRequest"
        @edit-task="c.handleEditTask"
        @complete-task="c.handleCompleteTask"
        @open-email="c.emit('open-email-popup')"
        @open-email-card="c.handleOpenEmailCard"
      />
    </div>
    <ChatInput
      :ref="(comp) => { c.chatInputRef = comp }"
      :initial-recipient="`${c.props.c.props.candidate.firstname} ${c.props.c.props.candidate.surname}`"
      :initial-edit-text="c.editingCommentText"
      :edit-comment-id="c.editingCommentId"
      :initial-edit-task-text="c.editingTaskText"
      :edit-task-id="c.editingTaskId"
      @send="c.handleChatSend"
      @cancel-edit="c.handleCancelEditComment"
      @cancel-edit-task="c.handleCancelEditTask"
      @email-format-selected="c.emit('open-email-popup')"
      @scroll-into-view="c.scrollEventFeedToInput"
    />
  </div>
</template>
