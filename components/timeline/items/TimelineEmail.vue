<template>
  <TimelineItem
    icon-name="mail"
    icon-background="bg-chilean"
    icon-color="text-dodger"
  >
    <template #content>
      <div class="min-w-0 w-full">
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
                class="text-13px font-normal text-slate-custom leading-normal mb-7px"
              >
                <span>{{ email.time }}</span>
                {{ email.direction }} письмо от {{ email.from }} для
                {{ email.to }}
              </p>
              <div
                v-if="email.status"
                class="flex absolute right-0 top-0 items-center gap-x-5px"
              >
                <svg-icon name="sended" width="15" height="15" />
                <p class="text-13px font-normal text-slate-custom">
                  {{ email.status }}
                </p>
              </div>
            </div>
            <div class="min-w-0 w-full">
              <p
                class="underline text-sm font-medium text-space leading-normal mb-2"
              >
                {{ email.subject }}
              </p>
              <p
                class="text-sm font-normal text-space max-w-full overflow-hidden text-ellipsis whitespace-nowrap"
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
  import TimelineItem from '../TimelineItem.vue'
  import BtnIconText from '@/components/custom/BtnIconText.vue'

  const props = defineProps({
    emails: {
      type: Array,
      required: true,
      default: () => [],
    },
  })

  const emit = defineEmits(['send'])

  const handleSendEmail = () => {
    emit('send', props.emails)
  }
</script>
