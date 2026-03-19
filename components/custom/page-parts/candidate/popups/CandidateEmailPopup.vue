<script setup lang="ts">
  import { ref, watch, computed, unref, nextTick, onBeforeUnmount, type MaybeRef } from 'vue';
  import Popup from '~/components/custom/Popup.vue';
  import MyInput from '~/components/custom/MyInput.vue';
  import MyDropdown from '~/components/custom/MyDropdown.vue';
  import TiptapEditor from '@/components/TiptapEditor.vue';
  import { getConnectedEmailsForSender } from '~/utils/gmailAccount';
  import { getEmailTemplates } from '@/src/api/emailTemplates';
  import { apiGet } from '@/src/api/client';
  import type { Candidate } from '@/types/candidates';

  const props = withDefaults(
    defineProps<{
      isOpen: MaybeRef<boolean>;
      candidate?: Candidate | null;
    }>(),
    { candidate: null }
  );

  const emit = defineEmits<{
    close: [];
    submit: [data: Record<string, any>];
  }>();

  const toDisplay = computed(() => {
    const c = props.candidate;
    if (!c) return { name: '', email: '' };
    const name = [c.firstname, c.surname].filter(Boolean).join(' ') || '—';
    return { name, email: c.email || '' };
  });

  const subject = ref('');
  const body = ref('<p></p>');
  const connectedEmails = ref<Array<{ id: number; email: string | null }>>([]);
  const selectedFrom = ref<string | null>(null);
  const templateDropdownOpen = ref(false);
  const templateOptions = ref<Array<{ id: number; name: string; subject: string; body: string }>>([]);
  const templateDropdownRef = ref<HTMLElement | null>(null);
  const profileName = ref('');
  const profilePhone = ref('');

  const senderOptions = computed(() =>
    connectedEmails.value
      .filter((e) => e.email)
      .map((item) => ({ name: item.email!, value: item.email! }))
  );

  const defaultFrom = computed(() => {
    const first = connectedEmails.value.find((e) => e.email);
    return first?.email || '';
  });

  function loadConnectedEmails() {
    getConnectedEmailsForSender().then(({ data }) => {
      connectedEmails.value = (data || []).map((item) => ({
        id: item.id,
        email: item.email || null,
      }));
      if (selectedFrom.value === null && connectedEmails.value.length) {
        const first = connectedEmails.value.find((e) => e.email);
        if (first?.email) selectedFrom.value = first.email;
      }
    });
  }

  function loadEmailTemplates() {
    getEmailTemplates()
      .then((list) => {
        templateOptions.value = (list || []).map((t) => ({
          id: t.id,
          name: t.name,
          subject: t.subject,
          body: t.body || '<p></p>',
        }));
      })
      .catch(() => {
        templateOptions.value = [];
      });
  }

  function loadProfile() {
    apiGet<{ name?: string; phone?: string }>('/profile')
      .then((res) => {
        const d = res?.data;
        profileName.value = d?.name ?? 'Работодатель';
        profilePhone.value = d?.phone ?? '';
      })
      .catch(() => {
        profileName.value = 'Работодатель';
        profilePhone.value = '';
      });
  }

  function substituteVariables(text: string): string {
    const contactName = toDisplay.value.name?.trim() || toDisplay.value.email || 'Кандидат';
    return text
      .replace(/\{\{contact\.name\}\}/g, contactName)
      .replace(/\{\{profile\.name\}\}/g, profileName.value)
      .replace(/\{\{profile\.phone\}\}/g, profilePhone.value);
  }

  watch(
    () => unref(props.isOpen),
    (open) => {
      if (open) {
        subject.value = '';
        body.value = '<p></p>';
        selectedFrom.value = null;
        templateDropdownOpen.value = false;
        loadConnectedEmails();
        loadEmailTemplates();
        loadProfile();
      }
    }
  );

  function onTemplateSelect(t: { name: string; subject: string; body: string }) {
    subject.value = substituteVariables(t.subject);
    const rawBody = t.body?.trim() ? t.body : '<p></p>';
    body.value = substituteVariables(rawBody);
    templateDropdownOpen.value = false;
  }

  function onDocumentClick(e: MouseEvent) {
    if (templateDropdownOpen.value && templateDropdownRef.value && !templateDropdownRef.value.contains(e.target as Node)) {
      templateDropdownOpen.value = false;
    }
  }

  watch(templateDropdownOpen, (open) => {
    if (open) {
      nextTick(() => document.addEventListener('click', onDocumentClick));
    } else {
      document.removeEventListener('click', onDocumentClick);
    }
  });

  onBeforeUnmount(() => document.removeEventListener('click', onDocumentClick));

  const submit = () => {
    emit('submit', {
      to: toDisplay.value.email,
      toName: toDisplay.value.name,
      subject: subject.value,
      from: selectedFrom.value ?? defaultFrom.value,
      body,
    });
  };

  const close = () => emit('close');
</script>

<template>
  <Popup
    :isOpen="unref(isOpen)"
    @close="close"
    width="790px"
    :showCloseButton="false"
    :contentPadding="false"
    :contentRounded="true"
    :noOuterPadding="true"
  >
    <div class="email-popup-content rounded-fifteen bg-white p-[25px]">
      <h2 class="email-popup-title mb-6">
        Email для: {{ toDisplay.name }}
        <span class="email-popup-to-email">({{ toDisplay.email || '—' }})</span>
      </h2>

      <!-- Тема письма -->
      <div class="mb-6">
        <div class="mb-3.5 flex items-center justify-between gap-4">
          <label class="text-sm font-medium text-space">Тема письма</label>
          <div ref="templateDropdownRef" class="relative shrink-0">
            <button
              type="button"
              class="text-sm font-medium text-dodger hover:no-underline"
              @click="templateDropdownOpen = !templateDropdownOpen"
            >
              Использовать шаблон
            </button>
            <div
              v-if="templateDropdownOpen"
              class="absolute right-0 top-full z-50 mt-1 min-w-[220px] rounded-ten border border-athens bg-white py-1 shadow-lg"
              @click.stop
            >
              <button
                v-for="t in templateOptions"
                :key="t.id"
                type="button"
                class="w-full px-4 py-2.5 text-left text-sm text-space hover:bg-zumthor"
                @click="onTemplateSelect(t)"
              >
                {{ t.name }}
              </button>
            </div>
          </div>
        </div>
        <MyInput
          v-model="subject"
          type="text"
          placeholder="Например: Приглашаем на вакансию"
          class="w-full"
        />
      </div>

      <!-- Отправитель -->
      <div class="sender-block mb-6">
        <p class="text-sm font-medium text-space mb-3.5">Отправитель</p>
        <MyDropdown
          :options="senderOptions"
          v-model="selectedFrom"
          :initial-value="defaultFrom"
          placeholder="Выберите отправителя"
        />
      </div>

      <!-- Содержание письма -->
      <div class="mb-6">
        <label class="mb-3.5 block text-sm font-medium text-space">Содержание письма</label>
        <div class="email-editor-wrap relative overflow-hidden rounded-ten bg-athens-gray">
          <TiptapEditor v-model="body" />
        </div>
      </div>

      <!-- Кнопки -->
      <div class="flex flex-wrap items-center gap-3">
        <UiButton variant="action" size="semiaction" @click="submit">
          Отправить
        </UiButton>
        <UiButton variant="back" size="second-back" @click="close">
          Отменить
        </UiButton>
      </div>
    </div>
  </Popup>
</template>

<style scoped>
  /* Head/SB 20: Inter, Semi Bold 600, 20px, line-height 130%, letter-spacing 0% */
  .email-popup-title {
    font-family: Inter, sans-serif;
    font-weight: 600;
    font-size: 20px;
    line-height: 130%;
    letter-spacing: 0;
    color: #2f353d;
  }
  .email-popup-to-email {
    font-size: 14px;
    font-weight: 400;
    color: #8a94a6;
  }
  /* Main/Text #2F353D для основного текста окна */
  .email-popup-content {
    font-family: Inter, sans-serif;
    color: #2f353d;
  }
  /* Обводка 1px как у полей выше: только внутренние границы, без двойной рамки */
  .email-editor-wrap :deep(.buttons) {
    border-radius: 10px 10px 0 0;
    background-color: #f4f6f8;
    border: 1px solid #edeff5;
    border-bottom: none;
  }
  .email-editor-wrap :deep(.min-h-\[460px\]) {
    min-height: 220px;
    border-radius: 0 0 10px 10px;
    border: 1px solid #edeff5;
  }
  .email-editor-wrap :deep(.max-h-\[460px\]) {
    max-height: 320px;
  }
  .email-editor-wrap :deep(.rounded-b-fifteen) {
    border-radius: 0 0 10px 10px;
  }
  .email-editor-wrap :deep(.border-athens) {
    border-color: #edeff5;
  }
  /* Плейсхолдер как у поля «Тема письма» (MyInput): #9098b4, 14px, 400 */
  .email-editor-wrap :deep(.ProseMirror p.is-editor-empty:first-child::before) {
    color: #9098b4;
    font-size: 14px;
    font-weight: 400;
    font-family: Inter, sans-serif;
  }
  /* Зазор между полем «Отправитель» и выпадающим списком — нижняя обводка не перекрывается */
  .sender-block :deep(.options-wrapper) {
    margin-top: 2px;
  }
</style>
