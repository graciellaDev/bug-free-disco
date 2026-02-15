<template>
  <TimelineItem :show-icon="false">
    <template #content>
      <div class="relative mr-15px">
        <div class="absolute right-0 top-[-5px]">
          <svg-icon name="wh-border20" width="20" height="20" />
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
      <ul>
        <li>
          <p class="text-13px font-normal text-slate-custom mb-2">
            <span>{{ message.time }}</span>
            {{ message.author }}
          </p>
          <p class="text-sm font-normal text-space truncate">
            {{ message.content }}
          </p>
        </li>
      </ul>
    </template>
  </TimelineItem>
</template>

<script setup lang="ts">
  import { getAvatarProps } from '@/lib/avatar'
  import type { TimelineMessage } from '@/types/timeline'
  import TimelineItem from '../TimelineItem.vue'

  const props = defineProps<{
    message: TimelineMessage
  }>()

  const emit = defineEmits<{
    reply: [message: TimelineMessage]
  }>()

  const avatarProps = computed(() => getAvatarProps(props.message))
</script>
