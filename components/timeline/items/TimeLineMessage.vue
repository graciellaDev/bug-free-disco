<script setup lang="ts">
  import { computed } from 'vue';
  import { getAvatarProps } from '@/lib/avatar';
  import BtnIconText from '@/components/custom/BtnIconText.vue';
  import TimelineItem from '@/components/timeline/TimelineItem.vue';
  import type { UiTimelineEvent } from '@/types/timeline';

  type MessageEvent = Extract<UiTimelineEvent, { type: 'chat' | 'messanger' }>;

  const props = defineProps<{
    event: MessageEvent;
  }>();

  const emit = defineEmits<{
    reply: [message: MessageEvent];
  }>();

  const avatarProps = computed(() => getAvatarProps(props.event));

  const iconName = computed(() => {
    const channel = props.event.channel;
    const map: Record<string, string> = {
      hh: 'hh-border20',
      avito: 'avito-border20',
      rabota: 'rabota-border20',
      jobly: 'jobly-border20',
      telegram: 'tg-border20',
      max: 'max-border20',
    };
    return map[channel] ?? 'chat-generic20';
  });

  const replyLabel = computed(() => {
    if (props.event.type === 'messanger') {
      return props.event.channel === 'telegram'
        ? 'Ответить в Telegram'
        : 'Ответить в мессенджере';
    }
    return 'Ответить в чате';
  });

  const authorLine = computed(() => {
    if (props.event.type === 'chat' && props.event.company) {
      return `${props.event.author} пишет для ${props.event.company}`;
    }
    return props.event.author;
  });

  const handleReply = () => {
    emit('reply', props.event);
  };
</script>
<template>
  <TimelineItem :show-icon="false">
    <template #content>
      <div class="relative mr-15px">
        <div class="absolute right-0 top-[-5px]">
          <svg-icon :name="iconName" width="20" height="20" />
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
              class="mb-7px text-13px font-normal leading-normal text-slate-custom"
            >
              <span>{{ event.time }}</span>
              {{ authorLine }}
            </p>
            <p class="wrapping text-sm font-normal text-space">
              {{ event.content }}
            </p>
          </li>
        </ul>

        <BtnIconText
          v-if="replyLabel"
          icon="resend"
          :text="replyLabel"
          @click="handleReply"
        />
      </div>
    </template>
  </TimelineItem>
</template>
