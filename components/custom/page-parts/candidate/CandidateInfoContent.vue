<script setup lang="ts">
  import { ref, computed, nextTick, onMounted, onBeforeUnmount } from 'vue';
  import { createTag, findTag } from '@/src/api/tags';
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

  type FieldKey = 'phone' | 'email' | null;
  const openDropdown = ref<FieldKey>(null);
  const editingField = ref<FieldKey>(null);
  const editPhoneValue = ref('');
  const editEmailValue = ref('');
  const dropdownRoot = ref<HTMLElement | null>(null);

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
        : (props.candidate.email || '');
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
    else editEmailValue.value = props.candidate.email || '';
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

  /** Город и адрес в одну строку через точку */
  const cityAndAddressLine = computed(() => {
    const parts: string[] = [];
    if (props.candidate.location) parts.push(`г. ${props.candidate.location}`);
    if (props.candidate.address?.trim()) parts.push(props.candidate.address.trim());
    if (parts.length === 0) return 'Город и адрес не указаны';
    return parts.join(' · ');
  });

  /** Зарплата кандидата: "80 000 - 100 000 ₽" или "80 000 ₽" */
  const salaryLine = computed(() => {
    const from = props.candidate.salaryFrom;
    const to = props.candidate.salaryTo;
    const hasFrom = typeof from === 'number' && !Number.isNaN(from);
    const hasTo = typeof to === 'number' && !Number.isNaN(to);

    if (!hasFrom && !hasTo) return '';

    const format = (v: number) =>
      new Intl.NumberFormat('ru-RU', {
        maximumFractionDigits: 0,
      }).format(v);

    let main = '';
    if (hasFrom && hasTo && from !== to) {
      main = `${format(from as number)} - ${format(to as number)}`;
    } else if (hasFrom) {
      main = format(from as number);
    } else if (hasTo) {
      main = format(to as number);
    }

    if (!main) return '';

    const cur = (props.candidate.currency || 'RUR').toUpperCase();
    const suffix = cur === 'RUR' || cur === 'RUB' ? '₽' : cur;
    return `${main} ${suffix}`;
  });

  /** Пол и возраст в одну строку, серым, через точку (как у вакансий) */
  const genderAndAgeLine = computed(() => {
    const parts: string[] = [];
    if (props.candidate.gender?.trim()) parts.push(props.candidate.gender.trim());
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

    const existingTag = props.candidate.tags?.find(tag =>
      typeof tag === 'object' ? tag.name === tagName : false
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

  onMounted(() => {
    document.addEventListener('click', handleClickOutside);
  });
</script>

<template>
  <div class="flex justify-between">
    <div>
      <div class="mb-6px text-25px font-bold leading-normal text-space">
        {{ candidate.surname }} {{ candidate.firstname }}
        {{ candidate?.patronymic }}
        <span
          v-if="genderAndAgeLine"
          class="ml-1 text-13px font-normal text-slate-custom"
        >
          · {{ genderAndAgeLine }}
        </span>
      </div>

      <div class="mb-6px text-15px font-medium leading-normal text-space">
        {{ vacancyName }}
      </div>

      <div class="mb-6 text-13px text-slate-custom">
        {{ cityAndAddressLine }}
      </div>
      <div
        v-if="salaryLine"
        class="mb-6 text-15px font-medium leading-normal text-space"
      >
        {{ salaryLine }}
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
        <div class="flex items-center leading-[1.5]">
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
              {{ candidate.email || 'Не указан' }}
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
              </div>
            </Transition>
          </div>
        </div>
        <div class="flex items-center leading-[1.5]">
          <span
            class="mb-5px mr-[45px] min-w-[70px] text-sm font-normal leading-150 text-space"
          >
            Источник:
          </span>
          <span v-if="candidate.source" class="text-sm font-medium text-space">
            {{ candidate.source }}
          </span>
          <span v-else class="text-sm font-medium text-space">Не указан</span>
        </div>
        <div class="flex items-center leading-[1.5]">
          <span
            class="mr-[45px] min-w-[70px] text-sm font-normal leading-150 text-space"
          >
            Теги:
          </span>
          <div class="flex items-center">
            <span
              v-for="(tag, index) in candidate?.tags as TagCandidate[]"
              :key="index"
              class="mr-2 text-sm font-medium text-dodger"
            >
              #{{ tag.name }}
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
                class="h-5 rounded border border-gray-300 px-2 text-sm focus:border-dodger focus:outline-none"
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
    <div class="h-[200px] w-[200px]">
      <img
        :src="candidate.imagePath || '/img/default-avatar.png'"
        alt="Фото кандидата"
        class="h-full w-full rounded-fifteen bg-catskill object-contain"
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
}
</style>
