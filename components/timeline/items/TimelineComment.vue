<template>
  <TimelineItem :show-icon="false">
    <template #content>
      <div class="mr-15px">
        <UiAvatar size="chat">
          <UiAvatarImage
            v-if="avatarProps.hasImage && avatarProps.imageProps.src"
            :src="avatarProps.imageProps.src"
            :alt="avatarProps.imageProps.alt"
          />
          <UiAvatarFallback>{{ avatarProps.fallback }}</UiAvatarFallback>
        </UiAvatar>
      </div>
      <div>
        <ul class="mb-15px">
          <li>
            <p class="text-13px font-normal text-slate-custom mb-1">
              <span>{{ comment.time }}</span>
              {{ comment.author }} комментирует
            </p>
            <p class="text-sm font-normal text-space truncate">
              {{ comment.content }}
            </p>
          </li>
        </ul>
        <BtnIconText
          icon="resend"
          text="Ответить в ветке"
          @click="handleReply"
        />
      </div>
    </template>
  </TimelineItem>
</template>

<script setup lang="ts">
  import { getAvatarProps } from '@/lib/avatar'
  import type { TimelineMessage } from '@/types/timeline'
  import BtnIconText from '@/components/custom/BtnIconText.vue'
  import TimelineItem from '@/components/timeline/TimelineItem.vue'

  const props = defineProps<{
    comment: TimelineMessage
  }>()

  const emit = defineEmits<{
    reply: [comment: TimelineMessage]
  }>()

  const avatarProps = computed(() => getAvatarProps(props.comment))

  const handleReply = () => {
    emit('reply', props.comment)
  }
</script>
