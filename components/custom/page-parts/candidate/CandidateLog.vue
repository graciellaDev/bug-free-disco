<script setup lang="ts">
  import { ref, computed, watch, nextTick } from 'vue';
  import { getCandidateEvents } from '@/src/api/candidates';
  import type { CandidateEvent } from '@/types/candidates';
  import UiTooltipProvider from '@/components/ui/tooltip/TooltipProvider.vue';
  import UiTooltip from '@/components/ui/tooltip/Tooltip.vue';
  import UiTooltipTrigger from '@/components/ui/tooltip/TooltipTrigger.vue';
  import UiTooltipContent from '@/components/ui/tooltip/TooltipContent.vue';
  import TextWithLinks from '~/components/custom/TextWithLinks.vue';

  const logScrollRef = ref<HTMLDivElement | null>(null);

  const emit = defineEmits<{
    'delete-request': [eventId: number];
    'edit-comment': [eventId: number, content: string];
    'delete-task-request': [eventId: number];
    'edit-task': [eventId: number, content: string];
    'complete-task': [eventId: number];
    'open-email': [];
    /** Клик по карточке письма (для будущего попапа с полным текстом) */
    'open-email-card': [event: CandidateEvent];
  }>();

  const props = defineProps<{
    candidateId: number | undefined;
    /** При изменении значения лог перезапрашивается (например после перемещения кандидата) */
    refreshTrigger?: number;
    /** ID вакансии — события запрашиваются в контексте вакансии (смена этапа и т.д.) */
    vacancyId?: number | null;
  }>();

  const events = ref<CandidateEvent[]>([]);
  const loading = ref(false);
  /** Сверху вниз: сначала старые, внизу новые. Без дублей по id (чтобы не было двух «Удалить» у одной задачи). */
  const eventsOldestFirst = computed(() => {
    const seen = new Set<number>();
    return [...events.value]
      .filter((e) => {
        if (seen.has(e.id)) return false;
        seen.add(e.id);
        return true;
      })
      .reverse();
  });

  function formatTimestamp(occurredAt: string): string {
    const d = new Date(occurredAt);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const h = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    const sec = String(d.getSeconds()).padStart(2, '0');
    return `${day}.${month}.${year} ${h}:${min}:${sec}`;
  }

  /** Для карточки комментария: дата и время без секунд (HH:MM). */
  function formatTimestampComment(occurredAt: string): string {
    const d = new Date(occurredAt);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const h = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    return `${day}.${month}.${year} ${h}:${min}`;
  }

  /** Формат даты/времени прочтения для статуса */
  function formatReadAt(readAt: string | undefined): string {
    if (!readAt) return '';
    const d = new Date(readAt);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const h = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    return `${day}.${month}.${year} ${h}:${min}`;
  }

  function emailStatusText(status: string | undefined, readAt: string | undefined): string {
    switch (status) {
      case 'sent':
        return 'Отправлено';
      case 'delivered':
        return 'Доставлено';
      case 'read':
        return readAt ? `Прочитано ${formatReadAt(readAt)}` : 'Прочитано';
      case 'received':
        return 'Получено';
      case 'failed':
        return 'Ошибка';
      case 'pending':
      default:
        return 'Отправка…';
    }
  }

  /** Статус письма — тот же стиль, что и у метаданных (верхняя часть карточки) */
  function emailStatusClass(): string {
    return 'text-[#92989B] font-light';
  }

  /** Состояние задачи: выполненная, просроченная (дата/время прошли) или поставленная */
  function taskIconState(event: CandidateEvent): 'completed' | 'overdue' | 'assigned' {
    if (event.payload?.completed_at) return 'completed';
    const scheduledAt = event.payload?.scheduled_at;
    if (scheduledAt && new Date(scheduledAt) < new Date()) return 'overdue';
    return 'assigned';
  }

  const NEWLINE_PLACEHOLDER = '\u200B'; // zero-width space, сохраняется в textContent

  /** Декодировать HTML-сущности в превью письма и сохранить переносы строк (как в открытом письме). */
  function decodeEmailPreview(raw: string | undefined): string {
    if (!raw || typeof raw !== 'string') return '';
    // Перед извлечением текста заменяем теги переноса на плейсхолдер, чтобы не потерять разрывы строк
    const withPlaceholders = raw
      .replace(/<br\s*\/?>/gi, NEWLINE_PLACEHOLDER)
      .replace(/<\/p>\s*/gi, NEWLINE_PLACEHOLDER)
      .replace(/<\/div>\s*/gi, NEWLINE_PLACEHOLDER)
      .replace(/<\/tr>\s*/gi, NEWLINE_PLACEHOLDER);
    const div = typeof document !== 'undefined' ? document.createElement('div') : null;
    if (div) {
      div.innerHTML = withPlaceholders;
      const text = (div.textContent ?? div.innerText ?? withPlaceholders).trim();
      return text
        .split(NEWLINE_PLACEHOLDER)
        .map(s => s.trim())
        .join('\n')
        .replace(/\n{3,}/g, '\n\n');
    }
    // SSR: убираем теги, плейсхолдеры уже стоят
    const noTags = withPlaceholders.replace(/<[^>]+>/g, '');
    const decoded = noTags
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'");
    return decoded
      .split(NEWLINE_PLACEHOLDER)
      .map(s => s.trim())
      .join('\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }

  function eventDescription(event: CandidateEvent): string {
    if (event.type === 'comment') return '';
    if (event.type === 'task') return '';
    if (event.type === 'email') return '';
    const payloadContent = event.payload?.content;
    if (typeof payloadContent === 'string' && payloadContent.trim() !== '') {
      return payloadContent.trim();
    }
    const author = event.author_name ? `${event.author_name} ` : '';
    switch (event.type) {
      case 'system':
        return author + 'Системное событие';
      case 'chat':
        return author + 'Сообщение в чат';
      default:
        return author + 'Событие';
    }
  }

  let eventsAbort: AbortController | null = null;

  async function loadEvents() {
    if (!props.candidateId) return;
    eventsAbort?.abort();
    const ac = new AbortController();
    eventsAbort = ac;
    const { signal } = ac;
    loading.value = true;
    try {
      events.value = await getCandidateEvents(
        props.candidateId,
        props.vacancyId,
        { signal }
      );
    } catch (e: unknown) {
      if (signal.aborted) return;
      console.error('Ошибка загрузки лога кандидата:', e);
      events.value = [];
    } finally {
      if (eventsAbort === ac) {
        loading.value = false;
      }
    }
  }

  watch(
    () => props.candidateId,
    (id) => {
      if (id) loadEvents();
      else events.value = [];
    },
    { immediate: true }
  );

  watch(
    () => props.refreshTrigger,
    () => {
      if (props.candidateId) loadEvents();
    }
  );

  watch(
    () => props.vacancyId,
    () => {
      if (props.candidateId) loadEvents();
    }
  );

  function scrollLogToBottom() {
    nextTick(() => {
      const el = logScrollRef.value;
      if (el) el.scrollTop = el.scrollHeight;
    });
  }

  watch(eventsOldestFirst, () => scrollLogToBottom(), { flush: 'post' });
</script>

<template>
  <div ref="logScrollRef" class="h-full overflow-y-auto bg-athens-gray px-15px py-5">
    <UiTooltipProvider :delay-duration="0">
    <template v-if="eventsOldestFirst.length">
      <div class="flex flex-col space-y-3">
        <div
          v-for="event in eventsOldestFirst"
          :key="event.id"
          :class="
            event.type === 'comment' || event.type === 'task' || event.type === 'email'
              ? ''
              : 'flex flex-wrap items-baseline gap-x-2 py-1.5 text-xs font-light leading-150 text-[#8a94a6]'
          "
        >
        <!-- Карточка письма -->
        <div
          v-if="event.type === 'email'"
          class="group relative flex w-full cursor-pointer items-stretch overflow-hidden rounded-lg bg-[#FBFCFD]"
          @click="emit('open-email-card', event)"
        >
          <div class="flex min-w-0 flex-1 gap-3 rounded-l-lg p-3">
            <div
              class="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#E3F2FD] p-1.5"
              aria-hidden="true"
            >
              <img
                v-if="event.direction === 'incoming'"
                src="/icons/246.svg"
                alt=""
                class="email-card-icon email-card-icon-incoming h-6 w-6 object-contain"
              />
              <img
                v-else
                src="/icons/694.svg"
                alt=""
                class="email-card-icon h-6 w-6 object-contain"
              />
            </div>
            <div class="min-w-0 flex-1">
              <div class="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-0.5">
                <span class="min-w-0 text-xs font-light leading-150 text-[#92989B]">
                  {{ formatTimestampComment(event.occurred_at) }}
                  <template v-if="event.direction === 'incoming'">
                    входящее письмо от {{ event.payload?.from_email || event.author_name || '—' }}
                    <template v-if="event.payload?.to_email"> для {{ event.payload.to_email }}</template>
                  </template>
                  <template v-else>
                    исходящее письмо от {{ event.author_name || 'Работодатель' }}
                    <template v-if="event.payload?.to_email"> для {{ event.payload.to_email }}</template>
                  </template>
                </span>
                <UiTooltip v-if="event.direction !== 'incoming' && event.payload?.status === 'failed' && event.payload?.error_message">
                  <UiTooltipTrigger as-child>
                    <span
                      class="min-w-0 shrink-0 cursor-help text-right text-xs leading-150"
                      :class="emailStatusClass()"
                    >
                      {{ emailStatusText(event.payload?.status, event.payload?.read_at) }}
                    </span>
                  </UiTooltipTrigger>
                  <UiTooltipContent>
                    {{ event.payload?.error_message }}
                  </UiTooltipContent>
                </UiTooltip>
                <span
                  v-else-if="event.direction !== 'incoming'"
                  class="min-w-0 shrink-0 text-right text-xs leading-150"
                  :class="emailStatusClass()"
                >
                  {{ emailStatusText(event.payload?.status, event.payload?.read_at) }}
                </span>
              </div>
              <p
                v-if="event.payload?.subject"
                class="mt-2 text-sm font-normal leading-150 text-[#363B44] underline"
              >
                {{ event.payload.subject }}
              </p>
              <p
                v-if="event.payload?.body_preview"
                class="mt-1 text-sm font-normal leading-150 text-[#363B44] break-words whitespace-pre-wrap"
              >
                <TextWithLinks :text="decodeEmailPreview(event.payload.body_preview)" />
              </p>
            </div>
          </div>
        </div>
        <!-- Карточка задачи -->
        <div
          v-if="event.type === 'task'"
          class="group relative flex w-full items-stretch overflow-hidden rounded-lg bg-[#FBFCFD]"
        >
          <div class="flex min-w-0 flex-1 items-start gap-3 rounded-l-lg p-3">
            <!-- Одна иконка календаря для всех статусов задачи, цвет по статусу -->
            <div
              class="task-icon-wrap flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full p-1.5"
              :class="{
                'bg-[#E8F5E9]': taskIconState(event) === 'completed',
                'bg-[#E3F2FD]': taskIconState(event) === 'assigned',
                'bg-[#FCE4EC]': taskIconState(event) === 'overdue',
              }"
            >
              <img
                src="/icons/639.svg"
                alt=""
                class="task-icon h-6 w-6 object-contain"
                :class="{
                  'task-icon-completed': taskIconState(event) === 'completed',
                  'task-icon-assigned': taskIconState(event) === 'assigned',
                  'task-icon-overdue': taskIconState(event) === 'overdue',
                }"
              >
            </div>
            <div class="min-w-0 flex-1">
              <div class="text-xs font-light leading-150 text-[#92989B]">
                <span :class="taskIconState(event) === 'overdue' ? 'text-red-600' : ''">
                  {{ formatTimestampComment(event.occurred_at) }}
                </span>
                для пользователя
                {{ event.payload?.assignee_name ?? event.author_name ?? '—' }}
              </div>
              <p
                v-if="event.payload?.content"
                class="mt-2 text-sm font-normal leading-150 text-[#363B44] whitespace-pre-wrap"
                :class="{ 'line-through text-[#8a94a6]': event.payload?.completed_at }"
              >
                <TextWithLinks :text="event.payload.content" />
              </p>
              <button
                v-if="!event.payload?.completed_at"
                type="button"
                class="mt-2 text-xs font-normal text-dodger hover:underline"
                @click="emit('complete-task', event.id)"
              >
                Выполнить
              </button>
            </div>
          </div>
          <!-- Панель действий: выезжает справа при наведении -->
          <div
            class="absolute right-0 top-0 flex h-full rounded-r-lg translate-x-full transition-transform duration-200 ease-out group-hover:translate-x-0"
          >
            <div class="w-3 shrink-0 rounded-l-lg bg-[#FBFCFD]" aria-hidden="true" />
            <div class="w-px shrink-0 bg-[#f4f6f8]" aria-hidden="true" />
            <div class="flex shrink-0 items-center gap-1.5 bg-[#FBFCFD] px-2 py-1.5">
              <button
                type="button"
                class="group/btn flex items-center gap-0.5 rounded text-xs font-normal leading-150 text-[#92989B] transition-colors hover:text-dodger"
                title="Удалить"
                @click="emit('delete-task-request', event.id)"
              >
                <span class="flex h-6 w-6 items-center justify-center text-red-500 transition-colors group-hover/btn:text-red-600">
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h14Z" />
                    <line x1="10" y1="11" x2="10" y2="17" />
                    <line x1="14" y1="11" x2="14" y2="17" />
                  </svg>
                </span>
                <span class="text-xs font-normal leading-150 text-[#92989B] transition-colors group-hover/btn:text-dodger">Удалить</span>
              </button>
              <button
                type="button"
                class="group/btn flex items-center gap-0.5 rounded text-xs font-normal leading-150 text-[#92989B] transition-colors hover:text-dodger"
                title="Изменить"
                @click="emit('edit-task', event.id, event.payload?.content ?? '')"
              >
                <span class="flex h-6 w-6 items-center justify-center text-dodger transition-colors group-hover/btn:text-dodger">
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                  </svg>
                </span>
                <span class="text-xs font-normal leading-150 text-[#92989B] transition-colors group-hover/btn:text-dodger">Изменить</span>
              </button>
            </div>
          </div>
        </div>
        <!-- Карточка комментария (заметки): синяя иконка на голубом фоне, как у почты -->
        <div
          v-else-if="event.type === 'comment'"
          class="group relative flex w-full items-stretch overflow-hidden rounded-lg bg-[#FBFCFD]"
        >
          <div class="flex min-w-0 flex-1 gap-3 rounded-l-lg p-3">
            <div
              class="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#E3F2FD] p-1.5"
            >
              <img
                src="/icons/675.svg"
                alt=""
                class="comment-card-icon h-6 w-6 object-contain"
              />
            </div>
            <div class="min-w-0 flex-1">
              <div
                class="text-xs font-light leading-150 text-[#92989B]"
              >
                {{ formatTimestampComment(event.occurred_at) }}
                <span v-if="event.author_name">{{ event.author_name }}</span>
                оставил комментарий
              </div>
              <p
                v-if="event.payload?.content"
                class="mt-2 text-sm font-normal leading-150 text-[#363B44] whitespace-pre-wrap"
              >
                <TextWithLinks :text="event.payload.content" />
              </p>
            </div>
          </div>
          <!-- Панель действий: выезжает справа при наведении -->
          <div
            class="absolute right-0 top-0 flex h-full rounded-r-lg translate-x-full transition-transform duration-200 ease-out group-hover:translate-x-0"
          >
            <div class="w-3 shrink-0 rounded-l-lg bg-[#FBFCFD]" aria-hidden="true" />
            <div class="w-px shrink-0 bg-[#f4f6f8]" aria-hidden="true" />
            <div class="flex shrink-0 items-center gap-1.5 bg-[#FBFCFD] px-2 py-1.5">
              <button
                type="button"
                class="group/btn flex items-center gap-0.5 rounded text-xs font-normal leading-150 text-[#92989B] transition-colors hover:text-dodger"
                title="Удалить"
                @click="emit('delete-request', event.id)"
              >
                <span class="flex h-6 w-6 items-center justify-center text-red-500 transition-colors group-hover/btn:text-red-600">
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h14Z" />
                    <line x1="10" y1="11" x2="10" y2="17" />
                    <line x1="14" y1="11" x2="14" y2="17" />
                  </svg>
                </span>
                <span class="text-xs font-normal leading-150 text-[#92989B] transition-colors group-hover/btn:text-dodger">Удалить</span>
              </button>
              <button
                type="button"
                class="group/btn flex items-center gap-0.5 rounded text-xs font-normal leading-150 text-[#92989B] transition-colors hover:text-dodger"
                title="Изменить"
                @click="emit('edit-comment', event.id, event.payload?.content ?? '')"
              >
                <span class="flex h-6 w-6 items-center justify-center text-dodger transition-colors group-hover/btn:text-dodger">
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                  </svg>
                </span>
                <span class="text-xs font-normal leading-150 text-[#92989B] transition-colors group-hover/btn:text-dodger">Изменить</span>
              </button>
            </div>
          </div>
        </div>
        <!-- Обычная строка лога (система, чат и т.д.) -->
        <template v-else-if="event.type !== 'comment' && event.type !== 'task' && event.type !== 'email'">
          <span class="shrink-0 text-xs font-light leading-150 text-[#8a94a6]">{{ formatTimestamp(event.occurred_at) }}</span>
          <span class="text-xs font-light leading-150 text-[#8a94a6]">{{ eventDescription(event) }}</span>
        </template>
        </div>
      </div>
    </template>
    </UiTooltipProvider>
  </div>
</template>

<style scoped>
.email-card-icon {
  filter: brightness(0) saturate(100%) invert(35%) sepia(90%) saturate(1500%) hue-rotate(195deg);
}
.email-card-icon-incoming {
  transform: scale(0.85);
}
/* Комментарий: синяя иконка на голубом фоне, как у почты */
.comment-card-icon {
  filter: brightness(0) saturate(100%) invert(35%) sepia(90%) saturate(1500%) hue-rotate(195deg);
}
.task-icon-completed {
  filter: brightness(0) saturate(100%) invert(42%) sepia(93%) saturate(1200%) hue-rotate(95deg);
}
.task-icon-assigned {
  filter: brightness(0) saturate(100%) invert(35%) sepia(90%) saturate(1500%) hue-rotate(195deg);
}
.task-icon-overdue {
  filter: brightness(0) saturate(100%) invert(25%) sepia(95%) saturate(5000%) hue-rotate(350deg);
}
</style>
