import { ref, watch, onBeforeUnmount, type Ref, type ComputedRef } from 'vue';
import { getCandidateMessages } from '@/src/api/candidates';
import type { CandidatePlatformMessage, CandidateChatPlatform } from '@/types/candidates';

const POLL_MS = 30_000;

type CandidateIdRef = Ref<number | undefined> | ComputedRef<number | undefined>;

function getAuthTokenForWs(): string | null {
  try {
    const c = useCookie<string | null>('auth_token');
    if (c.value) return c.value;
  } catch {
    /* not in nuxt context */
  }
  if (import.meta.client) {
    const m = document.cookie.match(/(?:^|; )auth_token=([^;]*)/);
    return m ? decodeURIComponent(m[1]) : null;
  }
  return null;
}

/**
 * Загрузка сообщений чата (hh.ru / SuperJob) + опрос и опционально WebSocket.
 * WS: wsCandidateMessagesUrl (hh), wsSuperjobCandidateMessagesUrl (superjob); плейсхолдер {id}.
 */
export function useCandidatePlatformMessages(
  candidateId: CandidateIdRef,
  enabled: ComputedRef<boolean>,
  platform: ComputedRef<CandidateChatPlatform | null>,
  options?: { refreshTick?: Ref<number | undefined> }
) {
  const messages = ref<CandidatePlatformMessage[]>([]);
  const loading = ref(false);
  let pollTimer: ReturnType<typeof setInterval> | null = null;
  let ws: WebSocket | null = null;
  let messagesAbort: AbortController | null = null;

  const runtimeConfig = useRuntimeConfig();

  async function fetchMessages() {
    if (!candidateId.value || !enabled.value) return;
    const p = platform.value;
    if (!p) return;
    messagesAbort?.abort();
    const ac = new AbortController();
    messagesAbort = ac;
    loading.value = true;
    try {
      const list = await getCandidateMessages(candidateId.value, {
        signal: ac.signal,
        platform: p,
      });
      if (!ac.signal.aborted) {
        messages.value = list;
      }
    } catch (e: unknown) {
      if (ac.signal.aborted) return;
      console.warn('[useCandidatePlatformMessages] загрузка сообщений:', e);
      messages.value = [];
    } finally {
      if (messagesAbort === ac) {
        loading.value = false;
      }
    }
  }

  function stopPoll() {
    if (pollTimer) {
      clearInterval(pollTimer);
      pollTimer = null;
    }
  }

  function stopWs() {
    if (ws) {
      try {
        ws.close();
      } catch {
        /* ignore */
      }
      ws = null;
    }
  }

  function connectWs() {
    stopWs();
    if (!import.meta.client || !candidateId.value || !enabled.value) return;

    const p = platform.value;
    if (!p) return;

    const wsHh = runtimeConfig.public.wsCandidateMessagesUrl as string | undefined;
    const wsSj = runtimeConfig.public.wsSuperjobCandidateMessagesUrl as string | undefined;
    const wsAvito = runtimeConfig.public.wsAvitoCandidateMessagesUrl as string | undefined;
    const wsRabota = runtimeConfig.public.wsRabotaCandidateMessagesUrl as string | undefined;
    const wsMap: Record<string, string | undefined> = {
      hh: wsHh,
      superjob: wsSj,
      avito: wsAvito,
      rabota: wsRabota,
    };
    const wsTemplate = wsMap[p]?.trim() ? wsMap[p] : undefined;
    if (!wsTemplate?.trim()) return;

    const url = wsTemplate.replace(/\{id\}/g, String(candidateId.value));
    const token = getAuthTokenForWs();
    const sep = url.includes('?') ? '&' : '?';
    const fullUrl = token ? `${url}${sep}token=${encodeURIComponent(token)}` : url;

    try {
      ws = new WebSocket(fullUrl);
      ws.onmessage = () => {
        void fetchMessages();
      };
      ws.onerror = () => {
        stopWs();
      };
      ws.onclose = () => {
        ws = null;
      };
    } catch {
      stopWs();
    }
  }

  function startSync() {
    stopPoll();
    stopWs();
    messagesAbort?.abort();
    if (!candidateId.value || !enabled.value) {
      messages.value = [];
      return;
    }
    void fetchMessages();
    pollTimer = setInterval(() => {
      void fetchMessages();
    }, POLL_MS);
    connectWs();
  }

  watch(
    () =>
      [candidateId.value, enabled.value, platform.value, options?.refreshTick?.value] as const,
    () => {
      startSync();
    },
    { immediate: true }
  );

  onBeforeUnmount(() => {
    stopPoll();
    stopWs();
    messagesAbort?.abort();
  });

  return {
    messages,
    loading,
    fetchMessages,
  };
}
