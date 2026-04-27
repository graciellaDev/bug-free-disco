<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import {
  getNotifications,
  type NotificationAction,
  type NotificationApiItem,
  type NotificationCandidate,
  type NotificationsMeta,
} from '~/src/api/notifications'

definePageMeta({
  layout: 'default',
})

useHead({
  title: 'Уведомления',
})

type FilterKey = 'all' | 'important' | 'events' | 'mail'

type UiNotification = {
  id: string
  backendType: string
  channel: string | null
  isImportant: boolean
  /** Как на макете: системные — зелёный круг с молнией. */
  isSystemVisual: boolean
  avatarUrl: string | null
  senderInitials: string
  headline: string
  candidateId: number | null
  vacancyId: number | null
  vacancyName: string | null
  text: string
  createdAt: Date | null
  actions: NotificationAction[]
  primaryAction: NotificationAction | null
}

const loading = ref(false)
const errorText = ref<string | null>(null)
const activeFilter = ref<FilterKey>('all')
const rawItems = ref<NotificationApiItem[]>([])
const meta = ref<NotificationsMeta | null>(null)

const abortController = new AbortController()

function safeString(v: unknown): string {
  return typeof v === 'string' ? v : v == null ? '' : String(v)
}

function numOrNull(v: unknown): number | null {
  if (v === null || v === undefined || v === '') return null
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

function formatCandidateName(c: NotificationCandidate | null | undefined): string {
  if (!c) return ''
  const surname = safeString(c.surname).trim()
  const first = safeString(c.firstname).trim()
  const pat = safeString(c.patronymic).trim()
  const parts = [surname, first, pat].filter(Boolean)
  return parts.join(' ')
}

function parseOccurredAt(n: NotificationApiItem): Date | null {
  const dt = safeString(n.occurred_at).trim()
  if (!dt) return null
  const d = new Date(dt)
  if (!Number.isFinite(d.getTime())) return null
  return d
}

function getInitialsFromName(name: string): string {
  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
  if (parts.length === 0) return ''
  const first = parts[0]?.[0] ?? ''
  const second = (parts[1]?.[0] ?? parts[0]?.[1] ?? '') || ''
  return (first + second).toUpperCase()
}

function avatarUrlFromCandidate(c: NotificationCandidate | null | undefined): string | null {
  if (!c) return null
  const p = safeString(c.imagePath).trim()
  if (!p) return null
  if (p.startsWith('http://') || p.startsWith('https://') || p.startsWith('/')) return p
  return null
}

function rawMatchesFilter(n: NotificationApiItem): boolean {
  const type = safeString(n.type).toLowerCase()
  const channel = safeString(n.channel).toLowerCase()
  const f = activeFilter.value
  if (f === 'all') return true
  if (f === 'important') return Boolean(n.is_important)
  if (f === 'mail') return channel === 'email' || type === 'mail' || type === 'email'
  if (channel === 'email' || type === 'mail' || type === 'email') return false
  return true
}

const filteredRaw = computed(() => rawItems.value.filter((n) => rawMatchesFilter(n)))

function normalizeApiItem(n: NotificationApiItem, idx: number): UiNotification {
  const backendType = safeString(n.type).trim() || 'system'
  const channel = n.channel != null && safeString(n.channel).trim() !== '' ? safeString(n.channel).trim() : null
  const c = n.candidate
  const v = n.vacancy
  const candidateName = formatCandidateName(c)
  const author = safeString(n.author_name).trim()
  const vacancyNameRaw = v?.name != null ? safeString(v.name).trim() : ''
  const payloadTitle = safeString(n.payload?.title).trim()
  const content = safeString(n.payload?.content).trim()

  const headline =
    candidateName ||
    author ||
    payloadTitle ||
    (vacancyNameRaw ? vacancyNameRaw : 'Уведомление')

  const candidateId = numOrNull(n.candidate_id ?? c?.id)
  const vacancyId = numOrNull(n.vacancy_id ?? v?.id)

  const avatarUrl = avatarUrlFromCandidate(c)
  const initials =
    getInitialsFromName(candidateName) ||
    getInitialsFromName(author) ||
    getInitialsFromName(headline) ||
    '•'

  const isSystemVisual = backendType === 'system'

  return {
    id: safeString(n.id ?? idx) || String(idx),
    backendType,
    channel,
    isImportant: Boolean(n.is_important),
    isSystemVisual,
    avatarUrl,
    senderInitials: initials,
    headline,
    candidateId,
    vacancyId,
    vacancyName: vacancyNameRaw || null,
    text: content,
    createdAt: parseOccurredAt(n),
    actions: Array.isArray(n.actions) ? n.actions.filter(Boolean) : [],
    primaryAction: n.primary_action ?? null,
  }
}

const items = computed<UiNotification[]>(() =>
  filteredRaw.value.map((n, idx) => normalizeApiItem(n, idx))
)

function pad2(n: number) {
  return n < 10 ? `0${n}` : String(n)
}

function formatDateRu(dt: Date | null) {
  if (!dt) return ''
  const d = pad2(dt.getDate())
  const m = pad2(dt.getMonth() + 1)
  const y = dt.getFullYear()
  const hh = pad2(dt.getHours())
  const mm = pad2(dt.getMinutes())
  return `${d}/${m}/${y} в ${hh}:${mm}`
}

function actionClass(a: NotificationAction) {
  const v = a.variant || 'link'
  if (v === 'success') return 'text-[#18A957] hover:underline'
  if (v === 'danger') return 'text-[#F25555] hover:underline'
  if (v === 'primary') return 'text-dodger hover:underline'
  return 'text-dodger hover:underline'
}

async function load(page = 1) {
  if (loading.value) return
  loading.value = true
  errorText.value = null
  try {
    const res = await getNotifications({ page }, { signal: abortController.signal })
    const data: unknown = (res as { data?: unknown })?.data

    if (!data) {
      rawItems.value = []
      meta.value = null
      return
    }

    if (Array.isArray(data)) {
      rawItems.value = data as NotificationApiItem[]
      meta.value = null
    } else {
      const d = data as { items?: NotificationApiItem[]; meta?: NotificationsMeta }
      rawItems.value = Array.isArray(d.items) ? d.items : []
      meta.value = d.meta ?? null
    }
  } catch (e: unknown) {
    const err = e as {
      response?: { _data?: { message?: string } }
      data?: { message?: string }
      statusMessage?: string
      message?: string
    }
    errorText.value =
      err?.response?._data?.message ||
      err?.data?.message ||
      err?.statusMessage ||
      err?.message ||
      'Не удалось загрузить уведомления'
    rawItems.value = []
    meta.value = null
  } finally {
    loading.value = false
  }
}

const currentPage = computed(() => meta.value?.current_page ?? 1)
const lastPage = computed(() => meta.value?.last_page ?? 1)
const canPrev = computed(() => currentPage.value > 1)
const canNext = computed(() => currentPage.value < lastPage.value)

onMounted(() => load(1))
onBeforeUnmount(() => abortController.abort())
</script>

<template>
  <div class="container pb-28 pt-6">
    <div class="grid grid-cols-1 gap-15px lg:grid-cols-[320px_1fr]">
      <aside class="h-fit rounded-fifteen bg-white p-25px">
        <p class="mb-15px text-lg font-semibold text-space">
          Фильтры
        </p>
        <div>
          <p class="mb-10px text-sm font-medium text-bali">
            Тип уведомления
          </p>
          <div class="flex flex-wrap gap-10px">
            <button
              type="button"
              class="rounded-ten px-15px py-9px text-sm font-medium transition"
              :class="activeFilter === 'all' ? 'bg-athens-gray text-space' : 'bg-[#F7F8FB] text-bali hover:text-space'"
              @click="activeFilter = 'all'"
            >
              Все
            </button>
            <button
              type="button"
              class="rounded-ten px-15px py-9px text-sm font-medium transition"
              :class="activeFilter === 'important' ? 'bg-athens-gray text-space' : 'bg-[#F7F8FB] text-bali hover:text-space'"
              @click="activeFilter = 'important'"
            >
              Важные
            </button>
            <button
              type="button"
              class="rounded-ten px-15px py-9px text-sm font-medium transition"
              :class="activeFilter === 'events' ? 'bg-athens-gray text-space' : 'bg-[#F7F8FB] text-bali hover:text-space'"
              @click="activeFilter = 'events'"
            >
              События
            </button>
            <button
              type="button"
              class="rounded-ten px-15px py-9px text-sm font-medium transition"
              :class="activeFilter === 'mail' ? 'bg-athens-gray text-space' : 'bg-[#F7F8FB] text-bali hover:text-space'"
              @click="activeFilter = 'mail'"
            >
              Почтовые
            </button>
          </div>
        </div>
      </aside>

      <section class="overflow-hidden rounded-fifteen bg-white">
        <div v-if="errorText" class="p-25px">
          <p class="mb-10px text-sm font-medium text-red-500">
            {{ errorText }}
          </p>
          <UiButton variant="back" size="semiaction" @click="load(1)">
            Повторить
          </UiButton>
        </div>

        <div v-else-if="loading" class="p-25px">
          <p class="text-sm text-bali">
            Загрузка...
          </p>
        </div>

        <div v-else-if="items.length === 0" class="p-25px">
          <div class="flex min-h-[220px] items-center justify-center rounded-ten bg-[#F4F6F8] px-25px">
            <p class="mb-0 text-center text-sm font-medium text-bali">
              <template v-if="rawItems.length">
                Нет уведомлений для выбранного фильтра
              </template>
              <template v-else>
                Пока нет уведомлений
              </template>
            </p>
          </div>
        </div>

        <template v-else>
          <div
            v-for="n in items"
            :key="n.id"
            class="border-b border-athens px-25px py-15px last:border-b-0"
          >
            <div class="flex gap-15px">
              <div class="shrink-0">
                <div
                  v-if="n.isSystemVisual"
                  class="flex h-10 w-10 items-center justify-center rounded-full bg-[#E8F8EE] text-[#22A06B]"
                  aria-hidden="true"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                  </svg>
                </div>
                <template v-else>
                  <img
                    v-if="n.avatarUrl"
                    :src="n.avatarUrl"
                    alt=""
                    class="h-10 w-10 rounded-full object-cover"
                  >
                  <div
                    v-else
                    class="flex h-10 w-10 items-center justify-center rounded-full bg-[#EAF2FF] text-sm font-semibold text-dodger"
                  >
                    {{ n.senderInitials }}
                  </div>
                </template>
              </div>

              <div class="min-w-0 flex-1">
                <div class="mb-1 flex items-start justify-between gap-10px">
                  <p class="min-w-0 text-sm leading-normal text-space">
                    <NuxtLink
                      v-if="n.candidateId"
                      :to="`/candidates/${n.candidateId}`"
                      class="font-medium text-dodger hover:underline"
                    >
                      {{ n.headline }}
                    </NuxtLink>
                    <span v-else class="font-medium">{{ n.headline }}</span>
                    <template v-if="n.vacancyId && n.vacancyName">
                      <span class="font-normal text-bali"> · </span>
                      <NuxtLink
                        :to="`/vacancies/${n.vacancyId}`"
                        class="font-medium text-dodger hover:underline"
                      >
                        {{ n.vacancyName }}
                      </NuxtLink>
                    </template>
                  </p>
                  <p class="mt-0.5 shrink-0 whitespace-nowrap text-xs text-bali">
                    {{ formatDateRu(n.createdAt) }}
                  </p>
                </div>

                <p v-if="n.text" class="mb-10px text-sm leading-150 text-bali">
                  {{ n.text }}
                </p>

                <div v-if="n.primaryAction?.label" class="mb-10px">
                  <NuxtLink
                    v-if="n.primaryAction.href && String(n.primaryAction.href).startsWith('/')"
                    :to="String(n.primaryAction.href)"
                    class="text-sm font-medium text-dodger hover:underline"
                  >
                    {{ n.primaryAction.label }}
                  </NuxtLink>
                  <a
                    v-else-if="n.primaryAction.href"
                    :href="String(n.primaryAction.href)"
                    class="text-sm font-medium text-dodger hover:underline"
                  >
                    {{ n.primaryAction.label }}
                  </a>
                  <button
                    v-else
                    type="button"
                    class="text-sm font-medium text-dodger hover:underline"
                  >
                    {{ n.primaryAction.label }}
                  </button>
                </div>

                <div v-if="n.actions.length" class="flex gap-15px">
                  <template v-for="a in n.actions" :key="a.key">
                    <NuxtLink
                      v-if="a.href && String(a.href).startsWith('/')"
                      :to="String(a.href)"
                      class="text-sm font-medium"
                      :class="actionClass(a)"
                    >
                      {{ a.label }}
                    </NuxtLink>
                    <a
                      v-else-if="a.href"
                      :href="String(a.href)"
                      class="text-sm font-medium"
                      :class="actionClass(a)"
                    >
                      {{ a.label }}
                    </a>
                    <button
                      v-else
                      type="button"
                      class="text-sm font-medium"
                      :class="actionClass(a)"
                    >
                      {{ a.label }}
                    </button>
                  </template>
                </div>
              </div>
            </div>
          </div>

          <div
            v-if="meta && (meta.last_page ?? 1) > 1"
            class="flex items-center justify-between gap-15px border-t border-athens px-25px py-15px"
          >
            <UiButton
              variant="back"
              size="semiaction"
              :disabled="!canPrev"
              @click="load(currentPage - 1)"
            >
              Назад
            </UiButton>
            <p class="mb-0 text-sm text-bali">
              Страница {{ currentPage }} из {{ lastPage }}
            </p>
            <UiButton
              variant="back"
              size="semiaction"
              :disabled="!canNext"
              @click="load(currentPage + 1)"
            >
              Вперёд
            </UiButton>
          </div>
        </template>
      </section>
    </div>
  </div>
</template>
