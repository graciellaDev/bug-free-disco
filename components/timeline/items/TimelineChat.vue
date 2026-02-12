<template>
  <TimelineItem :show-icon="false">
    <template #content>
      <div class="relative mr-15px">
        <div class="absolute right-0 top-[-5px]">
          <svg-icon name="hh-border20" width="20" height="20" />
        </div>
        <UiAvatar size="candidate">
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
            <p
              class="text-13px font-normal text-slate-custom mb-7px leading-normal"
            >
              <span>{{ message.time }}</span>
              {{ message.author }} пишет для {{ message.company }}
            </p>
            <p class="text-sm font-normal text-space wrapping">
              {{ message.content }}
            </p>
          </li>
        </ul>
        <BtnIconText
          icon="resend"
          text="Ответить в чате"
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
    message: TimelineMessage
  }>()

  const emit = defineEmits<{
    reply: [message: TimelineMessage]
  }>()

  const avatarProps = computed(() => getAvatarProps(props.message))

  const handleReply = () => {
    emit('reply', props.message)
  }
</script>
