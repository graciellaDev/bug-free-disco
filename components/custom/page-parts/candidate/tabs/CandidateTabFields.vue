<script setup lang="ts">
import { useCandidateCardContext } from '@/components/custom/page-parts/candidate/candidateCardContext'
const c = useCandidateCardContext()
</script>

<template>
        <div
          class="fields-tab-block mb-px rounded-b-fifteen bg-white py-25px px-30px"
        >
          <div class="mb-22px">
            <p class="text-lg font-bold leading-normal text-space">
              Системные поля
            </p>
          </div>
          <div class="fields-tab-line mb-5">
            <span class="fields-tab-line__label text-sm font-normal text-bali">
              Источник
            </span>
            <span class="fields-tab-line__dots" aria-hidden="true" />
            <div class="fields-tab-line__value">
              <PlainSingleSelectDropdown
                :model-value="c.props.candidate.source || ''"
                :options="c.CANDIDATE_SOURCE_OPTIONS"
                placeholder="Выбрать"
                :disabled="c.sourceFieldSaving"
                @update:model-value="c.handleSourceFieldUpdate"
              />
          </div>
          </div>
          <div class="fields-tab-line mb-5">
            <span class="fields-tab-line__label text-sm font-normal text-bali">
              Рекрутеры
            </span>
            <span class="fields-tab-line__dots" aria-hidden="true" />
            <div class="fields-tab-line__value">
              <PlainMultiSelectDropdown
                :model-value="c.recruiterIdsEdit"
                :options="c.recruiterOptions"
                placeholder="Выбрать"
                :disabled="c.recruiterFieldSaving || c.recruitersListLoading"
                @update:model-value="c.onRecruitersModelUpdate"
              />
            </div>
          </div>
          <div class="fields-tab-line mb-5">
            <span class="fields-tab-line__label text-sm font-normal text-bali">
              Тип отклика
            </span>
            <span class="fields-tab-line__dots" aria-hidden="true" />
            <div class="fields-tab-line__value">
              <PlainSingleSelectDropdown
                :model-value="
                  (c.props.candidate.response_type || '').trim() === ''
                    ? 'Не указан'
                    : c.props.candidate.response_type || ''
                "
                :options="c.CANDIDATE_RESPONSE_TYPE_OPTIONS"
                placeholder="Выбрать"
                :disabled="c.responseTypeFieldSaving"
                @update:model-value="c.handleResponseTypeFieldUpdate"
              />
            </div>
          </div>
          <div class="fields-tab-line mb-5">
            <span class="fields-tab-line__label text-sm font-normal text-bali">
              Причина отказа
            </span>
            <span class="fields-tab-line__dots" aria-hidden="true" />
            <div class="fields-tab-line__value">
              <PlainSingleSelectDropdown
                :model-value="c.props.candidate.rejection_reason?.name?.trim() || ''"
                :options="c.rejectionReasonOptions"
                placeholder="Выбрать"
                :disabled="
                  c.rejectionReasonFieldSaving || c.rejectionReasonsLoading
                "
                @update:model-value="c.handleRejectionReasonFieldUpdate"
              />
            </div>
          </div>
          <div class="mb-22px mt-30px">
            <p class="text-lg font-bold leading-normal text-space">
              Информация
            </p>
          </div>
          <div class="fields-tab-line mb-5">
            <span class="fields-tab-line__label text-sm font-normal text-bali">
              Фамилия
            </span>
            <PlainInlineTextInput
              v-model="c.surnameEdit"
              leader-full-width
              placeholder=""
              autocomplete="family-name"
              :disabled="c.nameFieldsSaving"
              @blur="c.flushNameFieldsFromBlur"
            />
          </div>
          <div class="fields-tab-line mb-5">
            <span class="fields-tab-line__label text-sm font-normal text-bali">
              Имя
            </span>
            <PlainInlineTextInput
              v-model="c.firstnameEdit"
              leader-full-width
              placeholder=""
              autocomplete="given-name"
              :disabled="c.nameFieldsSaving"
              @blur="c.flushNameFieldsFromBlur"
            />
          </div>
          <div class="fields-tab-line mb-5">
            <span class="fields-tab-line__label text-sm font-normal text-bali">
              Отчество
            </span>
            <PlainInlineTextInput
              v-model="c.patronymicEdit"
              leader-full-width
              placeholder=""
              autocomplete="additional-name"
              :disabled="c.nameFieldsSaving"
              @blur="c.flushNameFieldsFromBlur"
            />
          </div>
          <div class="fields-tab-line mb-5">
            <span
              class="fields-tab-line__label text-sm font-normal transition-colors duration-150"
              :class="c.emailLineError ? 'text-[#ef4444]' : 'text-bali'"
            >
              Электронная почта
            </span>
            <PlainInlineTextInput
              v-model="c.emailEdit"
              leader-full-width
              :line-error="c.emailLineError"
              type="email"
              placeholder=""
              autocomplete="email"
              :disabled="c.emailFieldSaving"
              @blur="c.flushEmailFromBlur"
            />
          </div>
          <div class="fields-tab-line mb-5">
            <span class="fields-tab-line__label text-sm font-normal text-bali">
              Дата рождения
            </span>
            <PlainDateSelectDropdown
              :model-value="c.birthDateEdit"
              :disabled="c.birthDateFieldSaving"
              @update:model-value="c.handleBirthDateFieldUpdate"
            />
          </div>
          <div class="fields-tab-line mb-5">
            <span
              class="fields-tab-line__label text-sm font-normal transition-colors duration-150"
              :class="c.phoneLineError ? 'text-[#ef4444]' : 'text-bali'"
            >
              Телефон
            </span>
            <PlainInlineTextInput
              v-model="c.phoneEdit"
              leader-full-width
              :line-error="c.phoneLineError"
              type="tel"
              placeholder=""
              autocomplete="tel"
              :disabled="c.phoneFieldSaving"
              @blur="c.flushPhoneFromBlur"
            />
          </div>
          <div class="fields-tab-line mb-5">
            <span class="fields-tab-line__label text-sm font-normal text-bali">
              Город
            </span>
            <PlainInlineTextInput
              v-model="c.cityEdit"
              leader-full-width
              type="text"
              placeholder=""
              autocomplete="address-level2"
              :disabled="c.cityFieldSaving"
              @blur="c.flushCityFromBlur"
            />
          </div>
          <div class="fields-tab-line mb-5">
            <span class="fields-tab-line__label text-sm font-normal text-bali">
              Гражданство
            </span>
            <PlainInlineTextInput
              v-model="c.citizenshipEdit"
              leader-full-width
              type="text"
              placeholder=""
              autocomplete="off"
              :disabled="c.citizenshipFieldSaving"
              @blur="c.flushCitizenshipFromBlur"
            />
          </div>
          <div class="fields-tab-line">
            <span class="fields-tab-line__label text-sm font-normal text-bali">
              Желаемая зарплата
            </span>
            <PlainInlineTextInput
              v-model="c.salaryDesiredEdit"
              leader-full-width
              digits-only
              type="text"
              placeholder=""
              autocomplete="off"
              :disabled="c.salaryFieldSaving"
              @blur="c.flushSalaryDesiredFromBlur"
            />
          </div>
          <div
            class="mb-22px mt-30px flex min-w-0 flex-wrap items-center justify-between gap-x-3 gap-y-2"
          >
            <p
              class="min-w-0 pr-2 text-lg font-bold leading-normal text-space"
            >
              Пользовательские поля
            </p>
            <div
              v-if="c.localCandidateCustomFields.length > 0"
              class="flex shrink-0 items-center gap-3"
            >
              <button
                v-if="!c.isLocalCustomFieldsLayoutEditMode"
                type="button"
                class="inline-flex items-center gap-1.5 border-0 bg-transparent p-0 text-[13px] font-normal leading-normal text-dodger transition-opacity hover:opacity-85"
                @click="c.isLocalCustomFieldsLayoutEditMode = true"
              >
                <svg
                  class="local-cf-header-stroke-icon shrink-0"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2.4"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  aria-hidden="true"
                >
                  <path
                    d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"
                  />
                  <circle cx="12" cy="12" r="3" />
                </svg>
                Настроить
              </button>
              <button
                v-else
                type="button"
                class="inline-flex items-center gap-1.5 border-0 bg-transparent p-0 text-[13px] font-normal leading-normal text-dodger transition-opacity hover:opacity-85"
                @click="c.finishLocalCustomFieldsLayoutEdit"
              >
                <svg
                  class="local-cf-header-stroke-icon shrink-0"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2.4"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  aria-hidden="true"
                >
                  <path
                    d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"
                  />
                  <path d="M17 21v-8H7v8" />
                  <path d="M7 3v8h8" />
                </svg>
                Сохранить
              </button>
          </div>
          </div>
          <!-- Старый вывод customFields с API (только текст) — не показываем вместе с полями аккаунта с сервера, иначе дубль -->
          <template
            v-if="
              c.candidateCustomFieldRows.length && !c.serverAccountCustomFieldsReady
            "
          >
            <div
              v-for="row in c.candidateCustomFieldRows"
              :key="'api-cf-' + row.id"
              :class="[
                'fields-tab-line mb-5',
                c.localCandidateCustomFields.length > 0 &&
                  c.isLocalCustomFieldsLayoutEditMode &&
                  'fields-tab-line--cf-pencil-gap',
              ]"
            >
              <span class="fields-tab-line__label text-sm font-normal text-bali">
                {{ row.label }}
              </span>
              <span class="fields-tab-line__dots" aria-hidden="true" />
              <p
                class="fields-tab-line__value fields-tab-line__value--truncate text-sm font-normal leading-150 text-slate-custom"
              >
                {{ row.text }}
            </p>
          </div>
          </template>
          <ClientOnly>
            <draggable
              v-if="c.isLocalCustomFieldsLayoutEditMode"
              v-model="c.localCandidateCustomFields"
              item-key="localId"
              :animation="200"
              easing="cubic-bezier(0.25, 1, 0.5, 1)"
              ghost-class="local-cf-sortable-ghost"
              chosen-class="local-cf-sortable-chosen"
              drag-class="local-cf-sortable-drag"
              :filter="c.LOCAL_CF_SORTABLE_FILTER"
              :prevent-on-filter="false"
            >
              <template #item="{ element }">
                <CandidateLocalCustomFieldRow
                  :key="element.localId"
                  :field="element"
                  :layout-edit-mode="true"
                  @edit="c.openEditLocalCustomField"
                  @delete-request="c.onLocalCustomFieldDeleteRequest"
                />
              </template>
            </draggable>
            <template v-else>
              <CandidateLocalCustomFieldRow
                v-for="field in c.localCandidateCustomFields"
                :key="field.localId"
                :field="field"
                :layout-edit-mode="false"
                @edit="c.openEditLocalCustomField"
                @delete-request="c.onLocalCustomFieldDeleteRequest"
              />
            </template>
            <template #c.fallback>
              <CandidateLocalCustomFieldRow
                v-for="field in c.localCandidateCustomFields"
                :key="field.localId"
                :field="field"
                :layout-edit-mode="false"
                @edit="c.openEditLocalCustomField"
                @delete-request="c.onLocalCustomFieldDeleteRequest"
              />
            </template>
          </ClientOnly>
          <button
            type="button"
            class="inline-flex items-center gap-1.5 text-dodger transition-opacity hover:opacity-85"
            :class="c.hasAnyCustomFields ? 'mt-2' : ''"
            @click="c.isAddCustomFieldPopupOpen = true"
          >
            <span
              class="inline-flex h-[16.25px] w-[16.25px] shrink-0 items-center justify-center rounded-full bg-dodger text-white"
              aria-hidden="true"
            >
              <svg
                class="block h-[8.125px] w-[8.125px]"
                viewBox="0 0 12 12"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M6 2.25v7.5M2.25 6h7.5"
                  stroke="currentColor"
                  stroke-width="1.5"
                  stroke-linecap="round"
                />
              </svg>
            </span>
            <span class="text-[13px] font-normal leading-normal">
              Добавить
            </span>
          </button>
          </div>
        <!-- Секция «Информация» скрыта по макету
        <div class="bg-white p-25px pl-30px">
          <div class="mb-26px flex items-center">
            <p class="mr-2.5 text-lg font-bold leading-normal text-space">
              Информация
            </p>
            <span
              class="h-fit rounded-fifteen bg-athens-gray px-2.5 py-[3.5px] text-xs font-normal"
            >
              Используется в системе
            </span>
          </div>
          <div class="flex items-center gap-2.5">
            <p class="min-w-[240px] text-sm font-normal text-space">Разряд</p>
            <MinDropdownSecond :options="c.positions" v-model="c.newPosition" />
          </div>
          <div class="mb-0.5 flex items-center gap-2.5">
            <p class="min-w-[240px] text-sm font-normal text-space">Раз</p>
            <MyInputSecond v-model="c.newCustomFirst" />
          </div>
          <div class="mb-0.5 flex items-center gap-2.5">
            <p class="min-w-[240px] text-sm font-normal text-space">Два</p>
            <MyInputSecond v-model="c.newCustomSecond" />
          </div>
          <div class="flex items-center gap-2.5">
            <p class="min-w-[240px] text-sm font-normal text-space">Три</p>
            <MyInputSecond v-model="c.newCustomThird" />
          </div>
          <div
                v-for="(q, idx) in c.questions"
                :key="q.id"
                class="flex items-center gap-2.5"
              >
                <div v-if="q.type === 'Поле для ввода в одну строку'">
                  <p class="mb-15px text-sm font-medium leading-150 text-space">
                    {{ q.title }}
                  </p>
                  <MyInput
                    :placeholder="'Введите ваш ответ'"
                    v-model="c.answers[idx]"
                  />
                </div>
                <div v-if="q.type === 'Поле для ввода в несколько строк'">
                  <p class="mb-15px text-sm font-medium leading-150 text-space">
                    {{ q.title }}
                  </p>
                  <MyTextarea
                    :maxHeight="100"
                    :placeholder="'Введите ваш ответ'"
                    v-model="c.answers[idx]"
                  />
                </div>
                <div v-if="q.type === 'Выпадающий список (один выбор)'">
                  <p class="mb-15px text-sm font-medium leading-150 text-space">
                    {{ q.title }}
                  </p>
                  <MyDropdown
                    :defaultValue="'Выберите вариант ответа'"
                    :options="q.options"
                    v-model="c.answers[idx]"
                  />
                </div>
                <div
                  v-if="q.type === 'Мультисписок (вопрос с вариантами ответа)'"
                >
                  <p class="mb-15px text-sm font-medium leading-150 text-space">
                    {{ q.title }}
                  </p>
                  <MultiSelect :options="q.options" v-model="c.answers[idx]" />
                </div>
                <div v-if="q.type === 'Время (выбор времени)'">
                  <p class="mb-15px text-sm font-medium leading-150 text-space">
                    {{ q.title }}
                  </p>
                  <ChooseTime v-model="c.answers[idx]" />
                </div>
                <div v-if="q.type === 'Дата (выбор даты)'">
                  <p class="mb-15px text-sm font-medium leading-150 text-space">
                    {{ q.title }}
                  </p>
                  <DropdownCalendarStatic
                    :is-open="isOpenDate"
                    @isOpen="isOpenCalendar"
                    v-model="c.answers[idx]"
                  />
                </div>
                <div v-if="q.type === 'Дата (срок)'">
                  <p class="mb-15px text-sm font-medium leading-150 text-space">
                    {{ q.title }}
                  </p>
                  <div class="flex gap-x-15px">
                    <DropdownCalendarStatic
                      :is-open="isOpenDateFrom"
                      @isOpen="isOpenCalendarFrom"
                      v-model="c.answers[idx + '_from']"
                      :dateFrom="true"
                    />
                    <DropdownCalendarStatic
                      :is-open="isOpenDateTo"
                      @isOpen="isOpenCalendarTo"
                      v-model="c.answers[idx + '_to']"
                      :dateTo="true"
                    />
                  </div>
                </div>
                <div v-if="q.type === 'Ссылка'">
                  <p class="mb-15px text-sm font-medium leading-150 text-space">
                    {{ q.title }}
                  </p>
                  <MyInput :placeholder="'https://'" v-model="c.answers[idx]" />
                </div>
                <div v-if="q.type === 'Адрес'">
                  <p class="mb-15px text-sm font-medium leading-150 text-space">
                    {{ q.title }}
                  </p>
                  <geo-input v-model="c.answers[idx]" />
                </div>
                <div v-if="q.type === 'Файл'">
                  <p class="mb-15px text-sm font-medium leading-150 text-space">
                    {{ q.title }}
                  </p>
                  <InputUpload v-model="c.answers[idx]" :minStyle="true" />
                </div>
                <div v-if="q.type === 'Чекбокс'">
                  <p class="mb-15px text-sm font-medium leading-150 text-space">
                    {{ q.title }}
                  </p>
                  <div class="[&>*:not(:last-child)]:mb-2.5">
                    <CheckboxGroup
                      :options="
                        q.options.map(opt => ({ c.label: opt, value: opt }))
                      "
                      v-model="c.answers[idx]"
                    />
                  </div>
                </div>
              </div>
          <button class="mt-25px flex items-center gap-x-5px">
            <MoreQuestions
              v-model:modelValue="c.questions"
              texButton="Добавить"
            />
          </button>
        </div>
        <div class="rounded-b-fifteen bg-white px-15px pb-25px">
          <div>
            <UiButton class="mr-15px" variant="semiaction" size="semiaction">
              Сохранить изменения
            </UiButton>
            <UiButton variant="back" size="back">Отмена</UiButton>
          </div>
        </div>
        -->
</template>
