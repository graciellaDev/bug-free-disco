<template>
  <div
    class="address-map-input w-full"
    :class="
      layout === 'inline'
        ? 'address-map-input--inline w-[280px] max-w-full shrink-0'
        : ''
    "
  >
    <!-- Строка поля вкладки «Поля»: пунктир + подсказки Яндекса без карты -->
    <div
      v-if="layout === 'inline'"
      class="plain-fields-leader-outer relative z-[5]"
    >
      <div
        class="plain-fields-leader-shell"
        :class="{ 'plain-fields-leader-shell--error': error }"
        :style="shellInlineStyle"
      >
        <div class="plain-fields-leader-input-row">
          <input
            ref="inlineInputRef"
            v-model="currentAddress"
            type="text"
            class="plain-inline-text-input plain-inline-text-input--leader-fullwidth m-0 border-0 bg-transparent p-0 text-right text-sm font-normal leading-normal text-space shadow-none outline-none ring-0 placeholder:text-bali focus:outline-none focus:ring-0"
            :placeholder="
              isFocused ? undefined : placeholder || undefined
            "
            autocomplete="off"
            @input="onInlineInput"
            @keydown.enter.prevent="onEnterKey"
            @focus="
              isFocused = true;
              emit('focus');
            "
            @blur="onInputBlur"
          />
          <button
            v-if="showInlineClear"
            type="button"
            class="plain-fields-leader-clear"
            aria-label="Очистить адрес"
            @click="clearAddress"
            @mousedown.prevent
          >
            <svg
              class="plain-fields-leader-clear-svg"
              width="14"
              height="14"
              viewBox="0 0 14 14"
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M4 4l6 6M10 4L4 10"
                fill="none"
                stroke="currentColor"
                stroke-width="1.1"
                stroke-linecap="round"
              />
            </svg>
          </button>
        </div>
      </div>
      <transition name="slide-fade">
        <ul
          v-if="filteredAddresses.length && currentAddress && isFocused"
          class="absolute left-auto right-0 top-full z-[10030] mt-1 max-h-52 w-max min-w-[200px] max-w-[280px] overflow-y-auto rounded-plus border border-athens bg-white shadow-shadow-droplist"
          role="listbox"
        >
          <li
            v-for="(addr, index) in filteredAddresses"
            :key="index"
            role="option"
            class="cursor-pointer break-words border-b border-athens py-10px px-15px text-left text-sm font-normal leading-snug text-slate-custom last:border-b-0 hover:bg-zumthor hover:text-space"
            @mousedown.prevent="selectAddress(addr)"
          >
            {{ addr.value }}
          </li>
        </ul>
        <div
          v-else-if="
            currentAddress && isFocused && !filteredAddresses.length && ymapsReady
          "
          class="absolute left-auto right-0 top-full z-[10030] mt-1 w-max min-w-[200px] max-w-[280px] rounded-plus border border-athens bg-white shadow-shadow-droplist"
        >
          <div class="py-10px px-15px text-sm font-normal text-slate-custom">
            Адрес не найден
          </div>
        </div>
      </transition>
    </div>

    <template v-else>
      <div v-if="!hideAddress">
        <div class="relative mb-3">
          <div class="relative">
            <input
              type="text"
              v-model="currentAddress"
              :placeholder="isFocused ? '' : placeholder"
              class="w-full rounded-ten border bg-athens-gray py-[9px] pl-[42px] pr-[42px] text-sm font-normal text-[#2F353D] focus:border-dodger focus:outline-none"
              :class="error ? 'border-red-500' : 'border-athens'"
              @input="
                () => {
                  filterAddresses();
                  autoGeocodeOnInput();
                }
              "
              @keydown.enter.prevent="onEnterKey"
              @focus="
                isFocused = true;
                emit('focus');
              "
              @blur="onInputBlur"
            />
            <button
              v-if="currentAddress"
              type="button"
              class="absolute top-2/4 right-4 -translate-y-1/2 cursor-pointer text-slate-custom hover:text-space"
              @click="clearAddress"
            >
              ✖
            </button>
          </div>
          <transition name="slide-fade">
            <ul
              v-if="filteredAddresses.length && currentAddress && isFocused"
              class="absolute left-0 right-0 top-full z-20 mt-1 max-h-52 overflow-y-auto rounded-plus border border-athens bg-white shadow-shadow-droplist"
            >
              <li
                v-for="(addr, index) in filteredAddresses"
                :key="index"
                class="cursor-pointer border-b border-athens py-10px px-15px text-sm font-normal text-slate-custom last:border-b-0 hover:bg-zumthor hover:text-space"
                @mousedown.prevent="selectAddress(addr)"
              >
                {{ addr.value }}
              </li>
            </ul>
            <div
              v-else-if="currentAddress && isFocused && !filteredAddresses.length"
              class="absolute left-0 right-0 top-full z-20 mt-1 rounded-plus border border-athens bg-white shadow-shadow-droplist"
            >
              <div class="py-10px px-15px text-sm font-normal text-slate-custom">
                Адрес не найден
              </div>
            </div>
          </transition>
        </div>
        <div
          class="map-wrapper relative h-[300px] w-full overflow-hidden rounded-ten border border-athens"
        >
          <div ref="mapContainer" class="absolute inset-0 h-full w-full" />
        </div>
        <div v-if="metroStations.length" class="mt-3">
          <p class="mb-2 text-sm font-medium text-space">Ближайшие станции метро</p>
          <div class="flex flex-wrap gap-x-5px gap-y-2">
            <span
              v-for="(metro, idx) in metroStations"
              :key="idx"
              class="inline-flex items-center rounded-ten bg-zumthor py-1 px-3 text-sm font-normal text-dodger"
            >
              {{ metro }}
              <button
                type="button"
                class="ml-1 cursor-pointer text-slate-custom hover:text-space hover:opacity-70"
                @click="removeMetroStation(idx)"
                aria-label="Удалить"
              >
                <svg-icon name="reset-tag" width="16" height="16" />
              </button>
            </span>
          </div>
        </div>
      </div>
      <MyCheckbox
        id="hide-work-address"
        label="Не показывать адрес в вакансии"
        :model-value="hideAddress"
        class="mt-3"
        @update:model-value="
          hideAddress = $event;
          emit('update:hideAddress', $event);
        "
      />
    </template>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, onBeforeUnmount, nextTick, computed } from 'vue'
import debounce from 'lodash/debounce'
import { loadScript } from '@/plugins/loader'
import { API_YANDEX_KEY, API_YANDEX_SUGGEST } from '@/src/constants'
import MyCheckbox from '~/components/custom/MyCheckbox.vue'

const props = defineProps({
  placeholder: {
    type: String,
    default: 'Введите адрес, метро или название компании',
  },
  modelValue: {
    type: String,
    default: '',
  },
  error: {
    type: Boolean,
    default: false,
  },
  hideAddress: {
    type: Boolean,
    default: false,
  },
  /** full — карта и чекбокс (вакансия); inline — только подсказки, строка как во вкладке «Поля» */
  layout: {
    type: String,
    default: 'full',
    validator: v => v === 'full' || v === 'inline',
  },
})

const emit = defineEmits(['update:modelValue', 'update:hideAddress', 'focus', 'blur'])

const hideAddress = ref(props.hideAddress ?? false)

watch(() => props.hideAddress, (val) => {
  hideAddress.value = !!val
})

const mapContainer = ref(null)
const inlineInputRef = ref(null)
const currentAddress = ref(props.modelValue || '')
const filteredAddresses = ref([])
const isFocused = ref(false)
const metroStations = ref([])
const ymapsReady = ref(false)

const LEADER_CLEAR_TRAIL_PX = 18
const textReservePx = ref(6)
const showInlineClear = computed(
  () => props.layout === 'inline' && !!String(currentAddress.value || '').trim()
)
const shellInlineStyle = computed(() => {
  if (props.layout !== 'inline') return {}
  const clearExtra = showInlineClear.value ? LEADER_CLEAR_TRAIL_PX : 0
  return {
    '--plain-leader-reserve': `${textReservePx.value + clearExtra}px`,
  }
})

function measureInlineTextReserve() {
  if (props.layout !== 'inline') return
  const el = inlineInputRef.value
  const raw = currentAddress.value ?? ''
  if (!el) {
    textReservePx.value = raw.trim() ? 12 : 6
    return
  }
  if (!raw.trim()) {
    textReservePx.value = 6
    return
  }
  const style = getComputedStyle(el)
  const font = `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`
  const span = document.createElement('span')
  span.style.cssText =
    'position:absolute;left:-99999px;top:0;white-space:pre;pointer-events:none;'
  span.style.font = font
  span.textContent = raw
  document.body.appendChild(span)
  const w = span.offsetWidth
  document.body.removeChild(span)
  textReservePx.value = Math.max(6, Math.ceil(w) + 8)
}

function onInlineInput() {
  filterAddresses()
  nextTick(() => measureInlineTextReserve())
}

let map = null
let placemark = null

const RADIUS_M = 5000

const formatMetroName = (name) => {
  if (!name || typeof name !== 'string') return name
  return name
    .replace(/^станция\s+метро\s+/i, 'м. ')
    .replace(/^метро\s+/i, 'м. ')
}

const fetchMetroStations = async (coords) => {
  const ym = typeof window !== 'undefined' ? window.ymaps : null
  if (!ym || !coords || !Array.isArray(coords)) return
  try {
    const res = await ym.geocode(coords, { kind: 'metro', results: 20 })
    const names = []
    const coordSystem = ym.coordSystem?.geo
    res.geoObjects.each((obj) => {
      const name = obj.properties?.get?.('name') || obj.properties?.get?.('description')
      if (!name || names.includes(name)) return
      if (coordSystem && typeof coordSystem.getDistance === 'function') {
        try {
          const metroCoords = obj.geometry?.getCoordinates?.()
          if (metroCoords && Array.isArray(metroCoords)) {
            const dist = coordSystem.getDistance(coords, metroCoords)
            if (dist > RADIUS_M) return
          }
        } catch (_) {}
      }
      names.push(formatMetroName(name))
    })
    metroStations.value = names
  } catch (e) {
    console.warn('ymaps metro geocode error:', e)
    metroStations.value = []
  }
}

const removeMetroStation = (index) => {
  metroStations.value = metroStations.value.filter((_, i) => i !== index)
}

const DEFAULT_CENTER = [59.9343, 30.3351] // Санкт-Петербург

const onInputBlur = () => {
  isFocused.value = false
  emit('blur')
  if (props.layout !== 'full') return
  const addr = currentAddress.value?.trim()
  if (addr) {
    setTimeout(() => geocodeAndShowOnMap(addr), 200)
  }
}

const onEnterKey = () => {
  if (filteredAddresses.value.length > 0) {
    selectAddress(filteredAddresses.value[0])
  } else if (currentAddress.value?.trim() && props.layout === 'full') {
    geocodeAndShowOnMap(currentAddress.value.trim())
  }
}

const updateAddressFromCoords = async (coords) => {
  const ym = typeof window !== 'undefined' ? window.ymaps : null
  if (!ym || !coords) return
  let addressStr = `${coords[0].toFixed(6)}, ${coords[1].toFixed(6)}`
  try {
    const res = await ym.geocode(coords)
    const geoObject = res.geoObjects.get(0)
    if (geoObject) {
      const addr = (typeof geoObject.getAddressLine === 'function' ? geoObject.getAddressLine() : null)
        || geoObject.properties.get('name')
        || geoObject.properties.get('description')
      if (addr) addressStr = addr
    }
  } catch (err) {
    console.warn('Reverse geocode error:', err)
  }
  currentAddress.value = addressStr
  emit('update:modelValue', addressStr)
  fetchMetroStations(coords)
}

const createPlacemark = (ym, coords) => {
  const pm = new ym.Placemark(coords, {}, {
    preset: 'islands#redIcon',
    draggable: true,
    hasBalloon: false,
    openBalloonOnClick: false,
  })
  pm.events.add('dragend', async () => {
    const newCoords = pm.geometry.getCoordinates()
    map.setCenter(newCoords, 16, { duration: 300 })
    await updateAddressFromCoords(newCoords)
  })
  return pm
}

const geocodeAndShowOnMap = async (addressStr) => {
  const ym = typeof window !== 'undefined' ? window.ymaps : null
  if (!ym || !map || !addressStr) return
  try {
    const res = await ym.geocode(addressStr)
    const geoObject = res.geoObjects.get(0)
    if (geoObject) {
      const coords = geoObject.geometry.getCoordinates()
      if (placemark) map.geoObjects.remove(placemark)
      placemark = createPlacemark(ym, coords)
      map.geoObjects.add(placemark)
      map.setCenter(coords, 16, { duration: 300 })
      fetchMetroStations(coords)
    }
  } catch (e) {
    console.warn('ymaps.geocode error:', e)
  }
}

const filterAddresses = debounce(async () => {
  const input = currentAddress.value?.trim()
  const ym = typeof window !== 'undefined' ? window.ymaps : null
  if (!input || !ym) {
    filteredAddresses.value = []
    return
  }
  try {
    const addresses = await ym.suggest(input)
    filteredAddresses.value = addresses || []
  } catch (e) {
    console.warn('ymaps.suggest error:', e)
    filteredAddresses.value = []
  }
}, 300)

// Автоматически ставить метку при вводе адреса (без Enter)
const autoGeocodeOnInput = debounce(() => {
  if (props.layout !== 'full') return
  const addr = currentAddress.value?.trim()
  if (addr) geocodeAndShowOnMap(addr)
}, 600)

const clearAddress = () => {
  currentAddress.value = ''
  filteredAddresses.value = []
  emit('update:modelValue', '')
  if (props.layout === 'inline') {
    nextTick(() => measureInlineTextReserve())
    return
  }
  if (map && placemark) {
    map.geoObjects.remove(placemark)
    placemark = null
    map.setCenter(DEFAULT_CENTER, 10)
    metroStations.value = []
  }
}

const selectAddress = async (addr) => {
  const addressStr = addr.value
  currentAddress.value = addressStr
  filteredAddresses.value = []
  isFocused.value = false
  emit('update:modelValue', addressStr)
  if (props.layout === 'inline') {
    nextTick(() => measureInlineTextReserve())
    return
  }

  const ym = typeof window !== 'undefined' ? window.ymaps : null
  if (!ym || !map) return
  try {
    const res = await ym.geocode(addressStr)
    const geoObject = res.geoObjects.get(0)
    if (geoObject) {
      const coords = geoObject.geometry.getCoordinates()
      if (placemark) map.geoObjects.remove(placemark)
      placemark = createPlacemark(ym, coords)
      map.geoObjects.add(placemark)
      map.setCenter(coords, 16, { duration: 300 })
      fetchMetroStations(coords)
    }
  } catch (e) {
    console.warn('ymaps.geocode error:', e)
  }
}

const onMapClick = async (e) => {
  const coords = e.get('coords')
  if (!coords || !map) return
  const ym = typeof window !== 'undefined' ? window.ymaps : null
  if (!ym) return
  filteredAddresses.value = []
  if (placemark) map.geoObjects.remove(placemark)
  placemark = createPlacemark(ym, coords)
  map.geoObjects.add(placemark)
  map.setCenter(coords, 16, { duration: 300 })
  await updateAddressFromCoords(coords)
}

/** Ждём появления window.ymaps после загрузки скрипта (API инициализируется асинхронно) */
const waitForYmaps = (maxMs = 8000) =>
  new Promise((resolve) => {
    if (typeof window !== 'undefined' && window.ymaps) {
      resolve(window.ymaps)
      return
    }
    const start = Date.now()
    const t = setInterval(() => {
      if (typeof window !== 'undefined' && window.ymaps) {
        clearInterval(t)
        resolve(window.ymaps)
        return
      }
      if (Date.now() - start >= maxMs) {
        clearInterval(t)
        resolve(null)
      }
    }, 80)
  })

const initMap = () => {
  const ym = typeof window !== 'undefined' ? window.ymaps : null
  if (!mapContainer.value || !ym) return false
  ym.ready(() => {
    if (!mapContainer.value) return
    map = new ym.Map(mapContainer.value, {
      center: DEFAULT_CENTER,
      zoom: 10,
      controls: ['zoomControl', 'geolocationControl'],
    }, {
      suppressMapOpenBlock: true,
    })
    map.events.add('click', onMapClick)
    if (map.container?.fitToViewport) {
      map.container.fitToViewport()
    }
    if (currentAddress.value) {
      selectAddress({ value: currentAddress.value })
    }
  })
  return true
}

onMounted(async () => {
  if (typeof window === 'undefined') return
  const scriptUrl = `https://api-maps.yandex.ru/2.1/?lang=ru_RU&apikey=${API_YANDEX_KEY}&suggest_apikey=${API_YANDEX_SUGGEST}&results=10`
  if (!document.querySelector(`script[src="${scriptUrl}"]`)) {
    try {
      await loadScript(scriptUrl)
    } catch (e) {
      console.warn('Yandex Maps load error:', e)
      return
    }
  }
  await waitForYmaps()
  ymapsReady.value = !!(
    typeof window !== 'undefined' && window.ymaps
  )
  if (props.layout === 'inline') {
    await nextTick()
    measureInlineTextReserve()
    return
  }
  await nextTick()
  if (!initMap() && mapContainer.value) {
    await nextTick()
    setTimeout(() => initMap(), 150)
  }
})

onBeforeUnmount(() => {
  if (map) {
    map.events.remove('click', onMapClick)
    map.destroy()
    map = null
  }
})

watch(() => props.modelValue, val => {
  if (val !== currentAddress.value) {
    currentAddress.value = val || ''
    if (
      props.layout === 'full' &&
      val &&
      map &&
      !placemark
    ) {
      selectAddress({ value: val })
    }
    if (props.layout === 'inline') {
      nextTick(() => measureInlineTextReserve())
    }
  }
})

watch(hideAddress, async hidden => {
  if (props.layout !== 'full') return
  if (hidden) {
    if (map) {
      map.events.remove('click', onMapClick)
      map.destroy()
      map = null
      placemark = null
    }
  } else {
    await nextTick()
    if (!mapContainer.value || map) return
    if (typeof window !== 'undefined' && !window.ymaps) {
      await waitForYmaps()
    }
    await nextTick()
    if (!initMap()) {
      setTimeout(() => initMap(), 200)
    }
  }
})
</script>

<style scoped>
input::placeholder {
  color: #9098b4;
  font-size: 14px;
  font-weight: 400;
  font-family: 'Inter', sans-serif;
}

.address-map-input:not(.address-map-input--inline) input {
  background-image: url('../../assets/sprite/svg/search.svg');
  background-repeat: no-repeat;
  background-position: 15px center;
}

.slide-fade-enter-active {
  transition: all 0.3s ease-out;
}

.slide-fade-leave-active {
  transition: all 0.3s cubic-bezier(1, 0.5, 0.8, 1);
}

.slide-fade-enter-from,
.slide-fade-leave-to {
  transform: translateY(-4px);
  opacity: 0;
}

/* Скрыть лишние надписи Яндекс.Карт: "Как добраться", "Создать свою карту" */
.map-wrapper :deep([class*='map-copyrights-promo']),
.map-wrapper :deep([class*='copyrights-promo']),
.map-wrapper :deep([class*='map-open-block']),
.map-wrapper :deep(a[href*='build_route']),
.map-wrapper :deep(a[href*='rtext=']),
.map-wrapper :deep(a[href*='/create']),
.map-wrapper :deep(a[href*='constructor']) {
  display: none !important;
}

/* Как PlainInlineTextInput leader-full-width (вкладка «Поля») */
.address-map-input--inline .plain-fields-leader-outer {
  flex: 1 1 0;
  min-width: 0;
  box-sizing: border-box;
  transform: translateY(-0.28em);
}
.address-map-input--inline .plain-fields-leader-shell {
  position: relative;
  display: flex;
  min-width: 0;
  flex: 1 1 0;
  flex-direction: column;
  justify-content: flex-end;
  box-sizing: border-box;
}
.address-map-input--inline .plain-fields-leader-shell::after {
  content: '';
  position: absolute;
  left: 0;
  bottom: 0;
  width: max(0px, calc(100% - var(--plain-leader-reserve, 6px)));
  height: 0;
  border-bottom: 1px dotted #c5cdd5;
  pointer-events: none;
  z-index: 0;
}
.address-map-input--inline .plain-fields-leader-shell--error::after {
  border-bottom-color: #ef4444;
}
.address-map-input--inline .plain-fields-leader-input-row {
  position: relative;
  z-index: 1;
  display: flex;
  min-width: 0;
  width: 100%;
  flex-direction: row;
  align-items: flex-end;
  gap: 0.25rem;
}
.address-map-input--inline .plain-inline-text-input--leader-fullwidth {
  flex: 1 1 0;
  display: block;
  min-width: 0;
  width: 100%;
  min-height: 0;
  height: auto;
  line-height: 1.25;
  transform: translateY(calc(0.08em + 2px));
}
.address-map-input--inline .plain-fields-leader-clear {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 14px;
  height: 14px;
  margin: 0;
  padding: 0;
  border: 0;
  border-radius: 0;
  color: #79869a;
  background: transparent !important;
  cursor: pointer;
  line-height: 0;
  transform: translateY(calc(-0.12em + 4px));
}
.address-map-input--inline .plain-fields-leader-clear-svg {
  display: block;
  flex-shrink: 0;
  opacity: 0.92;
}
</style>
