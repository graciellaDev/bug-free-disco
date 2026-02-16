<script setup>
import Autocomplete from '~/components/custom/Autocomplete.vue'
import MyInput from '~/components/custom/MyInput.vue'
import MyTooltip from '~/components/custom/MyTooltip.vue'
import TiptapEditor from '~/components/TiptapEditor.vue'
import MyDropdown from '~/components/custom/MyDropdown.vue'
import MyAccordion from '~/components/custom/MyAccordion.vue'
import MyCheckbox from '~/components/custom/MyCheckbox.vue'
import SalaryRange from '~/components/custom/SalaryRange.vue'
import { parseHtmlToJson } from '~/utils/htmlParser'
import GeoInput from '~/components/custom/GeoInput.vue'
import AddressMapInput from '~/components/custom/AddressMapInput.vue'
import ResponseInput from '~/components/custom/ResponseInput.vue'
import CheckboxGroup from '~/components/custom/CheckboxGroup.vue'
import PhoneInput from '~/components/custom/PhoneInput.vue'
import EmailInput from '~/components/custom/EmailInput.vue'
import CustomDropdown from '~/components/custom/CustomDropdown.vue'
import GenerateButton from '~/components/custom/GenerateButton.vue'
import MyTextarea from '~/components/custom/MyTextarea.vue'
import DropdownCalendarStatic from '~/components/custom/DropdownCalendarStatic.vue'
import SpecializationSelector from '~/components/custom/SpecializationSelector.vue'
import MultiSelect from '~/components/custom/MultiSelect.vue'
import SkillsDropdown from '~/components/custom/SkillsDropdown.vue'
import { getDepartments, executorsList } from '~/utils/executorsList'
import { useRoute } from 'vue-router'
import { createError } from '#app'
import { getRoles as getRolesHh, getLanguages, getLanguageLevels } from '@/utils/hhAccount'

import schedule from '~/src/data/work-schedule.json'
import experience from '~/src/data/experience.json'
import education from '~/src/data/education.json'
import currency from '~/src/data/currency.json'
import AccordionAdditional from '~/src/data/accordion-additional.json'
import CarId from '~/src/data/car-id.json'
import MoreOptions from '~/src/data/more-options.json'
import industry from '~/src/data/industry.json'
import specialization from '~/src/data/specialization.json'

import { ref, computed, watch, onBeforeMount, onMounted, onBeforeUnmount, nextTick, inject } from 'vue'
import { createVacancy } from '~/utils/createVacancy'
import { getPhrases, getVacancy } from '@/utils/getVacancies'
import { updateVacancy } from '~/utils/updateVacancy'
import { fetchApplicationDetail } from '~/utils/applicationItem'
import majors from '~/src/data/majors.json'
import { convertDateFromApi } from '~/helpers/date'

const ArraySpecialization = specialization
const ArrayOptions = MoreOptions
const ArrayCarId = CarId
const ArrayAdditional = AccordionAdditional
const ArrayCurrency = currency
const ArrayEducation = education
const ArrayExperience = experience
const ArraySchedule = schedule
const workHoursPerDayOptions = [
  { name: '2', value: '2' }, { name: '3', value: '3' }, { name: '4', value: '4' },
  { name: '5', value: '5' }, { name: '6', value: '6' }, { name: '7', value: '7' },
  { name: '8', value: '8' }, { name: '9', value: '9' }, { name: '10', value: '10' },
  { name: '11', value: '11' }, { name: '12', value: '12' }, { name: '24', value: '24' },
  { name: 'По договорённости', value: 'По договорённости' }, { name: 'Другое', value: 'Другое' },
]
const ArrayMajors = majors
const ArrayIndustry = industry

// Данные отраслей и специализаций из hh.ru
const hhRolesData = ref(null)
const hhIndustries = ref([])

const props = defineProps({
  id: {
    type: String,
    default: null,
  },
  application: {
    type: Object,
    default: null,
  },
  type: {
    type: String,
    default: 'create',
  }
})

const emit = defineEmits(['goToPublish'])


// Тип сотрудника: постоянный или временный — определяет опции «Тип занятости»
const employeeTypeOptions = [
  { id: 'permanent', name: 'Постоянного' },
  { id: 'temporary', name: 'Временного' },
]
const employmentOptionsPermanent = [
  { id: 'FULL', name: 'Полная', siteName: 'Полная' },
  { id: 'PART', name: 'Частичная', siteName: 'Частичная' },
  { id: 'FLY_IN_FLY_OUT', name: 'Вахта', siteName: 'Вахта' },
]
const employmentOptionsTemporary = [
  { id: 'PROJECT', name: 'Проект', siteName: 'Временная' },
  { id: 'SIDE_JOB', name: 'Подработка', siteName: 'Подработка' },
]
const employeeType = ref('permanent')
const employmentOptions = computed(() =>
  employeeType.value === 'permanent' ? employmentOptionsPermanent : employmentOptionsTemporary
)
const options = ref([
  { name: 'Полная', value: 1 },
  { name: 'Частичная', value: 2 },
  { name: 'Временная', value: 3 },
  { name: 'Стажировка', value: 4 },
])
const selectedCard = ref(null)
const hoveredCard = ref(null)

// Подсказки — появление при наведении курсора
const isHintConditionsVisible = ref(false)
const isHintCityAddressVisible = ref(false)
const isHintDescriptionVisible = ref(false)
function showHintConditions() { isHintConditionsVisible.value = true }
function hideHintConditions() { isHintConditionsVisible.value = false }
function showHintCityAddress() { isHintCityAddressVisible.value = true }
function hideHintCityAddress() { isHintCityAddressVisible.value = false }
function showHintDescription() { isHintDescriptionVisible.value = true }
function hideHintDescription() { isHintDescriptionVisible.value = false }

const executors = ref([])

const handleCheck = id => {
  selectedCard.value = id
  workSpace.value = id
}



onBeforeMount(async () => {
  try {
    const result = await executorsList();
    executors.value = result?.executors || []
  } catch (e) {
    console.warn('executorsList:', e?.message || e)
    executors.value = []
  }
  // Специализации из локальной БД (бэкенд GET /api/specializations)
  try {
    const config = useRuntimeConfig()
    const baseURL = String(config.public.apiBase || '/api')
    const res = await $fetch('/specializations', { baseURL })
    const categories = res?.data?.categories
    if (categories && Array.isArray(categories) && categories.length > 0) {
      hhRolesData.value = { categories }
      hhIndustries.value = categories
    }
  } catch (e) {
    console.warn('getSpecializations (DB):', e?.message || e)
  }
  // Запасной вариант: публичный справочник hh.ru (если в БД ещё пусто)
  if (!hhIndustries.value || hhIndustries.value.length === 0) {
    try {
      const config = useRuntimeConfig()
      const baseURL = String(config.public.apiBase || '/api')
      const fallback = await $fetch('/hh/professional-roles', { baseURL })
      const categories = fallback?.data?.categories
      if (categories && Array.isArray(categories) && categories.length > 0) {
        hhRolesData.value = { categories }
        hhIndustries.value = categories
      }
    } catch (e) {
      console.warn('getRoles fallback (professional-roles):', e?.message || e)
    }
  }
  try {
    const res = await getLanguages()
    const langs = res?.data
    languagesOptions.value = Array.isArray(langs) && langs.length > 0
      ? langs.map((l) => ({ id: l.id, value: l.id, name: l.name, is_popular: !!l.is_popular }))
      : [
          { id: 'eng', value: 'eng', name: 'Английский', is_popular: true },
          { id: 'deu', value: 'deu', name: 'Немецкий', is_popular: true },
          { id: 'fra', value: 'fra', name: 'Французский', is_popular: true },
          { id: 'rus', value: 'rus', name: 'Русский', is_popular: false },
        ]
  } catch (e) {
    console.warn('getLanguages:', e?.message || e)
    languagesOptions.value = [
      { id: 'eng', value: 'eng', name: 'Английский', is_popular: true },
      { id: 'rus', value: 'rus', name: 'Русский', is_popular: false },
    ]
  }
  try {
    const res = await getLanguageLevels()
    const levels = res?.data
    languageLevelOptions.value = Array.isArray(levels) && levels.length > 0
      ? levels.map((l) => ({ id: l.id, value: l.id, name: l.name }))
      : [
          { id: 'a1', value: 'a1', name: 'A1 — Начальный' },
          { id: 'a2', value: 'a2', name: 'A2 — Элементарный' },
          { id: 'b1', value: 'b1', name: 'B1 — Средний' },
          { id: 'b2', value: 'b2', name: 'B2 — Средне-продвинутый' },
          { id: 'c1', value: 'c1', name: 'C1 — Продвинутый' },
          { id: 'c2', value: 'c2', name: 'C2 — В совершенстве' },
        ]
  } catch (e) {
    console.warn('getLanguageLevels:', e?.message || e)
    languageLevelOptions.value = [
      { id: 'a1', value: 'a1', name: 'A1 — Начальный' },
      { id: 'b2', value: 'b2', name: 'B2 — Средне-продвинутый' },
    ]
  }
})

const handleHover = id => {
  hoveredCard.value = id
}

const clearHover = () => {
  hoveredCard.value = null
}

const handleWorkSpaceUpdate = newValue => {
  selectedCard.value = newValue
}

const placeOptions = [
  { name: 'На месте работодателя', value: '1' },
  { name: 'Удалённо', value: '2' },
  { name: 'Гибрид', value: '3' },
  { name: 'Разъездной', value: '4' },
]
const oformlenieOptions = [
  { name: 'Трудовой договор', value: 'labor' },
  { name: 'Стажировка', value: 'internship' },
  { name: 'Договор ГПХ', value: 'gph' },
]

const hideContactFields = ref(false)
const salaryTypeOptions = [
  { id: 'past-cash', name: 'На руки' },
  { id: 'full-cash', name: 'До вычета налогов' },
]
const salaryType = ref('past-cash')

const currencySymbolOptions = [
  { name: '₽', value: 'RUB (рубль)' },
  { name: '€', value: 'EUR (евро)' },
  { name: '$', value: 'USD (доллар)' },
  { name: '₸', value: 'KZT (тенге)' },
]

const salaryPeriodOptions = ['За месяц', 'За смену', 'За час', 'За вахту', 'За услугу']
const salaryPaymentFrequencyOptions = ['Ежедневно', 'Раз в неделю', 'Два раза в месяц', 'Раз в месяц', 'За проект']

// Языки и уровни владения — загружаются из HH API
const languagesOptions = ref([])
const languageLevelOptions = ref([])
const languageDropdownOptions = computed(() => {
  const list = Array.isArray(languagesOptions.value) ? languagesOptions.value : []
  const popular = list.filter((o) => o.is_popular === true)
  const other = list.filter((o) => !o.is_popular)
  const result = []
  if (popular.length) {
    result.push({ type: 'header', name: 'Популярные' })
    result.push(...popular.map((o) => ({ id: o.id, value: o.value ?? o.id, name: o.name })))
  }
  if (other.length) {
    result.push({ type: 'header', name: 'Другие' })
    result.push(...other.map((o) => ({ id: o.id, value: o.value ?? o.id, name: o.name })))
  }
  return result.length ? result : list
})
const languageLevelDropdownOptions = computed(() => Array.isArray(languageLevelOptions.value) ? languageLevelOptions.value : [])

const headerVacancyStatus = inject('headerVacancyStatus', null)

const defaultDescriptionTemplate = `<p>Обязанности:</p>
<ul><li></li><li></li></ul>
<p>Требования:</p>
<ul><li></li><li></li></ul>
<p>Условия:</p>
<ul><li></li><li></li></ul>`

const newVacancy = ref({
  place: ['1'],
  oformlenie: [],
  schedule: ['5/2'],
  workHoursPerDay: ['8'],
  hasEveningNightShifts: false,
  workAddress: '',
  hideWorkAddress: false,
  location: '',
  currency: 'RUB (рубль)',
  salary_frequency: 'За месяц',
  salary_payment_frequency: 'Раз в месяц',
  status: 'В работе',
  experience: 'noExperience',
  employment: { id: 'FULL', name: 'Полная', siteName: 'Полная' },
  languages: [{ language: null, languageLevel: null }],
  description: defaultDescriptionTemplate,
})
const originalVacancyRaw = ref(null) // Исходные сырые данные с сервера
const originalVacancyData = ref(null) // Отформатированные исходные данные для сравнения

if (props.id) {
  const currectVacancy = await getVacancy(props.id)
  if (currectVacancy) {
    const placeVal = currectVacancy.place
    const placeId = placeVal && typeof placeVal === 'object' ? placeVal.id : placeVal
    // Формат работы: массив id (как oformlenie)
    const placeArr = Array.isArray(placeVal)
      ? placeVal.map((p) => String(p?.id ?? p))
      : (placeId ? [String(placeId)] : ['1'])
    newVacancy.value.place = placeArr.length ? placeArr : ['1']
    selectedCard.value = placeArr[0] ?? '1'
    for (let key in currectVacancy) {
      if (key === 'place' || key === 'schedule' || key === 'work_hours_per_day' || key === 'workHoursPerDay' || key === 'has_evening_night_shifts' || key === 'hasEveningNightShifts' || key === 'publication_city' || key === 'publicationCity' || key === 'work_address' || key === 'workAddress' || key === 'location' || key === 'languages' || key === 'drivers') continue
      newVacancy.value[key] = currectVacancy[key]
    }
    if (currectVacancy.executor_name != null) newVacancy.value.executor_name = currectVacancy.executor_name
    if (currectVacancy.executor_phone != null) newVacancy.value.executor_phone = currectVacancy.executor_phone
    if (currectVacancy.executor_email != null) newVacancy.value.executor_email = currectVacancy.executor_email
    if (currectVacancy.comment != null) newVacancy.value.comment = currectVacancy.comment
    newVacancy.value.department = currectVacancy.department ?? ''
    if (currectVacancy.drivers && Array.isArray(currectVacancy.drivers)) {
      newVacancy.value.drivers = currectVacancy.drivers.map((d) => ({
        id: d.id,
        value: d.value ?? d.name ?? String(d.id)
      }))
    }
    if (currectVacancy.languages && Array.isArray(currectVacancy.languages) && currectVacancy.languages.length > 0) {
      newVacancy.value.languages = currectVacancy.languages.map((item) => {
        const langName = typeof item === 'object' ? item?.name : item
        const langLevel = typeof item === 'object' ? item?.level : null
        return { language: langName || null, languageLevel: langLevel || null }
      })
    }
    // Преобразуем статус из формата API в русское название для отображения
    const statusDisplay = currectVacancy.status ? getStatusDisplayValue(currectVacancy.status) : 'В работе'
    newVacancy.value.status = statusDisplay
    if (headerVacancyStatus) {
      headerVacancyStatus.value = statusDisplay
    }
    // Конвертируем dateEnd из формата Y-m-d в d.m.Y
    if (currectVacancy.dateEnd) {
      newVacancy.value.dateEnd = convertDateFromApi(currectVacancy.dateEnd)
    }
    // Определяем тип сотрудника по типу занятости
    const emp = currectVacancy.employment || ''
    if (['Полная', 'Частичная', 'Вахта'].includes(emp)) {
      employeeType.value = 'permanent'
    } else if (['Временная', 'Подработка'].includes(emp)) {
      employeeType.value = 'temporary'
    }
    // Нормализуем оформление сотрудника
    if (currectVacancy.oformlenie != null) {
      const o = currectVacancy.oformlenie
      newVacancy.value.oformlenie = Array.isArray(o) ? o.map((v) => String(v)) : [String(o)]
    }
    // Нормализуем график работы
    const sch = currectVacancy.schedule
    if (sch != null) {
      const arr = Array.isArray(sch) ? sch.map((v) => String(typeof v === 'object' ? (v?.value ?? v?.name) : v)) : [String(sch)]
      newVacancy.value.schedule = arr.length ? arr : ['5/2']
    }
    // Город публикации (location)
    if (currectVacancy.publication_city != null || currectVacancy.publicationCity != null || currectVacancy.location != null) {
      newVacancy.value.location = currectVacancy.publication_city ?? currectVacancy.publicationCity ?? currectVacancy.location ?? ''
    }
    // Адрес работы и галочка «не показывать адрес»
    const workAddr = currectVacancy.work_address ?? currectVacancy.workAddress ?? ''
    newVacancy.value.workAddress = workAddr
    newVacancy.value.hideWorkAddress = workAddr === '' || workAddr === null
    // Чекбокс вечерних/ночных смен
    if (currectVacancy.has_evening_night_shifts != null || currectVacancy.hasEveningNightShifts != null) {
      newVacancy.value.hasEveningNightShifts = !!currectVacancy.has_evening_night_shifts || !!currectVacancy.hasEveningNightShifts
    }
    // Нормализуем рабочие часы в день
    const wh = currectVacancy.work_hours_per_day ?? currectVacancy.workHoursPerDay
    if (wh != null) {
      const arr = Array.isArray(wh) ? wh.map((v) => String(typeof v === 'object' ? (v?.value ?? v?.name) : v)) : [String(wh)]
      newVacancy.value.workHoursPerDay = arr.length ? arr : ['8']
    }
    // Сохраняем исходные сырые данные
    originalVacancyRaw.value = JSON.parse(JSON.stringify(currectVacancy))
  } else {
    throw createError({
            statusCode: 404,
            statusMessage: 'Вакансия не найдена'
        });
  } 
}

// Функция для преобразования строки отрасли/специализации в объект из hh.ru данных
const findIndustryFromString = (industryName) => {
  if (!industryName || typeof industryName !== 'string') return null
  if (!hhIndustries.value || hhIndustries.value.length === 0) return null
  
  return hhIndustries.value.find(cat => cat.name === industryName) || null
}

const findSpecializationFromString = (specializationName, industryObj) => {
  if (!specializationName || typeof specializationName !== 'string') return null
  if (!industryObj || !industryObj.roles || !Array.isArray(industryObj.roles)) return null
  
  return industryObj.roles.find(role => role.name === specializationName) || null
}

// Watch для преобразования строковых значений industry и specializations в объекты после загрузки данных hh.ru
watch([hhIndustries, () => newVacancy.value.industry, () => newVacancy.value.specializations], 
  ([industries, industry, specializations]) => {
    // Преобразуем industry из строки в объект, если нужно
    if (industry && typeof industry === 'string' && industries && industries.length > 0) {
      const foundIndustry = findIndustryFromString(industry)
      if (foundIndustry && (!newVacancy.value.industry || typeof newVacancy.value.industry === 'string')) {
        // Используем nextTick, чтобы избежать бесконечного цикла обновлений
        nextTick(() => {
          if (typeof newVacancy.value.industry === 'string') {
            newVacancy.value.industry = foundIndustry
          }
        })
      }
    }
    
    // Преобразуем specializations из строки в объект, если нужно
    const currentIndustry = newVacancy.value.industry
    if (specializations && typeof specializations === 'string' && currentIndustry && typeof currentIndustry === 'object') {
      const foundSpecialization = findSpecializationFromString(specializations, currentIndustry)
      if (foundSpecialization && (!newVacancy.value.specializations || typeof newVacancy.value.specializations === 'string')) {
        nextTick(() => {
          if (typeof newVacancy.value.specializations === 'string') {
            newVacancy.value.specializations = foundSpecialization
          }
        })
      }
    }
  },
  { immediate: true }
)

if (props.application) {
  const applicationResponse = await fetchApplicationDetail(props.application)
  if (applicationResponse.data) {
    newVacancy.value.name = applicationResponse.data.position
    newVacancy.value.currency = applicationResponse.data.currency
    newVacancy.value.salary_from = applicationResponse.data.salaryFrom
    newVacancy.value.salary_to = applicationResponse.data.salaryTo
    newVacancy.value.location = applicationResponse.data.city
  }
}
const tags = ref([])
const salary = ref({
  from: newVacancy.value.salary_from != null && newVacancy.value.salary_from !== '' ? Number(newVacancy.value.salary_from) : null,
  to: newVacancy.value.salary_to != null && newVacancy.value.salary_to !== '' ? Number(newVacancy.value.salary_to) : null
})
const errors = ref({})
const isOpenDateTo = ref(false)
const departments = ref([])
let phrasesResult = { data: null }
try {
  phrasesResult = await getPhrases() || { data: null }
} catch (e) {
  console.warn('getPhrases:', e?.message || e)
}
tags.value = phrasesResult?.data || []

try {
  departments.value = await getDepartments() || []
} catch (e) {
  console.warn('getDepartments:', e?.message || e)
  departments.value = []
}
const route = useRoute();

// Функция для преобразования phrases в массив названий
function getPhrasesArray(phrasesData) {
  if (!phrasesData || !Array.isArray(phrasesData) || phrasesData.length === 0) {
    return []
  }
  return phrasesData
    .map((item) => {
      if (typeof item === 'object' && item !== null && item.name) {
        return item.name
      }
      const id = typeof item === 'object' ? item?.id : item
      const tag = tags.value.find((t) => t.id === id || String(t.id) === String(id))
      return tag ? tag.name : null
    })
    .filter((name) => name !== null)
}

// Функция для преобразования employment в siteName (для API)
function getEmploymentText(employmentValue) {
  if (!employmentValue) return ''
  if (typeof employmentValue === 'object' && employmentValue?.siteName) return employmentValue.siteName
  const allOpts = [...employmentOptionsPermanent, ...employmentOptionsTemporary]
  const found = allOpts.find(o => o.id === employmentValue || o.name === employmentValue || o.siteName === employmentValue)
  if (found) return found.siteName
  const employmentOption = options.value.find(opt => {
    const optValueNum = Number(opt.value)
    const empValueNum = Number(employmentValue)
    return opt.value === employmentValue || optValueNum === empValueNum || opt.name === employmentValue || String(opt.value) === String(employmentValue)
  })
  if (employmentOption) return employmentOption.name
  if (typeof employmentValue === 'string') return employmentValue
  return ''
}

// Функция для преобразования schedule в текст (поддержка массива и одиночного значения)
function getScheduleText(scheduleValue) {
  if (!scheduleValue) return ''
  const arr = Array.isArray(scheduleValue) ? scheduleValue : [scheduleValue]
  const first = arr[0]
  if (!first) return ''
  const val = typeof first === 'object' ? (first?.name ?? first?.value) : first
  const scheduleOption = ArraySchedule.find(opt => opt.value === val || opt.name === val || String(opt.value) === String(val))
  return scheduleOption ? scheduleOption.name : (typeof val === 'string' ? val : '')
}

// Склонение «человек» для поля «План найма»
function getPeopleWord(n) {
  if (n === null || n === undefined || n === '') return ''
  const num = parseInt(String(n), 10)
  if (isNaN(num)) return ''
  const mod10 = num % 10
  const mod100 = num % 100
  if (mod100 >= 11 && mod100 <= 19) return 'человек'
  if (mod10 === 1) return 'человек'
  if (mod10 >= 2 && mod10 <= 4) return 'человека'
  return 'человек'
}

// Подсказки для кнопок опыта работы (как на скриншоте)
const experienceButtonLabels = { noExperience: 'Нет опыта', between1And3: '1-3 года', between3And6: '3-6 лет', moreThan6: 'От 6 лет' }
function getExperienceButtonLabel(opt) {
  return experienceButtonLabels[opt?.id] ?? opt?.name ?? ''
}
function isExperienceSelected(opt) {
  const v = newVacancy.value.experience
  if (!v && opt?.id === 'noExperience') return true
  if (!v) return false
  if (typeof v === 'object') {
    return opt?.id === v?.id || opt?.value === v?.value
  }
  return opt?.id === v || opt?.value === v || opt?.name === v || String(opt?.value) === String(v)
}

// Функция для преобразования experience из ID в текст
function getExperienceText(experienceValue) {
  if (!experienceValue) return ''
  const val = typeof experienceValue === 'object' ? (experienceValue.id ?? experienceValue.value) : experienceValue

  const experienceOption = ArrayExperience.find(opt => {
    const optValueNum = Number(opt.value);
    const expValueNum = Number(val);
    return opt.value === val || optValueNum === expValueNum ||
           opt.name === val || opt.id === val ||
           String(opt.value) === String(val) || String(opt.id) === String(val);
  });
  
  if (experienceOption) {
    return experienceOption.name;
  }
  
  // Если это уже строка (название), используем её
  if (typeof experienceValue === 'string') {
    return experienceValue;
  }
  
  return '';
}

// Функция для преобразования education из ID в текст
function getEducationText(educationValue) {
  if (!educationValue) return ''
  
  const educationOption = ArrayEducation.find(opt => {
    const optValueNum = Number(opt.value);
    const eduValueNum = Number(educationValue);
    return opt.value === educationValue || 
           optValueNum === eduValueNum || 
           opt.name === educationValue ||
           String(opt.value) === String(educationValue);
  });
  
  if (educationOption) {
    return educationOption.name;
  }
  
  // Если это уже строка (название), используем её
  if (typeof educationValue === 'string') {
    return educationValue;
  }
  
  return '';
}

// Функция для преобразования статуса в формат API
function getStatusValue(statusValue) {
  // Если значение пустое, возвращаем 'active' по умолчанию
  if (!statusValue || statusValue === '' || statusValue === null || statusValue === undefined) {
    return 'active';
  }
  
  // Маппинг русских названий в значения API
  const statusMap = {
    'В работе': 'active',
    'Черновик': 'draft',
    'Архив': 'archive',
    'active': 'active',
    'draft': 'draft',
    'archive': 'archive',
  };
  
  // Если значение уже в формате API, возвращаем его
  if (statusMap[statusValue]) {
    return statusMap[statusValue];
  }
  
  // Если значение не найдено, возвращаем 'active' по умолчанию
  return 'active';
}

// Функция для преобразования статуса из формата API в русское название (для отображения)
function getStatusDisplayValue(statusValue) {
  if (!statusValue) return null;
  
  // Обратный маппинг значений API в русские названия
  const statusDisplayMap = {
    'active': 'В работе',
    'draft': 'Черновик',
    'archive': 'Архив',
    'В работе': 'В работе',
    'Черновик': 'Черновик',
    'Архив': 'Архив',
  };
  
  return statusDisplayMap[statusValue] || statusValue;
}

// Computed свойство для специализаций, зависящих от выбранной отрасли
const professionsOptions = computed(() => {
  if (!newVacancy.value.industry || typeof newVacancy.value.industry !== 'object') {
    return []
  }
  
  // Если industry - это объект с roles, используем их
  if (newVacancy.value.industry.roles && Array.isArray(newVacancy.value.industry.roles)) {
    return newVacancy.value.industry.roles
  }
  
  // Иначе ищем отрасль в загруженных данных
  if (hhRolesData.value && hhRolesData.value.categories) {
    const foundIndustry = hhRolesData.value.categories.find(cat => {
      if (newVacancy.value.industry.id && cat.id) {
        return String(cat.id) === String(newVacancy.value.industry.id)
      }
      if (newVacancy.value.industry.name && cat.name) {
        return cat.name === newVacancy.value.industry.name
      }
      return false
    })
    
    if (foundIndustry && foundIndustry.roles && Array.isArray(foundIndustry.roles)) {
      return foundIndustry.roles
    }
  }
  
  return []
})

// Обработчик изменения отрасли
const handleIndustryChange = (industry) => {
  if (!industry) {
    newVacancy.value.industry = null
    newVacancy.value.specializations = null
    return
  }

  // Находим полный объект отрасли в исходных данных, чтобы получить roles
  let fullIndustry = null
  if (hhIndustries.value && Array.isArray(hhIndustries.value)) {
    fullIndustry = hhIndustries.value.find(
      cat => {
        if (industry.id && cat.id) {
          return String(cat.id) === String(industry.id)
        }
        if (industry.name && cat.name) {
          return cat.name === industry.name
        }
        return false
      }
    )
  }

  // Используем полный объект, если найден, иначе используем переданный
  const selectedIndustry = fullIndustry || industry
  
  // Обновляем industry
  newVacancy.value.industry = selectedIndustry ? { ...selectedIndustry } : null
  
  // Сбрасываем специализацию при изменении отрасли
  newVacancy.value.specializations = null
}

// Лимит символов для названия должности
const JOB_TITLE_MAX_LENGTH = 80

const jobTitleRemainingChars = computed(() => {
  const name = newVacancy.value.name || ''
  return Math.max(0, JOB_TITLE_MAX_LENGTH - name.length)
})

const jobTitleHasSpecialChars = computed(() => {
  const name = newVacancy.value.name || ''
  if (!name) return false
  // Специальные: всё, кроме букв, цифр, пробелов и базовой пунктуации .,-()
  return /[^\p{L}\p{N}\s.,\-()]/u.test(name)
})

const getDescriptionTextLength = (html) => {
  const text = String(html || '').replace(/<[^>]*>/g, '').trim()
  return text.length
}

const descriptionCharCount = computed(() => getDescriptionTextLength(newVacancy.value.description))

// Ошибка поля "Название": показывается при blur с пустым полем, скрывается при focus
const nameFieldEmptyError = ref(false)
const specializationsFieldEmptyError = ref(false)
const publicationCityFieldEmptyError = ref(false)
const workAddressFieldEmptyError = ref(false)
const executorNameFieldEmptyError = ref(false)
const onNameFocus = () => {
  nameFieldEmptyError.value = false
}
const onNameBlur = () => {
  const name = newVacancy.value.name || ''
  nameFieldEmptyError.value = !name.trim()
}

const onSpecializationsFocus = () => {
  specializationsFieldEmptyError.value = false
}

const onSpecializationsBlur = () => {
  nextTick(() => {
    const v = newVacancy.value.specializations
    const isEmpty = !v || (typeof v === 'object' && !v?.name) || (typeof v === 'string' && !v.trim())
    specializationsFieldEmptyError.value = isEmpty
  })
}

const onWorkAddressFocus = () => {
  workAddressFieldEmptyError.value = false
}

const clearWorkAddressError = () => {
  workAddressFieldEmptyError.value = false
}

function setOformlenie(val) {
  if (newVacancy.value) newVacancy.value.oformlenie = val || []
}

function setPlace(val) {
  if (newVacancy.value) newVacancy.value.place = (val && val.length) ? val : ['1']
  selectedCard.value = newVacancy.value?.place?.[0] ?? '1'
}

/** Заполнить форму тестовыми данными (только для режима создания, чтобы не вводить всё вручную при проверке). */
function fillTestData() {
  const d = newVacancy.value
  d.name = 'Менеджер по продажам (тест)'
  d.code = 'TEST-001'
  d.description = defaultDescriptionTemplate.replace(/<li><\/li>/g, '<li>Опыт работы от 1 года.</li><li>Навыки ведения переговоров.</li><li>Грамотная речь.</li>')
  d.location = 'Москва'
  d.workAddress = 'ул. Тверская, д. 1'
  d.hideWorkAddress = false
  d.executor_name = 'Иван Иванов'
  d.executor_phone = '+7 (999) 123-45-67'
  d.executor_email = 'test@example.com'
  d.place = ['1']
  selectedCard.value = '1'
  d.oformlenie = ['labor']
  d.schedule = ['5/2']
  d.workHoursPerDay = ['8']
  d.hasEveningNightShifts = false
  d.employment = employmentOptions.value?.[0] || { id: 'FULL', name: 'Полная', siteName: 'Полная' }
  d.experience = 'between1And3'
  d.education = ArrayEducation?.length ? (ArrayEducation[1]?.value ?? 1) : 1
  d.currency = 'RUB (рубль)'
  d.salary_frequency = 'За месяц'
  d.salary_payment_frequency = 'Раз в месяц'
  d.salary_from = 50000
  d.salary_to = 90000
  d.status = 'В работе'
  d.dateEnd = '31.12.2025'
  d.comment = 'Тестовый комментарий к вакансии. Ссылка на вакансию: https://example.com/vacancy'
  d.department = 'Отдел продаж'
  d.peoples = 1
  d.phrases = (tags.value?.length >= 2 ? tags.value.slice(0, 2) : [{ id: '1', name: 'Коммуникабельность' }, { id: '2', name: 'Работа в команде' }])
  d.conditions = []
  d.drivers = (ArrayCarId?.length >= 2 ? [{ id: ArrayCarId[1].id, value: ArrayCarId[1].value }] : [{ id: 2, value: 'B' }])
  d.additions = []
  d.languages = [{ language: 'Русский', languageLevel: 'Родной' }]
  if (hhIndustries.value?.length) {
    const cat = hhIndustries.value[0]
    d.industry = { id: cat.id, name: cat.name, roles: cat.roles }
    const role = cat.roles?.[0]
    d.specializations = role ? { id: role.id, name: role.name } : { id: '1', name: 'Менеджер по продажам' }
  } else {
    d.industry = { id: '1', name: 'Продажи', roles: [] }
    d.specializations = { id: '1', name: 'Менеджер по продажам' }
  }
  salary.value.from = 50000
  salary.value.to = 90000
  nameFieldEmptyError.value = false
  workAddressFieldEmptyError.value = false
  executorNameFieldEmptyError.value = false
  specializationsFieldEmptyError.value = false
  publicationCityFieldEmptyError.value = false
  if (errors.value) Object.keys(errors.value).forEach((k) => delete errors.value[k])
}

const onWorkAddressBlur = () => {
  nextTick(() => {
    const v = newVacancy.value.workAddress
    workAddressFieldEmptyError.value = !v || !String(v).trim()
  })
}

const onExecutorNameBlur = () => {
  nextTick(() => {
    const v = newVacancy.value.executor_name
    executorNameFieldEmptyError.value = !v || !String(v).trim()
  })
}

const clearExecutorNameError = () => {
  executorNameFieldEmptyError.value = false
}

const DESCRIPTION_MIN_LENGTH = 150
const DESCRIPTION_ERROR_MSG = 'Заполните описание вакансии, минимум 150 символов'

const onDescriptionBlur = () => {
  nextTick(() => {
    const len = getDescriptionTextLength(newVacancy.value.description)
    if (len < DESCRIPTION_MIN_LENGTH) {
      errors.value.description = DESCRIPTION_ERROR_MSG
    } else if (errors.value.description) {
      delete errors.value.description
    }
  })
}

const onPublicationCityUpdate = ($event) => {
  newVacancy.value.location = $event || ''
  if ($event?.trim()) {
    publicationCityFieldEmptyError.value = false
  } else {
    // GeoInput эмитит update при blur; при пустом поле сразу показываем ошибку
    publicationCityFieldEmptyError.value = true
  }
}

const onPublicationCityBlur = () => {
  if (!newVacancy.value.location?.trim()) {
    publicationCityFieldEmptyError.value = true
  }
}

function isScheduleSelected(opt) {
  const arr = newVacancy.value.schedule
  if (!arr || !Array.isArray(arr)) return false
  return arr.some((v) => (typeof v === 'object' ? (v?.value ?? v?.name) : v) === opt.value || (typeof v === 'object' ? (v?.value ?? v?.name) : v) === opt.name)
}

function handleScheduleSelect(opt) {
  const value = opt.value
  const arr = Array.isArray(newVacancy.value.schedule) ? [...newVacancy.value.schedule] : [String(newVacancy.value.schedule || '5/2')]
  const idx = arr.findIndex((v) => (typeof v === 'object' ? (v?.value ?? v?.name) : v) === value)
  if (idx >= 0) {
    arr.splice(idx, 1)
  } else {
    arr.push(value)
  }
  newVacancy.value.schedule = arr
  if (arr.length === 0) {
    errors.value.schedule = 'Выберите хотя бы одно значение'
  } else {
    if (errors.value.schedule) delete errors.value.schedule
  }
}

function isWorkHoursSelected(opt) {
  const arr = newVacancy.value.workHoursPerDay
  if (!arr || !Array.isArray(arr)) return false
  return arr.some((v) => (typeof v === 'object' ? (v?.value ?? v?.name) : v) === opt.value || (typeof v === 'object' ? (v?.value ?? v?.name) : v) === opt.name)
}

function handleWorkHoursSelect(opt) {
  const value = opt.value
  const arr = Array.isArray(newVacancy.value.workHoursPerDay) ? [...newVacancy.value.workHoursPerDay] : [String(newVacancy.value.workHoursPerDay || '8')]
  const idx = arr.findIndex((v) => (typeof v === 'object' ? (v?.value ?? v?.name) : v) === value)
  if (idx >= 0) {
    arr.splice(idx, 1)
  } else {
    arr.push(value)
  }
  newVacancy.value.workHoursPerDay = arr
  if (arr.length === 0) {
    errors.value.workHoursPerDay = 'Выберите хотя бы одно значение'
  } else {
    if (errors.value.workHoursPerDay) delete errors.value.workHoursPerDay
  }
}

function getWorkHoursText(val) {
  if (!val) return ''
  const arr = Array.isArray(val) ? val : [val]
  const first = arr[0]
  if (!first) return ''
  const v = typeof first === 'object' ? (first?.name ?? first?.value) : first
  return v ? String(v) : ''
}

function isDriversSelected(opt) {
  const arr = newVacancy.value.drivers || []
  if (!Array.isArray(arr)) return false
  return arr.some((v) => (typeof v === 'object' ? v?.value : v) === opt.value)
}

function handleDriversSelect(opt) {
  const arr = [...(newVacancy.value.drivers || [])]
  const idx = arr.findIndex((v) => (typeof v === 'object' ? v?.value : v) === opt.value)
  if (idx >= 0) {
    arr.splice(idx, 1)
  } else {
    arr.push({ id: opt.id, value: opt.value })
  }
  newVacancy.value.drivers = arr
}
watch(() => newVacancy.value.name, (name) => {
  if (name && name.trim()) {
    nameFieldEmptyError.value = false
  }
})

watch(() => newVacancy.value.specializations, (v) => {
  if (v && (typeof v === 'object' ? v?.name : v.trim?.())) {
    specializationsFieldEmptyError.value = false
  }
})

watch(() => newVacancy.value.location, (v) => {
  if (v && String(v).trim()) {
    publicationCityFieldEmptyError.value = false
  }
})

watch(() => newVacancy.value.workAddress, (v) => {
  if (v && String(v).trim()) {
    workAddressFieldEmptyError.value = false
  }
})

watch(() => newVacancy.value.executor_name, (v) => {
  if (v && String(v).trim()) {
    executorNameFieldEmptyError.value = false
  }
})

watch(employeeType, () => {
  const emp = newVacancy.value.employment
  const siteName = typeof emp === 'object' ? emp?.siteName : emp
  const allowed = employmentOptions.value.map(o => o.siteName)
  if (siteName && !allowed.includes(siteName)) {
    newVacancy.value.employment = employmentOptions.value[0] || null
  }
})

function isEmployeeTypeSelected(opt) {
  return employeeType.value === opt.id
}

function isEmploymentSelected(opt) {
  const v = newVacancy.value.employment
  if (!v) return false
  const id = typeof v === 'object' ? v?.id : v
  const siteName = typeof v === 'object' ? v?.siteName : v
  return opt.id === id || opt.siteName === siteName || opt.name === siteName || opt.name === v
}

function isPlaceSelected(card) {
  const places = newVacancy.value.place
  if (!places) return false
  const arr = Array.isArray(places) ? places : [places]
  return arr.some((p) => String(p) === String(card.id))
}

function handlePlaceSelect(id) {
  const value = String(id)
  const places = Array.isArray(newVacancy.value.place) ? [...newVacancy.value.place] : []
  const idx = places.indexOf(value)
  if (idx >= 0) {
    places.splice(idx, 1)
  } else {
    places.push(value)
  }
  newVacancy.value.place = places.length ? places : ['1']
  selectedCard.value = newVacancy.value.place[0]
  workSpace.value = newVacancy.value.place[0]
}

const vacancyData = computed(() => {
  // Преобразуем industry и specializations в строки для отправки на сервер
  const industryValue = newVacancy.value.industry 
    ? (typeof newVacancy.value.industry === 'object' ? newVacancy.value.industry.name : newVacancy.value.industry)
    : ''
  
  const specializationsValue = newVacancy.value.specializations
    ? (typeof newVacancy.value.specializations === 'object' ? newVacancy.value.specializations.name : newVacancy.value.specializations)
    : ''
  
  return {
    name: newVacancy.value.name,
    code: newVacancy.value.code || '',
    description: newVacancy.value.description || '',
    industry: industryValue,
    specializations: specializationsValue,
    employment: getEmploymentText(newVacancy.value.employment),
    schedule: getScheduleText(newVacancy.value.schedule),
    work_hours_per_day: getWorkHoursText(newVacancy.value.workHoursPerDay),
    has_evening_night_shifts: newVacancy.value.hasEveningNightShifts || false,
    experience: getExperienceText(newVacancy.value.experience),
    education: getEducationText(newVacancy.value.education),
    phrases: getPhrasesArray(newVacancy.value.phrases),
    languages: (() => {
      const arr = newVacancy.value.languages || []
      return arr
        .filter((item) => item?.language)
        .map((item) => {
          const langName = typeof item.language === 'object' ? item.language?.name : item.language
          const levelName = item.languageLevel
            ? (typeof item.languageLevel === 'object' ? item.languageLevel?.name : item.languageLevel)
            : null
          return levelName ? { name: langName, level: levelName } : { name: langName }
        })
    })(),
    conditions: newVacancy.value.conditions || [],
    drivers: newVacancy.value.drivers || [],
    additions: newVacancy.value.additions || [],
    salary_from: salary.value.from,
    salary_to: salary.value.to,
    currency: newVacancy.value.currency || 'RUB (рубль)',
    salary_frequency: newVacancy.value.salary_frequency || 'За месяц',
    salary_payment_frequency: newVacancy.value.salary_payment_frequency || 'Раз в месяц',
    place: Array.isArray(newVacancy.value.place) ? [...newVacancy.value.place] : (newVacancy.value.place ? [newVacancy.value.place] : ['1']),
    oformlenie: newVacancy.value.oformlenie || [],
    publication_city: newVacancy.value.location?.trim() || null,
    work_address: newVacancy.value.hideWorkAddress ? '' : (newVacancy.value.workAddress || ''),
    location: newVacancy.value.location || '',
    customer_id: 10,
    executor_name: newVacancy.value.executor_name || null,
    executor_phone: hideContactFields.value ? null : (newVacancy.value.executor_phone || null),
    executor_email: hideContactFields.value ? '' : (newVacancy.value.executor_email || ''),
    status: getStatusValue(headerVacancyStatus?.value ?? newVacancy.value.status),
    department: newVacancy.value.department || '',
    dateEnd: newVacancy.value.dateEnd || null,
    comment: newVacancy.value.comment || '',
    peoples: newVacancy.value.peoples || null,
  }
});

// Функция для форматирования исходных данных в формат vacancyData
function formatOriginalData(original) {
  if (!original) return null
  
  return {
    name: original.name,
    code: original.code || '',
    description: original.description || '',
    industry: original.industry || '',
    specializations: original.specializations || '',
    employment: getEmploymentText(original.employment),
    schedule: getScheduleText(original.schedule),
    work_hours_per_day: getWorkHoursText(original.work_hours_per_day ?? original.workHoursPerDay),
    has_evening_night_shifts: original.has_evening_night_shifts ?? original.hasEveningNightShifts ?? false,
    experience: getExperienceText(original.experience),
    education: getEducationText(original.education),
    phrases: getPhrasesArray(original.phrases),
    languages: (() => {
      const arr = original.languages || []
      if (!arr.length) return []
      return arr.map((l) =>
        typeof l === 'object' && l?.name
          ? { name: l.name, level: l.level || null }
          : { name: String(l) }
      )
    })(),
    conditions: original.conditions || [],
    drivers: original.drivers || [],
    additions: original.additions || [],
    salary_from: original.salary_from || null,
    salary_to: original.salary_to || null,
    currency: original.currency || 'RUB (рубль)',
    salary_frequency: original.salary_frequency || 'За месяц',
    salary_payment_frequency: original.salary_payment_frequency || 'Раз в месяц',
    place: Array.isArray(original.place) ? original.place.map((p) => String(p)) : (original.place != null ? [String(original.place)] : ['1']),
    oformlenie: original.oformlenie || [],
    publication_city: original.publication_city ?? original.publicationCity ?? original.location ?? null,
    work_address: original.work_address ?? original.workAddress ?? '',
    location: original.location || '',
    executor_name: original.executor_name || null,
    executor_phone: original.executor_phone || null,
    executor_email: original.executor_email || '',
    status: getStatusValue(original.status),
    department: original.department || '',
    dateEnd: convertDateFromApi(original.dateEnd) || null,
    comment: original.comment || '',
    peoples: original.peoples || null,
  }
}

// Сохраняем исходные данные в формате vacancyData после загрузки тегов
watch(() => [tags.value.length, originalVacancyRaw.value], ([tagsLength, original]) => {
  if (tagsLength > 0 && original && props.type === 'edit' && !originalVacancyData.value) {
    originalVacancyData.value = formatOriginalData(original)
  }
}, { immediate: true })

const validateVacancy = () => {
  let errorsValid = true;
  if (!newVacancy.value.name) {
    errors.value.name = 'Поле обязательно к заполнению'
    errorsValid = false
  } else {
    if (errors.value.name) delete errors.value.name
  }

  const descLen = getDescriptionTextLength(newVacancy.value.description)
  if (descLen < DESCRIPTION_MIN_LENGTH) {
    errors.value.description = DESCRIPTION_ERROR_MSG
    errorsValid = false
  } else {
    if (errors.value.description) delete errors.value.description
  }

  if (!newVacancy.value.location || !String(newVacancy.value.location).trim()) {
    publicationCityFieldEmptyError.value = true
    errorsValid = false
  } else {
    publicationCityFieldEmptyError.value = false
  }

  const scheduleArr = Array.isArray(newVacancy.value.schedule) ? newVacancy.value.schedule : []
  if (scheduleArr.length === 0) {
    errors.value.schedule = 'Выберите хотя бы одно значение'
    errorsValid = false
  } else {
    if (errors.value.schedule) delete errors.value.schedule
  }

  const workHoursArr = Array.isArray(newVacancy.value.workHoursPerDay) ? newVacancy.value.workHoursPerDay : []
  if (workHoursArr.length === 0) {
    errors.value.workHoursPerDay = 'Выберите хотя бы одно значение'
    errorsValid = false
  } else {
    if (errors.value.workHoursPerDay) delete errors.value.workHoursPerDay
  }

  if (!newVacancy.value.hideWorkAddress) {
    if (!newVacancy.value.workAddress || !String(newVacancy.value.workAddress).trim()) {
      workAddressFieldEmptyError.value = true
      errorsValid = false
    } else {
      workAddressFieldEmptyError.value = false
    }
  } else {
    workAddressFieldEmptyError.value = false
  }

  if (!hideContactFields.value) {
    if (!newVacancy.value.executor_name || !String(newVacancy.value.executor_name).trim()) {
      executorNameFieldEmptyError.value = true
      errorsValid = false
    } else {
      executorNameFieldEmptyError.value = false
    }
  } else {
    executorNameFieldEmptyError.value = false
  }

  if (newVacancy.value.salary_from && newVacancy.value.salary_to) {
    if (Number(newVacancy.value.salary_from) > Number(newVacancy.value.salary_to)) {
      errors.value.salary = 'Зарплата от должна быть меньше зарплаты до'
      errorsValid = false
    }
  }

  if (!errorsValid && errors.value.response) {
    delete errors.value.response
  }

  return errorsValid
}

// Функция для сравнения значений (включая массивы и объекты)
function isEqual(value1, value2) {
  if (Array.isArray(value1) && Array.isArray(value2)) {
    if (value1.length !== value2.length) return false
    return value1.every((item, index) => {
      if (typeof item === 'object' && typeof value2[index] === 'object') {
        return JSON.stringify(item) === JSON.stringify(value2[index])
      }
      return item === value2[index]
    })
  }
  
  // Для объектов (industry, specializations) сравниваем по name, если это объекты
  if (typeof value1 === 'object' && value1 !== null && typeof value2 === 'object' && value2 !== null) {
    // Если оба объекта имеют name, сравниваем по name
    if (value1.name && value2.name) {
      return value1.name === value2.name
    }
    // Иначе сравниваем по JSON
    return JSON.stringify(value1) === JSON.stringify(value2)
  }
  
  // Если один объект, а другой строка - сравниваем name объекта со строкой
  if (typeof value1 === 'object' && value1 !== null && typeof value2 === 'string') {
    return value1.name === value2
  }
  if (typeof value2 === 'object' && value2 !== null && typeof value1 === 'string') {
    return value2.name === value1
  }
  
  // Для статуса: пустая строка и null считаются разными (пустая строка = очистка)
  // Для остальных полей: null, undefined и пустая строка считаются эквивалентными
  if (value1 === null || value1 === undefined || value1 === '') {
    if (value2 === null || value2 === undefined || value2 === '') {
      return true
    }
    return false
  }
  if (value2 === null || value2 === undefined || value2 === '') {
    return false
  }
  return value1 === value2
}

// Функция для получения только измененных полей
function getChangedFields(currentData, originalData) {
  if (!originalData) return currentData
  
  const changedFields = {}
  
  // Список полей для сравнения
  const fieldsToCompare = [
    'name', 'code', 'description', 'industry', 'specializations',
    'employment', 'schedule', 'work_hours_per_day', 'has_evening_night_shifts', 'experience', 'education',
    'phrases', 'languages', 'conditions', 'drivers', 'additions',
    'salary_from', 'salary_to', 'currency', 'salary_frequency', 'salary_payment_frequency', 'place', 'oformlenie', 'publication_city', 'work_address', 'location',
    'executor_name', 'executor_phone', 'executor_email', 'status', 'department', 'dateEnd', 'comment', 'peoples'
  ]
  
  fieldsToCompare.forEach(field => {
    const currentValue = currentData[field]
    const originalValue = originalData[field]
    
    if (!isEqual(currentValue, originalValue)) {
      // Не добавляем поля со значением null, если исходное значение тоже было null
      if (currentValue !== null || (originalValue !== null && originalValue !== undefined)) {
        changedFields[field] = currentValue
      }
    }
  })
  
  return changedFields
}

// Функция для очистки данных от null значений (для создания)
function cleanDataForSending(data) {
  const cleaned = { ...data }
  
  // Удаляем поля со значением null
  Object.keys(cleaned).forEach(key => {
    if (cleaned[key] === null) {
      delete cleaned[key]
    }
  })
  
  return cleaned
}

async function saveVacancy(opt) {
  if (validateVacancy()) {
    let response, error;
    
    // Используем vacancyData для получения правильных данных (phrases как массив)
    const fullData = { ...vacancyData.value };
    fullData.application = route.query.application ?? null;
    
    if (props.type === 'edit') {
      // При редактировании отправляем только измененные поля
      const changedFields = getChangedFields(fullData, originalVacancyData.value);
      // Формат работы (place): массив, как oformlenie — все выбранные значения
      const placeArr = Array.isArray(newVacancy.value.place) ? newVacancy.value.place : [newVacancy.value.place || '1'];
      if (placeArr.length) {
        changedFields.place = placeArr.map((p) => String(p));
      }
      // Языки всегда отправляем при редактировании, чтобы не терять
      if (fullData.languages && Array.isArray(fullData.languages)) {
        changedFields.languages = fullData.languages;
      }
      // Очищаем от null значений
      const cleanedData = cleanDataForSending(changedFields);
      const result = await updateVacancy(props.id, cleanedData);
      response = result.data;
      error = result.error;
    } else {
      // При создании отправляем все данные, очищенные от null
      const cleanedData = cleanDataForSending(fullData);
      const result = await createVacancy(cleanedData);
      response = result.data;
      error = result.error;
    }
    
    if (response == null) {
      switch (error.status) {
        case 409:
          errors.value.response = 'Конфлит полей вакансии'
          break
        case 422:
          errors.value.response = 'Ошибка валидации вакансии'
          break
        default:
          errors.value.response = 'Произошла ошибка при создании вакансии'
          break
      }
    } else {
      emit('goToPublish')
    }
  }
}

const saveAndContinueHandler = inject('saveAndContinueHandler', null)
onMounted(() => {
  if (saveAndContinueHandler) {
    saveAndContinueHandler.value = saveVacancy
  }
})
onBeforeUnmount(() => {
  if (saveAndContinueHandler) {
    saveAndContinueHandler.value = null
  }
})

defineExpose({ saveVacancy })

const updateEvent = (data, property) => {
  newVacancy.value[property] = data
}

const updateEventObject = (data, property, obj) => {
  newVacancy.value[property] = obj
}


const updateTags = (data) => {
  if (data.length > 0) {
    newVacancy.value.phrases = data
  } else {
    delete newVacancy.value.phrases
  }
}

const addLanguageRow = () => {
  newVacancy.value.languages = [...(newVacancy.value.languages || []), { language: null, languageLevel: null }]
}
const languagesAccordionRef = ref(null)
const removeLanguageRow = (index) => {
  const arr = [...(newVacancy.value.languages || [])]
  arr.splice(index, 1)
  newVacancy.value.languages = arr
}
const updateLanguageAt = (index, value) => {
  const arr = [...(newVacancy.value.languages || [])]
  if (!arr[index]) return
  arr[index] = { ...arr[index], language: value ?? null }
  newVacancy.value.languages = arr
}
const updateLanguageLevelAt = (index, value) => {
  const arr = [...(newVacancy.value.languages || [])]
  if (!arr[index]) return
  arr[index] = { ...arr[index], languageLevel: value ?? null }
  newVacancy.value.languages = arr
}

function onFirstLanguageDropdownOpen() {
  const arr = newVacancy.value.languages || []
  const first = arr[0]
  if (!first || (!first.language && !first.languageLevel)) {
    const eng = languageDropdownOptions.value.find((o) => o.name === 'Английский' || o.id === 'eng')
    const a1 = languageLevelDropdownOptions.value.find((o) => o.id === 'a1' || (o.name && String(o.name).startsWith('A1')))
    const nameEng = eng?.name ?? 'Английский'
    const nameA1 = a1?.name ?? 'A1 — Начальный'
    updateLanguageAt(0, nameEng)
    updateLanguageLevelAt(0, nameA1)
  }
}

const updateSalary = (type, value) => {
  if (type === 'from') {
    if (value) {
      newVacancy.value.salary_from = value
      salary.value.from = value
    } else {
      delete newVacancy.value.salary_from
      salary.value.from = null
    }
  } else {
    if (value) {
      newVacancy.value.salary_to = value
      salary.value.to = value
    } else {
      delete newVacancy.value.salary_to
      salary.value.to = null
    }
  }
}

const updateExecutor = (value, id) => {
  if (id == null) {
    if (value == '') {
      delete newVacancy.value.executor_name
    } else {
      newVacancy.value.executor_name = value
    }
    delete newVacancy.value.executor_id
  } else {
    newVacancy.value.executor_id = id
  }
}

</script>

<template>
  <div class="container pb-10">
    <div class="flex gap-x-[24px] block">
      <div class="max-w-[875px] flex-grow p-25px bg-white rounded-fifteen">
        <div class="flex items-center justify-between gap-4 mb-8">
          <p class="text-space text-xl font-semibold">Основная информация</p>
          <button
            v-if="!id"
            type="button"
            class="text-sm text-dodger hover:underline shrink-0"
            @click="fillTestData"
          >
            Заполнить тестовыми данными
          </button>
        </div>
        <div class="w-full justify-between flex gap-25px mb-6">
          <div class="flex-[3] min-w-0">
            <div class="flex items-center gap-1 mb-4">
              <p class="text-sm font-medium leading-normal text-space">
                <span class="text-red-custom">*</span>
                Название
              </p>
              <span class="inline-flex items-center cursor-help">
                <svg-icon name="question" width="16" height="16" />
                <MyTooltip text="Укажите профессию так, как вы бы искали её при поиске работы. Не перегружайте название лишними деталями — иначе вакансию будет сложнее найти." />
              </span>
            </div>
            <Autocomplete
              :source="ArrayMajors"
              :model-value="newVacancy.name ? newVacancy.name : ''"
              @update:model-value="$event => updateEvent($event, 'name')"
              @focus="onNameFocus"
              @blur="onNameBlur"
              placeholder="Например, Менеджер по продажам"
              :show-search-icon="false"
              :maxlength="80"
              :error="nameFieldEmptyError"
              class="mb-11px"
            />
            <div v-if="errors.name" class="text-red-500 text-xs mt-1">
              {{ errors.name }}
            </div>
            <p v-if="nameFieldEmptyError" class="text-xs text-red-500 mt-1">
              Напишите, кого ищете
            </p>
            <p v-else class="text-xs text-bali">
              Осталось {{ jobTitleRemainingChars }} символов.
              {{ jobTitleHasSpecialChars ? 'Есть специальные символы.' : 'Специальных символов нет.' }}
            </p>
          </div>
          <div class="flex-[1] min-w-0">
            <div class="flex items-center gap-1 mb-4">
              <p class="text-sm font-medium leading-normal text-space">
                Код вакансии
              </p>
              <span class="inline-flex items-center cursor-help">
                <svg-icon name="question" width="16" height="16" />
                <MyTooltip text="Укажите номер или идентификатор вакансии из ваших систем (например, из 1С), чтобы не путать вакансии с одинаковыми названиями между собой." />
              </span>
            </div>
            <MyInput
              placeholder="Код вакансии"
              type="string"
              :model-value="newVacancy.code ? newVacancy.code : ''"
              @update:model-value="$event => updateEvent($event, 'code')"
            />
          </div>
        </div>
        <div class="flex justify-between gap-25px mb-6">
          <div class="flex-[1] min-w-0">
            <p class="text-sm font-medium text-space mb-3.5">
              План найма
            </p>
            <div class="plan-hire-input-wrapper flex items-center min-h-10 rounded-ten border border-athens bg-athens-gray pl-15px pr-15px">
              <input
                type="number"
                class="flex-1 min-w-0 bg-transparent border-none text-sm font-normal text-[#2F353D] outline-none"
                placeholder="Сколько нужно человек"
                :value="newVacancy.peoples ? newVacancy.peoples : ''"
                @input="(e) => updateEvent(e.target.value, 'peoples')"
              />
              <span v-if="newVacancy.peoples" class="text-sm font-normal text-bali shrink-0 ml-1">
                {{ getPeopleWord(newVacancy.peoples) }}
              </span>
            </div>
          </div>
           <div class="flex-[1] min-w-0">
              <p class="text-sm font-medium text-space mb-3.5">
                  Желаемая дата закрытия
              </p>
              <DropdownCalendarStatic 
                  :model-value="newVacancy.dateEnd || null"
                  @update:model-value="newVacancy.dateEnd = $event" 
                  :is-open="isOpenDateTo"
                />
           </div>
           <div class="flex-[1] min-w-0">
                <p class="text-sm font-medium text-space leading-normal mb-15px">
                  Отдел
                </p>
                <ResponseInput
                class="w-full"
                :responses="departments"
                :model-value="newVacancy.department ? newVacancy.department : ''"
                :showRoles="true"
                notFound="Отдел не найден"
                placeholder="Название отдела"
                @update:modelValue="newVacancy.department = $event"
              />
              </div>
        </div>
        <div class="w-full mb-6">
          <div class="flex items-center gap-1 mb-3.5">
            <p class="text-sm font-medium text-space">
              <span class="text-red-custom">*</span>
              Специализация сотрудника
            </p>
            <span class="inline-flex items-center cursor-help">
              <svg-icon name="question" width="16" height="16" />
              <MyTooltip text="Должность или направление деятельности, на которое подбираете кандидата" />
            </span>
          </div>
          <ClientOnly>
            <SpecializationSelector
              :options="professionsOptions"
              :full-catalog="hhIndustries && hhIndustries.length ? hhIndustries : []"
              :model-value="newVacancy.specializations && typeof newVacancy.specializations === 'object' ? newVacancy.specializations : (newVacancy.specializations ? { name: newVacancy.specializations } : null)"
              placeholder="Выберите из списка"
              :error="specializationsFieldEmptyError"
              @update:model-value="($event) => { updateEvent($event, 'specializations'); specializationsFieldEmptyError.value = false }"
              @focus="onSpecializationsFocus"
              @blur="onSpecializationsBlur"
            />
            <template #fallback>
              <div class="w-full h-11 rounded-ten border border-athens bg-athens-gray animate-pulse" />
            </template>
          </ClientOnly>
          <p v-if="specializationsFieldEmptyError" class="text-xs text-red-500 mt-1">
            Выберите, чтобы продолжить
          </p>
        </div>
        <div class="w-full mb-6">
          <div class="flex items-center gap-1 mb-3.5">
            <p class="text-sm font-medium text-space">
              Опыт работы
            </p>
            <span class="inline-flex items-center cursor-help">
              <svg-icon name="question" width="16" height="16" />
              <MyTooltip text="Для кандидатов с опытом до года подходит вариант «Нет опыта»" />
            </span>
          </div>
          <div class="flex w-full gap-2">
            <button
              v-for="opt in ArrayExperience"
              :key="opt.id"
              type="button"
              class="flex-1 px-4 py-2.5 text-sm rounded-ten border transition-colors"
              :class="isExperienceSelected(opt)
                ? 'bg-zumthor border-dodger text-dodger font-normal'
                : 'bg-athens-gray border-athens text-bali font-normal hover:bg-dodger hover:border-transparent hover:text-white'"
              @click="updateEvent(opt, 'experience')"
            >
              {{ getExperienceButtonLabel(opt) }}
            </button>
          </div>
        </div>
      </div>
    </div>
    <div
      class="flex gap-x-[24px] pt-3.5"
      @mouseenter="showHintConditions"
      @mouseleave="hideHintConditions"
    >
      <div class="max-w-[875px] flex-grow p-25px bg-white rounded-fifteen">
        <p class="text-space text-xl font-semibold mb-[31px]">
          Условия работы
        </p>
        <div class="w-full mb-6">
          <p class="text-sm font-medium text-space mb-3.5">
            Какого сотрудника ищите?
          </p>
          <div class="flex w-full gap-2">
            <button
              v-for="opt in employeeTypeOptions"
              :key="opt.id"
              type="button"
              class="flex-1 px-4 py-2.5 text-sm rounded-ten border transition-colors"
              :class="isEmployeeTypeSelected(opt)
                ? 'bg-zumthor border-dodger text-dodger font-normal'
                : 'bg-athens-gray border-athens text-bali font-normal hover:bg-dodger hover:border-transparent hover:text-white'"
              @click="employeeType = opt.id"
            >
              {{ opt.name }}
            </button>
          </div>
        </div>
        <div class="w-full mb-6">
          <p class="text-sm font-medium text-space mb-3.5">
            Тип занятости
          </p>
          <div class="flex w-full gap-2">
            <button
              v-for="opt in employmentOptions"
              :key="opt.id"
              type="button"
              class="flex-1 px-4 py-2.5 text-sm rounded-ten border transition-colors"
              :class="isEmploymentSelected(opt)
                ? 'bg-zumthor border-dodger text-dodger font-normal'
                : 'bg-athens-gray border-athens text-bali font-normal hover:bg-dodger hover:border-transparent hover:text-white'"
              @click="updateEvent(opt, 'employment')"
            >
              {{ opt.name }}
            </button>
          </div>
        </div>
        <div class="flex gap-25px mb-6">
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-1 mb-3.5">
              <p class="text-sm font-medium text-space">
                Формат работы
              </p>
              <span class="inline-flex items-center cursor-help">
                <svg-icon name="question" width="16" height="16" />
                <MyTooltip text="Гибридный формат: часть дней в неделю сотрудник работает в офисе, остальное время — удалённо из дома." />
              </span>
            </div>
            <MultiSelect
              :model-value="newVacancy.place"
              :options="placeOptions"
              default-value="Выберите формат работы"
              @update:model-value="setPlace"
            />
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium text-space mb-3.5">
              Оформление сотрудника
            </p>
            <MultiSelect
              :model-value="newVacancy.oformlenie"
              :options="oformlenieOptions"
              default-value="Выберите оформление"
              @update:model-value="setOformlenie"
            />
          </div>
        </div>
      </div>
      <div
        class="hint-block-conditions relative max-w-[275px] sticky top-4 rounded-fifteen bg-white p-15px h-fit shrink-0 border border-athens transition-all duration-500 ease-out"
        :class="isHintConditionsVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4'"
      >
        <div class="hint-block-conditions__arrow" aria-hidden="true"></div>
        <p class="text-space leading-[17px] text-13px font-normal relative z-10">
          Полная — постоянная работа на полный день (обычно 40 ч/нед).<br>
          Частичная — неполный день, можно совмещать с другой работой.<br>
          Вахта — работа с проживанием на территории работодателя.<br>
          Проект — разовая задача с фиксированной оплатой за результат.<br>
          Подработка — краткосрочная занятость с оплатой по часам или сменам.
        </p>
      </div>
      <!-- <div class="max-w-[275px] sticky top-4 rounded-fifteen bg-white p-15px h-fit">
        <p class="text-space leading-[17px] text-13px font-normal">
          Ваша заявка на&nbsp;размещение вакансии
          на&nbsp;14&nbsp;из&nbsp;18&nbsp;бесплатных площадках находиться
          в&nbsp;стадии рассмотрения. Эта вакансия уже опубликована
          на&nbsp;вашей странице вакансий. Процесс утверждения займет
          до&nbsp;4&nbsp;часов.
        </p>
      </div> -->
    </div>
    <div class="flex gap-x-[24px] pt-3.5">
      <div class="max-w-[875px] flex-grow p-25px bg-white rounded-fifteen">
        <p class="text-space text-xl font-semibold mb-[31px]">
          График и часы работы
        </p>
        <div class="flex gap-25px mb-6 items-start">
          <div class="flex-1 min-w-0 flex flex-wrap gap-2 self-start">
            <div class="w-full flex items-center gap-1 mb-3.5">
              <p class="text-sm font-medium text-space">
                График работы
              </p>
              <span class="inline-flex items-center cursor-help">
                <svg-icon name="question" width="16" height="16" />
                <MyTooltip text="Распределение рабочих дней и выходных — например, пятидневка (5/2), двухсменный график (2/2) или сменный." />
              </span>
            </div>
            <button
              v-for="opt in ArraySchedule"
              :key="opt.value"
              type="button"
              class="px-4 py-2.5 text-sm rounded-ten border transition-colors"
              :class="isScheduleSelected(opt)
                ? 'bg-zumthor border-dodger text-dodger font-normal'
                : 'bg-athens-gray border-athens text-bali font-normal hover:bg-dodger hover:border-transparent hover:text-white'"
              @click="handleScheduleSelect(opt)"
            >
              {{ opt.name }}
            </button>
            <p v-if="errors.schedule" class="w-full text-xs text-red-500 mt-1">{{ errors.schedule }}</p>
          </div>
          <div class="flex-1 min-w-0 flex flex-wrap gap-2 self-start">
            <p class="w-full text-sm font-medium text-space mb-3.5">
              Рабочие часы в день
            </p>
            <button
              v-for="opt in workHoursPerDayOptions"
              :key="opt.value"
              type="button"
              class="px-4 py-2.5 text-sm rounded-ten border transition-colors"
              :class="isWorkHoursSelected(opt)
                ? 'bg-zumthor border-dodger text-dodger font-normal'
                : 'bg-athens-gray border-athens text-bali font-normal hover:bg-dodger hover:border-transparent hover:text-white'"
              @click="handleWorkHoursSelect(opt)"
            >
              {{ opt.name }}
            </button>
            <p v-if="errors.workHoursPerDay" class="w-full text-xs text-red-500 mt-1">{{ errors.workHoursPerDay }}</p>
          </div>
        </div>
        <MyCheckbox
          :id="'has-evening-night-shifts'"
          label="Есть вечерние или ночные смены"
          v-model="newVacancy.hasEveningNightShifts"
        />
      </div>
    </div>
    <div
      class="flex gap-x-[24px] pt-3.5"
      @mouseenter="showHintCityAddress"
      @mouseleave="hideHintCityAddress"
    >
      <div class="max-w-[875px] flex-grow p-25px bg-white rounded-fifteen">
        <p class="text-space text-xl font-semibold mb-[31px]">
          Город публикации и адрес работы
        </p>
        <div class="w-full mb-6">
          <p class="text-sm font-medium text-space mb-3.5">
            <span class="text-red-custom">*</span>
            Город публикации
          </p>
          <ClientOnly>
            <geo-input
              class="mb-2.5"
              :model-value="newVacancy.location"
              :error="publicationCityFieldEmptyError"
              placeholder="Например, Москва, Санкт-Петербург"
              @update:model-value="onPublicationCityUpdate"
              @blur="onPublicationCityBlur"
            />
            <template #fallback>
              <div class="w-full h-11 rounded-ten border border-athens bg-athens-gray animate-pulse" />
            </template>
          </ClientOnly>
          <p v-if="publicationCityFieldEmptyError" class="text-xs text-red-500 mt-1">
            Выберите город, где опубликовать вакансию
          </p>
        </div>
        <div class="w-full mb-6">
          <p class="text-sm font-medium text-space mb-3.5">
            <span class="text-red-custom">*</span>
            Адрес работы сотрудника
          </p>
          <ClientOnly>
            <AddressMapInput
              :model-value="newVacancy.workAddress"
              :hide-address="newVacancy.hideWorkAddress"
              :error="workAddressFieldEmptyError"
              placeholder="Введите адрес, метро или название компании"
              @update:model-value="($event) => { newVacancy.workAddress = $event || ''; clearWorkAddressError() }"
              @update:hide-address="(val) => { newVacancy.hideWorkAddress = val; clearWorkAddressError() }"
              @focus="onWorkAddressFocus"
              @blur="onWorkAddressBlur"
            />
            <template #fallback>
              <div class="w-full h-11 rounded-ten border border-athens bg-athens-gray animate-pulse mb-3" />
              <div class="w-full h-[300px] rounded-ten border border-athens bg-athens-gray animate-pulse" />
            </template>
          </ClientOnly>
          <p v-if="workAddressFieldEmptyError" class="text-xs text-red-500 mt-1">
            Укажите адрес работы сотрудника
          </p>
        </div>
      </div>
      <div
        class="hint-block-conditions relative max-w-[275px] sticky top-4 rounded-fifteen bg-white p-15px h-fit shrink-0 border border-athens transition-all duration-500 ease-out"
        :class="isHintCityAddressVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4'"
      >
        <div class="hint-block-conditions__arrow" aria-hidden="true"></div>
        <p class="text-space leading-[17px] text-13px font-normal relative z-10">
          Город публикации — вакансию увидят жители выбранного города и кандидаты, готовые туда переехать.<br>
          Адрес работы — без адреса вакансия часто не попадает в поиск: многие ищут работу рядом с домом и отсеивают предложения без указания места.
        </p>
      </div>
    </div>
    <div class="flex gap-x-[24px] pt-3.5">
      <div class="max-w-[875px] flex-grow p-25px bg-white rounded-fifteen">
        <p class="text-space text-xl font-semibold mb-[31px]">
          Заработная плата
        </p>
        <div class="flex flex-col gap-4">
          <div class="flex gap-4 items-start">
            <div class="w-[60%] min-w-0">
              <p class="text-sm font-medium text-space mb-3.5">
                Диапазон заработной платы
              </p>
              <SalaryRange 
                class="mb-0" 
                :model-value="salary" 
                :from="salary.from" 
                :to="salary.to"
                @update:model-value="updateSalary" 
              />
              <div v-if="errors.salary" class="text-red-500 text-xs mt-1">
                {{ errors.salary }}
              </div>
              <div class="flex gap-2 flex-wrap mt-4">
                <button
                  v-for="opt in salaryTypeOptions"
                  :key="opt.id"
                  type="button"
                  class="w-fit px-4 py-2.5 text-sm rounded-ten border transition-colors whitespace-nowrap"
                  :class="salaryType === opt.id
                    ? 'bg-zumthor border-dodger text-dodger font-normal'
                    : 'bg-athens-gray border-athens text-bali font-normal hover:bg-dodger hover:border-transparent hover:text-white'"
                  @click="salaryType = opt.id"
                >
                  {{ opt.name }}
                </button>
              </div>
            </div>
            <div class="w-[10%] min-w-0">
              <p class="text-sm font-medium text-space mb-3.5">Валюта</p>
              <MyDropdown
                :options="currencySymbolOptions"
                :model-value="newVacancy.currency"
                :initialValue="newVacancy.currency"
                placeholder="₽"
                @update:model-value="updateEvent($event, 'currency')"
              />
            </div>
            <div class="w-[30%] min-w-0">
              <p class="text-sm font-medium text-space mb-3.5">Период выплат</p>
              <MyDropdown
                :options="salaryPeriodOptions"
                :model-value="newVacancy.salary_frequency"
                :initialValue="newVacancy.salary_frequency"
                placeholder="За месяц"
                @update:model-value="updateEvent($event, 'salary_frequency')"
              />
            </div>
          </div>
          <div class="w-full mt-4">
            <p class="text-sm font-medium text-space mb-3.5">Частота выплат</p>
            <div class="flex w-full gap-2">
              <button
                v-for="opt in salaryPaymentFrequencyOptions"
                :key="opt"
                type="button"
                class="flex-1 px-4 py-2.5 text-sm rounded-ten border transition-colors"
                :class="newVacancy.salary_payment_frequency === opt
                  ? 'bg-zumthor border-dodger text-dodger font-normal'
                  : 'bg-athens-gray border-athens text-bali font-normal hover:bg-dodger hover:border-transparent hover:text-white'"
                @click="updateEvent(opt, 'salary_payment_frequency')"
              >
                {{ opt }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div
      class="flex gap-x-[24px] pt-3.5"
      @mouseenter="showHintDescription"
      @mouseleave="hideHintDescription"
    >
      <div class="max-w-[875px] flex-grow p-25px bg-white rounded-fifteen">
        <p class="text-space text-xl font-semibold mb-[31px]">
          Описание вакансии
        </p>
        <div class="w-full mb-3.5">
          <div class="w-full flex justify-between">
            <p class="text-sm font-medium text-space">
              <span class="text-red-custom">*</span>
              Описание вакансии
            </p>
            <generate-button />
          </div>
        </div>
        <div
          class="mt-15px mb-11px rounded-fifteen border transition-colors"
          :class="!!errors.description ? 'border-red-500' : 'border-transparent'"
        >
          <TiptapEditor
            :model-value="newVacancy.description ? newVacancy.description : ''"
            @update:model-value="(value) => { updateEvent(value, 'description'); if (getDescriptionTextLength(value) >= DESCRIPTION_MIN_LENGTH && errors.description) delete errors.description }"
            @blur="onDescriptionBlur"
            :newVacancy="true"
          />
        </div>
        <p class="text-xs font-normal mb-6 mt-1" :class="errors.description ? 'text-red-500' : 'text-bali'">
          {{ errors.description || `Максимум 700 символов. Использовано ${descriptionCharCount} символов.` }}
        </p>
        <div class="w-full mb-6">
          <p class="text-sm font-medium text-space mb-13px">Навыки</p>
          <ClientOnly>
            <SkillsDropdown
              :options="tags"
              :model-value="newVacancy.phrases || []"
              placeholder="Найдите или напишите свой вариант"
              @update:model-value="(data) => updateTags(Array.isArray(data) ? data : [])"
            />
            <template #fallback>
              <div class="min-h-[42px] w-full py-9px px-15px border border-athens rounded-ten bg-athens-gray text-sm text-bali flex items-center">
                Найдите или напишите свой вариант
              </div>
            </template>
          </ClientOnly>
        </div>
        <div class="w-full mb-6">
          <MyAccordion ref="languagesAccordionRef" title="Языки" class="mb-0 w-full">
            <div class="flex flex-col gap-15px w-full">
              <div
                v-for="(item, index) in (newVacancy.languages || [])"
                :key="index"
                class="flex flex-row flex-wrap items-center gap-x-25px gap-y-15px w-full"
              >
                <MyDropdown
                  class="min-w-[180px] flex-1 w-full"
                  :options="languageDropdownOptions"
                  :model-value="item.language"
                  placeholder="Выберите язык"
                  @update:model-value="(v) => updateLanguageAt(index, v)"
                  @open="() => { if (index === 0) onFirstLanguageDropdownOpen() }"
                />
                <MyDropdown
                  class="min-w-[200px] flex-1 w-full"
                  :options="languageLevelDropdownOptions"
                  :model-value="item.languageLevel"
                  placeholder="Выберите уровень"
                  @update:model-value="(v) => updateLanguageLevelAt(index, v)"
                />
                <button
                  type="button"
                  class="p-1 text-bali hover:text-space transition-colors shrink-0"
                  aria-label="Удалить"
                  @click="removeLanguageRow(index)"
                >
                  <svg-icon name="dropdown-cross" width="20" height="20" />
                </button>
              </div>
              <button
                type="button"
                class="text-sm text-dodger font-medium hover:underline w-fit"
                @click="addLanguageRow"
              >
                Добавить ещё один язык
              </button>
            </div>
          </MyAccordion>
        </div>
        <div class="w-full mb-6">
          <MyAccordion title="Водительские права" class="mb-0 w-full">
            <div class="flex flex-wrap gap-2">
              <button
                v-for="opt in ArrayCarId"
                :key="opt.value"
                type="button"
                class="px-4 py-2.5 text-sm rounded-ten border transition-colors"
                :class="isDriversSelected(opt)
                  ? 'bg-zumthor border-dodger text-dodger font-normal'
                  : 'bg-athens-gray border-athens text-bali font-normal hover:bg-dodger hover:border-transparent hover:text-white'"
                @click="handleDriversSelect(opt)"
              >
                {{ opt.label }}
              </button>
            </div>
          </MyAccordion>
        </div>
        <div class="mb-9">
            <div class="flex items-center gap-1 mb-13px">
            <p class="text-sm font-medium text-space mr-[3px]">Комментарий или заметки</p>
            <span class="inline-flex items-center cursor-help">
                  <svg-icon name="question" width="16" height="16" />
                  <MyTooltip
                    text="Это необязательное поле, в нем вы можете указать ссылку на вакансию или любые заметки, которые могут быть полезны другим рекрутерам и заказчикам" />
            </span>
          </div>
          <MyTextarea 
            placeholder="Ссылка на вакансию, заметки для коллег, подсказки по поиску кандидатов..." 
            :model-value="newVacancy.comment ? newVacancy.comment : ''" 
            class="w-full"
          />
           
        </div>
      </div>
      <div
        class="hint-block-conditions relative max-w-[275px] sticky top-4 rounded-fifteen bg-white p-15px h-fit shrink-0 border border-athens transition-all duration-500 ease-out"
        :class="isHintDescriptionVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4'"
      >
        <div class="hint-block-conditions__arrow" aria-hidden="true"></div>
        <p class="text-space leading-[17px] text-13px font-normal relative z-10">
          Не указывайте контакты (email, телефон) в тексте — для этого есть отдельные поля.<br>
          Указывайте только профессиональные требования: не упоминайте пол, возраст, национальность и другие личные качества.<br>
          Минимум 150 символов.
        </p>
      </div>
    </div>
    <div class="flex gap-x-[24px] pt-3.5 mb-25px">
      <div class="max-w-[875px] flex-grow p-25px bg-white rounded-fifteen">
        <p class="leading-normal text-space text-xl font-semibold mb-[33px]">
          Контактная информация
        </p>
        <MyCheckbox
          :id="'hide-contacts'"
          label="Не отображать контакты в вакансии"
          v-model="hideContactFields"
          class="mb-6"
        />
        <template v-if="!hideContactFields">
        <p class="text-sm font-medium text-space mb-16px">
          <span class="text-red-custom">*</span>
          Контактное лицо
        </p>
        <ResponseInput 
          class="mb-11px w-full" 
          :show-search-icon="false"
          placeholder="Имя ответственного за вакансию или собеседования"
          :responses="executors"
          :error="executorNameFieldEmptyError"
          :model-value="newVacancy.executor_name ? newVacancy.executor_name : ''"
          @input:modelValue="(e) => { updateEvent(e, 'executor_name'); clearExecutorNameError() }"
          @update:modelValue="(e) => { updateEvent(e, 'executor_name'); clearExecutorNameError() }"
          @blur="onExecutorNameBlur"
        />
        <p v-if="executorNameFieldEmptyError" class="text-xs text-red-500 mt-1">
          Укажите, к кому кандидаты могут обращаться
        </p>
        <div class="w-full flex justify-between gap-x-[25px]">
          <div class="w-full max-w-[400px]">
            <p class="text-sm font-medium text-space leading-normal mb-4">
              Номер телефона
            </p>
            <phone-input :model-value="newVacancy.executor_phone"
              @update:model-value="$event => updateEvent($event, 'executor_phone')" class="mb-25px" />
          </div>
          <div class="w-full">
            <p class="text-sm font-medium text-space leading-normal mb-4">
              Email
            </p>
            <email-input :model-value="newVacancy.executor_email"
              @update:model-value="$event => updateEvent($event, 'executor_email')" />
          </div>
        </div>
        </template>
      </div>
      <!-- <div class="max-w-[275px] sticky top-4 rounded-fifteen bg-white p-15px h-fit">
        <p class="text-space leading-[17px] text-13px font-normal">
          Ваша заявка на&nbsp;размещение вакансии
          на&nbsp;14&nbsp;из&nbsp;18&nbsp;бесплатных площадках находиться
          в&nbsp;стадии рассмотрения. Эта вакансия уже опубликована
          на&nbsp;вашей странице вакансий. Процесс утверждения займет
          до&nbsp;4&nbsp;часов.
        </p>
      </div> -->
    </div>
    <UiButton @click="saveVacancy({ goToPublish: true })" variant="action" size="semiaction" class="font-semibold">
      Сохранить и продолжить
    </UiButton>
    <div v-if="errors.response" class="text-red-500 text-xs mt-1">
      {{ errors.response }}
    </div>
  </div>
</template>

<style scoped>
.max-w-input {
  max-width: calc(50% - 12.5px);
}
.block {
  padding-top: 12rem;
}
.plan-hire-input-wrapper:focus-within {
  border-color: #5898ff;
}
.plan-hire-input-wrapper input::placeholder {
  color: #9098b4;
}
.plan-hire-input-wrapper input::-webkit-outer-spin-button,
.plan-hire-input-wrapper input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
.hint-block-conditions__arrow {
  position: absolute;
  left: -10px;
  top: 50%;
  transform: translateY(-50%);
  width: 0;
  height: 0;
  border-top: 10px solid transparent;
  border-bottom: 10px solid transparent;
  border-right: 10px solid white;
  filter: drop-shadow(-1px 0 0 #edeff5);
  z-index: 1;
}
</style>

