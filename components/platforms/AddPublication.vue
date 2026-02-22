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
            @update:model-value="handleIndustryChange"
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
            :options="professionsOptions"
            :selected="data.professional_roles[0]"
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
              :options=experienceOptions
              :selected="findValue(experienceOptions, globCurrentVacancy?.experience)"
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
            :options=employmentTypesOptions
            :selected="findValue(employmentTypesOptions, globCurrentVacancy?.employment) || employmentTypesOptions[0]"
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
              :model-value="data.area?.id || null"
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
            @update:model-value="($event) => updateDescriptionValidation($event)"
          />
          <p 
            class="text-xs font-normal"
            :class="descriptionLength < 200 ? 'text-red-custom' : 'text-bali'"
          >
            Минимум 200 символов. Максимум 700 символов. Использовано {{ descriptionLength }} символов.
            <span v-if="descriptionLength < 200" class="text-red-custom font-medium">
              (Требуется еще {{ 200 - descriptionLength }} символов)
            </span>
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
           <template v-if="currentPlatform === 'hh' && tariffsOptions.length > 0">
              <DropDownTypes 
                :options="tariffsOptions"
                :selected="tariffsOptions[0]"
                placeholder="Выберите тариф"
                @update:model-value="($event) => handleTariffUpdate($event)"
              ></DropDownTypes>
            </template>
            <template v-else-if="currentPlatform === 'hh'">
              <DropDownTypes 
                :options="HH_BILLING_TYPES"
                :selected="data.billing_types"
                placeholder="Выберите тариф"
                v-model="data.billing_types"
              ></DropDownTypes>
            </template>
            <!-- <template v-if="data.platform?.platform === 'hh' && tariffsOptions.length > 0">
              <DropDownTypes 
                :options="tariffsOptions"
                :selected="selectedTariff"
                @update:model-value="($event) => handleTariffUpdate($event)"
              ></DropDownTypes>
            </template>
            <template v-else>
              <DropDownTypes 
                :options=HH_BILLING_TYPES
                :selected="data.billing_types"
                v-model="data.billing_types"
              ></DropDownTypes>
            </template> -->
            <UiButton @click="savePublication" variant="action" size="semiaction" class="font-semibold">
              {{ isEditingMode ? 'Обновить' : 'Опубликовать' }}
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
              <div v-if="field.status === false" class="flex flex-col">
                <a 
                  :href="`#${key}`" 
                  @click.prevent="scrollToElement(key)"
                  class="text-red-custom hover:text-red-custom-hover underline cursor-pointer"
                >
                  {{ field.name }}
                </a>
                <span v-if="field.error" class="text-xs text-red-custom mt-1">
                  {{ field.error }}
                </span>
              </div>
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
import { inject, watch, computed, defineProps, nextTick } from 'vue'

const props = defineProps({
  selectedPlatform: {
    type: String,
    default: null
  },
  editingVacancy: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['saved', 'cancel'])

const isEditingMode = computed(() => props.editingVacancy != null)

import { 
  getProfile as profileHh, 
  getAvailableTypes as typesHh, 
  addDraft as addDraftHh,
  publishVacancy as publishVacancyToHh,
  getRoles as getRolesHh,
  getAreas as getAreasHh,
  getAddresses as getAddressesHh,
  getAvailablePublications as getAvailablePublicationsHh
} from '@/utils/hhAccount'
import { addDraft as addDraftAvito, getProfile as profileAvito, publishVacancy as publishVacancyToAvito, getProfessions as getProfessionsAvito, getSpecializations as getSpecializationsAvito } from '@/utils/avitoAccount'
import { 
  getProfile as profileRabota, 
  addDraft as addDraftRabota, 
  publishVacancy as publishVacancyToRabota,
  getProfessions as getProfessionsRabota,
  getRegions as getRegionsRabota,
  getEmploymentTypes as getEmploymentTypesRabota,
  getWorkSchedules as getWorkSchedulesRabota,
  getExperienceLevels as getExperienceLevelsRabota,
  getEducationLevels as getEducationLevelsRabota
} from '@/utils/rabotaAccount'
import { getVacancy as getVacancyById } from '@/utils/getVacancies';
import { useRoute } from 'vue-router'
import { fetchVacancyUpdate } from '@/utils/applicationUpdate'
import { mapVacancyToUpdateFormat } from '@/utils/mapVacancyToUpdateFormat'

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
const tariffsHh = ref([])

// Справочники для rabota.ru
const rabotaProfessions = ref([])
const rabotaRegions = ref([])
const rabotaEmploymentTypes = ref([])
const rabotaWorkSchedules = ref([])
const rabotaExperienceLevels = ref([])
const rabotaEducationLevels = ref([])

// Справочники для avito.ru
const avitoProfessions = ref([])
const avitoSpecializations = ref([])

const validFields = ref({
  name: {
    status: true,
    name: 'Название вакансии',
  },
  description: {
    status: true,
    name: 'Описание вакансии',
    error: null,
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

/** Поиск в справочнике по name или siteName (для маппинга полей вакансии в форму) */
const findValueByNameOrSiteName = (array, value) => {
  if (!array || value == null || value === '') return null
  return array.find((item) => item.name == value || item.siteName == value) || null
}

/** Поиск по id или name (API может вернуть id или строку названия) */
const findValueByIdOrName = (array, value) => {
  if (!array || value == null || value === '') return null
  const v = value && typeof value === 'object' ? value?.id ?? value?.name : value
  return array.find((item) => String(item.id) === String(v) || item.name == v) || array.find((item) => item.name == v) || null
}

const handleIdUpdate = (property, value) => {
  if (property === 'address' || property === 'area') {
    if (value) {
      data.value[property] = data.value[property] || (property === 'address' ? { show_metro_only: false } : {});
      data.value[property].id = value;
      if (property === 'area') {
        isCitySetFromVacancy.value = false
        console.log('Город изменен пользователем, сброшен флаг isCitySetFromVacancy')
      }
    } else {
      if (property === 'address') {
        data.value.address = { show_metro_only: data.value.address?.show_metro_only ?? false };
      } else {
        data.value.area = {};
      }
      if (property === 'area') {
        isCitySetFromVacancy.value = false
      }
    }
  } else if (property === 'professional_roles') {
    // Для professional_roles сохраняем полный объект
    // Важно: используем объект из текущего списка options, чтобы сохранить правильную ссылку
    if (value) {
      // Ищем объект в professionsOptions по id или name, чтобы сохранить правильную ссылку
      const options = professionsOptions.value
      if (options && options.length > 0) {
        const foundRole = options.find(role => {
          if (value.id && role.id) {
            return String(role.id) === String(value.id)
          }
          if (value.name && role.name) {
            return role.name === value.name
          }
          return false
        })
        // Используем найденный объект из списка (правильная ссылка) или переданный объект
        data.value.professional_roles = foundRole ? [foundRole] : [value]
      } else {
        // Если список пуст, сохраняем переданный объект
        data.value.professional_roles = [value]
      }
    } else {
      data.value.professional_roles = [null]
    }
  } else {
    data.value[property] = value ? { id: value.id } : null
  }
}

// Обработчик изменения отрасли
const handleIndustryChange = async (industry) => {
  if (!industry) {
    data.value.industry = null
    data.value.professional_roles = [null]
    avitoSpecializations.value = []
    return
  }

  // Для Avito загружаем специализации при выборе профессии
  if (currentPlatform.value === 'avito' && industry.id) {
    try {
      const specializationsResult = await getSpecializationsAvito(industry.id)
      if (specializationsResult?.data && !specializationsResult.error) {
        avitoSpecializations.value = Array.isArray(specializationsResult.data) 
          ? specializationsResult.data 
          : (specializationsResult.data.items || [])
        
        // Обновляем industry с загруженными специализациями
        data.value.industry = {
          ...industry,
          roles: avitoSpecializations.value.map(spec => ({
            id: spec.id,
            name: spec.name || spec.title
          }))
        }
        
        // Выбираем первую специализацию, если есть
        if (avitoSpecializations.value.length > 0) {
          const firstSpec = avitoSpecializations.value[0]
          data.value.professional_roles = [{
            id: firstSpec.id,
            name: firstSpec.name || firstSpec.title
          }]
        } else {
          data.value.professional_roles = [null]
        }
        return
      }
    } catch (error) {
      console.error('Ошибка при загрузке специализаций Avito:', error)
    }
  }

  // Для других платформ используем существующую логику
  // Находим полный объект отрасли в исходных данных, чтобы получить roles
  let fullIndustry = null
  if (currectRole.value && Array.isArray(currectRole.value)) {
    // Ищем отрасль по id или name
    fullIndustry = currectRole.value.find(
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
  
  // Обновляем industry - создаем новый объект для реактивности Vue
  data.value.industry = selectedIndustry ? { ...selectedIndustry } : null
  
  // Сбрасываем специализацию при изменении отрасли и всегда выбираем первую
  if (selectedIndustry && selectedIndustry.roles && Array.isArray(selectedIndustry.roles) && selectedIndustry.roles.length > 0) {
    // Всегда выбираем первую специализацию из списка при изменении отрасли
    data.value.professional_roles = [selectedIndustry.roles[0]]
  } else {
    data.value.professional_roles = [null]
  }
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

const handleTariffUpdate = (tariff) => {
  if (tariff) {
    data.value.vacancy_properties = {property_type: tariff.property_type}
  } else {
    data.value.vacancy_properties = null
  }
}

data.value.salary_range = {
  from: null,
  to: null,
}
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
data.value.vacancy_properties = null


// Список городов из API hh.ru
const cities = ref([])
const citiesOptions = computed(() => {
  return cities.value.map(city => ({
    id: city.id,
    name: city.name,
    value: city.id
  }))
})

// Computed свойства для выбора справочников в зависимости от платформы
const currentPlatform = computed(() => {
  return data.value.platform?.platform || 'hh'
})

const professionsOptions = computed(() => {
  if (currentPlatform.value === 'rabota' && rabotaProfessions.value.length > 0) {
    return rabotaProfessions.value.map(prof => ({
      id: prof.id || prof.profession_id,
      name: prof.name || prof.title,
      roles: prof.roles || []
    }))
  }
  if (currentPlatform.value === 'avito') {
    // Для Avito используем загруженные специализации
    return data.value.industry?.roles || avitoSpecializations.value.map(spec => ({
      id: spec.id,
      name: spec.name || spec.title
    })) || []
  }
  // Для hh.ru используем существующую логику
  return data.value.industry?.roles || []
})

// Ref переменные для хранения вычисленных значений
const computedIndustry = ref(null)
const computedProfessionalRole = ref(null)
const computedCity = ref(null)

// Функция для обновления ref переменных
const updateComputedValues = () => {
  const vacancy = globCurrentVacancy.value || vacancyData.value;
  if (!vacancy) {
    computedIndustry.value = null;
    computedProfessionalRole.value = null;
    computedCity.value = null;
    return;
  }
  
  // Обновляем отрасль
  if (vacancy.industry && currectRole.value && Array.isArray(currectRole.value)) {
    computedIndustry.value = currectRole.value.find(cat => {
      if (typeof vacancy.industry === 'string') {
        return cat.name === vacancy.industry;
      }
      if (typeof vacancy.industry === 'object') {
        if (vacancy.industry.name && cat.name) {
          return cat.name === vacancy.industry.name;
        }
        if (vacancy.industry.id && cat.id) {
          return String(cat.id) === String(vacancy.industry.id);
        }
      }
      return false;
    }) || null;
  } else {
    computedIndustry.value = null;
  }
  
  // Обновляем специализацию
  if (computedIndustry.value && vacancy.specializations && computedIndustry.value.roles && Array.isArray(computedIndustry.value.roles)) {
    computedProfessionalRole.value = computedIndustry.value.roles.find(r => {
      if (typeof vacancy.specializations === 'string') {
        return r.name === vacancy.specializations;
      }
      if (typeof vacancy.specializations === 'object') {
        if (vacancy.specializations.name && r.name) {
          return r.name === vacancy.specializations.name;
        }
        if (vacancy.specializations.id && r.id) {
          return String(r.id) === String(vacancy.specializations.id);
        }
      }
      return false;
    }) || null;
  } else {
    computedProfessionalRole.value = null;
  }
  
  // Обновляем город
  if (vacancy.location && cities.value && Array.isArray(cities.value) && cities.value.length > 0) {
    const cityName = vacancy.location.split(',')[0].trim();
    computedCity.value = cities.value.find(city => {
      if (!city || !city.name) return false;
      
      if (city.name.toLowerCase() === cityName.toLowerCase()) {
        return true;
      }
      if (cityName.toLowerCase().includes(city.name.toLowerCase())) {
        return true;
      }
      if (city.name.toLowerCase().includes(cityName.toLowerCase())) {
        return true;
      }
      return false;
    }) || null;
  } else {
    computedCity.value = null;
  }
}

// Флаг для отслеживания, был ли город установлен из вакансии
const isCitySetFromVacancy = ref(false)

// Функция для применения вычисленных значений к форме
const applyComputedValues = async () => {
  // Обработка отрасли и специализации
  const industry = computedIndustry.value;
  if (industry && industry.roles && Array.isArray(industry.roles)) {
    const hasIndustry = data.value.industry && typeof data.value.industry === 'object' && data.value.industry.roles;
    if (!hasIndustry) {
      console.log('=== AddPublication: установка отрасли из ref ===');
      console.log('computedIndustry:', industry);
      handleIndustryChange(industry);
      
      // Устанавливаем специализацию
      const role = computedProfessionalRole.value || (industry.roles.length > 0 ? industry.roles[0] : null);
      if (role) {
        data.value.professional_roles = [role];
        console.log('Установлена специализация:', data.value.professional_roles);
      }
    }
  }
  
  // Обработка города публикации из location
  // Устанавливаем город только если:
  // 1. Город найден в списке hh.ru
  // 2. Город еще не был установлен из вакансии (чтобы не блокировать работу выпадающего списка)
  // 3. data.value.area пуст или не имеет id
  const city = computedCity.value;
  if (city && !isCitySetFromVacancy.value) {
    const hasCity = data.value.area && data.value.area.id;
    if (!hasCity) {
      console.log('=== AddPublication: установка города из вакансии ===');
      console.log('Город из вакансии (location):', globCurrentVacancy.value?.location || vacancyData.value?.location);
      console.log('Найденный город в списке hh.ru:', city);
      console.log('Текущий data.value.area:', data.value.area);
      
      // Устанавливаем город публикации и город размещения (из location вакансии — один и тот же город)
      data.value.area = {
        id: city.id,
        name: city.name
      };
      data.value.address = {
        id: city.id,
        name: city.name,
        show_metro_only: data.value.address?.show_metro_only ?? false
      };
      
      // Устанавливаем флаг, что город был установлен из вакансии
      isCitySetFromVacancy.value = true;
      
      console.log('✅ Установлен город публикации и город размещения из вакансии:', data.value.area);
      console.log('Город должен быть в citiesOptions:', citiesOptions.value.find(c => c.id === city.id));
      console.log('citiesOptions.length:', citiesOptions.value.length);
      
      // Используем nextTick для обновления DOM
      await nextTick();
      
      // Дополнительная задержка для обновления CityAutocomplete
      await new Promise(resolve => setTimeout(resolve, 50));
      
      console.log('После nextTick data.value.area:', data.value.area);
    } else {
      console.log('Город уже установлен пользователем:', data.value.area);
      isCitySetFromVacancy.value = true;
    }
  } else if (!city) {
    console.log('Город из вакансии не найден в списке hh.ru');
  } else if (isCitySetFromVacancy.value) {
    console.log('Город уже был установлен из вакансии, пропускаем');
  }
}

const employmentTypesOptions = computed(() => {
  if (currentPlatform.value === 'rabota' && rabotaEmploymentTypes.value.length > 0) {
    return rabotaEmploymentTypes.value.map(emp => ({
      id: emp.id || emp.employment_type_id,
      name: emp.name || emp.title
    }))
  }
  return HH_EMPLOYMENT_TYPES
})

const workSchedulesOptions = computed(() => {
  if (currentPlatform.value === 'rabota' && rabotaWorkSchedules.value.length > 0) {
    return rabotaWorkSchedules.value.map(schedule => ({
      id: schedule.id || schedule.work_schedule_id,
      name: schedule.name || schedule.title
    }))
  }
  return HH_WORK_SCHEDULE_BY_DAYS
})

// Опции опыта работы для Avito
const AVITO_EXPERIENCE_OPTIONS = [
  { id: 'noMatter', name: 'Неважно' },
  { id: 'moreThan1', name: 'Более 1 года' },
  { id: 'moreThan3', name: 'Более 3 лет' },
  { id: 'moreThan5', name: 'Более 5 лет' },
  { id: 'moreThan10', name: 'Более 10 лет' },
]

const experienceOptions = computed(() => {
  if (currentPlatform.value === 'rabota' && rabotaExperienceLevels.value.length > 0) {
    return rabotaExperienceLevels.value.map(exp => ({
      id: exp.id || exp.experience_id,
      name: exp.name || exp.title
    }))
  }
  if (currentPlatform.value === 'avito') {
    return AVITO_EXPERIENCE_OPTIONS
  }
  return experience
})

const educationOptions = computed(() => {
  if (currentPlatform.value === 'rabota' && rabotaEducationLevels.value.length > 0) {
    return rabotaEducationLevels.value.map(edu => ({
      id: edu.id || edu.education_id,
      name: edu.name || edu.title
    }))
  }
  return HH_EDUCATION_LAVEL
})

// Функция для загрузки справочников в зависимости от платформы
const loadDictionaries = async (platform) => {
  if (platform === 'rabota') {
    // Загружаем справочники rabota.ru
    const [professionsResult, regionsResult, employmentResult, schedulesResult, experienceResult, educationResult] = await Promise.all([
      getProfessionsRabota(),
      getRegionsRabota(),
      getEmploymentTypesRabota(),
      getWorkSchedulesRabota(),
      getExperienceLevelsRabota(),
      getEducationLevelsRabota()
    ])
    
    if (professionsResult?.data) {
      rabotaProfessions.value = Array.isArray(professionsResult.data) ? professionsResult.data : (professionsResult.data.items || [])
    }
    if (regionsResult?.data) {
      rabotaRegions.value = Array.isArray(regionsResult.data) ? regionsResult.data : (regionsResult.data.items || [])
      // Также обновляем cities для использования в форме
      cities.value = rabotaRegions.value.map(region => ({
        id: region.id || region.region_id,
        name: region.name || region.title
      }))
    }
    if (employmentResult?.data) {
      rabotaEmploymentTypes.value = Array.isArray(employmentResult.data) ? employmentResult.data : (employmentResult.data.items || [])
    }
    if (schedulesResult?.data) {
      rabotaWorkSchedules.value = Array.isArray(schedulesResult.data) ? schedulesResult.data : (schedulesResult.data.items || [])
    }
    if (experienceResult?.data) {
      rabotaExperienceLevels.value = Array.isArray(experienceResult.data) ? experienceResult.data : (experienceResult.data.items || [])
    }
    if (educationResult?.data) {
      rabotaEducationLevels.value = Array.isArray(educationResult.data) ? educationResult.data : (educationResult.data.items || [])
    }
  } else if (platform === 'avito') {
    // Загружаем профессии для Avito
    const professionsResult = await getProfessionsAvito()
    if (professionsResult?.data && !professionsResult.error) {
      avitoProfessions.value = Array.isArray(professionsResult.data) 
        ? professionsResult.data 
        : (professionsResult.data.items || [])
      
      // Преобразуем в формат для использования в выпадающем списке
      currectRole.value = avitoProfessions.value.map(prof => ({
        id: prof.id,
        name: prof.name || prof.title,
        roles: [] // Специализации будут загружены при выборе профессии
      }))
    }
  } else {
    // Загружаем справочники hh.ru (по умолчанию)
    const { roles, errorRoles } = await getRolesHh()
    if (!errorRoles) {
      currectRole.value = roles.categories
    }
    
    // Загрузка списка городов из API hh.ru
    const { data: areasData, error: areasError } = await getAreasHh()
    if (!areasError && areasData) {
      cities.value = areasData
      console.log('Загружены города из hh.ru в loadDictionaries, количество:', cities.value.length)
      // Обновляем вычисленные значения после загрузки городов
      updateComputedValues()
      // Применяем значения, включая установку города из вакансии
      await applyComputedValues()
    }
  }
}

// Загружаем справочники по умолчанию (hh.ru)
const { roles, errorRoles } = await getRolesHh()
if (!errorRoles) {
  currectRole.value = roles.categories
  // Обновляем вычисленные значения после загрузки отраслей
  updateComputedValues()
  await applyComputedValues()
}

// Загрузка списка городов из API hh.ru
// После загрузки городов ищем город из вакансии и устанавливаем его
const { data: areasData, error: areasError } = await getAreasHh()
if (!areasError && areasData) {
  cities.value = areasData
  console.log('Загружены города из hh.ru, количество:', cities.value.length)
  
  // Обновляем вычисленные значения после загрузки городов
  updateComputedValues()
  
  // Теперь применяем значения, включая установку города из вакансии
  await applyComputedValues()
}

const { data: addressesData, error: addressesError } = await getAddressesHh()
if (!addressesError && addressesData) {
  addresses.value = addressesData.items
}

// Преобразование тарифов из tariffsHh в формат для DropDownTypes
// const tariffsOptions = computed(() => {
//   if (!tariffsHh.value || !Array.isArray(tariffsHh.value)) {
//     return []
//   }
//   return tariffsHh.value.map(tariff => ({
//     id: tariff.id || tariff.property_type || tariff.name,
//     name: tariff.name || tariff.property_type || tariff.id,
//     property_type: tariff.property_type || tariff.id,
//     description: tariff.description || '',
//     available_publications_count: tariff.available_publications_count || 0
//   }))
// })

// console.log('tariffsOptions - ', tariffsOptions.value)

// Переменная для хранения тарифов
const tariffsOptions = ref([]);

// Функция для загрузки тарифов для платформы hh
const loadTariffsForHh = async (employerId) => {
  try {
    const tariffsResult = await getAvailablePublicationsHh(employerId)
    if (tariffsResult && tariffsResult.types && Array.isArray(tariffsResult.types)) {
      tariffsOptions.value = tariffsResult.types
      // Устанавливаем первый тариф по умолчанию, если есть и vacancy_properties не установлен
      if (tariffsOptions.value.length > 0 && !data.value.vacancy_properties) {
        const firstTariff = tariffsOptions.value[0]
        handleTariffUpdate({
          id: firstTariff.id || firstTariff.property_type || firstTariff.name,
          name: firstTariff.name || firstTariff.property_type || firstTariff.id,
          property_type: firstTariff.property_type || firstTariff.id
        })
      }
    } else {
      console.warn('Не удалось загрузить тарифы или неверный формат данных:', tariffsResult);
      tariffsOptions.value = [];
    }
  } catch (error) {
    console.error('Ошибка при загрузке тарифов:', error);
    tariffsOptions.value = [];
  }
}

// Получение выбранного тарифа для отображения в DropDownTypes
// const selectedTariff = computed(() => {
//   console.log('selectedTariff - ', data.value.vacancy_properties);
//   if (!data.value.vacancy_properties || data.value.vacancy_properties.length === 0) {
//     return null
//   }
//   const propertyType = data.value.vacancy_properties.properties[0].property_type
//   return tariffsOptions.value.find(tariff => tariff.property_type === propertyType) || null
// })

/** Заполняет форму из загруженной вакансии (globCurrentVacancy). Вызывать после установки globCurrentVacancy. */
async function fillFormFromCurrentVacancy() {
  const vacancy = globCurrentVacancy.value
  if (!vacancy) return

  const platformKey = data.value.platform?.platform ?? data.value.platform
  const platformProps = platformKey ? (PLATFORM_PROPERTIES[platformKey] || {}) : {}
  for (const key in platformProps) {
    data.value[key] = vacancy[key]
  }
  if (vacancy.salary_from != null) data.value.salary_range.from = vacancy.salary_from
  if (vacancy.salary_to != null) data.value.salary_range.to = vacancy.salary_to
  if (vacancy.education) {
    data.value.education_level = HH_EDUCATION_LAVEL.find((item) => item.name == vacancy.education)
  }
  if (vacancy.phrases) data.value.phrases = vacancy.phrases
  if (vacancy.drivers) data.value.driver_license_types = vacancy.drivers
  if (vacancy.location) data.value.location = vacancy.location

  // График работы: API может вернуть один id/name или несколько через запятую (например "FOUR_ON_FOUR_OFF, FOUR_ON_THREE_OFF")
  const scheduleVal = vacancy.schedule ?? vacancy.work_schedule
  if (scheduleVal != null && scheduleVal !== '') {
    const scheduleOpts = workSchedulesOptions.value || []
    const parts = typeof scheduleVal === 'string' ? scheduleVal.split(',').map(s => s.trim()).filter(Boolean) : [scheduleVal]
    const ids = []
    for (const part of parts) {
      const scheduleObj = findValueByIdOrName(scheduleOpts, part) || findValue(scheduleOpts, part) || findValueByNameOrSiteName(scheduleOpts, part)
      if (scheduleObj) {
        const id = scheduleObj.id != null ? String(scheduleObj.id) : scheduleObj.id
        if (id && !ids.some(item => item.id === id)) ids.push({ id })
      }
    }
    data.value.work_schedule_by_days = ids
  }
  // Рабочие часы в день: API может вернуть один id/name или несколько через запятую (например "HOURS_3, HOURS_5")
  const hoursFromApi = vacancy.work_hours_per_day ?? vacancy.workHoursPerDay ?? vacancy.working_hours
  if (hoursFromApi != null && hoursFromApi !== '') {
    const parts = typeof hoursFromApi === 'string' ? hoursFromApi.split(',').map(s => s.trim()).filter(Boolean) : [hoursFromApi]
    const ids = []
    for (const part of parts) {
      const hoursObj = findValueByIdOrName(HH_WORKING_HOURS, part) || findValue(HH_WORKING_HOURS, part)
      if (hoursObj) {
        const id = hoursObj.id != null ? String(hoursObj.id) : hoursObj.id
        if (id && !ids.some(item => item.id === id)) ids.push({ id })
      }
    }
    data.value.working_hours = ids
  }
  if (vacancy.place != null && vacancy.place !== '') {
    data.value.workSpace = String(vacancy.place)
  }

  updateComputedValues()
  await applyComputedValues()
}

const vacancyIdFields = ['experience', 'employment_form']

// Заполнение формы: при редактировании из «Активные публикации» — вакансия по id строки (GET /api/vacancies/{id}), иначе — по id из URL
async function loadInitialFormData() {
  const platformIdToName = { 1: 'hh', 2: 'avito', 3: 'rabota', 4: 'superjob' };

  let vacancyId = route.query.id;

  if (props.editingVacancy?.id) {
    vacancyId = String(props.editingVacancy.id);
    const platformData = props.editingVacancy.platforms_data?.[0];
    if (platformData) {
      const platformName = platformIdToName[platformData.id];
      const platformKey = platforms.value?.find(p => p.platform === platformName) || platforms.value?.[0];
      if (platformKey) {
        data.value.platform = platformKey;
      }
    }
  }

  if (vacancyId) {
    // Загружаем вакансию с API только если ещё нет или id изменился
    if (!globCurrentVacancy.value || vacancyId !== globCurrentVacancy.value.id?.toString()) {
      const vacancy = await getVacancyById(vacancyId);
      if (vacancy) {
        globCurrentVacancy.value = vacancy;
        console.log('Загружена вакансия, location:', vacancy.location);
      }
    }
    // Всегда заполняем форму при открытии (в т.ч. при повторном открытии модалки без перезагрузки)
    if (globCurrentVacancy.value && globCurrentVacancy.value.id?.toString() === vacancyId) {
      updateComputedValues();
      await fillFormFromCurrentVacancy();
      vacancyIdFields.forEach((field) => {
        const fieldValue = globCurrentVacancy.value?.[mappingFieldsHH[field]?.field]
        const values = mappingFieldsHH[field].values
        const found = field === 'employment_form'
          ? findValueByNameOrSiteName(values, fieldValue)
          : findValue(values, fieldValue)
        if (found == null) {
          handleIdUpdate(field, values[0])
        } else {
          handleIdUpdate(field, found)
        }
      })
    }
  }
}

await loadInitialFormData();

const getPhrasesVacancy = async function() {
  const { data, error } = await getPhrases()
  return data
}

phrases.value = await getPhrasesVacancy()

// Дефолты для experience/employment_form, если вакансия не загружалась (форма «добавить»)
vacancyIdFields.forEach((field) => {
  const fieldValue = globCurrentVacancy.value?.[mappingFieldsHH[field]?.field]
  const values = mappingFieldsHH[field].values
  const found = field === 'employment_form'
    ? findValueByNameOrSiteName(values, fieldValue)
    : findValue(values, fieldValue)
  if (found == null) {
    handleIdUpdate(field, values[0])
  } else {
    handleIdUpdate(field, found)
  }
})

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
  
  // Обновляем вычисленные значения после обработки vacancyData
  // Но не применяем город, так как города еще могут быть не загружены
  updateComputedValues()
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
    // Загружаем тарифы для платформы hh
    if (data.data?.employer?.id) {
      await loadTariffsForHh(data.data.employer.id)
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
              if (!profile.error && profile.data?.data?.employer?.id) {
                await loadTariffsForHh(profile.data.data.employer.id)
                key.isAuthenticated = true
                key.data = profile.data.data
                isPlatforms.value = true
              }
            } else if (key.platform == 'avito') {
              const profile = await profileAvito()  
              if (!profile.error) {
                key.isAuthenticated = true
                key.data = profile.data.data
                isPlatforms.value = true
              }
            } else if (key.platform == 'rabota') {
              const profile = await profileRabota()  
              if (!profile.error && profile.data) {
                key.isAuthenticated = true
                key.data = profile.data.data
                isPlatforms.value = true
                // Загружаем справочники rabota.ru
                await loadDictionaries('rabota')
              }
            }
            data.value.platform = key
            break // Используем найденную платформу
          }
        } else {
          // Старая логика, если платформа не передана
          if (key.platform == 'hh') {
            const profile = await profileHh()  
            if (!profile.error && profile.data?.data?.employer?.id) {
              await loadTariffsForHh(profile.data.data.employer.id)
              key.isAuthenticated = true
              key.data = profile.data.data
              isPlatforms.value = true
              // data.value.billing_types = key.types ? key.types[6] : null
            }
          } else if (key.platform == 'avito') {
            const profile = await profileAvito()  
            if (!profile.error) {
              key.isAuthenticated = true
              key.data = profile.data.data
              isPlatforms.value = true
              // Загружаем справочники avito.ru
              await loadDictionaries('avito')
            }
          } else if (key.platform == 'rabota') {
            const profile = await profileRabota()  
            if (!profile.error && profile.data) {
              key.isAuthenticated = true
              key.data = profile.data.data
              isPlatforms.value = true
              // Загружаем справочники rabota.ru
              await loadDictionaries('rabota')
            }
          }
          data.value.platform = key
          data.value.vacancy_properties = {
                properties: [
                  {
                    property_type: tariffsOptions.value[0]
                  }
                ]
          }
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

// Преобразование графика работы для MultiSelect (id -> value)
const workScheduleOptions = computed(() => {
  const schedules = workSchedulesOptions.value
  return schedules.map(schedule => ({
    ...schedule,
    value: schedule.id
  }))
})

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

// Функция для подсчета символов в тексте (без HTML тегов)
const getTextLength = (htmlString) => {
  if (!htmlString) return 0;
  // Проверяем, что мы на клиенте
  if (typeof document === 'undefined') return 0;
  // Создаем временный элемент для извлечения текста
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = htmlString;
  const text = tempDiv.textContent || tempDiv.innerText || '';
  return text.trim().length;
}

// Computed для подсчета длины description
const descriptionLength = computed(() => {
  return getTextLength(data.value.description);
})

// Функция для валидации description при изменении
const updateDescriptionValidation = (value) => {
  const length = getTextLength(value);
  if (length < 200) {
    validFields.value.description.status = false;
    validFields.value.description.error = `Описание должно содержать минимум 200 символов. Сейчас: ${length} символов.`;
  } else {
    validFields.value.description.status = true;
    validFields.value.description.error = null;
  }
}

const validateFields = () => { 
  let isValid = true;
  for (const key in validFields.value) {
    // Специальная валидация для description
    if (key === 'description') {
      const length = getTextLength(data.value[key]);
      if (!data.value[key] || length < 200) {
        isValid = false;
        validFields.value[key].status = false;
        validFields.value[key].error = `Описание должно содержать минимум 200 символов. Сейчас: ${length} символов.`;
      } else {
        validFields.value[key].status = true;
        validFields.value[key].error = null;
      }
      continue;
    }
    
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
        if (data.value[key].id === undefined || data.value[key].id === null) {
          isValid = false
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
  const isEditing = props.editingVacancy != null && props.editingVacancy?.id != null;

  if (!isEditing && !validateFields()) {
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
  
  // Если редактируем, обновляем вакансию на API и на привязанной платформе
  if (isEditing) {
    try {
      const mappedData = mapVacancyToUpdateFormat(data.value);
      console.log('edit vacancy', props.editingVacancy);

      const { data: updateData, error } = await fetchVacancyUpdate(mappedData, props.editingVacancy.id);

      if (error) {
        status.value = error || 'Ошибка при обновлении вакансии';
        return;
      }

      // Обновляем кэш вакансии данными с сервера, чтобы при повторном открытии модалки отображались актуальные график/часы
      if (updateData) {
        globCurrentVacancy.value = (typeof updateData === 'object' && updateData !== null && 'data' in updateData)
          ? updateData.data
          : updateData;
      }

      const platformData = props.editingVacancy.platforms_data?.[0];
      if (platformData?.id && platformData?.platform_id != null) {
        const platformId = platformData.id;
        const vacancyPlatformId = platformData.platform_id;
        const payload = { ...data.value, vacancy_platform_id: String(vacancyPlatformId), publication_id: vacancyPlatformId };
        let platformResponse = null;
        if (platformId === 1) {
          platformResponse = await publishVacancyToHh(payload);
        } else if (platformId === 2) {
          platformResponse = await publishVacancyToAvito(payload);
        } else if (platformId === 3) {
          platformResponse = await publishVacancyToRabota(payload);
        }
        if (platformResponse?.error || platformResponse?.errorDraft) {
          status.value = 'Вакансия обновлена. Ошибка обновления на платформе: ' + (platformResponse?.error || platformResponse?.errorDraft || 'неизвестная ошибка');
        } else {
          status.value = 'Вакансия и публикация на платформе успешно обновлены';
        }
      } else {
        status.value = 'Вакансия успешно обновлена';
      }
      emit('saved');
    } catch (err) {
      console.error('Ошибка при обновлении вакансии:', err);
      status.value = 'Ошибка при обновлении вакансии';
    }
    return;
  }
  
  // Иначе создаем новую вакансию
  let response;
  if (currentPlatform !== 'avito' && currentPlatform !== 'hh' && currentPlatform !== 'rabota') {
   status.value = `Платформа ${currentPlatform} пока не поддерживается`
   return
  }
  
  // Выбираем функцию в зависимости от платформы и флага isDraft
  if (currentPlatform === 'avito') {
    if (isDraft.value || isDraft.value === 'true') {
      response = await addDraftAvito(data.value)
    } else {
      response = await publishVacancyToAvito(data.value)
    }
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

// Автоматическая загрузка справочников при смене платформы
watch(() => data.value.platform?.platform, async (newPlatform) => {
  if (newPlatform) {
    await loadDictionaries(newPlatform)
  }
})

// Автоматическая валидация description при изменении
watch(() => data.value.description, (newValue) => {
  if (newValue !== undefined && newValue !== null) {
    updateDescriptionValidation(newValue)
  }
}, { immediate: true })


onBeforeMount(async () => {
})

</script>

<style scoped>
  .anchor {
    scroll-margin-top: 80px;
  }
</style>