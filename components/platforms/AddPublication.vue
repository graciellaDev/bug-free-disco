<template>
  <div class="container p-0">
    <div class="flex gap-x-[24px]">
      <div class="max-w-[100%] flex-grow bg-white rounded-fifteen">
        <template v-if="currentPlatform === 'hh'">
          <p class="text-space text-xl font-semibold mb-2">
            {{ HH_PUBLICATION_SECTIONS.basic.titleRu }}
          </p>
          <p class="text-xs text-bali mb-8 leading-normal">
            {{ HH_PUBLICATION_SECTIONS.basic.subtitleRu }}
          </p>
        </template>
        <p v-else class="text-space text-xl font-semibold mb-8">
          Основная информация
        </p>
        <div class="w-full justify-between flex gap-25px mb-6">
          <div id="name" class="w-full anchor">
            <p class="text-sm font-medium mb-4 leading-normal"
              :class="validFields.name.status === false ? 'text-red-custom' : 'text-space'">
              <span class="text-red-custom">*</span>
              <template v-if="currentPlatform === 'hh'">Название</template>
              <template v-else>Название должности</template>
            </p>
            <MyInput placeholder="Например, Менеджер по продажам" v-model="data.name"
              @update:model-value="($event) => updateValidField('name', $event.trim() !== '')" />
          </div>
          <div v-if="currentPlatform !== 'hh'" class="w-full">
            <p class="text-sm font-medium mb-4 leading-normal text-space">
              Код вакансии
            </p>
            <MyInput placeholder="Код вакансии" v-model="data.code" />
          </div>
        </div>
        <!-- SuperJob: одно поле «Профессиональная сфера» (как в форме редактирования вакансии в БД), маппинг с catalogues сохранён -->
        <div v-if="isSuperjobPlatform" id="professional_roles" class="w-full mb-6 anchor">
          <div class="flex items-center gap-1 mb-3.5">
            <p class="text-sm font-medium leading-normal"
              :class="validFields.professional_roles.status === false ? 'text-red-custom' : 'text-space'">
              <span class="text-red-custom">*</span>
              Профессиональная сфера
            </p>
          </div>
          <ClientOnly>
            <SpecializationSelector :options="professionsOptions" :full-catalog="superjobCatalogForSelector"
              :model-value="data.professional_roles?.[0] ?? null" placeholder="Выберите из списка"
              :error="validFields.professional_roles.status === false"
              @update:model-value="handleSuperjobProfessionalSphereUpdate" />
            <template #fallback>
              <div class="w-full h-10 rounded-ten border border-athens bg-athens-gray animate-pulse" />
            </template>
          </ClientOnly>
        </div>
        <div v-else-if="currentPlatform === 'hh'" id="professional_roles" class="w-full mb-6 anchor">
          <div class="flex items-center gap-1 mb-3.5">
            <p class="text-sm font-medium leading-normal"
              :class="validFields.professional_roles.status === false ? 'text-red-custom' : 'text-space'">
              <span class="text-red-custom">*</span>
              Специализация
            </p>
            <span class="inline-flex items-center cursor-help">
              <svg-icon name="question" width="16" height="16" />
              <MyTooltip text="Должность или направление деятельности, на которое подбираете кандидата" />
            </span>
          </div>
          <ClientOnly>
            <SpecializationSelector :options="professionsOptions" :full-catalog="currectRole"
              :model-value="data.professional_roles?.[0] ?? null"
              placeholder="Выберите из списка"
              :error="validFields.professional_roles.status === false"
              @update:model-value="handleHhSpecializationUpdate" />
            <template #fallback>
              <div class="w-full h-10 rounded-ten border border-athens bg-athens-gray animate-pulse" />
            </template>
          </ClientOnly>
          <p v-if="validFields.professional_roles.status === false" class="text-xs text-red-500 mt-1">Выберите, чтобы продолжить</p>
        </div>
        <div v-else class="w-full justify-between flex gap-25px mb-6">
          <div class="w-full">
            <p class="text-sm font-medium mb-4 leading-normal text-space">
              <span class="text-red-custom">*</span>
              Отрасль компании
            </p>
            <DropDownRoles :options="currectRole" :selected="data.industry ?? ''"
              @update:model-value="handleIndustryChange">
            </DropDownRoles>
          </div>
          <div id="professional_roles" class="w-full anchor">
            <p class="text-sm font-medium mb-4 leading-normal"
              :class="validFields.professional_roles.status === false ? 'text-red-custom' : 'text-space'">
              <span class="text-red-custom">*</span>
              Выберите специализацию
            </p>
            <DropDownRoles :options="professionsOptions" :selected="data.professional_roles[0]"
              @update:model-value="($event) => handleIdUpdate('professional_roles', $event)"></DropDownRoles>
          </div>
        </div>
        <div class="w-full justify-between flex gap-25px mb-6">
          <div class="w-full anchor">
            <div class="flex items-center gap-1 mb-4">
              <p class="text-sm font-medium leading-normal"
                :class="validFields.experience.status === false ? 'text-red-custom' : 'text-space'">
                <span class="text-red-custom">*</span>
                <template v-if="currentPlatform === 'hh'">Опыт</template>
                <template v-else>Опыт работы</template>
              </p>
              <span v-if="currentPlatform === 'hh' || hideScheduleBlockForSuperjob" class="inline-flex items-center cursor-help">
                <svg-icon name="question" width="16" height="16" />
                <MyTooltip text="Для кандидатов с опытом до года подходит вариант «Нет опыта»" />
              </span>
            </div>
            <template v-if="currentPlatform === 'hh' || hideScheduleBlockForSuperjob">
              <div class="flex w-full gap-2">
                <button v-for="opt in experienceOptions" :key="opt.id" type="button"
                  class="flex-1 px-4 py-2.5 text-sm rounded-ten border transition-colors"
                  :class="isExperienceSelectedForSuperjob(opt)
                    ? 'bg-zumthor border-dodger text-dodger font-normal'
                    : 'bg-athens-gray border-athens text-bali font-normal hover:bg-dodger hover:border-transparent hover:text-white'" @click="handleIdUpdate('experience', opt)">
                  {{ getExperienceButtonLabel(opt) }}
                </button>
              </div>
            </template>
            <DropDownTypes v-else :options=experienceOptions
              :selected="findValue(experienceOptions, globCurrentVacancy?.experience)" v-model="data.experience"
              @update:model-value="($event) => handleIdUpdate('experience', $event)"></DropDownTypes>
          </div>
        </div>
        <div class="mb-25px mt-25px border-t"></div>
        <template v-if="hideScheduleBlockForSuperjob">
          <p class="text-space text-xl font-semibold mb-8">
            Условия занятости
          </p>
          <div id="superjob_employment_conditions" class="w-full anchor flex flex-wrap gap-2">
            <button v-for="opt in SUPERJOB_EMPLOYMENT_CONDITIONS" :key="opt.id" type="button"
              class="px-4 py-2.5 text-sm rounded-ten border transition-colors"
              :class="(data.superjob_employment_conditions || []).includes(opt.id)
                ? 'bg-dodger border-dodger text-white font-normal'
                : 'bg-athens-gray border-athens text-bali font-normal hover:bg-zumthor hover:border-dodger hover:text-dodger'" @click="toggleSuperjobEmploymentCondition(opt.id)">
              {{ opt.name }}
            </button>
          </div>
          <div class="mb-25px mt-25px border-t"></div>
        </template>
        <template v-else>
          <template v-if="currentPlatform === 'hh'">
            <p class="text-space text-xl font-semibold mb-2">
              {{ HH_PUBLICATION_SECTIONS.conditions.titleRu }}
            </p>
            <p class="text-xs text-bali mb-8 leading-normal">
              {{ HH_PUBLICATION_SECTIONS.conditions.subtitleRu }}
            </p>
          </template>
          <p v-else class="text-space text-xl font-semibold mb-8">
            Условия работы
          </p>
          <template v-if="currentPlatform === 'hh'">
            <div class="w-full mb-6">
              <p class="text-sm font-medium text-space mb-3.5">
                Какого сотрудника ищите?
              </p>
              <div class="flex w-full gap-2">
                <button v-for="opt in hhEmployeeTypeOptions" :key="opt.id" type="button"
                  class="flex-1 px-4 py-2.5 text-sm rounded-ten border transition-colors"
                  :class="hhEmployeeType === opt.id
                    ? 'bg-zumthor border-dodger text-dodger font-normal'
                    : 'bg-athens-gray border-athens text-bali font-normal hover:bg-dodger hover:border-transparent hover:text-white'"
                  @click="hhEmployeeType = opt.id">
                  {{ opt.name }}
                </button>
              </div>
            </div>
            <div class="w-full mb-6">
              <p class="text-sm font-medium text-space mb-3.5">
                <span class="text-red-custom">*</span>
                Тип занятости
              </p>
              <div class="flex w-full gap-2">
                <button v-for="opt in hhEmploymentOptionsForType" :key="opt.id" type="button"
                  class="flex-1 px-4 py-2.5 text-sm rounded-ten border transition-colors"
                  :class="isHhEmploymentSelected(opt)
                    ? 'bg-zumthor border-dodger text-dodger font-normal'
                    : 'bg-athens-gray border-athens text-bali font-normal hover:bg-dodger hover:border-transparent hover:text-white'"
                  @click="handleIdUpdate('employment_form', opt)">
                  {{ opt.name }}
                </button>
              </div>
            </div>
            <div class="flex gap-25px mb-6">
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium text-space mb-3.5">
                  Формат работы
                </p>
                <MultiSelect :options="workFormatOptions" v-model="data.work_format" defaultValue="Выберите формат работы"
                  :withId="true" />
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium text-space mb-3.5">
                  Оформление сотрудника
                </p>
                <MultiSelect :options="hhOformlenieOptions" v-model="data.oformlenie" defaultValue="Выберите оформление"
                  :withId="true" />
              </div>
            </div>
          </template>
          <template v-else>
            <div class="w-full justify-between flex gap-25px mb-6">
              <div id="employment_form" class="w-full anchor">
                <p class="text-sm font-medium mb-4 leading-normal"
                  :class="validFields.employment_form.status === false ? 'text-red-custom' : 'text-space'">
                  <span class="text-red-custom">*</span>
                  Тип занятости
                </p>
                <DropDownTypes :options=employmentTypesOptions
                  :selected="findValue(employmentTypesOptions, globCurrentVacancy?.employment) || employmentTypesOptions[0]"
                  v-model="data.employment_form"
                  @update:model-value="($event) => handleIdUpdate('employment_form', $event)"></DropDownTypes>
              </div>
              <div class="w-full">
                <template v-if="data.employment_form?.id === 'FLY_IN_FLY_OUT'">
                  <p class="text-sm font-medium mb-4 leading-normal text-space">
                    Количество смен
                  </p>
                  <MultiSelect :options="experienceDaysOptions" :withId="true" v-model="data.fly_in_fly_out_duration"
                    defaultValue="Выберите количество смен"></MultiSelect>
                </template>
              </div>
            </div>
            <div class="w-full justify-between flex gap-25px mb-6">
              <div class="w-full">
                <p class="text-sm font-medium mb-4 leading-normal text-space">
                  Формат работы
                </p>
                <MultiSelect :options="workFormatOptions" v-model="data.work_format" defaultValue="Выберите формат работы"
                  :withId="true" />
              </div>
            </div>
          </template>
        </template>
        <template v-if="!hideScheduleBlockForSuperjob">
          <div class="mb-25px mt-25px border-t"></div>
          <p class="text-space text-xl font-semibold mb-8">
            График и часы работы
          </p>
          <template v-if="currentPlatform === 'hh'">
            <div class="flex gap-25px mb-6 items-start">
              <div class="flex-1 min-w-0 flex flex-wrap gap-2 self-start" data-error-field="work_schedule_by_days">
                <div class="w-full flex items-center gap-1 mb-3.5">
                  <p class="text-sm font-medium text-space">
                    <span class="text-red-custom">*</span>
                    График работы
                  </p>
                  <span class="inline-flex items-center cursor-help">
                    <svg-icon name="question" width="16" height="16" />
                    <MyTooltip text="Распределение рабочих дней и выходных — например, пятидневка (5/2), двухсменный график (2/2) или сменный." />
                  </span>
                </div>
                <button
                  v-for="opt in workScheduleOptions" :key="opt.id"
                  type="button"
                  class="px-4 py-2.5 text-sm rounded-ten border transition-colors"
                  :class="isHhScheduleSelected(opt)
                    ? 'bg-zumthor border-dodger text-dodger font-normal'
                    : 'bg-athens-gray border-athens text-bali font-normal hover:bg-dodger hover:border-transparent hover:text-white'"
                  @click="handleHhScheduleSelect(opt)">
                  {{ opt.name }}
                </button>
              </div>
              <div class="flex-1 min-w-0 flex flex-wrap gap-2 self-start" data-error-field="working_hours">
                <p class="w-full text-sm font-medium text-space mb-3.5">
                  <span class="text-red-custom">*</span>
                  Рабочие часы в день
                </p>
                <button
                  v-for="opt in workingHoursOptions" :key="opt.id"
                  type="button"
                  class="px-4 py-2.5 text-sm rounded-ten border transition-colors"
                  :class="isHhWorkHoursSelected(opt)
                    ? 'bg-zumthor border-dodger text-dodger font-normal'
                    : 'bg-athens-gray border-athens text-bali font-normal hover:bg-dodger hover:border-transparent hover:text-white'"
                  @click="handleHhWorkHoursSelect(opt)">
                  {{ opt.name }}
                </button>
              </div>
            </div>
          </template>
          <template v-else>
            <div class="w-full justify-between flex gap-25px mb-6">
              <div id="work_schedule_by_days" class="w-full anchor">
                <p class="text-sm font-medium mb-4 leading-normal"
                  :class="validFields.work_schedule_by_days.status === false ? 'text-red-custom' : 'text-space'">
                  <span class="text-red-custom">*</span>
                  График работы
                </p>
                <MultiSelect :options="workScheduleOptions" v-model="data.work_schedule_by_days"
                  defaultValue="Выберите график работы" :withId="true"></MultiSelect>
              </div>
              <div id="working_hours" class="w-full anchor">
                <p class="text-sm font-medium mb-4 leading-normal"
                  :class="validFields.working_hours.status === false ? 'text-red-custom' : 'text-space'">
                  <span class="text-red-custom">*</span>
                  Рабочие часы в день
                </p>
                <MultiSelect :options="workingHoursOptions" v-model="data.working_hours"
                  defaultValue="Выберите рабочие часы" :withId="true"></MultiSelect>
              </div>
            </div>
          </template>
          <div class="w-full justify-between flex gap-25px mb-6">
            <div class="w-full">
              <MyCheckbox :id="'evening-night-shifts'" :label="'Есть вечерние или ночные смены'"
                v-model="data.has_evening_night_shifts" />
            </div>
          </div>
          <div class="mb-25px mt-25px border-t"></div>
        </template>
        <p class="text-space text-xl font-semibold mb-8">
          Город публикации и адрес работы
        </p>
        <template v-if="currentPlatform === 'hh'">
          <div class="w-full mb-6" data-error-field="area">
            <p class="text-sm font-medium text-space mb-3.5">
              <span class="text-red-custom">*</span>
              Город публикации
            </p>
            <ClientOnly>
              <GeoInput
                class="mb-2.5"
                :model-value="hhLocationDisplay"
                :error="validFields.area.status === false"
                :use-api-cities="true"
                placeholder="Например, Москва, Санкт-Петербург"
                @update:model-value="onHhLocationUpdate"
                @blur="onHhLocationBlur"
              />
              <template #fallback>
                <div class="w-full h-11 rounded-ten border border-athens bg-athens-gray animate-pulse" />
              </template>
            </ClientOnly>
            <p v-if="validFields.area.status === false" class="text-xs text-red-500 mt-1">
              Выберите город, где опубликовать вакансию
            </p>
          </div>
          <div class="w-full mb-6" data-error-field="address">
            <p class="text-sm font-medium text-space mb-3.5">
              <span class="text-red-custom">*</span>
              Адрес работы сотрудника
            </p>
            <ClientOnly>
              <AddressMapInput
                :model-value="data.workAddress || ''"
                :hide-address="data.hideWorkAddress"
                :error="validFields.address.status === false"
                placeholder="Введите адрес, метро или название компании"
                @update:model-value="onHhWorkAddressUpdate"
                @update:hide-address="onHhHideWorkAddressUpdate"
              />
              <template #fallback>
                <div class="w-full h-11 rounded-ten border border-athens bg-athens-gray animate-pulse mb-3" />
                <div class="w-full h-[300px] rounded-ten border border-athens bg-athens-gray animate-pulse" />
              </template>
            </ClientOnly>
            <p v-if="validFields.address.status === false" class="text-xs text-red-500 mt-1">
              Укажите адрес работы сотрудника
            </p>
          </div>
        </template>
        <template v-else>
          <div class="w-full justify-between flex gap-25px mb-6">
            <div id="areas" class="w-full anchor">
              <p class="text-sm font-medium mb-4 leading-normal"
                :class="validFields.area.status === false ? 'text-red-custom' : 'text-space'">
                <span class="text-red-custom">*</span>
                Город публикации
              </p>
              <CityAutocomplete :options="citiesOptions" :model-value="data.area?.id || null"
                @update:model-value="($event) => handleIdUpdate('area', $event)"
                placeholder="Например, Санкт-Петербург" />
            </div>
            <div id="address" class="w-full anchor">
              <p class="text-sm font-medium mb-4 leading-normal"
                :class="validFields.address.status === false ? 'text-red-custom' : 'text-space'">
                <span class="text-red-custom">*</span>
                Город размещения
              </p>
              <CityAutocomplete :options="addresses" :isOpen="true" :model-value="data.address"
                @update:model-value="($event) => handleIdUpdate('address', $event)"
                placeholder="Например, Санкт-Петербург" />
            </div>
          </div>
          <div class="w-full justify-between flex gap-25px mb-6">
            <div class="w-full">
              <MyCheckbox :id="'show_metro_only'" :label="'Показывать только станцию метро в вакансии'"
                v-model="data.address.show_metro_only" />
            </div>
          </div>
        </template>
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
                  <MyInput placeholder="От" type="Number" v-model="data.salary_range.from"
                    @update:model-value="($event) => handleSalaryRangeUpdate('from', $event)" />
                  <MyInput placeholder="До" type="Number" v-model="data.salary_range.to"
                    @update:model-value="($event) => handleSalaryRangeUpdate('to', $event)" />
                </div>
              </div>
              <div class="w-full">
                <p class="text-sm font-medium text-space mb-3.5">Валюта</p>
                <MyDropdown :options="ArrayCurrency"
                  :model-value="ArrayCurrency.find(c => c.id === data.salary_range.currency)?.value"
                  @update:model-value="($event) => handleSalaryRangeUpdate('currency', ArrayCurrency.find(c => c.value === $event))" />
              </div>
              <div class="w-full">
                <DropDownTypes :options=HH_SALARY_TYPE :selected="HH_SALARY_TYPE[0]" v-model="data.salary_range.mode"
                  @update:model-value="($event) => handleSalaryRangeUpdate('mode', $event)">
                </DropDownTypes>
              </div>
            </div>
            <div class="w-full  items-end justify-between flex mb-6 gap-25px">
              <RadioGroup default-value="full-cash" class="w-full flex gap-[18px]"
                :model-value="data.salary_range?.gross === true ? 'full-cash' : 'past-cash'"
                @update:model-value="(value) => data.salary_range.gross = value === 'full-cash'">
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
                <DropDownTypes :options=HH_SALARY_FREQUENCY :selected="HH_SALARY_FREQUENCY[3]"
                  v-model="data.salary_range.frequency"
                  @update:model-value="($event) => handleSalaryRangeUpdate('frequency', $event)">
                </DropDownTypes>
              </div>
              <div class="w-full"></div>
            </div>
          </div>
        </div>
        <div class="mb-25px mt-25px border-t"></div>
        <template v-if="currentPlatform === 'hh'">
          <p class="text-space text-xl font-semibold mb-8">
            Описание и навыки
          </p>
        </template>
        <p v-else class="text-space text-xl font-semibold mb-8">
          Описание вакансии
        </p>
        <div id="description" class="w-full anchor">
          <p class="text-sm font-medium mb-3.5"
            :class="validFields.description.status === false ? 'text-red-custom' : 'text-space'">
            <span class="text-red-custom">*</span>
            Текст вакансии
          </p>
          <GenerateButton></GenerateButton>
          <div class="mt-15px mb-25px">
            <TiptapEditor v-model="data.description" class="mb-15px"
              @update:model-value="($event) => updateDescriptionValidation($event)" />
            <p class="text-xs font-normal" :class="descriptionLength < 200 ? 'text-red-custom' : 'text-bali'">
              Минимум 200 символов. Максимум 700 символов. Использовано {{ descriptionLength }} символов.
              <span v-if="descriptionLength < 200" class="text-red-custom font-medium">
                (Требуется еще {{ 200 - descriptionLength }} символов)
              </span>
            </p>
          </div>
          <div class="flex gap-25px">
            <div class="w-full">
              <p class="text-sm font-medium text-space mb-13px">
                <template v-if="currentPlatform === 'hh'">Ключевые навыки</template>
                <template v-else>Навыки</template>
              </p>
              <TagSelect :options="[]" :model-value="data.key_skills ? data.key_skills : []" :is-new="true"
                :placeholder="'Например, Активный'" @enter="$event => updateSkills($event)"
                @delete="$event => updateSkills($event)" />
            </div>
            <div class="w-full">
              <p class="text-sm font-medium text-space mb-13px">
                Водительские права
              </p>
              <MultiSelect :options="driverLicenseOptions" v-model="data.driver_license_types"
                defaultValue="Сделайте выбор" :withId="true"></MultiSelect>
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
            <!-- SuperJob: чекбоксы «Готовы рассмотреть» (как на платформе SuperJob) -->
            <template v-if="isSuperjobPlatform">
              <div class="flex flex-col gap-3">
                <label v-for="opt in SUPERJOB_READY_TO_CONSIDER" :key="opt.id"
                  class="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" :checked="(data.superjob_ready_to_consider || []).includes(opt.id)"
                    @change="toggleSuperjobReadyConsider(opt.id, $event.target.checked)"
                    class="rounded border-gray-300" />
                  <span class="text-space">{{ opt.name }}</span>
                </label>
              </div>
              <p class="text-xs text-gray-500 mt-2">На платформе SuperJob отображается как «Готовы рассмотреть» (+15% к
                откликам)</p>
            </template>
            <MultiSelect v-else :options="additionalConditionsOptions" defaultValue="Сделайте выбор" :withId="true"
              v-model="data.additional_conditions" />
          </div>
          <div class="w-full flex justify-between gap-25px mb-6">
            <div class="w-full">
              <p class="text-sm font-medium mb-4 leading-normal text-space">
                Нужно ли приложить к отклику сопроводительное письмо?
              </p>
              <DropDownRoles :options="[
                { id: '1', name: 'Да' },
                { id: '0', name: 'Нет' }
              ]"
                :selected="data.response_letter_required === true ? { id: '1', name: 'Да' } : data.response_letter_required === false ? { id: '0', name: 'Нет' } : null"
                @update:model-value="($event) => data.response_letter_required = $event?.id === '1'"></DropDownRoles>
            </div>
            <div class="w-full"></div>
          </div>
          <div class="w-full justify-between flex gap-25px mb-25px">
            <div class="w-full">
              <p class="text-sm font-medium mb-4 leading-normal text-space">
                Контактное лицо
              </p>
              <MyInput placeholder="Ответственный" type="String" />
            </div>
            <div class="w-full"></div>
          </div>
          <div class="w-full flex justify-between gap-25px mb-10">
            <div class="w-full">
              <p class="text-sm font-medium mb-4 leading-normal text-space">
                Номер телефона
              </p>
              <PhoneInput :model-value="null" />
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
              <MyCheckbox id="show-contacts" label="Сохранить в черновике" v-model="isDraft"
                @update:model-value="$event => (isDraft = $event)" />
            </div>
          </div>
          <div class="w-full justify-start flex gap-25px mb-6">
            <template v-if="currentPlatform === 'hh' && tariffsOptions.length > 0">
              <DropDownTypes :options="tariffsOptions" :selected="tariffsOptions[0]" placeholder="Выберите тариф"
                @update:model-value="($event) => handleTariffUpdate($event)"></DropDownTypes>
            </template>
            <template v-else-if="currentPlatform === 'hh'">
              <DropDownTypes :options="HH_BILLING_TYPES" :selected="data.billing_types" placeholder="Выберите тариф"
                v-model="data.billing_types"></DropDownTypes>
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
            <UiButton variant="semiaction" size="semiaction" class="text-space" @click="emit('cancel')">
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
                  <a :href="`#${key}`" @click.prevent="scrollToElement(key)"
                    class="text-red-custom hover:text-red-custom-hover underline cursor-pointer">
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
import GeoInput from '~/components/custom/GeoInput.vue'
import AddressMapInput from '~/components/custom/AddressMapInput.vue'
import SpecializationSelector from '~/components/custom/SpecializationSelector.vue'
import MyTooltip from '~/components/custom/MyTooltip.vue'
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
  SUPERJOB_READY_TO_CONSIDER,
  SUPERJOB_EMPLOYMENT_CONDITIONS,
  HH_BILLING_TYPES,
} from '@/src/constants'
import { HH_OFORMLENIE_MULTISELECT_OPTIONS } from '@/utils/hhVacancyPayloadConstants'
import experience from '~/src/data/experience.json'
import { inject, watch, computed, defineProps, nextTick, onMounted } from 'vue'

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

const emit = defineEmits(['saved', 'cancel', 'form-ready'])
const isEditingMode = computed(() => props.editingVacancy != null)

import {
  getProfile as profileHh,
  getAvailableTypes as typesHh,
  addDraft as addDraftHh,
  publishVacancy as publishVacancyToHh,
  getRoles as getRolesHh,
  getAreas as getAreasHh,
  getAddresses as getAddressesHh,
  getAvailablePublications as getAvailablePublicationsHh,
  getPublication as getHhPublicationById,
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
import { updatePublication as updatePublicationSuperjob, getVacancy as getSuperjobVacancy, getCatalogues as getSuperjobCatalogues, getTowns as getSuperjobTowns, publishVacancy as publishVacancyToSuperjob } from '@/utils/superjobAccount'
import { mapVacancyToSuperjobPayload } from '@/utils/mapVacancyToSuperjob'
import { getVacancy as getVacancyById, resolveDriverNamesToDbIds, getVacancyFields, buildDriverDbIdToNameMap } from '@/utils/getVacancies';
import { useRoute } from 'vue-router'
import { fetchVacancyUpdate } from '@/utils/applicationUpdate'
import { mapVacancyToUpdateFormat } from '@/utils/mapVacancyToUpdateFormat'
import { HH_PUBLICATION_SECTIONS } from '@/utils/hhPublicationFieldRegistry'
import { applyJoblyVacancyToHhPublicationFormData } from '@/utils/mapJoblyVacancyToHhPublicationForm'

/** Возможные сетевые запросы при инициализации — перечень: `utils/addPublicationRemoteLoads.ts` (`ADD_PUBLICATION_REMOTE_LOADS`). */

/** Уникальные города по названию (первое вхождение) — для чистого списка без дублей */
function dedupeAreasByName(arr) {
  if (!Array.isArray(arr)) return []
  const seen = new Set()
  return arr.filter((c) => {
    const name = (c && c.name != null) ? String(c.name).trim() : ''
    if (!name || seen.has(name)) return false
    seen.add(name)
    return true
  })
}

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

/** Нормализация имени платформы: hh.ru -> hh, superjob.ru -> superjob и т.д. */
function normalizePlatformName(name) {
  if (!name) return null
  if (name === 'hh.ru') return 'hh'
  if (name === 'avito.ru') return 'avito'
  if (name === 'rabota.ru') return 'rabota'
  if (name === 'superjob.ru' || name === 'superjob') return 'superjob'
  return name
}

/** Карточка «Опубликовать» на вкладке размещений — не блокируем рендер запросами к HH; данные вакансии из provide. */
const isNewPublicationFromCard = Boolean(props.selectedPlatform && !props.editingVacancy?.id)
const isNewHhPublicationFromCard =
  isNewPublicationFromCard && normalizePlatformName(props.selectedPlatform) === 'hh'

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
  'experience': { 'field': 'experience', 'values': experience },
  'employment_form': { 'field': 'employment', 'values': HH_EMPLOYMENT_TYPES },
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

// Подписи кнопок опыта для формы SuperJob (как в InfoTab)
const experienceButtonLabels = { noExperience: 'Нет опыта', between1And3: '1-3 года', between3And6: '3-6 лет', moreThan6: 'От 6 лет' }
function getExperienceButtonLabel(opt) {
  return experienceButtonLabels[opt?.id] ?? opt?.name ?? ''
}
function isExperienceSelectedForSuperjob(opt) {
  const v = data.value.experience
  if (!v && opt?.id === 'noExperience') return true
  if (!v) return false
  if (typeof v === 'object') {
    return String(opt?.id) === String(v?.id) || opt?.value === v?.value
  }
  return String(opt?.id) === String(v) || opt?.value === v || opt?.name === v || String(opt?.value) === String(v)
}

function toggleSuperjobEmploymentCondition(id) {
  const arr = [...(data.value.superjob_employment_conditions || [])]
  const idx = arr.indexOf(id)
  if (idx >= 0) arr.splice(idx, 1)
  else arr.push(id)
  data.value.superjob_employment_conditions = arr
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
      // Синхронизация с SuperJob: id выбранной специализации уходит в catalogues при обновлении
      if (isSuperjobPlatform.value && (value?.id != null || value?.key != null)) {
        data.value.superjob_catalogue_id = Number(value?.id ?? value?.key) || (value?.id ?? value?.key)
      }
    } else {
      data.value.professional_roles = [null]
      if (isSuperjobPlatform.value) data.value.superjob_catalogue_id = null
    }
  } else {
    data.value[property] = value ? { id: value.id } : null
  }
}

// hh.ru: выбор специализации (как на нашей платформе — единое поле SpecializationSelector)
function handleHhSpecializationUpdate(value) {
  if (!value) {
    data.value.industry = null
    data.value.professional_roles = [null]
    updateValidField('professional_roles', false)
    return
  }
  const catalog = currectRole.value
  if (Array.isArray(catalog)) {
    const industry = catalog.find((cat) => {
      const roles = cat?.roles && Array.isArray(cat.roles) ? cat.roles : []
      return roles.some(
        (r) =>
          (value.id != null && r.id != null && String(r.id) === String(value.id)) ||
          (value.key != null && r.key != null && String(r.key) === String(value.key)) ||
          (value.name && r.name && r.name === value.name)
      )
    })
    if (industry) {
      data.value.industry = { ...industry }
    }
  }
  data.value.professional_roles = [value]
  updateValidField('professional_roles', true)
}

// SuperJob: выбор профессиональной сферы (отрасль + специализация в одном поле), маппинг в superjob_catalogue_id сохраняется
function handleSuperjobProfessionalSphereUpdate(value) {
  if (!value) {
    data.value.industry = null
    data.value.professional_roles = [null]
    data.value.superjob_catalogue_id = null
    updateValidField('professional_roles', false)
    return
  }
  const catalog = currectRole.value
  if (Array.isArray(catalog)) {
    const industry = catalog.find((cat) => {
      const roles = cat?.roles && Array.isArray(cat.roles) ? cat.roles : []
      return roles.some(
        (r) =>
          (value.id != null && r.id != null && String(r.id) === String(value.id)) ||
          (value.key != null && r.key != null && String(r.key) === String(value.key)) ||
          (value.name && r.name && r.name === value.name)
      )
    })
    if (industry) {
      data.value.industry = { ...industry }
    }
  }
  data.value.professional_roles = [value]
  const rawId = value?.id ?? value?.key
  data.value.superjob_catalogue_id = rawId != null ? (Number(rawId) || rawId) : null
  updateValidField('professional_roles', true)
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
    if (isSuperjobPlatform.value) {
      data.value.superjob_catalogue_id = selectedIndustry.roles[0]?.id ?? selectedIndustry.roles[0]?.key ?? null
    }
  } else {
    data.value.professional_roles = [null]
    if (isSuperjobPlatform.value) data.value.superjob_catalogue_id = null
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
    data.value.vacancy_properties = { property_type: tariff.property_type }
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
data.value.oformlenie = []
data.value.fly_in_fly_out_duration = []
data.value.work_schedule_by_days = []
data.value.schedule = []
data.value.education_level = null
data.value.driver_license_types = []
data.value.has_evening_night_shifts = false
data.value.area = {}
data.value.address = { show_metro_only: false }
data.value.workAddress = ''
data.value.hideWorkAddress = false
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
data.value.superjob_employment_conditions = []
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
// При редактировании — из editingVacancy.platforms_data (id или name); при новой публикации — из selectedPlatform
const platformIdToNameMap = { 1: 'hh', 2: 'avito', 3: 'rabota', 4: 'superjob' }
const currentPlatform = computed(() => {
  const platformData = props.editingVacancy?.platforms_data?.[0]
  if (platformData) {
    const byId = platformData.id != null ? platformIdToNameMap[platformData.id] : null
    if (byId) return byId
    const byName = platformData.name ? normalizePlatformName(platformData.name) : null
    if (byName) return byName
  }
  const fromSelected = normalizePlatformName(props.selectedPlatform)
  return fromSelected || 'hh'
})
// SuperJob может приходить как 'superjob' или 'superjob.ru' — единый UI (одно поле «Профессиональная сфера»)
const isSuperjobPlatform = computed(() => {
  const p = currentPlatform.value
  return p === 'superjob' || p === 'superjob.ru'
})
// Скрывать блок «График и часы работы» для SuperJob: по выбранной платформе или по редактируемой вакансии (data.platform может обновиться позже)
const hideScheduleBlockForSuperjob = computed(() => {
  return isSuperjobPlatform.value ? true : props.editingVacancy?.platforms_data?.[0]?.id === 4
})

// Каталог SuperJob для SpecializationSelector: computed из currectRole, чтобы при loadDictionaries('superjob') данные сразу отображались
const superjobCatalogForSelector = computed(() =>
  isSuperjobPlatform.value && Array.isArray(currectRole.value) ? currectRole.value : []
);

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

/** Нормализация подписи специализации для сравнения с каталогом hh.ru */
function normalizeSpecLabel(s) {
  return String(s ?? '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
}

/**
 * Импорт с hh.ru кладёт в БД в основном строку specializations (из name ролей), без industry.
 * Ищем объект роли и родительскую категорию по всему каталогу professional_roles.
 */
function findHhRoleInFullCatalog(specializations, categories) {
  if (specializations == null || specializations === '' || !categories?.length) {
    return null
  }

  const matchByPredicate = (predicate) => {
    for (const cat of categories) {
      const roles = cat?.roles && Array.isArray(cat.roles) ? cat.roles : []
      for (const r of roles) {
        if (predicate(r)) return { role: r, category: cat }
      }
    }
    return null
  }

  if (typeof specializations === 'object') {
    if (specializations.id != null && String(specializations.id).trim() !== '') {
      const idStr = String(specializations.id).trim()
      const byId = matchByPredicate((r) => r.id != null && String(r.id) === idStr)
      if (byId) return byId
    }
    if (specializations.name) {
      const target = normalizeSpecLabel(specializations.name)
      const byName = matchByPredicate((r) => r?.name && normalizeSpecLabel(r.name) === target)
      if (byName) return byName
    }
    return null
  }

  if (typeof specializations !== 'string') return null

  const raw = specializations.trim()
  if (!raw) return null

  if (/^\d+$/.test(raw)) {
    const byId = matchByPredicate((r) => r.id != null && String(r.id) === raw)
    if (byId) return byId
  }

  const parts = raw.split(',').map((p) => p.trim()).filter(Boolean)
  const candidates = parts.length > 0 ? parts : [raw]

  for (const part of candidates) {
    const n = normalizeSpecLabel(part)
    if (!n) continue
    let hit = matchByPredicate((r) => r?.name && normalizeSpecLabel(r.name) === n)
    if (hit) return hit
  }
  for (const part of candidates) {
    const n = normalizeSpecLabel(part)
    if (!n || n.length < 4) continue
    const hit = matchByPredicate((r) => {
      if (!r?.name) return false
      const rn = normalizeSpecLabel(r.name)
      return rn.includes(n) || n.includes(rn)
    })
    if (hit) return hit
  }
  return null
}

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

  // Обновляем специализацию внутри найденной отрасли
  computedProfessionalRole.value = null

  // Точные professional_roles с hh.ru (GET /hh/publications/{platform_id}) — приоритет над строкой specializations из БД
  const hhApiRoles = vacancy._hh_api_professional_roles
  if (Array.isArray(hhApiRoles) && hhApiRoles.length > 0 && currectRole.value && Array.isArray(currectRole.value)) {
    const first = hhApiRoles[0]
    const hit = first ? findHhRoleInFullCatalog(first, currectRole.value) : null
    if (hit) {
      computedProfessionalRole.value = hit.role
      if (!computedIndustry.value) {
        computedIndustry.value = hit.category
      }
    }
  }

  if (!computedProfessionalRole.value && computedIndustry.value && vacancy.specializations && computedIndustry.value.roles && Array.isArray(computedIndustry.value.roles)) {
    const spec = vacancy.specializations
    const matchRole = (r) => {
      if (typeof spec === 'string') {
        const parts = spec.split(',').map((p) => p.trim()).filter(Boolean)
        const targets = parts.length ? parts.map(normalizeSpecLabel) : [normalizeSpecLabel(spec)]
        const rn = normalizeSpecLabel(r.name)
        return targets.some((t) => t && (t === rn || r.name === spec.trim()))
      }
      if (typeof spec === 'object' && spec !== null) {
        if (spec.name && r.name) {
          return normalizeSpecLabel(spec.name) === normalizeSpecLabel(r.name) || spec.name === r.name
        }
        if (spec.id != null && r.id != null) {
          return String(r.id) === String(spec.id)
        }
      }
      return false
    }
    computedProfessionalRole.value = computedIndustry.value.roles.find(matchRole) || null
  }

  // hh.ru: в БД часто только строка specializations (без industry) — ищем роль по всему каталогу
  if (!computedProfessionalRole.value && vacancy.specializations && currectRole.value && Array.isArray(currectRole.value)) {
    const hit = findHhRoleInFullCatalog(vacancy.specializations, currectRole.value)
    if (hit) {
      computedProfessionalRole.value = hit.role
      if (!computedIndustry.value) {
        computedIndustry.value = hit.category
      }
    }
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
        updateValidField('professional_roles', true)
      }
    } else if (
      currentPlatform.value === 'hh' &&
      computedProfessionalRole.value &&
      (!data.value.professional_roles?.[0]?.id ||
        String(data.value.professional_roles[0].id) !== String(computedProfessionalRole.value.id))
    ) {
      handleHhSpecializationUpdate(computedProfessionalRole.value)
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

// hh.ru: «Какого сотрудника ищите?» и тип занятости (как на нашей платформе)
const hhEmployeeType = ref('permanent')
const hhEmployeeTypeOptions = [
  { id: 'permanent', name: 'Постоянного' },
  { id: 'temporary', name: 'Временного' },
]
const hhEmploymentOptionsPermanent = [
  { id: 'FULL', name: 'Полная', siteName: 'Полная' },
  { id: 'PART', name: 'Частичная', siteName: 'Частичная' },
  { id: 'FLY_IN_FLY_OUT', name: 'Вахта', siteName: 'Вахта' },
]
const hhEmploymentOptionsTemporary = [
  { id: 'PROJECT', name: 'Проект', siteName: 'Временная' },
  { id: 'SIDE_JOB', name: 'Подработка', siteName: 'Подработка' },
]
const hhEmploymentOptionsForType = computed(() =>
  hhEmployeeType.value === 'permanent' ? hhEmploymentOptionsPermanent : hhEmploymentOptionsTemporary
)
function isHhEmploymentSelected(opt) {
  const v = data.value.employment_form
  if (!v) return false
  return String(opt?.id) === String(v?.id) || opt?.siteName === v?.siteName
}
const hhOformlenieOptions = [...HH_OFORMLENIE_MULTISELECT_OPTIONS]

function isHhScheduleSelected(opt) {
  const arr = data.value.work_schedule_by_days
  if (!Array.isArray(arr) || arr.length === 0) return false
  const first = arr[0]
  return (opt?.id && first?.id && String(opt.id) === String(first.id)) ||
    (opt?.value && first?.value && String(opt.value) === String(first.value))
}
function handleHhScheduleSelect(opt) {
  data.value.work_schedule_by_days = opt ? [opt] : []
  updateValidField('work_schedule_by_days', !!opt)
}
function isHhWorkHoursSelected(opt) {
  const arr = data.value.working_hours
  if (!Array.isArray(arr) || arr.length === 0) return false
  const first = arr[0]
  return (opt?.id && first?.id && String(opt.id) === String(first.id)) ||
    (opt?.value && first?.value && String(opt.value) === String(first.value))
}
function handleHhWorkHoursSelect(opt) {
  data.value.working_hours = opt ? [opt] : []
  updateValidField('working_hours', !!opt)
}

// hh.ru: отображение города для GeoInput (из area.name или location)
const hhLocationDisplay = computed(() => {
  if (data.value.area?.name) return data.value.area.name
  if (data.value.location) return data.value.location
  return ''
})

function onHhLocationUpdate(cityName) {
  if (!cityName || !String(cityName).trim()) {
    data.value.area = {}
    data.value.location = ''
    updateValidField('area', false)
    isCitySetFromVacancy.value = false
    return
  }
  const trimmed = String(cityName).trim()
  data.value.location = trimmed
  const city = cities.value.find((c) => c?.name && c.name.toLowerCase() === trimmed.toLowerCase())
  if (city) {
    data.value.area = { id: city.id, name: city.name }
    data.value.address = {
      id: city.id,
      name: city.name,
      show_metro_only: data.value.address?.show_metro_only ?? false
    }
    updateValidField('area', true)
  } else {
    data.value.area = {}
    updateValidField('area', false)
  }
  isCitySetFromVacancy.value = false
}

function onHhLocationBlur() {
  if (!data.value.location?.trim()) {
    updateValidField('area', false)
  }
}

function onHhHideWorkAddressUpdate(val) {
  data.value.hideWorkAddress = !!val
}

function onHhWorkAddressUpdate(addr) {
  data.value.workAddress = addr || ''
  if (addr?.trim()) {
    updateValidField('address', true)
    if (data.value.area?.id) {
      data.value.address = {
        id: data.value.area.id,
        name: data.value.area.name,
        building: addr,
        show_metro_only: data.value.address?.show_metro_only ?? false
      }
    } else {
      data.value.address = { building: addr, show_metro_only: data.value.address?.show_metro_only ?? false }
    }
  } else {
    if (data.value.area?.id) {
      data.value.address = { id: data.value.area.id, name: data.value.area.name, show_metro_only: data.value.address?.show_metro_only ?? false }
    } else {
      data.value.address = { show_metro_only: data.value.address?.show_metro_only ?? false }
    }
    updateValidField('address', !!data.value.area?.id)
  }
}

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
  } else if (platform === 'superjob') {
    // Каталог SuperJob: отрасли (key, title) и позиции (positions[].key, title). В вакансию передаём только id категории (position.key).
    const cataloguesResult = await getSuperjobCatalogues()
    if (cataloguesResult?.data && Array.isArray(cataloguesResult.data)) {
      currectRole.value = cataloguesResult.data.map((c) => ({
        id: c.key ?? c.id,
        name: c.title ?? c.title_rus ?? '',
        roles: (c.positions || []).map((p) => ({
          id: p.key ?? p.id,
          name: p.title ?? p.title_rus ?? '',
        })),
      }))
      updateComputedValues()
      await applyComputedValues()
    } else {
      currectRole.value = []
    }
    // Города SuperJob — API требует town как число (id). Загружаем справочник и подставляем в селектор.
    const townsResult = await getSuperjobTowns({ all: 1 })
    const townObjects = Array.isArray(townsResult?.data) ? townsResult.data : (townsResult?.data?.objects ?? [])
    if (townObjects.length > 0) {
      cities.value = townObjects.map((t) => ({ id: t.id, name: t.title ?? t.name ?? '' })).filter((c) => c.id != null && c.name)
      // Если уже выбран город по названию (HH), подбираем SuperJob town по имени
      const currentArea = data.value.area
      if (currentArea?.name && !currentArea?.id) {
        const match = cities.value.find((c) => String(c.name || '').toLowerCase() === String(currentArea.name || '').toLowerCase())
        if (match) data.value.area = { id: match.id, name: match.name }
      } else if (currentArea?.name && currentArea?.id) {
        const byId = cities.value.find((c) => Number(c.id) === Number(currentArea.id))
        if (!byId) {
          const byName = cities.value.find((c) => String(c.name || '').toLowerCase() === String(currentArea.name || '').toLowerCase())
          if (byName) data.value.area = { id: byName.id, name: byName.name }
        }
      }
      updateComputedValues()
      await applyComputedValues()
    }
  } else {
    // Загружаем справочники hh.ru (по умолчанию)
    const { roles, errorRoles } = await getRolesHh()
    if (!errorRoles) {
      currectRole.value = roles.categories
    }

    // Загрузка списка городов из API (локальная БД hh_areas)
    const { data: areasData, error: areasError } = await getAreasHh()
    if (!areasError && areasData) {
      cities.value = dedupeAreasByName(areasData)
      console.log('Загружены города в loadDictionaries, количество:', cities.value.length)
      // Обновляем вычисленные значения после загрузки городов
      updateComputedValues()
      // Применяем значения, включая установку города из вакансии
      await applyComputedValues()
    }
  }
}

// Справочники hh.ru по умолчанию — при «Опубликовать» с карточки не дергаем HH до показа формы (см. onMounted).
if (!isNewPublicationFromCard) {
  const { roles, errorRoles } = await getRolesHh()
  if (!errorRoles) {
    currectRole.value = roles.categories
    updateComputedValues()
    await applyComputedValues()
  }

  const { data: areasData, error: areasError } = await getAreasHh()
  if (!areasError && areasData) {
    cities.value = dedupeAreasByName(areasData)
    console.log('Загружены города, количество:', cities.value.length)
    updateComputedValues()
    await applyComputedValues()
  }
}

if (!isNewPublicationFromCard) {
  try {
    const result = await getAddressesHh()
    const addressesData = result?.data
    const addressesError = result?.error
    if (!addressesError && addressesData?.items) {
      addresses.value = addressesData.items
    }
  } catch (e) {
    addresses.value = []
  }
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

function normSalaryLabel(s) {
  return String(s ?? '')
    .replace(/\u00a0/g, ' ')
    .trim();
}

/** place из InfoTab: '1'…'4' → id формата HH (work_format). */
function mapJoblyPlaceToHhWorkFormat(placeVal) {
  const idByJobly = { 1: 'ON_SITE', 2: 'REMOTE', 3: 'HYBRID', 4: 'FIELD_WORK' };
  const raw = Array.isArray(placeVal)
    ? placeVal
    : placeVal != null && placeVal !== ''
      ? [placeVal]
      : [];
  const out = [];
  const seen = new Set();
  for (const p of raw) {
    const key = String(typeof p === 'object' && p != null ? (p.id ?? p.value ?? '') : p).trim();
    const hhId = idByJobly[key];
    if (!hhId || seen.has(hhId)) {
      continue;
    }
    const fmt = HH_WORK_FORMAT.find((f) => f.id === hhId);
    if (fmt) {
      seen.add(hhId);
      out.push({ ...fmt, value: fmt.id });
    }
  }
  return out;
}

/** Заполняет форму из загруженной вакансии (globCurrentVacancy). Вызывать после установки globCurrentVacancy. */
async function fillFormFromCurrentVacancy() {
  const vacancy = globCurrentVacancy.value
  if (!vacancy) return

  const platformKey = data.value.platform?.platform ?? data.value.platform
  const platformProps = platformKey ? (PLATFORM_PROPERTIES[platformKey] || {}) : {}
  for (const key in platformProps) {
    data.value[key] = vacancy[key]
  }
  if (currentPlatform.value === 'hh') {
    applyJoblyVacancyToHhPublicationFormData(data.value, vacancy)
  }
  if (vacancy.salary_from != null) data.value.salary_range.from = vacancy.salary_from
  if (vacancy.salary_to != null) data.value.salary_range.to = vacancy.salary_to
  if (vacancy.education) {
    data.value.education_level = HH_EDUCATION_LAVEL.find((item) => item.name == vacancy.education)
  }
  // Навыки: приоритет phrases (InfoTab); пустой skills[] не должен скрывать phrases
  const phrases = vacancy.phrases
  const skills = vacancy.skills
  const skillsRaw =
    Array.isArray(phrases) && phrases.length > 0
      ? phrases
      : Array.isArray(skills) && skills.length > 0
        ? skills
        : phrases ?? skills
  if (skillsRaw != null) {
    data.value.phrases = Array.isArray(skillsRaw) ? skillsRaw : skillsRaw
    const arr = Array.isArray(skillsRaw)
      ? skillsRaw.map((s) => (typeof s === 'object' && s != null && 'name' in s ? { name: String(s.name ?? '').trim() } : { name: String(s ?? '').trim() })).filter((o) => o.name)
      : (typeof skillsRaw === 'string' && skillsRaw.trim()
        ? skillsRaw.split(',').map((s) => ({ name: s.trim() })).filter((o) => o.name)
        : [])
    data.value.key_skills = arr
  }
  // Водительские права: для вакансий с SuperJob наша БД может вернуть driving_licence: ["A", "B", "C"]; иначе — drivers: [{ id: 1 }, ...] (числовые id нашей БД).
  // В форме опции MultiSelect — HH_DRIVER_LICENSE_TYPES с id "A", "B", "C"… Поэтому при drivers с числовыми id преобразуем в названия через справочник.
  if (vacancy.driving_licence && Array.isArray(vacancy.driving_licence) && vacancy.driving_licence.length > 0) {
    const cats = vacancy.driving_licence.map((cat) => {
      const name = typeof cat === 'object' && cat != null ? (cat.title ?? cat.name ?? cat.id ?? '') : String(cat ?? '')
      const id = String(name).trim().toUpperCase()
      return /^[A-E]$/.test(id) ? { id } : null
    }).filter(Boolean)
    data.value.driver_license_types = cats
  } else if (vacancy.drivers && Array.isArray(vacancy.drivers) && vacancy.drivers.length > 0) {
    const hasNumericIds = vacancy.drivers.some((d) => typeof d?.id === 'number' || (typeof d?.id === 'string' && /^\d+$/.test(String(d.id))))
    if (hasNumericIds) {
      const applyDriversMap = (fields) => {
        const idToName = buildDriverDbIdToNameMap(fields?.data?.drivers)
        const toCategoryId = (name) => {
          if (!name || typeof name !== 'string') return null
          const s = String(name).trim().toUpperCase()
          if (/^[A-E]$/.test(s)) return s
          const m = s.match(/\b([A-E])\b/)
          return m ? m[1] : null
        }
        const mapped = vacancy.drivers
          .map((d) => {
            const numId = Number(d?.id ?? 0)
            const name = idToName.get(numId) ?? (typeof d?.id === 'string' && /^[A-E]$/i.test(d.id) ? String(d.id).toUpperCase() : null)
            const categoryId = name != null ? toCategoryId(name) : (typeof d?.id === 'string' ? toCategoryId(d.id) : null)
            return categoryId != null ? { id: categoryId } : null
          })
          .filter(Boolean)
        if (mapped.length > 0) data.value.driver_license_types = mapped
      }
      if (isNewPublicationFromCard) {
        void getVacancyFields()
          .then((fields) => {
            try {
              applyDriversMap(fields)
            } catch (e) {
              console.warn('Маппинг водительских прав (drivers → категории):', e)
            }
          })
          .catch((e) => {
            console.warn('Маппинг водительских прав (drivers → категории):', e)
          })
      } else {
        try {
          const fields = await getVacancyFields()
          applyDriversMap(fields)
        } catch (e) {
          console.warn('Маппинг водительских прав (drivers → категории):', e)
          data.value.driver_license_types = vacancy.drivers
        }
      }
    } else {
      data.value.driver_license_types = vacancy.drivers.map((d) => ({ id: String(d?.id ?? '').trim().toUpperCase() })).filter((d) => /^[A-E]$/.test(d.id))
    }
  }
  if (vacancy.location) data.value.location = vacancy.location
  if (vacancy.work_address != null) data.value.workAddress = String(vacancy.work_address)
  else if (vacancy.workAddress != null) data.value.workAddress = String(vacancy.workAddress)
  if (vacancy.hide_work_address != null) data.value.hideWorkAddress = !!vacancy.hide_work_address
  else if (vacancy.hideWorkAddress != null) data.value.hideWorkAddress = !!vacancy.hideWorkAddress

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
  const wf = mapJoblyPlaceToHhWorkFormat(vacancy.place);
  if (wf.length > 0) {
    data.value.work_format = wf;
  } else if (vacancy.place != null && vacancy.place !== '') {
    data.value.workSpace = String(vacancy.place);
  }

  const rawOf = vacancy.oformlenie;
  if (Array.isArray(rawOf) && rawOf.length > 0) {
    const mappedOf = [];
    for (const o of rawOf) {
      const v = typeof o === 'object' && o != null ? (o.value ?? o.id ?? '') : o;
      const found = HH_OFORMLENIE_MULTISELECT_OPTIONS.find((x) => x.value === v || x.id === v);
      if (found) {
        mappedOf.push({ ...found });
      }
    }
    if (mappedOf.length > 0) {
      data.value.oformlenie = mappedOf;
    }
  }

  const night = vacancy.has_evening_night_shifts ?? vacancy.hasEveningNightShifts;
  if (night != null) {
    data.value.has_evening_night_shifts = Boolean(night);
  }

  const curStr = vacancy.currency;
  if (typeof curStr === 'string' && curStr.trim() !== '') {
    const hit = ArrayCurrency.value.find((c) => c.name === curStr.trim());
    if (hit) {
      data.value.salary_range.currency = hit.id;
    }
  }
  const salFreq = vacancy.salary_frequency;
  if (typeof salFreq === 'string' && salFreq.trim() !== '') {
    const n = normSalaryLabel(salFreq);
    const mode = HH_SALARY_TYPE.find(
      (t) => normSalaryLabel(t.name) === n || t.name === salFreq.trim()
    );
    if (mode) {
      data.value.salary_range.mode = { id: mode.id };
    }
  }
  const payFreq = vacancy.salary_payment_frequency;
  if (typeof payFreq === 'string' && payFreq.trim() !== '') {
    const n = normSalaryLabel(payFreq);
    const freq = HH_SALARY_FREQUENCY.find(
      (t) => normSalaryLabel(t.name) === n || t.name === payFreq.trim()
    );
    if (freq) {
      data.value.salary_range.frequency = { id: freq.id };
    }
  }
  // Условия занятости SuperJob (теги): сохраняются в нашей БД, при открытии формы подставляем из вакансии
  const conditionsRaw = vacancy.superjob_employment_conditions
  if (Array.isArray(conditionsRaw) && conditionsRaw.length > 0) {
    data.value.superjob_employment_conditions = conditionsRaw.map((id) => (id != null ? String(id) : '')).filter(Boolean)
  }

  updateComputedValues()
  await applyComputedValues()
}

const vacancyIdFields = ['experience', 'employment_form']

// Заполнение формы: при редактировании из «Активные публикации» — вакансия по id строки (GET /api/vacancies/{id}), иначе — по id из URL
async function loadInitialFormData() {
  const platformIdToName = { 1: 'hh', 2: 'avito', 3: 'rabota', 4: 'superjob' };

  const qId = route.query?.id;
  const pId = route.params?.id;
  const vid = route.query?._vid;
  let vacancyId =
    qId != null && String(qId).trim() !== ''
      ? String(qId).trim()
      : pId != null && String(pId).trim() !== ''
        ? String(pId).trim()
        : vid != null && String(vid).trim() !== ''
          ? String(vid).trim()
          : null;

  if (props.editingVacancy?.id) {
    vacancyId = String(props.editingVacancy.id);
    const platformData = props.editingVacancy.platforms_data?.[0];
    if (platformData) {
      const platformName = platformIdToName[platformData.id];
      // Для SuperJob (id 4) ищем по 'superjob' или 'superjob.ru'
      const platformKey = platforms.value?.find(
        (p) => p.platform === platformName || (platformData.id === 4 && (p.platform === 'superjob' || p.platform === 'superjob.ru'))
      ) ?? platforms.value?.[0];
      if (platformKey) {
        data.value.platform = platformKey;
      }
      // Для SuperJob: загружаем каталог и подставляем профессиональную сферу из текущей вакансии на платформе
      if (platformData.id === 4) {
        await loadDictionaries('superjob');
        const { data: sjVacancy } = await getSuperjobVacancy(platformData.platform_id);
        // SuperJob: catalogues[0] может быть: (a) отрасль с positions[] или (b) категория с parent
        // В обоих случаях передаём в payload только id позиции (position.key из каталога)
        if (sjVacancy?.catalogues?.length && currectRole.value?.length) {
          const cat = sjVacancy.catalogues[0];
          const hasParent = cat?.parent && typeof cat.parent === 'object';
          const industryId = hasParent ? (cat.parent?.id ?? cat.parent?.key) : (cat.id ?? cat.key);
          const positionId = hasParent ? (cat.id ?? cat.key) : (cat.positions?.[0]?.id ?? cat.positions?.[0]?.key ?? industryId);
          for (const ind of currectRole.value) {
            if (String(ind.id ?? ind.key) !== String(industryId)) continue;
            const role = ind.roles?.find(r => String(r.id ?? r.key) === String(positionId));
            if (role) {
              data.value.industry = { ...ind };
              data.value.professional_roles = [role];
              data.value.superjob_catalogue_id = Number(positionId) || positionId;
              break;
            }
          }
        }
        // Город: SuperJob town { id, title } — используем id (число) для payload
        if (sjVacancy?.town && (sjVacancy.town.id != null || sjVacancy.town.key != null)) {
          const tid = sjVacancy.town.id ?? sjVacancy.town.key
          const ttitle = sjVacancy.town.title ?? sjVacancy.town.name ?? ''
          data.value.area = { id: tid, name: ttitle }
        }
        // Готовы рассмотреть (candidat): подставляем из текущей вакансии SuperJob, если в нашей БД ещё нет
        if (sjVacancy?.candidat && (data.value.candidat == null || data.value.candidat === '')) {
          data.value.candidat = typeof sjVacancy.candidat === 'string' ? sjVacancy.candidat : String(sjVacancy.candidat || '');
        }
        // Чекбоксы «Готовы рассмотреть»: из ответа SuperJob (accept_short_resume, accept_students и т.д.)
        const readyIds = []
        for (const opt of SUPERJOB_READY_TO_CONSIDER) {
          if (sjVacancy?.[opt.superjobKey] === true) readyIds.push(opt.id)
        }
        if (readyIds.length > 0) data.value.superjob_ready_to_consider = readyIds
        // Опыт работы: SuperJob возвращает experience { id, title } (id 1–4) или experience_id/experience_title. Маппим на наш справочник experience.json
        const superjobToOurId = { 1: 'noExperience', 2: 'between1And3', 3: 'between3And6', 4: 'moreThan6' }
        const mapSjExperienceToOur = (sjId, sjTitle) => {
          const id = sjId != null ? Number(sjId) : NaN
          const title = (sjTitle ?? '').toString().toLowerCase()
          if (!isNaN(id) && superjobToOurId[id]) return superjobToOurId[id]
          if (title.includes('без опыта')) return 'noExperience'
          if (title.includes('от 1 года') || title.includes('1 до 3')) return 'between1And3'
          if (title.includes('от 3 лет') || title.includes('3 до 6')) return 'between3And6'
          if (title.includes('от 6 лет') || title.includes('более 6')) return 'moreThan6'
          return null
        }
        const sjExp = sjVacancy?.experience
        const sjExpId = sjExp?.id ?? sjVacancy?.experience_id
        const sjExpTitle = sjExp?.title ?? sjExp?.title_rus ?? sjExp?.name ?? sjVacancy?.experience_title ?? (typeof sjVacancy?.experience === 'string' ? sjVacancy.experience : '')
        const ourId = mapSjExperienceToOur(sjExpId, sjExpTitle) || (typeof sjExp === 'string' ? mapSjExperienceToOur(null, sjExp) : null)
        if (ourId) {
          const expOption = experience.find((opt) => opt.id === ourId)
          if (expOption) {
            data.value.experience = { id: expOption.id, name: expOption.name, value: expOption.value }
          }
        }
      }
    }
  }

  const fromPublishCardOnly = !props.editingVacancy?.id && Boolean(props.selectedPlatform)

  async function applyVacancyToFormFields() {
    const pdHh = props.editingVacancy?.platforms_data?.[0]
    if (
      pdHh?.id === 1 &&
      pdHh?.platform_id != null &&
      String(pdHh.platform_id).trim() !== '' &&
      globCurrentVacancy.value &&
      !globCurrentVacancy.value._hh_api_professional_roles
    ) {
      const pubRes = await getHhPublicationById(String(pdHh.platform_id))
      const pr = pubRes?.data?.professional_roles
      if (!pubRes?.error && Array.isArray(pr) && pr.length > 0) {
        globCurrentVacancy.value = {
          ...globCurrentVacancy.value,
          _hh_api_professional_roles: pr,
        }
      }
    }
    updateComputedValues()
    await fillFormFromCurrentVacancy()
    vacancyIdFields.forEach((field) => {
      if (field === 'experience' && props.editingVacancy?.platforms_data?.[0]?.id === 4) return
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

  // Карточка «Опубликовать»: только локальный provide(vacancyCurrect), без GET вакансии и без ожидания совпадения id с URL (черновик).
  if (fromPublishCardOnly) {
    if (globCurrentVacancy.value || vacancyData.value) {
      await applyVacancyToFormFields()
    }
  } else if (vacancyId) {
    const mustFetchVacancy =
      !globCurrentVacancy.value ||
      vacancyId !== globCurrentVacancy.value.id?.toString()

    if (mustFetchVacancy) {
      const vacancy = await getVacancyById(vacancyId)
      if (vacancy) {
        globCurrentVacancy.value = vacancy
        console.log('Загружена вакансия, location:', vacancy.location)
        const pd = props.editingVacancy?.platforms_data?.[0]
        if (pd?.id === 1 && pd?.platform_id != null && String(pd.platform_id).trim() !== '') {
          const pubRes = await getHhPublicationById(String(pd.platform_id))
          const pr = pubRes?.data?.professional_roles
          if (!pubRes?.error && Array.isArray(pr) && pr.length > 0) {
            globCurrentVacancy.value = {
              ...globCurrentVacancy.value,
              _hh_api_professional_roles: pr,
            }
          }
        }
      }
    }
    if (globCurrentVacancy.value && globCurrentVacancy.value.id?.toString() === vacancyId) {
      await applyVacancyToFormFields()
    }
  }
}

await loadInitialFormData();

const getPhrasesVacancy = async function () {
  const { data, error } = await getPhrases()
  return data
}

if (isNewPublicationFromCard) {
  getPhrasesVacancy().then((d) => { phrases.value = d }).catch(() => {})
} else {
  phrases.value = await getPhrasesVacancy()
}

// Дефолты для experience/employment_form, если вакансия не загружалась (форма «добавить»)
vacancyIdFields.forEach((field) => {
  if (field === 'experience' && props.editingVacancy?.platforms_data?.[0]?.id === 4) return
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
  if (currentPlatform.value !== 'hh') {
    data.value.code = vacancyData.value.code
  }
  data.value.description = vacancyData.value.description
  // Отрасль/специализацию из vacancyData не подставляем, если уже заданы из каталога SuperJob (редактирование вакансии с SuperJob)
  if (data.value.superjob_catalogue_id == null && currectRole.value && Array.isArray(currectRole.value)) {
    data.value.industry = currectRole.value.find((n) => n.name === vacancyData.value.industry) ?? null
    if (data.value.industry !== undefined && data.value.industry?.roles?.length > 0) {
      const roleMatch = data.value.industry.roles.filter(function (n) {
        return n.name == vacancyData.value.specializations
      })
      data.value.professional_roles[0] = roleMatch[0] ?? data.value.industry.roles[0]
    }
    if (!data.value.professional_roles?.[0] && data.value.industry?.roles?.[0]) {
      roleData.value = data.value.industry.roles[0]
      data.value.professional_roles[0] = data.value.industry.roles[0]
    }
  }
  // Обновляем вычисленные значения после обработки vacancyData
  updateComputedValues()
}
// data.value.employment_form = HH_EMPLOYMENT_TYPES.filter( (item, i) => {
//       return item.siteName == globCurrentVacancy.value?.employment
// })[0] || HH_EMPLOYMENT_TYPES[0];

if (!inject('isPlatforms') && !isNewPublicationFromCard) {
  const profileResult = await profileHh()
  const profileData = profileResult?.data
  const profileError = profileResult?.error
  if (!profileError && profileData?.data) {
    platforms.value[0].isAuthenticated = true
    platforms.value[0].data = { email: profileData.data.email }
    const employerId = profileData.data?.employer?.id
    const managerId = profileData.data?.manager?.id
    if (employerId && managerId) {
      const { types, errorTypes } = await typesHh(employerId, managerId)
      if (!errorTypes) {
        platforms.value[0].types = types
      }
    }
    if (profileData.data?.employer?.id) {
      await loadTariffsForHh(profileData.data.employer.id)
    }
  }
}

// При новой публикации (selectedPlatform) — всегда устанавливаем платформу и загружаем справочники
const targetPlatformFromProps = props.selectedPlatform ? normalizePlatformName(props.selectedPlatform) : null
if (targetPlatformFromProps) {
  const platformKey = platforms.value?.find((p) => p.platform === targetPlatformFromProps)
  if (platformKey) {
    data.value.platform = platformKey
    if (targetPlatformFromProps === 'hh') {
      // Для карточки «Опубликовать» профиль/тарифы — один раз в цикле ниже (без повторного profileHh).
      if (!isNewPublicationFromCard) {
        const profile = await profileHh()
        if (!profile.error && profile.data?.data?.employer?.id) {
          await loadTariffsForHh(profile.data.data.employer.id)
          platformKey.isAuthenticated = true
          platformKey.data = profile.data.data
        }
      }
    } else if (targetPlatformFromProps === 'superjob') {
      await loadDictionaries('superjob')
    } else if (targetPlatformFromProps === 'avito') {
      await loadDictionaries('avito')
    } else if (targetPlatformFromProps === 'rabota') {
      await loadDictionaries('rabota')
    }
  }
}

for (let key of platforms.value) {
  if (!isPlatforms.value) {
    // Если передан selectedPlatform через props, используем его (новая публикация)
    if (props.selectedPlatform) {
      const targetPlatform = normalizePlatformName(props.selectedPlatform)
      if (key.platform === targetPlatform) {
        if (key.platform == 'hh') {
          if (isNewPublicationFromCard) {
            key.isAuthenticated = true
            isPlatforms.value = true
          } else {
            const profile = await profileHh()
            if (!profile.error && profile.data?.data) {
              const pdata = profile.data.data
              const employerId = pdata.employer?.id
              const managerId = pdata.manager?.id
              if (employerId && managerId) {
                const { types, errorTypes } = await typesHh(employerId, managerId)
                if (!errorTypes && platforms.value[0]) {
                  platforms.value[0].types = types
                }
              }
              if (employerId) {
                await loadTariffsForHh(employerId)
                key.isAuthenticated = true
                key.data = pdata
                isPlatforms.value = true
              }
            }
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
            if (!isNewPublicationFromCard || targetPlatformFromProps !== 'rabota') {
              await loadDictionaries('rabota')
            }
          }
        } else if (key.platform == 'superjob') {
          key.isAuthenticated = true
          isPlatforms.value = true
          if (!isNewPublicationFromCard || targetPlatformFromProps !== 'superjob') {
            await loadDictionaries('superjob')
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

if (isNewHhPublicationFromCard) {
  void nextTick(() => emit('form-ready'))
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

// Переключение чекбокса «Готовы рассмотреть» для SuperJob
function toggleSuperjobReadyConsider(id, checked) {
  const arr = [...(data.value.superjob_ready_to_consider || [])]
  const idx = arr.indexOf(id)
  if (checked && idx === -1) arr.push(id)
  else if (!checked && idx !== -1) arr.splice(idx, 1)
  data.value.superjob_ready_to_consider = arr
}

// Категории водительских прав для SuperJob (на платформе только A–E). Используется в выпадающем списке при редактировании вакансии SuperJob.
const SUPERJOB_DRIVER_LICENSE_CATEGORIES = ['A', 'B', 'C', 'D', 'E']

/** Нужно ли показывать только категории A–E: платформа SuperJob или редактирование вакансии, привязанной к SuperJob (id 4). */
const useSuperjobDriverCategories = computed(() => {
  if (isSuperjobPlatform.value) return true
  const platformId = props.editingVacancy?.platforms_data?.[0]?.id
  return platformId === 4
})

// Преобразование для MultiSelect. Для SuperJob — только массив ['A','B','C','D','E'], иначе полный справочник.
const driverLicenseOptionsBase = HH_DRIVER_LICENSE_TYPES.map((license) => ({
  ...license,
  value: license.id,
}))
const driverLicenseOptions = computed(() => {
  if (useSuperjobDriverCategories.value) {
    return SUPERJOB_DRIVER_LICENSE_CATEGORIES.map((id) => ({ id, name: id, value: id }))
  }
  return driverLicenseOptionsBase
})

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
    // Для SuperJob не проверяем график и часы работы — раздел скрыт в форме
    if (isSuperjobPlatform.value && (key === 'work_schedule_by_days' || key === 'working_hours')) {
      validFields.value[key].status = true;
      continue;
    }
    // Для SuperJob вместо «Тип занятости» показываем «Условия занятости» (множественный выбор) — не требуем employment_form
    if (hideScheduleBlockForSuperjob.value && key === 'employment_form') {
      validFields.value[key].status = true;
      continue;
    }
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
      let mappedData = mapVacancyToUpdateFormat(data.value);
      // Для нашей платформы drivers — массив [{ id: 1 }, ...] (числовые id). Если в форме строковые id (A, B), разрешаем в id нашей БД.
      if (mappedData.drivers?.length && mappedData.drivers.some((d) => typeof d?.id === 'string')) {
        try {
          mappedData = { ...mappedData, drivers: await resolveDriverNamesToDbIds(mappedData.drivers) };
        } catch (e) {
          console.warn('Не удалось разрешить водительские права в id нашей БД:', e);
        }
      }
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
        let platformResponse = null;
        if (platformId === 1) {
          const { code: _omitHhCode, ...hhEditPayload } = data.value;
          const payload = {
            ...hhEditPayload,
            vacancy_platform_id: String(vacancyPlatformId),
            publication_id: vacancyPlatformId,
            jobly_vacancy_id: props.editingVacancy?.id,
          };
          platformResponse = await publishVacancyToHh(payload);
        } else if (platformId === 2) {
          const payload = { ...data.value, vacancy_platform_id: String(vacancyPlatformId), publication_id: vacancyPlatformId };
          platformResponse = await publishVacancyToAvito(payload);
        } else if (platformId === 3) {
          const payload = { ...data.value, vacancy_platform_id: String(vacancyPlatformId), publication_id: vacancyPlatformId };
          platformResponse = await publishVacancyToRabota(payload);
        } else if (platformId === 4) {
          const { data: currentSuperjobVacancy } = await getSuperjobVacancy(vacancyPlatformId);
          // SuperJob ожидает driving_licence: ['A','B',...]. Если в форме числовые id (из нашей БД), конвертируем в названия.
          let payloadFormData = data.value;
          if (data.value.driver_license_types?.length && data.value.driver_license_types.some((d) => typeof d?.id === 'number')) {
            const fields = await getVacancyFields();
            const idToName = buildDriverDbIdToNameMap(fields?.data?.drivers);
            const names = data.value.driver_license_types.map((d) => idToName.get(Number(d?.id ?? 0))).filter(Boolean);
            payloadFormData = { ...data.value, driver_license_types: names.map((n) => ({ id: n })) };
          }
          const areaId = data.value.area?.id ?? payloadFormData.area?.id;
          if (areaId != null && !isNaN(Number(areaId))) {
            payloadFormData = { ...payloadFormData, superjob_town_id: Number(areaId) };
          }
          const payload = mapVacancyToSuperjobPayload(payloadFormData, currentSuperjobVacancy ?? undefined);
          platformResponse = await updatePublicationSuperjob(vacancyPlatformId, payload);
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
  if (currentPlatform !== 'avito' && currentPlatform !== 'hh' && currentPlatform !== 'rabota' && currentPlatform !== 'superjob') {
    status.value = `Платформа ${currentPlatform} пока не поддерживается`
    return
  }

  // Выбираем функцию в зависимости от платформы и флага isDraft
  if (currentPlatform === 'superjob') {
    let payloadFormData = data.value;
    if (data.value.driver_license_types?.length && data.value.driver_license_types.some((d) => typeof d?.id === 'number')) {
      try {
        const fields = await getVacancyFields();
        const idToName = buildDriverDbIdToNameMap(fields?.data?.drivers);
        const names = data.value.driver_license_types.map((d) => idToName.get(Number(d?.id ?? 0))).filter(Boolean);
        payloadFormData = { ...data.value, driver_license_types: names.map((n) => ({ id: n })) };
      } catch (e) {
        console.warn('Не удалось преобразовать водительские права для SuperJob:', e);
      }
    }
    // SuperJob требует town как число (id из справочника). При платформе SuperJob cities загружаются из SuperJob towns, area.id = SuperJob town id.
    const areaId = data.value.area?.id ?? payloadFormData.area?.id;
    if (areaId != null && !isNaN(Number(areaId))) {
      payloadFormData = { ...payloadFormData, superjob_town_id: Number(areaId) };
    }
    const { data: sjData, error: sjError } = await publishVacancyToSuperjob(payloadFormData);
    response = sjError ? { error: sjError } : { data: sjData };
  } else if (currentPlatform === 'avito') {
    if (isDraft.value || isDraft.value === 'true') {
      response = await addDraftAvito(data.value)
    } else {
      response = await publishVacancyToAvito(data.value)
    }
  }
  if (currentPlatform === 'hh') {
    const { code: _omitHhCode, ...hhRest } = data.value;
    const hhForm = { ...hhRest, jobly_vacancy_id: props.editingVacancy?.id };
    if (isDraft.value || isDraft.value === 'true'
    ) {
      response = await addDraftHh(hhForm)
    } else {
      response = await publishVacancyToHh(hhForm)
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
      phrases.push({ name: item.name })
    })
    data.value.key_skills = phrases

  } else {
    if (data.value.key_skills)
      delete data.value.key_skills
  }
}

// Сброс experience_days при изменении типа занятости
watch(hhEmployeeType, (newType) => {
  if (currentPlatform.value === 'hh') {
    const opts = newType === 'permanent' ? hhEmploymentOptionsPermanent : hhEmploymentOptionsTemporary
    if (opts.length > 0) {
      handleIdUpdate('employment_form', opts[0])
    }
  }
})

watch(() => [data.value.employment_form, currentPlatform.value], ([emp, platform]) => {
  if (platform === 'hh' && emp?.id) {
    const isTemp = emp.id === 'PROJECT' || emp.id === 'SIDE_JOB'
    hhEmployeeType.value = isTemp ? 'temporary' : 'permanent'
  }
}, { immediate: true })

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


onMounted(() => {
  if (!isNewHhPublicationFromCard) {
    emit('form-ready')
    return
  }
  void (async () => {
    try {
      await loadDictionaries('hh')
      const profile = await profileHh()
      if (profile.error || !profile.data?.data) return
      const pdata = profile.data.data
      const employerId = pdata.employer?.id
      const managerId = pdata.manager?.id
      const hhKey = platforms.value?.find((p) => p.platform === 'hh')
      if (employerId && managerId && platforms.value[0]) {
        const { types, errorTypes } = await typesHh(employerId, managerId)
        if (!errorTypes) platforms.value[0].types = types
      }
      if (employerId && hhKey) {
        await loadTariffsForHh(employerId)
        hhKey.data = pdata
      }
      updateComputedValues()
      await applyComputedValues()
    } catch (e) {
      console.warn('Отложенная загрузка HH после показа формы публикации:', e)
    }
  })()
})

</script>

<style scoped>
.anchor {
  scroll-margin-top: 80px;
}
</style>