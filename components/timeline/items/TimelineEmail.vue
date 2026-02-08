<template>
  <TimelineItem
    icon-name="mail"
    icon-background="bg-chilean"
    icon-color="text-dodger"
  >
    <template #content>
      <div class="w-full min-w-0">
        <ul
          :class="{
            'mb-2.5': emails.length > 1,
            'mb-15px': emails.length === 1,
          }"
        >
          <li
            v-for="(email, index) in emails"
            :key="index"
            :class="{ 'mb-15px': index !== emails.length - 1 }"
          >
            <div :class="{ relative: email.status }">
              <p
                class="mb-7px text-13px font-normal leading-normal text-slate-custom"
              >
                <span>{{ email.time }}</span>
                {{ email.direction }} письмо от {{ email.from }} для
                {{ email.to }}
              </p>
              <div
                v-if="email.status"
                class="absolute right-0 top-0 flex items-center gap-x-5px"
              >
                <svg-icon name="sended" width="15" height="15" />
                <p class="text-13px font-normal text-slate-custom">
                  {{ email.status }}
                </p>
              </div>
            </div>
            <div class="w-full min-w-0">
              <p
                class="mb-2 text-sm font-medium leading-normal text-space underline"
              >
                {{ email.subject }}
              </p>
              <p
                class="max-w-full overflow-hidden text-ellipsis whitespace-nowrap text-sm font-normal text-space"
              >
                {{ email.content }}
              </p>
            </div>
          </li>
        </ul>
        <BtnIconText
          icon="resend"
          text="Отправить письмо"
          @click="handleSendEmail"
        />
      </div>
    </template>
  </TimelineItem>
</template>

<script setup>
  import TimelineItem from '../TimelineItem.vue';
  import BtnIconText from '@/components/custom/BtnIconText.vue';

  const props = defineProps({
    emails: {
      type: Array,
      required: true,
      default: () => [],
    },
  });

  const emit = defineEmits(['send']);

  const handleSendEmail = () => {
    emit('send', props.emails);
  };
</script>
