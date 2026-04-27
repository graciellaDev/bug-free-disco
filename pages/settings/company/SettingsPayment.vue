<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import MyInput from '~/components/custom/MyInput.vue'
import Popup from '~/components/custom/Popup.vue'
import { createAuthHeaders, getAuthTokens } from '~/helpers/authToken'
import DeleteConfirmPopup from '~/components/custom/DeleteConfirmPopup.vue'

definePageMeta({
  layout: 'settings',
})

useHead({
  title: 'Настройки — Платежная информация',
})

type PaymentTab = 'payer' | 'card' | 'invoices'

const activeTab = ref<PaymentTab>('payer')
const tabCounts = ref({
  payer: 1,
  card: 2,
})

const isNewPayerOpen = ref(false)
const isBindCardOpen = ref(false)
const isInvoicesOpen = ref(false)

// UI-only: данные пока локальные; позже подключим API.
const payerDraft = ref({
  innLookup: '',
  companyName: '',
  region: '',
  inn: '',
  ogrn: '',
  city: '',
  address: '',
  kpp: ''
})

const payerLookupLoading = ref(false)
const payerLookupError = ref<string | null>(null)
const payerSaveLoading = ref(false)
const payerSaveError = ref<string | null>(null)

type BackendPayer = {
  id?: number | string
  name?: string | null
  city?: string | null
  region?: string | null
  address?: string | null
  inn?: string | null
  kpp?: string | null
  ogrn?: string | null
  is_active?: boolean | null
}

function formatPayerAddress(p: BackendPayer): string {
  console.log('адрес', p);
  const parts = [p.city, p.region, p.address]
    .map((x) => String(x || '').trim())
    .filter(Boolean)
  return parts.join(', ')
}

const payersLoading = ref(false)
const payersError = ref<string | null>(null)
const payers = ref<BackendPayer[]>([])

const payerToDelete = ref<BackendPayer | null>(null)
const payerDeleteLoading = ref(false)
const payerDeleteError = ref<string | null>(null)
const isDeletePayerOpen = computed(() => Boolean(payerToDelete.value))

function openDeletePayer(p: BackendPayer) {
  payerToDelete.value = p
  payerDeleteError.value = null
}

function closeDeletePayer() {
  payerToDelete.value = null
  payerDeleteError.value = null
}

async function confirmDeletePayer() {
  if (payerDeleteLoading.value) return

  const id = payerToDelete.value?.id
  if (id === undefined || id === null || String(id).trim() === '') {
    payerDeleteError.value = 'Не удалось удалить: отсутствует id плательщика'
    return
  }

  const authTokens = getAuthTokens()
  if (!authTokens) {
    payerDeleteError.value = 'Требуется авторизация'
    return
  }

  payerDeleteLoading.value = true
  payerDeleteError.value = null
  try {
    const url = getBackendApiUrl(`/admin/payers/${encodeURIComponent(String(id))}`)
    await $fetch(url, {
      method: 'DELETE',
      headers: {
        ...createAuthHeaders(authTokens.serverToken, authTokens.userToken),
      },
    })
    await loadPayers()
    closeDeletePayer()
  } catch (e: unknown) {
    const err = e as { statusMessage?: string; message?: string; data?: any }
    payerDeleteError.value =
      err?.data?.message ||
      err?.statusMessage ||
      err?.message ||
      'Не удалось удалить плательщика'
  } finally {
    payerDeleteLoading.value = false
  }
}

type PartySuggestion = {
  value?: string
  unrestricted_value?: string
  data?: {
    inn?: string
    ogrn?: string
    kpp?: string
    name?: {
      full?: string
      full_with_opf?: string
      short_with_opf?: string
    }
    address?: {
      value?: string
      data?: {
        region_with_type?: string
        city_with_type?: string
        settlement_with_type?: string
      }
    }
  }
}

function trimAddressTail(
  addressValue: string,
  regionWithType: string,
  cityWithType: string
): string {
  const parts = String(addressValue || '')
    .split(',')
    .map((p) => p.trim())
    .filter(Boolean)

  const eq = (a: string, b: string) =>
    a.localeCompare(b, 'ru', { sensitivity: 'accent' }) === 0

  while (parts.length > 0) {
    const head = parts[0]
    if (/^\\d{6}$/.test(head)) {
      parts.shift()
      continue
    }
    if (regionWithType && eq(head, regionWithType)) {
      parts.shift()
      continue
    }
    if (cityWithType && eq(head, cityWithType)) {
      parts.shift()
      continue
    }
    break
  }

  return parts.join(', ')
}

const partySuggestLoading = ref(false)
const partySuggestError = ref<string | null>(null)
const partySuggestions = ref<PartySuggestion[]>([])
const isPartySuggestOpen = ref(false)
const partySuggestRootEl = ref<HTMLElement | null>(null)

const selectedPartySuggestion = ref<PartySuggestion | null>(null)
const isPartyConfirmOpen = ref(false)

function openPartyConfirm() {
  if (!selectedPartySuggestion.value) return
  isPartyConfirmOpen.value = true
}

function closePartyConfirm() {
  isPartyConfirmOpen.value = false
}

function selectPartySuggestion(s: PartySuggestion) {
  selectedPartySuggestion.value = s
  isPartySuggestOpen.value = false
  // Попап открываем только по кнопке «Загрузить»
  payerLookupError.value = null
  partySuggestError.value = null

  const inn = String(s?.data?.inn || '').trim()
  if (inn) payerDraft.value.innLookup = inn
}

function confirmPartySuggestion() {
  const s = selectedPartySuggestion.value
  if (!s) return
  applyPartySuggestion(s)
  closePartyConfirm()
  selectedPartySuggestion.value = null
}

function onInnLoadClick() {
  if (!canLookupInn.value) return
  if (payerLookupLoading.value) return

  if (!selectedPartySuggestion.value) {
    payerLookupError.value = 'Выберите компанию из списка'
    return
  }

  openPartyConfirm()
}

function getSelectedCompanyName(): string {
  const s = selectedPartySuggestion.value
  if (!s) return '—'
  return String(
    s?.data?.name?.full ||
      s?.data?.name?.full_with_opf ||
      s?.data?.name?.short_with_opf ||
      s?.unrestricted_value ||
      s?.value ||
      '—'
  ).trim() || '—'
}

function getSelectedCompanyAddress(): string {
  const s = selectedPartySuggestion.value
  if (!s) return '—'
  const region = String(s?.data?.address?.data?.region_with_type || '').trim()
  const city = String(
    s?.data?.address?.data?.city_with_type ||
      s?.data?.address?.data?.settlement_with_type ||
      ''
  ).trim()
  const addressValue = String(s?.data?.address?.value || '').trim()
  const address = trimAddressTail(addressValue, region, city)
  return address || addressValue || '—'
}

function getSelectedCompanyInn(): string {
  const s = selectedPartySuggestion.value
  return String(s?.data?.inn || '—').trim() || '—'
}

function getSelectedCompanyOgrn(): string {
  const s = selectedPartySuggestion.value
  return String(s?.data?.ogrn || '—').trim() || '—'
}

function closePartySuggest() {
  isPartySuggestOpen.value = false
}

const onDocClick = (e: MouseEvent) => {
  if (!isPartySuggestOpen.value) return
  const root = partySuggestRootEl.value
  const target = e.target as Node | null
  if (!root || !target) return
  if (!root.contains(target)) closePartySuggest()
}

onMounted(() => {
  document.addEventListener('click', onDocClick, true)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', onDocClick, true)
})

const canLookupInn = computed(() => {
  const inn = String(payerDraft.value.innLookup || '').replace(/\D/g, '')
  return inn.length === 10 || inn.length === 12
})

async function loadCompanyByInn() {
  const inn = String(payerDraft.value.innLookup || '').replace(/\D/g, '')
  if (!(inn.length === 10 || inn.length === 12)) return

  const authTokens = getAuthTokens()
  if (!authTokens) {
    payerLookupError.value = 'Требуется авторизация'
    return
  }

  payerLookupLoading.value = true
  payerLookupError.value = null
  try {
    const res = await $fetch<{
      found: boolean
      inn: string
      ogrn: string
      companyName: string
      region: string
      city: string
      address: string
    }>('/api/dadata/company', {
      method: 'POST',
      headers: {
        ...createAuthHeaders(authTokens.serverToken, authTokens.userToken),
        'Content-Type': 'application/json',
      },
      body: { inn },
    })

    if (!res?.found) {
      payerLookupError.value = 'Компания по ИНН не найдена'
      return
    }

    payerDraft.value.inn = res.inn || inn
    payerDraft.value.ogrn = res.ogrn || ''
    payerDraft.value.companyName = res.companyName || ''
    payerDraft.value.region = res.region || ''
    payerDraft.value.city = res.city || ''
    payerDraft.value.address = res.address || ''
  } catch (e: unknown) {
    const err = e as { statusMessage?: string; message?: string }
    payerLookupError.value =
      err?.statusMessage ||
      err?.message ||
      'Не удалось загрузить данные по ИНН'
  } finally {
    payerLookupLoading.value = false
  }
}

let innDebounceTimer: ReturnType<typeof setTimeout> | null = null
watch(
  () => payerDraft.value.innLookup,
  () => {
    if (innDebounceTimer) clearTimeout(innDebounceTimer)

    payerLookupError.value = null
    partySuggestError.value = null

    const q = String(payerDraft.value.innLookup || '').trim()
    if (q.length < 3) {
      partySuggestions.value = []
      isPartySuggestOpen.value = false
      return
    }
    innDebounceTimer = setTimeout(() => {
      void loadPartySuggestions()
    }, 500)
  }
)

async function loadPartySuggestions() {
  const q = String(payerDraft.value.innLookup || '').trim()
  if (q.length < 3) return

  const authTokens = getAuthTokens()
  if (!authTokens) {
    partySuggestError.value = 'Требуется авторизация'
    return
  }

  partySuggestLoading.value = true
  partySuggestError.value = null
  try {
    const res = await $fetch<{ suggestions: PartySuggestion[] }>(
      '/api/dadata/party-suggest',
      {
        method: 'POST',
        headers: {
          ...createAuthHeaders(authTokens.serverToken, authTokens.userToken),
          'Content-Type': 'application/json',
        },
        body: { query: q },
      }
    )
    partySuggestions.value = Array.isArray(res?.suggestions)
      ? res.suggestions
      : []
    // Открываем список даже если он пуст, чтобы показать сообщение "Список пуст"
    isPartySuggestOpen.value = true
  } catch (e: unknown) {
    const err = e as { statusMessage?: string; message?: string }
    partySuggestError.value =
      err?.statusMessage || err?.message || 'Не удалось получить список компаний'
    partySuggestions.value = []
    isPartySuggestOpen.value = false
  } finally {
    partySuggestLoading.value = false
  }
}

function applyPartySuggestion(s: PartySuggestion) {
  const inn = String(s?.data?.inn || '').trim()
  const kpp = String(s?.data?.kpp || '').trim()
  const ogrn = String(s?.data?.ogrn || '').trim()
  const companyName = String(
    s?.data?.name?.full ||
    s?.data?.name?.full_with_opf ||
    s?.data?.name?.short_with_opf ||
    s?.unrestricted_value ||
    s?.value ||
    ''
  ).trim()

  const region = String(s?.data?.address?.data?.region_with_type || '').trim()
  const city = String(
    s?.data?.address?.data?.city_with_type ||
    s?.data?.address?.data?.settlement_with_type ||
    ''
  ).trim()

  const addressValue = String(s?.data?.address?.value || '').trim()
  const address = trimAddressTail(addressValue, region, city)

  payerDraft.value.innLookup = inn || payerDraft.value.innLookup
  payerDraft.value.inn = inn
  payerDraft.value.kpp = kpp
  payerDraft.value.ogrn = ogrn
  payerDraft.value.companyName = companyName
  payerDraft.value.region = region
  payerDraft.value.city = city
  payerDraft.value.address = address
  partySuggestions.value = []
  isPartySuggestOpen.value = false
}

async function savePayer() {
  if (payerSaveLoading.value) return

  const authTokens = getAuthTokens()
  if (!authTokens) {
    payerSaveError.value = 'Требуется авторизация'
    return
  }

  payerSaveLoading.value = true
  payerSaveError.value = null

  const config = useRuntimeConfig()
  const base = String(config.public.apiBase || '').replace(/\/+$/, '')
  const url = base
    ? base.endsWith('/api')
      ? `${base}/admin/payers`
      : `${base}/api/admin/payers`
    : '/api/admin/payers'

  const payload = {
    name: payerDraft.value.companyName || null,
    inn: payerDraft.value.inn || null,
    kpp: payerDraft.value.kpp || null,
    ogrn: payerDraft.value.ogrn || null,
    city: payerDraft.value.city || null,
    region: payerDraft.value.region || null,
    address: payerDraft.value.address || null,
    is_active: true,
  }
  console.log('отправляемые данные: ', payload);

  try {
    await $fetch(url, {
      method: 'POST',
      headers: {
        ...createAuthHeaders(authTokens.serverToken, authTokens.userToken),
        'Content-Type': 'application/json',
      },
      body: payload,
    })
    await loadPayers()

    payerDraft.value = {
      innLookup: '',
      companyName: '',
      region: '',
      inn: '',
      ogrn: '',
      city: '',
      address: '',
      kpp: '',
    }
    partySuggestions.value = []
    isPartySuggestOpen.value = false
    selectedPartySuggestion.value = null
    isPartyConfirmOpen.value = false

    isNewPayerOpen.value = false
  } catch (e: unknown) {
    const err = e as { statusMessage?: string; message?: string; data?: any }
    payerSaveError.value =
      err?.data?.message ||
      err?.statusMessage ||
      err?.message ||
      'Не удалось сохранить плательщика'
  } finally {
    payerSaveLoading.value = false
  }
}

function getBackendApiUrl(path: string) {
  const config = useRuntimeConfig()
  const base = String(config.public.apiBase || '').replace(/\/+$/, '')
  if (!base) return path
  if (base.endsWith('/api')) return `${base}${path.startsWith('/') ? '' : '/'}${path}`
  return `${base}/api${path.startsWith('/') ? '' : '/'}${path}`
}

async function loadPayers() {
  if (payersLoading.value) return

  const authTokens = getAuthTokens()
  if (!authTokens) {
    payersError.value = 'Требуется авторизация'
    return
  }

  payersLoading.value = true
  payersError.value = null
  try {
    const url = getBackendApiUrl('/admin/payers')
    const res = await $fetch<any>(url, {
      method: 'GET',
      headers: {
        ...createAuthHeaders(authTokens.serverToken, authTokens.userToken),
      },
    })

    const list = Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : []
    payers.value = list as BackendPayer[]
    tabCounts.value.payer = payers.value.length
  } catch (e: unknown) {
    const err = e as { statusMessage?: string; message?: string; data?: any }
    payersError.value =
      err?.data?.message ||
      err?.statusMessage ||
      err?.message ||
      'Не удалось загрузить список плательщиков'
  } finally {
    payersLoading.value = false
  }
}

watch(
  () => activeTab.value,
  (tab) => {
    if (tab === 'payer' && payers.value.length === 0 && !payersLoading.value) {
      void loadPayers()
    }
  },
  { immediate: true }
)

const cardDraft = ref({
  cardNumber: '',
  expiry: '',
  cvc: '',
  holder: '',
})

const invoices = ref([
  { id: 'INV-000124', date: '12.04.2026', amount: '9 900 ₽', status: 'Оплачен' },
  { id: 'INV-000125', date: '12.05.2026', amount: '9 900 ₽', status: 'Ожидает оплаты' },
  { id: 'INV-000126', date: '12.06.2026', amount: '9 900 ₽', status: 'Черновик' },
])

const hasLoadedPayer = computed(() =>
  Boolean(
    payerDraft.value.companyName ||
    payerDraft.value.region ||
    payerDraft.value.inn ||
    payerDraft.value.ogrn ||
    payerDraft.value.city ||
    payerDraft.value.address
  )
)

const headerTitle = computed(() => {
  if (activeTab.value === 'card') return 'Способы оплаты'
  return 'Реквизиты'
})

const headerSubtitle = computed(() => {
  if (activeTab.value === 'card') {
    return 'Добавьте или выберите основную карту для списания платежей'
  }
  return 'Управляйте платежными данными компании с этого раздела'
})

const headerActionLabel = computed(() => {
  if (activeTab.value === 'card') return 'Привязать карту'
  if (activeTab.value === 'invoices') return ''
  return 'Добавить плательщика'
})

function onHeaderActionClick() {
  if (activeTab.value === 'card') {
    isBindCardOpen.value = true
    return
  }
  isNewPayerOpen.value = true
}
</script>

<template>
  <div class="page-wrap">
    <!-- Шапка как на скрине -->
    <div class="rounded-fifteen p-25px bg-white mb-15px">
      <div class="flex items-start justify-between gap-15px">
        <div class="min-w-0">
          <h1 class="text-xl font-semibold text-space mb-2.5">{{ headerTitle }}</h1>
          <p class="text-sm font-normal text-slate-custom mb-0">
            {{ headerSubtitle }}
          </p>
        </div>
        <div class="shrink-0">
          <UiButton v-if="headerActionLabel" variant="action" size="semiaction" @click="onHeaderActionClick">
            {{ headerActionLabel }}
          </UiButton>
        </div>
      </div>
    </div>

    <!-- Панель табов отдельной карточкой -->
    <div class="rounded-fifteen px-25px py-15px bg-white mb-15px">
      <div class="tabs-row">
        <button type="button" class="tab-btn" :class="{ active: activeTab === 'payer' }" @click="activeTab = 'payer'">
          <span>Плательщики</span>
          <span class="tab-count">{{ tabCounts.payer }}</span>
        </button>

        <button type="button" class="tab-btn" :class="{ active: activeTab === 'card' }" @click="activeTab = 'card'">
          <span>Банковская карта</span>
          <span class="tab-count">{{ tabCounts.card }}</span>
        </button>

        <button type="button" class="tab-btn" :class="{ active: activeTab === 'invoices' }"
          @click="activeTab = 'invoices'">
          <span>Счета и акты</span>
        </button>
      </div>
    </div>

    <!-- Плательщик -->
    <div v-if="activeTab === 'payer'" class="rounded-fifteen p-25px bg-white">
      <div v-if="payersLoading" class="empty-box">
        <p class="text-sm font-normal text-slate-custom mb-0 text-center">Загрузка...</p>
      </div>

      <div v-else-if="payersError" class="empty-box">
        <div class="text-center">
          <p class="text-sm font-normal text-red-custom mb-10px">
            {{ payersError }}
          </p>
          <UiButton variant="back" size="semiaction" @click="loadPayers">
            Повторить
          </UiButton>
        </div>
      </div>

      <div v-else-if="payers.length === 0" class="empty-box">
        <p class="text-sm font-normal text-slate-custom mb-0 text-center">
          Пока что вы не добавили ни одного плательщика
        </p>
      </div>

      <div v-else class="overflow-hidden rounded-ten border border-gallery">
        <div class="grid grid-cols-[260px_1fr_160px_200px_44px] gap-x-15px px-15px py-11.5px bg-athens items-center">
          <p class="text-xs font-semibold text-slate-custom mb-0">Плательщик</p>
          <p class="text-xs font-semibold text-slate-custom mb-0">Адрес</p>
          <p class="text-xs font-semibold text-slate-custom mb-0">ИНН</p>
          <p class="text-xs font-semibold text-slate-custom mb-0">ОГРН</p>
          <span />
        </div>
        <div v-for="p in payers" :key="String(p.id ?? `${p.inn ?? ''}-${p.kpp ?? ''}-${p.ogrn ?? ''}`)"
          class="grid grid-cols-[260px_1fr_160px_200px_44px] gap-x-15px px-15px py-15px border-t border-gallery items-center">
          <p class="text-sm font-medium text-space mb-0 truncate">
            {{ p.name || '—' }}
          </p>
          <p class="text-sm font-normal text-slate-custom mb-0 truncate">
            {{ formatPayerAddress(p) || '—' }}
          </p>
          <p class="text-sm font-normal text-slate-custom mb-0 whitespace-nowrap">
            {{ p.inn || '—' }}
          </p>
          <p class="text-sm font-normal text-slate-custom mb-0 whitespace-nowrap">
            {{ p.ogrn || '—' }}
          </p>
          <button type="button"
            class="w-10 h-10 inline-flex items-center justify-center rounded-ten border text-slate-custom transition-colors bg-[#F4F6F8] border-[#EDEFF5] hover:text-space hover:bg-athens"
            title="Удалить" aria-label="Удалить" @click="openDeletePayer(p)">
            <!-- simple trash icon -->
            <svg data-v-7ed61b75="" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"
              fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
              class="block shrink-0" aria-hidden="true">
              <path data-v-7ed61b75=""
                d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h14Z"></path>
              <line data-v-7ed61b75="" x1="10" y1="11" x2="10" y2="17"></line>
              <line data-v-7ed61b75="" x1="14" y1="11" x2="14" y2="17"></line>
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- Карта -->
    <div v-else-if="activeTab === 'card'" class="rounded-fifteen p-25px bg-white">
      <div class="empty-box">
        <p class="text-sm font-normal text-slate-custom mb-0 text-center">
          Пока что вы не привязали ни одну карту
        </p>
      </div>
    </div>

    <!-- Счета -->
    <div v-else class="rounded-fifteen p-25px bg-white">
      <div class="empty-box">
        <p class="text-sm font-normal text-slate-custom mb-0 text-center">
          У вас пока нет счетов которые можно отобразить
        </p>
      </div>
    </div>

    <!-- POPUP: Новый плательщик -->
    <transition name="fade">
      <Popup :isOpen="isNewPayerOpen" :width="'640px'" @close="isNewPayerOpen = false">
        <div>
          <div class="flex items-start justify-between gap-15px mb-15px">
            <div class="min-w-0">
              <p class="text-xl font-semibold text-space mb-5px">Новый плательщик</p>
              <p class="text-sm font-normal text-slate-custom mb-0">
                Данные используются для выставления счетов
              </p>
            </div>
            <button class="shrink-0 text-slate-custom hover:text-space" @click="isNewPayerOpen = false">
              ✖
            </button>
          </div>

          <div class="mb-15px">
            <p class="text-sm font-medium text-space leading-150 mb-15px">Загрузить по ИНН</p>
            <div class="grid grid-cols-[1fr_auto] gap-15px items-end">
              <div ref="partySuggestRootEl" class="min-w-0 relative">
                <MyInput v-model="payerDraft.innLookup" inputmode="numeric" placeholder="Введите ИНН организации" />

                <div v-if="isPartySuggestOpen"
                  class="absolute left-0 right-0 top-full mt-2 rounded-ten border border-gallery bg-white shadow-lg z-10 overflow-hidden max-h-[170px] overflow-y-auto">
                  <div v-if="partySuggestLoading" class="px-15px py-11.5px text-sm text-slate-custom">
                    Загрузка...
                  </div>
                  <button v-for="s in partySuggestions"
                    :key="`${s?.data?.inn || '-'}-${s?.data?.ogrn || '-'}-${s?.data?.name?.full_with_opf || s?.data?.name?.full || s?.value || '-'}`"
                    type="button" class="w-full text-left px-15px py-11.5px hover:bg-athens transition-colors"
                    @click="selectPartySuggestion(s)">
                    <p class="text-sm font-medium text-space mb-2.5 truncate">
                      {{
                        s?.data?.name?.full ||
                        s?.data?.name?.full_with_opf ||
                        s?.data?.name?.short_with_opf ||
                        s?.unrestricted_value ||
                        s?.value ||
                        '—'
                      }}
                    </p>
                    <p class="text-xs font-normal text-slate-custom mb-0 truncate">
                      {{
                        [
                          s?.data?.inn ? `ИНН ${s.data.inn}` : null,
                          s?.data?.ogrn ? `ОГРН ${s.data.ogrn}` : null,
                          s?.data?.address?.data?.city_with_type ||
                          s?.data?.address?.data?.settlement_with_type ||
                          null,
                        ]
                          .filter(Boolean)
                          .join(' · ')
                      }}
                    </p>
                  </button>
                  <div v-if="!partySuggestLoading && partySuggestions.length === 0"
                    class="px-15px py-11.5px text-sm text-slate-custom">
                    Список пуст
                  </div>
                </div>
              </div>
              <UiButton variant="black" size="semiaction" :disabled="!canLookupInn || payerLookupLoading"
                @click="onInnLoadClick">
                {{ payerLookupLoading ? 'Загрузка...' : 'Загрузить' }}
              </UiButton>
            </div>
            <p v-if="partySuggestError" class="text-sm text-red-custom mt-10px mb-0">
              {{ partySuggestError }}
            </p>
            <p v-if="payerLookupError" class="text-sm text-red-custom mt-10px mb-0">
              {{ payerLookupError }}
            </p>
          </div>

          <div class="grid grid-cols-2 gap-x-15px gap-y-15px mb-25px">
            <div>
              <p class="text-sm font-medium text-space leading-150 mb-10px">Название компании</p>
              <p class="text-sm font-normal text-slate-custom mb-0">{{ payerDraft.companyName || '-' }}</p>
            </div>
            <div>
              <p class="text-sm font-medium text-space leading-150 mb-10px">Регион</p>
              <p class="text-sm font-normal text-slate-custom mb-0">{{ payerDraft.region || '-' }}</p>
            </div>
            <div>
              <p class="text-sm font-medium text-space leading-150 mb-10px">ИНН</p>
              <p class="text-sm font-normal text-slate-custom mb-0">{{ payerDraft.inn || '-' }}</p>
            </div>
            <div>
              <p class="text-sm font-medium text-space leading-150 mb-10px">ОГРН</p>
              <p class="text-sm font-normal text-slate-custom mb-0">{{ payerDraft.ogrn || '-' }}</p>
            </div>
            <div>
              <p class="text-sm font-medium text-space leading-150 mb-10px">Город</p>
              <p class="text-sm font-normal text-slate-custom mb-0">{{ payerDraft.city || '-' }}</p>
            </div>
            <div>
              <p class="text-sm font-medium text-space leading-150 mb-10px">Адрес</p>
              <p class="text-sm font-normal text-slate-custom mb-0">{{ payerDraft.address || '-' }}</p>
            </div>
          </div>

          <div class="flex gap-x-15px">
            <UiButton variant="action" size="semiaction" :disabled="!hasLoadedPayer || payerSaveLoading"
              @click="savePayer">
              {{ payerSaveLoading ? 'Сохранение...' : 'Сохранить' }}
            </UiButton>
            <UiButton variant="back" size="semiaction" @click="isNewPayerOpen = false">
              Отмена
            </UiButton>
          </div>
          <p v-if="payerSaveError" class="text-sm text-red-custom mt-10px mb-0">
            {{ payerSaveError }}
          </p>
        </div>
      </Popup>
    </transition>

    <!-- POPUP: Подтверждение выбора компании из подсказок -->
    <transition name="fade">
      <Popup :isOpen="isPartyConfirmOpen" :contentRounded="false" :contentPadding="false" :width="'520px'" @close="closePartyConfirm">
        <div>
          <div class="bg-white">
            <p class="text-xl font-semibold text-space mb-[10px]">
              {{ getSelectedCompanyName() }}
            </p>
            <p class="text-sm font-normal text-slate-custom mb-25px">
              {{ getSelectedCompanyAddress() }}
            </p>

            <div class="grid grid-cols-2 gap-x-25px gap-y-15px mb-35px">
              <div>
                <p class="text-xs font-semibold text-slate-custom mb-10px">ИНН</p>
                <p class="text-sm font-normal text-slate-custom mb-0">
                  {{ getSelectedCompanyInn() }}
                </p>
              </div>
              <div>
                <p class="text-xs font-semibold text-slate-custom mb-10px">ОГРН</p>
                <p class="text-sm font-normal text-slate-custom mb-0">
                  {{ getSelectedCompanyOgrn() }}
                </p>
              </div>
            </div>

            <UiButton variant="black" size="semiaction" @click="confirmPartySuggestion">
              Хорошо
            </UiButton>
          </div>
        </div>
      </Popup>
    </transition>

    <!-- POPUP: Подтверждение удаления плательщика -->
    <transition name="fade">
      <DeleteConfirmPopup
        :isOpen="isDeletePayerOpen"
        title="Удалить плательщика?"
        :loading="payerDeleteLoading"
        @close="closeDeletePayer"
        @confirm="confirmDeletePayer"
      >
        <span v-if="payerToDelete?.name">
          Вы уверены, что хотите удалить «{{ payerToDelete.name }}»?
        </span>
        <span v-else>
          Вы уверены, что хотите удалить плательщика?
        </span>
        <span v-if="payerDeleteError" class="block mt-10px text-red-custom">
          {{ payerDeleteError }}
        </span>
      </DeleteConfirmPopup>
    </transition>

    <!-- POPUP: Привязка новой карты -->
    <transition name="fade">
      <Popup :isOpen="isBindCardOpen" :width="'520px'" @close="isBindCardOpen = false">
        <div>
          <div class="flex items-start justify-between gap-15px mb-15px">
            <div class="min-w-0">
              <p class="text-xl font-semibold text-space mb-5px">Привязка новой карты</p>
              <p class="text-sm font-normal text-slate-custom mb-0">
                Данные карты будут использоваться только для оплаты. Подтверждение добавим позже.
              </p>
            </div>
            <button class="shrink-0 text-slate-custom hover:text-space" @click="isBindCardOpen = false">
              ✖
            </button>
          </div>

          <div class="mb-15px">
            <p class="text-sm font-medium text-space leading-150 mb-15px">Номер карты</p>
            <MyInput v-model="cardDraft.cardNumber" inputmode="numeric" placeholder="0000 0000 0000 0000" />
          </div>

          <div class="grid grid-cols-2 gap-x-15px gap-y-15px mb-15px">
            <div>
              <p class="text-sm font-medium text-space leading-150 mb-15px">Срок действия</p>
              <MyInput v-model="cardDraft.expiry" inputmode="numeric" placeholder="MM/YY" />
            </div>
            <div>
              <p class="text-sm font-medium text-space leading-150 mb-15px">CVC</p>
              <MyInput v-model="cardDraft.cvc" inputmode="numeric" placeholder="***" />
            </div>
          </div>

          <div class="mb-25px">
            <p class="text-sm font-medium text-space leading-150 mb-15px">Имя держателя</p>
            <MyInput v-model="cardDraft.holder" placeholder="IVAN IVANOV" />
          </div>

          <div class="flex gap-x-15px">
            <UiButton variant="action" size="semiaction" @click="isBindCardOpen = false">
              Привязать
            </UiButton>
            <UiButton variant="back" size="semiaction" @click="isBindCardOpen = false">
              Отмена
            </UiButton>
          </div>
        </div>
      </Popup>
    </transition>

    <!-- POPUP: Список счетов -->
    <transition name="fade">
      <Popup :isOpen="isInvoicesOpen" :width="'860px'" :maxHeight="true" :maxHeightValue="'80vh'"
        @close="isInvoicesOpen = false">
        <div>
          <div class="flex items-start justify-between gap-15px mb-15px">
            <div class="min-w-0">
              <p class="text-xl font-semibold text-space mb-5px">Список счетов</p>
              <p class="text-sm font-normal text-slate-custom mb-0">
                История счетов. Скачивание/оплата подключим на следующем шаге.
              </p>
            </div>
            <button class="shrink-0 text-slate-custom hover:text-space" @click="isInvoicesOpen = false">
              ✖
            </button>
          </div>

          <div class="overflow-hidden rounded-ten border border-gallery">
            <div class="grid grid-cols-[180px_140px_140px_1fr_160px] gap-x-15px px-15px py-11.5px bg-athens">
              <p class="text-xs font-semibold text-slate-custom mb-0">Счет</p>
              <p class="text-xs font-semibold text-slate-custom mb-0">Дата</p>
              <p class="text-xs font-semibold text-slate-custom mb-0">Сумма</p>
              <p class="text-xs font-semibold text-slate-custom mb-0">Статус</p>
              <p class="text-xs font-semibold text-slate-custom mb-0 text-right">Действия</p>
            </div>

            <div v-for="inv in invoices" :key="inv.id"
              class="grid grid-cols-[180px_140px_140px_1fr_160px] gap-x-15px px-15px py-15px border-t border-gallery items-center">
              <p class="text-sm font-medium text-space mb-0">{{ inv.id }}</p>
              <p class="text-sm font-normal text-slate-custom mb-0">{{ inv.date }}</p>
              <p class="text-sm font-normal text-slate-custom mb-0">{{ inv.amount }}</p>
              <p class="text-sm font-normal text-slate-custom mb-0">{{ inv.status }}</p>
              <div class="flex justify-end gap-x-10px">
                <UiButton variant="back" size="semiaction" disabled>
                  PDF
                </UiButton>
                <UiButton variant="action" size="semiaction" disabled>
                  Оплатить
                </UiButton>
              </div>
            </div>
          </div>

          <div class="flex justify-end mt-15px">
            <UiButton variant="back" size="semiaction" @click="isInvoicesOpen = false">
              Закрыть
            </UiButton>
          </div>
        </div>
      </Popup>
    </transition>
  </div>
</template>

<style scoped>
.page-wrap {
  display: flex;
  flex-direction: column;
  min-height: 0;
  height: 100%;
}

.tabs-row {
  display: flex;
  align-items: center;
  gap: 15px;
  flex-wrap: wrap;
}

.tab-btn {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 9.5px 15px;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 500;
  line-height: 1.2;
  color: #79869a;
  background: transparent;
  transition: background 0.2s ease-in-out, color 0.2s ease-in-out;
}

.tab-btn:hover {
  background: #f4f6f8;
  color: #3a4b62;
}

.tab-btn.active {
  background: #252d3c;
  color: #ffffff;
}

.tab-count {
  font-size: 12px;
  font-weight: 700;
  color: inherit;
  opacity: 0.7;
}

.tab-btn.active .tab-count {
  opacity: 0.85;
}

.empty-box {
  min-height: 240px;
  border-radius: 10px;
  background: #f4f6f8;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 25px;
}

/* Анимация появления и скрытия — как в других настройках */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
