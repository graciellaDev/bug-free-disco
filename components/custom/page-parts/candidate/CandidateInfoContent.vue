<script setup lang="ts">
  import { computed } from 'vue';
  import type { Candidate } from '@/types/candidates';

  const props = defineProps<{
    candidate: Candidate;
    vacancyName: string;
  }>();

  const emit = defineEmits<{
    'telegram-click': [];
    'add-tag': [];
  }>();

  const formattedPhone = computed(() => {
    if (!props.candidate.phone) return '';
    const phone = props.candidate.phone;
    if (phone.length >= 12) {
      return `${phone.slice(0, 2)}-${phone.slice(2, 5)}-${phone.slice(5, 8)}-${phone.slice(8, 12)}`;
    }
    return phone;
  });

  const formattedLocation = computed(() => {
    return props.candidate.location
      ? `г. ${props.candidate.location}`
      : 'Город не указан';
  });

  const formattedTelegram = computed(() => {
    return props.candidate.telegram ? `@${props.candidate.telegram}` : '';
  });

  const messengerMaxUrl = computed(() => {
    if (props.candidate.messengerMax) {
      return `<a href=https://max.ru/u/${props.candidate.messengerMax} class=link-max target=_blank>${props.candidate.firstname} ${props.candidate.surname} в Max</a>`;
    }
    return '';
  });
</script>

<template>
  <div class="flex justify-between">
    <div>
      <div class="mb-2 text-25px font-bold leading-normal text-space">
        {{ candidate.surname }} {{ candidate.firstname }}
        {{ candidate?.patronymic }}
      </div>

      <div class="mb-6px text-15px font-medium leading-normal text-space">
        {{ vacancyName }}
      </div>

      <div class="mb-6 text-13px text-slate-custom">
        {{ formattedLocation }}
      </div>
      <div v-if="candidate.phone" class="flex">
        <div
          class="mb-5px mr-[45px] min-w-[70px] text-sm font-normal leading-150 text-space"
        >
          Телефон:
        </div>
        <div class="mr-2.5 flex">
          <span class="mr-4 text-sm font-medium text-space">
            <a :href="`tel:${candidate.phone}`">
              {{ formattedPhone }}
            </a>
          </span>
          <div v-if="candidate.telegram">
            <button class="mr-1" @click="emit('telegram-click')">
              <svg-icon
                class="pointer-events-none [&_use]:pointer-events-none"
                name="tg20"
                width="21"
                height="21"
              />
            </button>
          </div>
        </div>
      </div>
      <div class="flex">
        <span
          class="mb-5px mr-[45px] min-w-[70px] text-sm font-normal leading-150 text-space"
        >
          Почта:
        </span>
        <span class="text-sm font-medium text-space">
          {{ candidate.email }}
        </span>
      </div>
      <div class="flex">
        <span
          class="mb-5px mr-[45px] min-w-[70px] text-sm font-normal leading-150 text-space"
        >
          Max:
        </span>
        <span v-if="messengerMaxUrl" class="text-sm font-medium text-space">
          <a
            :href="messengerMaxUrl"
            class="link-max"
            target="_blank"
            rel="noopener noreferrer"
          >
            {{ candidate.firstname }} {{ candidate.surname }} в Max
          </a>
        </span>
        <span v-else class="text-sm font-medium text-space">Не указан</span>
      </div>
      <div class="flex">
        <span
          class="mb-5px mr-[45px] min-w-[70px] text-sm font-normal leading-150 text-space"
        >
          Telegram:
        </span>
        <span v-if="formattedTelegram" class="text-sm font-medium text-space">
          {{ formattedTelegram }}
        </span>
        <span v-else class="text-sm font-medium text-space">Не указан</span>
      </div>
      <div class="flex">
        <span
          class="mr-[45px] min-w-[70px] text-sm font-normal leading-150 text-space"
        >
          Теги:
        </span>
        <div class="flex">
          <span
            v-for="(tag, index) in candidate?.tags"
            :key="index"
            class="mr-2 text-sm font-medium text-dodger"
          >
            {{ tag }}
          </span>
          <button
            :class="{
              'ml-2.5': candidate?.tags && candidate?.tags?.length > 0,
            }"
            class="flex items-center text-slate-custom"
            @click="emit('add-tag')"
          >
            <svg-icon
              name="plus-gray20"
              width="18"
              height="17"
              class="mr-5px"
            />
            <span class="text-sm font-medium">Добавить</span>
          </button>
        </div>
      </div>
    </div>
    <div class="h-[200px] w-[200px]">
      <img
        :src="candidate.imagePath || '/img/default-avatar.png'"
        alt="Фото кандидата"
        class="h-full w-full rounded-fifteen bg-catskill object-contain"
      />
    </div>
  </div>
</template>
