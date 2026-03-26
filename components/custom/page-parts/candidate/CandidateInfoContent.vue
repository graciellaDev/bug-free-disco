<script setup lang="ts">
  import { ref, computed, nextTick, onMounted, onBeforeUnmount } from 'vue';
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

  type FieldKey = 'phone' | 'email' | null;
  const openDropdown = ref<FieldKey>(null);
  const editingField = ref<FieldKey>(null);
  const editPhoneValue = ref('');
  const editEmailValue = ref('');
  const dropdownRoot = ref<HTMLElement | null>(null);

  const showCandidateEmailRow = computed(
    () =>
      hasDisplayableCandidateEmail(props.candidate.email) ||
      editingField.value === 'email'
  );

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // fallback
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    openDropdown.value = null;
  };

  const openFieldDropdown = (field: 'phone' | 'email', e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    openDropdown.value = field;
  };

  const closeDropdown = () => {
    openDropdown.value = null;
  };

  const handleCopy = (field: 'phone' | 'email') => {
    const value =
      field === 'phone'
        ? (formattedPhone.value || props.candidate.phone || '')
        : displayCandidateEmailOrEmpty(props.candidate.email);
    copyToClipboard(value);
  };

  /** Как в PhoneInput: только цифры, макс 11, 8→7, 10 цифр → 7 в начало */
  const getPhoneDigits = (s: string): string => {
    let d = (s || '').replace(/\D/g, '').slice(0, 11);
    if (d.length === 11 && d[0] === '8') d = '7' + d.slice(1);
    if (d.length === 10) d = '7' + d;
    return d;
  };

  const startEdit = (field: 'phone' | 'email') => {
    openDropdown.value = null;
    editingField.value = field;
    if (field === 'phone') editPhoneValue.value = props.candidate.phone || '';
    else
      editEmailValue.value = displayCandidateEmailOrEmpty(
        props.candidate.email
      );
  };

  const handleWriteEmail = () => {
    openDropdown.value = null;
    emit('write-email');
  };

  const cancelEdit = () => {
    editingField.value = null;
    editPhoneValue.value = '';
    editEmailValue.value = '';
  };

  const saveEdit = async () => {
    if (!editingField.value) return;
    const payload: CandidateUpdateRequest = {
      id: props.candidate.id,
      firstname: props.candidate.firstname,
      email: editingField.value === 'email' ? editEmailValue.value : props.candidate.email,
      phone: editingField.value === 'phone' ? phoneToApi(editPhoneValue.value) || props.candidate.phone : props.candidate.phone,
    };
    try {
      const res = await updateCandidate(payload);
      if (res?.data) emit('candidate-updated', res.data);
      cancelEdit();
    } catch (err) {
      console.error('[CandidateInfoContent] Ошибка сохранения:', err);
    }
  };

  const handleClickOutside = (e: MouseEvent) => {
    if (dropdownRoot.value && !dropdownRoot.value.contains(e.target as Node)) {
      openDropdown.value = null;
    }
  };

  onBeforeUnmount(() => {
    document.removeEventListener('click', handleClickOutside);
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

  /** Для сохранения в API: +7 и 10 цифр */
  const phoneToApi = (digits: string): string => {
    const d = getPhoneDigits(digits);
    return d.length === 11 ? '+7' + d.slice(1) : '';
  };

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

  onMounted(() => {
    document.addEventListener('click', handleClickOutside);
  });
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
      <div ref="dropdownRoot" class="space-between relative flex flex-col gap-y-[5px]">
        <div v-if="candidate.phone || editingField === 'phone'" class="flex items-center leading-[1.5]">
          <div
            class="mb-5px mr-[45px] min-w-[70px] text-sm font-normal leading-150 text-space"
          >
            Телефон:
          </div>
          <div class="relative mr-2.5 flex items-center leading-[1.5]">
            <template v-if="editingField === 'phone'">
              <input
                v-model="editPhoneValue"
                type="tel"
                inputmode="tel"
                class="rounded-ten border border-athens bg-white px-2.5 py-1.5 text-sm text-space focus:border-dodger focus:outline-none"
                placeholder="+7 900 123 45 67"
              />
            </template>
            <template v-else>
              <button
                type="button"
                class="mr-1.5 text-left text-sm font-medium text-space"
                @click="openFieldDropdown('phone', $event)"
              >
                {{ formattedPhone }}
              </button>
            </template>
            <a
              v-if="telegramPhoneLink && editingField !== 'phone'"
              :href="telegramPhoneLink"
              target="_blank"
              rel="noopener noreferrer"
              class="tg-icon-link ml-0.5 inline-flex shrink-0 items-center justify-center rounded-full"
              title="Написать в Telegram"
            >
              <svg-icon
                class="pointer-events-none [&_use]:pointer-events-none block"
                name="tg20"
                width="21"
                height="21"
              />
            </a>
            <Transition name="slide-fade">
              <div
                v-if="openDropdown === 'phone'"
                class="absolute left-0 top-full z-10 mt-1 min-w-[140px] rounded-ten border border-athens bg-white py-1 shadow-shadow-droplist"
                @click.stop
              >
                <button
                  type="button"
                  class="w-full px-15px py-2 text-left text-sm text-slate-custom hover:bg-zumthor hover:text-space"
                  @click="handleCopy('phone')"
                >
                  Копировать
                </button>
                <button
                  type="button"
                  class="w-full px-15px py-2 text-left text-sm text-slate-custom hover:bg-zumthor hover:text-space"
                  @click="startEdit('phone')"
                >
                  Редактировать
                </button>
              </div>
            </Transition>
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
          <div class="relative">
            <template v-if="editingField === 'email'">
              <input
                v-model="editEmailValue"
                type="email"
                class="rounded-ten border border-athens bg-white px-2.5 py-1.5 text-sm text-space focus:border-dodger focus:outline-none"
                :style="{ minWidth: `${Math.max(28, (editEmailValue.length || 1) + 1)}ch` }"
                placeholder="email@example.com"
              />
            </template>
            <button
              v-else
              type="button"
              class="text-left text-sm font-medium text-space"
              @click="openFieldDropdown('email', $event)"
            >
              {{ candidate.email }}
            </button>
            <Transition name="slide-fade">
              <div
                v-if="openDropdown === 'email'"
                class="absolute left-0 top-full z-10 mt-1 min-w-[140px] rounded-ten border border-athens bg-white py-1 shadow-shadow-droplist"
                @click.stop
              >
                <button
                  type="button"
                  class="w-full px-15px py-2 text-left text-sm text-slate-custom hover:bg-zumthor hover:text-space"
                  @click="handleCopy('email')"
                >
                  Копировать
                </button>
                <button
                  type="button"
                  class="w-full px-15px py-2 text-left text-sm text-slate-custom hover:bg-zumthor hover:text-space"
                  @click="startEdit('email')"
                >
                  Редактировать
                </button>
                <button
                  type="button"
                  class="w-full px-15px py-2 text-left text-sm text-slate-custom hover:bg-zumthor hover:text-space"
                  @click="handleWriteEmail"
                >
                  Написать письмо
                </button>
              </div>
            </Transition>
          </div>
        </div>
        <div class="flex items-start">
          <span
            class="mr-[45px] min-w-[70px] shrink-0 self-start text-sm font-normal leading-normal text-space"
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
        <div
          v-if="editingField"
          class="mt-3 flex items-center gap-2.5 border-t border-athens pt-3"
        >
          <button
            type="button"
            class="rounded-ten bg-dodger px-4 py-2 text-sm font-medium text-white hover:opacity-90"
            @click="saveEdit"
          >
            Сохранить
          </button>
          <button
            type="button"
            class="rounded-ten border border-athens bg-white px-4 py-2 text-sm font-medium text-slate-custom hover:bg-athens-gray"
            @click="cancelEdit"
          >
            Отменить
          </button>
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
</template>

<style scoped>
.slide-fade-enter-active,
.slide-fade-leave-active {
  transition: all 0.15s ease-out;
}
.slide-fade-enter-from,
.slide-fade-leave-to {
  transform: translateY(-2px);
  opacity: 0;
}

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
