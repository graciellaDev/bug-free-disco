<template>
  <div :class="fixedModalFooter ? 'flex h-full min-h-0 w-full max-w-full flex-1 flex-col' : 'container p-0'">
    <div :class="fixedModalFooter ? 'flex min-h-0 flex-1 flex-col' : 'flex gap-x-[24px]'">
      <div :class="fixedModalFooter ? 'flex min-h-0 w-full flex-1 flex-col bg-transparent' : 'max-w-[100%] flex-grow bg-white rounded-fifteen'">
        <div
          :class="fixedModalFooter ? 'min-h-[min(320px,calc(90dvh-220px))] flex-1 overflow-y-auto overscroll-y-contain px-25px pb-25px' : 'contents'"
        >
        <template v-if="currentPlatform === 'hh'">
          <p class="text-space text-xl font-semibold mb-2">
            {{ HH_PUBLICATION_SECTIONS.basic.titleRu }}
          </p>
          <p class="text-xs text-bali mb-8 leading-normal">
            {{ HH_PUBLICATION_SECTIONS.basic.subtitleRu }}
          </p>
        </template>
        <p v-else-if="currentPlatform !== 'avito'" class="text-space text-xl font-semibold mb-8">
          Основная информация
        </p>
        <template v-if="currentPlatform === 'avito'">
          <p class="text-space text-xl font-semibold mb-8">Основное</p>
          <div id="name" class="w-full anchor mb-6">
            <p class="text-sm font-medium mb-4 leading-normal" :class="validFields.name.status === false ? 'text-red-custom' : 'text-space'">
              <span class="text-red-custom">*</span>
              Название вакансии
            </p>
            <MyInput
              placeholder="Например, повар горячего цеха или специалист по установке дверей"
              v-model="data.name"
              @update:model-value="($event) => updateValidField('name', $event.trim() !== '')"
            />
          </div>

          <div id="professional_roles" class="w-full anchor mb-6">
            <p class="text-sm font-medium mb-4 leading-normal" :class="validFields.professional_roles.status === false ? 'text-red-custom' : 'text-space'">
              <span class="text-red-custom">*</span>
              Профессия
            </p>
            <ClientOnly>
              <SpecializationSelector
                :options="professionsOptions"
                :full-catalog="avitoProfessionCatalogForSelector"
                :model-value="data.professional_roles?.[0] ?? null"
                placeholder="Выберите из списка"
                :error="validFields.professional_roles.status === false"
                :show-catalog-button="false"
                @update:model-value="($event) => handleIdUpdate('professional_roles', $event)"
              />
              <template #fallback>
                <div class="w-full h-10 rounded-ten border border-athens bg-athens-gray animate-pulse" />
              </template>
            </ClientOnly>
          </div>

          <div id="experience" class="w-full anchor mb-6">
            <p class="text-sm font-medium mb-4 leading-normal" :class="validFields.experience.status === false ? 'text-red-custom' : 'text-space'">
              <span class="text-red-custom">*</span>
              Опыт работы по профессии
            </p>
            <div class="flex w-full gap-2">
              <button
                v-for="opt in experienceOptions"
                :key="opt.id"
                type="button"
                class="flex-1 px-4 py-2.5 text-sm rounded-ten border transition-colors"
                :class="isAvitoExperienceOptionSelected(opt)
                  ? 'bg-zumthor border-dodger text-dodger font-normal'
                  : 'bg-athens-gray border-athens text-bali font-normal hover:bg-dodger hover:border-transparent hover:text-white'"
                @click="handleIdUpdate('experience', opt)"
              >
                {{ opt.name }}
              </button>
            </div>
          </div>

          <div class="w-full mb-6">
            <p class="text-sm font-medium mb-4 leading-normal text-space">
              <span class="text-red-custom">*</span>
              Сфера деятельности компании
            </p>
            <ClientOnly>
              <SpecializationSelector
                :options="Array.isArray(currectRole) ? currectRole : []"
                :full-catalog="avitoBusinessAreaCatalogForSelector"
                :model-value="data.industry ?? null"
                placeholder="Выберите из списка"
                :error="validFields.industry?.status === false"
                :show-catalog-button="false"
                @update:model-value="handleIndustryChange"
              />
              <template #fallback>
                <div class="w-full h-10 rounded-ten border border-athens bg-athens-gray animate-pulse" />
              </template>
            </ClientOnly>
          </div>

          <div id="description" class="w-full anchor mb-6">
            <p class="text-sm font-medium mb-3.5" :class="validFields.description.status === false ? 'text-red-custom' : 'text-space'">
              <span class="text-red-custom">*</span>
              Описание вакансии и компании
            </p>
            <TiptapEditor v-model="data.description" @update:model-value="($event) => updateDescriptionValidation($event)" />
          </div>

          <div class="w-full mb-10">
            <p class="text-space text-xl font-semibold mb-5">Готовы рассмотреть</p>
            <div class="flex flex-wrap gap-2">
              <button
                v-for="opt in avitoReadyConsiderOptions"
                :key="opt.id"
                type="button"
                class="px-4 py-2.5 text-sm rounded-ten border transition-colors"
                :class="isArrayItemSelected(data.additional_conditions, opt.id)
                  ? 'bg-zumthor border-dodger text-dodger font-normal'
                  : 'bg-athens-gray border-athens text-bali font-normal hover:bg-dodger hover:border-transparent hover:text-white'"
                @click="toggleArrayItem('additional_conditions', opt.id)"
              >
                {{ opt.name }}
              </button>
            </div>
          </div>

          <div class="mb-25px mt-25px border-t"></div>
          <p class="text-space text-xl font-semibold mb-8">Условия</p>

          <div id="employment_form" class="w-full anchor mb-6">
            <p class="text-sm font-medium mb-4 leading-normal" :class="validFields.employment_form.status === false ? 'text-red-custom' : 'text-space'">
              <span class="text-red-custom">*</span>
              Занятость
            </p>
            <div class="flex flex-wrap gap-2">
              <button
                v-for="opt in avitoEmploymentOptions"
                :key="opt.id"
                type="button"
                class="px-4 py-2.5 text-sm rounded-ten border transition-colors"
                :class="String(data.employment_form?.id || '') === String(opt.id)
                  ? 'bg-zumthor border-dodger text-dodger font-normal'
                  : 'bg-athens-gray border-athens text-bali font-normal hover:bg-dodger hover:border-transparent hover:text-white'"
                @click="handleIdUpdate('employment_form', opt)"
              >
                {{ opt.name }}
              </button>
            </div>
          </div>

          <div id="address" class="w-full anchor mb-6">
            <p class="text-sm font-medium mb-4 leading-normal text-space">
              <span class="text-red-custom">*</span>
              Место работы
            </p>
            <CityAutocomplete
              :options="addresses"
              :isOpen="true"
              :model-value="data.address?.building || data.address?.name || data.area?.name || null"
              :error="validFields.address.status === false"
              @update:model-value="handleAvitoWorkPlaceUpdate"
              placeholder="Начните вводить адрес, а потом выберите из списка"
            />
            <p v-if="validFields.address.status === false" class="text-xs text-red-500 mt-1">
              Выберите город из списка подсказок
            </p>
          </div>

          <div class="w-full mb-6">
            <p class="text-sm font-medium mb-4 leading-normal text-space">Вид договора</p>
            <div class="flex flex-wrap gap-2">
              <button
                v-for="opt in avitoContractOptions"
                :key="opt.id"
                type="button"
                class="px-4 py-2.5 text-sm rounded-ten border transition-colors"
                :class="isAvitoContractSelected(opt)
                  ? 'bg-zumthor border-dodger text-dodger font-normal'
                  : 'bg-athens-gray border-athens text-bali font-normal hover:bg-dodger hover:border-transparent hover:text-white'"
                @click="toggleAvitoContract(opt)"
              >
                {{ opt.name }}
              </button>
            </div>
          </div>

          <div class="w-full mb-6">
            <p class="text-space text-xl font-semibold mb-5">Зарплата</p>
            <div class="flex items-end gap-[10px] mb-6">
              <div class="w-full flex gap-x-2.5">
                <MyInput placeholder="От" type="Number" :model-value="data.salary_range?.from ?? null"
                  @update:model-value="($event) => handleSalaryRangeUpdate('from', $event)" />
                <MyInput placeholder="До" type="Number" :model-value="data.salary_range?.to ?? null"
                  @update:model-value="($event) => handleSalaryRangeUpdate('to', $event)" />
              </div>
              <div class="w-full">
                <p class="text-sm font-medium mb-3.5 text-space">Период выплат</p>
                <DropDownTypes :options="avitoSalaryModeOptions"
                  :selected="avitoSalaryModeOptions.find((opt) => String(opt.id) === String(data.salary_range?.mode?.id)) || null"
                  :model-value="data.salary_range?.mode ?? null"
                  @update:model-value="($event) => handleSalaryRangeUpdate('mode', $event)" />
              </div>
            </div>
            <RadioGroup default-value="past-cash" class="w-full flex gap-[18px] mb-6"
              :model-value="data.salary_range?.gross === true ? 'full-cash' : 'past-cash'"
              @update:model-value="(value) => (data.salary_range = { ...(data.salary_range || {}), gross: value === 'full-cash' })">
              <div class="my-checkbox">
                <Label for="past-cash-avito" class="cursor-pointer flex items-center">
                  <RadioGroupItem id="past-cash-avito" value="past-cash" class="mr-5px" />
                  <p>На руки</p>
                </Label>
              </div>
              <div class="my-checkbox">
                <Label for="full-cash-avito" class="cursor-pointer flex items-center">
                  <RadioGroupItem id="full-cash-avito" value="full-cash" class="mr-5px" />
                  <p>До вычета налогов</p>
                </Label>
              </div>
            </RadioGroup>
            <p class="text-sm font-medium mb-4 leading-normal text-space">Частота выплат</p>
            <div class="mb-6 flex w-full gap-2">
              <button
                v-for="opt in avitoPayoutFrequencyOptions"
                :key="opt.id"
                type="button"
                class="flex-1 px-4 py-2.5 text-sm rounded-ten border transition-colors"
                :class="isAvitoPayoutFrequencyOptionSelected(opt)
                  ? 'bg-zumthor border-dodger text-dodger font-normal'
                  : 'bg-athens-gray border-athens text-bali font-normal hover:bg-dodger hover:border-transparent hover:text-white'"
                @click="handleSalaryRangeUpdate('frequency', { id: opt.id, name: opt.name })"
              >
                {{ opt.name }}
              </button>
            </div>
            <p class="text-sm font-medium mb-3.5 text-space">Что получают сотрудники</p>
            <MultiSelect :options="avitoBonusesOptions" v-model="data.bonuses" defaultValue="Сделайте выбор" :withId="true" />
          </div>

          <div class="mb-25px mt-25px border-t"></div>
          <p class="text-space text-xl font-semibold mb-8">Контакты для связи</p>
          <p class="text-xs text-bali mb-4 leading-normal">
            Укажите сотрудника или телефон из аккаунта Avito — иначе публикация вернёт ошибку «Нет сотрудника с таким номером».
          </p>
          <div class="w-full mb-6">
            <p class="text-sm font-medium mb-4 leading-normal text-space">
              <span class="text-red-custom">*</span>
              Контакт в Avito
            </p>
            <DropDownTypes
              :options="avitoContactEmployeeDropdownOptions"
              :selected="avitoContactEmployeeSelected"
              placeholder="Выберите сотрудника или телефон"
              @update:model-value="onAvitoContactEmployeeSelect"
            />
            <p v-if="avitoContactEmployeesLoading" class="text-xs text-bali mt-2">Загрузка контактов из Avito…</p>
            <p v-else-if="avitoContactEmployeesError" class="text-xs text-red-500 mt-2">{{ avitoContactEmployeesError }}</p>
            <p v-else-if="!avitoContactEmployeeDropdownOptions.length" class="text-xs text-bali mt-2">
              В аккаунте Avito не найдены доступные телефоны. Проверьте привязку в настройках.
            </p>
          </div>
          <div
            v-if="data.avito_contact_employee"
            class="w-full mb-6 rounded-ten border border-athens bg-athens-gray px-4 py-3 text-sm text-space"
          >
            <p class="font-medium">{{ data.executor_name || '—' }}</p>
            <p v-if="data.executor_phone" class="text-bali mt-1">{{ formatAvitoContactPhoneDisplay(data.executor_phone) }}</p>
            <p v-if="data.executor_email" class="text-bali mt-1">{{ data.executor_email }}</p>
          </div>
          <div
            v-if="!fixedModalFooter"
            class="w-full flex flex-wrap items-center justify-start gap-x-15px gap-y-15px mb-6"
          >
            <UiButton @click="savePublication" variant="action" size="semiaction" class="font-semibold">
              {{ isEditingMode ? 'Обновить' : 'Опубликовать' }}
            </UiButton>
            <UiButton
              type="button"
              variant="semiaction"
              size="semiaction"
              class="text-space"
              :disabled="avitoRequestPreviewLoading"
              @click="openAvitoRequestPreview"
            >
              {{ avitoRequestPreviewLoading ? 'Сборка…' : 'Посмотреть запрос' }}
            </UiButton>
            <div class="status" v-if="status">
              {{ status }}
            </div>
            <UiButton variant="semiaction" size="semiaction" class="text-space" @click="emit('cancel')">
              Отмена
            </UiButton>
          </div>
        </template>
        <template v-else>
        <div class="w-full justify-between flex gap-25px mb-6">
          <div id="name" class="w-full anchor">
            <p class="text-sm font-medium mb-4 leading-normal"
              :class="validFields.name.status === false ? 'text-red-custom' : 'text-space'">
              <span class="text-red-custom">*</span>
              <template v-if="currentPlatform === 'hh'">Название</template>
              <template v-else-if="currentPlatform === 'avito'">Название вакансии</template>
              <template v-else>Название должности</template>
            </p>
            <MyInput placeholder="Например, Менеджер по продажам" v-model="data.name"
              @update:model-value="($event) => updateValidField('name', $event.trim() !== '')" />
          </div>
          <div v-if="currentPlatform !== 'hh' && currentPlatform !== 'avito'" class="w-full">
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
            <DropDownRoles :options="Array.isArray(currectRole) ? currectRole : []" :selected="data.industry ?? ''"
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
                <DropDownTypes :options="employmentTypesOptions"
                  :selected="employmentSelectedOption"
                  v-model="data.employment_form"
                  @update:model-value="($event) => handleIdUpdate('employment_form', $event)">
                </DropDownTypes>
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
                :model-value="data.address?.show_metro_only ?? false"
                @update:model-value="(v) => (data.address = { ...(data.address || {}), show_metro_only: v })" />
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
                  <MyInput placeholder="От" type="Number"
                    :model-value="data.salary_range?.from ?? null"
                    @update:model-value="($event) => handleSalaryRangeUpdate('from', $event)" />
                  <MyInput placeholder="До" type="Number"
                    :model-value="data.salary_range?.to ?? null"
                    @update:model-value="($event) => handleSalaryRangeUpdate('to', $event)" />
                </div>
              </div>
              <div class="w-full">
                <p class="text-sm font-medium text-space mb-3.5">Валюта</p>
                <MyDropdown :options="ArrayCurrency"
                  :model-value="ArrayCurrency.find(c => c.id === data.salary_range?.currency)?.value"
                  @update:model-value="($event) => handleSalaryRangeUpdate('currency', ArrayCurrency.find(c => c.value === $event))" />
              </div>
              <div class="w-full">
                <DropDownTypes :options=HH_SALARY_TYPE :selected="HH_SALARY_TYPE[0]"
                  :model-value="data.salary_range?.mode ?? null"
                  @update:model-value="($event) => handleSalaryRangeUpdate('mode', $event)">
                </DropDownTypes>
              </div>
            </div>
            <div class="w-full  items-end justify-between flex mb-6 gap-25px">
              <RadioGroup default-value="past-cash" class="w-full flex gap-[18px]"
                :model-value="data.salary_range?.gross === true ? 'full-cash' : 'past-cash'"
                @update:model-value="(value) => (data.salary_range = { ...(data.salary_range || {}), gross: value === 'full-cash' })">
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
                  :model-value="data.salary_range?.frequency ?? null"
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
          <div
            v-if="!fixedModalFooter"
            class="w-full flex flex-wrap items-center justify-start gap-x-15px gap-y-15px mb-6"
          >
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
          <div v-if="statusValidate === false && !fixedModalFooter" class="w-full text-red-custom mb-6">
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
        </template>
        </div>
        <div
          v-if="fixedModalFooter && statusValidate === false"
          class="w-full shrink-0 border-t border-athens bg-white px-25px py-15px text-red-custom"
        >
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
        <footer
          v-if="fixedModalFooter"
          class="relative z-20 flex shrink-0 flex-wrap items-center justify-between gap-x-15px gap-y-15px rounded-b-fifteen border-t border-athens bg-white px-25px py-15px"
        >
          <div class="flex flex-wrap items-center gap-x-15px gap-y-15px">
            <template v-if="currentPlatform === 'avito'">
              <UiButton type="button" @click="savePublication" variant="action" size="semiaction" class="font-semibold">
                {{ isEditingMode ? 'Обновить' : 'Опубликовать' }}
              </UiButton>
              <UiButton
                type="button"
                variant="semiaction"
                size="semiaction"
                class="text-space"
                :disabled="avitoRequestPreviewLoading"
                @click="openAvitoRequestPreview"
              >
                {{ avitoRequestPreviewLoading ? 'Сборка…' : 'Посмотреть запрос' }}
              </UiButton>
              <div v-if="status" class="status">{{ status }}</div>
              <UiButton type="button" variant="semiaction" size="semiaction" class="text-space" @click="emit('cancel')">
                Отмена
              </UiButton>
            </template>
            <template v-else>
              <template v-if="currentPlatform === 'hh' && tariffsOptions.length > 0">
                <DropDownTypes
                  :options="tariffsOptions"
                  :selected="tariffsOptions[0]"
                  placeholder="Выберите тариф"
                  @update:model-value="($event) => handleTariffUpdate($event)"
                />
              </template>
              <template v-else-if="currentPlatform === 'hh'">
                <DropDownTypes
                  :options="HH_BILLING_TYPES"
                  :selected="data.billing_types"
                  placeholder="Выберите тариф"
                  v-model="data.billing_types"
                />
              </template>
              <UiButton type="button" @click="savePublication" variant="action" size="semiaction" class="font-semibold">
                {{ isEditingMode ? 'Обновить' : 'Опубликовать' }}
              </UiButton>
              <div v-if="status" class="status">{{ status }}</div>
              <UiButton type="button" variant="semiaction" size="semiaction" class="text-space" @click="emit('cancel')">
                Отмена
              </UiButton>
            </template>
          </div>
        </footer>
      </div>
    </div>
  </div>

  <Popup
    :is-open="avitoRequestPreviewOpen"
    width="min(920px, 96vw)"
    :max-height-value="'85vh'"
    :disable-overflow-hidden="true"
    :content-padding="false"
    :no-outer-padding="true"
    :no-scrollbar-gutter="true"
    @close="avitoRequestPreviewOpen = false"
  >
    <div class="flex max-h-[85vh] min-h-0 flex-col overflow-hidden rounded-fifteen bg-white">
      <div class="flex shrink-0 items-center justify-between border-b border-athens px-25px py-15px">
        <div>
          <p class="text-lg font-semibold text-space">Запрос на публикацию в Avito</p>
          <p v-if="avitoRequestPreviewMeta" class="text-xs text-slate-custom mt-1">
            {{ avitoRequestPreviewMeta }}
          </p>
        </div>
        <button
          type="button"
          class="text-slate-custom hover:text-space transition-colors"
          aria-label="Закрыть"
          @click="avitoRequestPreviewOpen = false"
        >
          <svg-icon name="close" width="20" height="20" />
        </button>
      </div>
      <div class="min-h-0 flex-1 overflow-auto px-25px py-15px">
        <p v-if="avitoRequestPreviewError" class="text-sm text-red-custom mb-3">{{ avitoRequestPreviewError }}</p>
        <pre
          v-else
          class="text-[11px] leading-relaxed whitespace-pre-wrap break-words text-slate-custom font-mono"
        >{{ avitoRequestPreviewFormatted }}</pre>
      </div>
      <div class="flex shrink-0 flex-wrap items-center justify-end gap-10px border-t border-athens px-25px py-15px">
        <UiButton
          v-if="avitoRequestPreviewFormatted"
          type="button"
          variant="semiaction"
          size="semiaction"
          class="text-space"
          @click="copyAvitoRequestPreview"
        >
          {{ avitoRequestPreviewCopied ? 'Скопировано' : 'Скопировать JSON' }}
        </UiButton>
        <UiButton type="button" variant="action" size="semiaction" @click="avitoRequestPreviewOpen = false">
          Закрыть
        </UiButton>
      </div>
    </div>
  </Popup>
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
import Popup from '~/components/custom/Popup.vue'
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
import { inject, watch, computed, defineProps, nextTick, onMounted, isRef } from 'vue'

const props = defineProps({
  selectedPlatform: {
    type: String,
    default: null
  },
  editingVacancy: {
    type: Object,
    default: null
  },
  /**
   * Редактирование импортированной активной публикации (не hh): пустая форма как при «Опубликовать»,
   * для Avito — заголовок и профессия из live-снимка при открытии (каталоги подгружаются в loadDictionaries).
   */
  editPublicationLightShell: {
    type: Boolean,
    default: false,
  },
  /** Оболочка как у попапа hh.ru: нижняя панель с кнопками фиксируется при прокрутке */
  fixedModalFooter: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['saved', 'cancel', 'form-ready'])
const isEditingMode = computed(() => props.editingVacancy != null)

/** Служебные / доменные значения вместо названия вакансии (CRM, pivot, поле name у Avito). */
function isAvitoPublicationGarbageName(s) {
  const raw = String(s ?? '').trim()
  const t = raw.toLowerCase()
  if (!t) return true
  if (t === 'avito' || t === 'avito.ru' || t === 'avito.com' || t === 'www.avito.ru' || t === 'www.avito.com') {
    return true
  }
  if (/^https?:\/\/([a-z0-9.-]+\.)?avito\.(ru|com)(\/|\?|#|$)/i.test(raw)) return true
  // только домен без пробелов — не заголовок вакансии
  if (!/\s/.test(t) && /^[a-z0-9.-]*avito\.(ru|com)\/?$/i.test(t)) return true
  return false
}

/** Название для префилла в режиме «лёгкого» редактирования (без служебных «avito.ru» из CRM/pivot). */
function resolveEditingImportedPublicationTitle(v) {
  if (!v) return ''
  const pd = v.platforms_data?.[0]
  const candidates = [
    pd?.publication_title,
    pd?.title,
    pd?.name,
    v.publication_name,
    v.name,
    v.title,
  ]
  for (const c of candidates) {
    const t = c != null ? String(c).trim() : ''
    if (t && !isAvitoPublicationGarbageName(t)) return t
  }
  return 'Вакансия'
}

import {
  getHhProfile as profileHh,
  getAvailableTypes as typesHh,
  addHhDraft as addDraftHh,
  publishHhVacancy as publishVacancyToHh,
  getHhRoles as getRolesHh,
  getAreas as getAreasHh,
  getAddresses as getAddressesHh,
  getAvailablePublications as getAvailablePublicationsHh,
  getPublication as getHhPublicationById,
} from '@/utils/hhAccount'
import {
  addAvitoDraft as addDraftAvito,
  getAvitoProfile as profileAvito,
  publishAvitoVacancy as publishVacancyToAvito,
  getAvitoCatalogs as getAvitoCatalogs,
  getAvitoSpecializationMappings as getAvitoSpecializationMappings,
  getAvitoExperienceMappings as getAvitoExperienceMappings,
  getAvitoEmploymentMappings as getAvitoEmploymentMappings,
  getAvitoContractMappings as getAvitoContractMappings,
  getAvitoSalaryPeriodMappings as getAvitoSalaryPeriodMappings,
  getAvitoSalaryTaxMappings as getAvitoSalaryTaxMappings,
  getAvitoPayoutFrequencyMappings as getAvitoPayoutFrequencyMappings,
  getAvitoContactEmployees as getAvitoContactEmployees,
  buildAvitoPublicationRequestBody,
} from '@/utils/avitoAccount'
import {
  getRabotaProfile as profileRabota,
  addRabotaDraft as addDraftRabota,
  publishRabotaVacancy as publishVacancyToRabota,
  getRabotaPublication,
  getRabotaProfessions as getProfessionsRabota,
  getRegions as getRegionsRabota,
  getEmploymentTypes as getEmploymentTypesRabota,
  getWorkSchedules as getWorkSchedulesRabota,
  getExperienceLevels as getExperienceLevelsRabota,
  getEducationLevels as getEducationLevelsRabota
} from '@/utils/rabotaAccount'
import { updateSuperjobPublication as updatePublicationSuperjob, getSuperjobVacancy, getCatalogues as getSuperjobCatalogues, getTowns as getSuperjobTowns, publishSuperjobVacancy as publishVacancyToSuperjob } from '@/utils/superjobAccount'
import { mapVacancyToSuperjobPayload } from '@/utils/mapVacancyToSuperjob'
import { getVacancy as getVacancyById, resolveDriverNamesToDbIds, getVacancyFields, buildDriverDbIdToNameMap, getRabotaVacancyExportMap, getAvitoPublicationOriginalLocalOnly, getAvitoPublicationOriginalSync, getRabotaPublicationOriginalLocalOnly } from '@/utils/getVacancies';
import {
  resolveAvitoProfessionFromSpecialization,
  unwrapAvitoMappingsPayload,
} from '@/utils/avitoSpecializationMapping';
import {
  AVITO_EXPERIENCE_OPTIONS,
  findAvitoExperienceOption,
  resolveAvitoExperienceFromJobly,
  resolveJoblyExperienceId,
} from '@/utils/avitoExperienceMapping';
import {
  AVITO_POPUP_EMPLOYMENT_OPTIONS,
  normalizeAvitoEmploymentMappedId,
  resolveAvitoEmploymentFromJobly,
  resolveJoblyEmploymentCompositeFromSources,
} from '@/utils/avitoEmploymentMapping';
import {
  AVITO_POPUP_CONTRACT_OPTIONS,
  collectJoblyOformlenieIdsFromList,
  resolveAvitoContractsFromJobly,
  resolveBillingTypeFromContractKeys,
} from '@/utils/avitoContractMapping';
import {
  filterActiveAvitoBusinessAreaCatalog,
  resolveBusinessAreaIdForAvitoApi,
} from '@/utils/avitoBusinessAreaMapping';
import {
  buildAvitoContactEmployeeLabel,
  findAvitoContactEmployeeByPhone,
  formatAvitoPhoneDisplay,
  normalizeAvitoPhoneDigits,
  parseAvitoContactEmployeesResponse,
} from '@/utils/avitoContactEmployees';
import {
  formatDescriptionForAvitoEditor,
  formatDescriptionForAvitoApi,
  needsAvitoDescriptionReformat,
} from '@/utils/avitoDescriptionFormat';
import {
  parseJoblySalaryAmount,
  resolveJoblySalaryGrossWithPriority,
  resolveJoblySalaryRangeFromSources,
  resolveJoblySalaryRangeFromVacancy,
} from '@/utils/avitoSalaryFromJobly';
import { useVacancyCurrectLive } from '@/utils/useVacancyCurrect';
import {
  AVITO_POPUP_SALARY_MODE_OPTIONS,
  findAvitoSalaryModeOption,
  resolveAvitoSalaryPeriodFromJobly,
  resolveJoblySalaryPeriodIdWithPriority,
} from '@/utils/avitoSalaryPeriodMapping';
import {
  resolveAvitoGrossFromJoblyMapping,
  resolveJoblySalaryTaxIdWithPriority,
} from '@/utils/avitoSalaryTaxMapping';
import {
  AVITO_POPUP_PAYOUT_FREQUENCY_OPTIONS,
  findAvitoPayoutFrequencyOption,
  normalizeAvitoPayoutFrequencyIdForPopup,
  resolveAvitoPayoutFrequencyForJoblyVacancy,
  resolveAvitoPayoutFrequencyFromJobly,
  resolveJoblyPayoutFrequencyIdFromVacancy,
  resolveJoblyPayoutFrequencyIdWithPriority,
} from '@/utils/avitoPayoutFrequencyMapping';

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

/** Нормализация имени платформы: hh.ru -> hh, superjob.ru -> superjob и т.д. (без учёта регистра). */
function normalizePlatformName(name) {
  if (name == null || String(name).trim() === '') return null
  const lower = String(name).trim().toLowerCase()
  if (lower === 'hh.ru' || lower === 'hh') return 'hh'
  if (lower === 'avito.ru' || lower === 'avito') return 'avito'
  if (lower === 'rabota.ru' || lower === 'rabota') return 'rabota'
  if (lower === 'superjob.ru' || lower === 'superjob') return 'superjob'
  return lower
}

/** Карточка «Опубликовать» на вкладке размещений — не блокируем рендер запросами к HH; данные вакансии из provide. */
const isNewPublicationFromCard = Boolean(props.selectedPlatform && !props.editingVacancy?.id)
const isNewHhPublicationFromCard =
  isNewPublicationFromCard && normalizePlatformName(props.selectedPlatform) === 'hh'
const isNewAvitoPublicationFromCard =
  isNewPublicationFromCard && normalizePlatformName(props.selectedPlatform) === 'avito'

/** По умолчанию публикация; черновик — только если пользователь отметил чекбокс (в формах, где он есть). */
const isDraft = ref(false)

/** PublishTab не делает provide('platformsGlobal') — без дефолта setup падает на `for (… of platforms.value)`. */
function defaultPlatformsState() {
  return [
    { platform: 'hh', isAuthenticated: false, data: {}, types: undefined },
    { platform: 'avito', isAuthenticated: false, data: {}, types: undefined },
    { platform: 'rabota', isAuthenticated: false, data: {}, types: undefined },
    { platform: 'superjob', isAuthenticated: false, data: {}, types: undefined },
  ]
}
function resolvePlatformsInject() {
  const raw = inject('platformsGlobal', null)
  if (raw == null) return defaultPlatformsState()
  const list = isRef(raw) ? raw.value : raw
  return Array.isArray(list) && list.length > 0 ? list : defaultPlatformsState()
}
const platforms = ref(resolvePlatformsInject())
const isPlatforms = ref(inject('isPlatforms'))
const vacancyData = inject('vacancyCurrect', null)
const vacancyCurrectLive = useVacancyCurrectLive()

function getInjectedVacancyData() {
  const fromInject = vacancyData != null
    ? (isRef(vacancyData) ? vacancyData.value : vacancyData)
    : null
  const live = vacancyCurrectLive.value
  if (live != null && typeof live === 'object') {
    return fromInject != null && typeof fromInject === 'object'
      ? { ...fromInject, ...live }
      : { ...live }
  }
  return fromInject
}
const currectRole = ref(null)
const roleData = ref(null)
const status = ref(null)
const statusValidate = ref(true)
function resolveJoblyVacancyIdForAvitoPublish() {
  const p = route.params?.id
  const q = route.query?.id
  const v = route.query?._vid
  const fromRoute =
    p != null && String(p).trim() !== ''
      ? String(p).trim()
      : q != null && String(q).trim() !== ''
        ? String(q).trim()
        : v != null && String(v).trim() !== ''
          ? String(v).trim()
          : null
  const raw = props.editingVacancy?.id ?? globCurrentVacancy.value?.id ?? fromRoute
  const n = Number(raw)
  return Number.isFinite(n) && n >= 1 ? n : null
}

const avitoRequestPreviewOpen = ref(false)
const avitoRequestPreviewLoading = ref(false)
const avitoRequestPreviewPayload = ref(null)
const avitoRequestPreviewError = ref('')
const avitoRequestPreviewCopied = ref(false)
const avitoRequestPreviewMeta = ref('')

const avitoRequestPreviewFormatted = computed(() => {
  if (!avitoRequestPreviewPayload.value) return ''
  try {
    return JSON.stringify(avitoRequestPreviewPayload.value, null, 2)
  } catch {
    return String(avitoRequestPreviewPayload.value)
  }
})

function resolveAvitoPublicationFormPayloadForPreview() {
  const joblyVacancyId = resolveJoblyVacancyIdForAvitoPublish()
  const platformData = props.editingVacancy?.platforms_data?.[0]
  const vacancyPlatformId =
    platformData?.platform_id != null && String(platformData.platform_id).trim() !== ''
      ? String(platformData.platform_id).trim()
      : ''

  if (vacancyPlatformId) {
    return {
      ...data.value,
      vacancy_platform_id: vacancyPlatformId,
      publication_id: vacancyPlatformId,
      jobly_vacancy_id: props.editingVacancy?.id ?? joblyVacancyId,
    }
  }

  return { ...data.value }
}

async function openAvitoRequestPreview() {
  if (currentPlatform.value !== 'avito') return

  avitoRequestPreviewLoading.value = true
  avitoRequestPreviewError.value = ''
  avitoRequestPreviewCopied.value = false

  try {
    await ensureAvitoContactEmployeesLoaded()

    const formPayload = resolveAvitoPublicationFormPayloadForPreview()
    const joblyVacancyId = resolveJoblyVacancyIdForAvitoPublish()
    const requestBody = buildAvitoPublicationRequestBody(formPayload, joblyVacancyId)

    const publicationId = String(
      requestBody.publication_id ?? requestBody.vacancy_platform_id ?? '',
    ).trim()

    avitoRequestPreviewMeta.value = publicationId
      ? `Наймикс → POST /api/avito/publications → Avito PUT /job/v2/vacancy/${publicationId}`
      : 'Наймикс → POST /api/avito/publications → Avito POST /job/v1/vacancies'

    avitoRequestPreviewPayload.value = {
      _meta: {
        joblyEndpoint: 'POST /api/avito/publications',
        avitoEndpoint: publicationId
          ? `PUT /job/v2/vacancy/${publicationId}`
          : 'POST /job/v1/vacancies',
        joblyVacancyId: joblyVacancyId ?? null,
        publicationId: publicationId || null,
        builtAt: new Date().toISOString(),
      },
      body: requestBody,
    }

    avitoRequestPreviewOpen.value = true
  } catch (err) {
    avitoRequestPreviewError.value =
      err instanceof Error ? err.message : 'Не удалось собрать тело запроса'
    avitoRequestPreviewPayload.value = null
    avitoRequestPreviewOpen.value = true
  } finally {
    avitoRequestPreviewLoading.value = false
  }
}

async function copyAvitoRequestPreview() {
  const text = avitoRequestPreviewFormatted.value
  if (!text) return
  try {
    await navigator.clipboard.writeText(text)
    avitoRequestPreviewCopied.value = true
    setTimeout(() => {
      avitoRequestPreviewCopied.value = false
    }, 2000)
  } catch {
    avitoRequestPreviewError.value = 'Не удалось скопировать в буфер обмена'
  }
}

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
const rabotaExportMapRows = ref([])
const rabotaActivePublication = ref(null)
const rabotaActivePublicationApplied = ref(false)
const joblyVacancyPrefillApplied = ref(false)

function normText(s) {
  return String(s ?? '')
    .replace(/\u00a0/g, ' ')
    .trim()
    .toLowerCase()
}

function findByNameLoose(arr, value) {
  if (!Array.isArray(arr) || value == null || value === '') return null
  const target = normText(value)
  if (!target) return null
  return (
    arr.find((x) => normText(x?.name) === target || normText(x?.title) === target) ||
    arr.find((x) => normText(x?.name).includes(target) || normText(x?.title).includes(target)) ||
    null
  )
}

function applyJoblyVacancyToRabotaForm(vacancy) {
  if (!vacancy || currentPlatform.value !== 'rabota') return

  // Город публикации/размещения: vacancy.location (строка) -> rabotaRegions
  const loc = vacancy.location ?? vacancy.city ?? vacancy.area?.name
  if (typeof loc === 'string' && loc.trim()) {
    const match = findByNameLoose(rabotaRegions.value, loc)
    if (match) {
      const id = match.id ?? match.region_id
      const name = match.name ?? match.title
      if (id != null) {
        data.value.area = { id, name }
        const showMetroOnly = data.value.address?.show_metro_only ?? false
        data.value.address = { id, name, show_metro_only: showMetroOnly }
      }
    }
  }

  // Тип занятости: vacancy.employment (строка) -> rabotaEmploymentTypes
  if (vacancy.employment) {
    const match = findByNameLoose(rabotaEmploymentTypes.value, vacancy.employment)
    if (match) {
      data.value.employment_form = { id: match.id ?? match.employment_type_id, name: match.name ?? match.title }
    }
  }

  // График: vacancy.schedule (строка) -> rabotaWorkSchedules
  if (vacancy.schedule) {
    const match = findByNameLoose(rabotaWorkSchedules.value, vacancy.schedule)
    if (match) {
      data.value.work_schedule_by_days = { id: match.id ?? match.work_schedule_id, name: match.name ?? match.title }
    }
  }

  // Опыт: vacancy.experience (строка) -> rabotaExperienceLevels
  if (vacancy.experience) {
    const match = findByNameLoose(rabotaExperienceLevels.value, vacancy.experience)
    if (match) {
      data.value.experience = { id: match.id ?? match.experience_id, name: match.name ?? match.title, value: match.value ?? match.id }
    }
  }

  // Образование: vacancy.education (строка) -> rabotaEducationLevels
  if (vacancy.education) {
    const match = findByNameLoose(rabotaEducationLevels.value, vacancy.education)
    if (match) {
      data.value.education_level = { id: match.id ?? match.education_id, name: match.name ?? match.title }
    }
  }

  // Специализация: vacancy.specializations (строка) -> rabotaProfessions (как best-effort)
  if (vacancy.specializations) {
    const match = findByNameLoose(rabotaProfessions.value, vacancy.specializations)
    if (match) {
      const id = match.id ?? match.profession_id
      const name = match.name ?? match.title
      data.value.professional_roles = [{ id, name }]
    }
  }

  // Валюта: vacancy.currency может хранить "RUB (рубль)" или "RUR"/"RUB"
  const curRaw = vacancy.currency
  if (curRaw && data.value.salary_range) {
    const byId = ArrayCurrency.value?.find((c) => String(c.id).toUpperCase() === String(curRaw).toUpperCase())
    const byName = ArrayCurrency.value?.find((c) => normText(c.name) === normText(curRaw))
    const hit = byId || byName
    if (hit) data.value.salary_range.currency = hit.id
  }
}

function applyRabotaActivePublicationToForm() {
  if (rabotaActivePublicationApplied.value) return
  const pub = rabotaActivePublication.value
  if (!pub || currentPlatform.value !== 'rabota') return

  // Заголовок/описание
  if (pub.title || pub.name) data.value.name = pub.title || pub.name
  if (pub.description) data.value.description = pub.description

  // Профессия
  const profId = pub.profession_id ?? pub.professionId ?? pub.profession?.id ?? pub.profession?.key
  const profName = pub.profession?.name ?? pub.profession?.title
  if (profId != null || profName) {
    const match = findValueByIdOrName(rabotaProfessions.value, profId ?? profName)
    if (match) {
      data.value.professional_roles = [{ id: match.id ?? match.profession_id, name: match.name ?? match.title }]
    } else if (profId != null) {
      data.value.professional_roles = [{ id: profId, name: profName }]
    }
  }

  // Регион/город публикации + город размещения (если в публикации нет отдельного адреса — используем регион)
  const regionId = pub.region_id ?? pub.regionId ?? pub.region?.id ?? pub.area?.id ?? pub.address?.region_id
  const regionName = pub.region?.name ?? pub.region?.title ?? pub.area?.name
  if (regionId != null) {
    const match = findValueByIdOrName(rabotaRegions.value, regionId)
    const name = match?.name ?? match?.title ?? regionName
    data.value.area = { id: regionId, name }
    // address в форме — это тоже CityAutocomplete; для rabota.ru часто совпадает с городом публикации
    const showMetroOnly = data.value.address?.show_metro_only ?? false
    data.value.address = { id: regionId, name, show_metro_only: showMetroOnly }
  }

  // Классификаторы
  const empId = pub.employment_type_id ?? pub.employmentTypeId ?? pub.employment_type?.id ?? pub.employment?.id
  if (empId != null) {
    const match = findValueByIdOrName(rabotaEmploymentTypes.value, empId)
    if (match) data.value.employment_form = { id: match.id ?? match.employment_type_id, name: match.name ?? match.title }
    else data.value.employment_form = { id: empId }
  }

  const schedId = pub.work_schedule_id ?? pub.workScheduleId ?? pub.work_schedule?.id ?? pub.work_schedule_by_days?.id
  if (schedId != null) {
    const match = findValueByIdOrName(rabotaWorkSchedules.value, schedId)
    if (match) data.value.work_schedule_by_days = { id: match.id ?? match.work_schedule_id, name: match.name ?? match.title }
    else data.value.work_schedule_by_days = { id: schedId }
  }

  const expId = pub.experience_id ?? pub.experienceId ?? pub.experience?.id ?? pub.experience_level?.id
  if (expId != null) {
    const match = findValueByIdOrName(rabotaExperienceLevels.value, expId)
    if (match) data.value.experience = { id: match.id ?? match.experience_id, name: match.name ?? match.title, value: match.value ?? match.id }
    else data.value.experience = { id: expId }
  }

  const eduId = pub.education_id ?? pub.educationId ?? pub.education?.id ?? pub.education_level?.id
  if (eduId != null) {
    const match = findValueByIdOrName(rabotaEducationLevels.value, eduId)
    if (match) data.value.education_level = { id: match.id ?? match.education_id, name: match.name ?? match.title }
    else data.value.education_level = { id: eduId }
  }

  // Зарплата
  const salary = pub.salary ?? pub.salary_range
  if (salary && typeof salary === 'object') {
    data.value.salary_range = {
      ...(data.value.salary_range || {}),
      from: salary.from ?? data.value.salary_range?.from,
      to: salary.to ?? data.value.salary_range?.to,
      currency: salary.currency ?? data.value.salary_range?.currency,
      gross: salary.gross ?? data.value.salary_range?.gross,
    }
  }

  // Навыки
  const skills = pub.skills ?? pub.key_skills
  if (Array.isArray(skills) && skills.length > 0) {
    data.value.key_skills = skills
      .map((s) => (typeof s === 'string' ? s.trim() : (s?.name ?? s?.title ?? String(s ?? '')).trim()))
      .filter(Boolean)
      .map((name) => ({ name }))
  }

  rabotaActivePublicationApplied.value = true
  void nextTick(() => emit('form-ready'))
}

/** Первое непустое строковое поле `title` в дереве JSON (сырой ответ Avito может вкладывать title глубже корня). */
function findFirstAvitoTitleDeep(obj, depth = 0) {
  if (obj == null || depth > 14) return ''
  if (Array.isArray(obj)) {
    for (const item of obj) {
      const t = findFirstAvitoTitleDeep(item, depth + 1)
      if (t) return t
    }
    return ''
  }
  if (typeof obj !== 'object') return ''
  if (obj.title != null) {
    const s = String(obj.title).trim()
    if (s && !isAvitoPublicationGarbageName(s)) return s
  }
  for (const v of Object.values(obj)) {
    if (v != null && typeof v === 'object') {
      const t = findFirstAvitoTitleDeep(v, depth + 1)
      if (t) return t
    }
  }
  return ''
}

/**
 * Заголовок для формы: в приоритете `title` из сырого ответа Avito; `name` — только если не похоже на URL/заглушку
 * (см. mapAvitoPublicationToVacancy: там используется title || name).
 */
function avitoPublicationTitleOnly(pub) {
  if (!pub || typeof pub !== 'object') return ''
  const params = typeof pub.params === 'object' && pub.params != null ? pub.params : null
  const t0 = pub.title != null ? String(pub.title).trim() : ''
  if (t0 && !isAvitoPublicationGarbageName(t0)) return t0
  const tParams = params?.title != null ? String(params.title).trim() : ''
  if (tParams && !isAvitoPublicationGarbageName(tParams)) return tParams
  const deep = findFirstAvitoTitleDeep(pub)
  if (deep && !isAvitoPublicationGarbageName(deep)) return deep
  for (const key of ['job_title', 'vacancy_title', 'heading']) {
    const v = pub[key]
    if (v != null && String(v).trim() !== '') {
      const x = String(v).trim()
      if (!isAvitoPublicationGarbageName(x)) return x
    }
    if (params && params[key] != null && String(params[key]).trim() !== '') {
      const x = String(params[key]).trim()
      if (!isAvitoPublicationGarbageName(x)) return x
    }
  }
  if (pub.name != null) {
    const n = String(pub.name).trim()
    if (n && !isAvitoPublicationGarbageName(n)) return n
  }
  if (params?.name != null) {
    const n = String(params.name).trim()
    if (n && !isAvitoPublicationGarbageName(n)) return n
  }
  return ''
}

function avitoPublicationDescriptionOnly(pub) {
  if (!pub || typeof pub !== 'object') return ''
  const params = typeof pub.params === 'object' && pub.params != null ? pub.params : null
  const candidates = [
    pub.description,
    pub.description_original,
    pub.html_description,
    pub.body_description,
    pub.text,
    params?.description,
    params?.description_original,
    params?.text,
  ]
  for (const c of candidates) {
    const s = c != null ? String(c).trim() : ''
    if (s) return s
  }
  return ''
}

function normalizeReadyConsiderText(v) {
  return String(v ?? '')
    .toLowerCase()
    .replace(/ё/g, 'е')
    .replace(/\s+/g, ' ')
    .trim()
}

const AVITO_READY_CONSIDER_OPTIONS = [
  { id: 'age_restriction_45', name: 'Соискатели старше 45 лет' },
  { id: 'age_restriction_14', name: 'Соискатели от 14 лет' },
  { id: 'age_restriction_16', name: 'Соискатели от 16 лет' },
  { id: 'accept_handicapped', name: 'С нарушениями здоровья' },
  { id: 'accept_students', name: 'Для студентов' },
  { id: 'accept_pensioners', name: 'Для пенсионеров' },
]

function extractAvitoReadyConsiderRawValues(pub) {
  if (!pub || typeof pub !== 'object') return []
  const params = typeof pub.params === 'object' && pub.params != null ? pub.params : null
  const candidates = [
    pub.age_preferences,
    pub.ready_to_consider,
    pub.ready_consider,
    pub.additional_conditions,
    pub.consider_candidates,
    params?.age_preferences,
    params?.ready_to_consider,
    params?.ready_consider,
    params?.additional_conditions,
    params?.consider_candidates,
  ]
  for (const c of candidates) {
    if (Array.isArray(c) && c.length > 0) {
      return c.map((x) => (typeof x === 'string' ? x : (x?.name ?? x?.title ?? x?.id ?? x?.value ?? ''))).filter(Boolean)
    }
    if (typeof c === 'string' && c.trim() !== '') {
      return c.split(',').map((x) => x.trim()).filter(Boolean)
    }
  }
  return []
}

function resolveReadyConsiderOptionByRawValue(rawValue) {
  const source = normalizeReadyConsiderText(rawValue)
  if (!source || !Array.isArray(AVITO_READY_CONSIDER_OPTIONS)) return null
  const options = AVITO_READY_CONSIDER_OPTIONS
  const byNameExact = options.find((opt) => normalizeReadyConsiderText(opt?.name) === source)
  if (byNameExact) return byNameExact

  const keywordPredicates = [
    { test: (s) => s.includes('45'), match: (n) => n.includes('45') },
    { test: (s) => s.includes('14'), match: (n) => n.includes('14') },
    { test: (s) => s.includes('16'), match: (n) => n.includes('16') },
    {
      test: (s) => s.includes('наруш') || s.includes('здоров'),
      match: (n, id) => n.includes('наруш') || n.includes('здоров') || String(id) === 'accept_handicapped',
    },
    {
      test: (s) => s.includes('студент'),
      match: (n, id) => n.includes('студент') || String(id) === 'accept_students',
    },
    {
      test: (s) => s.includes('пенсион'),
      match: (n, id) => n.includes('пенсион') || String(id) === 'accept_pensioners',
    },
  ]
  for (const rule of keywordPredicates) {
    if (!rule.test(source)) continue
    const hit = options.find((opt) => rule.match(normalizeReadyConsiderText(opt?.name), opt?.id))
    if (hit) return hit
  }
  return null
}

function applyAvitoReadyConsiderFromPublication(pub) {
  const rawItems = extractAvitoReadyConsiderRawValues(pub)
  if (!rawItems.length) return
  const resolved = rawItems
    .map((item) => resolveReadyConsiderOptionByRawValue(item))
    .filter(Boolean)
    .map((opt) => ({ id: opt.id, name: opt.name }))

  const uniq = []
  const seen = new Set()
  for (const item of resolved) {
    const key = String(item?.id ?? '')
    if (!key || seen.has(key)) continue
    seen.add(key)
    uniq.push(item)
  }
  if (uniq.length > 0) {
    data.value.additional_conditions = uniq
  }
}

function formatAvitoDescriptionForEditor(raw) {
  return formatDescriptionForAvitoEditor(raw)
}

function extractDescriptionOriginalFromSnapshotOriginal(original) {
  if (!original) return ''
  const collect = Array.isArray(original) ? original : [original]
  for (const item of collect) {
    if (!item || typeof item !== 'object') continue
    const s = item.description_original != null ? String(item.description_original).trim() : ''
    if (s) return s
  }
  return ''
}

/** Ответ GET /avito/publications/:id может быть обёрнут в result/item/data — разворачиваем до «плоской» вакансии.
 * Снимок из БД (payload_original Job API) часто без корневого `id`, но с `title` + `profession` — не требуем `id` для «листа». */
function unwrapAvitoPublicationPayload(raw) {
  if (raw == null || typeof raw !== 'object') return null
  const looksLikeLeafVacancy =
    (typeof raw.name === 'string' && raw.name.trim() !== '') ||
    (typeof raw.title === 'string' && raw.title.trim() !== '') ||
    (raw.description != null && String(raw.description).trim() !== '') ||
    raw.profession != null ||
    (typeof raw.url === 'string' && raw.url.trim() !== '')
  if (looksLikeLeafVacancy) {
    return raw
  }
  const pickNested = (r) => {
    const res = r.result
    if (Array.isArray(res) && res.length > 0 && typeof res[0] === 'object') return res[0]
    if (res && typeof res === 'object') return res
    if (Array.isArray(r.items) && r.items.length > 0 && typeof r.items[0] === 'object') return r.items[0]
    if (Array.isArray(r.resources) && r.resources.length > 0 && typeof r.resources[0] === 'object') {
      return r.resources[0]
    }
    return (
      r.item ??
      r.vacancy ??
      r.publication ??
      r.resource ??
      r.ad ??
      (typeof r.body === 'object' && r.body !== null ? r.body : null)
    )
  }
  const nested = pickNested(raw)
  if (nested && typeof nested === 'object' && nested !== raw) {
    return unwrapAvitoPublicationPayload(nested)
  }
  if (raw.data && typeof raw.data === 'object' && !Array.isArray(raw.data)) {
    return unwrapAvitoPublicationPayload(raw.data)
  }
  return raw
}

/** Вытащить числовой/строковый id профессии из значения Avito (число, строка или объект справочника). */
function normalizeAvitoProfessionScalar(raw) {
  if (raw == null || raw === '') return null
  if (typeof raw === 'number' && !Number.isNaN(raw)) return raw
  if (typeof raw === 'string' && raw.trim() !== '') return raw.trim()
  if (typeof raw === 'object') {
    const id = raw.id ?? raw.value ?? raw.key ?? raw.profession_id ?? raw.dictionary_id
    if (id != null && id !== '') return id
  }
  return null
}

/**
 * ID профессии из сырого объекта публикации Avito (корень или params; Job API может отдавать profession как int или { key }).
 */
function resolveAvitoPublicationProfessionId(pub) {
  if (!pub || typeof pub !== 'object') return null
  const params = typeof pub.params === 'object' && pub.params != null ? pub.params : null
  const candidates = [
    pub.profession,
    pub.profession_id,
    pub.professionId,
    params?.profession,
    params?.profession_id,
    params?.professionId,
    pub.specialization,
    params?.specialization,
    pub.speciality_id,
    pub.specialityId,
    params?.speciality_id,
    params?.specialityId,
  ]
  for (const c of candidates) {
    const n = normalizeAvitoProfessionScalar(c)
    if (n != null && String(n).trim() !== '') return n
  }
  const cat = pub.category ?? params?.category
  if (cat != null && typeof cat === 'object') {
    const n = normalizeAvitoProfessionScalar(cat.id ?? cat.value ?? cat.key)
    if (n != null && String(n).trim() !== '') return n
  }
  if (typeof cat === 'number' || (typeof cat === 'string' && cat.trim() !== '')) {
    return normalizeAvitoProfessionScalar(cat)
  }
  return null
}

function resolveAvitoPublicationProfessionName(pub) {
  if (!pub || typeof pub !== 'object') return ''
  const params = typeof pub.params === 'object' && pub.params != null ? pub.params : null
  const profObj = typeof pub.profession === 'object' && pub.profession != null ? pub.profession : null
  const pProf = typeof params?.profession === 'object' && params.profession != null ? params.profession : null
  const specObj =
    typeof pub.specialization === 'object' && pub.specialization != null ? pub.specialization : null
  const n =
    pub.profession_name ??
    pub.professionName ??
    (profObj?.name ?? profObj?.title) ??
    (pProf?.name ?? pProf?.title) ??
    (specObj?.name ?? specObj?.title) ??
    params?.profession_name ??
    params?.professionName
  return n != null ? String(n).trim() : ''
}

/** Подставить профессию в форму по снимку Avito (после загрузки avitoProfessions). Данные с бэкенда (`payload_original`), не прямой запрос к Avito с браузера. */
function applyAvitoProfessionFromPublication(pub) {
  if (!pub || typeof pub !== 'object') return
  let profId = resolveAvitoPublicationProfessionId(pub)
  let profName = resolveAvitoPublicationProfessionName(pub)
  const list = avitoProfessions.value
  const hasCatalog = Array.isArray(list) && list.length > 0
  const profIdStr = profId != null ? String(profId).trim() : ''
  const profIdLooksLikeName =
    profId != null &&
    typeof profId === 'string' &&
    profIdStr !== '' &&
    /[^\d]/.test(profIdStr)

  if (!profName && profIdLooksLikeName) {
    profName = profIdStr
  }

  if (hasCatalog && profName) {
    const match = findValueByIdOrName(list, profName)
    if (match) {
      profId = match.id ?? match.profession_id
      profName = match.name ?? match.title ?? profName
    }
  }

  if (profId == null || String(profId).trim() === '') return

  if (!hasCatalog) {
    if (!profName && profIdStr) profName = profIdStr
    data.value.professional_roles = [{ id: profId, name: profName }]
    return
  }
  const match = findValueByIdOrName(list, profId) || (profName ? findValueByIdOrName(list, profName) : null)
  if (match) {
    data.value.professional_roles = [{ id: match.id, name: match.name ?? match.title }]
  } else {
    if (!profName && profIdStr) profName = profIdStr
    data.value.professional_roles = [{ id: profId, name: profName }]
  }
}

function shouldPreferJoblyVacancyTitleForAvito() {
  const selected = normalizePlatformName(props.selectedPlatform)
  const isPublishCardAvito = Boolean(props.selectedPlatform && !props.editingVacancy?.id && selected === 'avito')
  return isPublishCardAvito || Boolean(props.editPublicationLightShell)
}

/** Зарплату (налоги, период) берём из вакансии Наймикс, а не из снимка Avito — кроме редактирования уже опубликованного объявления. */
function shouldApplyJoblySalaryFieldsToAvito() {
  if (currentPlatform.value !== 'avito') return false
  if (shouldPreferJoblyVacancyTitleForAvito()) return true
  const pd = props.editingVacancy?.platforms_data?.[0]
  const isEditingAvitoPublication =
    pd?.id === 2 &&
    pd?.platform_id != null &&
    String(pd.platform_id).trim() !== ''
  return !isEditingAvitoPublication
}

/** Пустой шаблон редактора (как в TiptapEditor / InfoTab) — не считаем «описанием вакансии». */
const AVITO_EMPTY_DESCRIPTION_TEMPLATE = `<p>Обязанности:</p>
      <ul>
        <li></li>
        <li></li>
      </ul>
      <p>Требования:</p>
      <ul>
        <li></li>
        <li></li>
      </ul>
      <p>Условия:</p>
      <ul>
        <li></li>
        <li></li>
      </ul>`

function stripDescriptionHtmlToText(html) {
  return String(html ?? '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\u00a0/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
}

function isAvitoDescriptionPlaceholder(html) {
  const normalized = stripDescriptionHtmlToText(html)
  if (!normalized) return true
  const emptyNorm = stripDescriptionHtmlToText(AVITO_EMPTY_DESCRIPTION_TEMPLATE)
  if (normalized === emptyNorm) return true
  const markers = ['обязанности', 'требования', 'условия']
  if (!markers.every((m) => normalized.includes(m))) return false
  const withoutHeaders = normalized
    .replace(/обязанности:?/g, '')
    .replace(/требования:?/g, '')
    .replace(/условия:?/g, '')
    .replace(/[^\p{L}\p{N}]+/gu, '')
  return withoutHeaders.length < 8
}

function resolveJoblyDescriptionForAvitoForm() {
  const injected = getInjectedVacancyData()
  const raw =
    globCurrentVacancy.value?.description ??
    injected?.description ??
    globCurrentVacancy.value?.html_description ??
    injected?.html_description
  return String(raw ?? '').trim()
}

function applyAvitoDescriptionFromJobly() {
  if (currentPlatform.value !== 'avito') return
  const joblyDesc = resolveJoblyDescriptionForAvitoForm()
  const current = String(data.value.description ?? '').trim()

  const source =
    joblyDesc && !isAvitoDescriptionPlaceholder(joblyDesc)
      ? joblyDesc
      : current && !isAvitoDescriptionPlaceholder(current)
        ? current
        : ''
  if (!source) return

  if (
    current &&
    !isAvitoDescriptionPlaceholder(current) &&
    !needsAvitoDescriptionReformat(current) &&
    (!joblyDesc || isAvitoDescriptionPlaceholder(joblyDesc) || !needsAvitoDescriptionReformat(joblyDesc))
  ) {
    return
  }

  data.value.description = formatAvitoDescriptionForEditor(source)
  updateDescriptionValidation(data.value.description)
}

function collectJoblySalarySources() {
  return [
    data.value,
    globCurrentVacancy.value,
    getInjectedVacancyData(),
  ]
}

function collectJoblyContactSources() {
  const injected = getInjectedVacancyData()
  const glob = globCurrentVacancy.value
  const out = []
  if (injected && typeof injected === 'object') out.push(injected)
  if (glob && typeof glob === 'object' && glob !== injected) out.push(glob)
  return out
}

function pickJoblyContactString(sources, key) {
  for (const src of sources) {
    const raw = src?.[key]
    if (raw == null) continue
    if (typeof raw === 'object') {
      const nested = raw?.name ?? raw?.value ?? raw?.number
      const s = String(nested ?? '').trim()
      if (s) return s
      continue
    }
    const s = String(raw).trim()
    if (s) return s
  }
  return ''
}

/** Контакты: только сотрудник/телефон из аккаунта Avito (не произвольный номер из Наймикс). */
function applyAvitoContactsFromJobly() {
  if (currentPlatform.value !== 'avito') return
  if (!shouldApplyJoblySalaryFieldsToAvito()) return
  void ensureAvitoContactEmployeesLoaded().then(() => {
    tryAutoSelectAvitoContactFromJobly()
  })
}

function applyAvitoSalaryFromJobly() {
  if (currentPlatform.value !== 'avito') return

  const resolved = resolveJoblySalaryRangeFromSources(collectJoblySalarySources())
  if (!resolved || (resolved.from == null && resolved.to == null)) {
    void applyAvitoMappedSalaryTaxFromJobly()
    return
  }

  const preferJobly = shouldPreferJoblyVacancyTitleForAvito()
  const curFrom = parseJoblySalaryAmount(data.value.salary_range?.from)
  const curTo = parseJoblySalaryAmount(data.value.salary_range?.to)
  if (!preferJobly && (curFrom != null || curTo != null)) return

  if (!data.value.salary_range) data.value.salary_range = { from: null, to: null }
  if (resolved.from != null) data.value.salary_range.from = resolved.from
  if (resolved.to != null) data.value.salary_range.to = resolved.to

  if (resolved.currency != null && data.value.salary_range.currency == null) {
    const curRaw = resolved.currency
    const curStr = typeof curRaw === 'object' && curRaw != null
      ? String((curRaw).id ?? (curRaw).name ?? '').trim()
      : String(curRaw).trim()
    if (curStr) {
      const byId = ArrayCurrency.value?.find((c) => String(c.id).toUpperCase() === curStr.toUpperCase())
      const byName = ArrayCurrency.value?.find((c) => String(c.name).trim() === curStr)
      const hit = byId || byName
      if (hit) data.value.salary_range.currency = hit.id
    }
  }
  void applyAvitoMappedSalaryTaxFromJobly()
}

function resolveJoblySalaryTaxIdForAvitoPrefill() {
  const preferJobly = shouldPreferJoblyVacancyTitleForAvito()
  return resolveJoblySalaryTaxIdWithPriority({
    injected: getInjectedVacancyData(),
    glob: globCurrentVacancy.value,
    preferInjectedOnly: preferJobly,
  })
}

async function ensureAvitoSalaryTaxMappingsLoaded() {
  const existing = unwrapAvitoMappingsPayload(avitoSalaryTaxMappings.value)
  if (Object.keys(existing).length > 0) return
  const res = await getAvitoSalaryTaxMappings()
  if (res?.data && !res.error) {
    avitoSalaryTaxMappings.value = unwrapAvitoMappingsPayload(res.data)
  }
}

async function applyAvitoMappedSalaryTaxFromJobly() {
  if (currentPlatform.value !== 'avito') return
  const generation = ++avitoSalaryTaxApplyGeneration
  await ensureAvitoSalaryTaxMappingsLoaded()
  if (generation !== avitoSalaryTaxApplyGeneration) return
  if (!data.value.salary_range) data.value.salary_range = { from: null, to: null }

  const useJobly = shouldApplyJoblySalaryFieldsToAvito()
  const joblyId = resolveJoblySalaryTaxIdForAvitoPrefill()
  let gross = joblyId
    ? resolveAvitoGrossFromJoblyMapping({
      sourceIds: [joblyId],
      mappingsRaw: unwrapAvitoMappingsPayload(avitoSalaryTaxMappings.value),
    })
    : undefined
  if (typeof gross !== 'boolean') {
    gross = resolveJoblySalaryGrossWithPriority({
      injected: getInjectedVacancyData(),
      glob: globCurrentVacancy.value,
      preferInjectedOnly: shouldPreferJoblyVacancyTitleForAvito(),
    })
  }
  if (typeof gross !== 'boolean') {
    if (!useJobly) return
    gross = false
  }
  if (!useJobly && data.value.salary_range.gross != null) return
  if (generation !== avitoSalaryTaxApplyGeneration) return
  data.value.salary_range.gross = gross
}

function applyAvitoGrossFromJobly() {
  void applyAvitoMappedSalaryTaxFromJobly()
}

function resolveJoblyWorkAddressForAvitoForm() {
  const injected = getInjectedVacancyData()
  const raw =
    globCurrentVacancy.value?.work_address ??
    globCurrentVacancy.value?.workAddress ??
    injected?.work_address ??
    injected?.workAddress ??
    data.value.workAddress
  return String(raw ?? '').trim()
}

function applyAvitoWorkPlaceFromAddressText(addressText) {
  const text = String(addressText ?? '').trim()
  if (!text) return

  const normalize = (v) => String(v ?? '').trim().toLowerCase()
  const cityFromAddress = text.split(',')[0]?.trim() || ''
  const showMetroOnly = data.value.address?.show_metro_only ?? false

  const byCityName = Array.isArray(addresses.value)
    ? addresses.value.find((c) => normalize(c?.name) === normalize(cityFromAddress))
    : null

  if (byCityName?.id != null) {
    data.value.address = {
      ...(data.value.address || {}),
      id: byCityName.id,
      name: byCityName.name,
      building: text,
      show_metro_only: showMetroOnly,
    }
    data.value.area = { id: byCityName.id, name: byCityName.name }
  } else {
    const fallbackCity = cityFromAddress || text
    data.value.address = {
      ...(data.value.address || {}),
      name: fallbackCity,
      building: text,
      show_metro_only: showMetroOnly,
    }
    data.value.area = { ...(data.value.area || {}), name: fallbackCity }
  }
  updateValidField('address', true)
  updateValidField('area', !!data.value.area?.id)
}

function applyAvitoWorkPlaceFromJobly() {
  if (currentPlatform.value !== 'avito') return
  const joblyAddr = resolveJoblyWorkAddressForAvitoForm()
  if (!joblyAddr) return

  const current = String(data.value.address?.building ?? data.value.address?.name ?? '').trim()
  if (shouldPreferJoblyVacancyTitleForAvito()) {
    applyAvitoWorkPlaceFromAddressText(joblyAddr)
    return
  }
  if (!current) {
    applyAvitoWorkPlaceFromAddressText(joblyAddr)
  }
}

function resolveJoblyTitleForAvitoForm() {
  const injected = getInjectedVacancyData()
  const rawName =
    globCurrentVacancy.value?.name ??
    injected?.name ??
    injected?.title ??
    injected?.vacancy_name ??
    injected?.vacancyTitle ??
    injected?.position ??
    injected?.position_name
  return String(rawName ?? '').trim()
}

/**
 * После загрузки каталогов Avito подставляем текст и поля из объявления на стороне Avito
 * (как для rabota.ru: getRabotaPublication + applyRabotaActivePublicationToForm).
 */
function applyAvitoActivePublicationToForm() {
  if (avitoActivePublicationApplied.value) return
  const raw = avitoActivePublication.value
  if (!raw || currentPlatform.value !== 'avito') return
  const pub = unwrapAvitoPublicationPayload(raw)
  if (!pub || typeof pub !== 'object') return
  const roleBefore = data.value.professional_roles?.[0]

  const joblyTitle = resolveJoblyTitleForAvitoForm()
  if (shouldPreferJoblyVacancyTitleForAvito() && joblyTitle) {
    data.value.name = joblyTitle
  } else {
    const title = avitoPublicationTitleOnly(pub)
    if (title) {
      data.value.name = title
    } else {
      const cur = String(data.value.name ?? '').trim()
      if (cur && isAvitoPublicationGarbageName(cur) && props.editingVacancy) {
        data.value.name = resolveEditingImportedPublicationTitle(props.editingVacancy)
      }
    }
  }

  const joblyDesc = resolveJoblyDescriptionForAvitoForm()
  const desc =
    pub.description ??
    pub.html_description ??
    pub.body_description ??
    pub.text ??
    (typeof pub.params === 'object' && pub.params != null ? (pub.params.description ?? pub.params.text) : null)
  if (shouldPreferJoblyVacancyTitleForAvito() && joblyDesc && !isAvitoDescriptionPlaceholder(joblyDesc)) {
    data.value.description = formatAvitoDescriptionForEditor(joblyDesc)
  } else if (desc != null && String(desc).trim() !== '') {
    data.value.description = formatAvitoDescriptionForEditor(desc)
  }

  const params = typeof pub.params === 'object' && pub.params != null ? pub.params : null

  applyAvitoProfessionFromPublication(pub)
  applyAvitoReadyConsiderFromPublication(pub)

  const ba = pub.business_area ?? pub.businessArea ?? params?.business_area
  const baNum = ba != null && typeof ba === 'object' ? (ba.id ?? ba.value) : ba
  if (baNum != null && Array.isArray(currectRole.value)) {
    const apiId = resolveBusinessAreaIdForAvitoApi(baNum, avitoBusinessAreas.value)
    const baNorm = String(baNum).trim().toLowerCase()
    const match = apiId != null
      ? currectRole.value.find((a) => String(a.id) === String(apiId))
      : currectRole.value.find((a) =>
        String(a.id) === String(baNum) ||
        String(a.name ?? '').trim().toLowerCase() === baNorm
      )
    if (match) {
      data.value.industry = { ...match }
    } else if (apiId != null) {
      data.value.industry = { id: apiId, name: String(baNum) }
    }
  }

  const expRaw =
    pub.experience?.id ??
    pub.experience?.name ??
    pub.experience?.title ??
    pub.experience_id ??
    pub.experience ??
    params?.experience
  const expHit = resolveAvitoExperienceOption(expRaw)
  if (expHit) {
    data.value.experience = { id: expHit.id, name: expHit.name, value: expHit.id }
  }

  applyAvitoEmploymentFromPublication(pub)
  if (shouldPreferJoblyVacancyTitleForAvito()) {
    void applyAvitoMappedContractFromJobly()
    applyAvitoSalaryFromJobly()
    applyAvitoContactsFromJobly()
  } else {
    applyAvitoRegistrationMethodFromPublication(pub)
    applyAvitoSalaryFromPublication(pub)
    applyAvitoSalaryModeFromPublication(pub)
    applyAvitoPayoutFrequencyFromPublication(pub)
    applyAvitoTaxesFromPublication(pub)
    applyAvitoContactsFromPublication(pub)
  }
  applyAvitoBonusesFromPublication(pub)

  const schedId =
    pub.schedule?.id ??
    pub.schedule_id ??
    (typeof pub.schedule === 'string' ? pub.schedule : null) ??
    params?.schedule
  if (schedId != null) {
    const opts = workSchedulesOptions.value || []
    const schedNorm = String(schedId).trim().toLowerCase()
    const match = findValueByIdOrName(opts, schedId) || opts.find((o) => String(o?.name ?? '').trim().toLowerCase() === schedNorm)
    if (match) {
      data.value.work_schedule_by_days = { id: match.id, name: match.name }
    } else {
      data.value.work_schedule_by_days = { id: String(schedId), name: String(schedId) }
    }
  }

  if (shouldPreferJoblyVacancyTitleForAvito()) {
    applyAvitoWorkPlaceFromJobly()
  } else {
    applyAvitoWorkPlaceFromPublication(pub)
  }

  const eduRaw = pub.education ?? pub.education_level
  const eduStr = typeof eduRaw === 'string' ? eduRaw : eduRaw?.id
  const avitoEduToHh = {
    SECONDARY: 'secondary',
    SECONDARY_SPECIAL: 'special_secondary',
    UNFINISHED_HIGHER: 'unfinished_higher',
    HIGHER: 'higher',
  }
  const hhEduId = eduStr != null ? avitoEduToHh[String(eduStr).toUpperCase()] : null
  if (hhEduId) {
    const eduHit = HH_EDUCATION_LAVEL.find((e) => e.id === hhEduId)
    if (eduHit) {
      data.value.education_level = { ...eduHit }
    }
  }

  const skills = pub.key_skills ?? pub.skills
  if (Array.isArray(skills) && skills.length > 0) {
    data.value.key_skills = skills
      .map((s) => (typeof s === 'string' ? s.trim() : (s?.name ?? s?.title ?? String(s ?? '')).trim()))
      .filter(Boolean)
      .map((name) => ({ name }))
  }
  const roleAfter = data.value.professional_roles?.[0]
  const roleIdAfter = roleAfter?.id != null ? String(roleAfter.id).trim() : ''
  const roleChanged =
    String(roleBefore?.id ?? '') !== String(roleAfter?.id ?? '') ||
    String(roleBefore?.name ?? '') !== String(roleAfter?.name ?? '')
  const avitoCatalogReady = Array.isArray(avitoProfessions.value) && avitoProfessions.value.length > 0
  if (!roleIdAfter && !roleChanged && !avitoCatalogReady) {
    // Дадим повторно применить снимок после догрузки каталогов/маппингов, чтобы профессия не «залипала» пустой.
    avitoActivePublicationApplied.value = false
    return
  }
  avitoActivePublicationApplied.value = true
}

/** После каталогов Avito: профессия из live-снимка для лёгкого редактирования импорта. */
function applyAvitoLightEditProfessionIfNeeded() {
  if (!props.editPublicationLightShell || currentPlatform.value !== 'avito') return
  const pub = avitoLightEditLivePublication.value
  if (!pub || typeof pub !== 'object') return
  try {
    const params = typeof pub.params === 'object' && pub.params != null ? pub.params : null
    applyAvitoProfessionFromPublication(pub)
    applyAvitoReadyConsiderFromPublication(pub)
    applyAvitoEmploymentFromPublication(pub)
    if (shouldPreferJoblyVacancyTitleForAvito()) {
      void applyAvitoMappedContractFromJobly()
      applyAvitoSalaryFromJobly()
      applyAvitoContactsFromJobly()
      applyAvitoWorkPlaceFromJobly()
    } else {
      applyAvitoRegistrationMethodFromPublication(pub)
      applyAvitoSalaryFromPublication(pub)
      applyAvitoSalaryModeFromPublication(pub)
      applyAvitoWorkPlaceFromPublication(pub)
      applyAvitoPayoutFrequencyFromPublication(pub)
      applyAvitoTaxesFromPublication(pub)
      applyAvitoContactsFromPublication(pub)
    }
    applyAvitoBonusesFromPublication(pub)

    const ba = pub.business_area ?? pub.businessArea ?? params?.business_area
    const baId = ba != null && typeof ba === 'object' ? (ba.id ?? ba.value ?? ba.name ?? ba.title) : ba
    if (baId != null && Array.isArray(currectRole.value)) {
      const apiId = resolveBusinessAreaIdForAvitoApi(baId, avitoBusinessAreas.value)
      const baNorm = String(baId).trim().toLowerCase()
      const match = apiId != null
        ? currectRole.value.find((area) => String(area?.id ?? '').trim() === String(apiId))
        : currectRole.value.find((area) =>
          String(area?.id ?? '').trim() === String(baId).trim() ||
          String(area?.name ?? '').trim().toLowerCase() === baNorm
        )
      if (match) {
        data.value.industry = { ...match }
      } else if (apiId != null) {
        data.value.industry = { id: apiId, name: String(baId) }
      }
    }

    const expRaw =
      pub.experience?.id ??
      pub.experience?.name ??
      pub.experience?.title ??
      pub.experience_id ??
      pub.experience ??
      params?.experience
    const expHit = resolveAvitoExperienceOption(expRaw)
    if (expHit) {
      data.value.experience = { id: expHit.id, name: expHit.name, value: expHit.id }
    }
  } finally {
    avitoLightEditLivePublication.value = null
  }
}

// Справочники для avito.ru
const avitoProfessions = ref([])
const avitoBusinessAreas = ref([])
const avitoContactEmployees = ref([])
const avitoContactEmployeesLoading = ref(false)
const avitoContactEmployeesError = ref('')
let avitoContactEmployeesLoadPromise = null

const avitoContactEmployeeDropdownOptions = computed(() =>
  avitoContactEmployees.value.map((row) => ({
    id: row.id,
    name: row.label || buildAvitoContactEmployeeLabel(row.name, row.phone),
    description: row.email || undefined,
    employee_id: row.employee_id,
    phone: row.phone,
    email: row.email,
  })),
)

const avitoContactEmployeeSelected = computed(() => {
  const current = data.value.avito_contact_employee
  if (!current?.id) return null
  return (
    avitoContactEmployeeDropdownOptions.value.find((o) => String(o.id) === String(current.id)) ?? {
      id: current.id,
      name: buildAvitoContactEmployeeLabel(current.name, current.phone),
    }
  )
})

function formatAvitoContactPhoneDisplay(phone) {
  return formatAvitoPhoneDisplay(phone)
}

function applyAvitoContactEmployeeSelection(option) {
  if (!option) {
    data.value.avito_contact_employee = null
    data.value.avito_contact_employee_id = null
    data.value.executor_name = ''
    data.value.executor_phone = ''
    data.value.executor_email = null
    return
  }
  const hit =
    avitoContactEmployees.value.find((row) => String(row.id) === String(option.id)) ?? {
      id: option.id,
      name: option.name,
      phone: option.phone,
      email: option.email,
      employee_id: option.employee_id,
    }
  data.value.avito_contact_employee = { ...hit }
  data.value.avito_contact_employee_id = hit.employee_id ?? null
  data.value.executor_name = hit.name || ''
  data.value.executor_phone = hit.phone || ''
  data.value.executor_email = hit.email || null
}

function onAvitoContactEmployeeSelect(option) {
  applyAvitoContactEmployeeSelection(option)
}

function applyDefaultAvitoContactEmployeeIfEmpty() {
  if (data.value.avito_contact_employee?.phone) return
  const first = avitoContactEmployees.value[0]
  if (!first) return
  applyAvitoContactEmployeeSelection({
    id: first.id,
    name: first.name,
    phone: first.phone,
    email: first.email,
    employee_id: first.employee_id,
  })
}

async function ensureAvitoContactEmployeesLoaded() {
  if (currentPlatform.value !== 'avito') return
  if (avitoContactEmployeesLoadPromise) return avitoContactEmployeesLoadPromise

  if (avitoContactEmployees.value.length > 0) {
    tryAutoSelectAvitoContactFromJobly()
    return
  }

  avitoContactEmployeesLoading.value = true
  avitoContactEmployeesError.value = ''
  avitoContactEmployeesLoadPromise = (async () => {
    try {
      const res = await getAvitoContactEmployees()
      if (res?.error) {
        avitoContactEmployeesError.value = String(res.error)
        return
      }
      avitoContactEmployees.value = parseAvitoContactEmployeesResponse(res?.data ?? res)
      tryAutoSelectAvitoContactFromJobly()
    } catch (e) {
      console.warn('Avito: загрузка контактов сотрудников:', e)
      avitoContactEmployeesError.value = 'Не удалось загрузить контакты Avito'
    } finally {
      avitoContactEmployeesLoading.value = false
      avitoContactEmployeesLoadPromise = null
    }
  })()

  return avitoContactEmployeesLoadPromise
}

/** Сначала телефон из Наймикс (если есть в Avito), иначе первый контакт в списке. */
function tryAutoSelectAvitoContactFromJobly() {
  if (data.value.avito_contact_employee?.phone) return
  const sources = collectJoblyContactSources()
  const phone = pickJoblyContactString(sources, 'executor_phone')
  const hit = phone ? findAvitoContactEmployeeByPhone(avitoContactEmployees.value, phone) : null
  if (hit) {
    applyAvitoContactEmployeeSelection({
      id: hit.id,
      name: hit.name,
      phone: hit.phone,
      email: hit.email,
      employee_id: hit.employee_id,
    })
    return
  }
  applyDefaultAvitoContactEmployeeIfEmpty()
}
const avitoSpecializationMappings = ref({})
const avitoExperienceMappings = ref({})
const avitoEmploymentMappings = ref({})
const avitoContractMappings = ref({})
const avitoSalaryPeriodMappings = ref({})
const avitoSalaryTaxMappings = ref({})
const avitoPayoutFrequencyMappings = ref({})
let avitoSalaryTaxApplyGeneration = 0
const avitoCatalogs = ref({})
/** Снимок объявления с Avito API при редактировании активной публикации (platform_id). */
const avitoActivePublication = ref(null)
const avitoActivePublicationApplied = ref(false)
/** Live-снимок при лёгком редактировании: каталоги подгружаются позже в loadDictionaries — профессию применяем там. */
const avitoLightEditLivePublication = ref(null)

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

const globCurrentVacancy = ref(getInjectedVacancyData())

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
    const byId = opt?.id != null && v?.id != null && String(opt.id) === String(v.id)
    const byValue = opt?.value != null && v?.value != null && String(opt.value) === String(v.value)
    return byId || byValue
  }
  return String(opt?.id) === String(v) || (opt?.value != null && String(opt.value) === String(v)) || opt?.name === v
}

function isAvitoExperienceOptionSelected(opt) {
  const v = data.value.experience
  if (!v) return opt?.id === 'noMatter'
  const vId = typeof v === 'object' && v != null ? String(v.id ?? v.value ?? '').trim() : String(v).trim()
  if (vId && String(opt?.id) === vId) return true
  const joblyId = resolveJoblyExperienceId(vId) || resolveJoblyExperienceId(typeof v === 'object' ? v?.name : v)
  if (!joblyId) return false
  const mapped = resolveAvitoExperienceFromJobly({
    sourceIds: [joblyId],
    sourceNames: [],
    mappingsRaw: unwrapAvitoMappingsPayload(avitoExperienceMappings.value),
  })
  return mapped !== '' && String(opt?.id) === mapped
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
      updateValidField('professional_roles', true)
      // Синхронизация с SuperJob: id выбранной специализации уходит в catalogues при обновлении
      if (isSuperjobPlatform.value && (value?.id != null || value?.key != null)) {
        data.value.superjob_catalogue_id = Number(value?.id ?? value?.key) || (value?.id ?? value?.key)
      }
    } else {
      data.value.professional_roles = [null]
      updateValidField('professional_roles', false)
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
    if (currentPlatform.value !== 'avito') {
      data.value.professional_roles = [null]
    }
    return
  }

  // Для Avito сфера деятельности и профессия независимы.
  if (currentPlatform.value === 'avito') {
    data.value.industry = { ...(industry || {}) }
    return
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
  if (!data.value.salary_range) data.value.salary_range = { from: null, to: null }
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
  gross: false,
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
data.value.executor_name = ''
data.value.executor_phone = ''
data.value.avito_contact_employee = null
data.value.avito_contact_employee_id = null
data.value.avito_call_time = ''
data.value.avito_contact_method = 'messages_only'
data.value.avito_auto_publication = false
data.value.avito_contract_key = ''
data.value.avito_contract_keys = []
data.value.avito_benefit = null
data.value.bonuses = []
data.value.apply_processing = null
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
    const pid = platformData.id != null && String(platformData.id).trim() !== '' ? Number(platformData.id) : NaN
    const byId = Number.isFinite(pid) && platformIdToNameMap[pid] != null ? platformIdToNameMap[pid] : platformIdToNameMap[platformData.id]
    if (byId) return byId
    const byName = platformData.name ? normalizePlatformName(platformData.name) : null
    if (byName) return byName
  }
  const fromSelected = normalizePlatformName(props.selectedPlatform)
  return fromSelected || 'hh'
})

watch(
  currentPlatform,
  (p) => {
    validFields.value.address.name = p === 'avito' ? 'Место работы' : 'Город размещения'
  },
  { immediate: true },
)
// SuperJob может приходить как 'superjob' или 'superjob.ru' — единый UI (одно поле «Профессиональная сфера»)
const isSuperjobPlatform = computed(() => {
  const p = currentPlatform.value
  return p === 'superjob' || p === 'superjob.ru'
})
// Скрывать блок «График и часы работы» для SuperJob: по выбранной платформе или по редактируемой вакансии (data.platform может обновиться позже)
const hideScheduleBlockForSuperjob = computed(() => {
  const rawId = props.editingVacancy?.platforms_data?.[0]?.id
  const pid = rawId != null && String(rawId).trim() !== '' ? Number(rawId) : NaN
  return isSuperjobPlatform.value ? true : (Number.isFinite(pid) && pid === 4)
})

// Каталог SuperJob для SpecializationSelector: computed из currectRole, чтобы при loadDictionaries('superjob') данные сразу отображались
const superjobCatalogForSelector = computed(() =>
  isSuperjobPlatform.value && Array.isArray(currectRole.value) ? currectRole.value : []
);

const avitoProfessionCatalogForSelector = computed(() => {
  if (currentPlatform.value !== 'avito') return []
  return [{
    id: 'avito-profession',
    name: 'Профессии Avito',
    roles: professionsOptions.value,
  }]
})

const avitoBusinessAreaCatalogForSelector = computed(() => {
  if (currentPlatform.value !== 'avito') return []
  return [{
    id: 'avito-business-area',
    name: 'Сферы деятельности компании',
    roles: Array.isArray(currectRole.value) ? currectRole.value : [],
  }]
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
    return avitoProfessions.value.map((prof) => ({
      id: prof.id ?? prof.key ?? prof.profession_id,
      name: prof.name || prof.title,
    }))
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
  const vacancy = globCurrentVacancy.value || getInjectedVacancyData();
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
      handleIndustryChange(industry);

      // Устанавливаем специализацию
      const role = computedProfessionalRole.value || (industry.roles.length > 0 ? industry.roles[0] : null);
      if (role) {
        data.value.professional_roles = [role];
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

      // Используем nextTick для обновления DOM
      await nextTick();

      // Дополнительная задержка для обновления CityAutocomplete
      await new Promise(resolve => setTimeout(resolve, 50));

      //console.log('После nextTick data.value.area:', data.value.area);
    } else {
      //console.log('Город уже установлен пользователем:', data.value.area);
      isCitySetFromVacancy.value = true;
    }
  } else if (!city) {
   // console.log('Город из вакансии не найден в списке hh.ru');
  } else if (isCitySetFromVacancy.value) {
    //console.log('Город уже был установлен из вакансии, пропускаем');
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

const employmentSelectedOption = computed(() => {
  const opts = employmentTypesOptions.value
  if (!Array.isArray(opts) || opts.length === 0) return null
  const raw = globCurrentVacancy.value?.employment
  if (currentPlatform.value === 'rabota') {
    return findValueByIdOrName(opts, raw) || opts[0]
  }
  return findValue(opts, raw) || opts[0]
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
  if (currentPlatform.value === 'avito' && Array.isArray(avitoCatalogs.value?.schedules) && avitoCatalogs.value.schedules.length > 0) {
    return avitoCatalogs.value.schedules.map((schedule) => ({
      id: schedule.id,
      name: schedule.name || schedule.title,
    }))
  }
  return HH_WORK_SCHEDULE_BY_DAYS
})

const AVITO_EXPERIENCE_TEXT_TO_FORM_ID = {
  'без опыта': 'noMatter',
  'от 1 года': 'moreThan1',
  'более 1 года': 'moreThan1',
  'от 3 лет': 'moreThan3',
  'более 3 лет': 'moreThan3',
  'от 5 лет': 'moreThan5',
  'более 5 лет': 'moreThan5',
  'более 10 лет': 'moreThan5',
}

function getAvitoExperienceCatalogOptions() {
  const list = Array.isArray(avitoCatalogs.value?.experience) ? avitoCatalogs.value.experience : []
  if (!list.length) return []
  return list
    .map((item) => {
      const id = item?.id ?? item?.value ?? item?.key ?? item?.code
      const name = item?.name ?? item?.title ?? item?.label ?? item?.text ?? id
      return {
        id: id != null ? String(id).trim() : '',
        name: name != null ? String(name).trim() : '',
      }
    })
    .filter((item) => item.id !== '' && item.name !== '')
}

function resolveAvitoExperienceAlias(raw) {
  const s = String(raw ?? '').trim().toLowerCase()
  if (!s) return null
  if (s.includes('без опыта') || s === '0' || s === 'noexperience' || s === 'nomatter') return 'noMatter'
  if (s.includes('более 10') || s.includes('от 10') || s.includes('10+')) return 'moreThan10'
  if (s.includes('более 5') || s.includes('от 5') || s.includes('5+')) return 'moreThan5'
  if (s.includes('более 3') || s.includes('от 3') || s.includes('3+')) return 'moreThan3'
  if (s.includes('более 1') || s.includes('от 1') || s.includes('1+')) return 'moreThan1'
  return null
}

function resolveAvitoExperienceOption(raw) {
  const catalogOptions = getAvitoExperienceCatalogOptions()
  const merged = [...catalogOptions, ...AVITO_EXPERIENCE_OPTIONS]
  const normalized = String(raw ?? '').trim().toLowerCase()
  if (!normalized) return null

  const mappedFromKnownText = AVITO_EXPERIENCE_TEXT_TO_FORM_ID[normalized]
  if (mappedFromKnownText) {
    return AVITO_EXPERIENCE_OPTIONS.find((e) => e.id === mappedFromKnownText) || null
  }

  const byExact = merged.find(
    (e) => String(e.id).trim().toLowerCase() === normalized || String(e.name).trim().toLowerCase() === normalized,
  )
  if (byExact) return byExact

  const alias = resolveAvitoExperienceAlias(normalized)
  if (!alias) return null

  return AVITO_EXPERIENCE_OPTIONS.find((e) => String(e.id).trim() === alias) || merged.find((e) => String(e.id).trim() === alias) || null
}

function applyAvitoEmploymentFromPublication(pub) {
  const params = typeof pub?.params === 'object' && pub.params != null ? pub.params : null
  const empRaw = pub?.employment ?? params?.employment

  const rawTokens = []
  const pushToken = (v) => {
    if (v == null) return
    if (Array.isArray(v)) {
      v.forEach(pushToken)
      return
    }
    if (typeof v === 'object') {
      pushToken(v.id)
      pushToken(v.name)
      pushToken(v.title)
      pushToken(v.value)
      return
    }
    const s = String(v).trim().toLowerCase()
    if (!s) return
    s.split(/[;,/|]+/).map((x) => x.trim()).filter(Boolean).forEach((x) => rawTokens.push(x))
  }
  pushToken(empRaw)
  const empKey = rawTokens[0] || ''

  const empMap = {
    full: 'FULL',
    partial: 'PART',
    project: 'PROJECT',
    volunteer: 'VOLUNTEER',
    probation: 'PROBATION',
    'полная занятость': 'FULL',
    'частичная занятость': 'PART',
    'частичная': 'PART',
    'разовая или временная': 'PROJECT',
    'проектная работа': 'PROJECT',
    'временная работа': 'PROJECT',
    sidejob: 'SIDE_JOB',
    'подработка': 'SIDE_JOB',
    flyinflyout: 'FLY_IN_FLY_OUT',
    'вахта': 'FLY_IN_FLY_OUT',
  }
  const empFormId = rawTokens.map((t) => empMap[t]).find(Boolean) || null
  const avitoFormId = empFormId ? normalizeAvitoEmploymentMappedId(empFormId) : null
  if (avitoFormId) {
    const opt = avitoEmploymentOptions.find((o) => o.id === avitoFormId)
    if (opt) {
      applyAvitoEmploymentFormOption(opt, empFormId === 'FLY_IN_FLY_OUT')
    }
  }

}

function applyAvitoRegistrationMethodFromPublication(pub) {
  const params = typeof pub?.params === 'object' && pub.params != null ? pub.params : null
  const raw =
    pub?.registration_method ??
    pub?.registrationMethod ??
    params?.registration_method ??
    params?.registrationMethod
    ?? null
  const values = Array.isArray(raw) ? raw : raw != null && String(raw).trim() !== '' ? [raw] : []
  if (values.length === 0) return

  const mapByText = {
    contract: 'contract',
    labor: 'contract',
    'трудовой договор': 'contract',
    gph_ip: 'gph_ip',
    'гпх с ип': 'gph_ip',
    gph_self_employed: 'gph_self_employed',
    'гпх с самозанятым': 'gph_self_employed',
    gph_individual: 'gph_individual',
    gph_person: 'gph_individual',
    'гпх с физическим лицом': 'gph_individual',
    'гпх с физлицом': 'gph_individual',
  }
  const keys = []
  for (const item of values) {
    const val = String(item ?? '').trim().toLowerCase()
    if (!val) continue
    const key = mapByText[val] ?? mapByText[String(item ?? '').trim()]
    if (key && !keys.includes(key)) keys.push(key)
  }
  if (keys.length === 0) return
  setAvitoContractKeys(keys)
}

function normalizeAvitoBonusText(value) {
  return String(value ?? '').trim().toLowerCase().replace(/\s+/g, ' ')
}

function extractAvitoBonusesRawValues(pub) {
  const params = typeof pub?.params === 'object' && pub.params != null ? pub.params : null
  const rawValues = []
  const pushRaw = (v) => {
    if (v == null) return
    if (Array.isArray(v)) {
      v.forEach(pushRaw)
      return
    }
    if (typeof v === 'object') {
      pushRaw(v.id)
      pushRaw(v.name)
      pushRaw(v.title)
      pushRaw(v.value)
      pushRaw(v.label)
      return
    }
    const s = String(v).trim()
    if (!s) return
    s.split(/[;|]+/).map((x) => x.trim()).filter(Boolean).forEach((x) => rawValues.push(x))
  }

  pushRaw(pub?.bonuses)
  pushRaw(pub?.bonus)
  pushRaw(pub?.benefits)
  pushRaw(params?.bonuses)
  pushRaw(params?.bonus)
  pushRaw(params?.benefits)
  pushRaw(params?.salary?.bonuses)

  return Array.from(new Set(rawValues.map((x) => String(x).trim()).filter(Boolean)))
}

function applyAvitoBonusesFromPublication(pub) {
  const rawValues = extractAvitoBonusesRawValues(pub)
  if (!rawValues.length) return

  const aliasToId = {
    'мед страховка': 'medicalInsurance',
    'дмс': 'medicalInsurance',
    'корпоративный транспорт': 'transportToWork',
    'транспорт': 'transportToWork',
  }

  const resolvedOptions = []
  rawValues.forEach((raw) => {
    const normalized = normalizeAvitoBonusText(raw)
    const aliasId = aliasToId[normalized]
    const option = aliasId
      ? AVITO_BONUSES_OPTIONS.find((opt) => opt.id === aliasId)
      : AVITO_BONUSES_OPTIONS.find((opt) =>
        normalizeAvitoBonusText(opt.id) === normalized || normalizeAvitoBonusText(opt.name) === normalized
      )
    if (option && !resolvedOptions.some((x) => String(x.id) === String(option.id))) {
      resolvedOptions.push(option)
    }
  })

  if (!resolvedOptions.length) return
  const [first] = resolvedOptions
  data.value.avito_benefit = { id: first.id, name: first.name }
  data.value.bonuses = resolvedOptions.map((opt) => ({ id: opt.id }))
}

function applyAvitoContactsFromPublication(pub) {
  const params = typeof pub?.params === 'object' && pub.params != null ? pub.params : null
  const contactsOriginal = typeof pub?.contacts_original === 'object' && pub.contacts_original != null ? pub.contacts_original : null
  const paramsContactsOriginal = typeof params?.contacts_original === 'object' && params.contacts_original != null ? params.contacts_original : null
  const contacts = pub?.contacts ?? null
  const paramsContacts = params?.contacts ?? null

  const normalize = (v) => String(v ?? '').trim()
  const normalizeType = (v) => normalize(v).toLowerCase()
  const asArray = (v) => (Array.isArray(v) ? v : [])
  const appendEntries = (source, into) => {
    if (!source) return
    if (Array.isArray(source)) {
      source.forEach((item) => appendEntries(item, into))
      return
    }
    if (typeof source !== 'object') return

    const directType = source?.type
    const directValue = source?.value
    if (directType != null || directValue != null) {
      into.push({ type: directType, value: directValue })
    }

    asArray(source?.example).forEach((item) => appendEntries(item, into))
    asArray(source?.items).forEach((item) => appendEntries(item, into))
    asArray(source?.contacts).forEach((item) => appendEntries(item, into))
  }

  const nameRaw =
    contactsOriginal?.name ??
    paramsContactsOriginal?.name ??
    contacts?.name ??
    paramsContacts?.name ??
    pub?.executor_name ??
    params?.executor_name

  const contactName = String(nameRaw ?? '').trim()
  if (contactName) data.value.executor_name = contactName

  const entries = []
  appendEntries(contactsOriginal, entries)
  appendEntries(paramsContactsOriginal, entries)
  appendEntries(contacts, entries)
  appendEntries(paramsContacts, entries)

  const emailEntry = entries.find((item) => {
    const t = normalizeType(item?.type)
    return t === 'e-mail' || t === 'email' || t.includes('mail')
  })
  const phoneEntry = entries.find((item) => {
    const t = normalizeType(item?.type)
    return t === 'phone' || t.includes('phone') || t.includes('телефон')
  })

  const directEmail =
    contactsOriginal?.email ??
    paramsContactsOriginal?.email ??
    contacts?.email ??
    paramsContacts?.email
  const directPhone =
    contactsOriginal?.phone ??
    paramsContactsOriginal?.phone ??
    contacts?.phone ??
    paramsContacts?.phone

  const emailValue = normalize(emailEntry?.value ?? directEmail)
  const phoneValue = normalize(phoneEntry?.value ?? directPhone)

  if (emailValue) data.value.executor_email = emailValue

  const employeeId =
    pub?.hierarchy?.employee_id ??
    params?.hierarchy?.employee_id ??
    pub?.employee_id ??
    params?.employee_id
  void ensureAvitoContactEmployeesLoaded().then(() => {
    if (employeeId != null && String(employeeId).trim() !== '') {
      const byEmp = avitoContactEmployees.value.find(
        (row) => row.employee_id != null && String(row.employee_id) === String(employeeId),
      )
      if (byEmp) {
        applyAvitoContactEmployeeSelection(byEmp)
        return
      }
    }
    const hit = findAvitoContactEmployeeByPhone(avitoContactEmployees.value, phoneValue || directPhone)
    if (hit) {
      applyAvitoContactEmployeeSelection(hit)
    } else if (phoneValue) {
      data.value.executor_phone = phoneValue
    }
  })
}

function applyAvitoSalaryFromPublication(pub) {
  const params = typeof pub?.params === 'object' && pub.params != null ? pub.params : null
  const topSalary = pub?.salary
  const paramSalary = params?.salary

  // Приоритет: объект from/to из params.salary, затем pub.salary-объект, затем число.
  const salaryObj =
    (paramSalary && typeof paramSalary === 'object' ? paramSalary : null) ??
    (topSalary && typeof topSalary === 'object' ? topSalary : null)
  const salaryNum =
    typeof topSalary === 'number'
      ? topSalary
      : typeof topSalary === 'string' && topSalary.trim() !== '' && !isNaN(Number(topSalary))
        ? Number(topSalary)
        : null

  if (salaryObj) {
    const fromRaw = salaryObj.from ?? salaryObj.min ?? salaryObj.salary_from
    const toRaw = salaryObj.to ?? salaryObj.max ?? salaryObj.salary_to
    const from = fromRaw != null && String(fromRaw).trim() !== '' && !isNaN(Number(fromRaw)) ? Number(fromRaw) : null
    const to = toRaw != null && String(toRaw).trim() !== '' && !isNaN(Number(toRaw)) ? Number(toRaw) : null
    data.value.salary_range = {
      ...(data.value.salary_range || {}),
      ...(from != null ? { from } : {}),
      ...(to != null ? { to } : {}),
    }
    return
  }

  if (salaryNum != null) {
    data.value.salary_range = {
      ...(data.value.salary_range || {}),
      from: salaryNum,
    }
  }
}

function applyAvitoSalaryModeFromPublication(pub) {
  const params = typeof pub?.params === 'object' && pub.params != null ? pub.params : null
  const raw = params?.paid_period ?? pub?.paid_period
  const value = String(raw ?? '').trim().toLowerCase()
  if (!value) return

  const mapPaidPeriodToModeId = {
    'в месяц': 'monthly',
    'в неделю': 'weekly',
    'за неделю': 'weekly',
    'за смену': 'shift',
    'за час': 'hourly',
    'сдельная оплата': 'piecework',
  }
  const modeId = mapPaidPeriodToModeId[value] ?? value
  const mode = avitoSalaryModeOptions.find((m) => String(m.id) === String(modeId) || String(m.name).trim().toLowerCase() === value)
  if (!mode) {
    data.value.salary_range = {
      ...(data.value.salary_range || {}),
      mode: null,
    }
    return
  }
  data.value.salary_range = {
    ...(data.value.salary_range || {}),
    mode: { id: mode.id, name: mode.name },
  }
}

function applyAvitoPayoutFrequencyFromPublication(pub) {
  const params = typeof pub?.params === 'object' && pub.params != null ? pub.params : null
  const raw =
    pub?.payout_frequency ??
    pub?.payoutFrequency ??
    params?.payout_frequency ??
    params?.payoutFrequency ??
    params?.salary?.payout_frequency
  const rawValue =
    typeof raw === 'string' || typeof raw === 'number'
      ? raw
      : raw?.id ?? raw?.name ?? raw?.title ?? raw?.value
  const freqId = normalizeAvitoPayoutFrequencyIdForPopup(rawValue)
  if (!freqId) return

  const opt = findAvitoPayoutFrequencyOption(freqId)
  if (!opt) return
  data.value.salary_range = {
    ...(data.value.salary_range || {}),
    frequency: { id: opt.id, name: opt.name },
  }
}

function isAvitoPayoutFrequencyOptionSelected(opt) {
  const currentId = normalizeAvitoPayoutFrequencyIdForPopup(data.value.salary_range?.frequency)
  return currentId !== '' && String(opt?.id) === currentId
}

function applyAvitoTaxesFromPublication(pub) {
  const params = typeof pub?.params === 'object' && pub.params != null ? pub.params : null
  const raw = params?.taxes ?? pub?.taxes
  const taxesNorm = String(raw ?? '').trim().toLowerCase()
  if (!taxesNorm) return

  if (taxesNorm.includes('до вычета')) {
    data.value.salary_range = { ...(data.value.salary_range || {}), gross: true }
    return
  }
  if (taxesNorm.includes('на руки') || taxesNorm.includes('после вычета')) {
    data.value.salary_range = { ...(data.value.salary_range || {}), gross: false }
  }
}

// Avito: тип зарплаты (период, за который указывается сумма)
const avitoSalaryModeOptions = [...AVITO_POPUP_SALARY_MODE_OPTIONS]

const avitoPayoutFrequencyOptions = [...AVITO_POPUP_PAYOUT_FREQUENCY_OPTIONS]

const AVITO_BONUSES_OPTIONS = [
  { id: 'uniform', name: 'Униформа' },
  { id: 'housing', name: 'Проживание' },
  { id: 'medicalInsurance', name: 'Медицинская страховка' },
  { id: 'meals', name: 'Питание' },
  { id: 'fuelCompensation', name: 'Оплата бензина' },
  { id: 'parking', name: 'Парковка' },
  { id: 'restAreas', name: 'Зоны отдыха' },
  { id: 'transportToWork', name: 'Транспорт до работы' },
  { id: 'companyDiscounts', name: 'Скидки в компании' },
  { id: 'holidayGiftsForChildren', name: 'Подарки детям на праздники' },
  { id: 'mobileCompensation', name: 'Оплата мобильной связи' },
  { id: 'education', name: 'Обучение' },
  { id: 'travelFromWorkCompensation', name: 'Компенсация проезда с работы' },
  { id: 'kasko', name: 'КАСКО' },
  { id: 'smartphone', name: 'Смартфон' },
  { id: 'tireService', name: 'Услуги шиномонтажа' },
]

const avitoBonusesOptions = AVITO_BONUSES_OPTIONS.map((bonus) => ({
  ...bonus,
  value: bonus.id,
}))

const avitoEmploymentOptions = [...AVITO_POPUP_EMPLOYMENT_OPTIONS]

const avitoContractOptions = [...AVITO_POPUP_CONTRACT_OPTIONS]

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

const hhRolesForAvitoMapping = ref([])
const hhRolesForAvitoMappingLoaded = ref(false)
/** Локальный справочник GET /specializations (hh_id как в админ-маппинге). */
const localHhCategoriesForAvito = ref([])
const localHhCategoriesForAvitoLoaded = ref(false)

async function ensureLocalHhCategoriesForAvitoLoaded() {
  if (localHhCategoriesForAvitoLoaded.value) return
  try {
    const config = useRuntimeConfig()
    const baseURL = String(config.public.apiBase || '/api')
    const res = await $fetch('/specializations', { baseURL })
    const categories = res?.data?.categories
    if (Array.isArray(categories) && categories.length > 0) {
      localHhCategoriesForAvito.value = categories
    }
  } catch (e) {
    console.warn('Avito: локальный справочник /specializations:', e)
  } finally {
    localHhCategoriesForAvitoLoaded.value = true
  }
}

async function ensureHhRolesForAvitoMappingLoaded() {
  if (hhRolesForAvitoMappingLoaded.value) return
  const rolesPayload = await getRolesHh()
  const categories = rolesPayload?.roles?.categories
  hhRolesForAvitoMapping.value = Array.isArray(categories) ? categories : []
  hhRolesForAvitoMappingLoaded.value = true
}

async function applyAvitoMappedProfessionFromJobly() {
  if (currentPlatform.value !== 'avito') return
  const normalize = (v) => String(v ?? '').trim()

  const currentRole = data.value.professional_roles?.[0] ?? null
  const currentId = normalize(currentRole?.id)
  const currentName = normalize(currentRole?.name)

  const isCurrentAlreadyAvito = currentId !== '' && avitoProfessions.value.some(
    (p) => normalize(p?.id ?? p?.key ?? p?.profession_id) === currentId,
  )
  if (isCurrentAlreadyAvito) return

  const injected = getInjectedVacancyData()
  const sourceIds = [
    currentId,
    Array.isArray(globCurrentVacancy.value?.professional_roles) ? normalize(globCurrentVacancy.value.professional_roles[0]?.id) : '',
    Array.isArray(injected?.professional_roles) ? normalize(injected.professional_roles[0]?.id) : '',
    globCurrentVacancy.value?.specializations?.id != null ? normalize(globCurrentVacancy.value.specializations.id) : '',
    injected?.specializations?.id != null ? normalize(injected.specializations.id) : '',
  ].filter(Boolean)

  const sourceNamesRaw = [
    currentName,
    Array.isArray(globCurrentVacancy.value?.professional_roles) ? normalize(globCurrentVacancy.value.professional_roles[0]?.name) : '',
    Array.isArray(injected?.professional_roles) ? normalize(injected.professional_roles[0]?.name) : '',
    typeof globCurrentVacancy.value?.specializations === 'string' ? normalize(globCurrentVacancy.value.specializations) : '',
    typeof globCurrentVacancy.value?.specializations === 'object' ? normalize(globCurrentVacancy.value.specializations?.name) : '',
    typeof injected?.specializations === 'string' ? normalize(injected.specializations) : '',
    typeof injected?.specializations === 'object' ? normalize(injected.specializations?.name) : '',
  ].filter(Boolean)

  await Promise.all([
    ensureLocalHhCategoriesForAvitoLoaded(),
    ensureHhRolesForAvitoMappingLoaded(),
  ])

  const mappingsDict = unwrapAvitoMappingsPayload(avitoSpecializationMappings.value)

  const resolved = resolveAvitoProfessionFromSpecialization({
    sourceIds,
    sourceNames: sourceNamesRaw,
    mappingsRaw: mappingsDict,
    localHhCategories: localHhCategoriesForAvito.value,
    liveHhCategories: hhRolesForAvitoMapping.value,
    avitoProfessions: avitoProfessions.value,
    allowCatalogFallback: true,
  })

  const mappedId = resolved.avitoProfessionId
  if (!mappedId) return

  const hit = avitoProfessions.value.find((p) =>
    normalize(p?.id ?? p?.key ?? p?.profession_id) === String(mappedId),
  )
  if (!hit) return
  data.value.professional_roles = [{
    id: hit.id ?? hit.key ?? hit.profession_id,
    name: hit.name || hit.title,
  }]
}

async function ensureAvitoExperienceMappingsLoaded() {
  const existing = unwrapAvitoMappingsPayload(avitoExperienceMappings.value)
  if (Object.keys(existing).length > 0) return
  const res = await getAvitoExperienceMappings()
  if (res?.data && !res.error) {
    avitoExperienceMappings.value = unwrapAvitoMappingsPayload(res.data)
  }
}

function collectJoblyExperienceSources() {
  const normalize = (v) => String(v ?? '').trim()
  const sourceIds = []
  const sourceNamesRaw = []
  const pushRaw = (raw) => {
    if (raw == null) return
    if (typeof raw === 'object') {
      const id = normalize(raw.id ?? raw.value)
      const name = normalize(raw.name)
      if (id) sourceIds.push(id)
      if (name) sourceNamesRaw.push(name)
      return
    }
    const s = normalize(raw)
    if (!s) return
    sourceNamesRaw.push(s)
    const joblyId = resolveJoblyExperienceId(s)
    if (joblyId) sourceIds.push(joblyId)
  }
  pushRaw(globCurrentVacancy.value?.experience)
  pushRaw(getInjectedVacancyData()?.experience)
  pushRaw(data.value.experience)
  return {
    sourceIds: [...new Set(sourceIds.filter(Boolean))],
    sourceNames: [...new Set(sourceNamesRaw.filter(Boolean))],
  }
}

async function applyAvitoMappedExperienceFromJobly() {
  if (currentPlatform.value !== 'avito') return
  await ensureAvitoExperienceMappingsLoaded()
  const normalize = (v) => String(v ?? '').trim()
  const { sourceIds, sourceNames } = collectJoblyExperienceSources()
  if (sourceIds.length === 0 && sourceNames.length === 0) return

  const mappedAvitoId = resolveAvitoExperienceFromJobly({
    sourceIds,
    sourceNames,
    mappingsRaw: unwrapAvitoMappingsPayload(avitoExperienceMappings.value),
  })
  if (!mappedAvitoId) return

  const currentExp = data.value.experience
  const currentId = typeof currentExp === 'object' && currentExp != null
    ? normalize(currentExp.id ?? currentExp.value)
    : normalize(currentExp)
  if (currentId === mappedAvitoId) return

  const hit = findAvitoExperienceOption(mappedAvitoId)
  if (!hit) return
  data.value.experience = { id: hit.id, name: hit.name, value: hit.id }
}

async function ensureAvitoEmploymentMappingsLoaded() {
  const existing = unwrapAvitoMappingsPayload(avitoEmploymentMappings.value)
  if (Object.keys(existing).length > 0) return
  const res = await getAvitoEmploymentMappings()
  if (res?.data && !res.error) {
    avitoEmploymentMappings.value = unwrapAvitoMappingsPayload(res.data)
  }
}

function collectJoblyEmploymentSources() {
  const sourceIds = []
  const sourceNames = []
  const pushRaw = (raw) => {
    if (raw == null) return
    if (typeof raw === 'object') {
      const id = raw.id != null ? String(raw.id).trim() : ''
      const name = raw.name != null ? String(raw.name).trim() : ''
      const siteName = raw.siteName != null ? String(raw.siteName).trim() : ''
      if (id) sourceIds.push(id)
      if (name) sourceNames.push(name)
      if (siteName) sourceNames.push(siteName)
      return
    }
    const s = String(raw).trim()
    if (s) sourceNames.push(s)
  }
  pushRaw(globCurrentVacancy.value?.employment)
  pushRaw(getInjectedVacancyData()?.employment)
  pushRaw(data.value.employment_form)
  return {
    sourceIds: [...new Set(sourceIds.filter(Boolean))],
    sourceNames: [...new Set(sourceNames.filter(Boolean))],
  }
}

function applyAvitoEmploymentFormOption(opt, setFlyInSchedule = false) {
  if (!opt?.id) return
  const current = data.value.employment_form
  if (current && String(current.id) === String(opt.id)) {
    if (setFlyInSchedule) {
      data.value.work_schedule_by_days = { id: 'flyInFlyOut', name: 'Вахта' }
    }
    return
  }
  data.value.employment_form = { id: opt.id, name: opt.name }
  if (setFlyInSchedule) {
    data.value.work_schedule_by_days = { id: 'flyInFlyOut', name: 'Вахта' }
  }
}

async function ensureAvitoContractMappingsLoaded() {
  const existing = unwrapAvitoMappingsPayload(avitoContractMappings.value)
  if (Object.keys(existing).length > 0) return
  const res = await getAvitoContractMappings()
  if (res?.data && !res.error) {
    avitoContractMappings.value = unwrapAvitoMappingsPayload(res.data)
  }
}

function collectJoblyOformlenieSources() {
  const ids = [
    ...collectJoblyOformlenieIdsFromList(globCurrentVacancy.value?.oformlenie),
    ...collectJoblyOformlenieIdsFromList(getInjectedVacancyData()?.oformlenie),
    ...collectJoblyOformlenieIdsFromList(data.value.oformlenie),
  ]
  return [...new Set(ids.filter(Boolean))]
}

async function applyAvitoMappedContractFromJobly() {
  if (currentPlatform.value !== 'avito') return
  await ensureAvitoContractMappingsLoaded()
  const sourceIds = collectJoblyOformlenieSources()
  if (sourceIds.length === 0) return

  const mappedKeys = resolveAvitoContractsFromJobly({
    sourceIds,
    mappingsRaw: unwrapAvitoMappingsPayload(avitoContractMappings.value),
  })
  if (mappedKeys.length === 0) return

  const currentKeys = getAvitoContractKeys()
  if (!shouldPreferJoblyVacancyTitleForAvito() && currentKeys.length > 0) return
  const currentSet = new Set(currentKeys)
  const mappedSet = new Set(mappedKeys)
  if (
    currentSet.size === mappedSet.size
    && mappedKeys.every((k) => currentSet.has(k))
  ) return

  setAvitoContractKeys(mappedKeys)
}

async function applyAvitoMappedEmploymentFromJobly() {
  if (currentPlatform.value !== 'avito') return
  await ensureAvitoEmploymentMappingsLoaded()
  const { sourceIds, sourceNames } = collectJoblyEmploymentSources()
  if (sourceIds.length === 0 && sourceNames.length === 0) return

  const joblyKey = resolveJoblyEmploymentCompositeFromSources({ sourceIds, sourceNames })
  const mappedKey = resolveAvitoEmploymentFromJobly({
    sourceIds,
    sourceNames,
    mappingsRaw: unwrapAvitoMappingsPayload(avitoEmploymentMappings.value),
  })
  if (!mappedKey) return

  const avitoFormId = normalizeAvitoEmploymentMappedId(mappedKey)
  if (!avitoFormId) return

  const opt = avitoEmploymentOptions.find((o) => String(o.id) === String(avitoFormId))
  if (!opt) return
  applyAvitoEmploymentFormOption(opt, joblyKey === 'permanent:FLY_IN_FLY_OUT')
}

async function ensureAvitoSalaryPeriodMappingsLoaded() {
  const existing = unwrapAvitoMappingsPayload(avitoSalaryPeriodMappings.value)
  if (Object.keys(existing).length > 0) return
  const res = await getAvitoSalaryPeriodMappings()
  if (res?.data && !res.error) {
    avitoSalaryPeriodMappings.value = unwrapAvitoMappingsPayload(res.data)
  }
}

function resolveJoblySalaryPeriodIdForAvitoPrefill() {
  const preferJobly = shouldPreferJoblyVacancyTitleForAvito()
  return resolveJoblySalaryPeriodIdWithPriority({
    injected: getInjectedVacancyData(),
    glob: globCurrentVacancy.value,
    form: data.value,
    preferInjectedOnly: preferJobly,
  })
}

async function applyAvitoMappedSalaryPeriodFromJobly() {
  if (currentPlatform.value !== 'avito') return
  await ensureAvitoSalaryPeriodMappingsLoaded()

  const preferJobly = shouldPreferJoblyVacancyTitleForAvito()
  const joblyId = resolveJoblySalaryPeriodIdForAvitoPrefill()
  const validAvitoModeIds = new Set(avitoSalaryModeOptions.map((o) => String(o.id)))

  if (!data.value.salary_range) data.value.salary_range = { from: null, to: null }

  const currentModeId = data.value.salary_range?.mode?.id != null
    ? String(data.value.salary_range.mode.id).trim()
    : ''

  if (!joblyId) {
    if (preferJobly && (!currentModeId || !validAvitoModeIds.has(currentModeId))) {
      const def = findAvitoSalaryModeOption('monthly')
      if (def) data.value.salary_range.mode = { id: def.id, name: def.name }
    }
    return
  }

  const mappedModeId = resolveAvitoSalaryPeriodFromJobly({
    sourceIds: [joblyId],
    mappingsRaw: unwrapAvitoMappingsPayload(avitoSalaryPeriodMappings.value),
  })
  if (!mappedModeId) return

  const useJobly = shouldApplyJoblySalaryFieldsToAvito()
  if (!useJobly && currentModeId && currentModeId !== mappedModeId) return

  const opt = findAvitoSalaryModeOption(mappedModeId)
  if (!opt) return
  data.value.salary_range.mode = { id: opt.id, name: opt.name }
}

async function ensureAvitoPayoutFrequencyMappingsLoaded() {
  const existing = unwrapAvitoMappingsPayload(avitoPayoutFrequencyMappings.value)
  if (Object.keys(existing).length > 0) return
  const res = await getAvitoPayoutFrequencyMappings()
  if (res?.data && !res.error) {
    avitoPayoutFrequencyMappings.value = unwrapAvitoMappingsPayload(res.data)
  }
}

function resolveJoblyPayoutFrequencyIdForAvitoPrefill() {
  const preferJobly = shouldPreferJoblyVacancyTitleForAvito()
  return resolveJoblyPayoutFrequencyIdWithPriority({
    injected: getInjectedVacancyData(),
    glob: globCurrentVacancy.value,
    form: data.value,
    preferInjectedOnly: preferJobly,
  })
}

async function applyAvitoMappedPayoutFrequencyFromJobly() {
  if (currentPlatform.value !== 'avito') return
  await ensureAvitoPayoutFrequencyMappingsLoaded()

  const preferJobly = shouldPreferJoblyVacancyTitleForAvito()
  const useJobly = shouldApplyJoblySalaryFieldsToAvito()
  const mappingsRaw = unwrapAvitoMappingsPayload(avitoPayoutFrequencyMappings.value)
  const validAvitoFreqIds = new Set(avitoPayoutFrequencyOptions.map((o) => String(o.id)))

  if (!data.value.salary_range) data.value.salary_range = { from: null, to: null }

  const currentFreqId = normalizeAvitoPayoutFrequencyIdForPopup(data.value.salary_range?.frequency)

  let joblyId = resolveJoblyPayoutFrequencyIdForAvitoPrefill()
  if (!joblyId) {
    joblyId = resolveJoblyPayoutFrequencyIdFromVacancy(globCurrentVacancy.value)
  }

  const mappedFreqId = joblyId
    ? resolveAvitoPayoutFrequencyFromJobly({ sourceIds: [joblyId], mappingsRaw })
    : resolveAvitoPayoutFrequencyForJoblyVacancy(
      getInjectedVacancyData() ?? globCurrentVacancy.value,
      mappingsRaw,
    )

  if (!mappedFreqId) {
    if (useJobly && preferJobly && (!currentFreqId || !validAvitoFreqIds.has(currentFreqId))) {
      const def = findAvitoPayoutFrequencyOption('monthlyPay')
      if (def) data.value.salary_range.frequency = { id: def.id, name: def.name }
    }
    return
  }

  if (!useJobly && currentFreqId && currentFreqId !== mappedFreqId) return

  const opt = findAvitoPayoutFrequencyOption(mappedFreqId)
  if (!opt) return
  data.value.salary_range.frequency = { id: opt.id, name: opt.name }
}

function ensureAvitoSalaryDefaults() {
  if (currentPlatform.value !== 'avito') return
  if (!data.value.salary_range) data.value.salary_range = {}
  const validAvitoModeIds = new Set(avitoSalaryModeOptions.map((o) => String(o.id)))
  let currentModeId = data.value.salary_range?.mode?.id != null
    ? String(data.value.salary_range.mode.id).trim()
    : ''
  let currentFreqId = normalizeAvitoPayoutFrequencyIdForPopup(data.value.salary_range?.frequency)
  if (currentModeId && !validAvitoModeIds.has(currentModeId)) {
    currentModeId = ''
    data.value.salary_range.mode = null
  }
  if (!currentModeId) {
    const def = findAvitoSalaryModeOption('monthly') ?? avitoSalaryModeOptions[0]
    if (def) data.value.salary_range.mode = { id: def.id, name: def.name }
  }
  if (!currentFreqId) {
    const defFreq = findAvitoPayoutFrequencyOption('monthlyPay')
    if (defFreq) {
      data.value.salary_range.frequency = { id: defFreq.id, name: defFreq.name }
    }
  } else if (currentFreqId !== String(data.value.salary_range?.frequency?.id ?? '').trim()) {
    const opt = findAvitoPayoutFrequencyOption(currentFreqId)
    if (opt) data.value.salary_range.frequency = { id: opt.id, name: opt.name }
  }
}

function applyAvitoWorkPlaceFromPublication(pub) {
  const params = typeof pub?.params === 'object' && pub.params != null ? pub.params : null
  const addressDetails = typeof pub?.addressDetails === 'object' && pub.addressDetails != null ? pub.addressDetails : null
  const rawAddress =
    (typeof pub?.address === 'string' ? pub.address : (pub?.address?.address ?? pub?.address?.name ?? pub?.address?.title)) ??
    params?.address ??
    addressDetails?.address ??
    addressDetails?.city ??
    ''

  const addressText = String(rawAddress ?? '').trim()
  if (!addressText) return
  applyAvitoWorkPlaceFromAddressText(addressText)
}

// Функция для загрузки справочников в зависимости от платформы
// opts.skipAvitoAddressHints — не грузить getAreasHh для Avito (фаза B после form-ready).
const loadDictionaries = async (platform, opts = {}) => {
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

    // Если открыли модалку редактирования активной публикации rabota.ru — применяем данные публикации после загрузки справочников
    applyRabotaActivePublicationToForm()

    // Если это модалка «Опубликовать» (новая публикация с карточки) — после загрузки справочников сматчим строковые поля вакансии в id справочников rabota.ru
    if (isNewPublicationFromCard && currentPlatform.value === 'rabota' && globCurrentVacancy.value) {
      applyJoblyVacancyToRabotaForm(globCurrentVacancy.value)
    }
  } else if (platform === 'avito') {
    const avitoPhase = opts.avitoLoadPhase ?? 'all'
    if (avitoPhase === 'all' || avitoPhase === 'core') {
      await loadAvitoDictionariesCore()
    }
    if (avitoPhase === 'all' || avitoPhase === 'secondary') {
      await loadAvitoDictionariesSecondaryMappings()
    }
    try {
      await applyAvitoMappedProfessionFromJobly()
      await applyAvitoMappedExperienceFromJobly()
      await applyAvitoMappedEmploymentFromJobly()
      await applyAvitoMappedContractFromJobly()
      applyAvitoActivePublicationToForm()
      applyAvitoLightEditProfessionIfNeeded()
      applyAvitoDescriptionFromJobly()
      applyAvitoSalaryFromJobly()
      applyAvitoContactsFromJobly()
      await applyAvitoMappedSalaryPeriodFromJobly()
      await applyAvitoMappedSalaryTaxFromJobly()
      await applyAvitoMappedPayoutFrequencyFromJobly()
      ensureAvitoSalaryDefaults()
    } catch (e) {
      console.warn('Avito: применение данных публикации/маппинга после каталогов:', e)
    }
    if (!opts.skipAvitoAddressHints) {
      // «Место работы»: подсказки из справочника городов (как для HH). С карточки «Опубликовать» адреса работодателя HH не подгружаются — иначе список пустой и «Город не найден».
      try {
        const { data: areasData, error: areasError } = await getAreasHh()
        if (!areasError && areasData) {
          addresses.value = dedupeAreasByName(areasData)
        } else {
          addresses.value = []
        }
      } catch (e) {
        console.warn('Avito: не удалось загрузить города для места работы:', e)
        addresses.value = []
      }
      applyAvitoWorkPlaceFromJobly()
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
    const rolesPayload = await getRolesHh()
    if (rolesPayload && !rolesPayload.errorRoles && rolesPayload.roles) {
      const { roles } = rolesPayload
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

const EDIT_PLATFORM_CATALOG_RACE_MS = 8000
/** Редактирование: GET /vacancy-fields без таймаута мог вечно держать лоадер модалки (см. fillFormFromCurrentVacancy → drivers). */
const VACANCY_FIELDS_FETCH_MS = 6000
/** Live-запрос публикации с площадки при пустом снимке в БД — не держим модалку 20+ с при «висящем» прокси/API. */
const PLATFORM_PUBLICATION_LIVE_FETCH_MS = 7000
/** Инициализация формы: /vacancies/{id} не должен бесконечно держать прелоадер модалки. */
const EDIT_VACANCY_FETCH_MS = 7000
/** Local-only снимки площадок: не должны блокировать async setup модалки. */
const PLATFORM_PUBLICATION_LOCAL_FETCH_MS = 5000
/** Публикация Avito иногда долго обрабатывается на стороне площадки; не блокируем UI бесконечно. */
const AVITO_PUBLISH_SOFT_TIMEOUT_MS = 12000

async function getVacancyByIdWithTimeout(vacancyId) {
  if (vacancyId == null || String(vacancyId).trim() === '') return null
  const timeoutPromise = new Promise((resolve) => {
    setTimeout(() => resolve({ __timeout: true }), EDIT_VACANCY_FETCH_MS)
  })
  const result = await Promise.race([getVacancyById(String(vacancyId)), timeoutPromise])
  if (result && typeof result === 'object' && result.__timeout) {
    console.warn('AddPublication: таймаут загрузки вакансии при инициализации формы', { vacancyId: String(vacancyId) })
    return null
  }
  return result ?? null
}

async function withTimeoutSafe(promiseFactory, timeoutMs, timeoutLabel, fallbackValue = null) {
  try {
    const timeoutPromise = new Promise((resolve) => {
      setTimeout(() => resolve({ __timeout: true }), timeoutMs)
    })
    const result = await Promise.race([promiseFactory(), timeoutPromise])
    if (result && typeof result === 'object' && result.__timeout) {
      console.warn(`AddPublication: таймаут (${timeoutLabel})`)
      return fallbackValue
    }
    return result
  } catch (e) {
    console.warn(`AddPublication: ошибка (${timeoutLabel})`, e)
    return fallbackValue
  }
}

async function runWithSoftTimeout(promiseFactory, timeoutMs) {
  const requestPromise = Promise.resolve()
    .then(() => promiseFactory())
    .then((value) => ({ kind: 'result', value }))
    .catch((error) => ({ kind: 'error', error }))

  const timeoutPromise = new Promise((resolve) => {
    setTimeout(() => resolve({ kind: 'timeout' }), timeoutMs)
  })

  const settled = await Promise.race([requestPromise, timeoutPromise])
  if (settled?.kind === 'error') throw settled.error
  if (settled?.kind === 'timeout') return { timedOut: true, result: null }
  return { timedOut: false, result: settled?.value ?? null }
}

/** Фаза A (Avito): каталоги + применение снимка; таймаут — форма всё равно открывается с CRM. */
const loadAvitoCatalogsMinimalWithApplyForEdit = async () => {
  const runCore = async () => {
    const [catalogsResult, mappingsResult, experienceMappingsResult, employmentMappingsResult, contractMappingsResult, salaryPeriodMappingsResult, salaryTaxMappingsResult, payoutFrequencyMappingsResult] = await Promise.all([
      getAvitoCatalogs(),
      getAvitoSpecializationMappings(),
      getAvitoExperienceMappings(),
      getAvitoEmploymentMappings(),
      getAvitoContractMappings(),
      getAvitoSalaryPeriodMappings(),
      getAvitoSalaryTaxMappings(),
      getAvitoPayoutFrequencyMappings(),
    ])
    if (catalogsResult?.data && !catalogsResult.error && typeof catalogsResult.data === 'object') {
      avitoCatalogs.value = catalogsResult.data
      avitoProfessions.value = Array.isArray(catalogsResult.data.profession) ? catalogsResult.data.profession : []
      avitoBusinessAreas.value = Array.isArray(catalogsResult.data.business_area) ? catalogsResult.data.business_area : []
      currectRole.value = avitoBusinessAreas.value.map((area) => ({
        id: area.id,
        name: area.name || area.title,
        roles: [],
      }))
    }
    if (mappingsResult?.data && !mappingsResult.error && typeof mappingsResult.data === 'object') {
      avitoSpecializationMappings.value = unwrapAvitoMappingsPayload(mappingsResult.data)
    }
    if (experienceMappingsResult?.data && !experienceMappingsResult.error && typeof experienceMappingsResult.data === 'object') {
      avitoExperienceMappings.value = unwrapAvitoMappingsPayload(experienceMappingsResult.data)
    }
    if (employmentMappingsResult?.data && !employmentMappingsResult.error && typeof employmentMappingsResult.data === 'object') {
      avitoEmploymentMappings.value = unwrapAvitoMappingsPayload(employmentMappingsResult.data)
    }
    if (contractMappingsResult?.data && !contractMappingsResult.error && typeof contractMappingsResult.data === 'object') {
      avitoContractMappings.value = unwrapAvitoMappingsPayload(contractMappingsResult.data)
    }
    if (salaryPeriodMappingsResult?.data && !salaryPeriodMappingsResult.error && typeof salaryPeriodMappingsResult.data === 'object') {
      avitoSalaryPeriodMappings.value = unwrapAvitoMappingsPayload(salaryPeriodMappingsResult.data)
    }
    if (salaryTaxMappingsResult?.data && !salaryTaxMappingsResult.error && typeof salaryTaxMappingsResult.data === 'object') {
      avitoSalaryTaxMappings.value = unwrapAvitoMappingsPayload(salaryTaxMappingsResult.data)
    }
    if (payoutFrequencyMappingsResult?.data && !payoutFrequencyMappingsResult.error && typeof payoutFrequencyMappingsResult.data === 'object') {
      avitoPayoutFrequencyMappings.value = unwrapAvitoMappingsPayload(payoutFrequencyMappingsResult.data)
    }
    await applyAvitoMappedProfessionFromJobly()
    await applyAvitoMappedExperienceFromJobly()
    await applyAvitoMappedEmploymentFromJobly()
    await applyAvitoMappedContractFromJobly()
    applyAvitoActivePublicationToForm()
    applyAvitoLightEditProfessionIfNeeded()
    applyAvitoDescriptionFromJobly()
    applyAvitoSalaryFromJobly()
    await applyAvitoMappedSalaryPeriodFromJobly()
    await applyAvitoMappedSalaryTaxFromJobly()
    await applyAvitoMappedPayoutFrequencyFromJobly()
    ensureAvitoSalaryDefaults()
    applyAvitoWorkPlaceFromJobly()
  }
  try {
    await Promise.race([
      runCore(),
      new Promise((_, reject) => {
        setTimeout(() => reject(new Error('avito_catalogs_timeout')), EDIT_PLATFORM_CATALOG_RACE_MS)
      }),
    ])
  } catch (e) {
    console.warn('AddPublication: каталоги Avito (редактирование):', e)
    try {
      await applyAvitoMappedProfessionFromJobly()
      await applyAvitoMappedExperienceFromJobly()
      await applyAvitoMappedEmploymentFromJobly()
      await applyAvitoMappedContractFromJobly()
      applyAvitoActivePublicationToForm()
      applyAvitoLightEditProfessionIfNeeded()
      applyAvitoDescriptionFromJobly()
      applyAvitoSalaryFromJobly()
      applyAvitoContactsFromJobly()
      await applyAvitoMappedSalaryPeriodFromJobly()
      await applyAvitoMappedSalaryTaxFromJobly()
      await applyAvitoMappedPayoutFrequencyFromJobly()
      ensureAvitoSalaryDefaults()
      applyAvitoWorkPlaceFromJobly()
    } catch (e2) {
      console.warn('AddPublication: префилл Avito после таймаута каталогов:', e2)
    }
  }
}

/** Фаза A (rabota): справочники + применение снимка с таймаутом. */
const loadRabotaCatalogsMinimalWithApplyForEdit = async () => {
  const runCore = async () => {
    const [professionsResult, regionsResult, employmentResult, schedulesResult, experienceResult, educationResult] =
      await Promise.all([
        getProfessionsRabota(),
        getRegionsRabota(),
        getEmploymentTypesRabota(),
        getWorkSchedulesRabota(),
        getExperienceLevelsRabota(),
        getEducationLevelsRabota(),
      ])

    if (professionsResult?.data) {
      rabotaProfessions.value = Array.isArray(professionsResult.data)
        ? professionsResult.data
        : (professionsResult.data.items || [])
    }
    if (regionsResult?.data) {
      rabotaRegions.value = Array.isArray(regionsResult.data) ? regionsResult.data : (regionsResult.data.items || [])
      cities.value = rabotaRegions.value.map((region) => ({
        id: region.id || region.region_id,
        name: region.name || region.title,
      }))
    }
    if (employmentResult?.data) {
      rabotaEmploymentTypes.value = Array.isArray(employmentResult.data)
        ? employmentResult.data
        : (employmentResult.data.items || [])
    }
    if (schedulesResult?.data) {
      rabotaWorkSchedules.value = Array.isArray(schedulesResult.data)
        ? schedulesResult.data
        : (schedulesResult.data.items || [])
    }
    if (experienceResult?.data) {
      rabotaExperienceLevels.value = Array.isArray(experienceResult.data)
        ? experienceResult.data
        : (experienceResult.data.items || [])
    }
    if (educationResult?.data) {
      rabotaEducationLevels.value = Array.isArray(educationResult.data)
        ? educationResult.data
        : (educationResult.data.items || [])
    }
    applyRabotaActivePublicationToForm()
  }
  try {
    await Promise.race([
      runCore(),
      new Promise((_, reject) => {
        setTimeout(() => reject(new Error('rabota_catalogs_timeout')), EDIT_PLATFORM_CATALOG_RACE_MS)
      }),
    ])
  } catch (e) {
    console.warn('AddPublication: справочники rabota.ru (редактирование):', e)
    try {
      applyRabotaActivePublicationToForm()
    } catch (e2) {
      console.warn('AddPublication: префилл rabota после таймаута:', e2)
    }
  }
}

/** Фаза B (Avito): подсказки городов для «Место работы» — не блокирует form-ready. */
const loadAvitoAddressHintsOnly = async () => {
  try {
    const { data: areasData, error: areasError } = await getAreasHh()
    if (!areasError && areasData) {
      addresses.value = dedupeAreasByName(areasData)
    } else {
      addresses.value = []
    }
  } catch (e) {
    console.warn('Avito: подсказки адресов (фаза B):', e)
    addresses.value = []
  }
}

function applyEditingVacancyPlatformShell() {
  const plat = currentPlatform.value
  if (!plat) return
  const key = platforms.value.find(
    (p) =>
      p.platform === plat ||
      (plat === 'superjob' && (p.platform === 'superjob' || p.platform === 'superjob.ru')),
  )
  if (!key) return
  data.value.platform = key
  data.value.vacancy_properties = {
    properties: [
      {
        property_type: tariffsOptions.value[0],
      },
    ],
  }
}

/** Профили площадок и тяжёлые догрузки после снятия прелоадера (редактирование, не HH). */
async function ensurePlatformAuthForEditingModeDeferred() {
  if (!isEditingMode.value || props.selectedPlatform) return
  const target = currentPlatform.value
  if (!target || target === 'hh') return

  const key = platforms.value.find(
    (p) =>
      p.platform === target ||
      (target === 'superjob' && (p.platform === 'superjob' || p.platform === 'superjob.ru')),
  )
  if (!key) return

  if (!isPlatforms.value) {
    if (key.platform == 'avito') {
      const profile = await profileAvito()
      if (profile && !profile.error) {
        key.isAuthenticated = true
        key.data = profile.data?.data ?? profile.data
        isPlatforms.value = true
      }
    } else if (key.platform == 'rabota') {
      const profile = await profileRabota()
      if (!profile.error && profile.data) {
        key.isAuthenticated = true
        key.data = profile.data.data
        isPlatforms.value = true
      }
    } else if (key.platform == 'superjob' || key.platform == 'superjob.ru') {
      key.isAuthenticated = true
      isPlatforms.value = true
    }
  }

  if (key.platform === 'avito') {
    await loadAvitoAddressHintsOnly()
  }
}

// Справочники hh.ru по умолчанию — не грузим при редактировании публикации avito/rabota/superjob (как отдельные платформы; HH — отдельное окно).
const skipDefaultHhReferenceLoads = isEditingMode.value && currentPlatform.value !== 'hh'

if (!isNewPublicationFromCard && !skipDefaultHhReferenceLoads) {
  const rolesPayload = await getRolesHh()
  if (rolesPayload && !rolesPayload.errorRoles && rolesPayload.roles) {
    currectRole.value = rolesPayload.roles.categories
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

if (!isNewPublicationFromCard && !skipDefaultHhReferenceLoads) {
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
  const salaryFromVacancy = resolveJoblySalaryRangeFromVacancy(vacancy)
  if (salaryFromVacancy) {
    if (!data.value.salary_range) data.value.salary_range = { from: null, to: null }
    if (salaryFromVacancy.from != null) data.value.salary_range.from = salaryFromVacancy.from
    if (salaryFromVacancy.to != null) data.value.salary_range.to = salaryFromVacancy.to
  }
  if (vacancy.salary_frequency != null && String(vacancy.salary_frequency).trim() !== '') {
    data.value.salary_frequency = vacancy.salary_frequency
  }
  if (vacancy.salary_type != null && String(vacancy.salary_type).trim() !== '') {
    data.value.salary_type = vacancy.salary_type
  }
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
          const timeoutFields = new Promise((resolve) => {
            setTimeout(() => resolve({ __timeout: true }), VACANCY_FIELDS_FETCH_MS)
          })
          const fields = await Promise.race([getVacancyFields(), timeoutFields])
          if (fields && typeof fields === 'object' && fields.__timeout) {
            console.warn('Маппинг водительских прав: таймаут /vacancy-fields, подставляем drivers из вакансии')
            data.value.driver_license_types = vacancy.drivers
          } else {
            applyDriversMap(fields)
          }
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
  if (currentPlatform.value === 'avito') {
    applyAvitoDescriptionFromJobly()
    applyAvitoSalaryFromJobly()
    applyAvitoContactsFromJobly()
    applyAvitoWorkPlaceFromJobly()
    await ensureAvitoPayoutFrequencyMappingsLoaded()
    await applyAvitoMappedSalaryPeriodFromJobly()
    await applyAvitoMappedSalaryTaxFromJobly()
    await applyAvitoMappedPayoutFrequencyFromJobly()
  }

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
    if (currentPlatform.value === 'avito') {
      void applyAvitoMappedContractFromJobly()
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
  if (currentPlatform.value !== 'avito') {
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
  }
  if (currentPlatform.value !== 'avito') {
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

  // Импортированная публикация (лёгкий режим): пустая форма как при публикации; для Avito — название и профессия из live-снимка.
  if (props.editPublicationLightShell && props.editingVacancy?.id) {
    vacancyId = String(props.editingVacancy.id);
    const platformData = props.editingVacancy.platforms_data?.[0];
    if (platformData) {
      const platformNumericId = platformData.id != null && String(platformData.id).trim() !== ''
        ? Number(platformData.id)
        : NaN;
      const platformNameFromId = Number.isFinite(platformNumericId) && platformIdToName[platformNumericId]
        ? platformIdToName[platformNumericId]
        : null;
      const platformName =
        platformNameFromId ??
        (platformData.name ? normalizePlatformName(platformData.name) : null);
      const platformKey = platforms.value?.find(
        (p) =>
          p.platform === platformName ||
          (Number.isFinite(platformNumericId) &&
            platformNumericId === 4 &&
            (p.platform === 'superjob' || p.platform === 'superjob.ru')),
      ) ?? platforms.value?.[0];
      if (platformKey) {
        data.value.platform = platformKey;
      }
    }
    avitoActivePublication.value = null;
    rabotaActivePublication.value = null;
    avitoLightEditLivePublication.value = null;
    const pd0 = props.editingVacancy.platforms_data?.[0];
    const platformNumericId0 =
      pd0?.id != null && String(pd0.id).trim() !== '' ? Number(pd0.id) : NaN;
    let titleOnly = ''
    let descriptionOnly = ''
    const joblyIdAv =
      props.editingVacancy.id != null && String(props.editingVacancy.id).trim() !== ''
        ? Number(props.editingVacancy.id)
        : NaN
    let joblyTitleOnly = ''
    if (Number.isFinite(platformNumericId0) && platformNumericId0 === 2 && Number.isFinite(joblyIdAv) && joblyIdAv > 0) {
      // Снимок на бэкенде: GET /vacancies/{id} вызывает ensure снимка; затем читаем БД (local_only), при пустоте — полный эндпоинт с синком.
      try {
        const baseVacancy = await getVacancyByIdWithTimeout(String(joblyIdAv))
        const baseName = String(baseVacancy?.name ?? '').trim()
        if (baseName) {
          joblyTitleOnly = baseName
        }
      } catch {
        /* без заголовка в UI */
      }
      try {
        const snapLocal = await withTimeoutSafe(
          () => getAvitoPublicationOriginalLocalOnly(joblyIdAv),
          PLATFORM_PUBLICATION_LOCAL_FETCH_MS,
          'avito local_only (light edit)',
          null,
        )
        const poLocal = snapLocal?.data?.payload_original
        if (
          !snapLocal?.error &&
          poLocal != null &&
          typeof poLocal === 'object' &&
          Object.keys(poLocal).length > 0
        ) {
          const pub = unwrapAvitoPublicationPayload(poLocal)
          if (pub && typeof pub === 'object') {
            avitoLightEditLivePublication.value = pub
            const t = avitoPublicationTitleOnly(pub)
            if (t) titleOnly = t
            const d = avitoPublicationDescriptionOnly(pub)
            if (d) descriptionOnly = formatAvitoDescriptionForEditor(d)
          }
        }
        if (!descriptionOnly) {
          const dOrig = extractDescriptionOriginalFromSnapshotOriginal(snapLocal?.data?.original)
          if (dOrig) descriptionOnly = formatAvitoDescriptionForEditor(dOrig)
        }
      } catch (e0) {
        console.warn('AddPublication: локальный снимок Avito (лёгкое редактирование):', e0)
      }
      if (avitoLightEditLivePublication.value == null) {
        try {
          const timeoutPromise = new Promise((resolve) => {
            setTimeout(
              () => resolve({ error: 'timeout', data: null, __timeout: true }),
              PLATFORM_PUBLICATION_LIVE_FETCH_MS,
            )
          })
          const syncRes = await Promise.race([
            getAvitoPublicationOriginalSync(joblyIdAv),
            timeoutPromise,
          ])
          if (syncRes?.__timeout) {
            console.warn(
              'AddPublication: таймаут снимка Avito при лёгком редактировании (GET …/vacancies/{id}/avito-publication-original)',
            )
          } else if (
            !syncRes?.error &&
            syncRes?.data?.payload_original != null &&
            typeof syncRes.data.payload_original === 'object' &&
            Object.keys(syncRes.data.payload_original).length > 0
          ) {
            const pub = unwrapAvitoPublicationPayload(syncRes.data.payload_original)
            if (pub && typeof pub === 'object') {
              avitoLightEditLivePublication.value = pub
              const t = avitoPublicationTitleOnly(pub)
              if (t) titleOnly = t
              const d = avitoPublicationDescriptionOnly(pub)
              if (d) descriptionOnly = formatAvitoDescriptionForEditor(d)
            }
          }
          if (!descriptionOnly) {
            const dOrig = extractDescriptionOriginalFromSnapshotOriginal(syncRes?.data?.original)
            if (dOrig) descriptionOnly = formatAvitoDescriptionForEditor(dOrig)
          }
          if (import.meta.dev) {
            console.info('[AddPublication] Avito снимок (лёгкий режим)', {
              vacancyId: joblyIdAv,
              syncError: syncRes?.error ?? null,
              timedOut: Boolean(syncRes?.__timeout),
              resolvedTitle: titleOnly || '(пусто)',
              hasDescription: Boolean(descriptionOnly),
            })
          }
        } catch (e) {
          console.warn('AddPublication: снимок Avito при лёгком редактировании:', e)
        }
      }
      if (!titleOnly && !joblyTitleOnly) {
        titleOnly = resolveEditingImportedPublicationTitle(props.editingVacancy)
      }
    } else {
      titleOnly = resolveEditingImportedPublicationTitle(props.editingVacancy)
    }

    if (joblyTitleOnly) {
      titleOnly = joblyTitleOnly
    }

    globCurrentVacancy.value = {
      id: Number(vacancyId),
      name: titleOnly,
    };
    data.value.name = titleOnly;
    if (descriptionOnly) {
      data.value.description = formatAvitoDescriptionForEditor(
        formatDescriptionForAvitoApi(descriptionOnly),
      )
    } else {
      data.value.description = ''
    }
    updateDescriptionValidation(data.value.description)
    return;
  }

  if (props.editingVacancy?.id) {
    vacancyId = String(props.editingVacancy.id);
    const platformData = props.editingVacancy.platforms_data?.[0];
    if (platformData) {
      const platformNumericId = platformData.id != null && String(platformData.id).trim() !== ''
        ? Number(platformData.id)
        : NaN
      const platformNameFromId = Number.isFinite(platformNumericId) && platformIdToName[platformNumericId]
        ? platformIdToName[platformNumericId]
        : null
      const platformName =
        platformNameFromId ??
        (platformData.name ? normalizePlatformName(platformData.name) : null)
      // Для SuperJob (id 4) ищем по 'superjob' или 'superjob.ru'
      const platformKey = platforms.value?.find(
        (p) =>
          p.platform === platformName ||
          (Number.isFinite(platformNumericId) &&
            platformNumericId === 4 &&
            (p.platform === 'superjob' || p.platform === 'superjob.ru'))
      ) ?? platforms.value?.[0];
      if (platformKey) {
        data.value.platform = platformKey;
      }

      const prefetchEditingVacancyRow = async () => {
        if (isNewPublicationFromCard) return
        const vId = vacancyId
        if (vId == null || String(vId).trim() === '') return
        const mustFetchVacancy =
          !globCurrentVacancy.value ||
          String(vId) !== globCurrentVacancy.value.id?.toString()
        if (!mustFetchVacancy) return
        try {
          const vacancy = await getVacancyByIdWithTimeout(vId)
          if (vacancy) {
            globCurrentVacancy.value = vacancy
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
        } catch (e) {
          console.warn('AddPublication: предзагрузка вакансии при редактировании:', e)
        }
      }

      await prefetchEditingVacancyRow()
      await Promise.all([
        (async () => {
      // Rabota.ru: сначала снимок из БД Jobly, иначе — API rabota с таймаутом.
      if (
        Number.isFinite(platformNumericId) &&
        platformNumericId === 3 &&
        platformData.platform_id != null &&
        String(platformData.platform_id).trim() !== ''
      ) {
        try {
          const joblyIdRabota = props.editingVacancy?.id
          let filledRabota = false
          if (joblyIdRabota != null) {
            const snapR = await withTimeoutSafe(
              () => getRabotaPublicationOriginalLocalOnly(Number(joblyIdRabota)),
              PLATFORM_PUBLICATION_LOCAL_FETCH_MS,
              'rabota local_only (edit)',
              null,
            )
            const poR = snapR?.data?.payload_original
            if (!snapR?.error && poR != null && typeof poR === 'object' && Object.keys(poR).length > 0) {
              rabotaActivePublication.value = poR
              filledRabota = true
            }
          }
          if (!filledRabota) {
            const timeoutR = new Promise((resolve) => {
              setTimeout(
                () => resolve({ error: 'timeout', data: null, __timeout: true }),
                PLATFORM_PUBLICATION_LIVE_FETCH_MS,
              )
            })
            const pubResR = await Promise.race([
              getRabotaPublication(String(platformData.platform_id)),
              timeoutR,
            ])
            if (pubResR?.__timeout) {
              console.warn('Rabota: таймаут загрузки публикации с API')
            } else if (!pubResR?.error && pubResR?.data) {
              rabotaActivePublication.value = pubResR.data
            }
          }
        } catch (e) {
          console.warn('Не удалось загрузить публикацию rabota.ru для префилла формы:', e)
        }
      }
      // Avito.ru: сначала снимок из БД Jobly (мгновенно), иначе — API Avito с таймаутом (без таймаута модалка зависает на лоадере).
      if (
        Number.isFinite(platformNumericId) &&
        platformNumericId === 2 &&
        platformData.platform_id != null &&
        String(platformData.platform_id).trim() !== ''
      ) {
        try {
          const joblyId = props.editingVacancy?.id
          let filled = false
          if (joblyId != null) {
            const snap = await withTimeoutSafe(
              () => getAvitoPublicationOriginalLocalOnly(Number(joblyId)),
              PLATFORM_PUBLICATION_LOCAL_FETCH_MS,
              'avito local_only (edit)',
              null,
            )
            const po = snap?.data?.payload_original
            if (!snap?.error && po != null && typeof po === 'object' && Object.keys(po).length > 0) {
              avitoActivePublication.value = po
              filled = true
            }
          }
          if (!filled) {
            const timeoutPromise = new Promise((resolve) => {
              setTimeout(
                () => resolve({ error: 'timeout', data: null, __timeout: true }),
                PLATFORM_PUBLICATION_LIVE_FETCH_MS,
              )
            })
            const syncRes = await Promise.race([
              getAvitoPublicationOriginalSync(Number(joblyId)),
              timeoutPromise,
            ])
            if (syncRes?.__timeout) {
              console.warn('Avito: таймаут снимка публикации (GET …/vacancies/{id}/avito-publication-original)')
            } else if (
              !syncRes?.error &&
              syncRes?.data?.payload_original != null &&
              typeof syncRes.data.payload_original === 'object' &&
              Object.keys(syncRes.data.payload_original).length > 0
            ) {
              avitoActivePublication.value = syncRes.data.payload_original
            }
          }
        } catch (e) {
          console.warn('Не удалось загрузить публикацию avito для префилла формы:', e)
        }
      }
      // Для SuperJob: загружаем каталог и подставляем профессиональную сферу из текущей вакансии на платформе
      if (Number.isFinite(platformNumericId) && platformNumericId === 4) {
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
        })(),
      ])
    }
}

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
      if (field === 'experience' && currentPlatform.value === 'avito') return
      if (field === 'employment_form' && currentPlatform.value === 'avito') return
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
  if (isNewPublicationFromCard) {
    const injectedForCard = globCurrentVacancy.value || getInjectedVacancyData()
    if (injectedForCard) {
      globCurrentVacancy.value = injectedForCard
      if (isNewAvitoPublicationFromCard) {
        const cardName = String(injectedForCard?.name ?? injectedForCard?.title ?? '').trim()
        if (cardName) data.value.name = cardName
      } else {
        await applyVacancyToFormFields()
      }
    }
  } else if (vacancyId) {
    const mustFetchVacancy =
      !globCurrentVacancy.value ||
      vacancyId !== globCurrentVacancy.value.id?.toString()

    if (mustFetchVacancy) {
      const vacancy = await getVacancyByIdWithTimeout(vacancyId)
      if (vacancy) {
        globCurrentVacancy.value = vacancy
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

async function applyAvitoJoblySalaryFieldsFromLive() {
  if (currentPlatform.value !== 'avito') return
  if (!shouldApplyJoblySalaryFieldsToAvito()) return
  const live = getInjectedVacancyData()
  if (live?.salary_type != null) {
    data.value.salary_type = live.salary_type
  }
  if (live?.salary_frequency != null) {
    data.value.salary_frequency = live.salary_frequency
  }
  applyAvitoSalaryFromJobly()
  applyAvitoContactsFromJobly()
  await ensureAvitoSalaryPeriodMappingsLoaded()
  await ensureAvitoSalaryTaxMappingsLoaded()
  await ensureAvitoPayoutFrequencyMappingsLoaded()
  await applyAvitoMappedSalaryPeriodFromJobly()
  await applyAvitoMappedSalaryTaxFromJobly()
  await applyAvitoMappedPayoutFrequencyFromJobly()
}

watch(
  () => {
    if (currentPlatform.value !== 'avito' && normalizePlatformName(props.selectedPlatform) !== 'avito') {
      return ''
    }
    const v = vacancyCurrectLive.value
    if (!v) return ''
    return [
      v.salary_tax_id,
      v.salary_type,
      v.salary_frequency,
      v.salary_payment_frequency,
      v.salary_from,
      v.salary_to,
      v.executor_name,
      v.executor_phone,
      v.executor_email,
    ].join('|')
  },
  () => {
    void applyAvitoJoblySalaryFieldsFromLive()
  },
)

const getPhrasesVacancy = async function () {
  const { data, error } = await getPhrases()
  return data
}

// Не блокируем async setup модалки редактирования запросом /phrases — иначе при зависании API лоадер в PublishTab не снимется (onMounted после всех top-level await).
void getPhrasesVacancy()
  .then((d) => {
    phrases.value = d
  })
  .catch(() => {})

// Дефолты для experience/employment_form, если вакансия не загружалась (форма «добавить»)
vacancyIdFields.forEach((field) => {
  const rawPid = props.editingVacancy?.platforms_data?.[0]?.id
  const pid = rawPid != null && String(rawPid).trim() !== '' ? Number(rawPid) : NaN
  if (field === 'experience' && Number.isFinite(pid) && pid === 4) return
  if (field === 'experience' && currentPlatform.value === 'avito') return
  if (field === 'experience' && normalizePlatformName(props.selectedPlatform) === 'avito') return
  if (field === 'employment_form' && currentPlatform.value === 'avito') return
  if (field === 'employment_form' && normalizePlatformName(props.selectedPlatform) === 'avito') return
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

if (
  (currentPlatform.value === 'avito' || normalizePlatformName(props.selectedPlatform) === 'avito') &&
  !isNewAvitoPublicationFromCard
) {
  void (async () => {
    await ensureAvitoExperienceMappingsLoaded()
    await ensureAvitoEmploymentMappingsLoaded()
    await ensureAvitoContractMappingsLoaded()
    await ensureAvitoSalaryPeriodMappingsLoaded()
    await ensureAvitoSalaryTaxMappingsLoaded()
    await ensureAvitoPayoutFrequencyMappingsLoaded()
    await applyAvitoMappedExperienceFromJobly()
    await applyAvitoMappedEmploymentFromJobly()
    await applyAvitoMappedSalaryPeriodFromJobly()
    await applyAvitoMappedContractFromJobly()
    await applyAvitoMappedSalaryTaxFromJobly()
    await applyAvitoMappedPayoutFrequencyFromJobly()
    applyAvitoContactsFromJobly()
  })()
}

const injectedVacancy = getInjectedVacancyData()
if (injectedVacancy && !props.editPublicationLightShell) {
  data.value.name = injectedVacancy.name
  if (currentPlatform.value !== 'hh') {
    data.value.code = injectedVacancy.code
  }
  if (currentPlatform.value === 'avito' || normalizePlatformName(props.selectedPlatform) === 'avito') {
    applyAvitoInstantPrefillFromJobly(injectedVacancy)
    void applyAvitoMappedSalaryTaxFromJobly()
    void applyAvitoMappedPayoutFrequencyFromJobly()
    void applyAvitoMappedContractFromJobly()
  } else if (injectedVacancy.description) {
    data.value.description = injectedVacancy.description
  }
  // Отрасль/специализацию из vacancyData не подставляем, если уже заданы из каталога SuperJob (редактирование вакансии с SuperJob)
  if (data.value.superjob_catalogue_id == null && currectRole.value && Array.isArray(currectRole.value)) {
    data.value.industry = currectRole.value.find((n) => n.name === injectedVacancy.industry) ?? null
    if (data.value.industry !== undefined && data.value.industry?.roles?.length > 0) {
      const roleMatch = data.value.industry.roles.filter(function (n) {
        return n.name == injectedVacancy.specializations
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

if (!inject('isPlatforms') && !isNewPublicationFromCard && currentPlatform.value === 'hh' && !isEditingMode.value) {
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
const skipAvitoBootstrappingForPublishCard = isNewAvitoPublicationFromCard
const avitoPublishCardNameHydratedFromRoute = ref(false)
let avitoPublishCardBootstrapPromise = null

async function applyAvitoPublishCardMappingsFromJobly() {
  if (!skipAvitoBootstrappingForPublishCard) return
  await applyAvitoMappedProfessionFromJobly()
  await applyAvitoMappedExperienceFromJobly()
  await applyAvitoMappedEmploymentFromJobly()
  await applyAvitoMappedContractFromJobly()
  await applyAvitoMappedSalaryPeriodFromJobly()
  await applyAvitoMappedSalaryTaxFromJobly()
  await applyAvitoMappedPayoutFrequencyFromJobly()
  applyAvitoDescriptionFromJobly()
  applyAvitoSalaryFromJobly()
  applyAvitoContactsFromJobly()
  applyAvitoWorkPlaceFromJobly()
}

/** Каталоги и маппинг Avito после первого рендера (карточка «Опубликовать») — не блокируем async setup. */
async function bootstrapAvitoPublishCardForm() {
  if (!skipAvitoBootstrappingForPublishCard) return
  if (avitoPublishCardBootstrapPromise) return avitoPublishCardBootstrapPromise

  avitoPublishCardBootstrapPromise = (async () => {
    try {
      const v = getInjectedVacancyData() || globCurrentVacancy.value
      if (v) {
        applyAvitoInstantPrefillFromJobly(v)
        joblyVacancyPrefillApplied.value = true
      }
      await loadAvitoDictionariesCore()
      await ensureAvitoContactEmployeesLoaded()
      if (v) {
        await applyAvitoMappedProfessionFromJobly()
      }
      void loadAvitoDictionariesSecondaryMappings()
        .then(() => (v ? applyAvitoPublishCardMappingsFromJobly() : undefined))
        .catch((e) => {
          console.warn('Avito: вторичные маппинги карточки публикации:', e)
        })
      if (!avitoPublishCardNameHydratedFromRoute.value) {
        await ensureAvitoPublishCardNameFromRouteVacancy()
      }
      void loadAvitoAddressHintsOnly().then(() => {
        applyAvitoWorkPlaceFromJobly()
      })
    } catch (e) {
      console.warn('Avito: отложенная загрузка формы публикации:', e)
    }
  })()

  return avitoPublishCardBootstrapPromise
}

function applyAvitoPublishCardNameFromJobly(source) {
  if (!skipAvitoBootstrappingForPublishCard) return
  const rawName =
    source?.name ??
    source?.title ??
    source?.vacancy_name ??
    source?.vacancyTitle ??
    source?.position ??
    source?.position_name
  const name = String(rawName ?? '').trim()
  if (name) data.value.name = name
  applyAvitoDescriptionFromJobly()
  applyAvitoSalaryFromJobly()
  applyAvitoContactsFromJobly()
  applyAvitoWorkPlaceFromJobly()
  void applyAvitoMappedContractFromJobly()
}

/** Синхронный префилл при открытии карточки Avito — не ждём каталоги и маппинги. */
function applyAvitoInstantPrefillFromJobly(source) {
  const isAvito =
    currentPlatform.value === 'avito' || normalizePlatformName(props.selectedPlatform) === 'avito'
  if (!isAvito || !source || typeof source !== 'object') return
  globCurrentVacancy.value = source
  applyAvitoPublishCardNameFromJobly(source)
  if (source.salary_frequency != null && String(source.salary_frequency).trim() !== '') {
    data.value.salary_frequency = source.salary_frequency
  }
  if (source.salary_type != null && String(source.salary_type).trim() !== '') {
    data.value.salary_type = source.salary_type
  }
  const addr = source.work_address ?? source.workAddress
  if (addr != null && String(addr).trim() !== '') {
    data.value.workAddress = String(addr).trim()
    if (!String(data.value.address?.building ?? data.value.address?.name ?? '').trim()) {
      applyAvitoWorkPlaceFromAddressText(String(addr).trim())
    }
  }
}

function applyAvitoIndustryIdMigration() {
  if (currentPlatform.value !== 'avito') return
  const cur = data.value.industry
  if (!cur?.id) return
  const apiId = resolveBusinessAreaIdForAvitoApi(cur.id, avitoBusinessAreas.value)
  if (apiId == null) {
    data.value.industry = null
    return
  }
  if (String(apiId) === String(cur.id)) return
  const match = Array.isArray(currectRole.value)
    ? currectRole.value.find((a) => String(a.id) === String(apiId))
    : null
  data.value.industry = match ? { ...match } : { ...cur, id: apiId }
}

function ingestAvitoCatalogsApiResult(catalogsResult) {
  if (catalogsResult?.data && !catalogsResult.error && typeof catalogsResult.data === 'object') {
    avitoCatalogs.value = catalogsResult.data
    avitoProfessions.value = Array.isArray(catalogsResult.data.profession) ? catalogsResult.data.profession : []
    const rawBusinessAreas = Array.isArray(catalogsResult.data.business_area) ? catalogsResult.data.business_area : []
    avitoBusinessAreas.value = filterActiveAvitoBusinessAreaCatalog(rawBusinessAreas)
    currectRole.value = avitoBusinessAreas.value.map((area) => ({
      id: area.id,
      name: area.name || area.title,
      roles: [],
    }))
    applyAvitoIndustryIdMigration()
  }
}

function ingestAvitoSecondaryMappingResults({
  experienceMappingsResult,
  employmentMappingsResult,
  contractMappingsResult,
  salaryPeriodMappingsResult,
  salaryTaxMappingsResult,
  payoutFrequencyMappingsResult,
}) {
  if (experienceMappingsResult?.data && !experienceMappingsResult.error && typeof experienceMappingsResult.data === 'object') {
    avitoExperienceMappings.value = unwrapAvitoMappingsPayload(experienceMappingsResult.data)
  }
  if (employmentMappingsResult?.data && !employmentMappingsResult.error && typeof employmentMappingsResult.data === 'object') {
    avitoEmploymentMappings.value = unwrapAvitoMappingsPayload(employmentMappingsResult.data)
  }
  if (contractMappingsResult?.data && !contractMappingsResult.error && typeof contractMappingsResult.data === 'object') {
    avitoContractMappings.value = unwrapAvitoMappingsPayload(contractMappingsResult.data)
  }
  if (salaryPeriodMappingsResult?.data && !salaryPeriodMappingsResult.error && typeof salaryPeriodMappingsResult.data === 'object') {
    avitoSalaryPeriodMappings.value = unwrapAvitoMappingsPayload(salaryPeriodMappingsResult.data)
  }
  if (salaryTaxMappingsResult?.data && !salaryTaxMappingsResult.error && typeof salaryTaxMappingsResult.data === 'object') {
    avitoSalaryTaxMappings.value = unwrapAvitoMappingsPayload(salaryTaxMappingsResult.data)
  }
  if (payoutFrequencyMappingsResult?.data && !payoutFrequencyMappingsResult.error && typeof payoutFrequencyMappingsResult.data === 'object') {
    avitoPayoutFrequencyMappings.value = unwrapAvitoMappingsPayload(payoutFrequencyMappingsResult.data)
  }
}

async function loadAvitoDictionariesCore() {
  const hasCatalogs = Array.isArray(avitoProfessions.value) && avitoProfessions.value.length > 0
  const hasSpec =
    Object.keys(unwrapAvitoMappingsPayload(avitoSpecializationMappings.value)).length > 0
  if (hasCatalogs && hasSpec) return

  const [catalogsResult, mappingsResult] = await Promise.all([
    hasCatalogs ? Promise.resolve(null) : getAvitoCatalogs(),
    hasSpec ? Promise.resolve(null) : getAvitoSpecializationMappings(),
  ])
  if (catalogsResult) ingestAvitoCatalogsApiResult(catalogsResult)
  if (mappingsResult?.data && !mappingsResult.error && typeof mappingsResult.data === 'object') {
    avitoSpecializationMappings.value = unwrapAvitoMappingsPayload(mappingsResult.data)
  }
}

async function loadAvitoDictionariesSecondaryMappings() {
  const [
    experienceMappingsResult,
    employmentMappingsResult,
    contractMappingsResult,
    salaryPeriodMappingsResult,
    salaryTaxMappingsResult,
    payoutFrequencyMappingsResult,
  ] = await Promise.all([
    getAvitoExperienceMappings(),
    getAvitoEmploymentMappings(),
    getAvitoContractMappings(),
    getAvitoSalaryPeriodMappings(),
    getAvitoSalaryTaxMappings(),
    getAvitoPayoutFrequencyMappings(),
  ])
  ingestAvitoSecondaryMappingResults({
    experienceMappingsResult,
    employmentMappingsResult,
    contractMappingsResult,
    salaryPeriodMappingsResult,
    salaryTaxMappingsResult,
    payoutFrequencyMappingsResult,
  })
}

function resolveJoblyVacancyIdFromRoute() {
  const p = route.params?.id
  const q = route.query?.id
  const v = route.query?._vid
  if (p != null && String(p).trim() !== '') return String(p).trim()
  if (q != null && String(q).trim() !== '') return String(q).trim()
  if (v != null && String(v).trim() !== '') return String(v).trim()
  return null
}

async function ensureAvitoPublishCardNameFromRouteVacancy() {
  if (!skipAvitoBootstrappingForPublishCard || avitoPublishCardNameHydratedFromRoute.value) return
  const vacancyId = resolveJoblyVacancyIdFromRoute()
  if (!vacancyId) return
  const vacancy = await getVacancyByIdWithTimeout(vacancyId)
  const name = String(vacancy?.name ?? '').trim()
  if (!name) return
  data.value.name = name
  globCurrentVacancy.value = vacancy
  await applyAvitoPublishCardMappingsFromJobly()
  avitoPublishCardNameHydratedFromRoute.value = true
}

// Карточка «Опубликовать»: vacancyCurrect может прийти позже (после async загрузки в PublishTab) — догоняем префилл по watch.
watch(
  () => currentPlatform.value === 'avito',
  (isAvito) => {
    if (isAvito) void ensureAvitoContactEmployeesLoaded()
  },
  { immediate: true },
)

watch(
  () => getInjectedVacancyData(),
  async (v) => {
    if (!isNewPublicationFromCard) return
    if (isNewAvitoPublicationFromCard) {
      if (v) applyAvitoInstantPrefillFromJobly(v)
      else applyAvitoPublishCardNameFromJobly(v)
      void bootstrapAvitoPublishCardForm()
      return
    }
    applyAvitoPublishCardNameFromJobly(v)
    if (!v || joblyVacancyPrefillApplied.value) return
    globCurrentVacancy.value = v
    try {
      await fillFormFromCurrentVacancy()
      if (currentPlatform.value === 'rabota') {
        applyJoblyVacancyToRabotaForm(v)
      }
    } finally {
      joblyVacancyPrefillApplied.value = true
    }
  },
  { immediate: true },
)

if (targetPlatformFromProps) {
  const platformKey = platforms.value?.find((p) => p.platform === targetPlatformFromProps)
  if (platformKey) {
    data.value.platform = platformKey
    applyAvitoPublishCardNameFromJobly(globCurrentVacancy.value || getInjectedVacancyData())
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
      if (!skipAvitoBootstrappingForPublishCard) {
        await loadDictionaries('avito')
      } else {
        platformKey.isAuthenticated = true
        isPlatforms.value = true
      }
    } else if (targetPlatformFromProps === 'rabota') {
      await loadDictionaries('rabota')
    }
  }
}

function applyConnectedExportMapToForm(rowKeys, platform) {
  // Сейчас используем только «обнуление» неподключённых полей после префилла.
  // Это безопаснее, чем пытаться маппить поля до заполнения (форма сложная и зависит от справочников).
  const has = (k) => rowKeys.has(k)

  // Общие поля
  if (!has('name')) data.value.name = ''
  if (!has('description')) data.value.description = ''

  // Специализация (в нашей форме: industry + professional_roles[0])
  if (!has('specializations')) {
    data.value.industry = null
    data.value.professional_roles = [null]
  }

  // Условия/классификаторы
  if (!has('employment')) data.value.employment_form = null
  if (!has('schedule')) data.value.work_schedule_by_days = null
  if (!has('experience')) data.value.experience = null
  if (!has('education')) data.value.education_level = null

  // Локация
  if (!has('area')) data.value.area = null
  if (!has('address')) data.value.address = null

  // Зарплата (в форме HH — salary_range, для rabota сейчас переиспользуем ту же структуру, если она есть)
  if (!has('salary_amounts') && !has('currency') && !has('salary_mode') && !has('salary_payment_freq')) {
    if ('salary_range' in (data.value || {})) {
      data.value.salary_range = null
    }
    if ('salary' in (data.value || {})) {
      data.value.salary = null
    }
    data.value.salary_from = null
    data.value.salary_to = null
  }
}

// debug: avoid `alert` here — component can execute during SSR/hydration
if (import.meta.client) {
  //console.log('AddPublication init:', { targetPlatformFromProps, isNewPublicationFromCard })
}
// rabota.ru: при открытии модалки «Опубликовать» подгружаем маппинг полей (аналог hh-export-map)
if (isNewPublicationFromCard && targetPlatformFromProps === 'rabota') {
  try {
    rabotaExportMapRows.value = await getRabotaVacancyExportMap()
  } catch (e) {
    rabotaExportMapRows.value = []
    console.warn('Не удалось загрузить маппинг полей rabota.ru:', e)
  }
}

// Применяем маппинг после заполнения формы значениями из вакансии
if (isNewPublicationFromCard && targetPlatformFromProps === 'rabota') {
  const rows = Array.isArray(rabotaExportMapRows.value) ? rabotaExportMapRows.value : []
  const connectedKeys = new Set(
    rows
      .filter((r) => r?.connected === true && typeof r?.row_key === 'string' && r.row_key.trim() !== '')
      .map((r) => String(r.row_key).trim())
  )
  if (connectedKeys.size > 0) {
    applyConnectedExportMapToForm(connectedKeys, 'rabota')
  }
}

/** Режим «Активные публикации» → редактирование: одна платформа строки, без перебора hh → avito (лишние запросы и задержка). */
async function ensurePlatformAuthForEditingMode() {
  if (!isEditingMode.value || props.selectedPlatform) return
  const target = currentPlatform.value
  if (!target) return
  const key = platforms.value.find(
    (p) =>
      p.platform === target ||
      (target === 'superjob' && (p.platform === 'superjob' || p.platform === 'superjob.ru'))
  )
  if (!key) return

  if (!isPlatforms.value) {
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
      if (profile && !profile.error) {
        key.isAuthenticated = true
        key.data = profile.data?.data ?? profile.data
        isPlatforms.value = true
      }
    } else if (key.platform == 'rabota') {
      const profile = await profileRabota()
      if (!profile.error && profile.data) {
        key.isAuthenticated = true
        key.data = profile.data.data
        isPlatforms.value = true
      }
    } else if (key.platform == 'superjob') {
      key.isAuthenticated = true
      isPlatforms.value = true
    }
  }

  // Справочники и префилл с площадки — нужны даже при ошибке профиля / уже поднятом isPlatforms из provide.
  try {
    if (key.platform === 'avito') {
      await loadDictionaries('avito')
    } else if (key.platform === 'rabota') {
      await loadDictionaries('rabota')
    } else if (key.platform === 'superjob' || key.platform === 'superjob.ru') {
      await loadDictionaries('superjob')
    }
  } catch (e) {
    console.warn('AddPublication: loadDictionaries в режиме редактирования:', e)
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

if (isEditingMode.value && !props.selectedPlatform) {
  try {
    const plat = currentPlatform.value
    applyEditingVacancyPlatformShell()

    if (props.editPublicationLightShell) {
      if (plat === 'avito') {
        await loadDictionaries('avito', { skipAvitoAddressHints: true })
      } else if (plat === 'rabota') {
        await loadDictionaries('rabota')
      } else if (plat === 'superjob' || plat === 'superjob.ru') {
        await loadDictionaries('superjob')
      } else if (plat === 'hh') {
        await ensurePlatformAuthForEditingMode()
      }
      if (import.meta.client) {
        void nextTick(() => emit('form-ready'))
      }
      void (async () => {
        try {
          await ensurePlatformAuthForEditingModeDeferred()
        } catch (e) {
          console.warn('AddPublication: ensurePlatformAuthForEditingModeDeferred:', e)
        }
      })()
    } else if (plat === 'hh') {
      await ensurePlatformAuthForEditingMode()
    } else if (plat === 'avito') {
      await loadAvitoCatalogsMinimalWithApplyForEdit()
    } else if (plat === 'rabota') {
      await loadRabotaCatalogsMinimalWithApplyForEdit()
    }

    if (!props.editPublicationLightShell && import.meta.client) {
      void nextTick(() => emit('form-ready'))
    }

    if (!props.editPublicationLightShell) {
      void (async () => {
        try {
          await ensurePlatformAuthForEditingModeDeferred()
        } catch (e) {
          console.warn('AddPublication: ensurePlatformAuthForEditingModeDeferred:', e)
        }
      })()
    }
  } catch (e) {
    console.warn('AddPublication: init редактирования публикации:', e)
    if (import.meta.client) {
      void nextTick(() => emit('form-ready'))
    }
  }
} else {
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
          if (skipAvitoBootstrappingForPublishCard) {
            key.isAuthenticated = true
            isPlatforms.value = true
          } else {
            const profile = await profileAvito()
            if (profile && !profile.error) {
              key.isAuthenticated = true
              key.data = profile.data?.data ?? profile.data
              isPlatforms.value = true
              await loadDictionaries('avito')
            }
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
        if (profile && !profile.error) {
          key.isAuthenticated = true
          key.data = profile.data?.data ?? profile.data
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
}

if (isNewHhPublicationFromCard || isNewAvitoPublicationFromCard) {
  void nextTick(() => emit('form-ready'))
}

const ArrayCurrency = ref(currency)

// Преобразование HH_EXPERIENCE_DAYS для MultiSelect (id -> value)
const experienceDaysOptions = HH_EXPERIENCE_DAYS.map(day => ({
  ...day,
  value: day.id
}))

// Преобразование HH_WORK_FORMAT для MultiSelect (id -> value)
const workFormatOptions = computed(() => {
  if (currentPlatform.value === 'avito' && Array.isArray(avitoCatalogs.value?.work_format) && avitoCatalogs.value.work_format.length > 0) {
    return avitoCatalogs.value.work_format.map((format) => ({
      id: format.id,
      name: format.name || format.title,
      value: format.id,
    }))
  }
  return HH_WORK_FORMAT.map(format => ({
    ...format,
    value: format.id
  }))
})

// Преобразование графика работы для MultiSelect (id -> value)
const workScheduleOptions = computed(() => {
  const schedules = workSchedulesOptions.value
  return schedules.map(schedule => ({
    ...schedule,
    value: schedule.id
  }))
})

// Преобразование HH_WORKING_HOURS для MultiSelect (id -> value)
const workingHoursOptions = computed(() => {
  if (currentPlatform.value === 'avito' && Array.isArray(avitoCatalogs.value?.work_hours_per_day) && avitoCatalogs.value.work_hours_per_day.length > 0) {
    return avitoCatalogs.value.work_hours_per_day.map((hours) => ({
      id: hours.id,
      name: hours.name || hours.title,
      value: hours.id,
    }))
  }
  return HH_WORKING_HOURS.map(hours => ({
    ...hours,
    value: hours.id
  }))
})

// Преобразование условий «Готовы рассмотреть» для MultiSelect (id -> value).
const avitoReadyConsiderOptions = AVITO_READY_CONSIDER_OPTIONS.map(condition => ({
  ...condition,
  value: condition.id
}))

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

function isArrayItemSelected(arr, id) {
  if (!Array.isArray(arr)) return false
  return arr.some((item) => {
    if (item && typeof item === 'object') {
      return String(item.id ?? item.value ?? '') === String(id)
    }
    return String(item) === String(id)
  })
}

function toggleArrayItem(field, id) {
  const source = Array.isArray(data.value[field]) ? [...data.value[field]] : []
  const idx = source.findIndex((item) => String(item?.id ?? item) === String(id))
  if (idx >= 0) {
    source.splice(idx, 1)
  } else {
    source.push({ id })
  }
  data.value[field] = source
}

function handleAvitoWorkPlaceUpdate(value) {
  if (!value) {
    data.value.address = { show_metro_only: data.value.address?.show_metro_only ?? false }
    data.value.area = {}
    updateValidField('address', false)
    return
  }
  const city = addresses.value.find((item) => String(item.id) === String(value)) || null
  const name = city?.name ?? city?.title ?? String(value)
  data.value.address = { ...(data.value.address || {}), id: value, name }
  data.value.area = { id: value, name }
  updateValidField('address', true)
  updateValidField('area', true)
}

function getAvitoContractKeys() {
  const raw = data.value.avito_contract_keys
  if (Array.isArray(raw) && raw.length > 0) {
    return [...new Set(raw.map((v) => String(v ?? '').trim()).filter(Boolean))]
  }
  const legacy = data.value.avito_contract_key != null ? String(data.value.avito_contract_key).trim() : ''
  return legacy ? [legacy] : []
}

function syncAvitoBillingFromContractKeys(keys) {
  const billingId = resolveBillingTypeFromContractKeys(keys)
  if (!billingId) return
  const primary = avitoContractOptions.find((o) => o.id === keys[0]) ?? avitoContractOptions.find((o) => o.billingId === billingId)
  data.value.billing_types = { id: billingId, name: primary?.name ?? billingId }
}

function setAvitoContractKeys(keys) {
  const unique = [...new Set(keys.map((k) => String(k ?? '').trim()).filter(Boolean))]
  data.value.avito_contract_keys = unique
  data.value.avito_contract_key = unique[0] ?? ''
  syncAvitoBillingFromContractKeys(unique)
}

function toggleAvitoContract(option) {
  const keys = getAvitoContractKeys()
  const idx = keys.indexOf(option.id)
  if (idx >= 0) {
    keys.splice(idx, 1)
  } else {
    keys.push(option.id)
  }
  setAvitoContractKeys(keys)
}

function isAvitoContractSelected(option) {
  return getAvitoContractKeys().includes(option.id)
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
    // У формы Avito нет полей графика/часов HH — не блокируем отправку
    if (currentPlatform.value === 'avito' && (key === 'work_schedule_by_days' || key === 'working_hours')) {
      validFields.value[key].status = true
      continue
    }
    // Одно поле «Место работы» (address); «Город публикации» (area) в UI Avito нет — не валидируем отдельно
    if (currentPlatform.value === 'avito' && key === 'area') {
      validFields.value[key].status = true
      continue
    }
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
    if (key === 'professional_roles') {
      const roles = data.value.professional_roles
      const role = Array.isArray(roles) ? roles[0] : roles
      const roleId = role?.id != null ? String(role.id).trim() : ''
      if (!roleId) {
        isValid = false
        validFields.value[key].status = false
      } else {
        validFields.value[key].status = true
      }
      continue
    }
    if (key === 'address' && currentPlatform.value === 'avito') {
      const addr = data.value.address
      const text = String(addr?.building ?? addr?.name ?? data.value.area?.name ?? '').trim()
      const hasId = addr?.id != null && String(addr.id).trim() !== ''
      if (hasId || text.length >= 2) {
        validFields.value[key].status = true
      } else {
        isValid = false
        validFields.value[key].status = false
      }
      continue
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
  let avitoRequestTimedOut = false
  const currentPlatform = data.value.platform?.platform ?? data.value.platform

  if (currentPlatform === 'avito') {
    await ensureAvitoContactEmployeesLoaded()
    if (!data.value.avito_contact_employee?.phone) {
      status.value = 'Выберите контакт из списка Avito (телефон должен быть в аккаунте)'
      statusValidate.value = false
      return
    }
  }

  if (!isEditing && !validateFields()) {
    statusValidate.value = false
    return
  }
  statusValidate.value = true

  // Обработка дополнительных условий (актуально для hh.ru)
  if (data.value.additional_conditions && data.value.additional_conditions.length > 0) {
    const boolConditions = [
      'accept_handicapped',
      'accept_students',
      'accept_pensioners',
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
      if (item.id == 'age_restriction_45') {
        data.value.age_restriction = {
          id: 'AGE_45_PLUS'
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
          const payload = {
            ...data.value,
            vacancy_platform_id: String(vacancyPlatformId),
            publication_id: vacancyPlatformId,
            jobly_vacancy_id: props.editingVacancy?.id,
          };
          const { timedOut, result } = await runWithSoftTimeout(
            () => publishVacancyToAvito(payload, props.editingVacancy?.id),
            AVITO_PUBLISH_SOFT_TIMEOUT_MS,
          )
          avitoRequestTimedOut = timedOut
          platformResponse = result
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
        } else if (platformId === 2 && avitoRequestTimedOut) {
          status.value = 'Вакансия обновлена. Публикация на Avito выполняется дольше обычного и продолжается в фоне.';
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
    const joblyVacancyIdForAvito = resolveJoblyVacancyIdForAvitoPublish()
    if (isDraft.value || isDraft.value === 'true') {
      const { timedOut, result } = await runWithSoftTimeout(
        () => addDraftAvito(data.value, joblyVacancyIdForAvito),
        AVITO_PUBLISH_SOFT_TIMEOUT_MS,
      )
      avitoRequestTimedOut = timedOut
      response = result
    } else {
      const { timedOut, result } = await runWithSoftTimeout(
        () => publishVacancyToAvito(data.value, joblyVacancyIdForAvito),
        AVITO_PUBLISH_SOFT_TIMEOUT_MS,
      )
      avitoRequestTimedOut = timedOut
      response = result
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
    if (currentPlatform === 'avito' && avitoRequestTimedOut) {
      status.value = 'Запрос на публикацию отправлен, Avito отвечает дольше обычного. Обновление может появиться в списке с задержкой.'
    } else if (isDraft.value) {
      status.value = 'Вакансия успешно сохранена в черновике'
    } else {
      status.value = 'Вакансия успешно опубликована'
    }
    emit('saved', { isDraft: !!isDraft.value })
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

// Avito: после догрузки справочника городов пробуем проставить id в «Место работы»,
// если ранее из payload уже был установлен только текст (без id).
watch(
  () => addresses.value,
  (list) => {
    if (currentPlatform.value !== 'avito') return
    if (!Array.isArray(list) || list.length === 0) return
    if (data.value.address?.id != null) return

    const raw = String(data.value.address?.building ?? data.value.address?.name ?? data.value.area?.name ?? '').trim()
    if (!raw) return
    const cityCandidate = raw.split(',')[0]?.trim() || raw
    const match = list.find((c) => String(c?.name || '').trim().toLowerCase() === cityCandidate.toLowerCase())
    if (!match?.id) return

    const showMetroOnly = data.value.address?.show_metro_only ?? false
    data.value.address = {
      ...(data.value.address || {}),
      id: match.id,
      name: match.name,
      show_metro_only: showMetroOnly,
    }
    data.value.area = { id: match.id, name: match.name }
  },
  { immediate: true }
)

// Автоматическая загрузка справочников при смене платформы
watch(() => data.value.platform?.platform, async (newPlatform) => {
  if (newPlatform) {
    if (skipAvitoBootstrappingForPublishCard && newPlatform === 'avito') return
    try {
      await loadDictionaries(newPlatform)
    } catch (e) {
      console.warn('AddPublication: loadDictionaries при смене платформы:', e)
    }
  }
})

// Автоматическая валидация description при изменении
watch(() => data.value.description, (newValue) => {
  if (newValue !== undefined && newValue !== null) {
    updateDescriptionValidation(newValue)
  }
}, { immediate: true })


onMounted(() => {
  if (isNewAvitoPublicationFromCard) {
    void bootstrapAvitoPublishCardForm()
    return
  }
  if (!isNewHhPublicationFromCard) {
    // Режим редактирования: form-ready уже отправлен в конце async setup выше.
    if (!isEditingMode.value) {
      emit('form-ready')
    }
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

.avito-dropdown-unified :deep(.dropdown-selected-option) {
  min-height: 40px;
  display: flex;
  align-items: center;
}

.avito-dropdown-unified :deep(.dropdown-selected-option .text-sm) {
  font-size: 14px;
  line-height: 20px;
}

.avito-dropdown-unified :deep(.dropdown-selected-option .text-space) {
  color: #2f353d;
  font-weight: 400;
}

.avito-dropdown-unified :deep(.dropdown-selected-option .text-slate-custom) {
  color: #9098b4;
  font-weight: 400;
}
</style>