<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import MyCheckbox from '~/components/custom/MyCheckbox.vue'
import {
  getNotificationSettings,
  patchNotificationSettings,
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

const loading = ref(false)
const errorText = ref<string | null>(null)
const savingKeys = ref<Set<string>>(new Set())

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

async function updateSelectField(fieldKey: string, value: string) {
  ensureSettingsDefaults()
  const prev = (settings.value as any)?.[fieldKey]
  ;(settings.value as any)[fieldKey] = value
  await savePatch({ [fieldKey]: value } as any, `field:${fieldKey}`)
  if (errorText.value) (settings.value as any)[fieldKey] = prev
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
  } catch (e: any) {
    errorText.value =
      e?.data?.message ||
      e?.statusMessage ||
      e?.message ||
      'Не удалось загрузить настройки уведомлений'
    ensureSettingsDefaults()
    applyDefaultsFromCards(cards.value)
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

async function toggleChannel(key: NotificationChannelKey, value: boolean, locked?: boolean) {
  if (locked) return
  ensureSettingsDefaults()
  const prev = channelEnabled(key)
  settings.value!.channels[key].enabled = value
  await savePatch({ channels: { [key]: { enabled: value } } as any }, `channel:${key}`)
  if (errorText.value) settings.value!.channels[key].enabled = prev
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

    <div
      v-for="card in cards"
      :key="card.key"
      class="rounded-fifteen p-25px bg-white mb-15px"
    >
      <div class="flex items-start justify-between gap-x-15px">
        <div class="min-w-0">
          <p class="text-lg font-semibold text-space leading-normal mb-1">
            {{ card.title }}
          </p>
          <p v-if="card.description" class="text-sm font-normal text-bali leading-150">
            {{ card.description }}
          </p>
        </div>

        <div class="flex-shrink-0">
          <div
            class="inline-flex items-center bg-athens-gray rounded-ten p-1"
            :class="{ 'opacity-60 pointer-events-none': isSaving(`channel:${card.key}`) }"
          >
            <button
              class="px-3 py-1.5 text-sm font-medium rounded-[8px] transition"
              :class="channelEnabled(card.key) ? 'text-bali' : 'bg-white text-space shadow-sm'"
              type="button"
              @click="toggleChannel(card.key, false, card.locked)"
            >
              выкл
            </button>
            <button
              class="px-3 py-1.5 text-sm font-medium rounded-[8px] transition"
              :class="channelEnabled(card.key) ? 'bg-white text-space shadow-sm' : 'text-bali'"
              type="button"
              @click="toggleChannel(card.key, true, card.locked)"
            >
              вкл
            </button>
          </div>
        </div>
      </div>

      <div class="mt-15px">
        <div v-if="!channelEnabled(card.key)" class="text-sm text-bali">
          Канал отключен
        </div>

        <div v-else class="grid gap-y-12px">
          <div
            v-for="ev in card.events"
            :key="ev.key"
            class="flex items-center justify-between"
          >
            <MyCheckbox
              :id="`${card.key}-${ev.key}`"
              v-model="(settings as any).channels[card.key].events[ev.key]"
              :label="ev.title"
              :compact="true"
              :class="{ 'opacity-60 pointer-events-none': ev.locked || isSaving(`event:${card.key}:${ev.key}`) }"
              @update:model-value="(val: boolean) => toggleEvent(card.key, ev.key, val, ev.locked)"
            />
          </div>

          <div
            v-if="card.fields?.type === 'select' && card.fields.options?.length"
            class="pt-10px border-t border-athens mt-2"
          >
            <p class="text-sm font-medium text-space mb-[15px]">
              {{ card.fields.title }}
            </p>
            <div
              class="max-w-[220px]"
              :class="{ 'opacity-60 pointer-events-none': isSaving(`field:${card.fields.key}`) }"
            >
              <select
                class="w-full bg-athens-gray border border-athens rounded-ten px-15px py-10px text-sm text-space outline-none"
                :value="(settings as any)?.[card.fields.key]"
                @change="(e) => updateSelectField(card.fields!.key, (e.target as HTMLSelectElement).value)"
              >
                <option
                  v-for="opt in card.fields.options"
                  :key="opt.value"
                  :value="opt.value"
                >
                  {{ opt.label }}
                </option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
