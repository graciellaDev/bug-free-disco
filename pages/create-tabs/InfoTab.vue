<script setup>
import Autocomplete from '~/components/custom/Autocomplete.vue'
import MyInput from '~/components/custom/MyInput.vue'
import MyTooltip from '~/components/custom/MyTooltip.vue'
import TiptapEditor from '~/components/TiptapEditor.vue'
import MyDropdown from '~/components/custom/MyDropdown.vue'
import TagSelect from '~/components/custom/TagSelect.vue'
import MyAccordion from '~/components/custom/MyAccordion.vue'
import MyCheckbox from '~/components/custom/MyCheckbox.vue'
import SalaryRange from '~/components/custom/SalaryRange.vue'
import { Label } from '~/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { parseHtmlToJson } from '~/utils/htmlParser'
import CardOption from '~/components/custom/CardOption.vue'
import GeoInput from '~/components/custom/GeoInput.vue'
import ResponseInput from '~/components/custom/ResponseInput.vue'
import CheckboxGroup from '~/components/custom/CheckboxGroup.vue'
import PhoneInput from '~/components/custom/PhoneInput.vue'
import EmailInput from '~/components/custom/EmailInput.vue'
import CustomDropdown from '~/components/custom/CustomDropdown.vue'
import GenerateButton from '~/components/custom/GenerateButton.vue'
import MyTextarea from '~/components/custom/MyTextarea.vue'
import DropdownCalendarStatic from '~/components/custom/DropdownCalendarStatic.vue'
import { getDepartments, executorsList } from '~/utils/executorsList'
import { useRoute } from 'vue-router'
import { createError } from '#app'

import schedule from '~/src/data/work-schedule.json'
import experience from '~/src/data/experience.json'
import education from '~/src/data/education.json'
import currency from '~/src/data/currency.json'
import AccordionAdditional from '~/src/data/accordion-additional.json'
import CarId from '~/src/data/car-id.json'
import MoreOptions from '~/src/data/more-options.json'
import industry from '~/src/data/industry.json'
import specialization from '~/src/data/specialization.json'

import { ref, computed, watch, onBeforeMount } from 'vue'
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
const ArrayMajors = majors
const ArrayIndustry = industry

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


const options = ref([
  {
    name: 'Полная',
    value: 1,
  },
  {
    name: 'Частичная',
    value: 2,
  },
  {
    name: 'Временная',
    value: 3,
  },
  {
    name: 'Стажировка',
    value: 4,
  },
])
const selectedCard = ref(null)
const hoveredCard = ref(null)

const executors = ref([])

const handleCheck = id => {
  selectedCard.value = id
  workSpace.value = id
}


onBeforeMount(async () => {
  const { executors: executorData } = await executorsList();
  executors.value = executorData
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

const cards = [
  {
    id: '1',
    title: 'Офис',
    description: 'Сотрудники<br>работают в офисе',
  },
  {
    id: '2',
    title: 'Гибрид',
    description: 'Сотрудники работают как офисе,<br>так и дома',
  },
  {
    id: '3',
    title: 'Удаленно',
    description: 'Сотрудники<br>работают из дома',
  },
]

const showContacts = ref(true)
const salaryType = ref('')

const newVacancy = ref({ place: 1, currency: 'RUB (рубль)', status: 'В работе' })
const originalVacancyRaw = ref(null) // Исходные сырые данные с сервера
const originalVacancyData = ref(null) // Отформатированные исходные данные для сравнения

if (props.id) {
  const currectVacancy = await getVacancy(props.id)
  if (currectVacancy) {
    selectedCard.value = currectVacancy.place ? currectVacancy.place.toString() : '1'
    for (let key in currectVacancy) {
      newVacancy.value[key] = currectVacancy[key]
    }
    // Преобразуем статус из формата API в русское название для отображения
    if (currectVacancy.status) {
      newVacancy.value.status = getStatusDisplayValue(currectVacancy.status)
    } else {
      // Если статус не указан, устанавливаем 'active' по умолчанию
      newVacancy.value.status = 'В работе'
    }
    // Конвертируем dateEnd из формата Y-m-d в d.m.Y
    if (currectVacancy.dateEnd) {
      newVacancy.value.dateEnd = convertDateFromApi(currectVacancy.dateEnd)
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
  from: newVacancy.value.salary_from ? newVacancy.value.salary_from : null,
  to: newVacancy.value.salary_to ? newVacancy.value.salary_to : null
})
const errors = ref({})
const isOpenDateTo = ref(false)
const departments = ref([])
const { data } = await getPhrases()
tags.value = data || [];

departments.value = await getDepartments();

const route = useRoute();

// Функция для преобразования phrases из ID в названия
function getPhrasesArray(phrasesIds) {
  if (!phrasesIds || !Array.isArray(phrasesIds) || phrasesIds.length === 0) {
    return []
  }
  return phrasesIds
    .map(id => {
      const tag = tags.value.find(t => t.id === id || String(t.id) === String(id));
      return tag ? tag.name : null;
    })
    .filter(name => name !== null);
}

// Функция для преобразования employment из ID в текст
function getEmploymentText(employmentValue) {
  if (!employmentValue) return ''
  
  const employmentOption = options.value.find(opt => {
    const optValueNum = Number(opt.value);
    const empValueNum = Number(employmentValue);
    return opt.value === employmentValue || 
           optValueNum === empValueNum || 
           opt.name === employmentValue ||
           String(opt.value) === String(employmentValue);
  });
  
  if (employmentOption) {
    return employmentOption.name;
  }
  
  // Если это уже строка (название), используем её
  if (typeof employmentValue === 'string') {
    return employmentValue;
  }
  
  return '';
}

// Функция для преобразования schedule из ID в текст
function getScheduleText(scheduleValue) {
  if (!scheduleValue) return ''
  
  const scheduleOption = ArraySchedule.find(opt => {
    const optValueNum = Number(opt.value);
    const schValueNum = Number(scheduleValue);
    return opt.value === scheduleValue || 
           optValueNum === schValueNum || 
           opt.name === scheduleValue ||
           String(opt.value) === String(scheduleValue);
  });
  
  if (scheduleOption) {
    return scheduleOption.name;
  }
  
  // Если это уже строка (название), используем её
  if (typeof scheduleValue === 'string') {
    return scheduleValue;
  }
  
  return '';
}

// Функция для преобразования experience из ID в текст
function getExperienceText(experienceValue) {
  if (!experienceValue) return ''
  
  const experienceOption = ArrayExperience.find(opt => {
    const optValueNum = Number(opt.value);
    const expValueNum = Number(experienceValue);
    return opt.value === experienceValue || 
           optValueNum === expValueNum || 
           opt.name === experienceValue ||
           opt.id === experienceValue ||
           String(opt.value) === String(experienceValue) ||
           String(opt.id) === String(experienceValue);
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

const vacancyData = computed(() => {
  return {
    name: newVacancy.value.name,
    code: newVacancy.value.code || '',
    description: newVacancy.value.description || '',
    industry: newVacancy.value.industry || '',
    specializations: newVacancy.value.specializations || '',
    employment: getEmploymentText(newVacancy.value.employment),
    schedule: getScheduleText(newVacancy.value.schedule),
    experience: getExperienceText(newVacancy.value.experience),
    education: getEducationText(newVacancy.value.education),
    phrases: getPhrasesArray(newVacancy.value.phrases),
    conditions: newVacancy.value.conditions || [],
    drivers: newVacancy.value.drivers || [],
    additions: newVacancy.value.additions || [],
    salary_from: salary.value.from,
    salary_to: salary.value.to,
    currency: newVacancy.value.currency || 'RUB (рубль)',
    place: newVacancy.value.place || '1',
    location: newVacancy.value.location || '',
    customer_id: 10,
    customer_phone: newVacancy.value.executor_phone || null,
    customer_email: newVacancy.value.executor_email || '',
    status: getStatusValue(newVacancy.value.status),
    // department: newVacancy.value.department || '',
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
    experience: getExperienceText(original.experience),
    education: getEducationText(original.education),
    phrases: getPhrasesArray(original.phrases),
    conditions: original.conditions || [],
    drivers: original.drivers || [],
    additions: original.additions || [],
    salary_from: original.salary_from || null,
    salary_to: original.salary_to || null,
    currency: original.currency || 'RUB (рубль)',
    place: original.place || '1',
    location: original.location || '',
    customer_phone: original.executor_phone || null,
    customer_email: original.executor_email || '',
    status: getStatusValue(original.status),
    // department: original.department || '',
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

  if (!newVacancy.value.description) {
    errors.value.description = 'Поле обязательно к заполнению'
    errorsValid = false
  } else {
    if (errors.value.description) delete errors.value.description
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

// Функция для сравнения значений (включая массивы)
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
    'employment', 'schedule', 'experience', 'education',
    'phrases', 'conditions', 'drivers', 'additions',
    'salary_from', 'salary_to', 'currency', 'place', 'location',
    'customer_phone', 'customer_email', 'status', /* 'department', */ 'dateEnd', 'comment', 'peoples'
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

async function saveVacancy() {
  if (validateVacancy()) {
    let response, error;
    
    // Используем vacancyData для получения правильных данных (phrases как массив)
    const fullData = { ...vacancyData.value };
    fullData.application = route.query.application ?? null;
    
    if (props.type === 'edit') {
      // При редактировании отправляем только измененные поля
      const changedFields = getChangedFields(fullData, originalVacancyData.value);
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
      await navigateTo('/vacancies')
    }
  }
}

const updateEvent = (data, property) => {
  newVacancy.value[property] = data
}

const updateEventObject = (data, property, obj) => {
  newVacancy.value[property] = obj
}


const updateTags = (data) => {
  if (data.length > 0) {
    newVacancy.value.phrases = data.map(item => item.id)
  } else {
    delete newVacancy.value.phrases
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
        <p class="text-space text-xl font-semibold mb-8">Основная информация</p>
        <div class="w-full justify-between flex gap-25px mb-6">
          <div class="w-full">
            <p class="text-sm font-medium mb-4 leading-normal text-space">
              <span class="text-red-custom">*</span>
              Название должности
            </p>
            <Autocomplete :source="ArrayMajors" :model-value="newVacancy.name ? newVacancy.name : ''"
              @update:model-value="$event => updateEvent($event, 'name')" placeholder="Например, Менеджер по продажам"
              class="mb-11px" />
            <div v-if="errors.name" class="text-red-500 text-xs mt-1">
              {{ errors.name }}
            </div>
            <p class="text-xs text-bali">
              Осталось 80 символов. Специальных символов нет.
            </p>
          </div>
          <div class="w-full">
            <div class="flex">
              <p class="text-sm font-medium mb-4 leading-normal text-space mr-[3px]">
                Код вакансии
              </p>
              <span>
                <svg-icon name="question" width="20" height="20" />
                <MyTooltip
                  text="Укажите номер или идентификатор вакансии из ваших систем (например, из 1С), чтобы не путать вакансии с одинаковыми названиями между собой" />
              </span>
            </div>
            <div class="max-w-400px">
              <MyInput :placeholder="'Код вакансии'" type="string" :model-value="newVacancy.code ? newVacancy.code : ''"
                @update:model-value="$event => updateEvent($event, 'code')" />
            </div>
          </div>
        </div>
        <div class="flex justify-between gap-25px mb-3.5">
          <div class="w-full">
            <p class="text-sm font-medium text-space mb-3.5">
                  Статус
            </p>
            <MyDropdown 
                  :defaultValue="'В работе'" 
                  placeholder="Выберите статус"
                  :options="['В работе', 'Черновик', 'Архив']"
                  :model-value="newVacancy.status ? newVacancy.status : 'В работе'"
                  @update:model-value="$event => newVacancy.status = $event || 'В работе'" 
            />
          </div>
           <div class="w-full">
              <p class="text-sm font-medium text-space mb-3.5">
                  Желаемая дата закрытия
              </p>
              <DropdownCalendarStatic 
                  :model-value="newVacancy.dateEnd || null"
                  @update:model-value="newVacancy.dateEnd = $event" 
                  :is-open="isOpenDateTo"
                />
           </div>
           <div class="w-full">
                <p class="text-sm font-medium text-space leading-normal mb-15px">
                  Отдел
                </p>
                <ResponseInput
                class="w-full"
                :responses="departments"
                :model-value="newVacancy.department ? newVacancy.department : ''"
                :showRoles="true"
                notFound="Отдел не найден"
                placeholder="Введите название отдела"
                @update:modelValue="newVacancy.department = $event"
              />
              </div>
        </div>
        <div class="w-full">
          <div class="w-full flex justify-between">
            <p class="text-sm font-medium text-space">
              <span class="text-red-custom">*</span>
              Описание вакансии
            </p>
            <generate-button />
          </div>
        </div>
        <div class="mt-15px mb-3.5">
          <TiptapEditor :model-value="newVacancy.description ? newVacancy.description : ''"
            @update:model-value="(value) => updateEvent(value, 'description')" :newVacancy="true" />
        </div>
        <div id v-if="errors.description" class="text-red-500 text-xs mt-1">
          {{ errors.description }}
        </div>
        <p class="text-xs text-bali font-normal">
          Максимум 700 символов. Использовано 0 символов.
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
          Подробности о компании
        </p>
        <div class="flex justify-between gap-25px">
          <div class="w-full">
            <p class="text-sm font-medium text-space mb-3.5">
              Отрасль компании
            </p>
            <div class="w-full relative">
              <CustomDropdown :options="ArrayIndustry" placeholder="Выберите отрасль"
                :model-value="newVacancy.industry ? newVacancy.industry : ''"
                @update:model-value="$event => updateEvent($event, 'industry')" />
            </div>
          </div>
          <div class="w-full">
            <p class="text-sm font-medium text-space mb-3.5">
              Выберите специализацию
            </p>
            <div>
              <CustomDropdown :options="ArraySpecialization" placeholder="Выберите специализацию"
                :model-value="newVacancy.specializations ? newVacancy.specializations : ''"
                @update:model-value="$event => updateEvent($event, 'specializations')" />
            </div>
          </div>
        </div>
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
          Подробности вакансии
        </p>
        <div class="flex justify-between gap-25px mb-3.5">
          <div class="w-full">
            <p class="text-sm font-medium text-space mb-3.5">Тип занятости</p>
            <MyDropdown :defaultValue="'Выберите значение'" :options="options"
              :model-value="newVacancy.employment ? newVacancy.employment : ''" :initialValue="newVacancy.employment"
              @update:model-value="$event => updateEvent($event, 'employment')" />
          </div>
          <div class="w-full">
            <p class="text-sm font-medium text-space mb-3.5">График работы</p>
            <MyDropdown :defaultValue="'Выберите значение'" :options="ArraySchedule" placeholder="График работы"
              :model-value="newVacancy.schedule ? newVacancy.schedule : ''" :initialValue="newVacancy.schedule"
              @update:model-value="$event => updateEvent($event, 'schedule')" />
          </div>
        </div>
        <div class="flex justify-between gap-25px mb-3.5">
          <div class="w-full">
            <p class="text-sm font-medium text-space mb-3.5">Опыт работы</p>
            <my-dropdown :defaultValue="'Выберите значение'" :options="ArrayExperience"
              :model-value="newVacancy.experience ? newVacancy.experience : ''" :initialValue="newVacancy.experience"
              @update:model-value="(value) => updateEvent(value, 'experience')" />
          </div>
          <div class="w-full">
            <p class="text-sm font-medium text-space mb-3.5">Образование</p>
            <MyDropdown :defaultValue="'Выберите значение'" :options="ArrayEducation"
              :model-value="newVacancy.education ? newVacancy.education : ''" :initialValue="newVacancy.education"
              @update:model-value="(value) => updateEvent(value, 'education')" />
          </div>
        </div>
        <div class="flex justify-between gap-25px mb-3.5">
          <div class="w-full max-w-input">
            <p class="text-sm font-medium text-space mb-13px">Ключевые фразы</p>
            <tag-select :options="tags" :model-value="newVacancy.phrases ? newVacancy.phrases : []"
              @update:model-value="$event => updateTags($event)" @delete="$event => updateTags($event)" />
          </div>
          <div class="w-full max-w-input">
            <p class="text-sm font-medium text-space mb-13px">Количество человек</p>
            <MyInput :placeholder="'Введите количество'" type="number" :model-value="newVacancy.peoples ? newVacancy.peoples : ''"
                  @update:model-value="$event => updateEvent($event, 'peoples')" />
          </div>
        </div>
        <div class="mb-9">
            <div class="flex">
            <p class="text-sm font-medium text-space mb-13px mr-[3px]">Комментарий или заметки</p>
            <span>
                  <svg-icon name="question" width="20" height="20" />
                  <MyTooltip
                    text="Это необязательное поле, в нем вы можете указать ссылку на вакансию или любые заметки, которые могут быть полезны другим рекрутерам и заказчикам" />
            </span>
          </div>
          <div class="flex w-[calc(100% + 275px)] gap-50px" style="width: calc(100% + 325px)">
            <MyTextarea 
              :placeholder="'Введите текст'" 
              :model-value="newVacancy.comment ? newVacancy.comment : ''" 
              style="width: 100%"
            />
            <div class="max-w-[275px] sticky top-4 rounded-fifteen bg-white p-15px h-fit">
             <p class="text-space leading-[17px] text-13px font-normal">
                Это необязательное поле, в нем вы можете указать ссылку на вакансию или любые заметки, которые могут быть полезны другим рекрутерам и заказчикам 
             </p>
            </div>
          </div>
           
        </div>
        <div class="w-fit">
          <MyAccordion title="дополнительные условия" class="mb-15px">
            <div class="flex flex-col flex-wrap max-h-40 gap-x-25px gap-y-15px">
              <CheckboxGroup :model-value="newVacancy.conditions" :options="ArrayAdditional"
                @update:model-value="(value) => updateEvent(value, 'conditions')" />
            </div>
          </MyAccordion>
          <MyAccordion title="водительские права" class="mb-15px">
            <div class="flex flex-col flex-wrap max-h-[195px] gap-x-25px gap-y-15px">
                <CheckboxGroup v-model="newVacancy.drivers" :options="ArrayCarId"
                @update:model-value="(value, data) => updateEventObject(value, 'drivers', data)" />
            </div>
          </MyAccordion>
          <MyAccordion title="дополнительные пожелания">
            <div class="flex flex-col flex-wrap max-h-[195px] gap-x-25px gap-y-15px">
              <CheckboxGroup v-model="newVacancy.additions" :options="ArrayOptions"
                @update:model-value="(value) => updateEvent(value, 'additions')" />
            </div>
          </MyAccordion>
        </div>
      </div>
    </div>
    <div class="flex gap-x-[24px] pt-3.5">
      <div class="max-w-[875px] flex-grow p-25px bg-white rounded-fifteen">
        <p class="text-space text-xl font-semibold mb-[31px]">
          Заработная плата
        </p>
        <div class="flex justify-between gap-25px">
          <div class="w-full">
            <p class="text-sm font-medium text-space mb-3.5">
              Заработная плата / мес
            </p>
            <SalaryRange 
              class="mb-4" 
              :model-value="salary" 
              :from="salary.from" 
              :to="salary.to"
              @update:model-value="updateSalary" 
            />
            <div v-if="errors.salary" class="text-red-500 text-xs mt-1">
              {{ errors.salary }}
            </div>
            <div>
              <RadioGroup default-value="past-cash" class="flex gap-[18px]" v-model="salaryType">
                <div class="my-checkbox">
                  <Label for="past-cash" class="cursor-pointer flex items-center">
                    <RadioGroupItem id="past-cash" value="past-cash" class="mr-5px" />
                    <p>На руки</p>
                  </Label>
                </div>
                <div class="my-checkbox">
                  <Label for="full-cash" class="cursor-pointer flex items-center">
                    <RadioGroupItem id="full-cash" value="full-cash" class="mr-5px" />
                    <p>До вычета налогов</p>
                  </Label>
                </div>
              </RadioGroup>
            </div>
          </div>
          <div class="w-full">
            <p class="text-sm font-medium text-space mb-3.5">Валюта</p>
            <MyDropdown 
              :defaultValue="'Валюта'" 
              :options="ArrayCurrency" 
              :selected="ArrayCurrency[0].value"
              :initialValue="newVacancy.currency" 
              :model-value="newVacancy.currency"
              @update:model-value="($event) => {
                   console.log('update currency', ArrayCurrency.find((item) => item.value === $event));updateEvent(ArrayCurrency.find((item) => item.value === $event).name, 'currency')
             }"
            />
          </div>
        </div>
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
        <p class="text-space text-xl font-semibold mb-[33px]">Место работы</p>
        <div class="mb-[23px]">
          <RadioGroup default-value="1" class="flex gap-x-15px w-full" v-model="selectedCard"
            @update:model-value="$event => updateEvent($event, 'place')">
            <CardOption v-for="card in cards" :key="card.id" :id="card.id" :title="card.title"
              :description="card.description" :selectedCards="selectedCard" :hoveredCard="hoveredCard"
              @update:selected="handleCheck" @hover="handleHover" @leave="clearHover" />
          </RadioGroup>
        </div>
        <p class="text-sm font-medium text-space mb-15px">Локация офиса</p>
        <geo-input class="mb-2.5" :model-value="newVacancy.location"
          @update:model-value="$event => updateEvent($event, 'location')" />
        <p class="leading-normal text-xs text-bali font-normal">
          Укажите расположение офиса для нового сотрудника.
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
    <div class="flex gap-x-[24px] pt-3.5 mb-25px">
      <div class="max-w-[875px] flex-grow p-25px bg-white rounded-fifteen">
        <p class="leading-normal text-space text-xl font-semibold mb-[33px]">
          Контактная информация
        </p>
        <p class="text-sm font-medium text-space mb-16px">Контактное лицо</p>
        <ResponseInput 
          class="mb-6 w-full max-w-input" 
          :responses="executors" 
          :model-value="newVacancy.executor_name ? newVacancy.executor_name : ''"
          @input:modelValue="$event => updateEvent($event, 'executor_name')"
          @update:modelValue="$event => updateEvent($event, 'executor_name')" 
        />
        <div class="w-full flex justify-between gap-x-[25px]">
          <div class="w-full max-w-[400px]">
            <p class="text-sm font-medium text-space leading-normal mb-4">
              Номер телефона
            </p>
            <phone-input :model-value="newVacancy.executor_phone"
              @update:model-value="$event => updateEvent($event, 'executor_phone')" class="mb-25px" />
            <MyCheckbox :id="'show-contacts'" :label="'Отображать контакты в вакансии'" v-model="showContacts" />
          </div>
          <div class="w-full">
            <p class="text-sm font-medium text-space leading-normal mb-4">
              Email
            </p>
            <email-input :model-value="newVacancy.executor_email"
              @update:model-value="$event => updateEvent($event, 'executor_email')" />
          </div>
        </div>
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
    <UiButton @click="saveVacancy" variant="action" size="semiaction" class="font-semibold">
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
</style>

