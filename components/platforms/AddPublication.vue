<template>
  <div class="container p-0">
    <div class="flex gap-x-[24px]">
      <div class="max-w-[100%] flex-grow bg-white rounded-fifteen">
        <p class="text-space text-xl font-semibold">Новая публикация</p>
        <div class="mb-25px mt-25px border-t"></div>
        <p class="text-space text-xl font-semibold mb-8">
          Основная информация
        </p>
        <div class="w-full justify-between flex gap-25px mb-6">
          <div id="name" class="w-full anchor">
            <p 
              class="text-sm font-medium mb-4 leading-normal"
              :class="validFields.name.status === false ? 'text-red-custom' : 'text-space'"
            >
              <span class="text-red-custom">*</span>
              Название должности
            </p>
            <MyInput
                placeholder="Например, Менеджер по продажам"
                v-model="data.name"
                @update:model-value="($event) => updateValidField('name', $event.trim() !== '')"
            />
          </div>
          <div class="w-full">
            <p class="text-sm font-medium mb-4 leading-normal text-space">
              Код вакансии
            </p>
            <MyInput
                placeholder="Код вакансии"
                v-model="data.code"
            />
          </div>
        </div>
        <div class="w-full justify-between flex gap-25px mb-6">
          <div class="w-full">
            <p class="text-sm font-medium mb-4 leading-normal text-space">
              <span class="text-red-custom">*</span>
              Отрасль компании
            </p>
            <DropDownRoles 
            :options="currectRole"
            :selected="data.industry ?? ''"
            ></DropDownRoles>
          </div>
          <div id="professional_roles" class="w-full anchor">
            <p 
              class="text-sm font-medium mb-4 leading-normal"
              :class="validFields.professional_roles.status === false ? 'text-red-custom' : 'text-space'"
            >
              <span class="text-red-custom">*</span>
              Выберите специализацию
            </p>
            <DropDownRoles
            :options="data.industry?.roles || []"
            :selected="data.professional_roles[0]"
            v-model="data.professional_roles[0]"
            @update:model-value="($event) => handleIdUpdate('professional_roles', $event)"
            ></DropDownRoles>
          </div>
        </div>
        <div class="w-full justify-between flex gap-25px mb-6">
          <div class="w-full anchor">
              <p 
                class="text-sm font-medium mb-4 leading-normal"
                :class="validFields.experience.status === false ? 'text-red-custom' : 'text-space'"
              >
                <span class="text-red-custom">*</span>
                Опыт работы
              </p>
              <DropDownTypes 
              :options=experience
              :selected="findValue(experience, globCurrentVacancy?.experience)"
              v-model="data.experience"
              @update:model-value="($event) => handleIdUpdate('experience', $event)"
              ></DropDownTypes>
          </div>
          <div class="w-full"></div>
        </div>
        <div class="mb-25px mt-25px border-t"></div>
        <p class="text-space text-xl font-semibold mb-8">
          Условия работы
        </p>
        <div class="w-full justify-between flex gap-25px mb-6">
          <div id="employment_form" class="w-full anchor">
            <p 
              class="text-sm font-medium mb-4 leading-normal"
              :class="validFields.employment_form.status === false ? 'text-red-custom' : 'text-space'"
            >
              <span class="text-red-custom">*</span>
              Тип занятости
            </p>
            <DropDownTypes 
            :options=HH_EMPLOYMENT_TYPES
            :selected="findValue(HH_EMPLOYMENT_TYPES, globCurrentVacancy?.employment) || HH_EMPLOYMENT_TYPES[0]"
            v-model="data.employment_form"
            @update:model-value="($event) => handleIdUpdate('employment_form', $event)"
            ></DropDownTypes>
          </div>
          <div class="w-full">
            <template v-if="data.employment_form?.id === 'FLY_IN_FLY_OUT'">
              <p class="text-sm font-medium mb-4 leading-normal text-space">
                Количество смен
              </p>
              <MultiSelect 
              :options="experienceDaysOptions"
              :withId="true"
              v-model="data.fly_in_fly_out_duration"
              defaultValue="Выберите количество смен"
              ></MultiSelect>
            </template>
          </div>
        </div>
        <div class="w-full justify-between flex gap-25px mb-6">
           <div class="w-full">
            <p class="text-sm font-medium mb-4 leading-normal text-space">
              Формат работы
            </p>
            <MultiSelect 
              :options="workFormatOptions"
              v-model="data.work_format"
              defaultValue="Выберите формат работы"
              :withId="true"
            />
           </div>
        </div>
        <div class="mb-25px mt-25px border-t"></div>
        <p class="text-space text-xl font-semibold mb-8">
          График и часы работы
        </p>
        <div class="w-full justify-between flex gap-25px mb-6">
          <div id="work_schedule_by_days" class="w-full anchor">
            <p 
              class="text-sm font-medium mb-4 leading-normal"
              :class="validFields.work_schedule_by_days.status === false ? 'text-red-custom' : 'text-space'"
            >
              <span class="text-red-custom">*</span>
              График работы
            </p>
            <MultiSelect 
            :options="workScheduleOptions"
            v-model="data.work_schedule_by_days"
            defaultValue="Выберите график работы"
            :withId="true"
            ></MultiSelect>
          </div>
          <div id="working_hours" class="w-full anchor">
            <p 
              class="text-sm font-medium mb-4 leading-normal"
              :class="validFields.working_hours.status === false ? 'text-red-custom' : 'text-space'"
            >
              <span class="text-red-custom">*</span>
              Рабочие часы в день
            </p>
            <MultiSelect 
            :options="workingHoursOptions"
            v-model="data.working_hours"
            defaultValue="Выберите рабочие часы"
            :withId="true"
            ></MultiSelect>
          </div>
        </div>
        <div class="w-full justify-between flex gap-25px mb-6">
          <div class="w-full">
             <MyCheckbox 
                :id="'evening-night-shifts'" 
                :label="'Есть вечерние или ночные смены'" 
                v-model="data.has_evening_night_shifts" 
             />
          </div>
        </div>
        <div class="mb-25px mt-25px border-t"></div>
        <p class="text-space text-xl font-semibold mb-8">
          Город публикации и адрес работы
        </p>
        <div class="w-full justify-between flex gap-25px mb-6">
          <div id="areas" class="w-full anchor">
            <p class="text-sm font-medium mb-4 leading-normal" 
                 :class="validFields.area.status === false ? 'text-red-custom' : 'text-space'">
              <span class="text-red-custom">*</span>
              Город публикации
            </p>
            <CityAutocomplete 
              :options="citiesOptions"
              :model-value="data.area"
              @update:model-value="($event) => handleIdUpdate('area', $event)"
              placeholder="Например, Санкт-Петербург"
            />
          </div>
          <div id="address" class="w-full anchor">
            <p class="text-sm font-medium mb-4 leading-normal" 
                 :class="validFields.address.status === false ? 'text-red-custom' : 'text-space'">
              <span class="text-red-custom">*</span>
              Город размещения
            </p>
            <CityAutocomplete 
              :options="addresses"
              :isOpen="true"
              :model-value="data.address"
              @update:model-value="($event) => handleIdUpdate('address', $event)"
              placeholder="Например, Санкт-Петербург"
            />
          </div>
        </div>
        <div class="w-full justify-between flex gap-25px mb-6">
          <div class="w-full">
             <MyCheckbox 
                :id="'show_metro_only'" 
                :label="'Показывать только станцию метро в вакансии'" 
                v-model="data.address.show_metro_only" 
             />
          </div>
        </div>
        <div class="mb-25px mt-25px border-t"></div>
        <p class="text-space text-xl font-semibold mb-8">
          Оплата работы
        </p>
        <div class="w-full justify-between flex gap-25px mb-6">
           <div class="w-full">
            
           <div class="flex items-end gap-[10px] mb-6">
              <div class="w-full">
                <p class="text-sm font-medium mb-4 leading-normal text-space">
                  Заработная плата / мес
                </p>
                <div class="w-full flex gap-x-2.5">
                  <MyInput
                   placeholder="От"
                   type="Number"
                   v-model="data.salary_range.from"
                   @update:model-value="($event) => handleSalaryRangeUpdate('from', $event)"
                   />
                   <MyInput
                   placeholder="До"
                   type="Number"
                   v-model="data.salary_range.to"
                   @update:model-value="($event) => handleSalaryRangeUpdate('to', $event)"
                   /> 
                </div>
              </div>
              <div class="w-full">
                <p class="text-sm font-medium text-space mb-3.5">Валюта</p>
                <MyDropdown 
                  :options="ArrayCurrency" 
                  :model-value="ArrayCurrency.find(c => c.id === data.salary_range.currency)?.value"
                  @update:model-value="($event) => handleSalaryRangeUpdate('currency', ArrayCurrency.find(c => c.value === $event))"
                />
              </div>
              <div class="w-full">
                <DropDownTypes 
                  :options=HH_SALARY_TYPE
                  :selected="HH_SALARY_TYPE[0]"
                  v-model="data.salary_range.mode"
                  @update:model-value="($event) => handleSalaryRangeUpdate('mode', $event)"
                >
                </DropDownTypes>
                </div>
            </div>
            <div class="w-full  items-end justify-between flex mb-6 gap-25px">
              <RadioGroup 
                default-value="full-cash" 
                class="w-full flex gap-[18px]" 
                :model-value="data.salary_range?.gross === true ? 'full-cash' : 'past-cash'"
                @update:model-value="(value) => data.salary_range.gross = value === 'full-cash'"
              >
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
            <div class="w-full  items-end justify-between flex gap-25px">
              <div class="w-full">
                <p class="text-sm font-medium text-space mb-3.5">
                  Частота выплаты
                </p>
                <DropDownTypes 
                  :options=HH_SALARY_FREQUENCY
                  :selected="HH_SALARY_FREQUENCY[3]"
                  v-model="data.salary_range.frequency"
                  @update:model-value="($event) => handleSalaryRangeUpdate('frequency', $event)"
                >
                </DropDownTypes>
              </div>
              <div class="w-full"></div>
            </div>
          </div> 
        </div>
        <div class="mb-25px mt-25px border-t"></div>
        <p class="text-space text-xl font-semibold mb-8">
          Описание вакансии
        </p>
        <div id="description" class="w-full anchor">
          <p 
            class="text-sm font-medium mb-3.5"
            :class="validFields.description.status === false ? 'text-red-custom' : 'text-space'"
          >
            <span class="text-red-custom">*</span>
            Текст вакансии
          </p>
          <GenerateButton></GenerateButton>
          <div class="mt-15px mb-25px">
          <TiptapEditor 
            v-model="data.description" 
            class="mb-15px" 
          />
          <p class="text-xs text-bali font-normal">
            Максимум 700 символов. Использовано 0 символов.
          </p>
        </div>
        <div class="flex gap-25px">
          <div class="w-full">
            <p class="text-sm font-medium text-space mb-13px">
              Навыки
            </p>
            <TagSelect 
              :options="[]" :model-value="data.key_skills ? data.key_skills : []"
              :is-new="true"
              :placeholder="'Например, Активный'"
              @enter="$event => updateSkills($event)" 
              @delete="$event => updateSkills($event)" 
            />
          </div>
          <div class="w-full">
            <p class="text-sm font-medium text-space mb-13px">
               Водительские права
            </p>
            <MultiSelect 
            :options="driverLicenseOptions"
            v-model="data.driver_license_types"
            defaultValue="Сделайте выбор"
             :withId="true"
            ></MultiSelect>
          </div>
        </div>
        <div class="mb-25px mt-25px border-t"></div>
        <p class="text-space text-xl font-semibold mb-8">
          Настройка откликов и управление вакансией
        </p>
        <div class="w-full mb-6">
          <p class="text-sm font-medium mb-4 leading-normal text-space">
            Кто и как может откликаться
          </p>
          <MultiSelect  
          :options="additionalConditionsOptions"
          defaultValue="Сделайте выбор"
          :withId="true"
          v-model="data.additional_conditions"
          ></MultiSelect >
        </div>
        <div class="w-full flex justify-between gap-25px mb-6">
          <div class="w-full">
            <p class="text-sm font-medium mb-4 leading-normal text-space">
              Нужно ли приложить к отклику сопроводительное письмо?
            </p>
            <DropDownRoles 
              :options="[
                {id: '1', name: 'Да'}, 
                {id: '0', name: 'Нет'}
              ]"
              :selected="data.response_letter_required === true ? {id: '1', name: 'Да'} : data.response_letter_required === false ? {id: '0', name: 'Нет'} : null"
              @update:model-value="($event) => data.response_letter_required = $event?.id === '1'"
            ></DropDownRoles>
          </div>
          <div class="w-full"></div>
        </div>
        <div class="w-full justify-between flex gap-25px mb-25px">
          <div class="w-full">
            <p class="text-sm font-medium mb-4 leading-normal text-space">
              Контактное лицо
            </p>
            <MyInput
                placeholder="Ответственный"
                type="String"
            />
          </div>
          <div class="w-full"></div>
        </div>
        <div class="w-full flex justify-between gap-25px mb-10">
          <div class="w-full">
            <p class="text-sm font-medium mb-4 leading-normal text-space">
              Номер телефона
            </p>
            <PhoneInput 
              :model-value="null"
            />
          </div>
          <div class="w-full">
            <p class="text-sm font-medium text-space leading-normal mb-4">
              Email
            </p>
            <email-input :model-value="data.executor_email"
              @update:model-value="$event => console.log('update:model-value', $event)" />
          </div>
        </div>

        <div class="w-full justify-between flex gap-25px mb-6">
          <div class="w-full">
             <MyCheckbox 
               id="show-contacts" 
               label="Сохранить в черновике" 
               v-model="isDraft" 
               @update:model-value="$event => (isDraft = $event)"
             />
          </div>
        </div>
        <div class="w-full justify-start flex gap-25px mb-6">
            <DropDownTypes 
            :options=HH_BILLING_TYPES
            :selected="data.billing_types"
            v-model="data.billing_types"
            ></DropDownTypes>
            <UiButton @click="savePublication" variant="action" size="semiaction" class="font-semibold">
              Опубликовать
            </UiButton>
            <div class="status" v-if="status">
              {{ status }}
            </div>
            <UiButton variant="semiaction" size="semiaction" class="text-space">
              Отмена
            </UiButton>
        </div>
        <div v-if="statusValidate === false" class="w-full text-red-custom mb-6">
          <p class="text-sm font-medium mb-4 leading-normal text-space">
            Не заполнены обязательные поля:
          </p>
          <div class="grid grid-cols-2 gap-5px">
            <template v-for="(field, key) in validFields" :key="key">
              <a 
                :href="`#${key}`" 
                v-if="field.status === false"
                @click.prevent="scrollToElement(key)"
                class="text-red-custom hover:text-red-custom-hover underline cursor-pointer"
              >
                {{ field.name }}
              </a>
            </template>
          </div>
        </div>
      </div>   
      </div>
    </div>
  </div>
</template>
<script setup>
import DropDownTypes from './DropDownTypes.vue';
import DropDownRoles from './DropDownRoles.vue';
import MyDropdown from '~/components/custom/MyDropdown.vue';
import MyInput from '~/components/custom/MyInput.vue';
import MyCheckbox from '~/components/custom/MyCheckbox.vue';
import EmailInput from '~/components/custom/EmailInput.vue';
import TiptapEditor from '~/components/TiptapEditor.vue';
import GenerateButton from '../custom/GenerateButton.vue';
import TagSelect from '~/components/custom/TagSelect.vue'
import MultiSelect from '~/components/custom/MultiSelect.vue'
import CityAutocomplete from '~/components/custom/CityAutocomplete.vue'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { getPhrases } from '@/utils/getVacancies'
import PhoneInput from '~/components/custom/PhoneInput.vue';
import currency from '~/src/data/currency.json'
import { 
  PLATFORM_PROPERTIES, 
  HH_EMPLOYMENT_TYPES, 
  HH_WORKING_HOURS, 
  HH_WORK_SCHEDULE_BY_DAYS,
  HH_EDUCATION_LAVEL,
  HH_WORK_FORMAT,
  HH_EXPERIENCE_DAYS,
  HH_SALARY_TYPE,
  HH_SALARY_FREQUENCY,
  HH_DRIVER_LICENSE_TYPES,
  HH_ADDITIONAL_CONDITIONS,
  HH_BILLING_TYPES,
} from '@/src/constants'
import experience from '~/src/data/experience.json'
import { inject, watch, computed, defineProps } from 'vue'

const props = defineProps({
  selectedPlatform: {
    type: String,
    default: null
  }
})
import { 
  getProfile as profileHh, 
  getAvailableTypes as typesHh, 
  addDraft as addDraftHh,
  publishVacancy as publishVacancyToHh,
  getRoles as getRolesHh,
  getAreas as getAreasHh,
  getAddresses as getAddressesHh
} from '@/utils/hhAccount'
import { addDraft as addDraftAvito, getProfile as profileAvito } from '@/utils/avitoAccount'
import { getProfile as profileRabota } from '@/utils/rabotaAccount'
import { getVacancy } from '@/utils/getVacancies';
import { useRoute } from 'vue-router'

// Функция для плавного скролла к элементу
const scrollToElement = (elementId) => {
  const element = document.getElementById(elementId)
  if (element) {
    element.scrollIntoView({ 
      behavior: 'smooth', 
      block: 'start' 
    })
  }
}

const isDraft = ref(true)
const platforms = ref(inject('platformsGlobal'))
const isPlatforms = ref(inject('isPlatforms'))
const vacancyData = inject('vacancyCurrect')
const currectRole = ref(null)
const roleData = ref(null)
const status = ref(null)
const statusValidate = ref(true)
const route = useRoute();
const phrases = ref(null)
const data = ref({})
const addresses = ref([])
const validFields = ref({
  name: {
    status: true,
    name: 'Название вакансии',
  },
  description: {
    status: true,
    name: 'Описание вакансии',
  },
  professional_roles: {
    status: true,
    name: 'Профессиональные роли',
  },
  experience: {
    status: true,
    name: 'Опыт работы',
  },
  employment_form: {
   status: true,
   name: 'Форма найма',
  },
  work_schedule_by_days: {
    status: true,
    name: 'График работы',
  },
  area: {
    status: true,
    name: 'Город публикации',
  },
  address: {
    status: true,
    name: 'Город размещения',
  },
  working_hours: {
    status: true,
    name: 'Рабочие часы в день',
  },
});

const mappingFieldsHH = {
  'experience': {'field': 'experience', 'values': experience},
  'employment_form': {'field': 'employment', 'values': HH_EMPLOYMENT_TYPES},
  'education_level': 'education',
  'salary_type': 'salary_type',
  'salary_frequency': 'salary_frequency',
  'key_skills': 'phrases',
  'additional_conditions': 'additional_conditions',
  'response_letter_required': 'response_letter_required',
  'billing_types': 'billing_types',
}

const globCurrentVacancy = ref(inject('vacancyCurrect'))

const findValue = (array, value) => {
  return array.find((item) => item.name == value) || null
}

const handleIdUpdate = (property, value) => {
  if (property === 'address' || property === 'area') {
    if (value) {
      data.value[property].id = value
    } else {
      delete data.value[property].id
    }
  } else {
    data.value[property] = value ? { id: value.id } : null
  }
  console.log('property - ', property, 'value - ', value);
}

const handleSalaryRangeUpdate = (property, value) => {
  if (property === 'from' || property === 'to') {
    data.value.salary_range[property] = value ? Number(value) : null
  } else if (property === 'currency') {
    data.value.salary_range[property] = value ? value.id : null
  } else {
    data.value.salary_range[property] = value ? { id: value.id } : null
  }
}

data.value.salary_range = {
  from: null,
  to: null,
}
console.log('globCurrentVacancy.value', globCurrentVacancy.value);
data.value.professional_roles = [null]
data.value.work_format = []
data.value.fly_in_fly_out_duration = []
data.value.work_schedule_by_days = []
data.value.schedule = []
data.value.education_level = null
data.value.driver_license_types = []
data.value.has_evening_night_shifts = false
data.value.area = {}
data.value.address = {show_metro_only: false}
data.value.salary_range = {
  currency: 'RUR',
  frequency: {
    id: HH_SALARY_FREQUENCY[3].id,
  },
  from: null,
  to: null,
  gross: true,
  mode: {
    id: HH_SALARY_TYPE[0].id,
  }
}
data.value.salary_type = HH_SALARY_TYPE[0]
data.value.key_skills = []
data.value.additional_conditions = []
data.value.response_letter_required = false
data.value.billing_types = HH_BILLING_TYPES[0]
data.value.contacts = null
data.value.executor_email = null


// Список городов из API hh.ru
const cities = ref([])
const citiesOptions = computed(() => {
  return cities.value.map(city => ({
    id: city.id,
    name: city.name,
    value: city.id
  }))
})

const { roles, errorRoles } = await getRolesHh()
if (!errorRoles) {
  currectRole.value = roles.categories
}

// Загрузка списка городов из API hh.ru
const { data: areasData, error: areasError } = await getAreasHh()
if (!areasError && areasData) {
  cities.value = areasData
}

const { data: addressesData, error: addressesError } = await getAddressesHh()
if (!addressesError && addressesData) {
  addresses.value = addressesData.items
}

const vacancyId = route.query.id
if (vacancyId) {
  if (!globCurrentVacancy.value || vacancyId !== globCurrentVacancy.value.id.toString()) {
    
    const  vacancy = await getVacancy(vacancyId)
    if (vacancy) {
      
      globCurrentVacancy.value = vacancy
    }
  }
}

const getPhrasesVacancy = async function() {
  const { data, error } = await getPhrases()
  return data
}

phrases.value = await getPhrasesVacancy()

const vacancyIdFields = [
  'experience',
  'employment_form', 
]

vacancyIdFields.forEach((field) => {
  if (findValue(
    mappingFieldsHH[field].values, 
    globCurrentVacancy.value[mappingFieldsHH[field]?.field]
  ) == null) {
    handleIdUpdate(field, mappingFieldsHH[field].values[0]);
  }else {
    handleIdUpdate(
      field, 
      findValue(mappingFieldsHH[field].values, globCurrentVacancy.value[mappingFieldsHH[field]?.field])
    );
  }
})

if (globCurrentVacancy.value) {
  for (const key in PLATFORM_PROPERTIES[data.value.platform]) {
    data.value[key] = globCurrentVacancy.value[key]
  }

  if (globCurrentVacancy.value['salary_from']) {
    console.log('salary_from - ', globCurrentVacancy.value.salary_from);
      data.value.salary_range.from = globCurrentVacancy.value.salary_from
  }
  if (globCurrentVacancy.value.salary_to) {
      data.value.salary_range.to = globCurrentVacancy.value.salary_to
  }
  if (globCurrentVacancy.value.education) {
    data.value.education_level = HH_EDUCATION_LAVEL.find((item) => item.name == globCurrentVacancy.value.education)
  }
  if (globCurrentVacancy.value.phrases) {
    data.value.phrases = globCurrentVacancy.value.phrases
  }
  if (globCurrentVacancy.value.drivers) {
    data.value.driver_license_types = globCurrentVacancy.value.drivers
  }
}

if (vacancyData.value) {
  data.value.name = vacancyData.value.name
  data.value.code = vacancyData.value.code
  data.value.description = vacancyData.value.description
  data.value.industry = currectRole.value.filter(function (n, index) {
    n.key = index
    return n.name == vacancyData.value.industry
  })[0]
  if (data.value.industry !== undefined && data.value.industry.length == 0) {
    data.value.professional_roles[0] = data.value.industry.roles.filter(function (n) {
      return n.name == vacancyData.value.specializations
    })
  }
  
  if (data.value.professional_roles.length == 0) {
    roleData.value = data.value.industry.roles[0]
    data.value.professional_roles[0] = data.value.industry.roles[0]
  }
}
// data.value.employment_form = HH_EMPLOYMENT_TYPES.filter( (item, i) => {
//       return item.siteName == globCurrentVacancy.value?.employment
// })[0] || HH_EMPLOYMENT_TYPES[0];

if (!inject('isPlatforms')) {
    const { data, error } = await profileHh()
    if (!error) {
      platforms.value[0].isAuthenticated = true
      platforms.value[0].data = {email: data.data.email }
    }
    const { types, errorTypes } = await typesHh(data.data.employer.id, data.data.manager.id)
      if (!error && !errorTypes) {
        platforms.value[0].types = types
      }
}

// Определяем платформу из props или из inject
const getPlatformName = (platformName) => {
  // Преобразуем формат 'hh.ru' в 'hh', 'avito.ru' в 'avito', 'rabota.ru' в 'rabota'
  if (platformName === 'hh.ru') return 'hh'
  if (platformName === 'avito.ru') return 'avito'
  if (platformName === 'rabota.ru') return 'rabota'
  return platformName
}

for (let key of platforms.value) {
    if (!isPlatforms.value) {
        // Если передан selectedPlatform через props, используем его
        if (props.selectedPlatform) {
          const targetPlatform = getPlatformName(props.selectedPlatform)
          if (key.platform === targetPlatform) {
            if (key.platform == 'hh') {
              const profile = await profileHh()  
              if (!profile.error) {
                key.isAuthenticated = true
                key.data = profile.data.data
                isPlatforms.value = true
                console.log('types - ', key['types'])
              }
            } else if (key.platform == 'avito') {
              const profile = await profileAvito()  
              if (!profile.error) {
                key.isAuthenticated = true
                key.data = profile.data.data
                isPlatforms.value = true
                console.log('Avito profile - ', profile.data)
              }
            } else if (key.platform == 'rabota') {
              const profile = await profileRabota()  
              if (!profile.error && profile.data) {
                key.isAuthenticated = true
                key.data = profile.data.data
                isPlatforms.value = true
                console.log('Rabota profile - ', profile.data)
              }
            }
            data.value.platform = key
            break // Используем найденную платформу
          }
        } else {
          // Старая логика, если платформа не передана
          if (key.platform == 'hh') {
            const profile = await profileHh()  
            if (!profile.error) {
              key.isAuthenticated = true
              key.data = profile.data.data
              isPlatforms.value = true
              // data.value.billing_types = key.types ? key.types[6] : null
              console.log('types - ', key['types'])
            }
          } else if (key.platform == 'avito') {
            const profile = await profileAvito()  
            if (!profile.error) {
              key.isAuthenticated = true
              key.data = profile.data.data
              isPlatforms.value = true
              console.log('Avito profile - ', profile.data)
            }
          } else if (key.platform == 'rabota') {
            const profile = await profileRabota()  
            if (!profile.error && profile.data) {
              key.isAuthenticated = true
              key.data = profile.data.data
              isPlatforms.value = true
              console.log('Rabota profile - ', profile.data)
            }
          }
          data.value.platform = key
        }
    }
}

const ArrayCurrency = ref(currency)

// Преобразование HH_EXPERIENCE_DAYS для MultiSelect (id -> value)
const experienceDaysOptions = HH_EXPERIENCE_DAYS.map(day => ({
    ...day,
    value: day.id
}))

// Преобразование HH_WORK_FORMAT для MultiSelect (id -> value)
const workFormatOptions = HH_WORK_FORMAT.map(format => ({
    ...format,
    value: format.id
}))

// Преобразование HH_WORK_SCHEDULE_BY_DAYS для MultiSelect (id -> value)
const workScheduleOptions = HH_WORK_SCHEDULE_BY_DAYS.map(schedule => ({
    ...schedule,
    value: schedule.id
}))

// Преобразование HH_WORKING_HOURS для MultiSelect (id -> value)
const workingHoursOptions = HH_WORKING_HOURS.map(hours => ({
    ...hours,
    value: hours.id
}))

// Преобразование HH_ADDITIONAL_CONDITIONS для MultiSelect (id -> value)
const additionalConditionsOptions = HH_ADDITIONAL_CONDITIONS.map(condition => ({
    ...condition,
    value: condition.id
}))

// Преобразование HH_DRIVER_LICENSE_TYPES для MultiSelect (id -> value)
const driverLicenseOptions = HH_DRIVER_LICENSE_TYPES.map(license => ({
  ...license,
  value: license.id
}))

const validateFields = () => { 
  let isValid = true;
  for (const key in validFields.value) {
    if (data.value[key] == null 
         || data.value[key] == undefined 
         || data.value[key] == '' 
         || data.value[key] == [] 
         || data.value[key] == {}
        ) {
      isValid = false
      validFields.value[key].status = false
    } else {
      if (key == 'address' || key == 'area') {
        if (data.value[key].id == undefined || data.value[key].id == null) {
          validFields.value[key].status = false
        } else {
          validFields.value[key].status = true
        }
      } else {
        validFields.value[key].status = true
      }
    }
  }

  return isValid
}

const updateValidField = (field, value) => {
  if (value && !validFields.value[field].status) {
    if (field == 'professional_roles') {
      if (data.value[field].id !== undefined && data.value[field].id !== null) {
        validFields.value[field].status = true
      }
    } else {
      validFields.value[field].status = true
    }
  }
}

const savePublication = async () => {
  if (!validateFields()) {
    statusValidate.value = false
    return
  }
  statusValidate.value = true
  
  // Определяем текущую платформу
  const currentPlatform = data.value.platform?.platform || 'hh'
  
  // Обработка дополнительных условий (актуально для hh.ru)
  if (data.value.additional_conditions && data.value.additional_conditions.length > 0) {
    const boolConditions = [
        'accept_handicapped', 
        'accept_incomplete_resumes', 
        'accept_temporary'
      ];
    data.value.additional_conditions.forEach(item => { 
      if (boolConditions.includes(item.id)) {
        data.value[item.id] = true
      }
      if (item.id == 'age_restriction_14') {
        data.value.age_restriction = {
          id: 'AGE_14_PLUS'
        }
      }
      if (item.id == 'age_restriction_16') {
        data.value.age_restriction = {
          id: 'AGE_16_PLUS'
        }
      }
      if (item.id == 'auto_response') {
        data.value.auto_response = {
          'accept_auto_response': true
        }
      }
    });
  }
  
  let response;
  if (currentPlatform !== 'avito' && currentPlatform !== 'hh' && currentPlatform !== 'rabota') {
   status.value = `Платформа ${currentPlatform} пока не поддерживается`
   return
  }
  // Выбираем функцию в зависимости от платформы и флага isDraft
  if (currentPlatform === 'avito') {
    // Для avito.ru пока только создание черновика
    response = await addDraftAvito(data.value)
  } 
  if (currentPlatform === 'hh') {
    if (isDraft.value || isDraft.value === 'true'
    ) {
      response = await addDraftHh(data.value)
    } else {
      response = await publishVacancyToHh(data.value)
    }
  }
  if (currentPlatform === 'rabota') {
    if (isDraft.value) {
      response = await addDraftRabota(data.value)
    } else {
      response = await publishVacancyToRabota(data.value)
    }
  }
  
  // Обработка результата
  if (response?.error || response?.errorDraft) {
    status.value = response.error || response.errorDraft || 'Ошибка при сохранении вакансии'
  } else {
    if (isDraft.value) {
      status.value = 'Вакансия успешно сохранена в черновике'
    } else {
      status.value = 'Вакансия успешно опубликована'
    }
  }
}

const updateSkills = (el) => {
  if (el.length > 0) {
    const phrases = []
    el.forEach((item, key) => {
      phrases.push({name: item.name})
    })
    data.value.key_skills = phrases

  } else {
    if (data.value.key_skills)
        delete data.value.key_skills
    }
}

// Сброс experience_days при изменении типа занятости
watch(() => data.value.employment_form, (newValue) => {
  if (newValue?.id !== 'FLY_IN_FLY_OUT') {
    data.value.experience_days = []
  }
})

onBeforeMount(async () => {
})

</script>

<style scoped>
  .anchor {
    scroll-margin-top: 80px;
  }
</style>