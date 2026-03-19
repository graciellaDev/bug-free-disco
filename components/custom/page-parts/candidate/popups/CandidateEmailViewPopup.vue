<script setup lang="ts">
  import { computed } from 'vue';
  import Popup from '~/components/custom/Popup.vue';
  import UiButton from '@/components/ui/button/Button.vue';
  import type { CandidateEvent } from '@/types/candidates';

  const props = defineProps<{
    isOpen: boolean;
    /** Событие письма из ленты (type === 'email') */
    emailEvent: CandidateEvent | null;
    /** Имя кандидата для заголовка (например "Полина Федорова") */
    candidateName?: string;
    /** Email кандидата */
    candidateEmail?: string;
  }>();

  const emit = defineEmits<{
    close: [];
    reply: [];
  }>();

  const isIncoming = computed(() => props.emailEvent?.direction === 'incoming');

  const payload = computed(() => props.emailEvent?.payload ?? {});

  function formatDateTime(occurredAt: string | undefined): string {
    if (!occurredAt) return '—';
    const d = new Date(occurredAt);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const h = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    return `${day}.${month}.${year} ${h}:${min}`;
  }

  const fromLabel = computed(() => {
    if (isIncoming.value) return (payload.value as { from_email?: string }).from_email || props.emailEvent?.author_name || '—';
    return props.emailEvent?.author_name || 'Работодатель';
  });

  const toLabel = computed(() => {
    const to = (payload.value as { to_email?: string }).to_email;
    return to || '—';
  });

  const subject = computed(() => (payload.value as { subject?: string }).subject ?? '—');

  const bodyHtml = computed(() => (payload.value as { body_html?: string }).body_html);

  const bodyPreview = computed(() => (payload.value as { body_preview?: string }).body_preview);

  const hasBody = computed(() => !!(bodyHtml.value?.trim() || bodyPreview.value?.trim()));

  const titleText = computed(() => (isIncoming.value ? 'Входящее письмо' : 'Исходящее письмо'));

  /** Для шапки: "кому" — имя кандидата для исходящего, иначе email получателя */
  const toDisplay = computed(() => {
    if (!isIncoming.value && props.candidateName) return props.candidateName;
    return toLabel.value;
  });

  const headerLine = computed(() => `${titleText.value} — от: ${fromLabel.value} · кому: ${toDisplay.value}`);

  function close() {
    emit('close');
  }

  function onReply() {
    emit('reply');
  }
</script>

<template>
  <Popup
    :isOpen="isOpen"
    @close="close"
    width="790px"
    :showCloseButton="false"
    :contentPadding="false"
    :contentRounded="true"
    :noOuterPadding="true"
  >
    <div class="email-view-popup-content rounded-fifteen bg-white p-[25px]">
      <h2 class="email-view-title mb-4 text-sm font-normal leading-150 text-[#2f353d]">
        {{ headerLine }}
      </h2>

      <!-- Тема и дата -->
      <div class="email-view-header mb-4 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5 text-[#2f353d]">
        <span class="text-base leading-150"><span class="text-[#8a94a6]">Тема:</span> {{ subject }}</span>
        <span class="text-xs text-[#8a94a6] shrink-0">{{ formatDateTime(emailEvent?.occurred_at) }}</span>
      </div>

      <!-- Текст письма без заголовка -->
      <div v-if="hasBody" class="mb-6 w-full">
        <div
          v-if="bodyHtml"
          class="email-view-body w-full max-w-full prose max-h-[400px] overflow-y-auto rounded-ten border border-[#edeff5] bg-[#F5F6F8] p-4 text-sm leading-150 text-[#2f353d]"
          v-html="bodyHtml"
        />
        <p
          v-else
          class="w-full rounded-ten border border-[#edeff5] bg-[#F5F6F8] p-4 text-sm font-normal leading-150 text-[#2f353d] whitespace-pre-wrap"
        >
          {{ bodyPreview }}
        </p>
      </div>
      <div v-else class="mb-6 text-sm text-[#8a94a6]">
        <p class="text-sm font-normal leading-150 text-[#8a94a6]">Текст письма отсутствует.</p>
      </div>

      <!-- Кнопки -->
      <div class="flex flex-wrap items-center gap-3">
        <UiButton
          v-if="isIncoming"
          variant="action"
          size="semiaction"
          @click="onReply"
        >
          Ответить
        </UiButton>
        <UiButton variant="back" size="second-back" @click="close">
          Закрыть
        </UiButton>
      </div>
    </div>
  </Popup>
</template>

<style scoped>
  .email-view-title {
    font-family: Inter, sans-serif;
    font-weight: 600;
    font-size: 20px;
    line-height: 130%;
    letter-spacing: 0;
    color: #2f353d;
  }
  .email-view-subtitle {
    font-size: 14px;
    font-weight: 400;
    color: #8a94a6;
  }
  .email-view-popup-content {
    font-family: Inter, sans-serif;
    color: #2f353d;
  }
  /* Ограничиваем стили HTML-контента письма */
  .email-view-body :deep(p) {
    margin-bottom: 0.5em;
  }
  .email-view-body :deep(p:last-child) {
    margin-bottom: 0;
  }
  .email-view-body :deep(a) {
    color: #2563eb;
    text-decoration: underline;
  }
  .email-view-body :deep(ul),
  .email-view-body :deep(ol) {
    margin: 0.5em 0;
    padding-left: 1.5em;
  }
</style>
