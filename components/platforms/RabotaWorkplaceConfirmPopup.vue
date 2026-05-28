<template>
  <Teleport to="body">
    <div
      v-if="props.open"
      class="fixed inset-0 z-[210] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="rabota-workplace-confirm-title"
    >
      <div class="absolute inset-0 bg-black/80" aria-hidden="true" @click="cancel" />
      <div
        class="relative w-full max-w-[560px] rounded-fifteen border border-athens bg-white shadow-lg flex flex-col"
        @click.stop
      >
        <div class="flex items-start justify-between gap-4 p-6 pb-4">
          <h2 id="rabota-workplace-confirm-title" class="text-xl font-semibold text-space">
            Подтверждение адреса работы
          </h2>
          <button
            type="button"
            class="shrink-0 text-slate-custom hover:text-space text-xl leading-none"
            aria-label="Закрыть"
            @click="cancel"
          >
            ✕
          </button>
        </div>

        <div class="px-6 pb-6 flex flex-col gap-4">
          <div class="w-full relative" ref="addressWrapperRef">
            <div class="relative">
              <svg-icon
                name="geo-label"
                width="20"
                height="20"
                class="absolute left-3 top-1/2 -translate-y-1/2 text-bali pointer-events-none z-10"
              />
              <input
                ref="addressInputRef"
                type="text"
                v-model="addressQuery"
                class="w-full min-h-10 py-[9px] pl-10 pr-10 text-sm rounded-ten bg-athens-gray text-[#2F353D] border outline-none focus:border-[#5898ff]"
                :class="addressError ? 'border-red-custom' : 'border-athens'"
                @focus="onAddressFocus"
                @blur="onAddressBlur"
                @input="onAddressInput"
                @keydown.esc="addressDropdownOpen = false"
                @keydown.enter.prevent="selectFirstDadata"
              />
              <button
                type="button"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-bali"
                tabindex="-1"
                @mousedown.prevent
                @click="toggleAddressDropdown"
              >
                <svg-icon
                  name="dropdown-arrow"
                  width="20"
                  height="20"
                  :class="addressDropdownOpen ? '' : 'rotate-180'"
                />
              </button>
            </div>
            <p v-if="addressError" class="text-xs text-red-custom mt-1">
              {{ addressError }}
            </p>

            <ul
              v-if="addressDropdownOpen && (dadataOptions.length || dadataLoading)"
              class="rabota-workplace-dadata-scroll absolute left-0 right-0 top-full max-h-52 overflow-y-auto overscroll-y-contain bg-white z-20 shadow-shadow-droplist rounded-plus border border-athens mt-1"
              @mousedown.prevent.capture
            >
              <li v-if="dadataLoading" class="text-slate-custom text-sm py-10px px-15px">
                Поиск…
              </li>
              <li
                v-for="(item, index) in dadataOptions"
                :key="`${item.value}-${index}`"
                class="text-sm text-slate-custom hover:text-space cursor-pointer hover:bg-zumthor py-10px px-15px border-b border-athens last:border-b-0"
                @mousedown.prevent="selectDadata(item)"
              >
                {{ getSuggestionDisplayValue(item) }}
              </li>
            </ul>
          </div>

          <div class="w-full">
            <MyInput
              placeholder="Название рабочего места"
              :model-value="workplaceName"
              @update:model-value="(v) => (workplaceName = v)"
            />
          </div>

          <div class="w-full">
            <textarea
              v-model="directions"
              rows="3"
              placeholder="Как нас найти"
              class="w-full py-[9px] px-15px text-sm rounded-ten bg-athens-gray text-[#2F353D] border border-athens resize-y min-h-[80px] outline-none focus:border-[#5898ff] placeholder:text-bali"
            />
          </div>

          <p v-if="saveError" class="text-xs text-red-custom">
            {{ saveError }}
          </p>
        </div>

        <div class="flex gap-3 px-6 pb-6">
          <button
            type="button"
            class="rounded-ten bg-dodger hover:bg-dodger/90 text-white py-2.5 px-5 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            :disabled="!canSave || saving"
            @click="save"
          >
            {{ saving ? 'Сохранение…' : 'Сохранить' }}
          </button>
          <button
            type="button"
            class="rounded-ten bg-athens-gray hover:bg-gallery text-space py-2.5 px-5 text-sm font-medium transition-colors"
            :disabled="saving"
            @click="cancel"
          >
            Отменить
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import { debounce } from '@/utils/debounce'
import MyInput from '~/components/custom/MyInput.vue'
import { updateRabotaWorkplace } from '@/utils/rabotaAccount'
import { suggestDadataAddress } from '@/utils/dadataAddressSuggest'

const props = defineProps({
  open: {
    type: Boolean,
    default: false,
  },
  workplace: {
    type: Object,
    default: null,
  },
  regionId: {
    type: [Number, String],
    default: null,
  },
})

const emit = defineEmits(['close', 'confirmed'])

const addressQuery = ref('')
const workplaceName = ref('')
const directions = ref('')
const selectedDadata = ref(null)
const dadataOptions = ref([])
const dadataLoading = ref(false)
const addressDropdownOpen = ref(false)
const addressError = ref('')
const saveError = ref('')
const saving = ref(false)
const addressInputRef = ref(null)
const addressWrapperRef = ref(null)

const resolvedRegionId = computed(() => {
  const region = props.workplace?.region
  if (region != null && typeof region === 'object' && region.id != null) {
    const n = Number(region.id)
    if (!Number.isNaN(n)) return n
  }
  const fromProp = props.regionId
  if (fromProp != null && fromProp !== '') {
    const n = Number(fromProp)
    if (!Number.isNaN(n)) return n
  }
  const fromWorkplace = props.workplace?.region_id ?? props.workplace?.regionId
  if (fromWorkplace != null && fromWorkplace !== '') {
    const n = Number(fromWorkplace)
    if (!Number.isNaN(n)) return n
  }
  return null
})

/** Адрес выбран из списка DaData без ошибки валидации */
const isAddressConfirmed = computed(() => {
  if (!selectedDadata.value?.value || addressError.value) return false
  return hasLocality(selectedDadata.value.data)
})

const canSave = computed(() => {
  if (saving.value) return false
  return isAddressConfirmed.value && !!workplaceName.value?.trim()
})

/** Данные адреса из подсказки DaData suggest/address */
function getSuggestionAddressData(suggestion) {
  return suggestion?.data
}

function getSuggestionDisplayValue(suggestion) {
  return suggestion?.value ?? suggestion?.unrestricted_value ?? ''
}

/** Название улицы для PUT name — из первого поля (DaData street или значение адреса) */
function getStreetNameForPayload() {
  const data = selectedDadata.value?.data
  if (data && typeof data === 'object') {
    const street = data.street_with_type ?? data.street
    if (street != null && String(street).trim()) return String(street).trim()
  }
  return String(addressQuery.value ?? selectedDadata.value?.value ?? '').trim()
}

/** region.name из элемента справочника workplaces (GET /rabota/dictionaries/workplaces) */
function getWorkplaceRegionName(workplace) {
  if (!workplace || typeof workplace !== 'object') return ''
  const region = workplace.region
  if (region != null && typeof region === 'object') {
    return String(
      region.name ?? region.title ?? region.city ?? region.region ?? '',
    ).trim()
  }
  if (typeof region === 'string' && region.trim()) return region.trim()
  return ''
}

function normalizeAddressSuggestion(suggestion) {
  const addressData = getSuggestionAddressData(suggestion)
  const value = getSuggestionDisplayValue(suggestion)
  return { value, data: addressData, _raw: suggestion }
}

function hasLocality(data) {
  if (!data || typeof data !== 'object') return false
  return !!(
    data.city ||
    data.settlement ||
    data.city_with_type ||
    data.settlement_with_type ||
    data.region ||
    data.region_with_type ||
    data.area
  )
}

function validateAddressSelection() {
  if (!selectedDadata.value) {
    addressError.value = 'Выберите адрес из списка'
    return false
  }
  if (!hasLocality(selectedDadata.value.data)) {
    addressError.value = 'Адрес должен содержать название населенного пункта'
    return false
  }
  addressError.value = ''
  return true
}

const fetchDadata = debounce(async (query) => {
  const q = String(query ?? '').trim()
  if (q.length < 2) {
    dadataOptions.value = []
    dadataLoading.value = false
    return
  }
  dadataLoading.value = true
  try {
    const res = await suggestDadataAddress(q)
    dadataOptions.value = Array.isArray(res?.suggestions) ? res.suggestions : []
  } catch (e) {
    console.warn('suggestDadataAddress:', e)
    dadataOptions.value = []
  } finally {
    dadataLoading.value = false
  }
}, 300)

function resetForm() {
  addressQuery.value = ''
  workplaceName.value = ''
  directions.value = ''
  selectedDadata.value = null
  dadataOptions.value = []
  addressError.value = ''
  saveError.value = ''
  addressDropdownOpen.value = false
}

function initFromWorkplace(workplace) {
  if (!workplace) return
  const initialAddress =
    workplace.address ??
    workplace.full_address ??
    workplace.name ??
    ''
  addressQuery.value = String(initialAddress)
  workplaceName.value =
    getWorkplaceRegionName(workplace) ||
    String(workplace.short_name ?? workplace.name ?? '').trim()
  directions.value = String(workplace.directions ?? workplace.how_to_find ?? '').trim()
  selectedDadata.value = null
  addressError.value = ''
  saveError.value = ''
}

function onAddressFocus() {
  addressDropdownOpen.value = true
  if (addressQuery.value.trim().length >= 2) {
    fetchDadata(addressQuery.value)
  }
}

function onAddressBlur() {
  setTimeout(() => {
    addressDropdownOpen.value = false
    if (selectedDadata.value?.value) {
      addressQuery.value = selectedDadata.value.value
    }
    validateAddressSelection()
  }, 200)
}

function onAddressInput() {
  selectedDadata.value = null
  addressError.value = ''
  saveError.value = ''
  addressDropdownOpen.value = true
  fetchDadata(addressQuery.value)
}

function toggleAddressDropdown() {
  addressDropdownOpen.value = !addressDropdownOpen.value
  if (addressDropdownOpen.value && addressQuery.value.trim().length >= 2) {
    fetchDadata(addressQuery.value)
  }
  addressInputRef.value?.focus()
}

function selectDadata(item) {
  const normalized = normalizeAddressSuggestion(item)
  selectedDadata.value = normalized
  addressQuery.value = normalized.value
  addressDropdownOpen.value = false
  addressError.value = hasLocality(normalized.data)
    ? ''
    : 'Адрес должен содержать название населенного пункта'
}

function selectFirstDadata() {
  if (dadataOptions.value.length > 0) {
    selectDadata(dadataOptions.value[0])
  }
}

function normalizeSubwayStations(raw) {
  if (!Array.isArray(raw)) return undefined
  const list = raw
    .map((item) => {
      const id = typeof item === 'object' && item != null ? item.id : item
      const num = Number(id)
      return Number.isNaN(num) ? null : { id: num }
    })
    .filter(Boolean)
  return list.length ? list : undefined
}

function normalizeConfirmedWorkplace(apiData, fallbackName) {
  const item = apiData?.data ?? apiData ?? {}
  const id = item.id ?? props.workplace?.id
  const name = String(
    item.address ?? item.name ?? item.title ?? fallbackName ?? '',
  ).trim()
  const kladr_id =
    Object.prototype.hasOwnProperty.call(item, 'kladr_id') ? item.kladr_id : item.kladrId
  const result = { id, name }
  if (kladr_id !== undefined) result.kladr_id = kladr_id
  return result
}

async function save() {
  if (!validateAddressSelection() || !canSave.value || saving.value) return
  if (resolvedRegionId.value == null || Number.isNaN(resolvedRegionId.value)) {
    saveError.value = 'Не указан регион (region.id) для выбранного адреса'
    return
  }
  const workplaceId = props.workplace?.id
  if (workplaceId == null) {
    saveError.value = 'Не указан идентификатор рабочего места'
    return
  }

  const data = selectedDadata.value?.data ?? {}
  const lat = Number(data.geo_lat)
  const lon = Number(data.geo_lon)
  if (Number.isNaN(lat) || Number.isNaN(lon)) {
    addressError.value = 'Не удалось определить координаты адреса'
    return
  }

  const payload = {
    name: getStreetNameForPayload(),
    address: selectedDadata.value.value,
    region_id: resolvedRegionId.value,
    geopoint: { latitude: lat, longitude: lon },
    subway_stations: normalizeSubwayStations(
      props.workplace?.subway_stations ?? props.workplace?.metro,
    ),
  }

  saving.value = true
  saveError.value = ''
  try {
    const result = await updateRabotaWorkplace(workplaceId, payload)
    if (result?.error) {
      saveError.value = result.error
      return
    }
    emit('confirmed', normalizeConfirmedWorkplace(result.data, payload.name))
    emit('close')
  } catch (e) {
    console.warn('updateRabotaWorkplace:', e)
    saveError.value = 'Не удалось сохранить адрес'
  } finally {
    saving.value = false
  }
}

function cancel() {
  emit('close')
}

watch(
  () => [props.open, props.workplace],
  async ([open]) => {
    if (!open) {
      resetForm()
      fetchDadata.cancel?.()
      return
    }
    initFromWorkplace(props.workplace)
    await nextTick()
    addressDropdownOpen.value = true
    const initialQuery = addressQuery.value.trim()
    if (initialQuery.length >= 2) {
      fetchDadata(initialQuery)
      fetchDadata.flush?.()
    }
    addressInputRef.value?.focus()
  },
  { immediate: true },
)
</script>

<style scoped>
.rabota-workplace-dadata-scroll {
  scrollbar-width: thin;
  scrollbar-color: #c5cad8 transparent;
}

.rabota-workplace-dadata-scroll::-webkit-scrollbar {
  width: 6px;
}

.rabota-workplace-dadata-scroll::-webkit-scrollbar-thumb {
  background-color: #c5cad8;
  border-radius: 3px;
}
</style>
