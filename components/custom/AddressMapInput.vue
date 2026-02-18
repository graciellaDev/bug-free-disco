<template>
  <div class="address-map-input w-full">
    <div v-if="!hideAddress">
    <div class="relative mb-3">
      <div class="relative">
        <input
          type="text"
          v-model="currentAddress"
          :placeholder="isFocused ? '' : placeholder"
          class="w-full py-[9px] pl-[42px] pr-[42px] text-sm font-normal rounded-ten border bg-athens-gray text-[#2F353D] focus:outline-none focus:border-dodger"
          :class="error ? 'border-red-500' : 'border-athens'"
          @input="() => { filterAddresses(); autoGeocodeOnInput() }"
          @keydown.enter.prevent="onEnterKey"
          @focus="isFocused = true; emit('focus')"
          @blur="onInputBlur"
        />
        <button
          v-if="currentAddress"
          type="button"
          class="absolute top-2/4 right-4 -translate-y-1/2 text-slate-custom hover:text-space cursor-pointer"
          @click="clearAddress"
        >
          ✖
        </button>
      </div>
      <transition name="slide-fade">
        <ul
          v-if="filteredAddresses.length && currentAddress && isFocused"
          class="absolute left-0 right-0 top-full mt-1 max-h-52 overflow-y-auto bg-white border border-athens rounded-plus shadow-shadow-droplist z-20"
        >
          <li
            v-for="(addr, index) in filteredAddresses"
            :key="index"
            class="text-slate-custom text-sm font-normal py-10px px-15px hover:text-space hover:bg-zumthor cursor-pointer border-b border-athens last:border-b-0"
            @mousedown.prevent="selectAddress(addr)"
          >
            {{ addr.value }}
          </li>
        </ul>
        <div
          v-else-if="currentAddress && isFocused && !filteredAddresses.length"
          class="absolute left-0 right-0 top-full mt-1 bg-white border border-athens rounded-plus shadow-shadow-droplist z-20"
        >
          <div class="text-slate-custom text-sm font-normal py-10px px-15px">
            Адрес не найден
          </div>
        </div>
      </transition>
    </div>
    <div class="map-wrapper relative w-full h-[300px] rounded-ten border border-athens overflow-hidden">
      <div ref="mapContainer" class="absolute inset-0 w-full h-full" />
    </div>
    <div v-if="metroStations.length" class="mt-3">
      <p class="text-sm font-medium text-space mb-2">Ближайшие станции метро</p>
      <div class="flex flex-wrap gap-x-5px gap-y-2">
        <span
          v-for="(metro, idx) in metroStations"
          :key="idx"
          class="inline-flex items-center bg-zumthor text-dodger font-normal text-sm py-1 px-3 rounded-ten"
        >
          {{ metro }}
          <button
            type="button"
            class="ml-1 cursor-pointer hover:opacity-70 text-slate-custom hover:text-space"
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
      :id="'hide-work-address'"
      label="Не показывать адрес в вакансии"
      :model-value="hideAddress"
      @update:model-value="hideAddress = $event; emit('update:hideAddress', $event)"
      class="mt-3"
    />
  </div>
</template>

<script setup>
import { ref, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
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
})

const emit = defineEmits(['update:modelValue', 'update:hideAddress', 'focus', 'blur'])

const hideAddress = ref(props.hideAddress ?? false)

watch(() => props.hideAddress, (val) => {
  hideAddress.value = !!val
})

const mapContainer = ref(null)
const currentAddress = ref(props.modelValue || '')
const filteredAddresses = ref([])
const isFocused = ref(false)
const metroStations = ref([])

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
  const addr = currentAddress.value?.trim()
  if (addr) {
    setTimeout(() => geocodeAndShowOnMap(addr), 200)
  }
}

const onEnterKey = () => {
  if (filteredAddresses.value.length > 0) {
    selectAddress(filteredAddresses.value[0])
  } else if (currentAddress.value?.trim()) {
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
  const addr = currentAddress.value?.trim()
  if (addr) geocodeAndShowOnMap(addr)
}, 600)

const clearAddress = () => {
  currentAddress.value = ''
  filteredAddresses.value = []
  emit('update:modelValue', '')
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

watch(() => props.modelValue, (val) => {
  if (val !== currentAddress.value) {
    currentAddress.value = val || ''
    if (val && map && !placemark) {
      selectAddress({ value: val })
    }
  }
})

watch(hideAddress, async (hidden) => {
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

input {
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
</style>
