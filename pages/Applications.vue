<template>
  <div class="container pb-72 pt-[34px]">
    <div
      v-if="showPageHeader"
      class="mb-3.5 flex items-center justify-between rounded-fifteen bg-white p-25px"
    >
      <div>
        <p class="mb-2.5 text-xl font-semibold leading-normal text-space">
          Заявки
        </p>
        <p class="text-sm font-normal leading-normal text-slate-custom">
          Отправьте приглашение заказчику и управляйте доступом
        </p>
      </div>
      <div>
        <UiButton
          v-if="userRole === 'admin'"
          size="semiaction"
          variant="action"
          @click="openNewApplicationPopupForRole()"
        >
          Новая заявка
        </UiButton>
        <UiButton
          v-else-if="userRole === 'responsible'"
          size="semiaction"
          variant="action"
          @click="openNewApplicationPopupForRole()"
        >
          Новая заявка
        </UiButton>
        <UiButton
          v-else-if="userRole === 'customer'"
          size="semiaction"
          variant="action"
          @click="openNewApplicationPopupForRole()"
        >
          Новая заявка
        </UiButton>
      </div>
    </div>

    <div
      v-if="!error && !loading && data.length > 0"
      class="applications-table w-full overflow-visible rounded-fifteen bg-white leading-normal"
    >
      <div
        class="applications-table__header header-wrapper grid min-h-[71px] grid-cols-8 items-center gap-x-2.5 rounded-t-fifteen border-b border-athens bg-catskill pl-15px pr-25px"
      >
        <div
          v-for="header in headers"
          :key="header.key"
          class="flex pl-2.5 text-sm font-medium text-slate-custom"
          @click="
            ['createdAt', 'dateWork', 'status'].includes(header.key) &&
            sortBy(header.key)
          "
          :class="{
            'cursor-pointer select-none': [
              'createdAt',
              'dateWork',
              'status',
            ].includes(header.key),
          }"
        >
          <span>{{ header.label }}</span>
          <button
            v-if="['createdAt', 'dateWork', 'status'].includes(header.key)"
            class="custom-button relative ml-[2.2px] flex items-center justify-center"
          >
            <span :style="sortArrowStyle(header.key)" class="ml-1">
              <svg-icon name="sort-arrow" width="16px" height="15px" />
            </span>
          </button>
        </div>
        <div></div>
      </div>
      <div
        v-for="(vacancy, index) in data"
        :key="vacancy.id ?? index"
        :data-vacancy="vacancy.title"
        class="applications-table__row items-wrapper grid min-h-[61px] grid-cols-8 items-center gap-x-2.5 border-b border-athens bg-white pl-15px pr-25px last:rounded-b-fifteen last:border-b-0"
      >
          <div class="py-5 pl-2.5 text-sm font-medium text-space">
            <button
              @click="openPopup(vacancy)"
              class="text-left text-dodger underline"
            >
              {{ vacancy.title }}
            </button>
          </div>
          <div class="flex items-center py-5 pl-2.5">
            <span :class="applicationStatusBadgeClass(vacancy.status)">
              {{ vacancy.status }}
            </span>
          </div>
          <div
            v-if="['admin', 'responsible'].includes(userRole)"
            class="py-5 pl-2.5 text-sm font-medium text-space"
          >
            {{ vacancy.customer }}
          </div>
          <div class="py-5 pl-2.5 text-sm font-medium text-space">
            {{ vacancy.createdAt }}
          </div>
          <div
            v-if="userRole === 'customer'"
            class="py-5 pl-5px text-sm font-medium text-space"
          >
            {{ vacancy.responsible }}
          </div>
          <div>
            <div v-if="userRole === 'admin'">
              <div
                v-if="vacancy.responsible"
                class="py-5 pl-2.5 text-sm font-medium text-space"
              >
                {{ vacancy.responsible }}
              </div>
              <div v-else>
                <div
                  v-if="vacancy.responseChoose"
                  class="py-5 pl-2.5 text-sm font-medium text-dodger"
                >
                  {{ vacancy.responseChoose }}
                </div>
                <button
                  v-else-if="!vacancy.showResponseInput"
                  @click="openResponseInput(vacancy, $event)"
                  class="py-5 pl-2.5 text-sm font-medium text-dodger"
                >
                  Добавить
                </button>
                <response-input
                  v-model="vacancy.responseChoose"
                  v-show="vacancy.showResponseInput"
                  @update:modelValue="
                    value => updateResponseChoose(vacancy, value)
                  "
                  class="max-w-input mb-0 w-full py-5"
                  :responses="vacancy.responsible"
                />
              </div>
            </div>
            <div v-if="userRole === 'responsible'">
              <div
                v-if="vacancy.responsible"
                class="py-5 pl-2.5 text-sm font-medium text-space"
              >
                {{ vacancy.responsible }}
              </div>
              <div v-else>
                <button
                  @click="takeInWork(vacancy)"
                  class="py-5 pl-2.5 text-sm font-medium text-dodger"
                >
                  Взять в работу
                </button>
              </div>
            </div>
            <div v-if="userRole === 'customer'">
              <div
                v-if="vacancy.responsible"
                class="py-5 pl-2.5 text-sm font-medium text-space"
              >
                {{ vacancy.responsible }}
              </div>
              <div v-else>
                <p class="py-5 pl-2.5 text-sm font-normal text-bali">
                  Не назначен
                </p>
              </div>
            </div>
          </div>
          <div class="py-5 pl-2.5 text-sm font-medium text-space">
            {{ vacancy.region }}
          </div>
          <div class="py-5 pl-2.5 text-sm font-medium text-space">
            {{ vacancy.closeDate }}
          </div>
          <div class="py-2.5">
            <DotsDropdown
              :items="applicationDropdownOptions"
              @select-item="
                selectedItem => handleRemoveApplication(selectedItem, vacancy)
              "
            />
          </div>
      </div>
    </div>
    <div v-if="error" class="rounded-fifteen bg-white p-25px text-sm text-red-500">
      {{ error }}
    </div>
    <template v-else-if="loading">
      <ListSectionPlaceholder
        variant="applications"
        loading
        class="rounded-fifteen"
      />
    </template>
    <template v-else-if="data.length === 0">
      <ListSectionPlaceholder
        variant="applications"
        class="rounded-fifteen"
        :title="applicationsEmptyTitle"
        :description="applicationsEmptyDescription"
      >
      <UiButton
        v-if="userRole === 'admin'"
        size="semiaction"
        variant="action"
        @click="openNewApplicationPopupForRole()"
      >
        Новая заявка
      </UiButton>
      <UiButton
        v-else-if="userRole === 'responsible'"
        size="semiaction"
        variant="action"
        @click="openNewApplicationPopupForRole()"
      >
        Новая заявка
      </UiButton>
      <UiButton
        v-else-if="userRole === 'customer'"
        size="semiaction"
        variant="action"
        @click="openNewApplicationPopupForRole()"
      >
        Новая заявка
      </UiButton>
      </ListSectionPlaceholder>
    </template>
    <div v-if="userRole === 'admin' && isNewAppPopupAdmin">
      <transition
        name="fade"
        @after-leave="enableBodyScroll"
        @enter="disableBodyScroll"
      >
        <Popup
          :isOpen="isNewAppPopupAdmin"
          @close="() => (isNewAppPopupAdmin = false)"
          :width="'740px'"
          :showCloseButton="false"
          :disableOverflowHidden="true"
          :parentRounded="true"
          :contentRounded="true"
          :contentPadding="false"
          :noOuterPadding="true"
          :noScrollbarGutter="true"
          :max-height-value="'90vh'"
        >
          <div
            class="flex h-[min(90vh,100dvh)] max-h-[min(90vh,100dvh)] min-h-0 w-full flex-col overflow-hidden rounded-fifteen bg-white"
          >
            <div class="shrink-0 px-25px pt-25px pb-15px">
              <p class="text-xl font-semibold leading-normal text-space">
                Новая заявка
              </p>
            </div>
            <div
              class="popup-scroll min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-25px pb-25px"
            >
          <!-- администратор -->
          <div>
            <div class="mb-15px">
              <p class="mb-5px text-sm font-medium text-space">
                Согласующий
                <span class="text-red-500">*</span>
              </p>
              <p class="mb-7px text-xs font-normal text-slate-custom">
                Кому отправить заявку
              </p>
              <response-input
                class="w-full"
                :responses="approvers"
                :model-value="
                  newApplication.responsible
                    ? newApplication.responsible.name
                    : null
                "
                :showRoles="true"
                placeholder="Выберите согласующего"
                @update:modelValue="updateNewResponsible"
              />
              <div v-if="errors.response" class="mt-1 text-xs text-red-500">
                {{ errors.response }}
              </div>
            </div>
            <div class="mb-15px flex w-full justify-between gap-x-15px">
              <div class="w-full max-w-[400px]">
                <p
                  class="mb-15px text-sm font-medium leading-normal text-space"
                >
                  Название вакансии
                  <span class="text-red-500">*</span>
                </p>
                <MyInput
                  placeholder="Введите название вакансии"
                  v-model="newApplication.position"
                />
                <div v-if="errors.post" class="mt-1 text-xs text-red-500">
                  {{ errors.post }}
                </div>
              </div>
              <div class="w-full">
                <p
                  class="mb-15px text-sm font-medium leading-normal text-space"
                >
                  Отдел
                </p>
                <response-input
                  class="w-full"
                  :responses="departments"
                  :model-value="
                    newApplication.division
                      ? newApplication.division.name
                      : null
                  "
                  :showRoles="true"
                  notFound="Отдел не найден"
                  placeholder="Введите название отдела"
                  @update:modelValue="updateNewDivision"
                />
                <!-- <MyInput
                  placeholder="Введите название подразделения"
                  v-model="newApplication.division"
                /> -->
                <!-- <div v-if="errors.department" class="text-red-500 text-xs mt-1">
                  {{ errors.department }}
                </div> -->
              </div>
            </div>
            <div class="mb-15px w-full">
              <p class="mb-15px text-sm font-medium leading-normal text-space">
                Город поиска
                <span class="text-red-500">*</span>
              </p>
              <geo-input
                v-model="newApplication.city"
                :placeholder="'Введите город'"
              />
              <div v-if="errors.location" class="mt-1 text-xs text-red-500">
                {{ errors.location }}
              </div>
            </div>
            <div class="mb-15px w-full">
              <p class="mb-15px text-sm font-medium leading-normal text-space">
                Сколько человек нужно нанять
                <span class="text-red-500">*</span>
              </p>
              <MyInput
                placeholder="Введите число позиций на вакансию"
                v-model="newApplication.count"
                :type="'Number'"
              />
              <div v-if="errors.positions" class="mt-1 text-xs text-red-500">
                {{ errors.positions }}
              </div>
            </div>
            <div class="mb-15px flex w-full gap-x-15px">
              <div class="w-full">
                <p
                  class="mb-15px text-sm font-medium leading-normal text-space"
                >
                  Зарплата
                </p>
                <SalaryRange
                  :from="newApplication.salaryFrom"
                  :to="newApplication.salaryTo"
                  @update:from="newApplication.salaryFrom = $event"
                  @update:to="newApplication.salaryTo = $event"
                />
                <div v-if="errors.salaryFrom" class="mt-1 text-xs text-red-500">
                  {{ errors.salaryFrom }}
                </div>
                <div v-if="errors.salaryTo" class="mt-1 text-xs text-red-500">
                  {{ errors.salaryTo }}
                </div>
              </div>
              <div class="w-full">
                <p
                  class="mb-15px text-sm font-medium leading-normal text-space"
                >
                  Валюта
                </p>
                <MyDropdown
                  :options="ArrayCurrency"
                  :model-value="newApplication.currency"
                  placeholder="Валюта"
                  @update:model-value="updateNewApplicationCurrency"
                />
                <div v-if="errors.currency" class="mt-1 text-xs text-red-500">
                  {{ errors.currency }}
                </div>
              </div>
            </div>
            <div class="mb-15px w-full">
              <p class="mb-15px text-sm font-medium leading-normal text-space">
                Причина открытия вакансии
                <span class="text-red-500">*</span>
              </p>
              <MyDropdown
                :options="reasonseForOpenVacancy"
                :model-value="newApplication.reason"
                placeholder="Выберите причину"
                @update:model-value="val => (newApplication.reason = val)"
              />
              <div v-if="errors.reason" class="mt-1 text-xs text-red-500">
                {{ errors.reason }}
              </div>
            </div>
            <div class="mb-15px flex w-full gap-x-15px">
              <div class="w-full" @click="closeCalendare">
                <p class="mb-15px text-sm font-medium text-space">
                  Начать подбор не позднее
                </p>
                <!-- <InputCalendar :fullStyles="true" /> -->
                <DropdownCalendarStatic
                  @update:model-value="newApplication.dateStart = $event"
                  :is-open="isOpenDateFrom"
                  @update:isOpen="isOpenDateFrom"
                />

                <div v-if="errors.dateStart" class="mt-1 text-xs text-red-500">
                  {{ errors.dateStart }}
                </div>
              </div>
              <div class="w-full">
                <p class="mb-15px text-sm font-medium text-space">
                  Желаемая дата выхода кандидата
                </p>
                <DropdownCalendarStatic
                  @update:model-value="newApplication.dateWork = $event"
                  :is-open="isOpenDateTo"
                />
                <div v-if="errors.dateWork" class="mt-1 text-xs text-red-500">
                  {{ errors.dateWork }}
                </div>
              </div>
            </div>
            <div class="mb-15px w-full">
              <p class="mb-15px text-sm font-medium leading-normal text-space">
                Требования к кандидату
              </p>
              <MyTextarea
                v-model="newApplication.require"
                :placeholder="'Опишите ключевые требования'"
              />
              <div v-if="errors.requirements" class="mt-1 text-xs text-red-500">
                {{ errors.requirements }}
              </div>
            </div>
            <div class="mb-15px w-full">
              <p class="mb-4 text-sm font-medium leading-normal text-space">
                Обязанности кандидата
              </p>
              <MyTextarea
                v-model="newApplication.duty"
                :placeholder="'Опишите ключевые обязанности кандидата'"
              />
              <div
                v-if="errors.responsibilities"
                class="mt-1 text-xs text-red-500"
              >
                {{ errors.responsibilities }}
              </div>
            </div>
            <div class="mb-15px w-full">
              <p class="mb-4 text-sm font-medium leading-normal text-space">
                Условия работы
              </p>
              <MyTextarea
                v-model="newApplication.conditions"
                :placeholder="'Опишите условия работы для кандидата'"
              />
            </div>
            <div class="mb-25px w-full">
              <p class="mb-4 text-sm font-medium leading-normal text-space">
                Комментарий или заметки
              </p>
              <MyTextarea
                v-model="newApplication.comments"
                :placeholder="'Опишите комментарий или заметки для кандидата'"
              />
            </div>
          </div>
            </div>
            <footer
              class="relative z-20 flex shrink-0 flex-wrap items-center gap-x-15px gap-y-15px border-t border-athens bg-white px-25px py-15px rounded-b-fifteen"
            >
              <UiButton
                variant="action"
                size="semiaction"
                class="font-bold"
                @click="createApplicationHandler()"
              >
                Отправить заявку
              </UiButton>
              <UiButton
                variant="back"
                size="second-back"
                class="font-medium"
                @click="closeNewApplicationPopup"
              >
                Отмена
              </UiButton>
            </footer>
          </div>
        </Popup>
      </transition>
    </div>
    <div v-else-if="userRole === 'responsible'">
      <transition
        name="fade"
        @after-leave="enableBodyScroll"
        @enter="disableBodyScroll"
      >
        <Popup
          :isOpen="isNewAppPopupResponsible"
          @close="() => (isNewAppPopupResponsible = false)"
          :width="'740px'"
          :showCloseButton="false"
          :disableOverflowHidden="true"
          :parentRounded="true"
          :contentRounded="true"
          :contentPadding="false"
          :noOuterPadding="true"
          :noScrollbarGutter="true"
          :max-height-value="'90vh'"
        >
          <div
            class="flex h-[min(90vh,100dvh)] max-h-[min(90vh,100dvh)] min-h-0 w-full flex-col overflow-hidden rounded-fifteen bg-white"
          >
            <div class="shrink-0 px-25px pt-25px pb-15px">
              <p class="text-xl font-semibold leading-normal text-space">
                Новая заявка
              </p>
            </div>
            <div
              class="popup-scroll min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-25px pb-25px"
            >
          <div>
            <div class="mb-6">
              <p class="mb-7px text-sm font-medium text-space">
                Ответственный
              </p>
              <div ref="responseContainerResponsible">
                <div
                  v-if="newResponseResponsible"
                  class="text-sm font-medium text-dodger"
                >
                  {{ newResponseResponsible }}
                </div>
                <button
                  v-else-if="!showNewResponseResponsible"
                  @click="openNewResponseResponsible"
                  class="py-2.5 text-sm font-medium text-dodger"
                >
                  Добавить
                </button>
                <response-input
                  class="w-full"
                  :responses="responses"
                  v-model="newResponseResponsible"
                  v-show="showNewResponseResponsible"
                  @update:modelValue="
                    value => updateNewResponseResponsible(value)
                  "
                />
              </div>
            </div>
            <div class="mb-5 grid grid-flow-col grid-cols-2 gap-x-5">
              <div>
                <p class="mb-7px text-sm font-medium text-space">
                  Исполнитель
                </p>
                <div ref="executorContainer">
                  <div
                    v-if="newExecutor.name"
                    class="text-sm font-medium text-dodger"
                  >
                    {{ newExecutor.name }}
                  </div>
                  <button
                    v-else-if="!showNewExecutor"
                    @click="openNewExecutor"
                    class="py-2.5 text-sm font-medium text-dodger"
                  >
                    Добавить
                  </button>
                  <response-input
                    class="w-full"
                    :responses="responses"
                    v-model="newExecutor"
                    v-show="showNewExecutor"
                    @update:modelValue="updateNewExecutor"
                  />
                </div>
              </div>
              <div>
                <p class="mb-7px text-sm font-medium text-space">
                  Заказчик
                </p>
                <div ref="customerContainer">
                  <div
                    v-if="newCustomer.name"
                    class="text-sm font-medium text-dodger"
                  >
                    {{ newCustomer.name }}
                  </div>
                  <button
                    v-else-if="!showNewCustomer"
                    @click="openNewCustomer"
                    class="py-2.5 text-sm font-medium text-dodger"
                  >
                    Добавить
                  </button>
                  <response-input
                    class="w-full"
                    :responses="responses"
                    v-model="newCustomer.name"
                    v-show="showNewCustomer"
                    @update:modelValue="
                      (value, id) => updateNewCustomer(value, id)
                    "
                  />
                </div>
              </div>
            </div>
            <div class="mb-6 grid grid-flow-col gap-x-5">
              <div>
                <p class="mb-1 text-sm font-medium text-space">
                  Должность
                </p>
                <SimpleInput
                  placeholder="Введите название должности"
                  v-model="newPositionResponsible"
                />
              </div>
              <div>
                <p class="mb-1 text-sm font-medium text-space">
                  Департамент
                </p>
                <SimpleInput v-model="newDepartmentResponsible" />
              </div>
            </div>
            <div class="mb-6 grid grid-flow-col gap-x-5">
              <div>
                <p class="mb-1 text-sm font-medium text-space">
                  Город поиска
                </p>
                <SimpleInput v-model="newRegionResponsible" />
              </div>
              <div>
                <p class="mb-1 text-sm font-medium text-space">
                  Причина открытия вакансии
                </p>
                <SimpleInput v-model="newReasonResponsible" />
              </div>
            </div>
            <div class="mb-6 grid grid-flow-col gap-x-5">
              <div>
                <p class="mb-1 text-sm font-medium text-space">
                  Зарплата от
                </p>
                <SimpleInput v-model="salaryMinResponsible" type="number" />
              </div>
              <div>
                <p class="mb-1 text-sm font-medium text-space">
                  Зарплата до
                </p>
                <SimpleInput v-model="salaryMaxResponsible" type="number" />
              </div>
            </div>
            <div class="mb-6">
              <p class="mb-1 text-sm font-medium text-space">
                Количество позиций
              </p>
              <SimpleInput v-model="vacancyCountResponsible" type="number" />
            </div>
            <div class="mb-6">
              <p class="mb-1 text-sm font-medium text-space">
                Требования кандидата
              </p>
              <SimpleInput v-model="requirementsResponsible" />
            </div>
            <div class="mb-6">
              <p class="mb-1 text-sm font-medium text-space">
                Обязанности кандидата
              </p>
              <SimpleInput v-model="responsibilitiesResponsible" />
            </div>
            <div class="mb-9 grid grid-flow-col grid-cols-2 gap-x-5">
              <div>
                <p class="mb-1 text-sm font-medium text-space">
                  Начать подбор не позднее
                </p>
                <InputCalendar />
              </div>
              <div>
                <p class="mb-1 text-sm font-medium text-space">
                  Желаемая дата выхода кандидата
                </p>
                <InputCalendar />
              </div>
            </div>
          </div>
            </div>
            <footer
              class="relative z-20 flex shrink-0 flex-wrap items-center gap-x-15px gap-y-15px border-t border-athens bg-white px-25px py-15px rounded-b-fifteen"
            >
              <UiButton variant="action" size="semiaction" class="font-bold">
                Отправить на согласование
              </UiButton>
              <UiButton
                variant="back"
                size="second-back"
                class="font-medium"
                @click="isNewAppPopupResponsible = false"
              >
                Отмена
              </UiButton>
            </footer>
          </div>
        </Popup>
      </transition>
    </div>
    <div v-else-if="userRole === 'customer'">
      <transition
        name="fade"
        @after-leave="enableBodyScroll"
        @enter="disableBodyScroll"
      >
        <Popup
          :isOpen="isNewAppPopupCustomer"
          @close="() => (isNewAppPopupCustomer = false)"
          :width="'740px'"
          :showCloseButton="false"
          :disableOverflowHidden="true"
          :parentRounded="true"
          :contentRounded="true"
          :contentPadding="false"
          :noOuterPadding="true"
          :noScrollbarGutter="true"
          :max-height-value="'90vh'"
        >
          <div
            class="flex h-[min(90vh,100dvh)] max-h-[min(90vh,100dvh)] min-h-0 w-full flex-col overflow-hidden rounded-fifteen bg-white"
          >
            <div class="shrink-0 px-25px pt-25px pb-15px">
              <p class="text-xl font-semibold leading-normal text-space">
                Новая заявка
              </p>
            </div>
            <div
              class="popup-scroll min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-25px pb-25px"
            >
          <div>
            <div class="mb-6">
              <p class="mb-7px text-sm font-medium text-space">
                Ответственный
              </p>
              <BtnResponseInput
                v-model="newResponseCustomer"
                :responses="responses"
                :customer="'responsible'"
              />
            </div>
            <div class="mb-6 grid grid-flow-col gap-x-5">
              <div>
                <p class="mb-1 text-sm font-medium text-space">
                  Должность
                </p>
                <SimpleInput
                  placeholder="Введите название должности"
                  v-model="newPositionCustomer"
                />
              </div>
              <div>
                <p class="mb-1 text-sm font-medium text-space">
                  Департамент
                </p>
                <SimpleInput v-model="newDepartmentCustomer" />
              </div>
            </div>
            <div class="mb-6 grid grid-flow-col gap-x-5">
              <div>
                <p class="mb-1 text-sm font-medium text-space">
                  Город поиска
                </p>
                <SimpleInput v-model="newRegionCustomer" />
              </div>
              <div>
                <p class="mb-1 text-sm font-medium text-space">
                  Причина открытия вакансии
                </p>
                <SimpleInput v-model="newReasonCustomer" />
              </div>
            </div>
            <div class="mb-6 grid grid-flow-col gap-x-5">
              <div>
                <p class="mb-1 text-sm font-medium text-space">
                  Зарплата от
                </p>
                <SimpleInput v-model="salaryMinCustomer" type="number" />
              </div>
              <div>
                <p class="mb-1 text-sm font-medium text-space">
                  Зарплата до
                </p>
                <SimpleInput v-model="salaryMaxCustomer" type="number" />
              </div>
            </div>
            <div class="mb-6">
              <p class="mb-1 text-sm font-medium text-space">
                Количество позиций
              </p>
              <SimpleInput v-model="vacancyCountCustomer" type="number" />
            </div>
            <div class="mb-6">
              <p class="mb-1 text-sm font-medium text-space">
                Требования кандидата
              </p>
              <SimpleInput v-model="requirementsCustomer" />
            </div>
            <div class="mb-6">
              <p class="mb-1 text-sm font-medium text-space">
                Обязанности кандидата
              </p>
              <SimpleInput v-model="responsibilitiesCustomer" />
            </div>
            <div class="mb-8 grid grid-flow-col grid-cols-2 gap-x-5">
              <div>
                <p class="mb-1 text-sm font-medium text-space">
                  Начать подбор не позднее
                </p>
                <InputCalendar />
              </div>
              <div>
                <p class="mb-1 text-sm font-medium text-space">
                  Желаемая дата выхода кандидата
                </p>
                <InputCalendar />
              </div>
            </div>
          </div>
            </div>
            <footer
              class="relative z-20 flex shrink-0 flex-wrap items-center gap-x-15px gap-y-15px border-t border-athens bg-white px-25px py-15px rounded-b-fifteen"
            >
              <UiButton variant="action" size="semiaction" class="font-bold">
                Отправить на согласование
              </UiButton>
              <UiButton
                variant="back"
                size="second-back"
                class="font-medium"
                @click="isNewAppPopupCustomer = false"
              >
                Отмена
              </UiButton>
            </footer>
          </div>
        </Popup>
      </transition>
    </div>
    <transition
      name="fade"
      @after-leave="enableBodyScroll"
      @enter="disableBodyScroll"
    >
      <Popup
        v-if="selectedVacancy && detailedVacancy"
        :isOpen="!!selectedVacancy && !!detailedVacancy"
        @close="closePopup"
        :width="'740px'"
        :showCloseButton="false"
        :disableOverflowHidden="true"
        :parentRounded="true"
        :contentRounded="true"
        :contentPadding="false"
        :noOuterPadding="true"
        :noScrollbarGutter="true"
        :max-height-value="'90vh'"
      >
        <div
          class="flex h-[min(90vh,100dvh)] max-h-[min(90vh,100dvh)] min-h-0 w-full flex-col overflow-hidden rounded-fifteen bg-white"
        >
          <div class="shrink-0 px-25px pt-25px pb-15px">
            <h3 class="text-xl font-semibold leading-normal text-space">
              {{ detailedVacancy.position }}
            </h3>
            <p
              v-if="detailedVacancy.city"
              class="mt-1 text-sm font-normal text-slate-custom"
            >
              {{ formatCityLabel(detailedVacancy.city) }}
            </p>
            <div
              v-if="isRejectedApplicationOpen"
              class="application-rejection-block mt-15px"
            >
              <p class="application-rejection-block__title">
                Причина отклонения заявки
              </p>
              <div
                class="application-rejection-alert application-rejection-alert--reason"
                role="alert"
              >
                <span
                  class="application-rejection-alert__icon application-rejection-alert__icon--reason"
                  aria-hidden="true"
                >
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 12 12"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M6 2.75V7"
                      stroke="currentColor"
                      stroke-width="1.75"
                      stroke-linecap="round"
                    />
                    <circle cx="6" cy="9.25" r="0.9" fill="currentColor" />
                  </svg>
                </span>
                <p class="application-rejection-alert__text">
                  {{ rejectionReasonText || '—' }}
                </p>
              </div>
              <div
                class="application-rejection-alert application-rejection-alert--info"
              >
                <span
                  class="application-rejection-alert__icon application-rejection-alert__icon--info"
                  aria-hidden="true"
                >
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 12 12"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <circle cx="6" cy="3.25" r="0.9" fill="currentColor" />
                    <path
                      d="M6 5.5V9.25"
                      stroke="currentColor"
                      stroke-width="1.75"
                      stroke-linecap="round"
                    />
                  </svg>
                </span>
                <p class="application-rejection-alert__text">
                  Чтобы внести изменения после отклонения заявки, скопируйте заявку
                  на вакансию, нажав кнопку «Копировать» внизу окна созданной вами
                  заявки. Заявка будет скопирована и создана заново.
                </p>
              </div>
            </div>
          </div>
          <div
            class="relative z-10 flex shrink-0 gap-0 border-b border-athens px-25px"
          >
            <button
              type="button"
              @click="popupSelectedTab = 'popupMainInfo'"
              class="p-15px text-15px font-medium transition-colors"
              :class="
                popupSelectedTab === 'popupMainInfo'
                  ? 'border-b-2 border-space text-space'
                  : 'border-none text-slate-custom'
              "
            >
              Основная информация
            </button>
            <button
              type="button"
              @click="popupSelectedTab = 'popupHistory'"
              class="p-15px text-15px font-medium transition-colors"
              :class="
                popupSelectedTab === 'popupHistory'
                  ? 'border-b-2 border-space text-space'
                  : 'border-none text-slate-custom'
              "
            >
              История
            </button>
          </div>
          <div
            ref="tabContentInner"
            class="popup-scroll min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-25px pb-25px pt-15px"
          >
            <div
              v-if="popupSelectedTab === 'popupMainInfo'"
              class="flex flex-col gap-2.5"
            >
              <div
                class="flex flex-wrap gap-x-15px gap-y-15px rounded-fifteen border border-athens bg-white p-25px"
              >
                <div class="min-w-[200px] flex-1">
                  <p class="application-view-label">Статус заявки</p>
                  <span
                    :class="
                      applicationStatusBadgeClass(
                        detailedVacancy.status?.name
                      )
                    "
                  >
                    {{
                      detailedVacancy.status?.name || 'Неизвестный статус'
                    }}
                  </span>
                </div>
                <div class="min-w-[200px] flex-1">
                  <p class="application-view-label">Согласующий</p>
                  <p
                    class="application-view-value"
                    :class="{
                      'application-view-value--empty': applicationViewIsEmpty(
                        detailedVacancy.responsible?.name
                      ),
                    }"
                  >
                    {{ applicationViewDisplay(detailedVacancy.responsible?.name) }}
                  </p>
                  <p
                    v-if="detailedVacancy.responsible?.role?.name"
                    class="mt-5px text-xs font-normal text-slate-custom"
                  >
                    {{ detailedVacancy.responsible.role.name }}
                  </p>
                </div>
              </div>

              <div
                class="flex flex-col gap-15px rounded-fifteen border border-athens bg-white p-25px"
              >
                <div class="flex flex-wrap gap-x-15px gap-y-15px">
                  <div class="min-w-[240px] flex-1">
                    <p class="application-view-label">Название вакансии</p>
                    <p
                      class="application-view-value"
                      :class="{
                        'application-view-value--empty':
                          applicationViewIsEmpty(detailedVacancy.position),
                      }"
                    >
                      {{ applicationViewDisplay(detailedVacancy.position) }}
                    </p>
                  </div>
                  <div class="min-w-[200px] flex-1">
                    <p class="application-view-label">Отдел</p>
                    <p
                      class="application-view-value"
                      :class="{
                        'application-view-value--empty':
                          applicationViewIsEmpty(detailedVacancy.division),
                      }"
                    >
                      {{ applicationViewDisplay(detailedVacancy.division) }}
                    </p>
                  </div>
                </div>

                <div>
                  <p class="application-view-label">Город поиска</p>
                  <p
                    class="application-view-value"
                    :class="{
                      'application-view-value--empty':
                        applicationViewIsEmpty(detailedVacancy.city),
                    }"
                  >
                    {{ applicationViewDisplay(formatCityLabel(detailedVacancy.city)) }}
                  </p>
                </div>

                <div>
                  <p class="application-view-label">Сколько человек нужно нанять</p>
                  <p
                    class="application-view-value"
                    :class="{
                      'application-view-value--empty':
                        applicationViewIsEmpty(detailedVacancy.count),
                    }"
                  >
                    {{ applicationViewDisplay(detailedVacancy.count) }}
                  </p>
                </div>

                <div class="flex flex-wrap gap-x-15px gap-y-15px">
                  <div class="min-w-[240px] flex-1">
                    <p class="application-view-label">Зарплата</p>
                    <p
                      class="application-view-value"
                      :class="{
                        'application-view-value--empty':
                          applicationSalaryDisplay(detailedVacancy) === '—',
                      }"
                    >
                      {{ applicationSalaryDisplay(detailedVacancy) }}
                    </p>
                  </div>
                  <div class="min-w-[160px] flex-1">
                    <p class="application-view-label">Валюта</p>
                    <p
                      class="application-view-value"
                      :class="{
                        'application-view-value--empty':
                          applicationViewIsEmpty(detailedVacancy.currency),
                      }"
                    >
                      {{ applicationViewDisplay(detailedVacancy.currency) }}
                    </p>
                  </div>
                </div>

                <div>
                  <p class="application-view-label">Причина открытия вакансии</p>
                  <p
                    class="application-view-value"
                    :class="{
                      'application-view-value--empty':
                        applicationViewIsEmpty(detailedVacancy.reason),
                    }"
                  >
                    {{ applicationViewDisplay(detailedVacancy.reason) }}
                  </p>
                </div>

                <div class="flex flex-wrap gap-x-15px gap-y-15px">
                  <div class="min-w-[200px] flex-1">
                    <p class="application-view-label">Начать подбор не позднее</p>
                    <p
                      class="application-view-value"
                      :class="{
                        'application-view-value--empty':
                          applicationViewIsEmpty(detailedVacancy.dateStart),
                      }"
                    >
                      {{ applicationViewDisplay(detailedVacancy.dateStart) }}
                    </p>
                  </div>
                  <div class="min-w-[200px] flex-1">
                    <p class="application-view-label">
                      Желаемая дата выхода кандидата
                    </p>
                    <p
                      class="application-view-value"
                      :class="{
                        'application-view-value--empty':
                          applicationViewIsEmpty(detailedVacancy.dateWork),
                      }"
                    >
                      {{ applicationViewDisplay(detailedVacancy.dateWork) }}
                    </p>
                  </div>
                </div>

                <div>
                  <p class="application-view-label">Требования к кандидату</p>
                  <p
                    class="application-view-value application-view-value--multiline"
                    :class="{
                      'application-view-value--empty':
                        applicationViewIsEmpty(detailedVacancy.require),
                    }"
                  >
                    {{ applicationViewDisplay(detailedVacancy.require) }}
                  </p>
                </div>

                <div>
                  <p class="application-view-label">Обязанности кандидата</p>
                  <p
                    class="application-view-value application-view-value--multiline"
                    :class="{
                      'application-view-value--empty':
                        applicationViewIsEmpty(detailedVacancy.duty),
                    }"
                  >
                    {{ applicationViewDisplay(detailedVacancy.duty) }}
                  </p>
                </div>

                <div>
                  <p class="application-view-label">Условия работы</p>
                  <p
                    class="application-view-value application-view-value--multiline"
                    :class="{
                      'application-view-value--empty':
                        applicationViewIsEmpty(detailedVacancy.conditions),
                    }"
                  >
                    {{ applicationViewDisplay(detailedVacancy.conditions) }}
                  </p>
                </div>

                <div>
                  <p class="application-view-label">Комментарий или заметки</p>
                  <p
                    class="application-view-value application-view-value--multiline"
                    :class="{
                      'application-view-value--empty':
                        applicationViewIsEmpty(detailedVacancy.comments),
                    }"
                  >
                    {{ applicationViewDisplay(detailedVacancy.comments) }}
                  </p>
                </div>
              </div>
            </div>
            <div
              v-else-if="popupSelectedTab === 'popupHistory'"
              class="flex flex-col gap-2.5"
            >
              <p
                v-if="historyTabEvents.length === 0"
                class="rounded-fifteen border border-athens bg-white px-25px py-15px text-sm text-slate-custom"
              >
                История по этой заявке пока пуста.
              </p>
              <div
                v-for="event in historyTabEvents"
                :key="event.id"
                class="flex gap-x-15px rounded-fifteen border border-athens bg-white px-25px py-15px"
              >
                <div class="min-w-0 flex-1">
                  <p class="mb-5px text-sm font-medium text-space">
                    {{ event.eventTitle }}
                  </p>
                  <p
                    v-if="event.eventContent"
                    class="text-sm font-normal text-slate-custom"
                  >
                    {{ event.eventContent }}
                  </p>
                </div>
                <div class="shrink-0 text-right">
                  <p class="whitespace-nowrap text-sm font-normal text-slate-custom">
                    {{ formatDateTime(event.eventLogDateTime).date }}&nbsp;/&nbsp;{{
                      formatDateTime(event.eventLogDateTime).time
                    }}
                  </p>
                </div>
              </div>
            </div>
          </div>
          <footer
            v-if="isDelete"
            class="relative z-20 flex shrink-0 flex-wrap items-center gap-x-15px gap-y-15px border-t border-athens bg-white px-25px py-15px rounded-b-fifteen"
          >
            <UiButton
              v-if="isDeleteApplication"
              variant="action"
              size="semiaction"
              @click="openDeleteApplicationPopup(selectedVacancy)"
            >
              Удалить
            </UiButton>
            <UiButton
              variant="action"
              size="semiaction"
              @click="() => handlerUpdateApplication(selectedVacancy)"
            >
              Готово
            </UiButton>
            <UiButton
              variant="back"
              size="second-back"
              class="font-medium"
              @click="closePopup"
            >
              Отмена
            </UiButton>
          </footer>
          <footer
            v-else-if="isRejectedApplicationOpen"
            class="relative z-20 flex shrink-0 flex-wrap items-center gap-x-15px gap-y-15px border-t border-athens bg-white px-25px py-15px rounded-b-fifteen"
          >
            <UiButton
              variant="action"
              size="semiaction"
              @click="copyApplicationFromDetail"
            >
              Копировать
            </UiButton>
          </footer>
          <footer
            v-else-if="showReviewActionsFooter"
            class="relative z-20 flex shrink-0 flex-wrap items-center gap-x-15px gap-y-15px border-t border-athens bg-white px-25px py-15px rounded-b-fifteen"
          >
            <UiButton variant="action" size="semiaction" @click="addApprove">
              {{ !linkedApplicationVacancy ? 'Создать вакансию' : 'Согласовать' }}
            </UiButton>
            <UiButton
              variant="back"
              size="second-back"
              class="font-medium"
              @click="rejectApplication"
            >
              Отклонить
            </UiButton>
          </footer>
          <footer
            v-else-if="showGoToVacancyFooter"
            class="relative z-20 flex shrink-0 flex-wrap items-center gap-x-15px gap-y-15px border-t border-athens bg-white px-25px py-15px rounded-b-fifteen"
          >
            <UiButton
              variant="action"
              size="semiaction"
              @click="goToLinkedVacancy"
            >
              Перейти к вакансии
            </UiButton>
          </footer>
          <footer
            v-else-if="showCustomerViewFooter"
            class="relative z-20 flex shrink-0 flex-wrap items-center gap-x-15px gap-y-15px border-t border-athens bg-white px-25px py-15px rounded-b-fifteen"
          >
            <UiButton
              variant="back"
              size="second-back"
              class="font-medium"
              @click="closePopup"
            >
              Закрыть
            </UiButton>
          </footer>
        </div>
      </Popup>
    </transition>
    <Pagination
      v-if="pagination.total_page > 1"
      :currentPage="pagination.current_page"
      :totalPages="pagination.last_page"
      @page-changed="handlePageChange"
    />

    <Popup
      :isOpen="isApprove"
      @close="() => (isApprove = false)"
      :width="'740px'"
      :showCloseButton="true"
      :disableOverflowHidden="true"
      :overflowContainer="true"
      maxHeight
      :lgSize="true"
    >
      <p class="mb-[10px] text-xl font-semibold leading-normal text-space">
        Вакансия успешно создана
      </p>
    </Popup>
    <Popup
      :isOpen="isNotApprove"
      @close="() => (isNotApprove = false)"
      width="490px"
      :showCloseButton="false"
      :parentRounded="true"
      :contentRounded="false"
      :contentPadding="false"
      :lgSize="true"
    >
      <div class="popup-delete-content flex flex-col gap-y-6">
        <h2 class="text-xl font-semibold text-space">Отклонение заявки</h2>
        <p class="text-sm text-slate-custom">
          Заявка будет отклонена, заказчику придет уведомление об этом. Информация
          будет отражена в заявке.
        </p>
        <div class="flex flex-col gap-y-5px">
          <p class="text-sm font-medium text-space">Причина</p>
          <MyTextarea
            v-model="rejectReason"
            placeholder="Заполните это поле"
          />
        </div>
        <p v-if="errorReject" class="text-xs text-red-500">
          {{ errorReject }}
        </p>
        <div class="flex flex-wrap gap-x-3 gap-y-3">
          <UiButton
            variant="action"
            size="semiaction"
            @click="sendReject(rejectReason)"
          >
            Отправить
          </UiButton>
          <UiButton
            variant="back"
            size="second-back"
            class="font-medium"
            @click="isNotApprove = false"
          >
            Отмена
          </UiButton>
        </div>
      </div>
    </Popup>

    <Popup
      :isOpen="showDeleteApplicationPopup"
      width="490px"
      :show-close-button="false"
      :lg-size="true"
      :parent-rounded="true"
      :content-rounded="false"
      :content-padding="false"
      @close="closeDeleteApplicationPopup"
    >
      <div class="popup-delete-content flex flex-col gap-y-6">
        <h2 class="text-xl font-semibold text-space">
          Удаление заявки «{{ applicationPendingDelete?.title || 'Без названия' }}»
        </h2>
        <p class="text-sm text-slate-custom">
          Заявка будет удалена без возможности восстановления. Связанная вакансия, если она была создана, останется в системе.
        </p>
        <p v-if="deleteApplicationError" class="text-xs text-red-500">
          {{ deleteApplicationError }}
        </p>
        <div class="flex flex-wrap gap-x-3 gap-y-3">
          <button
            type="button"
            class="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring bg-red-500 hover:bg-red-600 text-white p-semi-btn text-sm rounded-ten leading-normal h-fit font-semibold disabled:opacity-60"
            :disabled="isDeletingApplication"
            @click="confirmDeleteApplication"
          >
            {{ isDeletingApplication ? 'Удаление...' : 'Удалить' }}
          </button>
          <button
            type="button"
            class="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring bg-athens-gray border border-athens text-slate-custom p-border-semi-btn text-sm rounded-ten leading-normal font-medium"
            @click="closeDeleteApplicationPopup"
          >
            Отмена
          </button>
        </div>
      </div>
    </Popup>

    <Teleport to="body">
      <Transition name="fields-tab-toast-fade">
        <div
          v-if="applicationToast.show"
          class="fixed right-4 z-[10001] max-w-[min(90vw,420px)] rounded-fifteen px-6 py-3 text-center text-sm font-medium leading-150 text-space shadow-[0_0_15px_rgba(0,0,0,0.15)] sm:right-6"
          :style="applicationToastTopStyle"
          :class="
            applicationToast.variant === 'success'
              ? 'fields-tab-success-toast'
              : 'fields-tab-error-toast'
          "
          :role="applicationToast.variant === 'success' ? 'status' : 'alert'"
        >
          {{ applicationToast.text }}
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup>
  import {
    ref,
    computed,
    onMounted,
    onUnmounted,
    onBeforeUnmount,
    nextTick,
    watch,
    defineAsyncComponent,
  } from 'vue';
  import { useJoblyToastTopStyle } from '@/composables/useJoblyToastTopStyle';
  import dayjs from 'dayjs';
  import ResponseInput from '~/components/custom/ResponseInput.vue';
  import DotsDropdown from '~/components/custom/DotsDropdown.vue';
  const Popup = defineAsyncComponent(
    () => import('~/components/custom/Popup.vue'),
  );
  import SimpleInput from '~/components/custom/SimpleInput.vue';
  const InputCalendar = defineAsyncComponent(
    () => import('~/components/custom/InputCalendar.vue'),
  );
  import BtnResponseInput from '~/components/custom/BtnResponseInput.vue';
  import MyInput from '~/components/custom/MyInput.vue';
  const GeoInput = defineAsyncComponent(
    () => import('~/components/custom/GeoInput.vue'),
  );
  const SalaryRange = defineAsyncComponent(
    () => import('~/components/custom/SalaryRange.vue'),
  );
  import MyTextarea from '~/components/custom/MyTextarea.vue';
  import MyDropdown from '~/components/custom/MyDropdown.vue';
  import ListSectionPlaceholder from '~/components/custom/ListSectionPlaceholder.vue';
  import Pagination from '~/components/custom/Pagination.vue';
  const DropdownCalendarStatic = defineAsyncComponent(
    () => import('~/components/custom/DropdownCalendarStatic.vue'),
  );
  import responses from '~/src/data/responses.json';
  import currency from '~/src/data/currency.json';

  import { fetchApplications } from '~/utils/applicationsList';
  import { fetchApplicationDetail, approve } from '~/utils/applicationItem';
  import { createApplication } from '~/utils/applicationCreate';
  import { deleteApplication } from '~/utils/applicationRemove';
  import {
    approversList,
    getDepartments,
  } from '~/utils/executorsList';
  import { useUserStore } from '@/stores/user';
  import { fetchVacancyOpeningReasons } from '~/utils/vacancyOpeningReasonsList';
  import {
    applicationStatusBadgeClass,
    normalizeApplicationStatusKey,
  } from '~/utils/applicationStatusBadge';
  import { mapApplicationDetailToNewForm } from '~/utils/applicationCopy';
  import { applicationHistoryFromDetail } from '~/utils/applicationHistory';
  import { formatCityLabel } from '~/utils/formatCityLabel';
  import { fetchApplicationUpdate } from '~/utils/applicationUpdate';
  import { loadScript } from '@/plugins/loader';
  import { profile } from '@/utils/loginUser';
  import { reject } from '@/utils/applicationItem';
  const isCreateVacancy = ref(false);

  import { API_YANDEX_KEY, API_YANDEX_SUGGEST } from '@/src/constants';

  import { useRouter } from 'vue-router';

  const router = useRouter();
  const userStore = useUserStore();

  const applications = ref([]);
  const data = ref([]);
  const pagination = ref({
    current_page: 1,
    total: 1,
    per_page: 10,
    last_page: 1,
    links: [],
  });
  const error = ref(null);
  const loading = ref(true);

  const showPageHeader = computed(() => !error.value);

  const applicationsEmptyTitle = computed(() => 'Пока нет заявок');

  const applicationsEmptyDescription = computed(() => {
    if (userRole.value === 'customer') {
      return 'Создайте первую заявку на подбор — её увидит согласующий, после согласования появится вакансия.';
    }
    if (userRole.value === 'responsible') {
      return 'Создайте заявку или дождитесь новых от заказчика — согласуйте и запускайте подбор.';
    }
    return 'Создайте заявку на подбор, назначьте согласующего и запустите вакансию после одобрения.';
  });
  const isOpenDateFrom = ref(false);
  const isOpenDateTo = ref(false);
  const errorReject = ref(null);

  const headers = computed(() => {
    const baseHeaders = [
      { key: 'title', label: 'Вакансия' },
      { key: 'status', label: 'Статус' },
      { key: 'createdAt', label: 'Дата создания' },
      { key: 'executor', label: 'Согласующий' },
      { key: 'region', label: 'Город' },
      { key: 'dateWork', label: 'Закрыть до' },
    ];

    if (['admin', 'responsible'].includes(userRole.value)) {
      baseHeaders.splice(2, 0, { key: 'customer', label: 'Автор' });
    } else if (userRole.value === 'customer') {
      baseHeaders.splice(2, 0, { key: 'responsible', label: 'Ответственный' });
    }

    return baseHeaders;
  });

  const sortKey = ref('');
  const sortOrder = ref('asc');
  const userRole = ref(mapProfileRoleToApplicationsUserRole(userStore.role));

  function mapProfileRoleToApplicationsUserRole(roleName) {
    const name = String(roleName ?? '')
      .trim()
      .toLowerCase();
    if (name.includes('администратор')) return 'admin';
    if (name.includes('рекрутер')) return 'responsible';
    if (name.includes('заказчик') || name.includes('клиент')) return 'customer';
    return 'admin';
  }

  function canApproveOrRejectByProfile(roleName) {
    const name = String(roleName ?? '')
      .trim()
      .toLowerCase();
    return name.includes('администратор') || name.includes('рекрутер');
  }

  const isCustomerRole = computed(() => userRole.value === 'customer');

  const applicationDropdownOptions = computed(() => {
    if (isCustomerRole.value) {
      return ['Управлять'];
    }
    return ['Управлять', 'Копировать заявку', 'Удалить'];
  });
  // const isNewAppPopup = ref(false)
  const isNewAppPopupAdmin = ref(false);
  const isNewAppPopupCustomer = ref(false);
  const isNewAppPopupResponsible = ref(false);
  const showNewResponse = ref(false);
  const newResponse = ref('');
  const responseContainer = ref(null);
  const newApplication = ref({});
  const newResponseResponsible = ref('');
  const showNewResponseResponsible = ref(false);
  const responseContainerResponsible = ref(null);
  const newExecutor = ref({ id: null, name: '' });
  const showNewExecutor = ref(false);
  const executorContainer = ref(null);
  const newCustomer = ref({ id: null, name: '' });
  const showNewCustomer = ref(false);
  const newClient = ref({ id: null, name: '' });
  const customerContainer = ref(false);
  const newPositionResponsible = ref('');
  const newDepartmentResponsible = ref('');
  const newRegionResponsible = ref('');
  const newReasonResponsible = ref('');
  const salaryMinResponsible = ref('');
  const salaryMaxResponsible = ref('');
  const vacancyCountResponsible = ref('');
  const requirementsResponsible = ref('');
  const responsibilitiesResponsible = ref('');
  const newResponseCustomer = ref('');
  const newPositionCustomer = ref('');
  const newDepartmentCustomer = ref('');
  const newRegionCustomer = ref('');
  const newReasonCustomer = ref('');
  const salaryMinCustomer = ref('');
  const salaryMaxCustomer = ref('');
  const vacancyCountCustomer = ref('');
  const requirementsCustomer = ref('');
  const responsibilitiesCustomer = ref('');
  const selectedVacancy = ref(null);
  const detailedVacancy = ref(null);
  const popupSelectedTab = ref('popupMainInfo');
  const tabContentInner = ref(null);
  const tabContentHeight = ref(0);
  const popupResponse = ref(null);
  const applicationToast = ref({ show: false, text: '', variant: 'success' });
  let applicationToastTimer = null;
  const applicationToastTopStyle = useJoblyToastTopStyle(
    computed(() => applicationToast.value.show)
  );

  function showApplicationToastMessage(text, variant = 'success') {
    applicationToast.value = { show: true, text, variant };
    if (applicationToastTimer) clearTimeout(applicationToastTimer);
    applicationToastTimer = setTimeout(() => {
      applicationToast.value = { show: false, text: '', variant: 'success' };
      applicationToastTimer = null;
    }, 4000);
  }
  const rejectReason = ref('');

  const ArrayCurrency = currency;
  const approvers = ref([]);
  const departments = ref([]);
  const reasonseForOpenVacancy = ref([]);
  let resizeObserver = null;
  const errors = ref({});
  const updateData = ref({});
  const isDelete = ref(false);
  const isDeleteApplication = ref(false);
  const showDeleteApplicationPopup = ref(false);
  const applicationPendingDelete = ref(null);
  const deleteApplicationError = ref('');
  const isDeletingApplication = ref(false);
  const isAddApprove = ref(false);
  const isApprove = ref(false);
  const isNotApprove = ref(false);

  let formDictionariesLoaded = false;
  let formDictionariesLoading = null;
  let yandexMapsLoadPromise = null;

  function ensureYandexMapsScript() {
    if (yandexMapsLoadPromise) return yandexMapsLoadPromise;
    yandexMapsLoadPromise = loadScript(
      `https://api-maps.yandex.ru/2.1/?lang=ru_RU&apikey=${API_YANDEX_KEY}&suggest_apikey=${API_YANDEX_SUGGEST}`,
    ).catch((err) => {
      yandexMapsLoadPromise = null;
      console.warn('Yandex Maps script failed to load:', err);
    });
    return yandexMapsLoadPromise;
  }

  async function ensureFormDictionaries() {
    if (formDictionariesLoaded) return;
    if (formDictionariesLoading) return formDictionariesLoading;

    formDictionariesLoading = Promise.all([
      getDepartments().then((items) => {
        departments.value = items;
      }),
      approversList().then(({ approvers: approverData }) => {
        approvers.value = approverData;
      }),
      fetchVacancyOpeningReasons().then((items) => {
        reasonseForOpenVacancy.value = items;
      }),
    ])
      .then(() => {
        formDictionariesLoaded = true;
      })
      .finally(() => {
        formDictionariesLoading = null;
      });

    return formDictionariesLoading;
  }

  // Функция обновления высоты контента
  const updateTabHeight = () => {
    nextTick(() => {
      if (tabContentInner.value) {
        tabContentHeight.value = tabContentInner.value.offsetHeight;
      } else {
        console.warn('tabContent is null when updating height');
      }
    });
  };

  const closeCalendare = () => {
    isOpenFrom(false);
  };

  const isOpenFrom = value => {
    isOpenDateFrom.value = value;
  };

  function closeDeleteApplicationPopup() {
    showDeleteApplicationPopup.value = false;
    applicationPendingDelete.value = null;
    deleteApplicationError.value = '';
  }

  function openDeleteApplicationPopup(applicationRow) {
    applicationPendingDelete.value = applicationRow;
    deleteApplicationError.value = '';
    showDeleteApplicationPopup.value = true;
  }

  async function confirmDeleteApplication() {
    const row = applicationPendingDelete.value;
    if (!row?.id || isDeletingApplication.value) return;
    deleteApplicationError.value = '';
    isDeletingApplication.value = true;
    try {
      const { error } = await deleteApplication(row.id);
      if (error) {
        deleteApplicationError.value =
          error?.data?.message || error?.message || 'Не удалось удалить заявку';
        return;
      }
      closeDeleteApplicationPopup();
      if (selectedVacancy.value?.id === row.id) {
        closePopup();
      }
      isDeleteApplication.value = false;
      showApplicationToastMessage('Заявка удалена', 'success');
      loadApplications();
    } catch (err) {
      deleteApplicationError.value =
        err?.message || 'Ошибка при удалении заявки';
    } finally {
      isDeletingApplication.value = false;
    }
  }

  const statusWeights = {
    new: 1,
    in_review: 2,
    in_work: 3,
    paused: 4,
  };

  const sortedData = computed(() => {
    if (!sortKey.value) return data.value;

    return [...data.value].sort((a, b) => {
      const multiplier = sortOrder.value === 'asc' ? 1 : -1;

      if (sortKey.value === 'status') {
        return (statusWeights[a.status] - statusWeights[b.status]) * multiplier;
      }

      if (a[sortKey.value] > b[sortKey.value]) return 1 * multiplier;
      if (a[sortKey.value] < b[sortKey.value]) return -1 * multiplier;
      return 0;
    });
  });

  const sortBy = key => {
    if (sortKey.value === key) {
      sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc';
    } else {
      sortKey.value = key;
      sortOrder.value = 'asc';
    }
    let asc = sortOrder.value === 'asc' ? '' : '&asc=0';
    loadApplications(1, `sort=${sortKey.value}${asc}`);
  };

  const sortArrowStyle = key => {
    return {
      transform:
        sortKey.value === key && sortOrder.value === 'asc'
          ? 'rotate(180deg)'
          : 'rotate(0deg)',
      transition: 'transform 0.3s ease',
    };
  };

  const takeInWork = vacancy => {
    console.log(`Вакансия взята в работу: ${vacancy.title}`);
  };

  const openResponseInput = (vacancy, event) => {
    event.stopPropagation(); // Останавливаем всплытие события
    vacancy.showResponseInput = true;
  };

  const handleClickOutside = event => {
    const elTarget = event.target;

    if (!isNewAppPopupAdmin.value && newApplication.value) {
      newApplication.value = {};
      errors.value = {};
    }
    data.value.forEach(vacancy => {
      if (vacancy.showResponseInput) {
        const element = document.querySelector(
          `[data-vacancy="${vacancy.title}"]`
        );
        if (element && !element.contains(event.target)) {
          // Если не было выбора, оставляем кнопку "Добавить"
          if (!vacancy.responseChoose) {
            vacancy.showResponseInput = false;
          } else {
            vacancy.showResponseInput = false;
          }
        }
      }
    });
  };

  const handleClickOutsideNewAppPopup = event => {
    if (
      responseContainer.value &&
      !responseContainer.value.contains(event.target)
    ) {
      if (!newResponse.value) {
        showNewResponse.value = false; // Закрываем input, если ничего не выбрано
      }
    }
  };

  const handleClickOutsideNewAppPopupResponsible = event => {
    if (
      responseContainerResponsible.value &&
      !responseContainerResponsible.value.contains(event.target)
    ) {
      if (!newResponseResponsible.value) {
        showNewResponseResponsible.value = false; // Закрываем input, если ничего не выбрано
      }
    }
  };

  const handleClickOutsideNewAppPopupExecutor = event => {
    if (
      executorContainer.value &&
      !executorContainer.value.contains(event.target)
    ) {
      if (!newExecutor.value.name) {
        showNewExecutor.value = false; // Закрываем input, если ничего не выбрано
      }
    }
  };

  const handleClickOutsideNewAppPopupCustomer = event => {
    if (
      customerContainer.value &&
      !customerContainer.value.contains(event.target)
    ) {
      if (!newCustomer.value.name) {
        showNewCustomer.value = false; // Закрываем input, если ничего не выбрано
      }
    }
  };

  const loadApplications = async (page = 1, params = '') => {
    loading.value = true;
    error.value = null;
    try {
      const {
        applications: fetchedApplications,
        pagination: fetchedPagination,
      } = await fetchApplications(page, params);
      applications.value = fetchedApplications;
      data.value = applications.value.map(vacancy => ({
        ...vacancy,
        responsible: vacancy.responsible,
        candidates: 0,
        showResponseInput: false,
        responseChoose: '',
        approvals: vacancy.approvals,
      }));
      pagination.value = fetchedPagination;
    } catch (err) {
      error.value = 'Ошибка загрузки заявок.';
      console.error(err);
    } finally {
      loading.value = false;
    }
  };

  const handlePageChange = async page => {
    pagination.value.current_page = page;
    await loadApplications(page);
  };

  onMounted(async () => {
    if (!userStore.role) {
      const { data, error: profileError } = await profile();
      if (!profileError && data?.data?.role?.name) {
        userStore.setUserData({
          name: data.data.name ?? userStore.name,
          email: data.data.email ?? userStore.email,
          role: data.data.role.name,
        });
        userRole.value = mapProfileRoleToApplicationsUserRole(data.data.role.name);
      }
    }

    document.addEventListener('click', handleClickOutside);
    document.addEventListener('click', handleClickOutsideNewAppPopup);
    document.addEventListener(
      'click',
      handleClickOutsideNewAppPopupResponsible
    );
    document.addEventListener('click', handleClickOutsideNewAppPopupExecutor);
    document.addEventListener('click', handleClickOutsideNewAppPopupCustomer);
    loadApplications();
  });

  onBeforeUnmount(() => {
    if (applicationToastTimer) {
      clearTimeout(applicationToastTimer);
      applicationToastTimer = null;
    }
    document.removeEventListener('click', handleClickOutside);
    document.removeEventListener('click', handleClickOutsideNewAppPopup);
    document.removeEventListener(
      'click',
      handleClickOutsideNewAppPopupResponsible
    );
    document.removeEventListener(
      'click',
      handleClickOutsideNewAppPopupExecutor
    );
    document.removeEventListener(
      'click',
      handleClickOutsideNewAppPopupCustomer
    );
  });

  onUnmounted(() => {
    if (resizeObserver) {
      resizeObserver.disconnect();
      resizeObserver = null;
    }
  });

  const updateResponseChoose = (vacancy, value) => {
    if (value) {
      vacancy.responseChoose = value;
      vacancy.showResponseInput = false;
    }
  };

  // popup's settings
  // config for control scroll
  function disableBodyScroll() {
    document.body.style.overflow = 'hidden'; // Отключаем прокрутку
  }

  function enableBodyScroll() {
    document.body.style.overflow = ''; // Включаем прокрутку
  }

  // const openNewResponse = event => {
  //   event.stopPropagation()
  //   showNewResponse.value = true
  // }

  // const updateNewResponse = value => {
  //   if (value) {
  //     newResponse.value = value
  //     showNewResponse.value = false
  //   }
  // }

  const openNewResponseResponsible = event => {
    event.stopPropagation();
    showNewResponseResponsible.value = true;
  };

  const openNewExecutor = event => {
    event.stopPropagation();
    showNewExecutor.value = true;
  };

  const openNewCustomer = event => {
    event.stopPropagation();
    showNewCustomer.value = true;
  };

  const updateNewResponseResponsible = value => {
    if (value) {
      newResponseResponsible.value = value;
      showNewResponseResponsible.value = false;
    }
  };

  function updateNewExecutor(value, id) {
    // сonsole.log('value executor ', value)
    if (value) {
      newExecutor.value.name = value;
      newExecutor.value.id = id;
      showNewExecutor.value = false;
      if (!newApplication.value.executor) {
        newApplication.value.executor = {};
      }
      newApplication.value.executor.id = id;
      newApplication.value.executor.name = value;
      // сonsole.log('newApplication.value.executor.id ', newApplication.value.executor.id)
    }
  }

  function updateNewResponsible(value, id) {
    if (value) {
      newExecutor.value.name = value;
      newExecutor.value.id = id;
      showNewExecutor.value = false;
      if (!newApplication.value.responsible) {
        newApplication.value.responsible = {};
      }
      newApplication.value.responsible.id = id;
      newApplication.value.responsible.name = value;
    }
  }

  function updateNewApplicationCurrency(value) {
    if (!newApplication.value) return;
    const opt = ArrayCurrency.find(
      c => c.value === value || c.id === value || c.name === value
    );
    newApplication.value.currency = opt?.name ?? value;
  }

  function updateNewDivision(value, id) {
    if (value && id != null) {
      newApplication.value.division = { id, name: value };
      return;
    }
    if (!value) {
      newApplication.value.division = null;
    }
  }

  const updateNewCustomer = (value, id) => {
    if (value) {
      newCustomer.value.name = value;
      newCustomer.value.id = id;
      showNewCustomer.value = false;
    }
  };

  const updateNewClient = (value, id) => {
    if (value) {
      newClient.value.name = value;
      newClient.value.id = id;
      showNewCustomer.value = false;
      if (!newApplication.value.client) {
        newApplication.value.client = {};
      }
      newApplication.value.client.id = id;
      newApplication.value.client.name = value;
    }
  };

  const closeNewApplicationPopup = () => {
    if (newApplication.value) {
      newApplication.value = {};
    }

    isNewAppPopupAdmin.value = false;
  };

  watch(selectedVacancy, newValue => {
    if (newValue) {
      // popup is opening
      nextTick(() => {
        if (tabContentInner.value) {
          let isInitialUpdate = true;
          resizeObserver = new ResizeObserver(() => {
            if (isInitialUpdate) {
              isInitialUpdate = false;
            } else {
              updateTabHeight();
            }
          });
          resizeObserver.observe(tabContentInner.value);
          updateTabHeight();
        } else {
          console.warn('tabContentInner is null after popup open');
        }
      });
    } else {
      // popup is closing
      if (resizeObserver) {
        resizeObserver.disconnect();
        resizeObserver = null;
      }
    }
  });

  // Следим за изменением выбранного таба и обновляем высоту
  watch(popupSelectedTab, () => {
    updateTabHeight();
  });

  const openPopup = async vacancy => {
    popupSelectedTab.value = 'popupMainInfo';
    try {
      const fullData = await fetchApplicationDetail(vacancy.id);

      detailedVacancy.value = fullData.data;
      const profileRoleName = userStore.role ?? '';
      isDelete.value = false;
      isAddApprove.value = false;
      if (isDeleteApplication.value) {
        isDeleteApplication.value = false;
      }
      if (
        detailedVacancy.value.status.name == 'На рассмотрении' &&
        canApproveOrRejectByProfile(profileRoleName)
      ) {
        isAddApprove.value = true;
      }

      selectedVacancy.value = vacancy;
    } catch (err) {
      console.error(err);
      showApplicationToastMessage(
        'Не удалось загрузить заявку. Попробуйте ещё раз.',
        'error'
      );
    }
  };

  const closePopup = () => {
    selectedVacancy.value = null;
    detailedVacancy.value = null;
  };

  const historyTabEvents = computed(() =>
    applicationHistoryFromDetail(detailedVacancy.value)
  );

  const formatDateTime = dateTime => {
    return {
      date: dayjs(dateTime).format('DD.MM.YYYY'),
      time: dayjs(dateTime).format('HH:mm'),
    };
  };

  function applicationViewText(value) {
    if (value == null || value === '') return '';
    if (typeof value === 'object' && value !== null && 'name' in value) {
      const name = value.name;
      return name != null && String(name).trim() !== ''
        ? String(name).trim()
        : '';
    }
    return String(value).trim();
  }

  function applicationViewDisplay(value) {
    return applicationViewText(value) || '—';
  }

  function applicationSalaryDisplay(app) {
    if (!app) return '—';
    const from = app.salaryFrom;
    const to = app.salaryTo;
    const cur = applicationViewText(app.currency);
    if (
      (from == null || from === '') &&
      (to == null || to === '') &&
      !cur
    ) {
      return '—';
    }
    const parts = [];
    if (from != null || to != null) {
      parts.push(`от ${from ?? '—'} до ${to ?? '—'}`);
    }
    if (cur) parts.push(cur);
    return parts.join(' ') || '—';
  }

  function applicationViewIsEmpty(value) {
    return !applicationViewText(value);
  }

  // const getStatusLabel = statusId => {
  //   console.log('Статус: ', statusId)
  //   const statusKey = Object.keys(statusWeights).find(
  //     key => statusWeights[key] === statusId
  //   )
  //   return statusKey ? statusLabels[statusKey] : 'Не указан'
  // }

  const validateForm = () => {
    const newErrors = {};

    if (!newApplication.value.responsible)
      newErrors.response = 'Укажите согласующего';
    if (!newApplication.value.position)
      newErrors.post = 'Укажите название вакансии';
    if (!newApplication.value.city) newErrors.location = 'Укажите город поиска';
    if (!newApplication.value.count || newApplication.value.count <= 0) {
      newErrors.positions = 'Укажите корректное количество позиций';
    }
    if (newApplication.value.salaryFrom && newApplication.value.salaryTo) {
      if (newApplication.value.salaryFrom > newApplication.value.salaryTo) {
        newErrors.salaryTo =
          'Максимальная зарплата должна быть больше минимальной';
      }
    }
    if (!newApplication.value.currency)
      newApplication.value.currency = currency[0]['name'];
    if (
      newApplication.value.reason == null ||
      newApplication.value.reason === ''
    ) {
      newErrors.reason = 'Укажите причину открытия вакансии';
    }

    errors.value = newErrors;

    return Object.keys(newErrors).length === 0; // Возвращаем true, если ошибок нет
  };

  function resolveApplicationReasonName(reason) {
    if (reason == null || reason === '') return '';
    if (typeof reason === 'object' && reason?.name) return String(reason.name);
    const options = reasonseForOpenVacancy.value || [];
    const found = options.find(
      o => o.value === reason || o.id === reason || o.name === reason
    );
    return found?.name ?? String(reason);
  }

  function buildApplicationCreatePayload() {
    const app = newApplication.value || {};
    const divisionRaw = app.division;
    const divisionName =
      typeof divisionRaw === 'object' && divisionRaw?.name
        ? String(divisionRaw.name).trim()
        : typeof divisionRaw === 'string'
          ? divisionRaw.trim()
          : '';

    const payload = {
      position: app.position,
      count: app.count,
      salaryFrom: app.salaryFrom,
      salaryTo: app.salaryTo,
      currency: app.currency,
      require: app.require,
      duty: app.duty,
      city: app.city,
      reason: resolveApplicationReasonName(app.reason),
      dateStart: app.dateStart,
      dateWork: app.dateWork,
      responsible: app.responsible?.id,
    };

    if (divisionName.length >= 3) {
      payload.division = divisionName;
    }
    if (app.vacancy?.id) payload.vacancy = app.vacancy.id;
    if (app.executor?.id) payload.executor = app.executor.id;
    if (app.client?.id) payload.client = app.client.id;

    return payload;
  }

  const createApplicationHandler = async () => {
    if (!validateForm()) {
      showApplicationToastMessage(
        'Заполните обязательные поля формы',
        'error'
      );
      return;
    }

    const { data, error } = await createApplication(
      buildApplicationCreatePayload()
    );
    if (!error) {
      isNewAppPopupAdmin.value = false;
      newApplication.value = {};
      errors.value = {};
      loadApplications();
      showApplicationToastMessage(
        'Заявка отправлена. Вы получите уведомление о ходе работы на почту'
      );
      return;
    }

    const message =
      error?.message ||
      error?.data?.message ||
      (typeof error === 'string' ? error : null) ||
      'Не удалось отправить заявку';
    showApplicationToastMessage(message, 'error');
    console.warn('createApplication error:', error, data);
  };

  const linkedApplicationVacancy = computed(
    () => detailedVacancy.value?.vacancy ?? null
  );

  const isRejectedApplicationOpen = computed(
    () =>
      !!detailedVacancy.value &&
      normalizeApplicationStatusKey(detailedVacancy.value?.status?.name) ===
        'rejected'
  );

  const rejectionReasonText = computed(() => {
    const approvals = detailedVacancy.value?.approvals;
    if (!Array.isArray(approvals)) return '';
    const withDescription = approvals.filter(a =>
      String(a?.description ?? '').trim()
    );
    const latest = withDescription[withDescription.length - 1];
    return String(latest?.description ?? '').trim();
  });

  const showReviewActionsFooter = computed(
    () =>
      !isCustomerRole.value &&
      !!detailedVacancy.value &&
      !!selectedVacancy.value &&
      normalizeApplicationStatusKey(detailedVacancy.value?.status?.name) ===
        'review' &&
      isAddApprove.value
  );

  const showCustomerViewFooter = computed(
    () =>
      isCustomerRole.value &&
      !!detailedVacancy.value &&
      !!selectedVacancy.value &&
      !showReviewActionsFooter.value &&
      !isRejectedApplicationOpen.value &&
      !showGoToVacancyFooter.value
  );

  const linkedApplicationVacancyId = computed(() => {
    const vacancy = detailedVacancy.value?.vacancy;
    if (vacancy?.id != null) return Number(vacancy.id);
    const rawId = detailedVacancy.value?.vacancy_id;
    if (rawId != null && rawId !== '') return Number(rawId);
    return null;
  });

  const showGoToVacancyFooter = computed(
    () =>
      !!detailedVacancy.value &&
      !!selectedVacancy.value &&
      normalizeApplicationStatusKey(detailedVacancy.value?.status?.name) ===
        'created' &&
      linkedApplicationVacancyId.value != null &&
      !Number.isNaN(linkedApplicationVacancyId.value)
  );

  function goToLinkedVacancy() {
    const vacancyId = linkedApplicationVacancyId.value;
    if (vacancyId == null || Number.isNaN(vacancyId)) {
      showApplicationToastMessage('Вакансия по этой заявке не найдена.', 'error');
      return;
    }
    closePopup();
    router.push(`/vacancies/${vacancyId}`);
  }

  const updateExecutor = () => {
    updateData.value.append('executor', id);
  };

  const handleRemoveApplication = async (item, vacancy) => {
    if (item === 'Удалить' && isCustomerRole.value) {
      return;
    }
    if (item === 'Копировать заявку' && isCustomerRole.value) {
      return;
    }
    if (item === 'Удалить') {
      openDeleteApplicationPopup(vacancy);
      return;
    }
    if (item === 'Копировать заявку') {
      await copyApplicationFromDetailById(vacancy.id);
    }
    if (item === 'Управлять') {
      openPopup(vacancy);
    }
  };

  const handlerUpdateApplication = async vacancy => {
    if (Object.keys(updateData.value).length > 0) {
      const { data, error } = await fetchApplicationUpdate(
        updateData.value,
        vacancy.id
      );
      updateData.value = {};
      loadApplications();
    }

    closePopup();
  };

  async function openNewApplicationPopupForRole() {
    await ensureFormDictionaries();
    if (userRole.value === 'admin') {
      void ensureYandexMapsScript();
      isNewAppPopupAdmin.value = true;
    } else if (userRole.value === 'responsible') {
      isNewAppPopupResponsible.value = true;
    } else if (userRole.value === 'customer') {
      isNewAppPopupCustomer.value = true;
    }
  }

  async function copyApplicationFromDetailById(applicationId) {
    await ensureFormDictionaries();
    const response = await fetchApplicationDetail(applicationId);
    const app = response?.data;
    if (!app) {
      showApplicationToastMessage(
        'Не удалось загрузить заявку для копирования.',
        'error'
      );
      return;
    }
    newApplication.value = mapApplicationDetailToNewForm(
      app,
      reasonseForOpenVacancy.value
    );
    openNewApplicationPopupForRole();
  }

  async function copyApplicationFromDetail() {
    if (!detailedVacancy.value) return;
    await ensureFormDictionaries();
    newApplication.value = mapApplicationDetailToNewForm(
      detailedVacancy.value,
      reasonseForOpenVacancy.value
    );
    closePopup();
    openNewApplicationPopupForRole();
  }

  const rejectApplication = () => {
    if (isCustomerRole.value) return;
    selectedVacancy.value = false;
    isNotApprove.value = true;
  };

  const sendReject = async reason => {
    const { data: message, error: errorResponse } = await reject(
      detailedVacancy.value.id,
      reason
    );
    if (!errorResponse) {
      if (errorReject.value) {
        errorReject.value = null;
      }
      isNotApprove.value = false;
      await handlePageChange(pagination.value.current_page);
    } else {
      errorReject.value = errorResponse;
    }
  };

  const addApprove = async () => {
    if (isCustomerRole.value) return;
    selectedVacancy.value = false;
    if (!linkedApplicationVacancy.value) {
      router.push(
        `/vacancies/newvacancy/?application=${detailedVacancy.value.id}`
      );
    } else {
      const idApplication = detailedVacancy.value.id;
      handlerUpdateApplication(detailedVacancy.value);
      await approve(idApplication);
      loadApplications();
    }
  };
</script>

<style scoped>
  .header-wrapper {
    grid-template-columns: 14.01% 14.01% 10.485% 10.662% 13.128% 14.01% 14.01% 3.525%;
  }

  .items-wrapper {
    grid-template-columns: 13.833% 13.833% 10.485% 10.662% 13.833% 13.833% 13.833% 3.525%;
  }

  /* Анимация появления и скрытия */
  .fade-enter-active,
  .fade-leave-active {
    transition: opacity 0.3s ease;
  }

  .fade-enter-from,
  .fade-leave-to {
    opacity: 0;
  }

  .fade-leave-from {
    opacity: 1;
  }
  .text-red-500 {
    --tw-text-opacity: 1;
    color: rgb(239 68 68 / var(--tw-text-opacity, 1));
  }
  .text-green-500 {
    --tw-text-opacity: 1;
    color: rgb(73 145 73 / var(--tw-text-opacity, 1));
  }

  .application-view-label {
    margin-bottom: 5px;
    font-size: 14px;
    font-weight: 500;
    line-height: normal;
    color: #2f353d;
  }

  .application-view-value {
    font-size: 14px;
    font-weight: 400;
    line-height: normal;
    color: #79869a;
  }

  .application-view-value--multiline {
    white-space: pre-wrap;
  }

  .application-view-value--empty {
    color: #9098b4;
  }

  .application-rejection-block__title {
    margin-bottom: 10px;
    font-size: 14px;
    font-weight: 600;
    line-height: 1.4;
    color: #212936;
  }

  .application-rejection-alert {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    border-radius: 10px;
    padding: 12px 14px;
  }

  .application-rejection-alert + .application-rejection-alert {
    margin-top: 8px;
  }

  .application-rejection-alert--reason {
    background: #fdeced;
  }

  .application-rejection-alert--info {
    background: #eaf4fd;
  }

  .application-rejection-alert__icon {
    display: flex;
    flex-shrink: 0;
    align-items: center;
    justify-content: center;
    width: 22px;
    height: 22px;
    border-radius: 9999px;
    color: #fff;
  }

  .application-rejection-alert__icon--reason {
    background: #e85c5c;
  }

  .application-rejection-alert__icon--info {
    background: #5898ff;
  }

  .application-rejection-alert__icon svg {
    display: block;
  }

  .application-rejection-alert__text {
    margin: 0;
    padding-top: 1px;
    font-size: 14px;
    font-weight: 400;
    line-height: 1.45;
    color: #212936;
  }
</style>

<style>
  .fields-tab-error-toast {
    background-color: #fce7f3 !important;
    border: none !important;
    color: #212936 !important;
    -webkit-backdrop-filter: none !important;
    backdrop-filter: none !important;
  }
  .fields-tab-success-toast {
    background-color: #ffffff !important;
    border: none !important;
    color: #212936 !important;
    -webkit-backdrop-filter: none !important;
    backdrop-filter: none !important;
  }
  .fields-tab-toast-fade-enter-active,
  .fields-tab-toast-fade-leave-active {
    transition: opacity 0.3s ease;
  }
  .fields-tab-toast-fade-enter-from,
  .fields-tab-toast-fade-leave-to {
    opacity: 0;
  }
</style>
