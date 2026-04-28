<template>
  <div
    class="flex h-[min(90vh,100dvh)] max-h-[min(90vh,100dvh)] min-h-0 w-full flex-col overflow-hidden rounded-b-fifteen"
  >
      <div
        class="hh-original-popup-scroll flex min-h-0 flex-1 basis-0 flex-col overflow-y-auto overscroll-y-contain px-25px pb-25px pt-25px rounded-t-fifteen"
      >
      <div v-if="!loading" class="mb-25px">
        <p class="text-xl font-semibold text-space mb-1">{{ popupTitle }}</p>
        <p class="text-sm font-normal text-slate-custom leading-normal">
          <template v-if="joblyPublishPrefill">
            Поля уже подставлены из вашей вакансии в кабинете. Перед публикацией вы можете изменить текст и условия именно для объявления на hh.ru — для каждой публикации это можно настроить отдельно.
          </template>
          <template v-else>
            Вы меняете текст и параметры именно той вакансии, что видна соискателям на HeadHunter.
          </template>
        </p>
      </div>

      <div
        v-if="loading"
        class="flex min-h-[min(420px,calc(90dvh-100px))] flex-1 flex-col items-center justify-center py-15px"
        role="status"
        aria-busy="true"
        aria-label="Загрузка"
      >
        <UiDotsLoader class="w-full" />
        <span class="sr-only">Загрузка</span>
    </div>

    <div v-else-if="errorMessage" class="rounded-fifteen border border-red-200 bg-red-50 px-15px py-12px text-sm text-red-800">
      {{ errorMessage }}
    </div>

      <div v-else-if="!loading && !errorMessage" class="space-y-25px">
      <template v-for="key in HH_VACANCY_POPUP_STATIC_DISPLAY_KEYS" :key="key">
        <div
          v-if="key !== 'fly_in_fly_out_duration' || isHhFlyInFlyOutEmployment"
          class="mb-6 border-b border-athens pb-6 last:border-b-0 last:pb-0"
        >
        <template v-if="key === '__additional_popup__'">
          <p class="leading-normal text-space text-xl font-semibold mb-[33px]">
            Дополнительно
          </p>
          <MyCheckbox
            id="hh-pop-allow-messages"
            class="mb-6"
            :label="hhVacancyFieldLabelRu('allow_messages')"
            :model-value="draftPayload.allow_messages === true"
            @update:model-value="(v: boolean) => patchField('allow_messages', v)"
          />
          <MyCheckbox
            id="hh-pop-response-letter"
            class="mb-6"
            :label="hhVacancyFieldLabelRu('response_letter_required')"
            :model-value="draftPayload.response_letter_required === true"
            @update:model-value="(v: boolean) => patchField('response_letter_required', v)"
          />
          <p class="text-sm font-medium mb-2 leading-normal text-space">
            Кто и как может откликаться
          </p>
          <MultiSelect
            :options="additionalConditionsMultiselectOptions"
            :with-id="true"
            :model-value="additionalConditionsModel"
            default-value="Сделайте выбор"
            @update:model-value="onAdditionalConditionsUpdate"
          />
        </template>

        <template v-else-if="key === '__contact_information__'">
          <p class="leading-normal text-space text-xl font-semibold mb-[33px]">
            Контактная информация
          </p>
          <MyCheckbox
            id="hh-popup-hide-contacts"
            label="Не отображать контакты в вакансии"
            class="mb-6"
            :model-value="draftPayload.show_contacts === false"
            @update:model-value="(v: boolean) => patchField('show_contacts', !v)"
          />
          <template v-if="draftPayload.show_contacts !== false">
            <div class="mb-11px w-full">
              <p class="text-sm font-medium text-space mb-16px leading-normal">
                <span class="text-red-custom">*</span>
                Контактное лицо
              </p>
              <div class="relative w-full">
                <MyInput
                  :key="'hh-cname-' + formRemountKey"
                  class="!pr-38px"
                  :model-value="hhContactName"
                  placeholder="Имя ответственного за вакансию или собеседования"
                  @update:model-value="onHhContactName"
                />
                <button
                  v-if="hhContactName"
                  type="button"
                  class="absolute right-12px top-1/2 -translate-y-1/2 p-1 text-bali hover:text-space transition-colors"
                  aria-label="Очистить"
                  @click="clearHhContactName"
                >
                  <svg-icon name="close" width="16" height="16" />
                </button>
              </div>
            </div>
            <div class="w-full flex flex-wrap justify-between gap-x-[25px] gap-y-15px">
              <div class="w-full min-w-[200px] max-w-[400px] flex-1">
                <p class="text-sm font-medium text-space leading-normal mb-4">
                  Номер телефона
                </p>
                <MyInput
                  :key="'hh-cphone-' + formRemountKey"
                  :model-value="hhContactPhone"
                  placeholder="+7-000-000-0000"
                  @update:model-value="onHhContactPhone"
                />
              </div>
              <div class="w-full min-w-[200px] flex-1">
                <p class="text-sm font-medium text-space leading-normal mb-4">
                  Email
                </p>
                <MyInput
                  :key="'hh-cemail-' + formRemountKey"
                  :model-value="hhContactEmail"
                  placeholder="Email"
                  @update:model-value="onHhContactEmail"
                />
              </div>
            </div>
          </template>
        </template>

        <template v-else>
            <p class="text-sm font-medium mb-2 leading-normal text-space">
            {{ hhVacancyFieldLabelRu(key) }}
            <span v-if="isHhVacancyPayloadServiceKey(key)" class="ml-2 text-11px font-normal text-bali">только просмотр</span>
          </p>

          <template v-if="isHhVacancyPayloadServiceKey(key)">
            <pre
              class="max-h-40 overflow-auto rounded-ten border border-athens bg-athens-gray p-15px text-11px font-mono text-space whitespace-pre-wrap break-words"
            >{{ formatReadonlyValue(key) }}</pre>
          </template>

          <template v-else-if="key === 'name'">
              <MyInput
              :key="'mi-' + key + '-' + formRemountKey"
              :model-value="scalarString(key)"
                placeholder="—"
              @update:model-value="(v: string) => patchField(key, v)"
              />
            </template>

          <template v-else-if="key === 'professional_roles'">
            <SpecializationSelector
              :options="professionsOptionsForHh"
              :full-catalog="hhRoleCategories"
              :model-value="professionalRoleSingle"
              placeholder="Выберите из списка"
              @update:model-value="onProfessionalRoleUpdate"
              />
            </template>

          <template v-else-if="key === 'experience'">
            <div class="flex w-full flex-wrap gap-2">
              <button
                v-for="opt in experienceOptionsList"
                :key="String(opt.id)"
                type="button"
                class="flex-1 min-w-[120px] px-4 py-2.5 text-sm rounded-ten border transition-colors"
                :class="isExperienceOptSelected(opt)
                  ? 'bg-zumthor border-dodger text-dodger font-normal'
                  : 'bg-athens-gray border-athens text-bali font-normal hover:bg-dodger hover:border-transparent hover:text-white'"
                @click="patchField('experience', { id: opt.id, name: opt.name })"
              >
                {{ opt.name }}
              </button>
            </div>
            </template>

          <template v-else-if="key === 'employment_form'">
            <div class="flex flex-col gap-4">
              <div>
                <p class="text-xs text-bali mb-2">Какого сотрудника ищите?</p>
                <div class="flex w-full gap-2">
                  <button
                    v-for="opt in hhEmployeeTypeOptions"
                    :key="opt.id"
                    type="button"
                    class="flex-1 min-w-[120px] px-4 py-2.5 text-sm rounded-ten border transition-colors"
                    :class="hhEmployeeType === opt.id
                      ? 'bg-zumthor border-dodger text-dodger font-normal'
                      : 'bg-athens-gray border-athens text-bali font-normal hover:bg-dodger hover:border-transparent hover:text-white'"
                    @click="onHhEmployeeTypeClick(opt.id)"
                  >
                    {{ opt.name }}
                  </button>
              </div>
              </div>
              <div>
                <p class="text-xs text-bali mb-2">Тип занятости</p>
                <div class="flex w-full flex-wrap gap-2">
                  <button
                    v-for="opt in hhEmploymentOptionsForType"
                    :key="String(opt.id)"
                    type="button"
                    class="flex-1 min-w-[120px] px-4 py-2.5 text-sm rounded-ten border transition-colors"
                    :class="isHhEmploymentSelected(opt)
                      ? 'bg-zumthor border-dodger text-dodger font-normal'
                      : 'bg-athens-gray border-athens text-bali font-normal hover:bg-dodger hover:border-transparent hover:text-white'"
                    @click="patchField('employment_form', { ...opt })"
                  >
                    {{ opt.name }}
                  </button>
                </div>
              </div>
            </div>
            </template>

          <template v-else-if="key === 'fly_in_fly_out_duration'">
            <MultiSelect
              :options="experienceDaysOptions"
              :with-id="true"
              :model-value="asObjectArray(key)"
              default-value="Выберите длительность вахты"
              @update:model-value="(v: unknown[]) => patchField(key, v)"
            />
            </template>

          <template v-else-if="key === 'work_format'">
            <MultiSelect
              :options="workFormatOptionsMs"
              :with-id="true"
              :model-value="asObjectArray(key)"
              default-value="Выберите формат работы"
              @update:model-value="(v: unknown[]) => patchField(key, v)"
            />
          </template>

          <template v-else-if="key === 'civil_law_contracts'">
            <MultiSelect
              :key="'clc-' + formRemountKey"
              :options="[...HH_OFORMLENIE_MULTISELECT_OPTIONS]"
              :with-id="true"
              :model-value="civilLawContractsModel"
              default-value="Выберите оформление"
              @update:model-value="onCivilLawContractsUpdate"
            />
          </template>

          <template v-else-if="key === 'work_schedule_by_days'">
            <div class="flex flex-wrap gap-2">
              <button
                v-for="opt in workScheduleOptionsMs"
                :key="opt.id"
                type="button"
                class="px-4 py-2.5 text-sm rounded-ten border transition-colors"
                :class="isScheduleOptSelected(opt)
                  ? 'bg-zumthor border-dodger text-dodger font-normal'
                  : 'bg-athens-gray border-athens text-bali font-normal hover:bg-dodger hover:border-transparent hover:text-white'"
                @click="patchField('work_schedule_by_days', [opt])"
              >
                {{ opt.name }}
              </button>
          </div>
      </template>

          <template v-else-if="key === 'working_hours'">
            <div class="flex flex-wrap gap-2">
              <button
                v-for="opt in workingHoursOptionsMs"
                :key="opt.id"
                type="button"
                class="px-4 py-2.5 text-sm rounded-ten border transition-colors"
                :class="isHoursOptSelected(opt)
                  ? 'bg-zumthor border-dodger text-dodger font-normal'
                  : 'bg-athens-gray border-athens text-bali font-normal hover:bg-dodger hover:border-transparent hover:text-white'"
                @click="patchField('working_hours', [opt])"
              >
                {{ hhWorkingHoursChipLabel(opt) }}
              </button>
    </div>
          </template>

          <template v-else-if="key === 'area'">
            <GeoInput
              :model-value="hhLocationDisplay"
              :use-api-cities="true"
              placeholder="Например, Москва"
              @update:model-value="onHhLocationUpdate"
            />
          </template>

          <template v-else-if="key === 'address'">
            <AddressMapInput
              :model-value="addressLineFromHhPayload(draftPayload[key])"
              :hide-address="addressHideFlag"
              placeholder="Адрес работы"
              @update:model-value="onHhWorkAddressUpdate"
              @update:hide-address="onAddressHideUpdate"
            />
          </template>

          <template v-else-if="key === 'salary_range'">
            <div class="flex flex-col gap-4">
              <div class="flex flex-wrap items-end gap-2.5">
                <div class="min-w-[100px] flex-1">
                  <p class="text-xs text-bali mb-1">От</p>
                  <MyInput
                    :key="'sal-from-' + formRemountKey"
                    type="Number"
                    :model-value="salaryFromStr"
                    placeholder="От"
                    @update:model-value="onSalaryFrom"
                  />
                </div>
                <div class="min-w-[100px] flex-1">
                  <p class="text-xs text-bali mb-1">До</p>
                  <MyInput
                    :key="'sal-to-' + formRemountKey"
                    type="Number"
                    :model-value="salaryToStr"
                    placeholder="До"
                    @update:model-value="onSalaryTo"
                  />
                </div>
                <div class="min-w-[120px] flex-1">
                  <p class="text-xs text-bali mb-1">Валюта</p>
                  <MyDropdown
                    :options="currencyRows"
                    :model-value="currencyDisplayValue"
                    @update:model-value="onCurrencyDropdown"
                  />
                </div>
                <div class="min-w-[140px] flex-1">
                  <p class="text-xs text-bali mb-1">Период</p>
                  <DropDownTypes
                    :options="HH_SALARY_TYPE"
                    :model-value="salaryModeSelected"
                    @update:model-value="(o) => patchSalaryNested('mode', o)"
                  />
                </div>
              </div>
              <RadioGroup
                class="flex gap-[18px]"
                :model-value="salaryGrossRadio"
                @update:model-value="(val: string) => patchSalaryGross(val === 'full-cash')"
              >
                <div class="my-checkbox">
                  <Label for="hh-sal-past" class="cursor-pointer flex items-center">
                    <RadioGroupItem id="hh-sal-past" value="past-cash" class="mr-5px" />
                    <p>На руки</p>
                  </Label>
                </div>
                <div class="my-checkbox">
                  <Label for="hh-sal-full" class="cursor-pointer flex items-center">
                    <RadioGroupItem id="hh-sal-full" value="full-cash" class="mr-5px" />
                    <p>До вычета налогов</p>
                  </Label>
                </div>
              </RadioGroup>
              <div class="max-w-md">
                <p class="text-xs text-bali mb-1">Частота выплаты</p>
                <DropDownTypes
                  :options="HH_SALARY_FREQUENCY"
                  :model-value="salaryFrequencySelected"
                  @update:model-value="(o) => patchSalaryNested('frequency', o)"
                />
              </div>
            </div>
          </template>

          <template v-else-if="key === 'description'">
            <TiptapEditor
              :key="'desc-' + formRemountKey"
              :model-value="String(draftPayload.description ?? '')"
              class="mb-15px"
              @update:model-value="(html: string) => patchField('description', html)"
            />
          </template>

          <template v-else-if="key === 'key_skills'">
            <TagSelect
              :key="'ks-' + formRemountKey"
              :options="[]"
              :model-value="keySkillsTags"
              :is-new="true"
              placeholder="Например, Водительские права"
              @update:model-value="onKeySkillsUpdate"
              @enter="onKeySkillsUpdate"
              @delete="onKeySkillsUpdate"
            />
          </template>

          <template v-else-if="key === 'languages'">
            <MyAccordion ref="languagesAccordionRef" title="Языки" class="mb-0 w-full">
              <div class="flex flex-col gap-15px w-full">
                <div
                  v-for="(item, index) in languageFormRows"
                  :key="'lang-' + index + '-' + formRemountKey"
                  class="flex flex-row flex-wrap items-center gap-x-25px gap-y-15px w-full"
                >
                  <MyDropdown
                    class="min-w-[180px] flex-1 w-full"
                    :options="languageDropdownOptions"
                    :model-value="item.language"
                    placeholder="Выберите язык"
                    @update:model-value="(v: unknown) => updatePopupLanguageAt(index, v)"
                    @open="() => { if (index === 0) onFirstPopupLanguageDropdownOpen() }"
                  />
                  <MyDropdown
                    class="min-w-[200px] flex-1 w-full"
                    :options="languageLevelDropdownOptions"
                    :model-value="item.languageLevel"
                    placeholder="Выберите уровень"
                    @update:model-value="(v: unknown) => updatePopupLanguageLevelAt(index, v)"
                  />
                  <button
                    type="button"
                    class="p-1 text-bali hover:text-space transition-colors shrink-0"
                    aria-label="Удалить"
                    @click="removePopupLanguageRow(index)"
                  >
                    <svg-icon name="dropdown-cross" width="20" height="20" />
                  </button>
                </div>
                <button
                  type="button"
                  class="text-sm text-dodger font-medium hover:underline w-fit"
                  @click="addPopupLanguageRow"
                >
                  Добавить ещё один язык
                </button>
              </div>
            </MyAccordion>
          </template>

          <template v-else-if="key === 'driver_license_types'">
            <MultiSelect
              :options="driverLicenseOptionsMs"
              :with-id="true"
              :model-value="asObjectArray(key)"
              default-value="Сделайте выбор"
              @update:model-value="(v: unknown[]) => patchField(key, v)"
            />
          </template>

          <template v-else-if="key === 'education_level'">
            <DropDownTypes
              :options="HH_EDUCATION_LAVEL"
              :model-value="educationLevelSelected"
              placeholder="Образование"
              @update:model-value="(o) => patchField('education_level', o)"
            />
          </template>

          <template v-else-if="valueKind(key) === 'bool'">
            <MyCheckbox
              :id="'hh-pop-' + key"
              :label="hhVacancyFieldLabelRu(key)"
              :model-value="draftPayload[key] === true"
              @update:model-value="(v: boolean) => patchField(key, v)"
            />
          </template>

          <template v-else-if="valueKind(key) === 'text'">
            <input
              type="text"
              class="w-full rounded-ten border border-athens bg-white px-15px py-9px text-sm text-space outline-none focus:border-dodger"
              :value="scalarString(key)"
              placeholder="—"
              @input="setScalarFromString(key, ($event.target as HTMLInputElement).value)"
            />
          </template>

          <template v-else>
            <textarea
              class="w-full min-h-[100px] rounded-ten border border-athens bg-white px-15px py-9px text-11px font-mono text-space outline-none resize-y"
              :class="jsonErrors[key] ? 'border-red-300' : ''"
              :value="jsonEditorText(key)"
              spellcheck="false"
              @input="onJsonFieldInput(key, ($event.target as HTMLTextAreaElement).value)"
            />
            <p v-if="jsonErrors[key]" class="text-xs text-red-600 mt-1">{{ jsonErrors[key] }}</p>
          </template>
        </template>
        </div>
      </template>
    </div>
      </div>
    <footer
      class="relative z-20 flex flex-shrink-0 flex-wrap items-center justify-between gap-15px rounded-b-fifteen border-t border-athens bg-white px-25px py-15px"
    >
      <div class="flex flex-wrap items-center gap-15px">
        <template v-if="joblyPublishPrefill">
          <div class="min-w-[200px] max-w-[340px] flex-1 basis-[200px]">
            <DropDownTypes
              v-if="hhPublishTariffs.length > 0"
              drop-up
              :options="hhPublishTariffs"
              :selected="selectedHhPublishTariff"
              placeholder="Тариф публикации"
              @update:model-value="onHhTariffSelected"
            />
            <p v-else-if="hhTariffsLoading" class="text-sm text-bali py-9px">Загрузка тарифов…</p>
            <p v-else-if="hhTariffsLoadError" class="text-sm text-red-600 py-9px leading-snug">
              {{ hhTariffsLoadError }}
            </p>
            <p v-else class="text-sm text-bali py-9px leading-snug">
              Нет размещений на счёте hh.ru. Купите пакет или выберите другой способ публикации.
            </p>
          </div>
          <UiButton
            variant="action"
            size="action"
            :disabled="publishJoblyActionsDisabled || !selectedHhPublishTariff || hhPublishTariffs.length === 0"
            @click="publishJoblyVacancyToHh"
          >
            {{ saving ? 'Публикация…' : 'Опубликовать' }}
          </UiButton>
          <UiButton
            variant="back"
            size="back"
            :disabled="publishJoblyActionsDisabled"
            @click="saveJoblyVacancyAsHhDraft"
          >
            {{ savingDraft ? 'Сохранение…' : 'В черновик' }}
          </UiButton>
        </template>
        <UiButton
          v-else
          variant="action"
          size="action"
          :disabled="loading || saving || staticLayoutPreview || !isDirty || hasJsonErrors || !props.vacancyId || props.vacancyId < 1"
          @click="saveToHh"
        >
          {{ saving ? 'Сохранение…' : 'Сохранить на hh.ru' }}
        </UiButton>
        <UiButton variant="back" size="back" :disabled="loading || saving || savingDraft" @click="emit('close')">
          Закрыть
        </UiButton>
      </div>
      <UiButton
        v-if="!joblyPublishPrefill"
        variant="ghost"
        size="default"
        class="h-auto shrink-0 px-2 py-2 text-sm font-normal text-dodger no-underline hover:bg-transparent hover:text-dodger hover:no-underline"
        :disabled="loading || saving || staticLayoutPreview"
        @click="reloadFromHh"
      >
        Обновить с hh.ru
      </UiButton>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue';
import MyInput from '~/components/custom/MyInput.vue';
import MyCheckbox from '~/components/custom/MyCheckbox.vue';
import MyDropdown from '~/components/custom/MyDropdown.vue';
import MultiSelect from '~/components/custom/MultiSelect.vue';
import DropDownTypes from '~/components/platforms/DropDownTypes.vue';
import TagSelect from '~/components/custom/TagSelect.vue';
import TiptapEditor from '~/components/TiptapEditor.vue';
import GeoInput from '~/components/custom/GeoInput.vue';
import AddressMapInput from '~/components/custom/AddressMapInput.vue';
import MyAccordion from '~/components/custom/MyAccordion.vue';
import SpecializationSelector from '~/components/custom/SpecializationSelector.vue';
import UiDotsLoader from '~/components/custom/UiDotsLoader.vue';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  getHhPublicationOriginal,
  putHhPublicationOriginal,
  type HhPublicationOriginalApiData,
} from '@/utils/getVacancies';
import {
  getAreas,
  getAddresses,
  getLanguages,
  getLanguageLevels,
  getPublishFormReference,
  postAvailablePublicationsCounts,
  publishHhVacancy as publishVacancy,
  addHhDraft as addDraft,
} from '@/utils/hhAccount';
import type { DraftDataHh } from '@/types/platform';
import {
  HH_ADDITIONAL_CONDITIONS,
  HH_DRIVER_LICENSE_TYPES,
  HH_EDUCATION_LAVEL,
  HH_EXPERIENCE_DAYS,
  HH_SALARY_FREQUENCY,
  HH_SALARY_TYPE,
  HH_WORK_FORMAT,
  HH_WORK_SCHEDULE_BY_DAYS,
  HH_WORKING_HOURS,
} from '@/src/constants';
import experienceJson from '@/src/data/experience.json';
import currencyFile from '@/src/data/currency.json';
import {
  HH_OFORMLENIE_MULTISELECT_OPTIONS,
  HH_VACANCY_POPUP_STATIC_DISPLAY_KEYS,
  hhVacancyFieldLabelRu,
  isHhVacancyPayloadServiceKey,
} from '@/utils/hhVacancyPayloadConstants';
import {
  addressLineFromHhPayload,
  dedupeAreasByName,
  draftPayloadFromHhOriginalLayer,
  normalizeOformlenieFieldsForPopupDraft,
} from '@/utils/hhPublicationPopupHelpers';

const props = withDefaults(
  defineProps<{
    /** ID публикации hh для загрузки снимка; не нужен при `staticLayoutPreview` */
    vacancyId?: number;
    /** С карточки «Опубликовать»: не сохранять снимок в БД при загрузке / «Обновить с hh.ru» */
    suppressSnapshotPersist?: boolean;
    /** Заголовок как у публикации, не «Редактирование» */
    isPublishHeadline?: boolean;
    /** Только верстка без запросов к API (карточка «Опубликовать» на hh) */
    staticLayoutPreview?: boolean;
    /** Заполнение формы из вакансии Jobly без GET снимка hh (карточка «Опубликовать») */
    joblyPublishPrefill?: boolean;
    /** Человек из Jobly; `undefined` — родитель ещё грузит данные (показываем лоадер после справочников) */
    initialHhDraftFromJobly?: Record<string, unknown> | null | undefined;
  }>(),
  {
    suppressSnapshotPersist: false,
    isPublishHeadline: false,
    staticLayoutPreview: false,
    joblyPublishPrefill: false,
  }
);

const staticLayoutPreview = computed(() => props.staticLayoutPreview === true);
const joblyPublishPrefill = computed(() => props.joblyPublishPrefill === true);

const popupTitle = computed(() =>
  props.isPublishHeadline ? 'Публикация вакансии на hh.ru' : 'Редактирование вакансии на hh.ru'
);

const emit = defineEmits<{
  close: [];
  /** Успешный PUT на hh.ru и обновление снимка в приложении */
  saved: [];
  /** Первая публикация с карточки Jobly: POST /hh/publication */
  'jobly-hh-published': [];
  /** Черновик на hh без списания размещения: POST /hh/drafts */
  'jobly-hh-draft-saved': [];
}>();

type HhTariffOption = {
  id: number;
  name: string;
  property_type: unknown;
  description?: string;
  available_publications_count?: number;
};

const hhTariffsLoading = ref(false);
const hhPublishTariffs = ref<HhTariffOption[]>([]);
const selectedHhPublishTariff = ref<HhTariffOption | null>(null);
const hhTariffsLoadError = ref<string | null>(null);
/** Ответ GET /hh/local/publish-form-reference (роли + шаблоны тарифов). */
const publishFormRefData = ref<Awaited<ReturnType<typeof getPublishFormReference>> | null>(null);
const savingDraft = ref(false);

const publishJoblyActionsDisabled = computed(
  () =>
    loading.value ||
    saving.value ||
    savingDraft.value ||
    staticLayoutPreview.value ||
    hasJsonErrors.value ||
    !props.vacancyId ||
    props.vacancyId < 1,
);

function onHhTariffSelected(option: HhTariffOption | null) {
  selectedHhPublishTariff.value = option;
}

/** Шаблоны тарифов из локального бандла (без остатков с hh.ru). */
function buildJoblyTariffsFromLocalBundle() {
  if (!joblyPublishPrefill.value) return;
  hhTariffsLoadError.value = null;
  const raw = publishFormRefData.value?.data?.tariff_templates;
  const templates = Array.isArray(raw) ? raw : [];
  hhPublishTariffs.value = templates.map((t, i) => ({
    id: typeof t.id === 'number' ? t.id : i + 1,
    name: String(t.name ?? 'Тариф'),
    property_type: Array.isArray(t.property_type) ? t.property_type : [],
    description: typeof t.description === 'string' ? t.description : '',
    available_publications_count: undefined,
  }));
  selectedHhPublishTariff.value = hhPublishTariffs.value[0] ?? null;
}

function stablePropertyTypeKey(req: unknown): string {
  const arr = Array.isArray(req) ? [...req].map(String).sort() : [];
  return JSON.stringify(arr);
}

function publicationVariantRequiredKey(v: unknown): string {
  if (!v || typeof v !== 'object') return '[]';
  const req = (v as { vacancy_properties?: { required?: unknown } }).vacancy_properties?.required;
  return stablePropertyTypeKey(req);
}

/** Подмешать остатки размещений с hh.ru в локальные шаблоны тарифов. */
function mergePublicationCountsFromHhPayload(hhData: unknown) {
  const variants = (hhData as { publication_variants?: unknown[] })?.publication_variants;
  if (!Array.isArray(variants)) return;
  const countByKey = new Map<string, number>();
  for (const v of variants) {
    const key = publicationVariantRequiredKey(v);
    const n = Number((v as { available_publications_count?: unknown }).available_publications_count ?? 0);
    if (Number.isFinite(n)) countByKey.set(key, n);
  }
  const next = hhPublishTariffs.value.map((row) => {
    const key = stablePropertyTypeKey(row.property_type);
    const c = countByKey.get(key);
    return {
      ...row,
      available_publications_count: c !== undefined ? c : row.available_publications_count ?? 0,
    };
  });
  hhPublishTariffs.value = next;
  const firstWithBalance = next.find((x) => Number(x.available_publications_count ?? 0) > 0);
  if (firstWithBalance) {
    selectedHhPublishTariff.value = firstWithBalance;
  } else if (next.length > 0 && !selectedHhPublishTariff.value) {
    selectedHhPublishTariff.value = next[0];
  }
}

/** Остатки публикаций с hh.ru после отображения окна (без getProfile на фронте). */
async function refreshHhPublicationCounts() {
  if (!joblyPublishPrefill.value) return;
  hhTariffsLoading.value = true;
  hhTariffsLoadError.value = null;
  try {
    const { data, error } = await postAvailablePublicationsCounts();
    if (error) {
      hhTariffsLoadError.value = error;
      return;
    }
    mergePublicationCountsFromHhPayload(data ?? null);
  } catch (e) {
    hhTariffsLoadError.value =
      e instanceof Error ? e.message : 'Не удалось загрузить остатки размещений';
  } finally {
    hhTariffsLoading.value = false;
  }
}

function buildJoblyHhPublishPayload(): DraftDataHh {
  commitHhContactsToDraft();
  commitLanguagesFromForm();
  const merged = { ...draftPayload.value } as DraftDataHh;
  merged.jobly_vacancy_id = props.vacancyId as number;
  if (selectedHhPublishTariff.value?.property_type != null) {
    (merged as Record<string, unknown>).vacancy_properties = {
      property_type: selectedHhPublishTariff.value.property_type,
    };
  }
  return merged;
}

async function publishJoblyVacancyToHh() {
  if (!joblyPublishPrefill.value || staticLayoutPreview.value) return;
  if (publishJoblyActionsDisabled.value) return;
  if (!selectedHhPublishTariff.value && hhPublishTariffs.value.length > 0) {
    errorMessage.value = 'Выберите тариф публикации';
    return;
  }
  saving.value = true;
  errorMessage.value = null;
  try {
    const payload = buildJoblyHhPublishPayload();
    const res = await publishVacancy(payload);
    if (res?.error) {
      errorMessage.value = res.error;
      return;
    }
    emit('jobly-hh-published');
    emit('close');
  } finally {
    saving.value = false;
  }
}

async function saveJoblyVacancyAsHhDraft() {
  if (!joblyPublishPrefill.value || staticLayoutPreview.value) return;
  if (publishJoblyActionsDisabled.value) return;
  savingDraft.value = true;
  errorMessage.value = null;
  try {
    commitHhContactsToDraft();
    commitLanguagesFromForm();
    const merged = { ...draftPayload.value } as DraftDataHh;
    merged.jobly_vacancy_id = props.vacancyId as number;
    delete merged.vacancy_properties;
    delete merged.billing_types;
    const res = await addDraft(merged);
    if (!res) {
      errorMessage.value = 'Нет ответа сервера при сохранении черновика';
      return;
    }
    if (res.errorDraft || res.error) {
      errorMessage.value = (res.errorDraft || res.error) as string;
      return;
    }
    emit('jobly-hh-draft-saved');
    emit('close');
  } finally {
    savingDraft.value = false;
  }
}

type IdName = { id?: string; name?: string };

const loading = ref(false);
const saving = ref(false);
const errorMessage = ref<string | null>(null);
const apiData = ref<HhPublicationOriginalApiData | null>(null);

const draftPayload = ref<Record<string, unknown>>({});
const baselineJson = ref('');
const jsonErrors = ref<Record<string, string>>({});
const formRemountKey = ref(0);

const hhRoleCategories = ref<Array<Record<string, unknown>>>([]);
const cities = ref<Array<{ id: string; name: string }>>([]);

/** Справочники языков — как в InfoTab (карточка вакансии). */
type PopupLangOption = { id: string; value: string; name: string; is_popular?: boolean };
const languagesOptions = ref<PopupLangOption[]>([]);
const languageLevelOptions = ref<PopupLangOption[]>([]);
const languageFormRows = ref<Array<{ language: unknown; languageLevel: unknown }>>([
  { language: null, languageLevel: null },
]);
const languagesAccordionRef = ref(null);

/** Локальная форма блока «Контактная информация» (API: `contacts` + `show_contacts`). */
const hhContactName = ref('');
const hhContactPhone = ref('');
const hhContactEmail = ref('');

type HhContactItem = {
  type?: { id?: string; name?: string } | string;
  name?: string;
  value?: string | { formatted?: string; country?: string; city?: string; number?: string };
};

function contactTypeHaystack(item: HhContactItem): { id: string; name: string } {
  const t = item.type;
  if (typeof t === 'string') {
    const s = t.trim().toLowerCase();
    return { id: s, name: '' };
  }
  if (t && typeof t === 'object') {
    return {
      id: String(t.id ?? '')
        .toLowerCase()
        .trim(),
      name: String(t.name ?? '')
        .toLowerCase()
        .trim(),
    };
  }
  return { id: '', name: '' };
}

function isPhoneContactType(typeId: string, typeName: string): boolean {
  if (['cell', 'work', 'home', 'mobile'].includes(typeId)) return true;
  const h = `${typeId} ${typeName}`;
  return h.includes('phone') || h.includes('тел') || typeId.includes('cell');
}

function formattedFromContactValue(v: HhContactItem['value']): string {
  if (typeof v === 'string') return v.trim();
  if (v && typeof v === 'object') {
    if (typeof v.formatted === 'string' && v.formatted.trim()) return v.formatted.trim();
    const country = v.country != null ? String(v.country).replace(/\D+/g, '') : '';
    const city = v.city != null ? String(v.city).replace(/\D+/g, '') : '';
    const number = v.number != null ? String(v.number).replace(/\D+/g, '') : '';
    const concat = country + city + number;
    return concat.length >= 10 ? concat : '';
  }
  return '';
}

function parseHhContactsFromPayload(contacts: unknown): { name: string; phone: string; email: string } {
  let name = '';
  let phone = '';
  let email = '';

  /** GET /vacancies/{id}: `contacts` — объект с name, email, phones (см. VacancyContactsOutput). */
  if (contacts && typeof contacts === 'object' && !Array.isArray(contacts)) {
    const o = contacts as Record<string, unknown>;
    if (typeof o.name === 'string' && o.name.trim()) name = o.name.trim();
    if (typeof o.email === 'string' && o.email.trim()) email = o.email.trim();
    const phones = o.phones;
    if (Array.isArray(phones)) {
      for (const raw of phones) {
        if (!raw || typeof raw !== 'object') continue;
        const p = raw as Record<string, unknown>;
        if (typeof p.formatted === 'string' && p.formatted.trim()) {
          phone = p.formatted.trim();
          break;
        }
        const country = p.country != null ? String(p.country).replace(/\D+/g, '') : '';
        const city = p.city != null ? String(p.city).replace(/\D+/g, '') : '';
        const numRaw = p.number != null ? String(p.number).trim() : '';
        const numberDigits = numRaw.replace(/\D+/g, '');
        const combined = country + city + numberDigits;
        if (combined.length >= 6) {
          phone = country ? `+${country} (${city}) ${numRaw}`.replace(/\s+/g, ' ').trim() : numRaw;
          break;
        }
      }
    }
    return { name, phone, email };
  }

  /** Редкий/устаревший формат: массив элементов с type/value. */
  if (!Array.isArray(contacts)) return { name, phone, email };
  for (const raw of contacts) {
    if (!raw || typeof raw !== 'object') continue;
    const item = raw as HhContactItem;
    if (typeof item.name === 'string' && item.name.trim() && !name) {
      name = item.name.trim();
    }
    const { id: typeId, name: typeName } = contactTypeHaystack(item);
    const haystack = `${typeId} ${typeName}`;
    const formatted = formattedFromContactValue(item.value);
    if (haystack.includes('email') || typeId === 'email') {
      if (formatted && !email) email = formatted;
    } else if (isPhoneContactType(typeId, typeName)) {
      if (formatted && !phone) phone = formatted;
    }
  }
  return { name, phone, email };
}

/** PUT /vacancies/{id}: `contacts` — объект VacancyContacts (name, email, phones), не массив. */
function buildHhContactsPayload(name: string, phone: string, email: string): Record<string, unknown> | null {
  const n = name.trim();
  const p = phone.trim();
  const e = email.trim();
  if (!n && !p && !e) return null;
  const out: Record<string, unknown> = {};
  if (n) out.name = n;
  if (e) out.email = e;
  if (p) {
    out.phones = [{ formatted: p }];
  }
  return out;
}

function syncHhContactFormFromDraft() {
  const parsed = parseHhContactsFromPayload(draftPayload.value.contacts);
  hhContactName.value = parsed.name;
  hhContactPhone.value = parsed.phone;
  hhContactEmail.value = parsed.email;
}

function commitHhContactsToDraft() {
  const built = buildHhContactsPayload(hhContactName.value, hhContactPhone.value, hhContactEmail.value);
  patchField('contacts', built);
}

function onHhContactName(v: string | number | null) {
  hhContactName.value = v == null ? '' : String(v);
  commitHhContactsToDraft();
}

function onHhContactPhone(v: string | number | null) {
  hhContactPhone.value = v == null ? '' : String(v);
  commitHhContactsToDraft();
}

function onHhContactEmail(v: string | number | null) {
  hhContactEmail.value = v == null ? '' : String(v);
  commitHhContactsToDraft();
}

function clearHhContactName() {
  hhContactName.value = '';
  commitHhContactsToDraft();
}

const languageDropdownOptions = computed(() => {
  const list = languagesOptions.value;
  const popular = list.filter((o) => o.is_popular === true);
  const other = list.filter((o) => !o.is_popular);
  const result: Array<Record<string, unknown>> = [];
  if (popular.length) {
    result.push({ type: 'header', name: 'Популярные' });
    result.push(...popular.map((o) => ({ id: o.id, value: o.value ?? o.id, name: o.name })));
  }
  if (other.length) {
    result.push({ type: 'header', name: 'Другие' });
    result.push(...other.map((o) => ({ id: o.id, value: o.value ?? o.id, name: o.name })));
  }
  return result.length
    ? result
    : list.map((o) => ({ id: o.id, value: o.value ?? o.id, name: o.name }));
});

const languageLevelDropdownOptions = computed(() =>
  Array.isArray(languageLevelOptions.value) ? languageLevelOptions.value : [],
);

function hhPayloadToLanguageRows(raw: unknown): Array<{ language: unknown; languageLevel: unknown }> {
  if (!Array.isArray(raw) || raw.length === 0) {
    return [{ language: null, languageLevel: null }];
  }
  return raw.map((item) => {
    if (!item || typeof item !== 'object') {
      return { language: null, languageLevel: null };
    }
    const o = item as { id?: string; name?: string; level?: { id?: string; name?: string } | string };
    const langVal = o.id ?? o.name ?? null;
    const lev = o.level;
    let levelVal: unknown = null;
    if (lev && typeof lev === 'object') {
      levelVal = (lev as { id?: string }).id ?? lev;
    } else if (typeof lev === 'string') {
      levelVal = lev;
    }
    return { language: langVal, languageLevel: levelVal };
  });
}

const experienceOptionsList = computed(() => {
  const raw = experienceJson as unknown;
  return Array.isArray(raw) ? (raw as IdName[]) : [];
});

const currencyRows = computed(() => {
  const c = currencyFile as unknown;
  return Array.isArray(c) ? c : [];
});

/** Как в AddPublication.vue: MultiSelect требует `value` наряду с `name`. */
const experienceDaysOptions = HH_EXPERIENCE_DAYS.map((d) => ({ ...d, value: d.id }));
const workFormatOptionsMs = HH_WORK_FORMAT.map((f) => ({ ...f, value: f.id }));
const workScheduleOptionsMs = HH_WORK_SCHEDULE_BY_DAYS.map((s) => ({ ...s, value: s.id }));
const workingHoursOptionsMs = HH_WORKING_HOURS.map((h) => ({ ...h, value: h.id }));
const driverLicenseOptionsMs = HH_DRIVER_LICENSE_TYPES.map((l) => ({ ...l, value: l.id }));
const additionalConditionsMultiselectOptions = HH_ADDITIONAL_CONDITIONS.map((c) => ({ ...c, value: c.id }));

const hhEmployeeTypeOptions = [
  { id: 'permanent' as const, name: 'Постоянного' },
  { id: 'temporary' as const, name: 'Временного' },
];
const hhEmploymentOptionsPermanent = [
  { id: 'FULL', name: 'Полная', siteName: 'Полная' },
  { id: 'PART', name: 'Частичная', siteName: 'Частичная' },
  { id: 'FLY_IN_FLY_OUT', name: 'Вахта', siteName: 'Вахта' },
];
const hhEmploymentOptionsTemporary = [
  { id: 'PROJECT', name: 'Проект', siteName: 'Временная' },
  { id: 'SIDE_JOB', name: 'Подработка', siteName: 'Подработка' },
];

const hhEmployeeType = ref<'permanent' | 'temporary'>('permanent');

const hhEmploymentOptionsForType = computed(() =>
  hhEmployeeType.value === 'permanent' ? hhEmploymentOptionsPermanent : hhEmploymentOptionsTemporary,
);

const isHhFlyInFlyOutEmployment = computed(() => {
  const ef = draftPayload.value.employment_form as IdName | undefined;
  return ef?.id === 'FLY_IN_FLY_OUT';
});

watch(
  () => (draftPayload.value.employment_form as IdName | undefined)?.id,
  (id) => {
    if (id == null || id === '') return;
    const isTemp = id === 'PROJECT' || id === 'SIDE_JOB';
    const next: 'permanent' | 'temporary' = isTemp ? 'temporary' : 'permanent';
    if (hhEmployeeType.value !== next) hhEmployeeType.value = next;
  },
  { immediate: true },
);

const isDirty = computed(() => JSON.stringify(draftPayload.value) !== baselineJson.value);

const hasJsonErrors = computed(() => Object.keys(jsonErrors.value).some((k) => jsonErrors.value[k]));

/** Весь каталог ролей hh.ru для поиска в выпадающем списке (не только текущая категория). */
const professionsOptionsForHh = computed(() => {
  const cats = hhRoleCategories.value;
  if (!cats.length) return [];
  return cats.flatMap((c) => (Array.isArray((c as { roles?: IdName[] }).roles) ? (c as { roles: IdName[] }).roles : []));
});

const professionalRoleSingle = computed(() => {
  const roles = draftPayload.value.professional_roles;
  if (!Array.isArray(roles) || !roles[0]) return null;
  return roles[0] as Record<string, unknown>;
});

const hhLocationDisplay = computed(() => {
  const a = draftPayload.value.area as { name?: string } | undefined;
  if (a?.name) return a.name;
  return '';
});

const educationLevelSelected = computed(() => {
  const v = draftPayload.value.education_level as IdName | null | undefined;
  if (!v || v.id == null) return null;
  return HH_EDUCATION_LAVEL.find((o) => String(o.id) === String(v.id)) ?? v;
});

const salaryFromStr = computed(() => {
  const sr = draftPayload.value.salary_range as Record<string, unknown> | undefined;
  const f = sr?.from;
  return f == null ? '' : String(f);
});

const salaryToStr = computed(() => {
  const sr = draftPayload.value.salary_range as Record<string, unknown> | undefined;
  const t = sr?.to;
  return t == null ? '' : String(t);
});

const currencyDisplayValue = computed(() => {
  const sr = draftPayload.value.salary_range as Record<string, unknown> | undefined;
  const cur = sr?.currency;
  const rows = currencyRows.value as Array<{ id?: string; value?: number }>;
  const found = rows.find((c) => c.id === cur);
  return found?.value ?? null;
});

const salaryModeSelected = computed(() => {
  const sr = draftPayload.value.salary_range as Record<string, unknown> | undefined;
  const mode = sr?.mode as IdName | undefined;
  if (!mode?.id) return HH_SALARY_TYPE[0];
  return HH_SALARY_TYPE.find((o) => String(o.id) === String(mode.id)) ?? mode;
});

const salaryFrequencySelected = computed(() => {
  const sr = draftPayload.value.salary_range as Record<string, unknown> | undefined;
  const fr = sr?.frequency as IdName | undefined;
  if (!fr?.id) return HH_SALARY_FREQUENCY[3];
  return HH_SALARY_FREQUENCY.find((o) => String(o.id) === String(fr.id)) ?? fr;
});

const salaryGrossRadio = computed(() => {
  const sr = draftPayload.value.salary_range as Record<string, unknown> | undefined;
  return sr?.gross === true ? 'full-cash' : 'past-cash';
});

const keySkillsTags = computed(() => {
  const ks = draftPayload.value.key_skills;
  if (!Array.isArray(ks)) return [];
  return ks.map((item: unknown) => {
    if (item && typeof item === 'object' && 'name' in item) return item as { name: string };
    return { name: String(item) };
  });
});

const addressHideFlag = computed(() => {
  const a = draftPayload.value.address as { show_metro_only?: boolean } | undefined;
  return !!a?.show_metro_only;
});

function tokenFromCivilLawApiItem(item: unknown): string | null {
  if (item == null) return null;
  if (typeof item === 'string') {
    const s = item.trim();
    return s ? s.toLowerCase() : null;
  }
  if (typeof item === 'object' && item !== null && 'id' in item) {
    const id = (item as { id: unknown }).id;
    if (id == null || id === '') return null;
    return String(id).trim().toLowerCase();
  }
  return null;
}

function matchOformlenieOptionByToken(token: string) {
  const t = token.trim().toLowerCase();
  for (const opt of HH_OFORMLENIE_MULTISELECT_OPTIONS) {
    if (opt.value.toLowerCase() === t || String(opt.id).toLowerCase() === t) {
      return opt;
    }
  }
  return null;
}

/** Модель для MultiSelect (withId): элементы `{ id: value }`, value = labor | internship | gph */
const civilLawContractsModel = computed(() => {
  const raw = draftPayload.value.civil_law_contracts;
  if (!Array.isArray(raw)) return [];
  const out: Array<{ id: string }> = [];
  for (const item of raw) {
    const tok = tokenFromCivilLawApiItem(item);
    if (!tok) continue;
    const opt = matchOformlenieOptionByToken(tok);
    out.push({ id: opt ? opt.value : tok });
  }
  return out;
});

function patchField(key: string, value: unknown) {
  draftPayload.value = { ...draftPayload.value, [key]: value };
  if (jsonErrors.value[key]) {
    const e = { ...jsonErrors.value };
    delete e[key];
    jsonErrors.value = e;
  }
}

function resolveLanguageListMeta(
  v: unknown,
  list: PopupLangOption[],
): { id: string; name: string } | null {
  if (v == null || v === '') return null;
  if (typeof v === 'object' && v !== null && 'id' in v) {
    const o = v as { id?: string; name?: string };
    const hit = list.find((x) => String(x.id) === String(o.id));
    if (hit) return { id: hit.id, name: hit.name };
    if (o.id) return { id: String(o.id), name: o.name ?? String(o.id) };
    return null;
  }
  const key = String(v);
  const hit = list.find((x) => String(x.id) === key || String(x.value) === key);
  return hit ? { id: hit.id, name: hit.name } : { id: key, name: key };
}

function languageRowsToHhPayload(
  rows: Array<{ language: unknown; languageLevel: unknown }>,
): unknown[] {
  const langList = languagesOptions.value;
  const levelList = languageLevelOptions.value;
  const out: unknown[] = [];
  for (const row of rows) {
    if (row.language == null || row.language === '') continue;
    const lm = resolveLanguageListMeta(row.language, langList);
    if (!lm) continue;
    const entry: Record<string, unknown> = { id: lm.id, name: lm.name };
    if (row.languageLevel != null && row.languageLevel !== '') {
      const lev = resolveLanguageListMeta(row.languageLevel, levelList);
      if (lev) {
        entry.level = { id: lev.id, name: lev.name };
      }
    }
    out.push(entry);
  }
  return out;
}

function commitLanguagesFromForm() {
  patchField('languages', languageRowsToHhPayload(languageFormRows.value));
}

function addPopupLanguageRow() {
  languageFormRows.value = [...languageFormRows.value, { language: null, languageLevel: null }];
  commitLanguagesFromForm();
}

function removePopupLanguageRow(index: number) {
  const arr = [...languageFormRows.value];
  arr.splice(index, 1);
  languageFormRows.value = arr.length ? arr : [{ language: null, languageLevel: null }];
  commitLanguagesFromForm();
}

function updatePopupLanguageAt(index: number, value: unknown) {
  const arr = [...languageFormRows.value];
  if (!arr[index]) return;
  arr[index] = { ...arr[index], language: value ?? null };
  languageFormRows.value = arr;
  commitLanguagesFromForm();
}

function updatePopupLanguageLevelAt(index: number, value: unknown) {
  const arr = [...languageFormRows.value];
  if (!arr[index]) return;
  arr[index] = { ...arr[index], languageLevel: value ?? null };
  languageFormRows.value = arr;
  commitLanguagesFromForm();
}

/** Как InfoTab: при первом открытии списка языков подставить Английский + A1 */
function onFirstPopupLanguageDropdownOpen() {
  const arr = languageFormRows.value;
  const first = arr[0];
  if (!first || (!first.language && !first.languageLevel)) {
    const opts = languageDropdownOptions.value;
    const eng = opts.find(
      (o): o is { id: string; value?: string; name: string } =>
        o != null &&
        typeof o === 'object' &&
        (o as { type?: string }).type !== 'header' &&
        (((o as { name?: string }).name === 'Английский') || (o as { id?: string }).id === 'eng'),
    );
    const a1 = languageLevelDropdownOptions.value.find(
      (o) => o.id === 'a1' || (o.name && String(o.name).startsWith('A1')),
    );
    const langVal = eng ? eng.value ?? eng.id : 'eng';
    const levelVal = a1 ? a1.value ?? a1.id : 'a1';
    updatePopupLanguageAt(0, langVal);
    updatePopupLanguageLevelAt(0, levelVal);
  }
}

function ensureSalaryRange() {
  const sr = draftPayload.value.salary_range;
  if (!sr || typeof sr !== 'object') {
    patchField('salary_range', {
      from: null,
      to: null,
      currency: 'RUR',
      gross: true,
      mode: { id: HH_SALARY_TYPE[0].id },
      frequency: { id: HH_SALARY_FREQUENCY[3].id },
    });
  }
}

function onHhEmployeeTypeClick(typeId: 'permanent' | 'temporary') {
  if (hhEmployeeType.value === typeId) return;
  hhEmployeeType.value = typeId;
  const opts = typeId === 'permanent' ? hhEmploymentOptionsPermanent : hhEmploymentOptionsTemporary;
  const cur = draftPayload.value.employment_form as (IdName & { siteName?: string }) | undefined;
  const stillValid = cur?.id != null && opts.some((o) => String(o.id) === String(cur.id));
  if (!stillValid && opts[0]) {
    patchField('employment_form', { ...opts[0] });
  }
}

function isHhEmploymentSelected(opt: { id: string; name: string; siteName?: string }) {
  const v = draftPayload.value.employment_form as (IdName & { siteName?: string }) | undefined;
  if (!v) return false;
  return String(opt.id) === String(v.id) || (!!opt.siteName && opt.siteName === v.siteName);
}

function patchSalaryNested(sub: 'mode' | 'frequency', o: IdName | null) {
  ensureSalaryRange();
  const sr = { ...(draftPayload.value.salary_range as Record<string, unknown>) };
  sr[sub] = o ? { id: o.id } : null;
  patchField('salary_range', sr);
}

function patchSalaryGross(gross: boolean) {
  ensureSalaryRange();
  const sr = { ...(draftPayload.value.salary_range as Record<string, unknown>) };
  sr.gross = gross;
  patchField('salary_range', sr);
}

function onSalaryFrom(s: string | number | null) {
  ensureSalaryRange();
  const sr = { ...(draftPayload.value.salary_range as Record<string, unknown>) };
  const n = s === '' || s === null ? null : Number(s);
  sr.from = n !== null && !Number.isNaN(n) ? n : null;
  patchField('salary_range', sr);
}

function onSalaryTo(s: string | number | null) {
  ensureSalaryRange();
  const sr = { ...(draftPayload.value.salary_range as Record<string, unknown>) };
  const n = s === '' || s === null ? null : Number(s);
  sr.to = n !== null && !Number.isNaN(n) ? n : null;
  patchField('salary_range', sr);
}

function onCurrencyDropdown(v: unknown) {
  ensureSalaryRange();
  const rows = currencyRows.value as Array<{ id?: string; value?: number }>;
  const num = typeof v === 'number' ? v : Number(v);
  const found = rows.find((c) => c.value === num);
  const sr = { ...(draftPayload.value.salary_range as Record<string, unknown>) };
  sr.currency = found?.id ?? 'RUR';
  patchField('salary_range', sr);
}

function onProfessionalRoleUpdate(role: Record<string, unknown> | null) {
  patchField('professional_roles', role ? [role] : []);
}

function isExperienceOptSelected(opt: IdName) {
  const v = draftPayload.value.experience as IdName | undefined;
  if (!v?.id) return false;
  return String(v.id) === String(opt.id);
}

function isScheduleOptSelected(opt: IdName & { value?: string }) {
  const arr = draftPayload.value.work_schedule_by_days as unknown[] | undefined;
  if (!Array.isArray(arr) || !arr[0]) return false;
  const first = arr[0] as IdName & { value?: string };
  return (
    (opt?.id && first?.id && String(opt.id) === String(first.id)) ||
    (!!opt?.value && !!first?.value && String(opt.value) === String(first.value))
  );
}

/** Подписи как во вкладке Jobly: только число для часов, без «часа/часов». */
function hhWorkingHoursChipLabel(opt: IdName & { value?: string }) {
  const id = opt?.id != null ? String(opt.id) : '';
  if (id === 'FLEXIBLE') return 'По договорённости';
  if (id === 'OTHER') return 'Другое';
  const m = /^HOURS_(\d+)$/.exec(id);
  if (m) return m[1];
  return opt?.name ?? '';
}

function isHoursOptSelected(opt: IdName & { value?: string }) {
  const arr = draftPayload.value.working_hours as unknown[] | undefined;
  if (!Array.isArray(arr) || !arr[0]) return false;
  const first = arr[0] as IdName & { value?: string };
  return (
    (opt?.id && first?.id && String(opt.id) === String(first.id)) ||
    (!!opt?.value && !!first?.value && String(opt.value) === String(first.value))
  );
}

function onHhLocationUpdate(cityName: string) {
  if (!cityName || !String(cityName).trim()) {
    patchField('area', {});
    return;
  }
  const trimmed = String(cityName).trim();
  const city = cities.value.find((c) => c?.name && c.name.toLowerCase() === trimmed.toLowerCase());
  if (city) {
    patchField('area', { id: city.id, name: city.name });
  } else {
    patchField('area', { name: trimmed });
  }
}

function onHhWorkAddressUpdate(addr: string) {
  const prev = (draftPayload.value.address as Record<string, unknown>) || {};
  const line = addr?.trim() ?? '';
  if (line) {
    patchField('address', {
      ...prev,
      id: prev.id,
      raw: line,
      show_metro_only: prev.show_metro_only ?? false,
    });
  } else {
    patchField('address', {
      id: prev.id,
      show_metro_only: prev.show_metro_only ?? false,
    });
  }
}

function onAddressHideUpdate(val: boolean) {
  const prev = (draftPayload.value.address as Record<string, unknown>) || {};
  patchField('address', { ...prev, show_metro_only: !!val });
}

function onKeySkillsUpdate(tags: unknown[]) {
  patchField('key_skills', Array.isArray(tags) ? tags : []);
}

function onCivilLawContractsUpdate(selected: unknown[]) {
  const rows = Array.isArray(selected) ? selected : [];
  const enriched = rows
    .map((s) => {
      const idRaw = s && typeof s === 'object' && s !== null && 'id' in s ? (s as { id: unknown }).id : null;
      if (idRaw == null || idRaw === '') return null;
      const tok = String(idRaw).trim().toLowerCase();
      const opt = matchOformlenieOptionByToken(tok);
      return opt ? { id: opt.value, name: opt.name } : { id: String(idRaw) };
    })
    .filter(Boolean) as Array<{ id: string; name?: string }>;
  const hasLabor = enriched.some((x) => x.id === 'labor');
  const hasInternship = enriched.some((x) => x.id === 'internship');
  draftPayload.value = {
    ...draftPayload.value,
    civil_law_contracts: enriched,
    accept_labor_contract: hasLabor,
    internship: hasInternship,
  };
  if (jsonErrors.value.civil_law_contracts) {
    const e = { ...jsonErrors.value };
    delete e.civil_law_contracts;
    jsonErrors.value = e;
  }
}

function asObjectArray(key: string): unknown[] {
  const v = draftPayload.value[key];
  return Array.isArray(v) ? v : [];
}

const additionalConditionsModel = computed(() => {
  const d = draftPayload.value;
  const out: Array<{ id: string; name: string }> = [];
  for (const opt of HH_ADDITIONAL_CONDITIONS) {
    const id = opt.id;
    if (['accept_handicapped', 'accept_incomplete_resumes', 'accept_temporary'].includes(id) && d[id] === true) {
      out.push(opt);
    }
    if (id === 'auto_response') {
      const ar = d.auto_response as Record<string, unknown> | undefined;
      if (ar?.accept_auto_response === true) out.push(opt);
    }
    if (id === 'age_restriction_14') {
      const ag = d.age_restriction as { id?: string } | undefined;
      if (ag?.id === 'AGE_14_PLUS') out.push(opt);
    }
    if (id === 'age_restriction_16') {
      const ag = d.age_restriction as { id?: string } | undefined;
      if (ag?.id === 'AGE_16_PLUS') out.push(opt);
    }
  }
  return out;
});

function onAdditionalConditionsUpdate(selected: Array<{ id: string }>) {
  const d = { ...draftPayload.value };
  const ids = new Set(selected.map((s) => s.id));
  for (const id of ['accept_handicapped', 'accept_incomplete_resumes', 'accept_temporary'] as const) {
    d[id] = ids.has(id);
  }
  if (ids.has('age_restriction_14')) {
    d.age_restriction = { id: 'AGE_14_PLUS' };
  } else if (ids.has('age_restriction_16')) {
    d.age_restriction = { id: 'AGE_16_PLUS' };
  } else if (!ids.has('age_restriction_14') && !ids.has('age_restriction_16')) {
    const hadAge =
      additionalConditionsModel.value.some((x) => x.id === 'age_restriction_14' || x.id === 'age_restriction_16');
    if (hadAge) {
      d.age_restriction = null;
    }
  }
  if (ids.has('auto_response')) {
    d.auto_response = { accept_auto_response: true };
  } else {
    d.auto_response = null;
  }
  draftPayload.value = d;
}

const defaultLanguageOptions = (): PopupLangOption[] => [
  { id: 'eng', value: 'eng', name: 'Английский', is_popular: true },
  { id: 'deu', value: 'deu', name: 'Немецкий', is_popular: true },
  { id: 'fra', value: 'fra', name: 'Французский', is_popular: true },
  { id: 'rus', value: 'rus', name: 'Русский', is_popular: false },
];

const defaultLanguageOptionsFallback = (): PopupLangOption[] => [
  { id: 'eng', value: 'eng', name: 'Английский', is_popular: true },
  { id: 'rus', value: 'rus', name: 'Русский', is_popular: false },
];

const defaultLevelOptions = (): PopupLangOption[] => [
  { id: 'a1', value: 'a1', name: 'A1 — Начальный' },
  { id: 'a2', value: 'a2', name: 'A2 — Элементарный' },
  { id: 'b1', value: 'b1', name: 'B1 — Средний' },
  { id: 'b2', value: 'b2', name: 'B2 — Средне-продвинутый' },
  { id: 'c1', value: 'c1', name: 'C1 — Продвинутый' },
  { id: 'c2', value: 'c2', name: 'C2 — В совершенстве' },
];

/** Один запуск справочников на инстанс попапа (init может вызваться дважды: до/после префилла) */
let hhDictionariesPromise: Promise<void> | null = null;

async function loadHhDictionaries() {
  if (!hhDictionariesPromise) {
    hhDictionariesPromise = (async () => {
      const [bundleRes, areasRes] = await Promise.all([
        getPublishFormReference(),
        getAreas(),
      ]);
      publishFormRefData.value = bundleRes;
      const cats = bundleRes?.data?.professional_roles?.categories;
      if (Array.isArray(cats)) hhRoleCategories.value = cats;
      const areaData = (areasRes as { data?: Array<{ id: string; name: string }> })?.data;
      if (Array.isArray(areaData)) cities.value = dedupeAreasByName(areaData);

      await Promise.all([
        getLanguages()
          .then((res) => {
            const langs = (res as { data?: Array<{ id: string; name: string; is_popular?: boolean }> })?.data;
            languagesOptions.value =
              Array.isArray(langs) && langs.length > 0
                ? langs.map((l) => ({
                    id: l.id,
                    value: l.id,
                    name: l.name,
                    is_popular: !!l.is_popular,
                  }))
                : defaultLanguageOptions();
          })
          .catch(() => {
            languagesOptions.value = defaultLanguageOptionsFallback();
          }),
        getLanguageLevels()
          .then((res) => {
            const levels = (res as { data?: Array<{ id: string; name: string }> })?.data;
            languageLevelOptions.value =
              Array.isArray(levels) && levels.length > 0
                ? levels.map((l) => ({ id: l.id, value: l.id, name: l.name }))
                : defaultLevelOptions();
          })
          .catch(() => {
            languageLevelOptions.value = [{ id: 'a1', value: 'a1', name: 'A1 — Начальный' }];
          }),
      ]);
    })();
  }
  try {
    await hhDictionariesPromise;
  } catch (e) {
    hhDictionariesPromise = null;
    throw e;
  }
}

function clonePayload(raw: unknown): Record<string, unknown> {
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    try {
      return JSON.parse(JSON.stringify(raw)) as Record<string, unknown>;
  } catch {
      return {};
    }
  }
  return {};
}

function resetDraftFromApiData(d: HhPublicationOriginalApiData | null) {
  const fromLayer = draftPayloadFromHhOriginalLayer(d?.original);
  const fromSnapshot = clonePayload(d?.payload_original);
  const payload = { ...fromLayer, ...fromSnapshot };
  normalizeOformlenieFieldsForPopupDraft(payload);
  draftPayload.value = payload;
  baselineJson.value = JSON.stringify(draftPayload.value);
  jsonErrors.value = {};
  formRemountKey.value += 1;
  languageFormRows.value = hhPayloadToLanguageRows(draftPayload.value.languages);
  syncHhContactFormFromDraft();
}

function valueKind(key: string): 'bool' | 'text' | 'json' {
  if (isHhVacancyPayloadServiceKey(key)) return 'json';
  const v = draftPayload.value[key];
  if (typeof v === 'boolean') return 'bool';
  if (v !== null && typeof v === 'object') return 'json';
  if (typeof v === 'number' || typeof v === 'string') return 'text';
  return 'json';
}

function formatReadonlyValue(key: string): string {
  const v = draftPayload.value[key];
  if (v === undefined) return '—';
  try {
    return JSON.stringify(v, null, 2);
  } catch {
    return String(v);
  }
}

function scalarString(key: string): string {
  const v = draftPayload.value[key];
  if (v == null) return '';
  if (typeof v === 'number' || typeof v === 'boolean') return String(v);
  if (typeof v === 'string') return v;
  return '';
}

function setScalarFromString(key: string, s: string) {
  const prev = draftPayload.value[key];
  if (typeof prev === 'number') {
    const next = s.trim() === '' ? null : Number(s);
    patchField(key, next !== null && !Number.isNaN(next) ? next : prev);
    return;
  }
  patchField(key, s);
}

function jsonEditorText(key: string): string {
  const v = draftPayload.value[key];
  if (v === undefined) return '';
  try {
    return JSON.stringify(v, null, 2);
  } catch {
      return '';
  }
}

function onJsonFieldInput(key: string, raw: string) {
  const t = raw.trim();
  if (t === '') {
    patchField(key, null);
    const err = { ...jsonErrors.value };
    delete err[key];
    jsonErrors.value = err;
    return;
  }
  try {
    patchField(key, JSON.parse(raw));
  } catch {
    jsonErrors.value = { ...jsonErrors.value, [key]: 'Некорректный JSON' };
  }
}

function initStaticLayoutPreview() {
  loading.value = false;
  saving.value = false;
  errorMessage.value = null;
  apiData.value = null;
  draftPayload.value = {};
  baselineJson.value = '{}';
  jsonErrors.value = {};
  formRemountKey.value += 1;
  languageFormRows.value = [{ language: null, languageLevel: null }];
  hhContactName.value = '';
  hhContactPhone.value = '';
  hhContactEmail.value = '';
}

async function initJoblyPublishDraft() {
  loading.value = true;
  saving.value = false;
  savingDraft.value = false;
  errorMessage.value = null;
  apiData.value = null;
  try {
    await loadHhDictionaries();
    buildJoblyTariffsFromLocalBundle();
    if (joblyPublishPrefill.value && props.initialHhDraftFromJobly === undefined) {
      return;
    }
    const incoming = props.initialHhDraftFromJobly;
    const payload =
      incoming && typeof incoming === 'object'
        ? (JSON.parse(JSON.stringify(incoming)) as Record<string, unknown>)
        : {};
    normalizeOformlenieFieldsForPopupDraft(payload);
    draftPayload.value = payload;
    baselineJson.value = JSON.stringify(draftPayload.value);
    jsonErrors.value = {};
    formRemountKey.value += 1;
    languageFormRows.value = hhPayloadToLanguageRows(draftPayload.value.languages);
    syncHhContactFormFromDraft();
  } catch (e) {
    errorMessage.value =
      e instanceof Error ? e.message : 'Не удалось загрузить справочники для формы';
    loading.value = false;
    return;
  } finally {
    const stillWaitingPrefill =
      joblyPublishPrefill.value && props.initialHhDraftFromJobly === undefined;
    if (!stillWaitingPrefill) {
      loading.value = false;
    }
  }
  const stillWaiting =
    joblyPublishPrefill.value && props.initialHhDraftFromJobly === undefined;
  if (!stillWaiting && joblyPublishPrefill.value) {
    void nextTick(() => {
      void refreshHhPublicationCounts();
      void getAddresses().catch(() => undefined);
    });
  }
}

async function load(refresh: boolean) {
  if (staticLayoutPreview.value) return;
  if (!props.vacancyId || props.vacancyId < 1) {
    errorMessage.value = 'Некорректный ID вакансии';
    return;
  }
  loading.value = true;
  errorMessage.value = null;
  const dictPromise = loadHhDictionaries();
  const pubPromise = getHhPublicationOriginal(
    props.vacancyId,
    refresh,
    props.suppressSnapshotPersist
  );
  const { data, error } = await pubPromise;
  await dictPromise;
  if (error) {
    apiData.value = null;
    draftPayload.value = {};
    baselineJson.value = '{}';
    languageFormRows.value = [{ language: null, languageLevel: null }];
    hhContactName.value = '';
    hhContactPhone.value = '';
    hhContactEmail.value = '';
    errorMessage.value = error;
    loading.value = false;
    return;
  }
  apiData.value = data;
  resetDraftFromApiData(data);
  await nextTick();
  loading.value = false;
}

async function reloadFromHh() {
  if (staticLayoutPreview.value) return;
  if (joblyPublishPrefill.value && (!props.vacancyId || props.vacancyId < 1)) return;
  await load(true);
}

async function saveToHh() {
  if (staticLayoutPreview.value || !props.vacancyId || props.vacancyId < 1 || hasJsonErrors.value) return;
  saving.value = true;
  errorMessage.value = null;
  const { data, error, errors } = await putHhPublicationOriginal(props.vacancyId, draftPayload.value);
  saving.value = false;
  if (error) {
    errorMessage.value = errors
      ? `${error} (${typeof errors === 'string' ? errors : JSON.stringify(errors).slice(0, 400)})`
      : error;
    return;
  }
  apiData.value = data;
  resetDraftFromApiData(data);
  emit('saved');
}

watch(
  () =>
    [
      props.vacancyId,
      props.suppressSnapshotPersist,
      props.staticLayoutPreview,
      props.joblyPublishPrefill,
      props.initialHhDraftFromJobly,
    ] as const,
  async () => {
    if (props.joblyPublishPrefill) {
      await initJoblyPublishDraft();
      return;
    }
    if (props.staticLayoutPreview) {
      initStaticLayoutPreview();
      return;
    }
    load(false);
  },
  { immediate: true, deep: true }
);
</script>

<style scoped>
.hh-original-popup-scroll {
  scrollbar-width: thin;
  scrollbar-color: #79869a transparent;
}

.hh-original-popup-scroll::-webkit-scrollbar {
  width: 10px;
}

.hh-original-popup-scroll::-webkit-scrollbar-track {
  background: transparent;
  border: none;
  box-shadow: none;
}

/* Отступ ползунка от верха/низа: margin у track в WebKit ненадёжен, задаём через прозрачный border + clip */
.hh-original-popup-scroll::-webkit-scrollbar-thumb {
  border-top: 10px solid transparent;
  border-bottom: 10px solid transparent;
  border-left: 0;
  border-right: 0;
  border-radius: 5px;
  background-color: #79869a;
  background-clip: content-box;
}

.hh-original-popup-scroll::-webkit-scrollbar-thumb:hover {
  background-color: #5a6a7f;
}

.hh-original-popup-scroll::-webkit-scrollbar-corner {
  background: transparent;
}
</style>
