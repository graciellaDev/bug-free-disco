<script setup lang="ts">
  import { ref, computed, watch, nextTick } from 'vue';
  import { getCandidateEvents } from '@/src/api/candidates';
  import type { CandidateEvent } from '@/types/candidates';

  const logScrollRef = ref<HTMLDivElement | null>(null);

  const emit = defineEmits<{
    'delete-request': [eventId: number];
    'edit-comment': [eventId: number, content: string];
    'delete-task-request': [eventId: number];
    'edit-task': [eventId: number, content: string];
    'complete-task': [eventId: number];
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
  /** Сверху вниз: сначала старые, внизу новые */
  const eventsOldestFirst = computed(() => [...events.value].reverse());

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

  function eventDescription(event: CandidateEvent): string {
    if (event.type === 'comment') return ''; // комментарии рендерятся отдельной карточкой
    if (event.type === 'task') return ''; // задачи рендерятся отдельной карточкой
    if (event.payload?.content) return event.payload.content;
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

  async function loadEvents() {
    if (!props.candidateId) return;
    loading.value = true;
    try {
      events.value = await getCandidateEvents(
        props.candidateId,
        props.vacancyId
      );
    } catch (e) {
      console.error('Ошибка загрузки лога кандидата:', e);
      events.value = [];
    } finally {
      loading.value = false;
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
    <template v-if="eventsOldestFirst.length">
      <div class="flex flex-col space-y-3">
        <div
          v-for="event in eventsOldestFirst"
          :key="event.id"
          :class="
            event.type === 'comment' || event.type === 'task'
              ? ''
              : 'flex flex-wrap items-baseline gap-x-2 py-1.5 text-xs font-normal leading-150 text-[#8a94a6]'
          "
        >
        <!-- Карточка задачи -->
        <div
          v-if="event.type === 'task'"
          class="group relative flex w-full items-stretch overflow-hidden rounded-lg bg-[#FBFCFD]"
        >
          <div class="flex min-w-0 flex-1 items-start gap-3 rounded-l-lg p-3">
            <!-- Иконка: календарь или зелёная галочка при выполнении -->
            <div
              class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
              :class="event.payload?.completed_at ? 'bg-[#E8F5E9]' : 'bg-[#E3F2FD]'"
            >
              <svg
                v-if="event.payload?.completed_at"
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                class="text-[#2E7D32]"
              >
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
              <svg
                v-else
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                class="text-[#2196F3]"
              >
                <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
                <line x1="16" x2="16" y1="2" y2="6" />
                <line x1="8" x2="8" y1="2" y2="6" />
                <line x1="3" x2="21" y1="10" y2="10" />
              </svg>
            </div>
            <div class="min-w-0 flex-1">
              <div class="text-xs font-normal leading-150 text-[#8a94a6]">
                {{ formatTimestampComment(event.occurred_at) }}
                для пользователя
                {{ event.payload?.assignee_name ?? event.author_name ?? '—' }}
              </div>
              <p
                v-if="event.payload?.content"
                class="mt-2 text-sm font-normal leading-150 text-[#1a1a1a] whitespace-pre-wrap"
                :class="{ 'line-through text-[#8a94a6]': event.payload?.completed_at }"
              >
                {{ event.payload.content }}
              </p>
              <button
                v-if="!event.payload?.completed_at"
                type="button"
                class="mt-2 text-sm font-normal text-dodger hover:underline"
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
                class="group/btn flex items-center gap-1 rounded text-[#5e6c84] transition-colors hover:text-dodger"
                title="Удалить"
                @click="emit('delete-task-request', event.id)"
              >
                <span class="flex h-6 w-6 items-center justify-center rounded-full bg-slate-300/90 text-slate-600 transition-colors group-hover/btn:bg-dodger/15 group-hover/btn:text-dodger">
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h14Z" />
                    <line x1="10" y1="11" x2="10" y2="17" />
                    <line x1="14" y1="11" x2="14" y2="17" />
                  </svg>
                </span>
                <span class="text-xs font-medium">Удалить</span>
              </button>
              <button
                type="button"
                class="group/btn flex items-center gap-1 rounded text-[#5e6c84] transition-colors hover:text-dodger"
                title="Изменить"
                @click="emit('edit-task', event.id, event.payload?.content ?? '')"
              >
                <span class="flex h-6 w-6 items-center justify-center rounded-full bg-slate-300/90 text-slate-600 transition-colors group-hover/btn:bg-dodger/15 group-hover/btn:text-dodger">
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                  </svg>
                </span>
                <span class="text-xs font-medium">Изменить</span>
              </button>
            </div>
          </div>
        </div>
        <!-- Карточка комментария (заметки) -->
        <div
          v-else-if="event.type === 'comment'"
          class="group relative flex w-full items-stretch overflow-hidden rounded-lg bg-[#FBFCFD]"
        >
          <div class="flex min-w-0 flex-1 gap-3 rounded-l-lg p-3">
            <div
              class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#e8eaed]"
            >
              <svg-icon name="document" width="18" height="18" class="text-[#79869A]" />
            </div>
            <div class="min-w-0 flex-1">
              <div
                class="text-xs font-normal leading-150 text-[#8a94a6]"
              >
                {{ formatTimestampComment(event.occurred_at) }}
                <span v-if="event.author_name">{{ event.author_name }}</span>
                оставил комментарий
              </div>
              <p
                v-if="event.payload?.content"
                class="mt-2 text-sm font-normal leading-150 text-[#1a1a1a] whitespace-pre-wrap"
              >
                {{ event.payload.content }}
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
              class="group/btn flex items-center gap-1 rounded text-[#5e6c84] transition-colors hover:text-dodger"
              title="Удалить"
              @click="emit('delete-request', event.id)"
            >
              <span class="flex h-6 w-6 items-center justify-center rounded-full bg-slate-300/90 text-slate-600 transition-colors group-hover/btn:bg-dodger/15 group-hover/btn:text-dodger">
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h14Z" />
                  <line x1="10" y1="11" x2="10" y2="17" />
                  <line x1="14" y1="11" x2="14" y2="17" />
                </svg>
              </span>
              <span class="text-xs font-medium">Удалить</span>
            </button>
            <button
              type="button"
              class="group/btn flex items-center gap-1 rounded text-[#5e6c84] transition-colors hover:text-dodger"
              title="Изменить"
              @click="emit('edit-comment', event.id, event.payload?.content ?? '')"
            >
              <span class="flex h-6 w-6 items-center justify-center rounded-full bg-slate-300/90 text-slate-600 transition-colors group-hover/btn:bg-dodger/15 group-hover/btn:text-dodger">
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                </svg>
              </span>
              <span class="text-xs font-medium">Изменить</span>
            </button>
            </div>
          </div>
        </div>
        <!-- Обычная строка лога (система, чат и т.д.) -->
        <template v-else-if="event.type !== 'comment' && event.type !== 'task'">
          <span class="shrink-0">{{ formatTimestamp(event.occurred_at) }}</span>
          <span>{{ eventDescription(event) }}</span>
        </template>
        </div>
      </div>
    </template>
  </div>
</template>
