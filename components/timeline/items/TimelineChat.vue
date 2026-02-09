<script setup lang="ts">
  import { getAvatarProps } from '@/lib/avatar';
  import type { TimelineMessage } from '@/types/timeline';
  import BtnIconText from '@/components/custom/BtnIconText.vue';
  import TimelineItem from '@/components/timeline/TimelineItem.vue';

  const props = defineProps<{
    message: TimelineMessage;
  }>();

  const emit = defineEmits<{
    reply: [message: TimelineMessage];
  }>();

  const channelIconMap: Record<string, string> = {
    hh: 'hh-border20',
    avito: 'avito-border20',
    rabota: 'rabota-border20',
    jobly: 'jobly-border20',
  };

  const iconName = computed(
    () => channelIconMap[props.message.channel ?? ''] ?? 'chat-generic20'
  );

  const avatarProps = computed(() => getAvatarProps(props.message));

  const handleReply = () => {
    emit('reply', props.message);
  };
</script>

<template>
  <TimelineItem :show-icon="false">
    <template #content>
      <div class="relative mr-15px">
        <div class="absolute right-0 top-[-5px]">
          <svg-icon name="iconName" width="20" height="20" />
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
              <span>{{ message.time }}</span>
              {{ message.author }} пишет для {{ message.company }}
            </p>
            <p class="wrapping text-sm font-normal text-space">
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
