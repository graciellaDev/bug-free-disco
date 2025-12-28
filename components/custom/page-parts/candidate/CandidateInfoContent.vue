<script setup lang="ts">
  import { ref, computed, nextTick } from 'vue';
  import { createTag } from '@/src/api/tags';
  import { updateCandidate } from '@/src/api/candidates';
  import type {
    Candidate,
    CandidateUpdateRequest,
    TagCandidate,
  } from '@/types/candidates';

  const props = defineProps<{
    candidate: Candidate;
    vacancyName: string;
  }>();

  const emit = defineEmits<{
    'telegram-click': [];
    // 'add-tag': [];
    'candidate-updated': [candidate: Candidate];
  }>();

  const isAddingTag = ref(false);
  const tagInputValue = ref('');
  const isSubmittingTag = ref(false);
  const tagInputRef = ref<HTMLInputElement | null>(null);

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

  const handleAddTagClick = async () => {
    isAddingTag.value = true;
    tagInputValue.value = '';
    await nextTick();
    tagInputRef.value?.focus();
  };

  const handleTagInputKeyDown = async (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      handleCancelAddTag();
      return;
    }
    if (event.key !== 'Enter') return;

    const tagName = tagInputValue.value.trim();

    if (!tagName) return;

    const existingTag = props.candidate.tags?.find(
      tag => tag.name.toLocaleLowerCase() === tagName.toLowerCase()
    );

    if (existingTag) {
      isAddingTag.value = false;
      tagInputValue.value = '';
      return;
    }

    isSubmittingTag.value = true;

    try {
      const tagResponse = await createTag(tagName);

      if (!tagResponse.data || !tagResponse.data.id) {
        throw new Error('Ошибка создания тега!');
      }

      const newTag = tagResponse.data;

      const updatedTags = [];
      if (props.candidate.tags && props.candidate.tags.length > 0)
        updatedTags.push(...props.candidate.tags);
      updatedTags.push(newTag);

      const updateData: CandidateUpdateRequest = {
        id: props.candidate.id,
        firstname: props.candidate.firstname,
        email: props.candidate.email,
        phone: props.candidate.phone,
        tags: updatedTags,
      };

      const updatedRespose = await updateCandidate(updateData);

      if (updatedRespose?.data) {
        emit('candidate-updated', updatedRespose.data);

        isAddingTag.value = false;
        tagInputValue.value = '';
      }
    } catch (err) {
      console.error('Ошибка при добавлении тега: ', err);
    } finally {
      isSubmittingTag.value = false;
    }
  };

  const handleCancelAddTag = () => {
    isAddingTag.value = false;
    tagInputValue.value = '';
  };
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
            {{ tag.name }}
          </span>
          <button
            v-if="!isAddingTag"
            :class="{
              'ml-2.5': candidate?.tags && candidate?.tags?.length > 0,
            }"
            class="flex items-center text-slate-custom"
            @click="handleAddTagClick"
          >
            <svg-icon
              name="plus-gray20"
              width="18"
              height="17"
              class="mr-5px"
            />
            <span class="text-sm font-medium">Добавить</span>
          </button>
          <div v-else class="flex items-center gap-2">
            <input
              ref="tagInputRef"
              v-model="tagInputValue"
              type="text"
              class="h-8 rounded border border-gray-300 px-2 text-sm focus:border-dodger focus:outline-none"
              :disabled="isSubmittingTag"
              @keydown="handleTagInputKeyDown"
              @blur="handleCancelAddTag"
            />
            <button
              v-if="isSubmittingTag"
              class="text-state-custom text-sm"
              disabled
            >
              Сохранение...
            </button>
          </div>
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
