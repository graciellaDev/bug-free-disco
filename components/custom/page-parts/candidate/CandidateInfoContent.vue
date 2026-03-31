<script setup lang="ts">
  import { ref, computed, nextTick, onBeforeUnmount } from 'vue';
  import { createTag, findTag } from '@/src/api/tags';
  import { detachCandidateTag, updateCandidate } from '@/src/api/candidates';
  import type {
    Candidate,
    CandidateUpdateRequest,
    TagCandidate,
  } from '@/types/candidates';
  import { buildCandidateLocationLine } from '@/utils/hhCandidateLocationLine';
  import {
    displayCandidateEmailOrEmpty,
    hasDisplayableCandidateEmail,
  } from '@/utils/candidateDisplayEmail';
  import { formatCandidateSalaryLine } from '@/utils/candidateSalaryLine';
  import { useJoblyToastTopStyle } from '@/composables/useJoblyToastTopStyle';

  const props = defineProps<{
    candidate: Candidate;
    vacancyName: string;
  }>();

  const emit = defineEmits<{
    'telegram-click': [];
    // 'add-tag': [];
    'candidate-updated': [candidate: Candidate];
    'write-email': [];
  }>();

  const DEFAULT_AVATAR_SRC = '/img/default-avatar.png';

  const contactToast = ref<{
    show: boolean;
    text: string;
    variant: 'success' | 'error';
  }>({ show: false, text: '', variant: 'error' });
  let contactToastTimer: ReturnType<typeof setTimeout> | null = null;

  const contactToastTopStyle = useJoblyToastTopStyle(
    computed(() => contactToast.value.show)
  );

  function showContactToast(
    message: string,
    variant: 'success' | 'error' = 'error'
  ) {
    contactToast.value = { show: true, text: message, variant };
    if (contactToastTimer) clearTimeout(contactToastTimer);
    contactToastTimer = setTimeout(() => {
      contactToast.value = { show: false, text: '', variant: 'error' };
      contactToastTimer = null;
    }, 4000);
  }

  const candidatePhotoSrc = computed(
    () => props.candidate.imagePath?.trim() || DEFAULT_AVATAR_SRC
  );

  /** Заглушка — целиком в квадрате; фото — cover как раньше */
  const isPlaceholderAvatar = computed(
    () => !props.candidate.imagePath?.trim()
  );

  const isAddingTag = ref(false);
  const tagInputValue = ref('');
  const isSubmittingTag = ref(false);
  const tagInputRef = ref<HTMLInputElement | null>(null);
  const detachingTagId = ref<number | null>(null);

  const showCandidateEmailRow = computed(() =>
    hasDisplayableCandidateEmail(props.candidate.email)
  );

  function emailHasAtAndDot(raw: string): boolean {
    const t = raw.trim();
    return t.includes('@') && t.includes('.');
  }

  async function handleCopyEmail() {
    const value = displayCandidateEmailOrEmpty(props.candidate.email);
    if (!value) {
      showContactToast('Нет адреса для копирования', 'error');
      return;
    }
    try {
      await navigator.clipboard.writeText(value);
      showContactToast('Скопировано', 'success');
    } catch {
      showContactToast('Не удалось скопировать', 'error');
    }
  }

  function handleWriteEmail() {
    const t = displayCandidateEmailOrEmpty(props.candidate.email);
    if (!t) {
      showContactToast('Введите адрес e-mail', 'error');
      return;
    }
    if (!emailHasAtAndDot(t)) {
      showContactToast(
        'Введите корректный e-mail (например, user@example.ru)',
        'error'
      );
      return;
    }
    emit('write-email');
  }

  /** Как в PhoneInput: только цифры, макс 11, 8→7, 10 цифр → 7 в начало */
  const getPhoneDigits = (s: string): string => {
    let d = (s || '').replace(/\D/g, '').slice(0, 11);
    if (d.length === 11 && d[0] === '8') d = '7' + d.slice(1);
    if (d.length === 10) d = '7' + d;
    return d;
  };

  onBeforeUnmount(() => {
    if (contactToastTimer) clearTimeout(contactToastTimer);
  });

  /** Маска: +7 (XXX) XXX XX XX. На вход — строка цифр (макс 11), как в PhoneInput. */
  const formatPhoneMask = (digits: string): string => {
    const d = (digits || '').replace(/\D/g, '');
    if (d.length === 0) return '';
    let n = d.length > 11 ? d.slice(0, 11) : d;
    if (n.length === 11 && n[0] === '8') n = '7' + n.slice(1);
    if (n.length === 10) n = '7' + n;
    const len = n.length;
    let s = '+7 (' + n.slice(1, Math.min(4, len));
    if (len >= 4) s += ') ' + n.slice(4, Math.min(7, len));
    if (len >= 7) s += ' ' + n.slice(7, Math.min(9, len));
    if (len >= 9) s += ' ' + n.slice(9, 11);
    return s;
  };

  const formattedPhone = computed(() => formatPhoneMask(getPhoneDigits(props.candidate.phone || '')));

  async function handleCopyPhone() {
    const value = (
      formattedPhone.value ||
      props.candidate.phone ||
      ''
    ).trim();
    if (!value) {
      showContactToast('Нет номера для копирования', 'error');
      return;
    }
    try {
      await navigator.clipboard.writeText(value);
      showContactToast('Скопировано', 'success');
    } catch {
      showContactToast('Не удалось скопировать', 'error');
    }
  }

  const telegramPhoneLink = computed(() => {
    const digits = getPhoneDigits(props.candidate.phone || '');
    return digits.length === 11 ? `https://t.me/+${digits}` : '';
  });

  const formattedLocation = computed(() => {
    return props.candidate.location
      ? `г. ${props.candidate.location}`
      : 'Город не указан';
  });

  /** Город, м., переезд, командировки, адрес — см. buildCandidateLocationLine */
  const cityAndAddressLine = computed(() =>
    buildCandidateLocationLine(props.candidate)
  );

  /** Бейдж «Обновлено»: дата резюме HH, иначе updated_at */
  const resumeUpdatedDisplay = computed(() => {
    const raw =
      props.candidate.resume_updated_at?.trim() ||
      props.candidate.updated_at?.trim();
    if (!raw) return '';
    const d = new Date(raw);
    if (!Number.isNaN(d.getTime())) {
      return d.toLocaleDateString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    }
    const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(raw);
    if (m) return `${m[3]}.${m[2]}.${m[1]}`;
    return raw;
  });

  const sourceBadgeText = computed(() => {
    const s = props.candidate.source?.trim();
    return s ? `Источник: ${s}` : '';
  });

  const showMetaBadges = computed(
    () => Boolean(resumeUpdatedDisplay.value || sourceBadgeText.value)
  );

  const salaryLine = computed(() => formatCandidateSalaryLine(props.candidate));

  /** Пол для UI: по HH `gender.id` (male/female), иначе нормализация старого текста (напр. «Мужской») */
  const genderDisplayLabel = computed(() => {
    const id = props.candidate.gender_id;
    if (id === 'male') return 'Мужчина';
    if (id === 'female') return 'Женщина';
    const g = props.candidate.gender?.trim();
    if (!g) return '';
    if (/мужск/i.test(g)) return 'Мужчина';
    if (/женск/i.test(g)) return 'Женщина';
    return g;
  });

  /** Пол и возраст в одну строку, серым, через точку (как у вакансий) */
  const genderAndAgeLine = computed(() => {
    const parts: string[] = [];
    const genderLabel = genderDisplayLabel.value;
    if (genderLabel) parts.push(genderLabel);
    if (props.candidate.age != null && props.candidate.age > 0) {
      const n = Number(props.candidate.age);
      const mod10 = n % 10;
      const mod100 = n % 100;
      let suffix = 'лет';
      if (mod10 === 1 && mod100 !== 11) suffix = 'год';
      else if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) suffix = 'года';
      parts.push(`${n} ${suffix}`);
    }
    if (parts.length === 0) return '';
    return parts.join(' · ');
  });

  /** Для отображения и для ввода: без пробелов. */
  const tagNameForDisplay = (name: string) => (name || '').replace(/\s+/g, '');

  const normalizeNewTagName = (raw: string) =>
    raw.trim().replace(/^#+/u, '').replace(/\s+/g, '');

  const candidateTagsList = computed((): TagCandidate[] => {
    const raw = props.candidate.tags;
    if (!Array.isArray(raw)) return [];
    return raw.filter((t): t is TagCandidate => typeof t === 'object' && t !== null && 'id' in t);
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

    const tagName = normalizeNewTagName(tagInputValue.value);

    if (!tagName) return;

    const existingTag = candidateTagsList.value.find(
      t => tagNameForDisplay(t.name) === tagName
    );

    if (existingTag) {
      isAddingTag.value = false;
      tagInputValue.value = '';
      return;
    }

    isSubmittingTag.value = true;

    try {
      let tagId: number;

      try {
        const foundTag = await findTag(tagName);

        if (foundTag && typeof foundTag === 'object' && 'id' in foundTag) {
          console.log('Тег найден', foundTag);
          tagId = (foundTag as TagCandidate).id;
        } else {
          throw new Error(
            '[handleInputKeyDown] Неожиданный ответ функции findTag'
          );
        }
      } catch (error: unknown) {
        if (error && typeof error === 'object' && 'statusCode' in error) {
          const apiError = error as { statusCode?: number };

          if (apiError.statusCode === 404) {
            const tagResponse = await createTag(tagName);

            if (!tagResponse.data || !tagResponse.data.id) {
              throw new Error('[handkeInputKeyDown] Ошибка создания тега.');
            }
            tagId = tagResponse.data.id;
          } else {
            throw new Error('[handkeInputKeyDown] Ошибка при получении тега.');
          }
        } else {
          throw new Error('[handkeInputKeyDown] Ошибка при получении тега.');
        }
      }

      const updateData: CandidateUpdateRequest = {
        id: props.candidate.id,
        firstname: props.candidate.firstname,
        email: props.candidate.email,
        phone: props.candidate.phone,
        tags: [tagId],
      };

      console.log('updateData', updateData);

      const updatedRespose = await updateCandidate(updateData);

      console.log('updatedRespose', updatedRespose);

      if (updatedRespose?.data) {
        emit('candidate-updated', updatedRespose.data);

        isAddingTag.value = false;
        tagInputValue.value = '';
      }
    } catch (err) {
      console.error(
        '[handleTagInputKeyDown] Ошибка при добавлении тега: ',
        err
      );
    } finally {
      isSubmittingTag.value = false;
    }
  };

  const handleCancelAddTag = () => {
    isAddingTag.value = false;
    tagInputValue.value = '';
  };

  const handleRemoveTag = async (tag: TagCandidate) => {
    if (detachingTagId.value !== null) return;
    detachingTagId.value = tag.id;
    try {
      await detachCandidateTag(props.candidate.id, tag.id);
      const tags = candidateTagsList.value.filter(t => t.id !== tag.id);
      emit('candidate-updated', { ...props.candidate, tags });
    } catch (err) {
      console.error('[CandidateInfoContent] Ошибка удаления тега:', err);
    } finally {
      detachingTagId.value = null;
    }
  };

</script>

<template>
  <div class="flex justify-between">
    <div>
      <div class="mb-6px text-25px font-bold leading-normal text-space">
        {{ candidate.surname }} {{ candidate.firstname }}
        <span
          v-if="genderAndAgeLine"
          class="ml-1 text-13px font-normal text-slate-custom"
        >
          {{ genderAndAgeLine }}
        </span>
      </div>

      <div class="mb-6px text-15px font-medium leading-normal text-space">
        {{ candidate.quickInfo || vacancyName }}
        <template v-if="salaryLine">
          <span class="font-normal text-space"> · </span>{{ salaryLine }}
        </template>
      </div>

      <div
        class="text-13px text-slate-custom"
        :class="showMetaBadges ? 'mb-4' : 'mb-6'"
      >
        {{ cityAndAddressLine }}
      </div>
      <div
        v-if="showMetaBadges"
        class="mb-6 flex flex-wrap gap-2"
      >
        <span
          v-if="resumeUpdatedDisplay"
          class="inline-flex items-center rounded-fifteen bg-athens-gray px-2.5 py-[5px] text-xs font-normal leading-normal text-slate-custom"
        >
          Обновлено {{ resumeUpdatedDisplay }}
        </span>
        <span
          v-if="sourceBadgeText"
          class="inline-flex items-center rounded-fifteen bg-athens-gray px-2.5 py-[5px] text-xs font-normal leading-normal text-slate-custom"
        >
          {{ sourceBadgeText }}
        </span>
      </div>
      <div class="relative flex flex-col gap-y-[5px]">
        <div v-if="candidate.phone" class="flex items-center leading-[1.5]">
          <div
            class="mb-5px mr-[45px] min-w-[70px] text-sm font-normal leading-150 text-space"
          >
            Телефон:
          </div>
          <div
            class="relative inline-flex items-center gap-0.5 leading-[1.5]"
          >
            <span class="text-sm font-medium text-space">
              {{ formattedPhone }}
            </span>
            <span
              v-if="(formattedPhone || candidate.phone) || telegramPhoneLink"
              class="inline-flex items-center gap-0"
            >
              <button
                v-if="formattedPhone || candidate.phone"
                type="button"
                class="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded border-0 bg-transparent p-0 text-slate-custom transition-opacity hover:opacity-80 hover:text-space focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-dodger"
                aria-label="Копировать номер"
                title="Копировать"
                @click.stop="handleCopyPhone"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  stroke="currentColor"
                  stroke-width="1.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  aria-hidden="true"
                >
                  <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
                  <path
                    d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"
                  />
                </svg>
              </button>
              <a
                v-if="telegramPhoneLink"
                :href="telegramPhoneLink"
                target="_blank"
                rel="noopener noreferrer"
                class="tg-icon-link inline-flex shrink-0 items-center justify-center rounded-full"
                title="Написать в Telegram"
              >
                <svg-icon
                  class="pointer-events-none [&_use]:pointer-events-none block"
                  name="tg20"
                  width="21"
                  height="21"
                />
              </a>
            </span>
          </div>
        </div>
        <div
          v-if="showCandidateEmailRow"
          class="flex items-center leading-[1.5]"
        >
          <span
            class="mb-5px mr-[45px] min-w-[70px] text-sm font-normal leading-150 text-space"
          >
            Почта:
          </span>
          <div
            class="relative inline-flex flex-wrap items-center gap-0.5 leading-[1.5]"
          >
            <button
              type="button"
              class="text-left text-sm font-medium text-space"
              @click="handleWriteEmail"
            >
              {{ candidate.email }}
            </button>
            <span
              v-if="hasDisplayableCandidateEmail(candidate.email)"
              class="inline-flex items-center gap-0"
            >
              <button
                type="button"
                class="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded border-0 bg-transparent p-0 text-slate-custom transition-opacity hover:opacity-80 hover:text-space focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-dodger"
                aria-label="Копировать e-mail"
                title="Копировать"
                @click.stop="handleCopyEmail"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  stroke="currentColor"
                  stroke-width="1.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  aria-hidden="true"
                >
                  <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
                  <path
                    d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"
                  />
                </svg>
              </button>
              <button
                type="button"
                class="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded border-0 bg-transparent p-0 text-slate-custom transition-opacity hover:opacity-80 hover:text-space focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-dodger"
                aria-label="Написать письмо"
                title="Написать"
                @click.stop="handleWriteEmail"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  stroke="currentColor"
                  stroke-width="1.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  aria-hidden="true"
                >
                  <rect x="3" y="5" width="18" height="14" rx="2" />
                  <path d="m3 7 9 6 9-6" />
                </svg>
              </button>
            </span>
          </div>
        </div>
        <div class="flex items-start leading-[1.5]">
          <span
            class="mb-5px mr-[45px] min-w-[70px] shrink-0 self-start text-sm font-normal leading-150 text-space"
          >
            Теги:
          </span>
          <div class="min-w-0 flex-1">
            <div class="flex flex-wrap items-center gap-x-2 gap-y-1">
              <span
                v-for="tag in candidateTagsList"
                :key="tag.id"
                class="group relative inline-flex max-w-full items-center whitespace-nowrap pr-1 focus-within:outline-none"
              >
                <span class="text-sm font-normal leading-normal text-dodger">
                  #{{ tagNameForDisplay(tag.name) }}
                </span>
                <button
                  type="button"
                  class="tag-delete-btn pointer-events-none absolute -right-1 -top-2 z-10 inline-flex h-[22px] w-[22px] items-center justify-center rounded-md bg-white p-0 shadow-sm ring-1 ring-athens opacity-0 transition-opacity hover:bg-zumthor group-hover:pointer-events-auto group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:opacity-100"
                  :disabled="detachingTagId === tag.id"
                  aria-label="Удалить тег"
                  title="Удалить"
                  @click.stop="handleRemoveTag(tag)"
                >
                  <span
                    class="flex items-center justify-center text-red-500 transition-colors hover:text-red-600"
                    :class="{
                      'animate-pulse opacity-50': detachingTagId === tag.id,
                    }"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      class="block shrink-0"
                      aria-hidden="true"
                    >
                      <path
                        d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h14Z"
                      />
                      <line x1="10" y1="11" x2="10" y2="17" />
                      <line x1="14" y1="11" x2="14" y2="17" />
                    </svg>
                  </span>
                </button>
              </span>
              <button
                v-if="!isAddingTag"
                type="button"
                class="flex items-center text-13px font-normal leading-normal text-slate-custom transition-opacity hover:opacity-80"
                @click="handleAddTagClick"
              >
                <svg-icon
                  name="plus-gray20"
                  width="18"
                  height="17"
                  class="mr-5px shrink-0"
                />
                Добавить
              </button>
              <div v-else class="inline-flex min-w-0 items-baseline">
                <span
                  class="select-none text-sm font-normal leading-normal text-dodger"
                  aria-hidden="true"
                >
                  #
                </span>
                <input
                  ref="tagInputRef"
                  v-model="tagInputValue"
                  type="text"
                  class="tag-input-inline max-w-[min(100%,280px)] border-0 bg-transparent p-0 text-sm font-normal leading-normal text-dodger outline-none ring-0 focus:border-0 focus:outline-none focus:ring-0 focus-visible:outline-none disabled:opacity-50"
                  :style="{
                    width: `${Math.max(2, (tagInputValue?.length || 0) + 1)}ch`,
                  }"
                  :disabled="isSubmittingTag"
                  autocomplete="off"
                  @keydown="handleTagInputKeyDown"
                  @blur="handleCancelAddTag"
                />
                <span
                  v-if="isSubmittingTag"
                  class="ml-2 shrink-0 text-sm font-normal text-slate-custom"
                >
                  Сохранение…
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div
      class="h-[200px] w-[200px] shrink-0 overflow-hidden rounded-fifteen bg-catskill"
    >
      <img
        :src="candidatePhotoSrc"
        alt="Фото кандидата"
        class="h-full w-full object-center"
        :class="isPlaceholderAvatar ? 'object-contain' : 'object-cover'"
      />
    </div>
  </div>
  <Teleport to="body">
    <Transition name="contact-toast-fade">
      <div
        v-if="contactToast.show"
        class="fixed right-4 z-[10001] max-w-[min(90vw,420px)] rounded-fifteen px-6 py-3 text-center text-sm font-medium leading-150 text-space shadow-[0_0_15px_rgba(0,0,0,0.15)] sm:right-6"
        :style="contactToastTopStyle"
        :class="
          contactToast.variant === 'success'
            ? 'contact-toast-success'
            : 'contact-toast-error'
        "
        :role="contactToast.variant === 'success' ? 'status' : 'alert'"
      >
        {{ contactToast.text }}
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
/* Иконка Telegram: белый самолёт на светло-синем круге (как на скриншоте) */
.tg-icon-link :deep(circle),
.tg-icon-link :deep(rect) {
  fill: #229ed9;
}
.tg-icon-link :deep(path) {
  fill: white;
  transform: translateX(-2px);
}

.tag-input-inline {
  caret-color: #5898ff;
}
</style>

<style>
  .contact-toast-error {
    background-color: #fce7f3 !important;
    border: none !important;
    color: #212936 !important;
    -webkit-backdrop-filter: none !important;
    backdrop-filter: none !important;
  }
  .contact-toast-success {
    background-color: #ffffff !important;
    border: none !important;
    color: #212936 !important;
    -webkit-backdrop-filter: none !important;
    backdrop-filter: none !important;
  }
  .contact-toast-fade-enter-active,
  .contact-toast-fade-leave-active {
    transition: opacity 0.3s ease;
  }
  .contact-toast-fade-enter-from,
  .contact-toast-fade-leave-to {
    opacity: 0;
  }
</style>
