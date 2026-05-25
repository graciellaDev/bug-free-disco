<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import MyToggleSwitch from '~/components/custom/MyToggleSwitch.vue'
import {
  getNotificationSettings,
  patchNotificationSettings,
  getPushPublicKey,
  subscribePush,
  unsubscribePush,
  type NotificationChannelKey,
  type NotificationSchemaChannel,
  type NotificationSchemaSection,
  type NotificationSettings,
} from '~/src/api/notificationSettings'

definePageMeta({
  layout: 'settings',
})

useHead({
  title: 'Настройки — Уведомления',
})

type UiEventRow = {
  key: string
  title: string
  locked?: boolean
  default?: boolean
}

type UiSelectOption = { value: string; label: string }
type UiSelectField = {
  key: string
  title: string
  type: 'select'
  default?: string
  options: UiSelectOption[]
}

type UiChannelCard = {
  key: NotificationChannelKey
  title: string
  description?: string
  locked?: boolean
  events: UiEventRow[]
  fields?: UiSelectField
}

type TableChannelKey = 'system' | 'email' | 'browser'
type TableEventRow = {
  key: string
  title: string
  locked: Partial<Record<TableChannelKey, boolean>>
}
type FixedNotificationEvent = {
  key: string
  title: string
  defaultEnabled?: Partial<Record<TableChannelKey, boolean>>
}

const loading = ref(false)
const errorText = ref<string | null>(null)
const savingKeys = ref<Set<string>>(new Set())
const pushEnabled = ref(true)
const pushBusy = ref(false)

const schema = ref<NotificationSchemaSection[] | null>(null)
const settings = ref<NotificationSettings | null>(null)

const abortController = new AbortController()

const fallbackCards = computed<UiChannelCard[]>(() => {
  return [
    {
      key: 'email',
      title: 'Почтовые уведомления',
      description: 'Некоторые пункты являются важными, отключить их нельзя',
      events: [
        { key: 'new_accounts', title: 'Новые счета', locked: true},
        { key: 'success_payment', title: 'Успешная оплата', locked: true },
        { key: 'subscription', title: 'Информация о подписке', locked: true },
        { key: 'work_act', title: 'Акт выполненых работ', locked: true },
      ],
    },
    {
      key: 'sms',
      title: 'Смс уведомления',
      description: 'Приходят на номер, который указан в вашем профиле',
      events: [
        { key: 'payment_success', title: 'Успешная оплата' },
        { key: 'new_responses', title: 'Новые отклики' },
        { key: 'candidate_resume', title: 'Резюме кандидата' },
        { key: 'vacancy_expiration', title: 'Окончание срока публикации вакансии' },
        { key: 'marketing', title: 'Маркетинговые материалы, акции и скидки' },
      ],
    },
    {
      key: 'browser',
      title: 'Уведомления браузера',
      description:
        'Настройте всплывающие уведомления от браузера, в котором был выполнен вход в учетную запись CRM',
      events: [
        { key: 'payment_success', title: 'Успешная оплата' },
        { key: 'new_responses', title: 'Новые отклики' },
        { key: 'candidate_resume', title: 'Резюме кандидата' },
        { key: 'vacancy_expiration', title: 'Окончание срока публикации вакансии' },
        { key: 'marketing', title: 'Маркетинговые материалы, акции и скидки' },
      ],
    },
    {
      key: 'system',
      title: 'Уведомления системы',
      description:
        'Появляются с краю экрана, можно настроить положение или отключить',
      events: [
        { key: 'payment_success', title: 'Успешная оплата' },
        { key: 'new_responses', title: 'Новые отклики' },
        { key: 'candidate_resume', title: 'Резюме кандидата' },
        { key: 'vacancy_expiration', title: 'Окончание срока публикации вакансии' },
        { key: 'marketing', title: 'Маркетинговые материалы, акции и скидки' },
      ],
      fields: {
        key: 'system_position',
        title: 'Расположение уведомлений',
        default: 'top_right',
        type: 'select',
        options: [
          { value: 'top_right', label: 'Правый верхний угол' },
          { value: 'top_left', label: 'Левый верхний угол' },
          { value: 'bottom_right', label: 'Правый нижний угол' },
          { value: 'bottom_left', label: 'Левый нижний угол' },
        ],
      }
    },
    {
      key: 'messenger',
      title: 'Уведомления в мессенджеры',
      description:
        'Подключите мессенджер для получения уведомлений',
      events: [
        { key: 'payment_success', title: 'Успешная оплата', default: true },
        { key: 'new_responses', title: 'Новые отклики', default: true },
        { key: 'candidate_resume', title: 'Резюме кандидата', default: true },
        { key: 'vacancy_expiration', title: 'Окончание срока публикации вакансии', default: true },
        { key: 'marketing', title: 'Маркетинговые материалы, акции и скидки', default: true },
      ],
    },
  ]
})

const schemaCards = computed<UiChannelCard[] | null>(() => {
  const s = schema.value
  if (!s || !Array.isArray(s) || s.length === 0) return null

  const channels: NotificationSchemaChannel[] = []
  for (const section of s) {
    if (!section?.channels || !Array.isArray(section.channels)) continue
    for (const ch of section.channels) channels.push(ch)
  }

  const uniqueByKey = new Map<NotificationChannelKey, NotificationSchemaChannel>()
  for (const ch of channels) {
    if (ch?.key) uniqueByKey.set(ch.key, ch)
  }

  const ordered: NotificationChannelKey[] = [
    'email',
    'sms',
    'browser',
    'system',
    'messenger',
  ]

  const result: UiChannelCard[] = []
  for (const key of ordered) {
    const ch = uniqueByKey.get(key)
    if (!ch) continue
    result.push({
      key: ch.key,
      title: ch.title,
      description: (ch.description || undefined) ?? undefined,
      locked: Boolean(ch.locked),
      events: Array.isArray(ch.events)
        ? ch.events.map((e) => ({
            key: e.key,
            title: e.title,
            locked: Boolean(e.locked),
            default: (e as any).default,
          }))
        : [],
      fields:
        (ch as any)?.fields?.type === 'select'
          ? {
              key: String((ch as any).fields.key || ''),
              title: String((ch as any).fields.title || ''),
              type: 'select',
              default: (ch as any).fields.default,
              options: Array.isArray((ch as any).fields.options)
                ? (ch as any).fields.options.map((o: any) => ({
                    value: String(o?.value ?? ''),
                    label: String(o?.label ?? ''),
                  }))
                : [],
            }
          : undefined,
    })
  }

  return result.length ? result : null
})

const cards = computed<UiChannelCard[]>(() => {
  return schemaCards.value ?? fallbackCards.value
})

const tableChannels: Array<{ key: TableChannelKey; title: string }> = [
  { key: 'system', title: 'Системные' },
  { key: 'email', title: 'E-mail' },
  { key: 'browser', title: 'Push' },
]

const fixedNotificationEvents: FixedNotificationEvent[] = [
  {
    key: 'response_received',
    title: 'Когда получен отклик на вакансию',
    defaultEnabled: { system: true, email: true, browser: false },
  },
  {
    key: 'customer_comments_candidate',
    title: 'Когда заказчик комментирует кандидата на вакансии, в команде которой вы состоите',
    defaultEnabled: { system: true, email: true, browser: false },
  },
  {
    key: 'avito_incoming_message',
    title: 'Когда пришло входящее сообщение работном сайте',
    defaultEnabled: { system: true, email: false, browser: false },
  },
  {
    key: 'third_party_auth_disconnected',
    title: 'Если отключилась авторизация на стороннем сервисе (headhunter, superjob, gmail, outlook)',
    defaultEnabled: { system: true, email: true, browser: false },
  },
  {
    key: 'task_new_assigned',
    title: 'Задача: вам поставлена новая задача',
    defaultEnabled: { system: true, email: true, browser: true },
  },
  {
    key: 'task_5min_before',
    title: 'Задача: за 5 минут до выполнения задачи',
    defaultEnabled: { system: true, email: false, browser: true },
  },
  {
    key: 'task_time_due',
    title: 'Задача: наступило время выполнения задачи',
    defaultEnabled: { system: true, email: true, browser: false },
  },
]

const cardByKey = computed(() => {
  const m = new Map<NotificationChannelKey, UiChannelCard>()
  for (const card of cards.value) m.set(card.key, card)
  return m
})

const tableRows = computed<TableEventRow[]>(() => {
  return fixedNotificationEvents.map((ev) => {
    const locked: Partial<Record<TableChannelKey, boolean>> = {}
    for (const col of tableChannels) {
      const card = cardByKey.value.get(col.key)
      const schemaEvent = card?.events.find((item) => item.key === ev.key)
      locked[col.key] = Boolean(schemaEvent?.locked)
    }
    return {
      key: ev.key,
      title: ev.title,
      locked,
    }
  })
})

function ensureSettingsDefaults() {
  if (settings.value) return
  settings.value = {
    channels: {
      email: { enabled: true, events: {} },
      sms: { enabled: true, events: {} },
      browser: { enabled: true, events: {} },
      system: { enabled: true, events: {} },
      messenger: { enabled: true, events: {} },
    },
    system_position: 'top_right',
  }
}

function applyDefaultsFromCards(cardList: UiChannelCard[]) {
  ensureSettingsDefaults()
  const s = settings.value!

  for (const card of cardList) {
    const ch = s.channels[card.key]
    if (!ch) continue
    if (!ch.events) ch.events = {}

    for (const ev of card.events) {
      const current = ch.events[ev.key]
      if (typeof current === 'boolean') continue
      ch.events[ev.key] = ev.default ?? true
    }

    const field = card.fields
    if (field?.type === 'select' && field.key) {
      const current = (s as any)[field.key]
      if (typeof current !== 'string' || current.trim() === '') {
        ;(s as any)[field.key] = field.default ?? field.options?.[0]?.value
      }
    }
  }
}

function applyFixedEventDefaults() {
  ensureSettingsDefaults()
  const s = settings.value!
  for (const ch of tableChannels) {
    if (!s.channels[ch.key]) continue
    if (!s.channels[ch.key].events) s.channels[ch.key].events = {}
    for (const ev of fixedNotificationEvents) {
      const current = s.channels[ch.key].events[ev.key]
      if (typeof current === 'boolean') continue
      s.channels[ch.key].events[ev.key] = Boolean(ev.defaultEnabled?.[ch.key] ?? false)
    }
  }
}

function isSaving(key: string) {
  return savingKeys.value.has(key)
}

function setSaving(key: string, value: boolean) {
  const next = new Set(savingKeys.value)
  if (value) next.add(key)
  else next.delete(key)
  savingKeys.value = next
}

function channelEnabled(key: NotificationChannelKey): boolean {
  ensureSettingsDefaults()
  return Boolean(settings.value?.channels?.[key]?.enabled)
}

function eventValue(channelKey: NotificationChannelKey, eventKey: string): boolean {
  ensureSettingsDefaults()
  const ch = settings.value?.channels?.[channelKey]
  if (!ch) return false
  return Boolean(ch.events?.[eventKey])
}

async function load() {
  if (loading.value) return
  loading.value = true
  errorText.value = null
  try {
    const res = await getNotificationSettings({ signal: abortController.signal })
    schema.value = (res as any)?.data?.schema ?? null
    settings.value = (res as any)?.data?.settings ?? null
    ensureSettingsDefaults()
    applyDefaultsFromCards(cards.value)
    applyFixedEventDefaults()
    pushEnabled.value = await detectPushEnabled()
  } catch (e: any) {
    errorText.value =
      e?.data?.message ||
      e?.statusMessage ||
      e?.message ||
      'Не удалось загрузить настройки уведомлений'
    ensureSettingsDefaults()
    applyDefaultsFromCards(cards.value)
    applyFixedEventDefaults()
    pushEnabled.value = false
  } finally {
    loading.value = false
  }
}

async function savePatch(patch: Partial<NotificationSettings>, savingKey: string) {
  if (isSaving(savingKey)) return
  setSaving(savingKey, true)
  errorText.value = null
  try {
    const res = await patchNotificationSettings(patch, {
      signal: abortController.signal,
    })
    const newSettings = (res as any)?.data?.settings
    if (newSettings) settings.value = newSettings
  } catch (e: any) {
    const status = e?.response?.status ?? e?.statusCode ?? e?.status
    const msg =
      e?.response?._data?.message ||
      e?.data?.message ||
      e?.statusMessage ||
      e?.message ||
      'Не удалось сохранить настройки'
    errorText.value = msg
    if (status === 422) {
      await load()
    }
  } finally {
    setSaving(savingKey, false)
  }
}

async function toggleEvent(
  channelKey: NotificationChannelKey,
  eventKey: string,
  value: boolean,
  locked?: boolean
) {
  if (locked) return
  ensureSettingsDefaults()
  const prev = eventValue(channelKey, eventKey)
  if (!settings.value!.channels[channelKey].events) settings.value!.channels[channelKey].events = {}
  settings.value!.channels[channelKey].events[eventKey] = value
  await savePatch(
    { channels: { [channelKey]: { events: { [eventKey]: value } } } as any },
    `event:${channelKey}:${eventKey}`
  )
  if (errorText.value) settings.value!.channels[channelKey].events[eventKey] = prev
}

function base64UrlToUint8Array(base64UrlString: string) {
  const padding = '='.repeat((4 - (base64UrlString.length % 4)) % 4)
  const base64 = (base64UrlString + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(base64)
  const output = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; ++i) output[i] = raw.charCodeAt(i)
  return output
}

async function getExistingPushSubscription(): Promise<PushSubscription | null> {
  if (!import.meta.client || !('serviceWorker' in navigator)) return null
  const reg = await navigator.serviceWorker.getRegistration('/')
  if (!reg) return null
  return await reg.pushManager.getSubscription()
}

async function detectPushEnabled(): Promise<boolean> {
  const browserEnabled = channelEnabled('browser')
  if (!import.meta.client) return browserEnabled
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return false
  if (Notification.permission === 'denied') return false
  const sub = await getExistingPushSubscription()
  return browserEnabled && Boolean(sub)
}

async function onPushToggle(nextValue: boolean) {
  if (pushBusy.value) return
  const prev = pushEnabled.value
  pushBusy.value = true
  errorText.value = null

  try {
    if (!import.meta.client || !('serviceWorker' in navigator) || !('PushManager' in window)) {
      throw new Error('Браузер не поддерживает push-уведомления')
    }

    if (nextValue) {
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') {
        throw new Error('Разрешение на push-уведомления не выдано')
      }

      const reg = await navigator.serviceWorker.register('/sw.js')
      let subscription = await reg.pushManager.getSubscription()

      if (!subscription) {
        const keyRes = await getPushPublicKey({ signal: abortController.signal })
        const vapidKey = (keyRes as any)?.data?.public_key || ''
        if (!vapidKey) throw new Error('Не настроен публичный VAPID ключ')
        subscription = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: base64UrlToUint8Array(String(vapidKey)),
        })
      }

      const json = subscription.toJSON()
      if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) {
        throw new Error('Браузер вернул некорректную push-подписку')
      }

      await subscribePush(
        {
          endpoint: json.endpoint,
          keys: {
            p256dh: json.keys.p256dh,
            auth: json.keys.auth,
          },
        },
        { signal: abortController.signal }
      )
      await savePatch(
        { channels: { browser: { enabled: true } } as any },
        'push:toggle'
      )
      pushEnabled.value = true
      return
    }

    const current = await getExistingPushSubscription()
    if (current) {
      const endpoint = current.endpoint
      await current.unsubscribe()
      await unsubscribePush(endpoint, { signal: abortController.signal })
    } else {
      await unsubscribePush(undefined, { signal: abortController.signal })
    }
    await savePatch(
      { channels: { browser: { enabled: false } } as any },
      'push:toggle'
    )
    pushEnabled.value = false
  } catch (e: any) {
    pushEnabled.value = prev
    errorText.value =
      e?.data?.message ||
      e?.statusMessage ||
      e?.message ||
      'Не удалось изменить состояние push-уведомлений'
  } finally {
    pushBusy.value = false
  }
}

onMounted(load)
onBeforeUnmount(() => abortController.abort())
</script>

<template>
  <div>
    <div v-if="errorText" class="rounded-fifteen p-15px bg-white mb-15px">
      <p class="text-sm text-red-500 font-medium">{{ errorText }}</p>
    </div>

    <div v-if="loading" class="rounded-fifteen p-25px bg-white mb-15px">
      <p class="text-sm text-bali">Загрузка...</p>
    </div>

    <div class="rounded-fifteen border border-athens bg-white p-25px mb-15px">
      <p class="text-lg font-semibold text-space leading-normal mb-1">
        Push-уведомления
      </p>
      <p class="text-sm font-normal text-bali leading-150 mb-15px">
        Подключите Push-уведомления, чтобы быть в курсе событий, даже когда вкладка с сервисом закрыта.
      </p>
      <MyToggleSwitch
        id="push-notifications-enabled"
        :model-value="pushEnabled"
        :disabled="pushBusy"
        label="Включить push-уведомления"
        @update:model-value="onPushToggle"
      />
    </div>

    <div class="overflow-hidden rounded-fifteen bg-athens shadow-sm mb-15px">
      <div class="overflow-x-auto">
        <table class="w-full min-w-[760px] table-fixed text-left text-sm">
          <thead>
            <tr class="bg-catskill">
              <th class="w-[65%] py-3 pl-15px pr-25px font-medium text-space">Событие</th>
              <th class="w-[12%] py-3 pl-15px pr-25px text-center font-medium text-space">Системные</th>
              <th class="w-[12%] py-3 pl-15px pr-25px text-center font-medium text-space">E-mail</th>
              <th class="w-[11%] py-3 pl-15px pr-25px text-center font-medium text-space">Push</th>
            </tr>
          </thead>
          <tbody class="bg-white">
            <tr v-if="tableRows.length === 0">
              <td colspan="4" class="py-8 text-center text-slate-custom">
                Нет доступных событий для настройки.
              </td>
            </tr>
            <tr
              v-for="row in tableRows"
              :key="row.key"
              class="border-b border-athens last:border-0"
            >
              <td class="py-3 pl-15px pr-25px text-space">
                {{ row.title }}
              </td>
              <td
                v-for="col in tableChannels"
                :key="`${row.key}-${col.key}`"
                class="py-3 pl-15px pr-25px text-center"
              >
                <input
                  :id="`${col.key}-${row.key}`"
                  :checked="eventValue(col.key, row.key)"
                  type="checkbox"
                  class="h-4 w-4 cursor-pointer rounded border-athens text-dodger focus:ring-dodger"
                  :class="{
                    'opacity-50 cursor-not-allowed': row.locked[col.key] || !channelEnabled(col.key) || isSaving(`event:${col.key}:${row.key}`),
                  }"
                  :disabled="row.locked[col.key] || !channelEnabled(col.key) || isSaving(`event:${col.key}:${row.key}`)"
                  @change="(e) => toggleEvent(col.key, row.key, (e.target as HTMLInputElement).checked, row.locked[col.key])"
                >
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
